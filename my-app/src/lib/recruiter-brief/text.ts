import { STATUS_LABEL, VERDICT_WORD, toFitSheet } from './sheet';
import { SITE_URL, type BriefView } from './view';

/**
 * The fit check as plain text, for the Copy button: the same rows as the web
 * page and the PDF, ready to paste into an email or an ATS note.
 */
export function briefText(view: BriefView, origin = SITE_URL): string {
  const sheet = toFitSheet(view);
  const { candidate } = view;
  const out: string[] = [
    `${candidate.name} · ${candidate.headline} · ${candidate.location}`,
    sheet.general ? 'General profile, not a role match' : `Fit check: ${sheet.title}`,
    '',
    `${VERDICT_WORD[sheet.verdict.level]}. Recommendation: ${sheet.verdict.nextStep}. ${sheet.verdict.reason}`,
  ];
  if (sheet.rows.length) {
    out.push('', `Requirements (${sheet.summary.match} supported, ${sheet.summary.related} to confirm, ${sheet.summary.gap} gaps)`);
    for (const row of sheet.rows) {
      out.push(`- ${row.requirement}: ${STATUS_LABEL[row.status]}. ${row.evidence}${row.projects.length ? ` (${row.projects.map((p) => p.title).join(', ')})` : ''}`);
    }
  }
  if (sheet.questions.length) out.push('', 'Ask in the interview', ...sheet.questions.map((q, i) => `${i + 1}. ${q}`));
  out.push('', `Full brief and PDF: ${origin.replace(/\/$/, '')}/brief/${view.publicId}`, `Contact: ${candidate.email}`);
  return out.join('\n');
}
