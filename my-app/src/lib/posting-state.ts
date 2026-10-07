import { createHash } from 'node:crypto';
import type { ConversationMessage, VisitorContext } from './chat-events';

export const POSTING_URL = /https?:\/\/[^\s<>"')]+/gi;
export function looksLikePosting(text: string): boolean {
  return text.length >= 500 && /(requirements|qualifications|responsibilities|you will|you'll|experience|about the role|what you)/i.test(text);
}

export interface PostingSource { id: string; source: string; text?: string; url?: string; receivedAt?: number; channel: 'typed' | 'voice' | 'intake' }
export function postingSources(message: string, history: ConversationMessage[], context?: VisitorContext, receivedAt?: number, voice = false): PostingSource[] {
  const arrivals = [...history.filter((m) => m.role === 'user'), { role: 'user' as const, content: message, receivedAt, channel: voice ? 'voice' as const : 'typed' as const }];
  if (receivedAt !== undefined && arrivals.every((m) => m.receivedAt !== undefined)) arrivals.sort((a, b) => a.receivedAt! - b.receivedAt!);
  const sources: PostingSource[] = [];
  const add = (source: string, fields: Omit<PostingSource, 'id' | 'source'>) => sources.push({ id: createHash('sha256').update(source).digest('hex').slice(0, 16), source, ...fields });
  if (context?.jobUrl) add(context.jobUrl, { url: context.jobUrl, channel: 'intake' });
  for (const arrival of arrivals) {
    const urls = arrival.content.match(POSTING_URL) ?? [];
    if (looksLikePosting(arrival.content)) add(arrival.content.trim(), { text: arrival.content.trim(), url: urls[0], receivedAt: arrival.receivedAt, channel: arrival.channel ?? 'typed' });
    else for (const url of urls) add(url, { url, receivedAt: arrival.receivedAt, channel: arrival.channel ?? 'typed' });
  }
  // The same URL in intake/history is one source, with its newest actual arrival.
  return sources.filter((source, i) => sources.findLastIndex((other) => other.id === source.id) === i);
}
