'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';
import type { MatchLevel } from '@/lib/recruiter-brief/types';
import { MATCH_LABEL, RECOMMENDATION_LABEL, briefTitle } from '@/lib/recruiter-brief/view';
import BriefDocument from '@/components/brief/BriefDocument';
import BriefActions from '@/components/brief/BriefActions';

const dot: Record<MatchLevel, string> = {
  strong: 'bg-zinc-900',
  relevant: 'bg-zinc-300',
  gap: 'border border-dashed border-zinc-400',
};

/**
 * The brief in the chat: its verdict and role match at a glance, the whole
 * brief one tap away, and the PDF and share link.
 */
export function RecruiterBriefWidget({ widget }: { widget: Extract<Widget, { kind: 'recruiter_brief' }> }) {
  const { view } = widget;
  const { brief, candidate } = view;
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full overflow-hidden agent-card">
      <div className="flex items-center gap-3 px-4 pt-4">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
          <Image src={candidate.photo} alt="" fill sizes="40px" className="object-cover object-[50%_30%]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-400">Recruiter brief</p>
          <p className="truncate text-sm font-semibold text-zinc-900">{briefTitle(view)}</p>
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] tracking-tight text-zinc-900">{brief.recommendation.nextStep}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">{RECOMMENDATION_LABEL[brief.recommendation.level]}</span>
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">{brief.recommendation.rationale}</p>
      </div>

      {brief.roleMatches.length > 0 && (
        <ul className="mx-4 mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-100">
          {brief.roleMatches.slice(0, open ? 0 : 6).map((match) => (
            <li key={match.requirement} className="flex items-start gap-2.5 px-3 py-2">
              <span className={`mt-[5px] h-2 w-2 shrink-0 rounded-full ${dot[match.assessment]}`} />
              <span className="min-w-0 flex-1 text-[13px] leading-snug text-zinc-700">{match.requirement}</span>
              <span className="shrink-0 text-[11px] text-zinc-400">{match.verificationStatus === 'unknown' ? 'Needs review' : MATCH_LABEL[match.assessment]}</span>
            </li>
          ))}
          {!open && brief.roleMatches.length > 6 && (
            <li className="px-3 py-2 text-[12px] text-zinc-400">+{brief.roleMatches.length - 6} more in the full brief</li>
          )}
        </ul>
      )}

      {open && (
        <div className="mx-3 mt-4 rounded-2xl border border-zinc-100 bg-white p-4 sm:mx-4 sm:p-5">
          <BriefDocument view={view} compact />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3">
        <BriefActions publicId={view.publicId} showOpen size="sm" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900"
        >
          {open ? 'Hide full brief' : 'Preview full brief'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
