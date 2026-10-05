'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CircleCheck, CircleDot, CircleMinus } from 'lucide-react';
import type { FitStatus, Widget } from '@/lib/chat-events';

const statusMeta: Record<FitStatus, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; chip: string }> = {
  match: { label: 'Match', icon: CircleCheck, color: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-700' },
  related: { label: 'Related', icon: CircleDot, color: 'text-amber-500', chip: 'bg-amber-50 text-amber-700' },
  gap: { label: 'Gap', icon: CircleMinus, color: 'text-zinc-400', chip: 'bg-zinc-100 text-zinc-500' },
};

export function FitReportWidget({ widget }: { widget: Extract<Widget, { kind: 'fit_report' }> }) {
  const { role, requirements, summary } = widget;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Fit report</p>
          {role && <p className="text-sm font-semibold text-zinc-900">{role}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          {(['match', 'related', 'gap'] as FitStatus[]).map((status) => (
            <span key={status} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusMeta[status].chip}`}>
              {summary[status]} {statusMeta[status].label.toLowerCase()}
            </span>
          ))}
        </div>
      </div>
      <ul className="divide-y divide-zinc-100">
        {requirements.map((item) => {
          const meta = statusMeta[item.status];
          const Icon = meta.icon;
          return (
            <li key={item.requirement} className="flex gap-3 px-4 py-3">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${meta.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">{item.requirement}</p>
                <p className="text-xs leading-relaxed text-zinc-500">{item.evidence}</p>
                {item.projects.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {item.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={project.href}
                        className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white py-0.5 pl-0.5 pr-2 text-[11px] text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                      >
                        <span className="relative h-4 w-4 overflow-hidden rounded-full bg-zinc-100">
                          <Image src={project.image} alt="" fill sizes="16px" className="object-cover object-top" />
                        </span>
                        {project.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
