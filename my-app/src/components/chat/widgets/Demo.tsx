'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Globe, Play, RotateCw } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';
import WalkthroughPlayer from '@/components/WalkthroughPlayer';
import { ArcSpinner } from '../ActivitySteps';

/**
 * A product, running in the chat: the walkthrough recording, or the live app
 * in a browser-chrome frame. When both exist a segmented control switches
 * between them; the frame only loads once its tab is opened.
 */
export function DemoWidget({ widget }: { widget: Extract<Widget, { kind: 'demo' }> }) {
  const { project, video, liveUrl, appStoreUrl } = widget;
  const [view, setView] = useState<'video' | 'live'>(widget.initial);
  const [opened, setOpened] = useState(widget.initial === 'live');
  const [loaded, setLoaded] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const native = project.category !== 'Web Apps';
  const liveLabel = native ? 'Website' : 'Live app';
  const host = liveUrl ? new URL(liveUrl).hostname.replace(/^www\./, '') : '';

  const tabs = [
    video && { key: 'video' as const, label: 'Walkthrough', icon: Play },
    liveUrl && { key: 'live' as const, label: liveLabel, icon: Globe },
  ].filter((tab): tab is { key: 'video' | 'live'; label: string; icon: typeof Play } => Boolean(tab));

  const show = (next: 'video' | 'live') => {
    setView(next);
    if (next === 'live') setOpened(true);
  };

  return (
    <div className="overflow-hidden agent-card">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <Link href={project.href} className="block truncate text-sm font-semibold text-zinc-900 hover:underline">
            {project.title}
          </Link>
          <p className="truncate text-xs text-zinc-500">{project.tagline}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
        {appStoreUrl && (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1 rounded-full bg-zinc-900 px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-zinc-800"
          >
            App Store
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        )}
        {tabs.length > 1 && (
          <div role="tablist" aria-label="Demo view" className="flex shrink-0 rounded-full bg-zinc-100 p-0.5">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => show(key)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-all ${
                  view === key ? 'bg-white text-ink shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : 'text-zinc-500 hover:text-ink'
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>
        )}
        </div>
      </div>

      {video && view === 'video' && (
        <div className="relative aspect-[16/9] border-t border-zinc-100 bg-white">
          <WalkthroughPlayer src={video.src} poster={video.poster} frameless />
        </div>
      )}

      {liveUrl && opened && (
        <div className={view === 'live' ? 'border-t border-zinc-100' : 'hidden'}>
          <div className="flex h-10 items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-3">
            <div className="flex shrink-0 gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mx-auto max-w-[22rem] truncate rounded-md border border-zinc-200/70 bg-white px-3 py-1 text-center text-[11px] text-zinc-400">{host}</div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLoaded(false);
                setFrameKey((key) => key + 1);
              }}
              aria-label="Reload"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-ink"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${host} in a new tab`}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-ink"
            >
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
          <div className="relative h-[420px] bg-white sm:h-[520px]">
            {!loaded && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-[13px] text-zinc-400">
                <ArcSpinner className="h-4 w-4 text-zinc-500" />
                Loading {host}
              </div>
            )}
            <iframe
              key={frameKey}
              src={liveUrl}
              title={`${project.title}, live`}
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="strict-origin-when-cross-origin"
              className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
