import { LEVEL_WORD, VERDICT_WORD, toOnePager } from './onepager';
import { SITE_URL, type BriefView } from './view';

/**
 * The one page as plain text, for the Copy button: the same lines as the web
 * page and the PDF, ready to paste into an email or an ATS note.
 */
export function briefText(view: BriefView, origin = SITE_URL): string {
  const page = toOnePager(view);
  const { candidate } = view;
  const out: string[] = [
    `${candidate.name} · ${candidate.headline} · ${candidate.location}`,
    page.general ? 'General profile, not a role match' : `Prepared for: ${page.title}`,
    '',
    `${VERDICT_WORD[page.verdict.level]}. Recommendation: ${page.verdict.nextStep}. ${page.verdict.reason}`,
    '',
    page.snapshot,
  ];
  if (page.rows.length) {
    out.push('', 'Role match');
    for (const row of page.rows) out.push(`- ${row.requirement}: ${LEVEL_WORD[row.level]} (${row.evidence})`);
    if (page.moreRows > 0) out.push(`- +${page.moreRows} more lower-priority requirements`);
  }
  if (page.why.length) out.push('', 'Why consider him', ...page.why.map((line) => `- ${line}`));
  if (page.work.length) out.push('', 'Relevant work', ...page.work.map((work) => `- ${work.title}: ${work.line}`));
  if (page.validate.length) out.push('', 'To validate', ...page.validate.map((line) => `- ${line}`));
  if (page.questions.length) out.push('', 'Interview questions', ...page.questions.map((line) => `- ${line}`));
  out.push('', `Full brief and PDF: ${origin.replace(/\/$/, '')}/brief/${view.publicId}`, `Contact: ${candidate.email}`);
  return out.join('\n');
}
