'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { SourceRef } from '@/lib/chat-events';

export default function SourcePills({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Sources</span>
      {sources.map((source) => (
        <Link
          key={source.id}
          href={source.href}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white py-0.5 pl-1 pr-2.5 text-xs text-zinc-600 transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]"
        >
          <span className="relative h-4 w-4 overflow-hidden rounded-full bg-zinc-100">
            <Image src={source.image} alt="" fill sizes="16px" className="object-cover object-top" />
          </span>
          {source.title}
        </Link>
      ))}
    </div>
  );
}
