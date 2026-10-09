"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FileText, X } from "lucide-react";
import { useMediaQuery } from "@/lib/use-media-query";

export const BRIEF_PROMPT =
  "Make a recruiter brief I can send to the hiring manager.";

const PULSED_KEY = "brief-button-pulsed";
const NUDGED_KEY = "brief-nudge-shown";
const IDLE_MS = 120_000;

function readFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    // Storage unavailable: the pulse or nudge may show again, which is harmless.
  }
}

/**
 * The header's Brief button. Greyed until the agent has a role or posting to
 * judge against, then lit with one pulse the first time. Once a brief exists
 * it opens that brief instead of making another.
 */
export function BriefButton({
  ready,
  busy,
  briefId,
  onMake,
}: {
  ready: boolean;
  busy: boolean;
  briefId?: string;
  onMake: () => void;
}) {
  const [pulse, setPulse] = useState(false);
  const wasReady = useRef(ready);

  useEffect(() => {
    const became = ready && !wasReady.current;
    wasReady.current = ready;
    if (!became || readFlag(PULSED_KEY)) return;
    setFlag(PULSED_KEY);
    setPulse(true);
    const timer = window.setTimeout(() => setPulse(false), 1600);
    return () => window.clearTimeout(timer);
  }, [ready]);

  const base =
    "relative inline-flex h-8 any-pointer-coarse:h-10 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-all active:scale-[0.97]";

  if (briefId) {
    return (
      <a
        href={`/brief/${briefId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`${base} bg-zinc-900 text-white hover:bg-zinc-800`}
      >
        <FileText className="h-3.5 w-3.5" /> Brief
      </a>
    );
  }

  return (
    <span className="group relative">
      <button
        type="button"
        onClick={onMake}
        disabled={!ready || busy}
        aria-label={
          ready
            ? "Make a recruiter brief"
            : "Recruiter brief: share a role or job link first"
        }
        className={`${base} ${ready ? "bg-zinc-900 text-white hover:bg-zinc-800" : "cursor-not-allowed border border-zinc-200 text-zinc-400"} disabled:active:scale-100`}
      >
        {pulse && (
          <span
            className="absolute inset-0 animate-ping rounded-full bg-zinc-900/30"
            aria-hidden
          />
        )}
        <FileText className="h-3.5 w-3.5" /> Brief
      </button>
      <span className="pointer-events-none absolute right-0 top-[calc(100%+8px)] z-40 w-56 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] leading-snug text-zinc-600 opacity-0 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] transition-opacity group-hover:opacity-100">
        {ready
          ? "A one-page brief on Kyle-Anthony for this role, to download or share."
          : "Paste a job description or link, or name the role, and the brief unlocks."}
      </span>
    </span>
  );
}

/** How long the nudge stays up before it dismisses itself. */
const NUDGE_MS = 8_000;

/**
 * One offer per visit to take a brief along, when the cursor heads for the
 * tab bar or the chat goes quiet after a real conversation. Never blocks
 * leaving: a thin bar along the bottom edge fills over NUDGE_MS and the card
 * dismisses itself when it completes. The timer pauses while the pointer is
 * over the card or focus is inside it.
 */
export function BriefNudge({
  engaged,
  ready,
  busy,
  briefId,
  activity,
  onMake,
}: {
  engaged: boolean;
  ready: boolean;
  busy: boolean;
  briefId?: string;
  /** Changes whenever the chat changes, to restart the idle timer. */
  activity: number;
  onMake: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  // The visitor took the offer: the card shows a check and confetti, then leaves.
  const [done, setDone] = useState(false);
  const remaining = useRef(NUDGE_MS);
  const eligible = engaged && !busy;
  const phone = useMediaQuery("(max-width: 640px)");

  const celebrate = async (source: HTMLElement | null) => {
    setDone(true);
    setPaused(true);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const { default: confetti } = await import("canvas-confetti");
      const rect = source?.getBoundingClientRect();
      const origin = rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : { x: 0.5, y: 0.5 };
      const colors = ["#0a84ff", "#5ac8fa", "#bfdbfe", "#ffffff", "#18181b"];
      confetti({
        particleCount: 70,
        spread: 70,
        startVelocity: 32,
        scalar: 0.9,
        ticks: 160,
        origin,
        colors,
        zIndex: 100,
      });
      confetti({
        particleCount: 30,
        spread: 120,
        startVelocity: 18,
        scalar: 0.7,
        ticks: 140,
        origin,
        colors,
        zIndex: 100,
      });
    }
    window.setTimeout(() => setOpen(false), 1500);
  };

  useEffect(() => {
    if (!eligible || readFlag(NUDGED_KEY)) return;
    const show = () => {
      if (readFlag(NUDGED_KEY)) return;
      setFlag(NUDGED_KEY);
      remaining.current = NUDGE_MS;
      setPaused(false);
      setDone(false);
      setOpen(true);
    };
    const onLeave = (event: MouseEvent) => {
      if (event.clientY <= 0) show();
    };
    const timer = window.setTimeout(show, IDLE_MS);
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.clearTimeout(timer);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [eligible, activity]);

  // Self-dismiss clock. The bar's animationend dismisses the card the moment
  // it reaches the edge; this timer is the fallback for reduced motion, where
  // the bar is hidden. Runs only while open and not paused; each pause banks
  // the time already spent so the two stay in step.
  useEffect(() => {
    if (!open || paused) return;
    const startedAt = performance.now();
    const timer = window.setTimeout(() => setOpen(false), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - startedAt),
      );
    };
  }, [open, paused]);

  const link =
    briefId && typeof window !== "undefined"
      ? `${window.location.origin}/brief/${briefId}`
      : "";
  const mail = link
    ? `mailto:?subject=${encodeURIComponent("Kyle-Anthony Hay: recruiter brief")}&body=${encodeURIComponent(`Recruiter brief on Kyle-Anthony Hay:\n${link}\n\nPDF: ${link}/pdf`)}`
    : "";

  const button =
    "inline-flex h-9 any-pointer-coarse:h-11 w-full items-center justify-center rounded-xl px-3 text-[13px] font-medium transition-colors active:scale-[0.98]";
  const primary = `${button} bg-accent-blue text-white hover:brightness-95`;
  const secondary = `${button} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`;

  const check = (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 18 }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-blue text-white"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        />
      </svg>
    </motion.span>
  );

  const bar = done ? (
    <motion.div
      aria-hidden
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-accent-blue"
    />
  ) : (
    <div
      aria-hidden
      className="absolute inset-x-0 bottom-0 h-[3px] bg-zinc-100"
    >
      <div
        className="nudge-fill h-full w-full origin-left bg-accent-blue"
        data-paused={paused ? "true" : "false"}
        style={{ animationDuration: `${NUDGE_MS}ms` }}
        onAnimationEnd={() => setOpen(false)}
      />
    </div>
  );

  return (
    <AnimatePresence>
      {open && phone ? (
        // Phone: one small banner that drops in from the top, like a notification.
        <motion.div
          role="dialog"
          aria-label="Take the brief with you"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            )
              setPaused(false);
          }}
          className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex items-center gap-2.5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white py-2 pl-3.5 pr-1.5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06),0_18px_36px_-20px_rgba(0,0,0,0.28)]"
        >
          {done ? (
            <>
              {check}
              <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-900">
                {briefId ? "Downloading your brief" : "Brief on its way"}
              </p>
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
              <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-900">
                {briefId ? "Your brief is ready" : "Take the brief with you?"}
              </p>
              {briefId ? (
                <a
                  href={`/brief/${briefId}/pdf`}
                  download
                  onClick={(event) => celebrate(event.currentTarget)}
                  className="inline-flex h-7 shrink-0 items-center rounded-full bg-accent-blue px-3 text-[12px] font-medium text-white"
                >
                  PDF
                </a>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    celebrate(event.currentTarget);
                    onMake();
                  }}
                  className="inline-flex h-7 shrink-0 items-center rounded-full bg-accent-blue px-3 text-[12px] font-medium text-white"
                >
                  Make it
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Dismiss"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          {bar}
        </motion.div>
      ) : (
        open && (
          <motion.div
            role="dialog"
            aria-label="Take the brief with you"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onPointerEnter={() => setPaused(true)}
            onPointerLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={(event) => {
              if (
                !event.currentTarget.contains(
                  event.relatedTarget as Node | null,
                )
              )
                setPaused(false);
            }}
            className="absolute bottom-28 right-4 z-50 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-[20px] border border-zinc-200/80 bg-white p-4 pb-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.3)]"
          >
            {done ? (
              <div className="flex items-center gap-3 py-1">
                {check}
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {briefId ? "Downloading your brief" : "Brief on its way"}
                  </p>
                  <p className="text-[13px] text-zinc-500">
                    {briefId
                      ? "The PDF is saving now."
                      : "The agent is writing it in the chat."}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Dismiss"
                  className="absolute right-3 top-3 any-pointer-coarse:right-1.5 any-pointer-coarse:top-1.5 rounded-full p-1 any-pointer-coarse:p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <p className="pr-6 text-sm font-semibold text-zinc-900">
                  Take the brief with you?
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                  {briefId
                    ? "Your brief is ready. Save the PDF or send yourself the link for the hiring manager."
                    : ready
                      ? "A one-page brief on Kyle-Anthony for your role: role match, relevant work and what to validate."
                      : "A short, shareable profile of Kyle-Anthony. Share a job link first for a role match."}
                </p>
                <div
                  className={`mt-3 grid gap-2 ${briefId ? "grid-cols-2" : "grid-cols-1"}`}
                >
                  {briefId ? (
                    <>
                      <a
                        href={`/brief/${briefId}/pdf`}
                        download
                        onClick={(event) => celebrate(event.currentTarget)}
                        className={primary}
                      >
                        Download PDF
                      </a>
                      <a
                        href={mail}
                        onClick={() => setOpen(false)}
                        className={secondary}
                      >
                        Email the link
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={(event) => {
                        celebrate(event.currentTarget);
                        onMake();
                      }}
                      className={primary}
                    >
                      Make the brief
                    </button>
                  )}
                </div>
              </>
            )}
            {bar}
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
