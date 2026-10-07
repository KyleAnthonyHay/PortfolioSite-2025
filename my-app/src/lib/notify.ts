import { describeVisitor, emailKyle, escapeHtml, isEmailConfigured, simpleEmailHtml, transcriptMarkdown } from './email';
import type { ConversationMessage, VisitorContext, Widget } from './chat-events';

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
  const list = report.requirements
    .map(
      (r) =>
        `<li style="margin-bottom:6px"><strong>${statusLabel[r.status]}</strong> · ${escapeHtml(r.requirement)}<br><span style="color:#71717a">${escapeHtml(r.evidence)}</span></li>`
    )
    .join('');

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
      'The chat so far is attached. The visitor left no contact details unless they also send you a note.',
    ].join('\n'),
    html: simpleEmailHtml(
      'Someone just ran a fit check',
      [
        ['Role', role],
        ['Visitor', describeVisitor(context)],
        ['Result', tally],
      ],
      `<ul style="padding-left:18px;margin:0 0 14px">${list}</ul>
<p style="color:#71717a;font-size:12px">The chat so far is attached. Visitors stay anonymous unless they also leave you a note.</p>`
    ),
    attachments: [{ filename: 'chat-transcript.md', content: transcriptMarkdown(transcript, context) }],
  });
  if (!result.ok) announced.delete(key);
  return result.ok ? 'sent' : 'failed';
}
