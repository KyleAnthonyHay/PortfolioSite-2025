'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { ProjectCardData, TechStack, Widget } from '@/lib/chat-events';

/**
 * Project preview. Framed device renders and landscape shots are shown
 * contained on a soft well; a bare portrait screenshot gets a drawn phone
 * frame so it sits beside the rendered devices without looking naked.
 */
export function Media({ project, className = '', contain = true }: { project: ProjectCardData; className?: string; contain?: boolean }) {
  const portrait = project.orientation === 'portrait';
  return (
    <div className={`relative bg-gradient-to-b from-zinc-50 to-zinc-100/70 ${className}`}>
      {portrait && !project.framed ? (
        <div className="absolute inset-[7%] flex items-center justify-center">
          <div className="relative h-full aspect-[9/19] overflow-hidden rounded-[12%/6%] bg-ink p-[3px] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]">
            <div className="relative h-full w-full overflow-hidden rounded-[11%/5.5%] bg-white">
              <Image src={project.image} alt={project.title} fill sizes="120px" className="object-cover object-top" />
            </div>
          </div>
        </div>
      ) : (
        <Image
          src={project.image}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 90vw, 400px"
          className={portrait || contain ? 'object-contain p-3' : 'object-cover object-top'}
        />
      )}
    </div>
  );
}

function CompactCard({ project }: { project: ProjectCardData }) {
  return (
    <Link
      href={project.href}
      className="group block h-full overflow-hidden agent-card transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_20px_40px_-22px_rgba(26,22,19,0.35)] active:scale-[0.99]"
    >
      <Media project={project} className="h-[160px]" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-zinc-900">{project.title}</p>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {project.category === 'iOS Apps' ? 'iOS' : 'Web'}
          </span>
        </div>
        <p className="truncate text-xs text-zinc-400">{project.tagline}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {project.highlights.slice(0, 3).map((tech) => (
            <span key={tech} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

export function ProjectsWidget({ widget }: { widget: Extract<Widget, { kind: 'projects' }> }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () =>
      setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      observer.disconnect();
    };
  }, [widget.projects.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * (el.clientWidth - 80), behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {widget.title && (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-zinc-400">{widget.title}</p>
      )}
      <div
        ref={scroller}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1"
      >
        {widget.projects.map((project) => (
          <div key={project.id} className="w-[200px] shrink-0 snap-start sm:w-[216px]">
            <CompactCard project={project} />
          </div>
        ))}
      </div>
      {!edges.start && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="absolute -left-3 top-[76px] hidden h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition-all hover:bg-zinc-50 active:scale-95 md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute -right-3 top-[76px] hidden h-8 w-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition-all hover:bg-zinc-50 active:scale-95 md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const stackMeta: { key: keyof TechStack; label: string; dot: string }[] = [
  { key: 'frontend', label: 'Frontend', dot: 'bg-blue-500' },
  { key: 'backend', label: 'Backend', dot: 'bg-emerald-500' },
  { key: 'infrastructure', label: 'Infra', dot: 'bg-amber-500' },
];

export function ProjectDetailWidget({ widget }: { widget: Extract<Widget, { kind: 'project' }> }) {
  const { project, overview, techStack } = widget;
  const portrait = project.orientation === 'portrait';

  return (
    <div className="overflow-hidden agent-card">
      <div className={`grid grid-cols-1 ${portrait ? 'sm:grid-cols-[180px_1fr]' : ''}`}>
        <Media project={project} contain={false} className={portrait ? 'h-[240px] sm:h-full sm:min-h-[280px]' : 'aspect-[16/9]'} />
        <div className="p-5">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-zinc-400">
            {project.category === 'iOS Apps' ? 'iOS App' : 'Web App'}
          </p>
          <h3 className="mb-1 text-lg font-semibold tracking-tight text-zinc-900">{project.title}</h3>
          <p className="mb-4 text-sm leading-relaxed text-zinc-500">{overview}</p>

          <div className="mb-4 space-y-2">
            {stackMeta.map(({ key, label, dot }) => {
              const items = techStack[key];
              if (!items || items.length === 0) return null;
              const shown = items.slice(0, 6);
              return (
                <div key={key} className="flex items-start gap-2">
                  <span className="mt-1.5 flex w-16 shrink-0 items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                    {label}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {shown.map((item) => (
                      <span key={item} className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600">
                        {item}
                      </span>
                    ))}
                    {items.length > shown.length && (
                      <span className="px-1 py-0.5 text-[11px] text-zinc-400">+{items.length - shown.length}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={project.href}
              className="inline-flex h-9 items-center rounded-xl bg-ink px-4 text-xs font-medium text-white transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              View project
            </Link>
            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 text-xs font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
              >
                Live site <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {project.github && (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 px-3.5 text-xs font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.98]"
              >
                <FaGithub className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
