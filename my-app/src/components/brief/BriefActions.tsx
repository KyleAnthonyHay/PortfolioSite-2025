'use client';

import { useState } from 'react';
import { FiArrowUpRight, FiCheck, FiDownload, FiLink } from 'react-icons/fi';

/** Download PDF, Copy share link, and (in the chat) Open brief. */
export default function BriefActions({ publicId, showOpen = false, size = 'md' }: { publicId: string; showOpen?: boolean; size?: 'sm' | 'md' }) {
  const [copied, setCopied] = useState(false);
  const path = `/brief/${publicId}`;
  const height = size === 'sm' ? 'h-8 px-3.5 text-[13px]' : 'h-9 px-4 text-sm';

  const copy = async () => {
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt('Copy this link', url);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showOpen && (
        <a
          href={path}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 font-medium text-white transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98] ${height}`}
        >
          Open brief <FiArrowUpRight className="h-3.5 w-3.5" />
        </a>
      )}
      <a
        href={`${path}/pdf`}
        download
        className={`inline-flex items-center gap-1.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.98] ${
          showOpen ? 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50' : 'bg-zinc-900 text-white hover:bg-zinc-800'
        } ${height}`}
      >
        <FiDownload className="h-3.5 w-3.5" /> Download PDF
      </a>
      <button
        type="button"
        onClick={copy}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-50 active:scale-[0.98] ${height}`}
      >
        {copied ? <FiCheck className="h-3.5 w-3.5" /> : <FiLink className="h-3.5 w-3.5" />}
        {copied ? 'Link copied' : 'Copy share link'}
      </button>
    </div>
  );
}
