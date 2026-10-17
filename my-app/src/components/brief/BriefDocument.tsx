import { profile } from '@/lib/profile';
import Image from 'next/image';
import Link from 'next/link';
import { CircleCheck, CircleDot, CircleMinus } from 'lucide-react';
import type { FitStatus } from '@/lib/chat-events';
import { STATUS_COLOR, STATUS_LABEL } from '@/lib/fit-status';
import { VERDICT_WORD, toFitSheet } from '@/lib/recruiter-brief/sheet';
import type { BriefView } from '@/lib/recruiter-brief/view';

/**
 * The brief is the fit check: who it's for, the recommendation, and every
 * requirement with its evidence and projects, laid out like the chat's fit
 * card. BriefPdf.tsx sets the same rows from the same toFitSheet().
 */

const eyebrow = 'text-[11px] uppercase tracking-widest text-zinc-400 font-medium';
const ICON: Record<FitStatus, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = { match: CircleCheck, related: CircleDot, gap: CircleMinus };

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BriefDocument({ view, compact = false }: { view: BriefView; compact?: boolean }) {
  const { candidate } = view;
  const sheet = toFitSheet(view);
  const positive = sheet.verdict.level === 'advance' || sheet.verdict.level === 'screen';

  return (
    <article className={`text-zinc-900 ${compact ? '' : 'rounded-[1.5rem] border border-slate-200/50 bg-white p-5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] sm:p-8 md:p-12'}`}>
      <header className="flex flex-wrap items-center gap-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
          <Image src={candidate.photo} alt={candidate.name} fill sizes="56px" className="object-cover object-[50%_30%]" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-[28px] leading-none tracking-tighter text-zinc-900">{candidate.name}</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            {candidate.headline} · {candidate.location}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
          {candidate.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-zinc-900">
              {link.label}
            </a>
          ))}
          <a href={`mailto:${candidate.email}?cc=${encodeURIComponent(profile.emailCc)}`} className="transition-colors hover:text-zinc-900">
            Email
          </a>
        </div>
      </header>

      <section className="mt-10">
        <p className={eyebrow}>Fit check</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="text-2xl tracking-tight text-zinc-900">{sheet.general ? 'General profile, not a role match' : sheet.title}</h2>
          <p className={`flex items-center gap-2 text-[15px] font-medium ${positive ? 'text-emerald-600' : 'text-zinc-700'}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${positive ? 'bg-emerald-500' : 'bg-zinc-400'}`} aria-hidden />
            {VERDICT_WORD[sheet.verdict.level]}
          </p>
        </div>
        <p className={`mt-4 max-w-[70ch] border-l-2 pl-3 text-[15px] leading-relaxed text-zinc-700 ${positive ? 'border-emerald-500' : 'border-zinc-300'}`}>
          <span className="font-medium text-zinc-900">Recommendation: {sheet.verdict.nextStep}.</span> {sheet.verdict.reason}
        </p>
      </section>

      {sheet.rows.length > 0 && (
        <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200/80">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
            <p className={eyebrow}>Requirements</p>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['match', 'related', 'gap'] as FitStatus[]).map((status) => (
                <span key={status} className="rounded-full px-2 py-0.5 text-[11px] font-medium" style={STATUS_COLOR[status]}>
                  {sheet.summary[status]} {STATUS_LABEL[status].toLowerCase()}
                </span>
              ))}
            </div>
          </div>
          <p className="px-4 py-2 text-xs text-zinc-500">Based on documented evidence. Confirm unrecorded experience with Kyle-Anthony.</p>
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {sheet.rows.map((row) => {
              const Icon = ICON[row.status];
              return (
                <li key={row.requirement} className="flex gap-3 px-4 py-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: row.status === 'match' ? '#059669' : row.status === 'related' ? '#6b4f8a' : '#a1a1aa' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-sm font-medium text-zinc-900">{row.requirement}</p>
                      <span className="text-[11px] font-medium" style={{ color: STATUS_COLOR[row.status].color }}>
                        {STATUS_LABEL[row.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-500">{row.evidence}</p>
                    {row.projects.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {row.projects.map((project) => (
                          <Link
                            key={project.id}
                            href={project.href}
                            className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white py-0.5 pl-0.5 pr-2 text-[11px] text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                          >
                            <span className="relative h-4 w-4 overflow-hidden rounded-full bg-zinc-100">
                              {project.image && <Image src={project.image} alt="" fill sizes="16px" className="object-cover object-top" />}
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
        </section>
      )}

      <p className="mt-8 text-xs text-zinc-400">
        Generated {formatDate(view.createdAt)} by the AI agent on his portfolio, from his project write-ups and résumé. Every claim was checked against them; no scores.
      </p>
    </article>
  );
}
