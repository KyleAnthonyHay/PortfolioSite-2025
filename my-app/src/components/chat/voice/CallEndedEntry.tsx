import { PhoneOff } from 'lucide-react';
import { formatClock } from './CallCard';
import CopyLogButton from './CopyLogButton';
import type { CallEndReason } from './types';

const NOTES: Partial<Record<CallEndReason, string>> = {
  limit: "That's today's ten minutes of voice. Keep typing and the agent answers here.",
  dropped: 'The connection dropped. You can call back with the time you have left, or keep typing.',
  error: 'The call ran into a problem. You can keep typing here.',
};

/** The line a call leaves in the chat, like a missed-call row in Messages. */
export default function CallEndedEntry({ durationMs, reason, onCopyLog }: { durationMs: number; reason: CallEndReason; onCopyLog?: () => Promise<boolean> }) {
  const note = NOTES[reason];
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[13px] text-zinc-600">
        <PhoneOff className="h-3.5 w-3.5 text-zinc-400" />
        Call ended · <span className="tabular-nums">{formatClock(durationMs)}</span>
      </span>
      {note && <p className="max-w-[300px] text-[12px] leading-snug text-zinc-400">{note}</p>}
      {onCopyLog && <CopyLogButton onCopy={onCopyLog} />}
    </div>
  );
}
