'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Briefcase, Compass, Link2 } from 'lucide-react';
import type { VisitorContext } from '@/lib/chat-events';

const ease = [0.16, 1, 0.3, 1] as const;

interface HiringIntakeProps {
  /** Hiring with a role: the chat starts with a fit check. Exploring: the starters show. */
  onDone: (context: VisitorContext) => void;
}

/**
 * The opening question. "Yes" opens a two-field form (role, optional posting
 * link) whose answer rides along as context for the whole chat; "Just
 * exploring" and Skip go straight to the usual starters.
 */
export default function HiringIntake({ onDone }: HiringIntakeProps) {
  const [hiring, setHiring] = useState(false);
  const [role, setRole] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const roleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (hiring) requestAnimationFrame(() => roleRef.current?.focus());
  }, [hiring]);

  const url = jobUrl.trim();
  const urlValid = !url || /^https?:\/\/\S+\.\S+/i.test(url);
  const canSubmit = role.trim().length > 1 && urlValid;

  const submit = () => {
    if (canSubmit) onDone({ hiring: true, role: role.trim(), jobUrl: url || undefined });
  };

  const rows = [
    { key: 'yes', icon: Briefcase, label: "Yes, I'm hiring", detail: "Tell me the role and I'll focus on what's relevant", on: hiring, pick: () => setHiring(true) },
    { key: 'explore', icon: Compass, label: 'Just exploring', detail: 'Look around his work freely', on: false, pick: () => onDone({ hiring: false }) },
  ];

  return (
    <div className="agent-card w-full max-w-xl overflow-hidden text-left" role="group" aria-label="Are you considering Kyle-Anthony for a technical role?">
      <div className="px-4 pb-2 pt-4">
        <p className="font-display text-[16px] font-medium tracking-[-0.01em] text-ink">Are you considering Kyle-Anthony for a technical role?</p>
      </div>

      <div className="px-2 pb-1">
        {rows.map((row, i) => {
          const Icon = row.icon;
          return (
            <motion.button
              key={row.key}
              type="button"
              aria-pressed={row.on}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.05 }}
              onClick={row.pick}
              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${row.on ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  row.on ? 'border-ink bg-ink text-paper' : 'border-zinc-200 bg-paper text-zinc-500 group-hover:border-zinc-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-ink">{row.label}</span>
                <span className="block text-[12px] text-zinc-400">{row.detail}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence initial={false}>
        {hiring && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
            className="overflow-hidden"
          >
            <div className="space-y-2 px-4 pb-3 pt-1">
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-zinc-500">Role title</span>
                <input
                  ref={roleRef}
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  maxLength={120}
                  placeholder="e.g. iOS Engineer, AI Engineer"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[16px] text-ink placeholder-zinc-400 sm:not-any-pointer-coarse:text-[14px] outline-none transition-colors focus:border-zinc-400"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-medium text-zinc-500">
                  Job posting link <span className="font-normal text-zinc-400">(optional)</span>
                </span>
                <span className="relative block">
                  <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    value={jobUrl}
                    onChange={(event) => setJobUrl(event.target.value)}
                    inputMode="url"
                    maxLength={600}
                    placeholder="https://jobs.ashbyhq.com/…"
                    aria-invalid={!urlValid}
                    className={`h-10 w-full rounded-xl border bg-white pl-8 pr-3 text-[16px] text-ink placeholder-zinc-400 sm:not-any-pointer-coarse:text-[14px] outline-none transition-colors ${
                      urlValid ? 'border-zinc-200 focus:border-zinc-400' : 'border-red-300 focus:border-red-400'
                    }`}
                  />
                </span>
              </label>
            </div>
            <div className="flex items-center justify-end gap-1.5 border-t border-zinc-200/80 px-4 py-2.5">
              <button
                type="button"
                onClick={() => onDone({ hiring: false })}
                className="h-8 rounded-full px-3 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-ink"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="h-8 rounded-full bg-ink px-4 text-[13px] font-medium text-paper transition-all active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                Check his fit
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {!hiring && (
        <div className="flex justify-end border-t border-zinc-200/80 px-4 py-2">
          <button
            type="button"
            onClick={() => onDone({ hiring: false })}
            className="h-7 rounded-full px-3 text-[12.5px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-ink"
          >
            Skip
          </button>
        </div>
      )}
    </div>
  );
}

/** The first message after the intake form, so the chat opens on a fit check. */
export function intakeMessage(context: VisitorContext): string {
  const role = context.role ?? 'this';
  return context.jobUrl
    ? `I'm considering Kyle-Anthony for the ${role} role. Here's the posting: ${context.jobUrl}\nHow well does he fit?`
    : `I'm considering Kyle-Anthony for the ${role} role. How well does he fit?`;
}
