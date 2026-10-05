'use client';

import Link from 'next/link';
import { ChevronRight, CircleCheck, CircleMinus } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';
import { Media } from './ProjectCards';

export function ExperienceCheckWidget({ widget }: { widget: Extract<Widget, { kind: 'experience_check' }> }) {
  const { technology, hasExperience, years, since, category, projects, related } = widget;

  const meta = [
    years ? `${years} ${years === 1 ? 'year' : 'years'}` : null,
    since ? `since ${since}` : null,
    hasExperience && projects.length > 0 ? `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}` : null,
    category && category !== 'Discipline' ? category : null,
  ].filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            hasExperience ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          {hasExperience ? <CircleCheck className="h-5 w-5" /> : <CircleMinus className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">{technology}</p>
          <p className="truncate text-xs text-zinc-400">
            {hasExperience ? meta.join(' · ') || 'Listed in his background' : 'No direct evidence in the portfolio'}
          </p>
        </div>
      </div>

      {projects.length > 0 && (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
          {projects.map(({ project, usage }) => (
            <li key={project.id}>
              <Link href={project.href} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-zinc-50">
                <Media project={project} className="h-11 w-11 shrink-0 overflow-hidden rounded-lg" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900">{project.title}</span>
                  <span className="line-clamp-1 text-xs text-zinc-500">{usage}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!hasExperience && related.length > 0 && (
        <div className="border-t border-zinc-100 px-4 py-3">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">Closest strengths</p>
          <div className="flex flex-wrap gap-1">
            {related.map((item) => (
              <span key={item} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
