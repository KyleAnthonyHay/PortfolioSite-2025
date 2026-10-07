'use client';

import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Mic, MicOff, PhoneOff, X } from 'lucide-react';
import type { CallPhase, CallWarning } from './types';

/** "9:41", or "0:07" in the last minute. */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

const STATUS: Record<CallPhase, string> = {
  connecting: 'Connecting…',
  listening: 'Listening',
  speaking: 'Speaking',
  working: 'Looking that up…',
  reconnecting: 'Reconnecting…',
  ending: 'Ending call…',
};

interface CallCardProps {
  phase: CallPhase;
  muted: boolean;
  /** Milliseconds of voice time left today; null until the server says. */
  remainingMs: number | null;
  /** 0–1, how loud the agent is right now, for the avatar's ring. */
  level: number;
  warning: CallWarning | null;
  onDismissWarning: () => void;
  onMute: () => void;
  onHangUp: () => void;
}

/**
 * The floating call card: compact and dark so it reads as a live call above
 * the white chat, which stays scrollable and usable underneath it.
 */
export default function CallCard({ phase, muted, remainingMs, level, warning, onDismissWarning, onMute, onHangUp }: CallCardProps) {
  const lastMinute = remainingMs !== null && remainingMs <= 60_000;
  const status = muted && (phase === 'listening' || phase === 'speaking') ? 'Muted' : STATUS[phase];
  const live = phase === 'listening' || phase === 'speaking' || phase === 'working';

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[100px] z-50 flex flex-col items-center gap-2 px-4">
      <motion.div
        role="region"
        aria-label="Voice call with Kyle's Agent"
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-auto flex w-full max-w-[400px] items-center gap-3 rounded-[22px] bg-zinc-950/95 py-2.5 pl-2.5 pr-2.5 text-white shadow-[0_18px_44px_-14px_rgba(0,0,0,0.55)] ring-1 ring-white/10 backdrop-blur-xl"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          {/* The ring breathes with the agent's voice; a slow pulse while connecting. */}
          <span
            aria-hidden
            className={`absolute inset-0 rounded-full bg-accent-blue/35 transition-transform duration-100 ${phase === 'connecting' || phase === 'reconnecting' ? 'animate-ping' : ''}`}
            style={{ transform: `scale(${live ? 1 + Math.min(level, 1) * 0.45 : 1})` }}
          />
          <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-zinc-800">
            <Image src="/agent.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
          </span>
          <span
            aria-hidden
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-950 ${
              phase === 'reconnecting' || phase === 'connecting' ? 'bg-zinc-400' : muted ? 'bg-zinc-500' : 'bg-emerald-400'
            }`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium leading-tight">Kyle&apos;s Agent</p>
          <p aria-live="polite" className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] leading-tight text-zinc-400">
            {phase === 'working' && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-blue" aria-hidden />}
            {status}
          </p>
        </div>

        {remainingMs !== null && (
          <span
            className={`shrink-0 rounded-full px-2 py-1 font-mono text-[12px] tabular-nums ${lastMinute ? 'bg-white font-semibold text-zinc-950' : 'bg-white/[0.07] text-zinc-300'}`}
            aria-label={`${formatClock(remainingMs)} of voice time left`}
          >
            {formatClock(remainingMs)}
          </span>
        )}

        <button
          type="button"
          onClick={onMute}
          aria-pressed={muted}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors active:scale-[0.95] ${
            muted ? 'bg-white text-zinc-900' : 'bg-white/10 text-white hover:bg-white/15'
          }`}
        >
          {muted ? <MicOff className="h-[18px] w-[18px]" /> : <Mic className="h-[18px] w-[18px]" />}
        </button>
        <button
          type="button"
          onClick={onHangUp}
          aria-label="Hang up"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ff3b30] text-white transition-colors hover:bg-[#e6352b] active:scale-[0.95]"
        >
          <PhoneOff className="h-[18px] w-[18px]" />
        </button>
      </motion.div>

      <AnimatePresence>
        {warning && (
          <motion.div
            key={warning}
            role="status"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex w-full max-w-[400px] items-start gap-2.5 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[13.5px] leading-snug text-zinc-900 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.3)]"
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent-blue" />
            <p className="flex-1">
              {warning === 'five' ? 'Five minutes of voice time left today.' : 'One minute of voice time left today.'}{' '}
              <span className="text-zinc-500">After that, the chat keeps going in text.</span>
            </p>
            <button type="button" onClick={onDismissWarning} aria-label="Dismiss" className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
