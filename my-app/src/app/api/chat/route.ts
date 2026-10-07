import { NextRequest } from 'next/server';
import { agentStream } from '@/lib/chat-stream';
import { MAX_MESSAGE_LENGTH, sanitizeContext, sanitizeConversationId, sanitizeHistory, sanitizeReceivedAt } from '@/lib/chat-request';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Streams the agent's turn as newline-delimited JSON events so the UI can show
 * tool activity and text as they happen instead of waiting for the whole turn.
 */
export async function POST(request: NextRequest) {
  let body: { message?: unknown; history?: unknown; context?: unknown; conversationId?: unknown; receivedAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return Response.json({ error: 'Message is required' }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return Response.json({ error: 'Message is too long' }, { status: 413 });
  }

  return agentStream(request.signal, {
    message,
    history: sanitizeHistory(body.history),
    receivedAt: sanitizeReceivedAt(body.receivedAt),
    context: sanitizeContext(body.context),
    conversationId: sanitizeConversationId(body.conversationId),
  });
}
