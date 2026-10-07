import { evaluationIdentity } from './fit-models';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ConversationMessage, FitRequirement, VisitorContext } from './chat-events';
import { projectById, toCard } from './project-catalog';
import { MAX_REQUIREMENTS } from './tools';
import { workArrangement } from './facts';
import { describeCeiling, evaluateFit, STATUS_FOR, type FitEvaluation } from './recruiter-brief/generate';
import { findPosting, looksLikePosting } from './recruiter-brief/tool';

/**
 * The newest fit evaluation per chat, so a brief made afterwards reuses the
 * exact rows the visitor saw. In memory: after a restart the brief evaluates
 * again with the same pipeline.
 */
const evaluations = new Map<string, FitEvaluation>();

export function lastEvaluation(conversationId?: string): FitEvaluation | undefined {
  const value = conversationId ? evaluations.get(conversationId) : undefined;
  return value?.evaluationIdentity === evaluationIdentity() && !value.needsReview && !value.usedFallback ? value : undefined;
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

const FILLER = new Set(['years', 'year', 'experience', 'with', 'and', 'the', 'for', 'plus', 'strong', 'knowledge', 'skills', 'proficiency', 'familiarity', 'ability', 'required', 'preferred', 'working', 'using', 'development', 'developer', 'engineer', 'engineering', 'level', 'senior', 'junior', 'role']);

const WORD = /[a-z0-9+#.]{2,}/g;

/** True when a requirement names something the visitor wrote: a word of it (not filler) is a word they used. */
function groundedIn(requirement: string, shared: Set<string>): boolean {
  const words = requirement.toLowerCase().match(WORD) ?? [];
  return words.some((word) => !FILLER.has(word) && shared.has(word));
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
      const sharedWords = new Set([userMessage, ...history.filter((m) => m.role === 'user').map((m) => m.content), context?.role ?? ''].join('\n').toLowerCase().match(WORD) ?? []);
      const posting =
        inMessage || !typedRequirements(userMessage, requirements)
          ? await findPosting({}, userMessage, history, context)
          : {};

      const roleOnly = role ?? context?.role;
      // Only requirements the visitor actually gave in this chat are judged. A
      // list the model wrote itself (what a posting "usually" asks for) is not.
      const given = requirements?.length ? (typedRequirements(userMessage, requirements) ? requirements : requirements.filter((r) => groundedIn(r, sharedWords))) : [];
      const invented = (requirements?.length ?? 0) > 0 && given.length < Math.ceil((requirements?.length ?? 0) / 2);
      if (!posting.text && (!requirements?.length || invented)) {
        const why = invented
          ? `The requirements passed were not given by the visitor in this chat, so nothing was assessed.`
          : posting.note ?? 'No job posting or requirements were shared in this chat.';
        return JSON.stringify({
          content: `${why} Do not guess what a${roleOnly ? ` "${roleOnly}"` : ''} posting usually asks for and do not call assess_job_fit again this turn. ${
            roleOnly ? `Call get_experience with "${roleOnly}" as the query, describe his relevant experience in two or three sentences from what it returns without saying whether he is a fit, and` : 'Say so briefly, then'
          } ask the visitor to share the posting link or paste the job description so the real requirements can be judged. Do not invent a link.`,
          citedProjectIds: [],
        });
      }

      const evaluation = await evaluateFit(
        posting.text
          ? { jobDescription: posting.text, roleTitle: posting.title }
          : { knownRequirements: given.slice(0, MAX_REQUIREMENTS), roleTitle: role ?? context?.role }
      );
      if (conversationId) evaluations.set(conversationId, evaluation);
      if (evaluations.size > 500) evaluations.delete(evaluations.keys().next().value!);

      const rows: FitRequirement[] = [
        ...evaluation.roleMatches.map((match) => ({
          requirement: `${match.requirement}${match.required ? '' : ' (nice-to-have)'}`,
          status: STATUS_FOR[match.assessment],
          evidence: match.evidence,
          verificationStatus: match.verificationStatus,
          projects: match.projectIds.map((id) => projectById(id)).filter((p) => p !== undefined && p !== null).map((p) => toCard(p!)),
        })),
        ...evaluation.logistics.map((item) => {
          const arrangement = workArrangement(item);
          return { requirement: item, status: arrangement.met ? ('match' as const) : ('gap' as const), evidence: arrangement.evidence, projects: [] };
        }),
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
        evaluation.logistics.some((item) => !workArrangement(item).met) ? 'Location and work-arrangement gaps are things he has not stated; say they need asking, not that he fails them.' : '',
        ...rows.map((r) => `- [${r.verificationStatus === 'unknown' ? 'NEEDS REVIEW' : r.status.toUpperCase()}] ${r.requirement} — ${r.evidence}`),
        'Strengths first, then gaps, then the read. Do not call other tools in this turn.',
      ]
        .filter(Boolean)
        .join('\n');

      return JSON.stringify({
        content,
        citedProjectIds: [...new Set(rows.flatMap((r) => r.projects.map((p) => p.id)))],
        widget: { kind: 'fit_report', role: title, requirements: rows, summary, jobUrl: posting.url },
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
          .describe('Only for a list the visitor typed without a posting: one requirement per entry, kept whole, "or" lists as one entry. Never write requirements yourself; with only a role title, leave this empty.'),
      }),
    }
  );
}
