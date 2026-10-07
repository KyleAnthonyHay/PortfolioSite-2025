'use client';

import { useEffect, useState } from 'react';
import { ClipboardCopy } from 'lucide-react';

/**
 * "Copy call log": a small pill shown only while call logging is on, so a
 * misbehaving call can be pasted back as text. `dark` suits the call card;
 * the default suits the white chat.
 */
export default function CopyLogButton({ onCopy, dark = false }: { onCopy: () => Promise<boolean>; dark?: boolean }) {
  const [state, setState] = useState<'idle' | 'copied' | 'empty'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = window.setTimeout(() => setState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const label = state === 'copied' ? 'Copied' : state === 'empty' ? 'Nothing to copy' : 'Copy call log';
  return (
    <button
      type="button"
      onClick={() => void onCopy().then((ok) => setState(ok ? 'copied' : 'empty'))}
      className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] leading-none transition-colors ${
        dark ? 'bg-zinc-950/90 text-zinc-300 ring-1 ring-white/10 hover:text-white' : 'border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900'
      }`}
    >
      <ClipboardCopy className="h-3 w-3" aria-hidden />
      {label}
    </button>
  );
}
