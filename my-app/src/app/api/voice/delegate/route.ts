import { NextRequest } from 'next/server';
import { agentStream } from '@/lib/chat-stream';
import { MAX_MESSAGE_LENGTH, sanitizeContext, sanitizeConversationId, sanitizeHistory } from '@/lib/chat-request';
import type { ChatEvent } from '@/lib/chat-events';
import { sendToSession, spokenText } from '@/lib/voice/live';
import { correctProjectNames } from '@/lib/voice/names';
import { ledger, sessionIdFrom } from '@/lib/voice/ledger';
import { visitorKey } from '@/lib/voice/visitor';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * The voice model handed a spoken request to us. It runs through the same
 * agent turn as typed chat (same tools, cards, project-card dedupe, fit and
 * confirmation rules), streamed to the browser exactly like /api/chat, and
 * the answer is sent into the call from here, so what the voice says always
 * comes from the agent rather than from the browser.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const delegationId = typeof body.delegationId === 'string' && /^[\w-]{4,100}$/.test(body.delegationId) ? body.delegationId : null;
  const sessionId = sessionIdFrom(body.sessionId);
  if (!message || message.length > MAX_MESSAGE_LENGTH || !delegationId || !sessionId) return Response.json({ error: 'VOICE_INVALID_REQUEST' }, { status: 400 });

  let key: string;
  try {
    key = visitorKey(request);
  } catch {
    return Response.json({ error: 'VOICE_UNAVAILABLE' }, { status: 503 });
  }
  const state = await ledger.owned(key, sessionId).catch(() => null);
  if (!state || state.status !== 'live' || !state.providerSessionId) return Response.json({ error: 'VOICE_NOT_LIVE' }, { status: 409 });
  const providerSessionId = state.providerSessionId;

  // Tell the voice it is being looked up, so it neither guesses nor goes quiet.
  const thinking = sendToSession(providerSessionId, [
    { type: 'session.thinking.append', delegation_id: delegationId, content: "Looking this up in Kyle-Anthony's portfolio now. No result yet; do not guess." },
  ]).catch(() => {});

  let answer = '';
  let cards = 0;
  let question = '';
  let spoken = false;
  const speak = async (content: string) => {
    if (spoken || request.signal.aborted) return;
    spoken = true;
    await thinking;
    await sendToSession(providerSessionId, [{ type: 'session.commentary.append', delegation_id: delegationId, content }]).catch((error) => console.warn('voice: commentary failed', error));
  };

  const onEvent = async (event: ChatEvent) => {
    if (event.type === 'text') answer += event.delta;
    else if (event.type === 'widget') {
      cards += 1;
      if (event.widget.kind === 'question') question = `${event.widget.question} You can pick an option on screen or just tell me.`;
    } else if (event.type === 'answered') {
      const text = spokenText(answer);
      // A turn that only asked a question or only showed a card still gets a line.
      await speak(text || question || (cards > 0 ? "It's on the card in the chat." : 'I could not find anything on that.'));
    } else if (event.type === 'error') {
      await speak("I couldn't look that up just now. You can ask again, or type it in the chat.");
    }
  };

  return agentStream(
    request.signal,
    {
      message: correctProjectNames(message),
      history: sanitizeHistory(body.history),
      context: sanitizeContext(body.context),
      conversationId: sanitizeConversationId(body.conversationId),
      voice: true,
    },
    onEvent
  );
}
