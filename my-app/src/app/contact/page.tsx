'use client';
import { FormEvent, useState } from 'react';
import { profile } from '@/lib/profile';
import TopHeader from '@/components/TopHeader';
import Footer from '@/components/Footer';

export default function ContactPage() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');
  const [draft, setDraft] = useState('');
  const fallback = `mailto:${profile.email}?cc=${encodeURIComponent(profile.emailCc)}&subject=Portfolio%20enquiry&body=${encodeURIComponent(draft)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === 'sending') return;
    const form = new FormData(event.currentTarget);
    const message = String(form.get('message') ?? '');
    setDraft(message);
    setState('sending');
    setError('');
    try {
      const response = await fetch('/api/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.get('name'), email: form.get('email'), message, website: form.get('website'), includeTranscript: false }),
      });
      if (!response.ok) throw new Error(response.status === 429 ? 'Too many messages. Please email me directly.' : 'Your message could not be sent. Please email me directly.');
      setState('sent');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your message could not be sent. Please email me directly.');
      setState('error');
    }
  }

  return (
    <>
      <TopHeader />
      <section className="pt-16 pb-24">
        <div className="max-w-[800px] mx-auto px-6 md:px-12 space-y-8">
          <h1 className="text-[32px] font-medium text-[#666666]">Contact Me</h1>
          {state === 'sent' ? <p role="status">Thanks — your message has been sent. I’ll reply to the email you provided.</p> : <form onSubmit={handleSubmit} className="space-y-8">
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#666666]">What&apos;s your name?</label>
                <input
                  type="text"
                  name="name"
                  aria-label="Your name"
                  maxLength={120}
                  
                  placeholder="John Doe"
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#666666]">What&apos;s your email?</label>
                <input
                  type="email"
                  name="email"
                  aria-label="Your email"
                  maxLength={200}
                  
                  placeholder="John@company.com"
                  required
                  className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[#666666]">What&apos;s your message?</label>
              <textarea
                name="message"
                aria-label="Message"
                maxLength={4000}
                minLength={2}
                
                placeholder="Your message"
                required
                rows={6}
                className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={state === 'sending'}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              {state === 'sending' ? 'Sending…' : 'Send message'}
            </button>
            {state === 'error' && <p role="alert">{error} <a className="underline" href={fallback}>Open your email app</a></p>}
          </form>}
          <p className="text-sm text-zinc-500">Or email <a className="underline" href={fallback}>{profile.email}</a>.</p>
        </div>
      </section>
      <Footer />
    </>
  );
}
