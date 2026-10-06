import Image from 'next/image';
import type { MatchLevel } from '@/lib/recruiter-brief/types';
import type { BriefView } from '@/lib/recruiter-brief/view';
import { ACCENT, LEVEL_WORD, VERDICT_WORD, toOnePager } from '@/lib/recruiter-brief/onepager';

/**
 * The recruiter brief as one page, in the site's type and its one accent
 * colour. BriefPdf.tsx sets the same content from the same toOnePager().
 */

const eyebrow = 'text-[11px] uppercase tracking-widest text-zinc-400 font-medium';

function Dot({ level }: { level: MatchLevel }) {
  // Strong: filled accent. Relevant: accent ring. Gap: grey ring.
  const style =
    level === 'strong'
      ? { background: ACCENT, borderColor: ACCENT }
      : level === 'relevant'
        ? { background: 'transparent', borderColor: ACCENT }
        : { background: 'transparent', borderColor: '#d4d4d8' };
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border-2" style={style} aria-hidden />;
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BriefDocument({ view, compact = false }: { view: BriefView; compact?: boolean }) {
  const { candidate } = view;
  const page = toOnePager(view);
  const positive = page.verdict.level === 'advance' || page.verdict.level === 'screen';

  return (
    <article className={`text-zinc-900 ${compact ? '' : 'rounded-[1.5rem] border border-slate-200/50 bg-white p-8 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] md:p-12'}`}>
      {/* Header */}
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
          <a href={`mailto:${candidate.email}`} className="transition-colors hover:text-zinc-900">
            Email
          </a>
        </div>
      </header>

      {/* Role and verdict */}
      <section className="mt-10">
        <p className={eyebrow}>{page.general ? 'Candidate profile' : 'Prepared for'}</p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 className="text-2xl tracking-tight text-zinc-900">{page.general ? 'General profile, not a role match' : page.title}</h2>
          <p className="flex items-center gap-2 text-[15px] font-medium" style={{ color: positive ? ACCENT : '#3f3f46' }}>
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: positive ? ACCENT : '#a1a1aa' }} aria-hidden />
            {VERDICT_WORD[page.verdict.level]}
          </p>
        </div>
        <p className="mt-4 max-w-[68ch] text-[15px] leading-relaxed text-zinc-600">{page.snapshot}</p>
        <p className="mt-4 max-w-[70ch] border-l-2 pl-3 text-[15px] leading-relaxed text-zinc-700" style={{ borderColor: positive ? ACCENT : '#d4d4d8' }}>
          <span className="font-medium text-zinc-900">Recommendation: {page.verdict.nextStep}.</span> {page.verdict.reason}
        </p>
      </section>

      {/* Role match */}
      {page.rows.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <p className={eyebrow}>Role match</p>
            <p className="flex items-center gap-4 text-xs text-zinc-400">
              {(['strong', 'relevant', 'gap'] as MatchLevel[]).map((level) => (
                <span key={level} className="inline-flex items-center gap-1.5">
                  <Dot level={level} />
                  {LEVEL_WORD[level]}
                </span>
              ))}
            </p>
          </div>
          <ul className="mt-3 divide-y divide-zinc-100 border-y border-zinc-100">
            {page.rows.map((row) => (
              <li key={row.requirement} className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-x-6 py-3 sm:grid-cols-[minmax(0,1.3fr)_96px_minmax(0,1fr)]">
                <p className="text-[15px] leading-snug text-zinc-900">{row.requirement}</p>
                <p className="flex items-center gap-2 text-sm text-zinc-700">
                  <Dot level={row.level} />
                  {LEVEL_WORD[row.level]}
                </p>
                <p className={`col-span-2 mt-1 text-sm leading-snug sm:col-span-1 sm:mt-0 ${row.level === 'gap' ? 'text-zinc-400' : 'text-zinc-600'}`}>{row.evidence}</p>
              </li>
            ))}
          </ul>
          {page.moreRows > 0 && <p className="mt-2 text-xs text-zinc-400">+{page.moreRows} more lower-priority requirements not shown</p>}
        </section>
      )}

      {/* Why and work */}
      <section className="mt-10 grid gap-10 sm:grid-cols-2">
        {page.why.length > 0 && (
          <div>
            <p className={eyebrow}>Why consider him</p>
            <ul className="mt-3 space-y-2">
              {page.why.map((line) => (
                <li key={line} className="flex items-baseline gap-2.5 text-[15px] leading-snug text-zinc-800">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACCENT }} aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {page.work.length > 0 && (
          <div>
            <p className={eyebrow}>Most relevant work</p>
            <ul className="mt-3 space-y-2.5">
              {page.work.map((project) => (
                <li key={project.title} className="text-[15px] leading-snug">
                  <a href={project.href} className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900">
                    {project.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Validate and questions */}
      <section className="mt-10 grid gap-10 sm:grid-cols-2">
        {page.validate.length > 0 && (
          <div>
            <p className={eyebrow}>To validate</p>
            <ul className="mt-3 space-y-2">
              {page.validate.map((line) => (
                <li key={line} className="flex items-baseline gap-2.5 text-[15px] leading-snug text-zinc-700">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full border border-zinc-400" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        )}
        {page.questions.length > 0 && (
          <div>
            <p className={eyebrow}>Ask in the interview</p>
            <ol className="mt-3 space-y-2">
              {page.questions.map((question, i) => (
                <li key={question} className="flex gap-2.5 text-[15px] leading-snug text-zinc-700">
                  <span className="tabular-nums text-zinc-300">{i + 1}</span>
                  {question}
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <p className="mt-8 text-xs text-zinc-400">
        Generated {formatDate(view.createdAt)} by the AI agent on his portfolio, from his project write-ups and résumé. Every claim was checked against them; no scores.
      </p>
    </article>
  );
}
