'use client';

import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Mail } from 'lucide-react';
import { profile } from '@/lib/profile';
import type { Widget } from '@/lib/chat-events';

/**
 * Booking card. With NEXT_PUBLIC_CALENDLY_URL set it opens Kyle-Anthony's
 * Calendly; without it, it falls back to email and the contact page.
 */
export function BookTimeWidget({ widget }: { widget: Extract<Widget, { kind: 'book_time' }> }) {
  const { url, email, contactPage } = widget;

  return (
    <div className="w-full max-w-[420px] overflow-hidden agent-card">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Book time with Kyle-Anthony</p>
          <p className="text-xs text-zinc-500">
            {url ? 'Pick a slot that works for you: intro call, interview, or project chat.' : 'Send a note with a few times that work, and he will confirm.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-zinc-100 px-4 py-2.5">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Choose a time
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        ) : (
          <a
            href={`mailto:${email}?cc=${encodeURIComponent(profile.emailCc)}&subject=${encodeURIComponent('Scheduling a call')}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <Mail className="h-3.5 w-3.5" />
            Email to schedule
          </a>
        )}
        <Link
          href={contactPage}
          className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          Contact form
        </Link>
      </div>
    </div>
  );
}
