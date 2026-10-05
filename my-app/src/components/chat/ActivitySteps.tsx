'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import type { ActivityStep } from '@/lib/chat-events';

const ease = [0.16, 1, 0.3, 1] as const;

export function PixelLoader({ className = '' }: { className?: string }) {
  // Cells light in a diagonal wave: the delay follows row + column.
  return (
    <span className={`pixel-grid ${className}`} aria-hidden>
      {Array.from({ length: 9 }, (_, i) => (
        <span key={i} style={{ animationDelay: `${((i % 3) + Math.floor(i / 3)) * 110}ms` }} />
      ))}
    </span>
  );
}

export function ArcSpinner({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.6" />
      <path d="M8 2a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="arc-spin" />
    </svg>
  );
}

function DoneMark() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-olive" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity="0.14" />
      <motion.path
        d="M5 8.2l2 2 4-4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease }}
      />
    </svg>
  );
}

function Spark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M8 1.5c.4 3.1 1.6 4.9 6.5 6.5-4.9 1.6-6.1 3.4-6.5 6.5-.4-3.1-1.6-4.9-6.5-6.5C6.4 6.4 7.6 4.6 8 1.5z" />
    </svg>
  );
}

function StepRows({ steps }: { steps: ActivityStep[] }) {
  return (
    <ul className="relative ml-[7px] border-l border-zinc-200 pl-4">
      <AnimatePresence initial={false}>
        {steps.map((step) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.35, ease }}
            className="flex items-center gap-2.5 py-1.5 text-[13px]"
          >
            <span className="-ml-[25px] flex h-4 w-4 items-center justify-center bg-paper">
              {step.status === 'running' ? <ArcSpinner className="h-4 w-4 text-ink" /> : <DoneMark />}
            </span>
            <span className={step.status === 'running' ? 'text-ink' : 'text-zinc-500'}>{step.label}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function seconds(ms: number) {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

interface ActivityStepsProps {
  steps: ActivityStep[];
  isStreaming: boolean;
  hasText: boolean;
  startedAt?: number;
  endedAt?: number;
}

/**
 * The agent's working state. While it works: a pixel loader, a shimmering
 * line for the current step, a live timer, and each tool call as a row that
 * resolves to a check. Once the answer starts, all of it folds into one line
 * ("Worked for 3.2s · 2 steps") that opens back up on click.
 */
export default function ActivitySteps({ steps, isStreaming, hasText, startedAt, endedAt }: ActivityStepsProps) {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const live = isStreaming && !hasText;

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [live]);

  if (live) {
    const running = steps.filter((step) => step.status === 'running');
    const label = running.length > 0 ? running[running.length - 1].label : steps.length > 0 ? 'Writing the answer' : 'Thinking';
    return (
      <div className="mb-4">
        <div className="flex h-7 items-center gap-2.5">
          <PixelLoader className="text-ink" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 5, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -5, filter: 'blur(3px)' }}
              transition={{ duration: 0.25, ease }}
              className="text-shimmer text-[14px]"
            >
              {label}
            </motion.span>
          </AnimatePresence>
          {startedAt && <span className="font-mono text-[11px] tabular-nums text-zinc-400">{seconds(now - startedAt)}</span>}
        </div>
        {steps.length > 0 && (
          <div className="mt-1.5">
            <StepRows steps={steps} />
          </div>
        )}
      </div>
    );
  }

  if (steps.length === 0) return null;

  const took = startedAt && endedAt ? seconds(endedAt - startedAt) : null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="group inline-flex items-center gap-1.5 rounded-full py-1 pr-2 text-[13px] text-zinc-400 transition-colors hover:text-ink"
      >
        <Spark />
        <span>
          {took ? `Worked for ${took}` : 'Worked'} · {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <div className="pb-1 pt-1">
              <StepRows steps={steps} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
