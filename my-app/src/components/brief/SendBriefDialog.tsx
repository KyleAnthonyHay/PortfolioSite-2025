'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { celebrate } from '@/lib/celebrate';
import SuccessCheck from '@/components/ui/SuccessCheck';

const EMAIL = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

/**
 * "Send me this": the visitor leaves an email and gets the brief and its PDF.
 * Their address is kept as an opt-in so Kyle-Anthony can follow up, and the
 * copy says so. A centred card on larger screens, a bottom sheet on phones.
 */
export default function SendBriefDialog({ publicId, open, onClose }: { publicId: string; open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const checkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const focus = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(focus);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = email.trim();
    if (!EMAIL.test(value)) {
      setError('Enter a valid email address.');
      return;
    }
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/brief/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId, email: value }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || 'Something went wrong. Try again.');
      setState('sent');
      window.requestAnimationFrame(() => celebrate(checkRef.current));
      window.setTimeout(onClose, 2200);
    } catch (caught) {
      setState('idle');
      setError(caught instanceof Error ? caught.message : 'Something went wrong. Try again.');
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-zinc-900/25 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="send-brief-title"
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full overflow-hidden rounded-t-[24px] border border-zinc-200/80 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06),0_24px_48px_-24px_rgba(0,0,0,0.3)] sm:w-[380px] sm:rounded-[20px] sm:pb-5"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 rounded-full p-1.5 any-pointer-coarse:p-2.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>
            {/* The form stays in place under the success state, so the card keeps its size. */}
            <div className="relative">
                <motion.form onSubmit={submit} noValidate animate={{ opacity: state === 'sent' ? 0 : 1, scale: state === 'sent' ? 0.98 : 1 }} transition={{ duration: 0.2 }} aria-hidden={state === 'sent'}>
                  <h2 id="send-brief-title" className="pr-8 text-[15px] font-semibold text-zinc-900">
                    Send me this brief
                  </h2>
                  <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
                    You&apos;ll get the brief and its PDF by email.
                  </p>
                  <label htmlFor="send-brief-email" className="sr-only">
                    Email
                  </label>
                  <input
                    ref={inputRef}
                    id="send-brief-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError('');
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'send-brief-error' : undefined}
                    className="mt-4 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-[15px] text-zinc-900 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:border-accent-blue focus:shadow-[0_0_0_3px_rgba(10,132,255,0.15)] any-pointer-coarse:text-base"
                  />
                  {error && (
                    <p id="send-brief-error" className="mt-2 text-[12px] text-red-600">
                      {error}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={state === 'sending'}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent-blue text-sm font-medium text-white transition-[filter,transform] hover:brightness-95 active:scale-[0.98] disabled:opacity-70"
                  >
                    {state === 'sending' && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
                    {state === 'sending' ? 'Sending' : 'Send'}
                  </button>
                  <p className="mt-2 text-center text-[12px] text-zinc-400">No spam. Just this brief.</p>
                </motion.form>
              <AnimatePresence>
                {state === 'sent' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.05 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center"
                    role="status"
                  >
                    <SuccessCheck ref={checkRef} size={48} />
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                      <p className="mt-3 text-[15px] font-semibold text-zinc-900">Sent</p>
                      <p className="mt-0.5 text-balance text-[13px] text-zinc-500">Check {email.trim()} for the brief and its PDF.</p>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
