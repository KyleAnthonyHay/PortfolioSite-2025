import { describeVisitor, emailKyle, isEmailConfigured, transcriptMarkdown } from './email';
import type { ConversationMessage, VisitorContext, Widget } from './chat-events';
import { fitReportEmailHtml, recruiterBriefEmailHtml } from './report-email';
import { briefTitle, SITE_URL, type BriefView } from './recruiter-brief/view';

type FitReport = Extract<Widget, { kind: 'fit_report' }>;

/** One email per chat and role, however many times the report is rerun. */
const announced = new Set<string>();

const statusLabel = { match: 'Match', related: 'Related', gap: 'Gap' } as const;

/**
 * notify_kyle: emails Kyle-Anthony when a visitor runs a fit check, with the
 * report and the chat so far, so he can follow up the same day. Returns false
 * when there is nothing to send (no key, or already sent for this chat).
 */
export async function notifyFitCheck(input: {
  report: FitReport;
  context?: VisitorContext;
  conversationId?: string;
  transcript: ConversationMessage[];
}): Promise<'sent' | 'skipped' | 'failed'> {
  const { report, context, conversationId, transcript } = input;
  if (!isEmailConfigured()) return 'skipped';
  const role = report.role || context?.role || 'an unnamed role';
  const key = `${conversationId ?? 'anon'}:${role.toLowerCase()}`;
  if (conversationId && announced.has(key)) return 'skipped';
  announced.add(key);

  const { match, related, gap } = report.summary;
  const tally = `${match} match · ${related} related · ${gap} gap`;
  // Render the existing assessment directly: the attachment must agree with the
  // email and card, rather than generating a second assessment or a shorter brief.
  const pdf = await import('./fit-report-pdf')
    .then(({ renderFitReportPdf }) => renderFitReportPdf(report, context))
    .catch((error) => {
      console.error('Fit report PDF could not be generated', error);
      return undefined;
    });
  const attachmentNote = pdf
    ? 'The full fit-check PDF and the chat so far are attached.'
    : 'The chat so far is attached. The PDF could not be generated; the full fit report is included in this email.';
  const filename = `fit-check-${role.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'report'}.pdf`;

  const result = await emailKyle({
    subject: `Fit check: ${role} (${tally})`,
    text: [
      `A visitor ran a fit check on your portfolio agent.`,
      `Role: ${role}`,
      `Visitor: ${describeVisitor(context)}`,
      `Result: ${tally}`,
      '',
      ...report.requirements.map((r) => `- [${statusLabel[r.status]}] ${r.requirement}: ${r.evidence}`),
      '',
      `${attachmentNote} The visitor left no contact details unless they also send you a note.`,
    ].join('\n'),
    html: fitReportEmailHtml(report, context, attachmentNote),
    attachments: [
      ...(pdf ? [{ filename, content: pdf, contentType: 'application/pdf' }] : []),
      { filename: 'chat-transcript.md', content: transcriptMarkdown(transcript, context), contentType: 'text/markdown' },
    ],
  });
  if (!result.ok) announced.delete(key);
  return result.ok ? 'sent' : 'failed';
}

/** One notification for each generated, saved brief, separate from its fit check. */
const announcedBriefs = new Set<string>();

export async function notifyRecruiterBrief(input: {
  view: BriefView;
  context?: VisitorContext;
  transcript: ConversationMessage[];
}): Promise<'sent' | 'skipped' | 'failed'> {
  const { view, context, transcript } = input;
  if (!isEmailConfigured() || announcedBriefs.has(view.publicId)) return 'skipped';
  announcedBriefs.add(view.publicId);
  if (announcedBriefs.size > 500) announcedBriefs.delete(announcedBriefs.values().next().value!);

  try {
    const attachment = await import('./recruiter-brief/pdf')
      .then(async ({ renderBriefPdf, briefPdfFilename }) => ({
        filename: briefPdfFilename(view),
        content: await renderBriefPdf(view),
        contentType: 'application/pdf',
      }))
      .catch((error) => {
        console.error('Recruiter brief PDF could not be generated', error);
        return undefined;
      });
    const url = `${SITE_URL}/brief/${encodeURIComponent(view.publicId)}`;
    const note = attachment
      ? 'The recruiter brief PDF and the chat so far are attached. Open the brief above to view or share it.'
      : 'The PDF could not be attached. Open the saved brief above to view or download it. The chat so far is attached.';
    const result = await emailKyle({
      subject: `Recruiter brief: ${briefTitle(view)}`,
      text: [
        'A visitor created a recruiter brief on your portfolio.',
        `Brief: ${briefTitle(view)}`,
        `Visitor: ${describeVisitor(context)}`,
        `Recommendation: ${view.brief.recommendation.nextStep}. ${view.brief.recommendation.rationale}`,
        `View or download: ${url}`,
        '',
        note,
        'Visitors stay anonymous unless they also leave you a note.',
      ].join('\n'),
      html: recruiterBriefEmailHtml(view, context, note),
      attachments: [
        ...(attachment ? [attachment] : []),
        { filename: 'chat-transcript.md', content: transcriptMarkdown(transcript, context), contentType: 'text/markdown' },
      ],
    });
    if (!result.ok) announcedBriefs.delete(view.publicId);
    return result.ok ? 'sent' : 'failed';
  } catch (error) {
    announcedBriefs.delete(view.publicId);
    console.error('Recruiter brief notification failed', error);
    return 'failed';
  }
}
