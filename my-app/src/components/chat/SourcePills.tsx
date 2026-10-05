'use client';

import Link from 'next/link';
import type { SourceRef } from '@/lib/chat-events';

export default function SourcePills({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="label mr-1">Sources</span>
      {sources.map((source) => (
        <Link
          key={source.id}
          href={source.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white py-[3px] pl-1 pr-2.5 text-[12px] text-zinc-600 transition-all hover:border-zinc-400 hover:text-ink active:scale-[0.97]"
        >
          {/* A monogram reads at this size; a 16px screenshot thumbnail doesn't. */}
          <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white">
            {source.title.charAt(0)}
          </span>
          {source.title}
        </Link>
      ))}
    </div>
  );
}
