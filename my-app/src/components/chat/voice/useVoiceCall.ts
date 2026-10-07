'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ConversationMessage } from '@/lib/chat-events';
import { callLog, callLogEnabled } from './callLog';
import { playCue, primeCues } from './cues';
import type { CallEndReason, CallPhase, CallWarning } from './types';

/**
 * One voice call: microphone, WebRTC to GPT-Live through our server, the
 * data channel's transcripts and delegations, and the server's clock.
 *
 * The countdown on the card is only a display. The server fixed the deadline
 * when the call connected and closes the call itself at that instant; the
 * heartbeat is how this tab learns the server ended it.
 *
 * Everything the call does is written to the call log (callLog.ts) when it
 * is on, so a call that misbehaves can be read back afterwards.
 */

const HEARTBEAT_MS = 10_000;
const MAX_RECONNECTS = 2;
/** Give a brief network blip this long to recover by itself before reconnecting. */
const DISCONNECT_GRACE_MS = 4_000;
const WARNING_SHOW_MS = 9_000;
/** delegation.created can land a beat before the last words of the question are transcribed. */
const TRANSCRIPT_SETTLE_MS = 450;
/** How long after the last transcript delta, with no sound from the agent, "Speaking" becomes "Listening". */
const SPEAKING_HOLD_MS = 1_600;
/** Transport stats go in the log this often. */
const STATS_MS = 5_000;
/** Remote audio below this is silence for the gap log; a gap shorter than the window is normal phrasing. */
const QUIET_LEVEL = 0.02;
const GAP_LOG_MS = 500;

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
const subscribeNever = () => () => {};

