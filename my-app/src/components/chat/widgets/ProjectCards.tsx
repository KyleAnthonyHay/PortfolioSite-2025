'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import type { ProjectCardData, TechStack, Widget } from '@/lib/chat-events';
import WalkthroughPlayer from '@/components/WalkthroughPlayer';

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
          <div className="relative h-full aspect-[9/19.5] overflow-hidden rounded-[14%/6.5%] bg-ink p-[3px] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.35)]">
            <div className="relative h-full w-full overflow-hidden rounded-[13%/6%] bg-white">
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
      className="group block h-full overflow-hidden agent-card transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-[0_20px_40px_-22px_rgba(0,0,0,0.35)] active:scale-[0.99]"
    >
      <Media project={project} className="h-[160px]" />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium text-zinc-900">{project.title}</p>
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            {project.category === 'iOS Apps' ? 'iOS' : project.category === 'macOS Apps' ? 'Mac' : 'Web'}
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
          className="absolute -left-3 top-[76px] hidden h-8 w-8 any-pointer-coarse:h-10 any-pointer-coarse:w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition-all hover:bg-zinc-50 active:scale-95 md:flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}
      {!edges.end && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="absolute -right-3 top-[76px] hidden h-8 w-8 any-pointer-coarse:h-10 any-pointer-coarse:w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 shadow-md transition-all hover:bg-zinc-50 active:scale-95 md:flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

const stackRows: { key: keyof TechStack; label: string }[] = [
  { key: 'frontend', label: 'Frontend' },
  { key: 'backend', label: 'Backend' },
  { key: 'infrastructure', label: 'Infra' },
];

const MAX_CHIPS = 6;

const secondaryButton =
  'inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:text-zinc-900 active:scale-[0.98]';

/**
 * One project in full: the preview on the left, then the story, the stack as
 * labelled chip rows, and the actions. The stack labels sit in a fixed column
 * so the rows line up however the chips wrap.
 */
export function ProjectDetailWidget({ widget }: { widget: Extract<Widget, { kind: 'project' }> }) {
  const { project, overview, techStack } = widget;
  const portrait = project.orientation === 'portrait';
  const kind = project.category === 'iOS Apps' ? 'iOS app' : project.category === 'macOS Apps' ? 'macOS app' : 'Web app';

  return (
    <div className="overflow-hidden agent-card">
      <div className={`grid grid-cols-1 ${portrait ? 'sm:grid-cols-[236px_1fr]' : ''}`}>
        {project.video ? (
          /* The walkthrough stands in for the picture: muted, looping, controls on hover. */
          <div className="relative aspect-[16/9] border-b border-zinc-100 bg-white">
            <WalkthroughPlayer src={project.video.src} poster={project.video.poster} frameless />
          </div>
        ) : (
          <Media
            project={project}
            contain={false}
            className={portrait ? 'h-[300px] sm:h-full sm:min-h-[380px] border-b border-zinc-100 sm:border-b-0 sm:border-r' : 'aspect-[16/10] border-b border-zinc-100'}
          />
        )}

        <div className="p-5 sm:p-6">
          <p className="label">{kind}</p>
          <h3 className="mt-1 text-[19px] font-semibold tracking-tight text-zinc-900">{project.title}</h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-zinc-500">{overview}</p>

          <dl className="mt-5 grid grid-cols-[72px_1fr] gap-x-3 gap-y-2.5 border-t border-zinc-100 pt-4">
            {stackRows.map(({ key, label }) => {
              const items = techStack[key];
              if (!items || items.length === 0) return null;
              const shown = items.slice(0, MAX_CHIPS);
              const rest = items.length - shown.length;
              return (
                <div key={key} className="contents">
                  <dt className="label pt-[5px]">{label}</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {shown.map((item) => (
                      <span key={item} className="rounded-md bg-zinc-100 px-2 py-[3px] text-[12px] leading-[18px] text-zinc-700">
                        {item}
                      </span>
                    ))}
                    {rest > 0 && (
                      <span
                        title={items.slice(MAX_CHIPS).join(', ')}
                        className="rounded-md border border-dashed border-zinc-300 px-2 py-[3px] text-[12px] leading-[18px] text-zinc-400"
                      >
                        +{rest} more
                      </span>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              href={project.href}
              className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 active:scale-[0.98]"
            >
              View project
            </Link>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                Live site <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            )}
            {project.github && (
              <a href={project.github} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
                <FaGithub className="h-3.5 w-3.5" /> GitHub
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
