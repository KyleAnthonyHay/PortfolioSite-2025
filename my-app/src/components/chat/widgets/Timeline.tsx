'use client';

import { Briefcase, GraduationCap } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';

export function TimelineWidget({ widget }: { widget: Extract<Widget, { kind: 'timeline' }> }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white px-5 py-4 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
      <ol className="relative">
        {widget.items.map((item, index) => {
          const Icon = item.kind === 'work' ? Briefcase : GraduationCap;
          const last = index === widget.items.length - 1;
          return (
            <li key={`${item.title}-${item.org}`} className="relative flex gap-4 pb-5 last:pb-0">
              {!last && <span className="absolute left-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-zinc-100" />}
              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-900">{item.title}</p>
                  <span className="shrink-0 font-mono text-[11px] text-zinc-400">{item.period}</span>
                </div>
                <p className="text-xs text-zinc-500">{item.org}</p>
                {item.detail && <p className="mt-1 text-xs leading-relaxed text-zinc-400">{item.detail}</p>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
