'use client';

import { useCallback, useState } from 'react';
import { FiArrowUpRight, FiCheck, FiCopy, FiDownload, FiMail, FiShare } from 'react-icons/fi';
import SendBriefDialog from './SendBriefDialog';

/**
 * The brief's controls, on its page and on the fit check card in the chat:
 * Open brief (chat only), Download, Copy (the brief as text), Share link
 * (the share sheet where there is one, otherwise the link is copied) and
 * Send me this (emailed to the visitor, who opts in by asking).
 */
export default function BriefActions({
  publicId,
  title,
  text,
  showOpen = false,
  size = 'md',
}: {
  publicId: string;
  title?: string;
  /** The brief as plain text when the page already has it; otherwise Copy fetches it. */
  text?: string;
  showOpen?: boolean;
  size?: 'sm' | 'md';
}) {
  const [flash, setFlash] = useState<'copied' | 'linked' | null>(null);
  const [sending, setSending] = useState(false);
  // A fresh dialog each time it opens, so a past send or error never shows.
  const [sendKey, setSendKey] = useState(0);
  const path = `/brief/${publicId}`;
  const height = size === 'sm' ? 'h-8 any-pointer-coarse:h-10 text-[13px]' : 'h-9 any-pointer-coarse:h-11 text-sm';
  const button = `px-3.5 inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${height}`;
  const secondary = `${button.replace('px-3.5', 'px-2 sm:px-3.5')} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`;

  const show = (what: 'copied' | 'linked') => {
    setFlash(what);
    window.setTimeout(() => setFlash((current) => (current === what ? null : current)), 2000);
  };

  const copy = async () => {
    try {
      if (text) await navigator.clipboard.writeText(text);
      else if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        // A promised item keeps the click's permission in Safari while the text loads.
        const blob = fetch(`${path}/text`).then((r) => (r.ok ? r.blob() : Promise.reject(new Error('missing'))));
        await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })]);
      } else await navigator.clipboard.writeText(await (await fetch(`${path}/text`)).text());
      show('copied');
    } catch {
      window.open(`${path}/text`, '_blank', 'noopener');
    }
  };

  const share = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share && window.matchMedia('(any-pointer: coarse)').matches) {
      try {
        await navigator.share({ title: title ? `Kyle-Anthony Hay · ${title}` : 'Kyle-Anthony Hay · Brief', url });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link', url);
    }
    show('linked');
  };

  const closeSend = useCallback(() => setSending(false), []);

  return (
    // Phones: three equal controls in a row, with the two filled ones full width.
    // Wider: the controls on the left, Send me this on its own at the right.
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
      {showOpen && (
        <a href={path} target="_blank" rel="noopener noreferrer" className={`${button} col-span-3 bg-zinc-900 text-white hover:bg-zinc-800`}>
          Open brief <FiArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
      <a href={`${path}/pdf`} download className={secondary}>
        <FiDownload className="h-3.5 w-3.5" /> Download
      </a>
      <button type="button" onClick={copy} className={secondary}>
        {flash === 'copied' ? <FiCheck className="h-3.5 w-3.5 text-accent-blue" /> : <FiCopy className="h-3.5 w-3.5" />}
        {flash === 'copied' ? 'Copied' : 'Copy'}
      </button>
      <button type="button" onClick={share} className={secondary}>
        {flash === 'linked' ? <FiCheck className="h-3.5 w-3.5 text-accent-blue" /> : <FiShare className="h-3.5 w-3.5" />}
        {flash === 'linked' ? 'Link copied' : 'Share link'}
      </button>
      <button type="button" onClick={() => {
          setSendKey((key) => key + 1);
          setSending(true);
        }} className={`${button} col-span-3 bg-accent-blue text-white hover:brightness-95 sm:ml-auto`}>
        <FiMail className="h-3.5 w-3.5" /> Send me this
      </button>
      <SendBriefDialog key={sendKey} publicId={publicId} open={sending} onClose={closeSend} />
    </div>
  );
}
