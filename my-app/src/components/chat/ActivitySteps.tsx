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

function Spark() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M8 1.5c.4 3.1 1.6 4.9 6.5 6.5-4.9 1.6-6.1 3.4-6.5 6.5-.4-3.1-1.6-4.9-6.5-6.5C6.4 6.4 7.6 4.6 8 1.5z" />
    </svg>
  );
}

/* Icon per tool family, in the spirit of Beautiful UI's tool chips (MIT, Shane Levine). */
function ToolIcon({ tool }: { tool: string }) {
  const common = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (tool === 'get_project' || tool === 'list_projects')
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </svg>
    );
  if (tool === 'assess_job_fit' || tool === 'check_experience')
    return (
      <svg {...common}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    );
  if (tool === 'get_project_resource' || tool === 'get_job_posting')
    return (
      <svg {...common}>
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    );
  if (tool === 'get_journey')
    return (
      <svg {...common}>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
      </svg>
    );
  if (tool === 'book_time')
    return (
      <svg {...common}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    );
  if (tool === 'ask_visitor')
    return (
      <svg {...common}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

/**
 * Tool calls as compact rows: an icon, the action, and the argument as a
 * chip. Rows with findings expand to show them.
 */
function StepRows({ steps }: { steps: ActivityStep[] }) {
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpenRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className="flex flex-col gap-0.5">
      <AnimatePresence initial={false}>
        {steps.map((step) => {
          const expandable = step.status === 'done' && (step.detail?.length ?? 0) > 0;
          const rowOpen = expandable && openRows.has(step.id);
          return (
            <motion.li
              key={step.id}
              initial={{ opacity: 0, y: -4, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.35, ease }}
            >
              <button
                type="button"
                disabled={!expandable}
                aria-expanded={expandable ? rowOpen : undefined}
                onClick={() => toggle(step.id)}
                className="group/row -mx-1.5 flex h-7 w-[calc(100%+12px)] min-w-0 items-center gap-2 rounded-lg px-1.5 text-left transition-colors enabled:hover:bg-zinc-100/80 disabled:cursor-default"
              >
                <span className="relative flex h-4 w-4 shrink-0 items-center justify-center text-zinc-400">
                  {step.status === 'running' ? (
                    <ArcSpinner className="h-3.5 w-3.5 text-ink" />
                  ) : (
                    <>
                      <span className={`transition-opacity duration-100 ${expandable ? 'group-hover/row:opacity-0' : ''} ${rowOpen ? 'opacity-0' : ''}`}>
                        <ToolIcon tool={step.tool} />
                      </span>
                      {expandable && (
                        <ChevronDown
                          className={`absolute h-3 w-3 transition-[opacity,transform] duration-150 group-hover/row:opacity-100 ${rowOpen ? 'opacity-100' : '-rotate-90 opacity-0'}`}
                          strokeWidth={2.4}
                        />
                      )}
                    </>
                  )}
                </span>
                <span className={`shrink-0 text-[13px] font-medium ${step.status === 'running' ? 'text-ink' : 'text-zinc-600'}`}>{step.label}</span>
                {step.chip && (
                  <span className="inline-flex h-[22px] min-w-0 items-center truncate rounded-md bg-zinc-100 px-1.5 text-[11.5px] text-zinc-500 ring-1 ring-inset ring-zinc-200/70">
                    <span className="truncate">{step.chip}</span>
                  </span>
                )}
              </button>
              <AnimatePresence initial={false}>
                {rowOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease }}
                    className="overflow-hidden"
                  >
                    <div className="mb-1 ml-[7px] mt-0.5 flex flex-col gap-0.5 border-l border-zinc-200 py-0.5 pl-3.5">
                      {step.detail?.map((line) => (
                        <span key={line} className="line-clamp-2 text-[12px] leading-[1.6] text-zinc-500">
                          {line}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
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
