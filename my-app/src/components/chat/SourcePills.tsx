'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { SourceRef } from '@/lib/chat-events';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const MAX_SHOWN = 5;

/**
 * The projects an answer rests on, as an overlapping stack of app icons
 * (after the avatar group in Kobra's component set, re-drawn here), then
 * the names in words. Each icon opens its project; hovering names it.
 */
export default function SourcePills({ sources }: { sources: SourceRef[] }) {
  if (sources.length === 0) return null;
  const shown = sources.slice(0, MAX_SHOWN);
  const extra = sources.length - shown.length;
  const names =
    sources.length <= 2 ? sources.map((s) => s.title).join(' and ') : `${sources[0].title}, ${sources[1].title} and ${sources.length - 2} more`;

  return (
    <TooltipProvider delayDuration={120}>
      <div className="mt-3 flex items-center gap-2.5">
        <span className="label">Sources</span>
        <div className="flex items-center -space-x-2">
          {shown.map((source, i) => (
            <Tooltip key={source.id}>
              <TooltipTrigger asChild>
                <Link
                  href={source.href}
                  aria-label={source.title}
                  style={{ zIndex: shown.length - i }}
                  className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-2 ring-paper transition-transform duration-200 ease-out hover:z-20 hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
                >
                  {source.icon ? (
                    <Image src={source.icon} alt="" width={28} height={28} className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden className="flex h-full w-full items-center justify-center bg-zinc-900 text-[10px] font-semibold text-white">
                      {source.title.charAt(0)}
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" className="rounded-lg bg-ink px-2 py-1 text-[11.5px]">
                {source.title}
              </TooltipContent>
            </Tooltip>
          ))}
          {extra > 0 && (
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-medium text-zinc-500 ring-2 ring-paper">
              +{extra}
            </span>
          )}
        </div>
        <span className="min-w-0 truncate text-[12px] text-zinc-500">{names}</span>
      </div>
    </TooltipProvider>
  );
}
