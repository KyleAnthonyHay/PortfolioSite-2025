import { NextRequest } from 'next/server';
import { runAgent } from '@/lib/chat-agent';
import type { ChatEvent, ConversationMessage } from '@/lib/chat-events';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 8000;
const MAX_HISTORY = 20;

function sanitizeHistory(value: unknown): ConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is ConversationMessage =>
        typeof item === 'object' &&
        item !== null &&
        (item.role === 'user' || item.role === 'assistant') &&
        typeof item.content === 'string'
    )
    .map((item) => ({ role: item.role, content: item.content.slice(0, MAX_MESSAGE_LENGTH) }))
    .slice(-MAX_HISTORY);
}

/**
 * Streams the agent's turn as newline-delimited JSON events so the UI can show
 * tool activity and text as they happen instead of waiting for the whole turn.
 */
export async function POST(request: NextRequest) {
  let body: { message?: unknown; history?: unknown };
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
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of runAgent(message, history, request.signal)) {
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