function untilReset(resetAt?: number): string {
  if (!resetAt) return 'tomorrow';
  return `at ${new Date(resetAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

/** Inbound and outbound audio counters, so each stats line can show what changed since the last one. */
type StatsSample = { received: number; lost: number; concealed: number; concealmentEvents: number; sent: number; samples: number };

export function useVoiceCall(handlers: Handlers) {
  const handlersRef = useRef(handlers);
  useLayoutEffect(() => {
    handlersRef.current = handlers;
  });

  const [active, setActive] = useState(false);
  const [phase, setPhaseState] = useState<CallPhase>('connecting');
  const [muted, setMuted] = useState(false);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [level, setLevelState] = useState(0);
  const [warning, setWarning] = useState<CallWarning | null>(null);
  // False on the server and during hydration, then whatever the browser says.
  const logging = useSyncExternalStore(subscribeNever, callLogEnabled, () => false);

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
  const phaseRef = useRef<CallPhase>('connecting');
  const levelRef = useRef(0);
  const lastLoudAtRef = useRef(0);
  const shownSecondRef = useRef<number | null>(null);
  const statsRef = useRef<StatsSample | null>(null);

  const setPhase = (next: CallPhase | ((current: CallPhase) => CallPhase)) => {
    const value = typeof next === 'function' ? next(phaseRef.current) : next;
    if (value === phaseRef.current) return;
    callLog.add('phase', `${phaseRef.current} → ${value}`);
    phaseRef.current = value;
    setPhaseState(value);
  };

  /** The ring only needs a new frame when the level visibly moved. */
  const setLevel = (value: number) => {
    if (value !== 0 && Math.abs(value - levelRef.current) < 0.03) return;
    levelRef.current = value;
    setLevelState(value);
  };

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearInterval(t));
    timersRef.current = [];
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
    speakingTimerRef.current = null;
    disconnectTimerRef.current = null;
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
    callLog.add('call.end', `reason=${reason} connected=${connectedAt ? `${Date.now() - connectedAt}ms` : 'never'} reconnects=${reconnectsRef.current}`);
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
    statsRef.current = null;
    setActive(false);
    setWarning(null);
    setLevel(0);
    setRemainingMs(null);
    shownSecondRef.current = null;
    const allowed = allowanceAtStartRef.current ?? Infinity;
    allowanceAtStartRef.current = null;
    callLog.end();
    if (notify && connectedAt) {
      // The line went quiet: the same cue whether the visitor hung up or the server did.
      playCue('hangup');
      handlersRef.current.onEnded({ durationMs: Math.min(Date.now() - connectedAt, allowed), reason });
    }
  }, []);

  const meterRemoteAudio = (stream: MediaStream) => {
    try {
      const ctx = audioCtxRef.current ?? new AudioContext();
      audioCtxRef.current = ctx;
      callLog.add('audio.context', `state=${ctx.state} sampleRate=${ctx.sampleRate}`);
      if (ctx.state === 'suspended') void ctx.resume().then(() => callLog.add('audio.context', `state=${ctx.state}`)).catch(() => {});
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      let last = 0;
      let quietSince: number | null = null;
      let heardOnce = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      const tick = (t: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (t - last < 66) return;
        last = t;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (const value of data) sum += ((value - 128) / 128) ** 2;
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 4));
        // The gap log: how long the agent's sound stopped for, between stretches of sound.
        if (rms >= QUIET_LEVEL) {
          lastLoudAtRef.current = Date.now();
          if (!heardOnce) {
            heardOnce = true;
            callLog.add('audio.first-sound');
          } else if (quietSince !== null) {
            const gap = Date.now() - quietSince;
            if (gap >= GAP_LOG_MS) callLog.add('audio.resumed', `after ${gap}ms of silence`);
          }
          quietSince = null;
        } else if (heardOnce && quietSince === null) {
          quietSince = Date.now();
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      callLog.add('audio.meter.failed', error);
      // No Web Audio: the ring just stays still.
    }
  };

  const holdSpeaking = () => {
    if (speakingTimerRef.current) window.clearTimeout(speakingTimerRef.current);
    const check = () => {
      speakingTimerRef.current = null;
      if (phaseRef.current !== 'speaking') return;
      // Transcript deltas arrive in bursts; the agent's sound is the better sign it is still talking.
      if (Date.now() - lastLoudAtRef.current < 900) {
        speakingTimerRef.current = window.setTimeout(check, 600);
        return;
      }
      setPhase('listening');
    };
    speakingTimerRef.current = window.setTimeout(check, SPEAKING_HOLD_MS);
  };

  const onEvent = (raw: string) => {
    let event: { type?: string; delta?: string; delegation?: { id?: string; target?: string }; error?: unknown; reason?: unknown };
    try {
      event = JSON.parse(raw);
    } catch {
      callLog.add('dc.unparsed', raw.slice(0, 120));
      return;
    }
    switch (event.type) {
      case 'session.started':
        callLog.add('dc.event', 'session.started');
        setPhase('listening');
        break;
      case 'session.input_transcript.delta': {
        const delta = String(event.delta ?? '');
        callLog.add('dc.user', JSON.stringify(delta));
        userBufferRef.current += delta;
        handlersRef.current.onUserSpeech(delta);
        break;
      }
      case 'session.output_transcript.delta':
        callLog.add('dc.agent', JSON.stringify(String(event.delta ?? '')));
        setPhase('speaking');
        handlersRef.current.onAssistantSpeech(String(event.delta ?? ''));
        holdSpeaking();
        break;
      case 'session.delegation.created': {
        const delegationId = event.delegation?.id;
        const sessionId = sessionRef.current;
        callLog.add('dc.event', `session.delegation.created id=${delegationId ?? '?'} target=${event.delegation?.target ?? '?'}`);
        if (!delegationId || !sessionId || (event.delegation?.target && event.delegation.target !== 'client')) break;
        setPhase('working');
        handlersRef.current.onHandOff();
        window.setTimeout(() => {
          const text = userBufferRef.current.trim();
          userBufferRef.current = '';
          callLog.add('delegation.sent', JSON.stringify(text));
          handlersRef.current.onDelegation({ sessionId, delegationId, text });
        }, TRANSCRIPT_SETTLE_MS);
        break;
      }
      case 'session.closed':
        callLog.add('dc.event', `session.closed reason=${event.reason ?? '?'}`);
        if (!endingRef.current) void learnWhyClosed();
        break;
      case 'error':
        callLog.add('dc.error', event.error);
        break;
      default:
        callLog.add('dc.event', event.type ?? '(no type)');
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
      callLog.add('api.heartbeat', `after close: status=${state.status} closeReason=${state.closeReason ?? 'none'} remaining=${state.remainingMs ?? '?'}ms`);
      if (state.closeReason === 'limit' || (state.remainingMs ?? 1) <= 1000) reason = 'limit';
    } catch (error) {
      callLog.add('api.heartbeat.failed', error);
    }
    finish(reason);
  };

  /** The path the audio takes, once ICE has chosen it. */
  const logSelectedPath = async (pc: RTCPeerConnection) => {
    try {
      const stats = await pc.getStats();
      const byId = new Map<string, Record<string, unknown>>();
      stats.forEach((report) => byId.set(report.id, report as unknown as Record<string, unknown>));
      stats.forEach((report) => {
        const pair = report as unknown as Record<string, unknown>;
        if (pair.type !== 'candidate-pair' || !(pair.selected === true || pair.nominated === true) || pair.state !== 'succeeded') return;
        const local = byId.get(String(pair.localCandidateId)) ?? {};
        const remote = byId.get(String(pair.remoteCandidateId)) ?? {};
        callLog.add('ice.path', `local=${local.candidateType}/${local.protocol} remote=${remote.candidateType}/${remote.protocol} ${remote.address ?? remote.ip ?? ''}:${remote.port ?? ''} rtt=${Math.round(Number(pair.currentRoundTripTime ?? 0) * 1000)}ms`);
      });
    } catch (error) {
      callLog.add('ice.path.failed', error);
    }
  };

  /** Inbound and outbound audio since the last sample: packets, loss, jitter and concealment are the signs of a bad line. */
  const sampleStats = async () => {
    const pc = pcRef.current;
    if (!pc || endingRef.current) return;
    try {
      const stats = await pc.getStats();
      const now: StatsSample = { received: 0, lost: 0, concealed: 0, concealmentEvents: 0, sent: 0, samples: 0 };
      let jitter = 0;
      let rtt = -1;
      let bufferMs = -1;
      stats.forEach((report) => {
        const r = report as unknown as Record<string, unknown>;
        if (r.type === 'inbound-rtp' && r.kind === 'audio') {
          now.received = Number(r.packetsReceived ?? 0);
          now.lost = Number(r.packetsLost ?? 0);
          now.concealed = Number(r.concealedSamples ?? 0);
          now.concealmentEvents = Number(r.concealmentEvents ?? 0);
          now.samples = Number(r.totalSamplesReceived ?? 0);
          jitter = Number(r.jitter ?? 0);
          const emitted = Number(r.jitterBufferEmittedCount ?? 0);
          if (emitted > 0) bufferMs = (Number(r.jitterBufferDelay ?? 0) / emitted) * 1000;
        } else if (r.type === 'outbound-rtp' && r.kind === 'audio') {
          now.sent = Number(r.packetsSent ?? 0);
        } else if (r.type === 'candidate-pair' && (r.selected === true || r.nominated === true) && r.state === 'succeeded') {
          rtt = Number(r.currentRoundTripTime ?? -1);
        }
      });
      const prev = statsRef.current;
      statsRef.current = now;
      if (!prev) return;
      const d = (key: keyof StatsSample) => now[key] - prev[key];
      callLog.add(
        'stats',
        `in: packets=+${d('received')} lost=+${d('lost')} concealed=+${d('concealed')} events=+${d('concealmentEvents')} samples=+${d('samples')} jitter=${Math.round(jitter * 1000)}ms buffer=${bufferMs < 0 ? '?' : Math.round(bufferMs)}ms | out: packets=+${d('sent')} | rtt=${rtt < 0 ? '?' : Math.round(rtt * 1000)}ms | pc=${pc.connectionState}/${pc.iceConnectionState}`
      );
    } catch (error) {
      callLog.add('stats.failed', error);
    }
  };

  /** Offer, server-side session creation, answer. `replace` carries usage over on a reconnect. */
  const connect = async (replace?: string): Promise<boolean> => {
    const mic = micRef.current;
    if (!mic) return false;
    const pc = new RTCPeerConnection();
    pcRef.current = pc;
    callLog.add('pc.created', replace ? `reconnect, replacing ${replace}` : 'first connection');
    mic.getAudioTracks().forEach((track) => pc.addTrack(track, mic));
    pc.ontrack = (event) => {
      // A track can arrive without a stream; play it on its own in that case.
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      callLog.add('remote.track', `kind=${event.track.kind} id=${event.track.id} streams=${event.streams.length} muted=${event.track.muted} state=${event.track.readyState}`);
      // A remote track goes "muted" when no packets arrive for a moment: the plainest sign of a dropout.
      event.track.onmute = () => callLog.add('remote.track', 'muted (no packets arriving)');
      event.track.onunmute = () => callLog.add('remote.track', 'unmuted (packets arriving)');
      event.track.onended = () => callLog.add('remote.track', 'ended');
      const audio = audioRef.current ?? new Audio();
      if (!audioRef.current) {
        for (const name of ['playing', 'pause', 'stalled', 'waiting', 'suspend', 'ended', 'error', 'emptied'] as const) {
          audio.addEventListener(name, () => callLog.add('audio.element', `${name} paused=${audio.paused} readyState=${audio.readyState}`));
        }
      }
      audioRef.current = audio;
      audio.autoplay = true;
      audio.srcObject = stream;
      void audio
        .play()
        .then(() => callLog.add('audio.element', 'play() resolved'))
        .catch((error) => callLog.add('audio.element', `play() rejected: ${(error as Error)?.name ?? error}`));
      meterRemoteAudio(stream);
    };
    const dc = pc.createDataChannel('oai-events');
    dcRef.current = dc;
    dc.onopen = () => callLog.add('dc.open');
    dc.onclose = () => callLog.add('dc.close');
    dc.onerror = (event) => callLog.add('dc.error', (event as RTCErrorEvent).error?.message ?? 'error');
    dc.onmessage = (event) => onEvent(String(event.data));
    pc.onsignalingstatechange = () => callLog.add('pc.signaling', pc.signalingState);
    pc.onicegatheringstatechange = () => callLog.add('pc.ice-gathering', pc.iceGatheringState);
    pc.oniceconnectionstatechange = () => callLog.add('pc.ice-connection', pc.iceConnectionState);
    pc.onicecandidateerror = (event) => callLog.add('pc.ice-candidate-error', `${event.errorCode} ${event.errorText} ${event.url ?? ''}`);
    pc.onconnectionstatechange = () => {
      if (pcRef.current !== pc) return;
      const state = pc.connectionState;
      callLog.add('pc.connection', state);
      if (endingRef.current) return;
      if (state === 'connected') {
        if (disconnectTimerRef.current) window.clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
        setPhase((p) => (p === 'reconnecting' || p === 'connecting' ? 'listening' : p));
        void logSelectedPath(pc);
      } else if (state === 'failed' || state === 'disconnected') {
        if (disconnectTimerRef.current) return;
        // "disconnected" often clears by itself within a second or two; the card keeps showing the
        // call as live until the grace period is up, and only a real reconnect says "Reconnecting…".
        disconnectTimerRef.current = window.setTimeout(() => {
          disconnectTimerRef.current = null;
          if (pcRef.current === pc && pc.connectionState !== 'connected') {
            callLog.add('pc.grace-expired', `state=${pc.connectionState} after ${state === 'failed' ? 0 : DISCONNECT_GRACE_MS}ms`);
            void reconnect();
          }
        }, state === 'failed' ? 0 : DISCONNECT_GRACE_MS);
      }
    };

    await pc.setLocalDescription(await pc.createOffer());
    await new Promise<void>((resolve) => {
      if (pc.iceGatheringState === 'complete') return resolve();
      const timer = window.setTimeout(() => {
        callLog.add('pc.ice-gathering', 'still gathering after 2000ms; sending the offer as it stands');
        resolve();
      }, 2000);
      pc.addEventListener('icegatheringstatechange', () => {
        if (pc.iceGatheringState === 'complete') {
          window.clearTimeout(timer);
          resolve();
        }
      });
    });

    const requestedAt = clock();
    const response = await post({ action: 'start', sdp: pc.localDescription?.sdp, history: handlersRef.current.history(), replace });
    const data = (await response.json().catch(() => ({}))) as StartError & { sessionId?: string; sdp?: string; deadline?: number; serverNow?: number };
    callLog.add('api.start', `${response.status} in ${clock() - requestedAt}ms${data.error ? ` error=${data.error}` : ''}${data.sessionId ? ` session=${data.sessionId}` : ''}`);
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
    callLog.add('deadline', `in ${Math.round((deadlineRef.current - now) / 1000)}s (clock skew ${(data.serverNow ?? now) - now}ms)`);
    if (connectedAtRef.current === null) {
      connectedAtRef.current = now;
      allowanceAtStartRef.current = deadlineRef.current - now;
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
    callLog.add('pc.answer-applied');
    return true;
  };

  const reconnect = async () => {
    if (endingRef.current) return;
    if (reconnectsRef.current >= MAX_RECONNECTS) {
      callLog.add('reconnect.gave-up', `after ${reconnectsRef.current}`);
      return finish('dropped');
    }
    reconnectsRef.current += 1;
    callLog.add('reconnect', `#${reconnectsRef.current}`);
    setPhase('reconnecting');
    const previous = sessionRef.current ?? undefined;
    closePeer();
    statsRef.current = null;
    try {
      const ok = await connect(previous);
      if (!ok) finish('dropped');
    } catch (error) {
      callLog.add('reconnect.failed', error);
      finish('dropped');
    }
  };

  const tick = () => {
    const deadline = deadlineRef.current;
    if (!deadline || endingRef.current) return;
    const left = deadline - Date.now();
    // The card shows whole seconds; only a changed second is worth a render.
    const second = Math.max(0, Math.ceil(left / 1000));
    if (shownSecondRef.current !== second) {
      shownSecondRef.current = second;
      setRemainingMs(Math.max(0, left));
    }
    const show = (kind: CallWarning) => {
      callLog.add('warning', kind);
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
      if (response.status === 404) {
        callLog.add('api.heartbeat', '404: the server no longer knows this call');
        return finish('dropped');
      }
      const state = (await response.json()) as { status?: string; deadline?: number | null; serverNow?: number; closeReason?: string | null; remainingMs?: number };
      callLog.add('api.heartbeat', `${response.status} status=${state.status} closeReason=${state.closeReason ?? 'none'} remaining=${state.remainingMs ?? '?'}ms`);
      if (sessionRef.current !== sessionId) return;
      if (state.deadline && state.serverNow) deadlineRef.current = state.deadline - (state.serverNow - Date.now());
      if (state.status === 'closed' && state.closeReason !== 'reconnected') finish(state.closeReason === 'limit' ? 'limit' : 'dropped');
    } catch (error) {
      callLog.add('api.heartbeat.failed', error);
      // A missed heartbeat is fine; the server only gives up after a minute of them.
    }
  };

  const start = useCallback(async () => {
    if (active) return;
    endingRef.current = false;
    reconnectsRef.current = 0;
    warnedRef.current = { five: false, one: false };
    userBufferRef.current = '';
    statsRef.current = null;
    lastLoudAtRef.current = 0;
    setMuted(false);
    mutedRef.current = false;
    phaseRef.current = 'connecting';
    setPhaseState('connecting');
    setRemainingMs(null);
    shownSecondRef.current = null;
    if (callLogEnabled()) callLog.begin();
    callLog.add('call.start');

    // Unlock audio playback inside the tap, before any await.
    audioRef.current ??= new Audio();
    void audioRef.current.play().catch(() => {});
    primeCues();

    try {
      micRef.current = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const track = micRef.current.getAudioTracks()[0];
      if (track) {
        const s = track.getSettings();
        callLog.add('mic.ready', `label=${JSON.stringify(track.label)} sampleRate=${s.sampleRate ?? '?'} channels=${s.channelCount ?? '?'} echoCancellation=${s.echoCancellation ?? '?'} noiseSuppression=${s.noiseSuppression ?? '?'} autoGainControl=${s.autoGainControl ?? '?'}`);
        track.onmute = () => callLog.add('mic.track', 'muted by the system');
        track.onunmute = () => callLog.add('mic.track', 'unmuted by the system');
        track.onended = () => callLog.add('mic.track', 'ended (device removed or permission revoked)');
      }
    } catch (error) {
      const name = (error as DOMException)?.name;
      callLog.add('mic.failed', `${name ?? 'Error'}: ${(error as Error)?.message ?? ''}`);
      handlersRef.current.onNotice(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'Microphone access is blocked. Allow it for this site in your browser settings to talk, or keep typing.'
          : name === 'NotFoundError'
            ? 'No microphone was found. You can keep typing.'
            : "The microphone couldn't start. You can keep typing."
      );
      callLog.end();
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
        callLog.end();
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
    timersRef.current.push(window.setInterval(() => void sampleStats(), STATS_MS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, finish]);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    micRef.current?.getAudioTracks().forEach((track) => (track.enabled = !next));
    callLog.add('mic', next ? 'muted by the visitor' : 'unmuted by the visitor');
    playCue(next ? 'mute' : 'unmute');
  }, []);

  const hangUp = useCallback(() => {
    callLog.add('hangup', 'red button');
    setPhase('ending');
    finish('hung_up');
  }, [finish]);

  const copyLog = useCallback(() => callLog.copy(), []);

  // Closing or reloading the tab ends the call and charges it now, not a minute later.
  useEffect(() => {
    const onHide = () => {
      const sessionId = sessionRef.current;
      if (!sessionId) return;
      callLog.add('page.hide', 'ending the call with a beacon');
      callLog.end();
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
    /** The call log is on (outside production, or by localStorage.voiceLog = "1"). */
    logging,
    sessionId: () => sessionRef.current,
    dismissWarning: () => setWarning(null),
    start,
    toggleMute,
    hangUp,
    /** Copy the current or last call's log as text; resolves false if there is none or the clipboard refused. */
    copyLog,
  };
}
