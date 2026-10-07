import type { ConversationMessage, VisitorContext } from './chat-events';

/** Request-body cleaning shared by the chat and note routes. */

export const MAX_MESSAGE_LENGTH = 8000;

export function sanitizeHistory(value: unknown, limit = 20): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  const cleaned = value
    .filter(
      (item): item is ConversationMessage =>
        typeof item === 'object' &&
        item !== null &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    )
    .map((item) => {
      const cards = Array.isArray(item.projectCards) ? item.projectCards.filter((id) => Number.isInteger(id)).slice(0, 20) : [];
      return { role: item.role, id: typeof item.id === 'string' ? item.id.slice(0, 100) : undefined, receivedAt: sanitizeReceivedAt(item.receivedAt), channel: item.channel === 'voice' ? 'voice' as const : 'typed' as const, content: item.content.slice(0, MAX_MESSAGE_LENGTH), ...(cards.length > 0 ? { projectCards: cards } : {}) };
    });
  const recent = cleaned.slice(-limit);
  return recent;
}

export function sanitizeContext(value: unknown): VisitorContext | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.hiring !== 'boolean') return undefined;
  const role = typeof raw.role === 'string' ? raw.role.trim().slice(0, 120) : '';
  const jobUrl = typeof raw.jobUrl === 'string' && /^https?:\/\//i.test(raw.jobUrl.trim()) ? raw.jobUrl.trim().slice(0, 600) : '';
  return { hiring: raw.hiring, role: role || undefined, jobUrl: jobUrl || undefined };
}

/** The client's id for one chat, so a fit check is announced once per chat. */
export function sanitizeConversationId(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-z0-9-]{6,64}$/i.test(value) ? value : undefined;
}

export function sanitizeReceivedAt(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}
