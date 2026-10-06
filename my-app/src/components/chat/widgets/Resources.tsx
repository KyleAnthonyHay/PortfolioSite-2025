'use client';

/* eslint-disable @next/next/no-img-element -- previews come from arbitrary sites, so next/image can't whitelist them. */

import { useState } from 'react';
import { ArrowUpRight, Globe } from 'lucide-react';
import { FaApple, FaGithub } from 'react-icons/fa';
import type { ProjectResource, Widget } from '@/lib/chat-events';

const typeLabel: Record<ProjectResource['type'], string> = {
  website: 'Website',
  github: 'GitHub',
  'app-store': 'App Store',
  demo: 'Demo',
  video: 'Video',
  docs: 'Docs',
  'case-study': 'Case study',
};

function TypeIcon({ type }: { type: ProjectResource['type'] }) {
  if (type === 'github') return <FaGithub className="h-3.5 w-3.5" />;
  if (type === 'app-store') return <FaApple className="h-3.5 w-3.5" />;
  return <Globe className="h-3.5 w-3.5" />;
}

/** Fallback when a link has no usable preview image: a repo-style card for GitHub, a plain one otherwise. */
function Fallback({ resource }: { resource: ProjectResource }) {
  const path = resource.type === 'github' ? new URL(resource.url).pathname.replace(/^\//, '') : resource.domain;
  return (
    <div className="flex h-full flex-col justify-center gap-1 bg-gradient-to-br from-zinc-50 to-zinc-100 px-4">
      <span className="flex items-center gap-1.5 text-zinc-500">
        <TypeIcon type={resource.type} />
        <span className="text-[11px] font-medium">{typeLabel[resource.type]}</span>
      </span>
      <span className="truncate font-mono text-[13px] font-semibold text-zinc-800">{path}</span>
    </div>
  );
}

function ResourceCard({ resource }: { resource: ProjectResource }) {
  const [broken, setBroken] = useState(false);
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex w-[240px] shrink-0 flex-col overflow-hidden agent-card transition-all hover:-translate-y-0.5 hover:border-zinc-300"
    >
      <div className="relative aspect-[1.91/1] overflow-hidden border-b border-zinc-100 bg-zinc-50">
        {resource.image && !broken ? (
          <img
            src={resource.image}
            alt=""
            loading="lazy"
            onError={() => setBroken(true)}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <Fallback resource={resource} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <img
            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(resource.domain)}&sz=32`}
            alt=""
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="truncate">{resource.domain}</span>
          <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-600" />
        </span>
        <span className="line-clamp-1 text-[13px] font-medium text-zinc-900">{resource.title}</span>
        {resource.description && <span className="line-clamp-2 text-[12px] leading-snug text-zinc-500">{resource.description}</span>}
      </div>
    </a>
  );
}

export function ResourcesWidget({ widget }: { widget: Extract<Widget, { kind: 'resources' }> }) {
  return (
    <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none]">
      {widget.resources.map((resource) => (
        <ResourceCard key={resource.url} resource={resource} />
      ))}
    </div>
  );
}
