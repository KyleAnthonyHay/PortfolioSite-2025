'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, CalendarDays, Check, ChevronDown, X } from 'lucide-react';
import { calendlyEmbedUrl, readCalendlyEvent, type VisitorDetails } from '@/lib/scheduling';

/** How long the embed gets to report itself before the panel offers the plain link. */
const LOAD_TIMEOUT_MS = 10_000;

interface SchedulerPanelProps {
  url: string;
  details: VisitorDetails;
  booked: boolean;
  /** Phones: the sheet slides away to show the chat, keeping its place in Calendly. */
  minimized: boolean;
  onMinimize: (minimized: boolean) => void;
  onClose: () => void;
  onScheduled: () => void;
}

/**
 * Kyle-Anthony's Calendly beside the chat. On a wide screen it docks to the
 * right and the chat stays usable next to it; on a phone it is a sheet that
 * can be pulled down to the chat and brought back where it was.
 */
export default function SchedulerPanel({ url, details, booked, minimized, onMinimize, onClose, onScheduled }: SchedulerPanelProps) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // Built once per opening, so typing a name elsewhere doesn't reload the embed mid-booking.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const src = useMemo(() => calendlyEmbedUrl(url, details), [url]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const kind = readCalendlyEvent(event);
      if (kind === 'loaded') setLoaded(true);
      if (kind === 'scheduled') {
        setLoaded(true);
        onScheduled();
      }
    };
    window.addEventListener('message', onMessage);
    const timer = window.setTimeout(() => setTimedOut(true), LOAD_TIMEOUT_MS);
    return () => {
      window.removeEventListener('message', onMessage);
      window.clearTimeout(timer);
    };
  }, [onScheduled]);

  const failed = timedOut && !loaded;

  return (
    <>
      <motion.aside
        aria-label="Book time with Kyle-Anthony"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed inset-x-0 bottom-0 z-[60] flex h-[88dvh] flex-col overflow-hidden rounded-t-[24px] border-t border-zinc-200 bg-white shadow-[0_-24px_48px_-24px_rgba(0,0,0,0.3)] transition-transform duration-300 lg:inset-x-auto lg:right-0 lg:top-0 lg:h-full lg:w-[420px] lg:translate-y-0 lg:rounded-none lg:border-l lg:border-t-0 lg:shadow-none ${minimized ? 'translate-y-full' : 'translate-y-0'}`}
      >
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-100 pl-4 pr-2">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${booked ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-600'}`}>
            {booked ? <Check className="h-4 w-4" strokeWidth={2.25} /> : <CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
          </span>
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-zinc-900">{booked ? 'Booked' : 'Book time with Kyle-Anthony'}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open in Calendly"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={() => onMinimize(true)}
            aria-label="Back to the chat"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the scheduler"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="relative min-h-0 flex-1">
          {!failed && <iframe src={src} title="Kyle-Anthony's Calendly" className="h-full w-full border-0" allow="payment" />}
          {!loaded && !failed && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" aria-label="Loading the scheduler" />
            </div>
          )}
          {failed && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
              <p className="text-[15px] text-zinc-600">The scheduler didn&apos;t load here.</p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-1.5 rounded-full bg-accent-blue px-5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Open Calendly
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>
      </motion.aside>

      <AnimatePresence>
        {minimized && (
          <motion.button
            key="scheduler-pill"
            type="button"
            onClick={() => onMinimize(false)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[104px] z-[60] inline-flex h-9 -translate-x-1/2 items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-3 pr-3.5 text-[13px] font-medium text-zinc-800 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)] lg:hidden"
          >
            {booked ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <CalendarDays className="h-3.5 w-3.5 text-zinc-500" />}
            {booked ? 'Booked' : 'Back to scheduling'}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
