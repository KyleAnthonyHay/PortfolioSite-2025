'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Check, Mail } from 'lucide-react';
import { profile } from '@/lib/profile';
import type { Widget } from '@/lib/chat-events';

/**
 * Booking card. With NEXT_PUBLIC_CALENDLY_URL set it opens Kyle-Anthony's
 * Calendly in the panel beside the chat, with the plain link as a fallback;
 * without it, it falls back to email and the contact page.
 */
export function BookTimeWidget({
  widget,
  onSchedule,
  booked = false,
}: {
  widget: Extract<Widget, { kind: 'book_time' }>;
  /** Opens the scheduler panel; absent outside the chat page. */
  onSchedule?: () => void;
  booked?: boolean;
}) {
  const { url, email, contactPage } = widget;

  if (url && booked) {
    return (
      <div className="flex w-full max-w-[420px] items-center gap-3 px-4 py-3.5 agent-card">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Check className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Booked with Kyle-Anthony</p>
          <p className="text-xs text-zinc-500">Calendly emailed you the details.</p>
        </div>
      </div>
    );
  }

  const filled = 'inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800';

  return (
    <div className="w-full max-w-[420px] overflow-hidden agent-card">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Talk with Kyle-Anthony</p>
          <p className="text-xs text-zinc-500">
            {url ? 'Pick a time that suits you, right here.' : 'Send a note with a few times that work, and he will confirm.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2.5">
        {url && onSchedule ? (
          <>
            <button type="button" onClick={onSchedule} className={filled}>
              Choose a time
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1 rounded-full px-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Open Calendly
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </>
        ) : url ? (
          <a href={url} target="_blank" rel="noopener noreferrer" className={filled}>
            Choose a time
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <>
            <a href={`mailto:${email}?cc=${encodeURIComponent(profile.emailCc)}&subject=${encodeURIComponent('Scheduling a call')}`} className={filled}>
              <Mail className="h-3.5 w-3.5" />
              Email to schedule
            </a>
            <Link
              href={contactPage}
              className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Contact form
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
