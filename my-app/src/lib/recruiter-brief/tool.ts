import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { readJobPosting } from '../tools';
import type { ConversationMessage, VisitorContext } from '../chat-events';
import { generateRecruiterBrief } from './generate';
import { MATCH_LABEL, briefTitle, toBriefView } from './view';

/**
 * Requirements from the fit check already shown in a chat, by conversation,
 * so a brief made afterwards judges the same list. In memory only: a restart
 * means the brief extracts them again from the posting.
 */
const fitRequirements = new Map<string, string[]>();

export function rememberFitRequirements(conversationId: string | undefined, requirements: unknown): void {
  if (!conversationId || !Array.isArray(requirements)) return;
  const list = requirements.filter((r): r is string => typeof r === 'string' && r.trim().length > 0);
  if (list.length > 0) fitRequirements.set(conversationId, list);
  if (fitRequirements.size > 500) fitRequirements.delete(fitRequirements.keys().next().value!);
}

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

/** A pasted posting: long, and reads like one. */
function looksLikePosting(text: string): boolean {
  return text.length >= 500 && /(requirements|qualifications|responsibilities|you will|you'll|experience|about the role|what you)/i.test(text);
}

async function findPosting(
  args: { jobDescription?: string; jobUrl?: string },
  userMessage: string,
  history: ConversationMessage[],
  context?: VisitorContext
): Promise<{ text?: string; title?: string; note?: string }> {
  if (args.jobDescription && args.jobDescription.trim().length >= 200) return { text: args.jobDescription.trim() };

  const visitorMessages = [userMessage, ...history.filter((m) => m.role === 'user').map((m) => m.content).reverse()];
  const urls = [args.jobUrl, ...visitorMessages.flatMap((m) => m.match(URL_PATTERN) ?? []), context?.jobUrl].filter(
    (u): u is string => typeof u === 'string' && u.length > 0
  );
  const pasted = visitorMessages.find(looksLikePosting);

  // The newest of a pasted posting and a shared link wins; a link is tried first only when it came later.
  const pastedIndex = pasted ? visitorMessages.indexOf(pasted) : Infinity;
  const linkIndex = visitorMessages.findIndex((m) => /https?:\/\//i.test(m));
  if (pasted && (linkIndex === -1 || pastedIndex <= linkIndex) && !args.jobUrl) return { text: pasted };

  for (const url of [...new Set(urls)].slice(0, 3)) {
    const posting = await readJobPosting(url).catch(() => null);
    if (posting?.ok) return { text: posting.text, title: posting.title };
    if (posting && !posting.ok && url === urls[0]) {
      if (pasted) return { text: pasted, note: `The link ${url} could not be read (${posting.reason}); the pasted description was used.` };
      return { note: `The posting at ${url} could not be read: ${posting.reason}.` };
    }
  }
  return pasted ? { text: pasted } : {};
}

/** Built per chat turn, so it can find the posting the visitor already shared. */
export function makeRecruiterBriefTool(options: {
  userMessage: string;
  history: ConversationMessage[];
  context?: VisitorContext;
  conversationId?: string;
}) {
  return tool(
    async ({ jobDescription, jobUrl, roleTitle, companyName, recruiterContext }) => {
      const posting = await findPosting({ jobDescription, jobUrl }, options.userMessage, options.history, options.context);
      const known = options.conversationId ? fitRequirements.get(options.conversationId) : undefined;

      const record = await generateRecruiterBrief({
        jobDescription: posting.text,
        roleTitle: posting.title ?? roleTitle ?? options.context?.role,
        companyName,
        recruiterContext,
        knownRequirements: posting.text ? undefined : known,
      });
      const view = toBriefView(record);
      const { brief } = view;
      const counts = (['strong', 'relevant', 'gap'] as const)
        .map((level) => `${brief.roleMatches.filter((m) => m.assessment === level).length} ${MATCH_LABEL[level].toLowerCase()}`)
        .join(', ');

      const content = [
        `A recruiter brief card is shown for "${briefTitle(view)}", with Download PDF and Copy share link buttons (link: /brief/${view.publicId}).`,
        posting.note ?? (!posting.text && !known ? 'No job posting was available, so it is a general brief.' : ''),
        brief.roleMatches.length ? `Role match: ${counts}. Gaps: ${brief.roleMatches.filter((m) => m.assessment === 'gap').map((m) => m.requirement).join('; ') || 'none'}.` : '',
        `Recommendation: ${brief.recommendation.nextStep}. ${brief.recommendation.rationale}`,
        'Reply in one or two sentences: say the brief is ready to download or share, and state its recommendation as written, including any gaps. Do not soften it or restate the card.',
      ]
        .filter(Boolean)
        .join('\n');

      return JSON.stringify({
        content,
        citedProjectIds: view.projects.map((p) => p.id),
        widget: { kind: 'recruiter_brief', view },
      });
    },
    {
      name: 'generate_recruiter_brief',
      description:
        "Use when the visitor wants something shareable about Kyle-Anthony for a hiring manager: 'create a recruiter brief', 'summarize him for this position', 'give me something I can send to the hiring manager', 'generate a candidate profile', 'a one-pager on him for this role'. Writes a role-specific brief (role match, relevant work, areas to validate, interview questions, recommendation) with a PDF and a share link. It finds a posting the visitor already pasted or linked in this chat, so leave jobDescription empty unless they paste a new one in this message. For 'is he a fit?' alone, use assess_job_fit instead.",
      schema: z.object({
        jobDescription: z.string().optional().describe('Only a job description pasted in this very message. Never copy one from earlier in the chat; the tool finds it.'),
        jobUrl: z.string().optional().describe('A job posting URL from this message, if any'),
        roleTitle: z.string().optional().describe('Role title if the visitor named one'),
        companyName: z.string().optional().describe('Hiring company if the visitor named it'),
        recruiterContext: z.string().optional().describe("Short notes on what the visitor said they're looking for, from this chat (team, focus, must-haves)"),
      }),
    }
  );
}
