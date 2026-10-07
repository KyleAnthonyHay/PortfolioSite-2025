import { runAgent } from './chat-agent';
import type { ChatEvent, ConversationMessage, VisitorContext } from './chat-events';

export interface AgentTurn {
  message: string;
  history: ConversationMessage[];
  context?: VisitorContext;
  conversationId?: string;
  /** A spoken question from a call: short spoken answer, same tools and cards. */
  voice?: boolean;
}

/**
 * One agent turn as newline-delimited JSON events, so the UI can show tool
 * activity and text as they happen. Typed chat and voice calls both answer
 * through here; `onEvent` lets the voice route watch the same turn.
 */
export function agentStream(signal: AbortSignal, turn: AgentTurn, onEvent?: (event: ChatEvent) => void | Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The browser went away; the turn still finishes for onEvent.
        }
      };
      try {
        for await (const event of runAgent(turn.message, turn.history, { signal, context: turn.context, conversationId: turn.conversationId, voice: turn.voice })) {
          if (signal.aborted) break;
          send(event);
          await onEvent?.(event);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error('Chat error:', error);
          const event: ChatEvent = { type: 'error', message: 'Something went wrong while answering. Please try again.' };
          send(event);
          await onEvent?.(event);
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
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
