'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { SourceRef } from '@/lib/chat-events';
import { projectIcons } from '@/lib/project-icons';

/**
 * The projects an answer rests on, kept quiet: light gray chips with the
 * product's own small icon and its name. Products without an icon get a
 * gray initial. Answers saved before icons existed look theirs up by id.
 */
export default function SourcePills({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      <span className="label mr-0.5">Sources</span>
      {sources.map((source) => {
        const icon = source.icon ?? projectIcons[source.id];
        return (
          <Link
            key={source.id}
            href={source.href}
            className="inline-flex h-6 items-center gap-1.5 rounded-full bg-zinc-100/80 pl-[3px] pr-2.5 text-[12px] text-zinc-500 transition-colors hover:bg-zinc-200/70 hover:text-zinc-800"
          >
            {icon ? (
              <Image src={icon} alt="" width={18} height={18} className="h-[18px] w-[18px] rounded-full object-cover ring-1 ring-black/5" />
            ) : (
              <span aria-hidden className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-zinc-200 text-[9.5px] font-medium text-zinc-500">
                {source.title.charAt(0)}
              </span>
            )}
            {source.title}
          </Link>
        );
      })}
    </div>
  );
}
