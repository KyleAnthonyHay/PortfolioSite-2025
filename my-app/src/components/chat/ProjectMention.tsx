'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { projectById, toCard } from '@/lib/project-catalog';
import { Media } from './widgets/ProjectCards';

/**
 * An inline project name. Hovering shows a preview card; clicking opens the
 * project page, which is also what happens on touch devices.
 */
export default function ProjectMention({ id, children }: { id: number; children: React.ReactNode }) {
  const catalogProject = projectById(id);
  if (!catalogProject) return <>{children}</>;
  const project = toCard(catalogProject);

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link
          href={project.href}
          className="font-medium text-zinc-900 underline decoration-dotted decoration-zinc-400 underline-offset-[3px] transition-colors hover:decoration-zinc-900"
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-72 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white p-0 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.25)]"
      >
        <Media project={project} className="h-36" />
        <div className="p-4">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-zinc-900">{project.title}</p>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              {project.category === 'iOS Apps' ? 'iOS' : project.category === 'macOS Apps' ? 'Mac' : 'Web'}
            </span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-zinc-500">{project.tagline}</p>
          <div className="mb-3 flex flex-wrap gap-1">
            {project.highlights.slice(0, 4).map((tech) => (
              <span key={tech} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
                {tech}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Link
              href={project.href}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-lg bg-ink px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800"
            >
              View project
            </Link>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Live site"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50"
              >
                <FaGithub className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
