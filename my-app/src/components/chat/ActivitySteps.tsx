'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { ActivityStep } from '@/lib/chat-events';

function Shimmer({ text }: { text: string }) {
  return (
    <span className="animate-shimmer inline-block bg-gradient-to-r from-zinc-400 via-zinc-700 to-zinc-400 bg-[length:200%_100%] bg-clip-text text-sm text-transparent">
      {text}
    </span>
  );
}

interface ActivityStepsProps {
  steps: ActivityStep[];
  isStreaming: boolean;
  hasText: boolean;
}

/**
 * What the agent is doing. While tools run it reads as a live status line;
 * once the answer starts it folds into a one-line summary that expands on
 * click, so the work stays visible without crowding the reply.
 */
export default function ActivitySteps({ steps, isStreaming, hasText }: ActivityStepsProps) {
  const [open, setOpen] = useState(false);
  const running = steps.filter((step) => step.status === 'running');
  const live = isStreaming && !hasText;

  if (live) {
    const label = running.length > 0 ? running[running.length - 1].label : steps.length > 0 ? 'Writing' : 'Thinking';
    return (
      <div className="mb-3 flex h-6 items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-zinc-400 opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-zinc-500" />
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            <Shimmer text={`${label}…`} />
          </motion.span>
        </AnimatePresence>
      </div>
    );
  }

  if (steps.length === 0) return null;

  const summary = steps.map((step) => step.label).join(' · ');

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="group inline-flex max-w-full items-center gap-1.5 rounded-lg py-1 pr-2 text-xs text-zinc-400 transition-colors hover:text-zinc-700"
      >
        <Search className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{summary}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2 py-1 pl-0.5 text-xs text-zinc-500">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-100">
                  <Check className="h-2.5 w-2.5 text-zinc-500" />
                </span>
                {step.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
