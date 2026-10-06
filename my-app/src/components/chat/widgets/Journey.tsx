'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { JourneyNode, Widget } from '@/lib/chat-events';

/*
 * Development journey as a flowchart on a dotted canvas, in the style of
 * Beautiful UI's Flowchart (MIT, © 2026 Shane Levine, beautifului.dev):
 * a coloured kind pill above each step card, joined by connectors.
 */

const kindMeta: Record<JourneyNode['kind'], { label: string; hue: string }> = {
  start: { label: 'Start', hue: '#9a5cff' },
  work: { label: 'Work', hue: '#3b82f6' },
  education: { label: 'Education', hue: '#f09a2f' },
  project: { label: 'Project', hue: '#71717a' },
  launch: { label: 'Shipped', hue: '#10b981' },
};

const mix = (hue: string, pct: number) => `color-mix(in srgb, ${hue} ${pct}%, white)`;

const COLLAPSED = 5;

function Step({ node, last }: { node: JourneyNode; last: boolean }) {
  const meta = kindMeta[node.kind];
  return (
    <li className="flex flex-col items-center">
      <span
        className="mb-1.5 inline-flex h-5 items-center rounded-full px-2 text-[10.5px] font-semibold"
        style={{ background: mix(meta.hue, 14), color: meta.hue }}
      >
        {meta.label} · {node.period}
      </span>
      <div
        className="w-full max-w-[340px] rounded-2xl border bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-14px_rgba(0,0,0,0.25)]"
        style={{ borderColor: mix(meta.hue, 30) }}
      >
        <p className="text-[13px] font-semibold leading-snug text-zinc-900">{node.title}</p>
        {node.caption && <p className="mt-0.5 text-[12px] leading-relaxed text-zinc-500">{node.caption}</p>}
        {node.projects && node.projects.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {node.projects.map((project) => (
              <Link
                key={project.id}
                href={project.href}
                className="inline-flex h-[22px] items-center rounded-md bg-zinc-100 px-1.5 text-[11px] font-medium text-zinc-600 ring-1 ring-inset ring-zinc-200/70 transition-colors hover:bg-zinc-200/70 hover:text-zinc-900"
              >
                {project.title}
              </Link>
            ))}
          </div>
        )}
      </div>
      {!last && <span className="my-1 h-6 w-px bg-zinc-300" aria-hidden />}
    </li>
  );
}

export function JourneyWidget({ widget }: { widget: Extract<Widget, { kind: 'journey' }> }) {
  const [expanded, setExpanded] = useState(false);
  const nodes = widget.nodes;
  // Most recent steps matter most, so the collapsed view shows the latest ones.
  const visible = expanded || nodes.length <= COLLAPSED ? nodes : nodes.slice(-COLLAPSED);
  const hidden = nodes.length - visible.length;

  return (
    <div
      className="overflow-hidden agent-card px-4 py-5"
      style={{
        backgroundImage: 'radial-gradient(circle, #e4e4e7 1px, transparent 1.2px)',
        backgroundSize: '16px 16px',
        backgroundPosition: '8px 8px',
      }}
    >
      {hidden > 0 && (
        <div className="mb-3 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-600 shadow-sm transition-colors hover:text-zinc-900"
          >
            <ChevronDown className="h-3.5 w-3.5 rotate-180" />
            {hidden} earlier {hidden === 1 ? 'step' : 'steps'}
          </button>
        </div>
      )}
      <ol className="flex flex-col">
        {visible.map((node, index) => (
          <Step key={node.id} node={node} last={index === visible.length - 1} />
        ))}
      </ol>
    </div>
  );
}
