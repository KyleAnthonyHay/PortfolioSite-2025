'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ConversationMessage } from '@/lib/chat-events';
import type { CallEndReason, CallPhase, CallWarning } from './types';

/**
 * One voice call: microphone, WebRTC to GPT-Live through our server, the
 * data channel's transcripts and delegations, and the server's clock.
 *
 * The countdown on the card is only a display. The server fixed the deadline
 * when the call connected and closes the call itself at that instant; the
 * heartbeat is how this tab learns the server ended it.
 */

const HEARTBEAT_MS = 10_000;
const MAX_RECONNECTS = 2;
/** Give a brief network blip this long to recover by itself before reconnecting. */
const DISCONNECT_GRACE_MS = 4_000;
const WARNING_SHOW_MS = 9_000;
/** delegation.created can land a beat before the last words of the question are transcribed. */
const TRANSCRIPT_SETTLE_MS = 450;

export interface Delegation {
  sessionId: string;
  delegationId: string;
  /** What the visitor said since the last hand-off. */
  text: string;
}

interface Handlers {
  /** Recent typed and spoken turns, to seed the voice model. */
  history: () => ConversationMessage[];
  /** A piece of the visitor's speech, as it is transcribed. */
  onUserSpeech: (delta: string) => void;
  /** The voice's own words (small talk, or reading an answer). */
  onAssistantSpeech: (delta: string) => void;
  /** The voice is handing the visitor's request to the agent; its question follows in onDelegation. */
  onHandOff: () => void;
  /** The voice handed a request to the agent. */
  onDelegation: (delegation: Delegation) => void;
  onEnded: (summary: { durationMs: number; reason: CallEndReason }) => void;
  /** A short message for the visitor when a call can't start. */
  onNotice: (message: string) => void;
}

type StartError = { error?: string; resetAt?: number };

const clock = () => Date.now();

