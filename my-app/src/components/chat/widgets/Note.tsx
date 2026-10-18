'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Mail, Send } from 'lucide-react';
import { profile } from '@/lib/profile';
import type { ConversationMessage, VisitorContext, Widget } from '@/lib/chat-events';
import { ArcSpinner } from '../ActivitySteps';

export interface ChatHandle {
  /** The conversation so far, as plain messages, for the attached transcript. */
  transcript: () => ConversationMessage[];
  context: VisitorContext | null;
}

const field =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 text-[16px] text-ink placeholder-zinc-400 sm:not-any-pointer-coarse:text-[14px] outline-none transition-colors focus:border-zinc-400';

const errors: Record<string, string> = {
  invalid_email: 'That email address does not look right.',
  empty_message: 'Write a few words first.',
  rate_limited: 'Too many notes from here for now. Try again in a while, or email him directly.',
};

/**
 * send_note: the visitor's message to Kyle-Anthony, drafted by the agent and
 * sent by the visitor. With Resend configured it posts to /api/note (reply-to
 * the visitor, transcript attached); without it, it opens their mail app.
 */
export function NoteWidget({ widget, chat }: { widget: Extract<Widget, { kind: 'note' }>; chat?: ChatHandle }) {
  const [name, setName] = useState(widget.name ?? '');
  const [email, setEmail] = useState(widget.email ?? '');
  const [message, setMessage] = useState(widget.draft);
  const [includeTranscript, setIncludeTranscript] = useState(true);
  const [website, setWebsite] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
  const canSend = message.trim().length > 1 && (emailValid || !widget.configured) && state !== 'sending';

  const mailto = `mailto:${widget.fallbackEmail}?cc=${encodeURIComponent(profile.emailCc)}&subject=${encodeURIComponent(`Note from ${name.trim() || 'a portfolio visitor'}`)}&body=${encodeURIComponent(message.trim())}`;

  const send = async () => {
    if (!canSend) return;
    if (!widget.configured) {
      window.location.href = mailto;
      return;
    }
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
          website,
          includeTranscript,
          transcript: includeTranscript ? chat?.transcript() ?? [] : [],
          context: chat?.context ?? undefined,
        }),
      });
      if (response.ok) {
        setState('sent');
        return;
      }
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setError(errors[body.error ?? ''] ?? 'It did not go through. You can email him directly instead.');
      setState('error');
    } catch {
      setError('It did not go through. You can email him directly instead.');
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="agent-card flex w-full max-w-[460px] items-center gap-3 px-4 py-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Check className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Sent to Kyle-Anthony</p>
          <p className="text-xs text-zinc-500">He&apos;ll reply to {email.trim()}.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="agent-card w-full max-w-[460px] overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 pb-2 pt-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
          <Mail className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">Leave Kyle-Anthony a note</p>
          <p className="text-xs text-zinc-500">{widget.configured ? 'It goes straight to his inbox. Edit anything first.' : 'Opens your email app with this message.'}</p>
        </div>
      </div>

      <div className="space-y-2 px-4 pb-3 pt-1">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} placeholder="Your name" aria-label="Your name" className={`${field} h-10`} />
          {widget.configured && (
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              maxLength={200}
              placeholder="Your email (for his reply)"
              aria-label="Your email"
              required
              className={`${field} h-10`}
            />
          )}
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          maxLength={4000}
          aria-label="Message"
          className={`${field} block resize-none py-2.5 leading-[1.5]`}
        />
        {/* Hidden from people; a filled value marks a bot. */}
        <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        {widget.configured && (
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-zinc-500">
            <input type="checkbox" checked={includeTranscript} onChange={(e) => setIncludeTranscript(e.target.checked)} className="h-3.5 w-3.5 accent-zinc-900" />
            Attach this chat so he has the context
          </label>
        )}
        {state === 'error' && (
          <p className="text-[12.5px] text-red-600">
            {error}{' '}
            <a href={mailto} className="underline">
              Email instead
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-4 py-2.5">
        <a href={mailto} className="text-[12.5px] text-zinc-400 transition-colors hover:text-ink">
          {widget.fallbackEmail}
        </a>
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-[13px] font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-400"
        >
          {state === 'sending' ? <ArcSpinner className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {widget.configured ? (state === 'sending' ? 'Sending' : 'Send note') : 'Open in email'}
        </button>
      </div>
    </form>
  );
}
