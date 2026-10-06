import Image from 'next/image';
import { FiArrowUpRight } from 'react-icons/fi';
import type { MatchLevel, RecommendationLevel } from '@/lib/recruiter-brief/types';
import { MATCH_LABEL, RECOMMENDATION_LABEL, briefTitle, type BriefView } from '@/lib/recruiter-brief/view';

/**
 * The recruiter brief as a page, in the site's own type, cards and dividers.
 * Used by /brief/[publicId] and inside the chat's preview card; the PDF in
 * BriefPdf.tsx follows the same layout.
 */

const eyebrow = 'text-[11px] uppercase tracking-widest text-zinc-400 font-medium';
const card = 'bg-white rounded-[1.5rem] border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)]';

const chip: Record<MatchLevel, string> = {
  strong: 'bg-zinc-900 text-white',
  relevant: 'bg-zinc-100 text-zinc-700',
  gap: 'border border-dashed border-zinc-300 text-zinc-400',
};

const verdict: Record<RecommendationLevel, string> = {
  advance: 'bg-zinc-900 text-white',
  screen: 'bg-zinc-100 text-zinc-700',
  conditional: 'bg-zinc-100 text-zinc-700',
  decline: 'border border-zinc-300 text-zinc-600',
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function Section({ label, children, compact }: { label: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <section className={compact ? 'border-t border-zinc-200/60 pt-8 mt-8' : 'border-t border-zinc-200/60 pt-12 mt-12'}>
      <p className={`${eyebrow} mb-6`}>{label}</p>
      {children}
    </section>
  );
}

export default function BriefDocument({ view, compact = false }: { view: BriefView; compact?: boolean }) {
  const { candidate, brief, projects, projectNames } = view;
  const title = briefTitle(view);
  const required = brief.roleMatches.filter((m) => m.required);
  const optional = brief.roleMatches.filter((m) => !m.required);

  return (
    <article className="text-zinc-900">
      {/* Candidate header */}
      <header>
        <p className={`${eyebrow} mb-6`}>
          Recruiter brief · {formatDate(view.createdAt)}
        </p>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className={`relative shrink-0 overflow-hidden rounded-2xl shadow-[0_12px_28px_-14px_rgba(0,0,0,0.3)] ${compact ? 'h-14 w-14' : 'h-20 w-20'}`}>
              <Image src={candidate.photo} alt={candidate.name} fill sizes="80px" className="object-cover object-[50%_30%]" />
            </div>
            <div className="min-w-0">
              <h1 className={`${compact ? 'text-2xl' : 'text-4xl md:text-5xl'} tracking-tighter leading-none text-zinc-900`}>{candidate.name}</h1>
              <p className="mt-2 text-sm text-zinc-500">
                {candidate.headline} · {candidate.location}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`mailto:${candidate.email}?subject=${encodeURIComponent(`${title}: next steps`)}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98]"
            >
              Contact Kyle-Anthony
            </a>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-zinc-500">
          {candidate.links.map((link) => (
            <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900">
              {link.display}
            </a>
          ))}
          <a href={`mailto:${candidate.email}`} className="underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-900">
            {candidate.email}
          </a>
        </div>
      </header>

      {/* Role and snapshot */}
      <section className={compact ? 'mt-8' : 'mt-12'}>
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`${eyebrow} mb-2`}>{view.roleTitle ? 'Prepared for' : 'Candidate snapshot'}</p>
              <p className="text-xl tracking-tight text-zinc-900">{title}</p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${verdict[brief.recommendation.level]}`}>
              {brief.recommendation.nextStep}
            </span>
          </div>
          <p className="mt-5 text-base leading-relaxed text-zinc-500 max-w-[68ch]">{brief.candidateSummary}</p>
        </div>
      </section>

      {/* Role match */}
      {brief.roleMatches.length > 0 && (
        <Section label="Role match" compact={compact}>
          <div className="mb-5 flex flex-wrap gap-2 text-[11px] text-zinc-500">
            {(['strong', 'relevant', 'gap'] as MatchLevel[]).map((level) => (
              <span key={level} className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${level === 'strong' ? 'bg-zinc-900' : level === 'relevant' ? 'bg-zinc-300' : 'border border-dashed border-zinc-400'}`} />
                {MATCH_LABEL[level]} {brief.roleMatches.filter((m) => m.assessment === level).length}
              </span>
            ))}
          </div>
          <div className={`${card} divide-y divide-zinc-100 overflow-hidden`}>
            {[...required, ...optional].map((match) => (
              <div key={match.requirement} className="grid gap-2 px-5 py-4 md:grid-cols-[minmax(0,1fr)_110px_minmax(0,1.2fr)] md:items-start md:gap-6 md:px-6">
                <p className="text-sm font-medium leading-snug text-zinc-900">
                  {match.requirement}
                  {match.core && <span className="ml-2 align-middle text-[10px] uppercase tracking-widest text-zinc-400">The role</span>}
                  {!match.required && <span className="ml-2 align-middle text-[10px] uppercase tracking-widest text-zinc-400">Nice to have</span>}
                </p>
                <span className={`inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${chip[match.assessment]}`}>
                  {MATCH_LABEL[match.assessment]}
                </span>
                <div>
                  <p className="text-[13px] leading-relaxed text-zinc-500">{match.evidence}</p>
                  {match.projectIds.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      {match.projectIds.map((id) =>
                        projectNames[id] ? (
                          <a key={id} href={projectNames[id].href} className="rounded-md bg-zinc-50 border border-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 transition-colors hover:text-zinc-900">
                            {projectNames[id].title}
                          </a>
                        ) : null
                      )}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Why */}
      {brief.reasonsToConsider.length > 0 && (
        <Section label={view.roleTitle ? 'Why Kyle-Anthony for this role' : 'Why Kyle-Anthony'} compact={compact}>
          <div className={`grid gap-5 ${brief.reasonsToConsider.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
            {brief.reasonsToConsider.map((reason) => (
              <div key={reason.title} className={`${card} p-6`}>
                <h3 className="text-[15px] font-medium tracking-tight text-zinc-900">{reason.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{reason.explanation}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Work */}
      {projects.length > 0 && (
        <Section label="Most relevant work" compact={compact}>
          <div className="space-y-5">
            {projects.map((project) => (
              <div key={project.id} className={`${card} grid gap-6 p-5 md:grid-cols-[220px_minmax(0,1fr)] md:p-6`}>
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-zinc-50 border border-zinc-100">
                  <Image src={project.image} alt={project.title} fill sizes="220px" className="object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <p className={`${eyebrow} mb-1.5`}>{project.category}</p>
                  <h3 className="text-xl tracking-tight text-zinc-900">{project.title}</h3>
                  <p className="mt-1 text-sm text-zinc-500">{project.tagline}</p>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-700">
                    <span className="font-medium text-zinc-900">Why it matters: </span>
                    {project.relevance}
                  </p>
                  {project.evidence.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {project.evidence.map((line) => (
                        <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-zinc-500">
                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  )}
                  <a href={project.href} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900">
                    View project <FiArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Standout */}
      {brief.standoutSignal && (
        <Section label="What stands out" compact={compact}>
          <p className={`${compact ? 'text-2xl' : 'text-3xl md:text-4xl'} tracking-tighter leading-tight text-zinc-900 max-w-[24ch]`}>{brief.standoutSignal.title}</p>
          <p className="mt-4 text-base leading-relaxed text-zinc-500 max-w-[65ch]">{brief.standoutSignal.explanation}</p>
        </Section>
      )}

      {/* Validate */}
      {brief.validationAreas.length > 0 && (
        <Section label="Areas to validate" compact={compact}>
          <ul className="space-y-3 max-w-[70ch]">
            {brief.validationAreas.map((area) => (
              <li key={area} className="flex gap-3 text-[15px] leading-relaxed text-zinc-600">
                <span className="mt-[9px] h-2 w-2 shrink-0 rounded-full border border-zinc-400" />
                {area}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Questions */}
      {brief.interviewQuestions.length > 0 && (
        <Section label="Suggested interview questions" compact={compact}>
          <ol className="space-y-6">
            {brief.interviewQuestions.map((question, i) => (
              <li key={question.question} className="grid grid-cols-[28px_minmax(0,1fr)] gap-2">
                <span className="text-sm font-medium tabular-nums text-zinc-300">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="text-base leading-snug tracking-tight text-zinc-900">“{question.question}”</p>
                  {question.rationale && (
                    <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
                      <span className="font-medium text-zinc-700">Why ask: </span>
                      {question.rationale}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Recommendation */}
      <Section label="Recommendation" compact={compact}>
        <div className={`${card} p-6 md:p-8`}>
          <div className="flex flex-wrap items-center gap-3">
            <p className={`${compact ? 'text-xl' : 'text-2xl'} tracking-tight text-zinc-900`}>{brief.recommendation.nextStep}</p>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${verdict[brief.recommendation.level]}`}>
              {RECOMMENDATION_LABEL[brief.recommendation.level]}
            </span>
          </div>
          <p className="mt-3 text-base leading-relaxed text-zinc-500 max-w-[68ch]">{brief.recommendation.rationale}</p>
        </div>
      </Section>

      <p className="mt-10 text-xs leading-relaxed text-zinc-400 max-w-[80ch]">
        Prepared by the AI agent on {candidate.name}&apos;s portfolio from his project write-ups. Every claim above cites a write-up and was checked by a second model
        {brief.verification ? ` (${brief.verification.checked} checked, ${brief.verification.rewritten} rewritten, ${brief.verification.removed} removed)` : ''}. Requirements it could not find evidence for are
        listed as gaps. There are no scores, because a portfolio can&apos;t support that precision.
      </p>
    </article>
  );
}
