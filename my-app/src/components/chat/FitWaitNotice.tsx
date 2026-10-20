"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Clock, X } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";

/** Roughly how long a fit check takes, brief included. */
const FIT_MS = 30_000;

/**
 * While a fit check runs, a small card says how long it takes, so a visitor
 * waits for it rather than wondering whether the chat stalled. It leaves when
 * the answer and its brief are done, or when dismissed. The bar along the bottom fills over
 * the expected time.
 */
export function FitWaitNotice({ runId }: { /** The answer running a fit check, if one is. */ runId?: string }) {
  // Dismissing hides it for this fit check only; the next one shows it again.
  const [dismissed, setDismissed] = useState<string>();
  const phone = useMediaQuery("(max-width: 640px)");
  const open = Boolean(runId) && dismissed !== runId;

  const bar = (
    <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-zinc-100">
      <div className="nudge-fill h-full w-full origin-left bg-accent-blue" style={{ animationDuration: `${FIT_MS}ms` }} />
    </div>
  );

  const close = (
    <button
      type="button"
      onClick={() => setDismissed(runId)}
      aria-label="Dismiss"
      className="flex h-7 w-7 any-pointer-coarse:h-10 any-pointer-coarse:w-10 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <AnimatePresence>
      {open && phone ? (
        // Phone: a small banner from the top, like a notification.
        <motion.div
          key="phone"
          role="status"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14, scale: 0.97, filter: "blur(4px)" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white py-2 pl-3.5 pr-1.5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06),0_18px_36px_-20px_rgba(0,0,0,0.28)]"
        >
          <Clock className="h-4 w-4 shrink-0 text-zinc-500" />
          <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-900">Fit check takes about 30 seconds</p>
          {close}
          {bar}
        </motion.div>
      ) : (
        open && (
          <motion.div
            key="desktop"
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96, filter: "blur(4px)" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-28 right-4 z-50 flex w-[min(320px,calc(100vw-32px))] gap-3 overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white p-4 pb-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.3)]"
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">This takes about 30 seconds</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">Each requirement is checked against his work.</p>
            </div>
            <div className="-mr-2 -mt-2">{close}</div>
            {bar}
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
