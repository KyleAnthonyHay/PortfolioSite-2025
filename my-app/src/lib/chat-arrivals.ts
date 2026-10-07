import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { ConversationMessage, VisitorContext } from './chat-events';
import { postingSources } from './posting-state';

export interface ChatArrivalOptions { userMessage: string; history: ConversationMessage[]; context?: VisitorContext; receivedAt?: number; voice?: boolean }
export function chatArrivalSnapshot(options: ChatArrivalOptions) {
  const { history, userMessage, context, receivedAt, voice } = options;
  const lastAnswerIndex = history.findLastIndex((m) => m.role === 'assistant');
  const lastAnswer = history[lastAnswerIndex];
  const lastVoiceAnswer = history.findLast((m) => m.role === 'assistant' && m.channel === 'voice');
  const users = history.filter((m) => m.role === 'user');
  const after = (at: number | undefined, index: number) => users.filter((m) => at !== undefined && m.receivedAt !== undefined ? m.receivedAt > at : history.indexOf(m) > index);
  const brief = (m: ConversationMessage) => ({ id: m.id, receivedAt: m.receivedAt ?? null, channel: m.channel ?? 'typed', content: m.content.slice(0, 1800) });
  return {
    currentRequest: { content: userMessage, receivedAt: receivedAt ?? null, channel: voice ? 'voice' : 'typed' },
    newMessagesSincePreviousAnswer: after(lastAnswer?.receivedAt, lastAnswerIndex).slice(-8).map(brief),
    newMessagesSincePreviousVoiceAnswer: after(lastVoiceAnswer?.receivedAt, lastVoiceAnswer ? history.indexOf(lastVoiceAnswer) : -1).slice(-8).map(brief),
    postingSources: postingSources(userMessage, history, context, receivedAt, voice).slice(-8).map((source) => ({ id: source.id, url: source.url, receivedAt: source.receivedAt ?? null, channel: source.channel, textPreview: source.text?.slice(0, 1800) })),
    explanation: 'These are actual received messages and sources. New-message lists exclude currentRequest, which is shown separately. Typed/spoken channel and arrival times distinguish newly supplied data from a spoken intention to supply it. An intention or promise to send something is not an attachment. Compare arrival times and source IDs with the request, then reason whether it concerns an existing source or awaits a new one. Historical sources remain available for explicit follow-ups.',
  };
}
export function makeChatUpdatesTool(options: ChatArrivalOptions) {
  return tool(async () => JSON.stringify({ content: JSON.stringify(chatArrivalSnapshot(options)), citedProjectIds: [] }), {
    name: 'check_chat_updates',
    description: 'Check actual typed/spoken messages received since the previous answer and previous voice answer, and the source IDs of postings actually supplied. Check this before responding to a voice handoff or assessing a job. A promise to send a new posting is not new posting data. Use arrival order and the visitor’s intent to choose a source or wait.',
    schema: z.object({}),
  });
}

/** A compact reminder; the check tool returns the actual messages when needed. */
export function chatArrivalSummary(options: ChatArrivalOptions) {
  const snapshot = chatArrivalSnapshot(options);
  return {
    currentChannel: snapshot.currentRequest.channel,
    currentReceivedAt: snapshot.currentRequest.receivedAt,
    newMessagesSincePreviousAnswer: snapshot.newMessagesSincePreviousAnswer.map(({ id, receivedAt, channel }) => ({ id, receivedAt, channel })),
    newMessagesSincePreviousVoiceAnswer: snapshot.newMessagesSincePreviousVoiceAnswer.map(({ id, receivedAt, channel }) => ({ id, receivedAt, channel })),
    postingSources: snapshot.postingSources.map(({ id, url, receivedAt, channel }) => ({ id, url, receivedAt, channel })),
    instruction: 'Call check_chat_updates to read these actual messages before responding to a voice handoff or assessing a posting.',
  };
}
