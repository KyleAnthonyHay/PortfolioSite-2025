import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { postingSources } from '../posting-state';
export { looksLikePosting } from '../posting-state';
import { readJobPosting } from '../tools';
import type { ConversationMessage, VisitorContext } from '../chat-events';
import { generateRecruiterBrief } from './generate';
import { lastEvaluation } from '../fit-tool';
import { MATCH_LABEL, briefTitle, toBriefView } from './view';

export async function findPosting(
  args: { jobDescription?: string; jobUrl?: string; postingId?: string },
  userMessage: string,
  history: ConversationMessage[],
  context?: VisitorContext,
  receivedAt?: number
): Promise<{ text?: string; title?: string; note?: string; url?: string; source?: string }> {
  const sources = postingSources(userMessage, history, context, receivedAt);
  const state = args.postingId ? sources.find((s) => s.id === args.postingId) : sources.findLast((s) => userMessage.includes(s.text ?? s.url ?? ''));
  if (args.postingId && !state) return { note: 'That source was not supplied by the visitor. Check chat updates and select an actual source.' };
  if (!state && sources.length) return { note: 'Historical postings exist, but none was supplied in this request. Check chat updates, reason whether the visitor intends a historical follow-up or is promising a new posting, and pass the appropriate postingId only for a real supplied source.' };
  const normalized = (value: string) => value.replace(/\s+/g, ' ').trim();
  if (args.jobDescription && args.jobDescription.trim().length >= 200 && normalized(userMessage).includes(normalized(args.jobDescription))) {
    return { text: args.jobDescription.trim(), source: state?.source ?? args.jobDescription.trim() };
  }
  if (!state) return {};
  if (state.text) return { text: state.text, url: state.url, source: state.source };
  // A failed new link must never silently fall back to a different, older job.
  const posting = await readJobPosting(state.url!).catch(() => null);
  return posting?.ok
    ? { text: posting.text, title: posting.title, url: state.url, source: state.source }
    : { url: state.url, source: state.source, note: `The new posting could not be read${posting && !posting.ok ? ': ' + posting.reason : ''}. Please paste its description.` };
}

/** Built per chat turn, so it can find the posting the visitor already shared. */
export function makeRecruiterBriefTool(options: {
  receivedAt?: number;
  userMessage: string;
  history: ConversationMessage[];
  context?: VisitorContext;
  conversationId?: string;
}) {
  return tool(
    async ({ jobDescription, jobUrl, postingId, roleTitle, companyName, recruiterContext }) => {
      const posting = await findPosting({ jobDescription, jobUrl, postingId }, options.userMessage, options.history, options.context, options.receivedAt);
      if (posting.note && !posting.text) return JSON.stringify({ content: posting.note, citedProjectIds: [] });
      // Reuse only the fit card for the selected posting.
      const shown = lastEvaluation(options.conversationId, posting.source);
      const evaluation = shown;

      const record = await generateRecruiterBrief({
        jobDescription: posting.text,
        roleTitle: posting.title ?? (roleTitle && options.userMessage.toLowerCase().includes(roleTitle.toLowerCase()) ? roleTitle : options.context?.role),
        companyName: companyName && options.userMessage.toLowerCase().includes(companyName.toLowerCase()) ? companyName : undefined,
        recruiterContext,
        evaluation,
      });
      const view = toBriefView(record);
      const { brief } = view;
      const counts = (['strong', 'relevant', 'gap'] as const)
        .map((level) => `${brief.roleMatches.filter((m) => m.assessment === level).length} ${MATCH_LABEL[level].toLowerCase()}`)
        .join(', ');

      const content = [
        `A recruiter brief card is shown for "${briefTitle(view)}", with Download PDF and Copy share link buttons (link: /brief/${view.publicId}).`,
        posting.note ?? (!posting.text ? 'No job posting was available, so it is a general brief.' : ''),
        brief.roleMatches.length ? `Role match: ${counts}. Confirmed gaps: ${brief.roleMatches.filter((m) => m.assessment === 'gap').map((m) => m.requirement).join('; ') || 'none'}.` : '',
        `Recommendation: ${brief.recommendation.nextStep}. ${brief.recommendation.rationale}`,
        'Reply in one or two sentences: say the brief is ready to download or share, and state its recommendation as written, including any gaps. Do not soften it or restate the card.',
      ]
        .filter(Boolean)
        .join('\n');

      return JSON.stringify({
        content,
        citedProjectIds: view.projects.map((p) => p.id),
        widget: { kind: 'recruiter_brief', view, jobUrl: posting.url },
      });
    },
    {
      name: 'generate_recruiter_brief',
      description:
        "Use when the visitor wants something shareable about Kyle-Anthony for a hiring manager: 'create a recruiter brief', 'summarize him for this position', 'give me something I can send to the hiring manager', 'generate a candidate profile', 'a one-pager on him for this role'. Writes a role-specific brief (role match, relevant work, areas to validate, interview questions, recommendation) with a PDF and a share link. It finds a posting the visitor already pasted or linked in this chat, so leave jobDescription empty unless they paste a new one in this message. For 'is he a fit?' alone, use assess_job_fit instead.",
      schema: z.object({
        postingId: z.string().optional().describe('An actual source ID returned by check_chat_updates. Required for a historical posting. Select it only if the visitor intends that supplied posting; wait if they are promising a new one.'),
        jobDescription: z.string().optional().describe('Only a job description pasted in this very message. Never copy one from earlier in the chat; the tool finds it.'),
        jobUrl: z.string().optional().describe('A job posting URL from this message, if any'),
        roleTitle: z.string().optional().describe('Role title if the visitor named one'),
        companyName: z.string().optional().describe('Hiring company if the visitor named it'),
        recruiterContext: z.string().optional().describe("Short notes on what the visitor said they're looking for, from this chat (team, focus, must-haves)"),
      }),
    }
  );
}
