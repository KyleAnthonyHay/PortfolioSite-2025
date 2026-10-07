'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { Recommendation, Widget } from '@/lib/chat-events';
import { Media } from './ProjectCards';

/*
 * Recommendation card, adapted from Beautiful UI's Recommendation Card
 * (MIT, © 2026 Shane Levine, beautifului.dev). The card keeps its shape;
 * "Alternatives" opens a drawer of the other projects, and picking one
 * promotes it to the recommendation.
 */

const confidenceMeta: Record<Recommendation['confidence'], { signal: number; tone: string; label: string }> = {
  high: { signal: 3, tone: 'var(--olive)', label: 'Direct evidence' },
  medium: { signal: 2, tone: '#f59e0b', label: 'Related work' },
  low: { signal: 1, tone: '#a1a1aa', label: 'Loosely related' },
};

function Meter({ confidence }: { confidence: Recommendation['confidence'] }) {
  const { signal, tone } = confidenceMeta[confidence];
  return (
    <span className="flex items-end gap-0.5" aria-hidden>
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="w-1 rounded-full transition-colors duration-300"
          style={{ height: 10, background: bar < signal ? tone : '#e4e4e7' }}
        />
      ))}
    </span>
  );
}

export function RecommendationsWidget({
  widget,
  onAsk,
}: {
  widget: Extract<Widget, { kind: 'recommendations' }>;
  onAsk?: (text: string) => void;
}) {
  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(false);
  const { items, query } = widget;
  if (items.length === 0) return null;

  const active = items[selected];
  const others = items.map((item, index) => ({ item, index })).filter(({ index }) => index !== selected);
  const meta = confidenceMeta[active.confidence];

  return (
    <div className="w-full max-w-[460px] overflow-hidden agent-card">
      <div className="flex gap-3 px-4 pb-3 pt-4">
        <Media project={active.project} contain={false} className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-zinc-100" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-zinc-400">
            {selected === 0 ? 'Most relevant' : 'Also relevant'} to “{query}”
          </p>
          <p className="truncate text-[14px] font-semibold text-zinc-900">{active.project.title}</p>
          <p
            key={active.project.id}
            className="mt-0.5 text-[13px] leading-relaxed text-zinc-600"
            style={{ animation: 'fadeIn 180ms ease-out both' }}
          >
            {active.why}
          </p>
          {active.section && <p className="mt-1 truncate text-[11px] text-zinc-400">From: {active.section}</p>}
        </div>
      </div>

      {others.length > 0 && (
        <div
          className="grid transition-[grid-template-rows,opacity] duration-300"
          style={{
            gridTemplateRows: open ? '1fr' : '0fr',
            opacity: open ? 1 : 0,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="overflow-hidden">
            <div className="border-t border-zinc-100 px-2 py-2">
              <p className="px-1.5 pb-1 text-[11px] font-medium text-zinc-400">Other projects</p>
              {others.map(({ item, index }) => (
                <button
                  key={item.project.id}
                  type="button"
                  tabIndex={open ? 0 : -1}
                  onClick={() => setSelected(index)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-zinc-50"
                >
                  <Meter confidence={item.confidence} />
                  <span className="shrink-0 text-[12.5px] font-medium text-zinc-900">{item.project.title}</span>
                  <span className="min-w-0 flex-1 truncate text-[12px] text-zinc-500">{item.why}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-4 py-2.5">
        <span className="flex items-center gap-2">
          <Meter confidence={active.confidence} />
          <span className="text-[12.5px] font-medium text-zinc-500">{meta.label}</span>
        </span>
        <span className="flex items-center gap-1.5">
          {others.length > 0 && (
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpen((current) => !current)}
              className="h-7 rounded-full border border-zinc-200 bg-white px-2.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              {open ? 'Hide' : `${others.length} more`}
            </button>
          )}
          {onAsk && (
            <button
              type="button"
              onClick={() => onAsk(`How does ${active.project.title} show ${query}?`)}
              className="h-7 rounded-full border border-zinc-200 bg-white px-2.5 text-[12.5px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Ask about it
            </button>
          )}
          <Link
            href={active.project.href}
            className="inline-flex h-7 items-center gap-1 rounded-full bg-zinc-900 px-2.5 text-[12.5px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Open
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </span>
      </div>
    </div>
  );
}