function untilReset(resetAt?: number): string {
  if (!resetAt) return 'tomorrow';
  return `at ${new Date(resetAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function useVoiceCall(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<CallPhase>('connecting');
  const [muted, setMuted] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const [warning, setWarning] = useState<CallWarning | null>(null);

  const sessionRef = useRef<string | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const micRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  /** The time this tab had when the call first connected; a call can't run longer. */
  const allowanceAtStartRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const reconnectsRef = useRef(0);
  const endingRef = useRef(false);
  const userBufferRef = useRef('');
  const speakingTimerRef = useRef<number | null>(null);
  const disconnectTimerRef = useRef<number | null>(null);
  const warnedRef = useRef<{ five: boolean; one: boolean }>({ five: false, one: false });
  const mutedRef = useRef(false);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearInterval(t));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
  };

  const closePeer = () => {
    try {
      dcRef.current?.close();
    } catch {
      // Already closed.
    }
    try {
      pcRef.current?.close();
    } catch {
      // Already closed.
    }
    dcRef.current = null;
    pcRef.current = null;
  };

  const post = (body: Record<string, unknown>) =>
    fetch('/api/voice', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), keepalive: true });

  /** Tear everything down and leave the "Call ended" entry. Safe to call twice. */
  const finish = useCallback((reason: CallEndReason, notify = true) => {
    if (endingRef.current) return;
    const sessionId = sessionRef.current;
    const connectedAt = connectedAtRef.current;
    endingRef.current = true;
    clearTimers();
    try {
      dcRef.current?.send(JSON.stringify({ type: 'session.close' }));
    } catch {
      // Channel already gone; the server closes the provider session anyway.
    }
    closePeer();
    micRef.current?.getTracks().forEach((track) => track.stop());
    micRef.current = null;
    if (audioRef.current) audioRef.current.srcObject = null;
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    if (sessionId) void post({ action: 'end', sessionId, reason }).catch(() => {});
    sessionRef.current = null;
    deadlineRef.current = null;
    connectedAtRef.current = null;
    setActive(false);
    setWarning(null);
    setLevel(0);
    setRemainingMs(null);
    const allowed = allowanceAtStartRef.current ?? Infinity;
    allowanceAtStartRef.current = null;
    if (notify && connectedAt) handlersRef.current.onEnded({ durationMs: Math.min(Date.now() - connectedAt, allowed), reason });
  }, []);

  const meterRemoteAudio = (stream: MediaStream) => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (t: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (t - last < 66) return;
        last = t;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) sum += ((value - 128) / 128) ** 2;
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 4));
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // No Web Audio: the ring just stays still.
    }
  };

  const onEvent = (raw: string) => {
    let event: { type?: string; delta?: string; delegation?: { id?: string; target?: string } };
    try {
      event = JSON.parse(raw);
    } catch {
      return;
    }
    switch (event.type) {
      case 'session.started':
        setPhase('listening');
        break;
      case 'session.input_transcript.delta': {
        const delta = String(event.delta ?? '');
        userBufferRef.current += delta;
        handlersRef.current.onUserSpeech(delta);
        break;
      }
      case 'session.output_transcript.delta':
        setPhase('speaking');
        handlersRef.current.onAssistantSpeech(String(event.delta ?? ''));
        if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
        speakingTimerRef.current = window.setTimeout(() => setPhase((p) => (p === 'speaking' ? 'listening' : p)), 1600);
        break;
      case 'session.delegation.created': {
        const delegationId = event.delegation?.id;
        const sessionId = sessionRef.current;
        if (!delegationId || !sessionId || (event.delegation?.target && event.delegation.target !== 'client')) break;
        setPhase('working');
        handlersRef.current.onHandOff();
        window.setTimeout(() => {
          const text = userBufferRef.current.trim();
          userBufferRef.current = '';
          handlersRef.current.onDelegation({ sessionId, delegationId, text });
        }, TRANSCRIPT_SETTLE_MS);
        break;
      }
      case 'session.closed':
        if (!endingRef.current) void learnWhyClosed();
        break;
      default:
        break;
    }
  };

  /** The provider closed the call without us asking: the server's cutoff, or a failure. */
  const learnWhyClosed = async () => {
    const sessionId = sessionRef.current;
    let reason: CallEndReason = 'dropped';
    try {
      const response = await post({ action: 'heartbeat', sessionId });
      const state = (await response.json()) as { status?: string; remainingMs?: number; closeReason?: string };
      if (state.closeReason === 'limit' || (state.remainingMs ?? 1) <= 1000) reason = 'limit';
    } catch {
      // Treat as a drop.
    }
    finish(reason);
  };

  /** Offer, server-side session creation, answer. `replace` carries usage over on a reconnect. */
  const connect = async (replace?: string): Promise<boolean> => {
    const mic = micRef.current;
    if (!mic) return false;
    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    mic.getAudioTracks().forEach((track) => pc.addTrack(track, mic));
    pc.ontrack = (event) => {
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      audio.autoplay = true;
      audio.srcObject = event.streams[0];
      void audio.play().catch(() => {});
      meterRemoteAudio(event.streams[0]);
    };
    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;
    dc.onmessage = (event) => onEvent(String(event.data));
    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc || endingRef.current) return;
      const state = pc.connectionState;
      if (state === 'connected') {
        if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
        setPhase((p) => (p === 'reconnecting' || p === 'connecting' ? 'listening' : p));
      } else if (state === 'failed' || state === 'disconnected') {
        setPhase('reconnecting');
        if (disconnectTimerRef.current) return;
        disconnectTimerRef.current = window.setTimeout(() => {
          disconnectTimerRef.current = null;
          if (pcRef.current === pc && pc.connectionState !== 'connected') void reconnect();
        }, state === 'failed' ? 0 : DISCONNECT_GRACE_MS);
      }
    };

    await pc.setLocalDescription(await pc.createOffer());
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const timer = window.setTimeout(resolve, 2000);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          window.clearTimeout(timer);
          resolve();
        }
      });
    });

    const response = await post({ action: 'start', sdp: pc.localDescription?.sdp, history: handlersRef.current.history(), replace });
    const data = (await response.json().catch(() => ({}))) as StartError & { sessionId?: string; sdp?: string; deadline?: number; serverNow?: number };
    if (!response.ok || !data.sessionId || !data.sdp || !data.deadline) {
      closePeer();
      if (data.error === 'VOICE_BUSY') handlersRef.current.onNotice('A call is already running in another tab or window. Hang up there to call from here.');
      else if (data.error === 'VOICE_NO_TIME') handlersRef.current.onNotice(`Today's ten minutes of voice are used up. They reset ${untilReset(data.resetAt)}, and you can keep typing until then.`);
      else handlersRef.current.onNotice("Voice isn't available right now. You can keep typing.");
      return false;
    }
    sessionRef.current = data.sessionId;
    // The server's deadline in this tab's clock.
    const now = clock();
    deadlineRef.current = data.deadline - ((data.serverNow ?? now) - now);
    if (connectedAtRef.current === null) {
      connectedAtRef.current = now;
      allowanceAtStartRef.current = deadlineRef.current - now;
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    return true;
  };

  const reconnect = async () => {
    if (endingRef.current) return;
    if (reconnectsRef.current >= MAX_RECONNECTS) return finish('dropped');
    reconnectsRef.current += 1;
    setPhase('reconnecting');
    const previous = sessionRef.current ?? undefined;
    closePeer();
    try {
      const ok = await connect(previous);
      if (!ok) finish('dropped');
    } catch {
      finish('dropped');
    }
  };

  const tick = () => {
    const deadline = deadlineRef.current;
    if (!deadline || endingRef.current) return;
    const left = deadline - Date.now();
    setRemainingMs(Math.max(0, left));
    const show = (kind: CallWarning) => {
      setWarning(kind);
      window.setTimeout(() => setWarning((w) => (w === kind ? null : w)), WARNING_SHOW_MS);
    };
    if (!warnedRef.current.five && left <= 5 * 60_000 && left > 60_000) {
      warnedRef.current.five = true;
      show('five');
    }
    if (!warnedRef.current.one && left <= 60_000 && left > 0) {
      warnedRef.current.one = true;
      show('one');
    }
    // The server closes the call at the deadline; stop here too, a moment later, if its close hasn't arrived.
    if (left <= -2_000) finish('limit');
  };

  const heartbeat = async () => {
    const sessionId = sessionRef.current;
    if (!sessionId || endingRef.current) return;
    try {
      const response = await post({ action: 'heartbeat', sessionId });
      if (response.status === 404) return finish('dropped');
      const state = (await response.json()) as { status?: string; deadline?: number | null; serverNow?: number; closeReason?: string | null };
      if (sessionRef.current !== sessionId) return;
      if (state.deadline && state.serverNow) deadlineRef.current = state.deadline - (state.serverNow - Date.now());
      if (state.status === 'closed' && state.closeReason !== 'reconnected') finish(state.closeReason === 'limit' ? 'limit' : 'dropped');
    } catch {
      // A missed heartbeat is fine; the server only gives up after a minute of them.
    }
  };

  const start = useCallback(async () => {
    if (active) return;
    endingRef.current = false;
    reconnectsRef.current = 0;
    warnedRef.current = { five: false, one: false };
    userBufferRef.current = '';
    setMuted(false);
    mutedRef.current = false;
    setPhase('connecting');
    setRemainingMs(null);

    // Unlock audio playback inside the tap, before any await.
    audioRef.current ??= new Audio();
    void audioRef.current.play().catch(() => {});

    try {
      micRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    } catch (error) {
      const name = (error as DOMException)?.name;
      handlersRef.current.onNotice(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone access is blocked. Allow it for this site in your browser settings to talk, or keep typing.'
          : name === 'NotFoundError'
            ? 'No microphone was found. You can keep typing.'
            : "The microphone couldn't start. You can keep typing."
      );
      return;
    }

    setActive(true);
    try {
      const ok = await connect();
      if (!ok) {
        endingRef.current = true;
        micRef.current?.getTracks().forEach((track) => track.stop());
        micRef.current = null;
        setActive(false);
        return;
      }
    } catch (error) {
      console.error('voice: could not connect', error);
      handlersRef.current.onNotice("The call couldn't connect. You can keep typing.");
      finish('error', false);
      return;
    }
    timersRef.current.push(window.setInterval(tick, 250));
    timersRef.current.push(window.setInterval(() => void heartbeat(), HEARTBEAT_MS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, finish]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    micRef.current?.getAudioTracks().forEach((track) => (track.enabled = !next));
  }, []);

  const hangUp = useCallback(() => {
    setPhase('ending');
    finish('hung_up');
  }, [finish]);

  // Closing or reloading the tab ends the call and charges it now, not a minute later.
  useEffect(() => {
    const onHide = () => {
      const sessionId = sessionRef.current;
      if (!sessionId) return;
      navigator.sendBeacon('/api/voice', JSON.stringify({ action: 'end', sessionId, reason: 'page_closed' }));
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
    };
  }, []);

  // Leaving the chat page mid-call hangs up.
  useEffect(() => () => finish('hung_up', false), [finish]);

  return {
    active,
    phase,
    muted,
    remainingMs,
    level,
    warning,
    sessionId: () => sessionRef.current,
    dismissWarning: () => setWarning(null),
    start,
    toggleMute,
    hangUp,
  };
}
