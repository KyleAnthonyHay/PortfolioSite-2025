import { NextRequest } from 'next/server';
import { runAgent } from '@/lib/chat-agent';
import type { ChatEvent } from '@/lib/chat-events';
import { MAX_MESSAGE_LENGTH, sanitizeContext, sanitizeConversationId, sanitizeHistory } from '@/lib/chat-request';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Streams the agent's turn as newline-delimited JSON events so the UI can show
 * tool activity and text as they happen instead of waiting for the whole turn.
 */
export async function POST(request: NextRequest) {
  let body: { message?: unknown; history?: unknown; context?: unknown; conversationId?: unknown };
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

  const history = sanitizeHistory(body.history);
  const context = sanitizeContext(body.context);
  const conversationId = sanitizeConversationId(body.conversationId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of runAgent(message, history, { signal: request.signal, context, conversationId })) {
          if (request.signal.aborted) break;
          send(event);
        }
      } catch (error) {
        if (!request.signal.aborted) {
          console.error('Chat error:', error);
          send({ type: 'error', message: 'Something went wrong while answering. Please try again.' });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
