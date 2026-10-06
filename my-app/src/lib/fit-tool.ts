import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ConversationMessage, FitRequirement, VisitorContext } from './chat-events';
import { projectById, toCard } from './project-catalog';
import { MAX_REQUIREMENTS } from './tools';
import { describeCeiling, evaluateFit, STATUS_FOR, type FitEvaluation } from './recruiter-brief/generate';
import { findPosting, looksLikePosting } from './recruiter-brief/tool';

/**
 * The newest fit evaluation per chat, so a brief made afterwards reuses the
 * exact rows the visitor saw. In memory: after a restart the brief evaluates
 * again with the same pipeline.
 */
const evaluations = new Map<string, FitEvaluation>();

export function lastEvaluation(conversationId?: string): FitEvaluation | undefined {
  return conversationId ? evaluations.get(conversationId) : undefined;
}

const URL_IN_TEXT = /https?:\/\/\S+/i;

function normalizeRole(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\b(senior|sr|junior|jr|staff|lead|principal|the|role)\b/g, '').trim();
}

/** Loose match, so "Full Stack Engineer" and "Full-Stack Engineer, Growth" count as the same role. */
export function sameRole(a: string, b: string): boolean {
  const x = normalizeRole(a);
  const y = normalizeRole(b);
  return x === y || x.includes(y) || y.includes(x);
}

/** A requirement list typed in this message, as opposed to "is he a fit?" leaning on an earlier posting. */
function typedRequirements(message: string, requirements?: string[]): boolean {
  if (!requirements?.length) return false;
  return message.length > 120 || /[;\n•]|\d\)/.test(message) || requirements.length >= 3 && message.length > 60;
}

/**
 * assess_job_fit, built per chat turn so it can find the posting itself: a
 * link or description in this message first, then one shared earlier (or in
 * the intake). With a posting, its requirements are extracted with the
 * brief's rules and the model's own list is ignored, so the chat card and the
 * brief always judge the same rows the same way.
 */
export function makeFitTool(options: { userMessage: string; history: ConversationMessage[]; context?: VisitorContext; conversationId?: string }) {
  const { userMessage, history, context, conversationId } = options;
  return tool(
    async ({ role, requirements }) => {
      const inMessage = URL_IN_TEXT.test(userMessage) || looksLikePosting(userMessage);
      const posting =
        inMessage || !typedRequirements(userMessage, requirements)
          ? await findPosting({}, userMessage, history, context)
          : {};

      const roleOnly = role ?? context?.role;
      if (!posting.text && !requirements?.length && roleOnly) {
        return JSON.stringify({
          content: `No posting was shared, only the role "${roleOnly}". Call assess_job_fit again with 6-8 requirements typical of that role, including the job itself with its seniority (e.g. "Staff-level experience as a machine learning engineer") and the years a posting for it would ask, and say in your answer that these are typical requirements, not from a posting.`,
          citedProjectIds: [],
        });
      }
      if (!posting.text && !requirements?.length) {
        return JSON.stringify({
          content: `${posting.note ?? 'No job posting or requirements are available.'} Ask the visitor to paste the job description or list the requirements. Do not invent a link.`,
          citedProjectIds: [],
        });
      }

      const evaluation = await evaluateFit(
        posting.text
          ? { jobDescription: posting.text, roleTitle: posting.title }
          : { knownRequirements: requirements!.slice(0, MAX_REQUIREMENTS), roleTitle: role ?? context?.role }
      );
      if (conversationId) evaluations.set(conversationId, evaluation);
      if (evaluations.size > 500) evaluations.delete(evaluations.keys().next().value!);

      const rows: FitRequirement[] = [
        ...evaluation.roleMatches.map((match) => ({
          requirement: `${match.requirement}${match.required ? '' : ' (nice-to-have)'}`,
          status: STATUS_FOR[match.assessment],
          evidence: match.evidence,
          projects: match.projectIds.map((id) => projectById(id)).filter((p) => p !== undefined && p !== null).map((p) => toCard(p!)),
        })),
        ...evaluation.logistics.map((item) => ({
          requirement: item,
          status: 'gap' as const,
          evidence: 'Not stated in his portfolio: he is based in Brooklyn, New York. Ask him.',
          projects: [],
        })),
      ];
      const summary = {
        match: rows.filter((r) => r.status === 'match').length,
        related: rows.filter((r) => r.status === 'related').length,
        gap: rows.filter((r) => r.status === 'gap').length,
      };

      const title = evaluation.roleTitle ?? role ?? context?.role;
      const typed = [role, context?.role].find((r) => r && title && !sameRole(r, title));
      const read = evaluation.read ?? 'partial fit: real gaps to weigh';
      const content = [
        posting.note ?? '',
        posting.text && typed ? `The visitor called the role "${typed}", but the posting is for "${title}"; this report is judged against the posting. Say so in one short clause first.` : '',
        `Fit assessment${title ? ` for ${title}` : ''}: ${summary.match} match, ${summary.related} related, ${summary.gap} gap out of ${rows.length}.`,
        `Overall read: ${read}. Recommended next step: ${describeCeiling(evaluation)}. State this read and next step as written; never call it a stronger fit.`,
        evaluation.logistics.length ? 'Location and work-arrangement rows are not stated in his portfolio; say they need asking, not that he fails them.' : '',
        ...rows.map((r) => `- [${r.status.toUpperCase()}] ${r.requirement} — ${r.evidence}`),
        'Strengths first, then gaps, then the read. Do not call other tools in this turn.',
      ]
        .filter(Boolean)
        .join('\n');

      return JSON.stringify({
        content,
        citedProjectIds: [...new Set(rows.flatMap((r) => r.projects.map((p) => p.id)))],
        widget: { kind: 'fit_report', role: title, requirements: rows, summary },
      });
    },
    {
      name: 'assess_job_fit',
      description:
        "Judge Kyle-Anthony against a job: a posting link or pasted description (in this message or earlier in the chat), or a list of requirements the visitor typed. The tool finds and reads any posting itself and extracts its requirements, so for a posting leave requirements empty. Only when the visitor typed their own list (no posting), pass it as requirements, one short phrase each. Shows a match/related/gap report with an overall read and recommended next step.",
      schema: z.object({
        role: z.string().optional().describe("Role title if the visitor gave one, e.g. 'Senior iOS Engineer'. Never invent one."),
        requirements: z
          .array(z.string())
          .max(40)
          .optional()
          .describe('Only for a list the visitor typed without a posting: one requirement per entry, kept whole, "or" lists as one entry.'),
      }),
    }
  );
}
