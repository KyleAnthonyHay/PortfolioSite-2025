import WebSocket from 'ws';
import { deliverEvents } from './sideband';
import type { ConversationMessage } from '../chat-events';

/**
 * GPT-Live, the way SelahNote uses it: the browser sends its WebRTC offer to
 * our server, which creates the session with the project key (no key or
 * token reaches the browser) and returns the answer. Conversation runs in
 * the voice model; anything about Kyle-Anthony is delegated back to us
 * ("client" delegation), and we answer it with the same agent, tools and
 * cards as typed chat. Answers go back over a short server-side sideband
 * connection, since the browser's data channel is only for listening.
 *
 * The voice model is VOICE_LIVE_MODEL; the agent behind it keeps its own
 * OPENAI_CHAT_MODEL setting.
 */

const LIVE_URL = 'https://api.openai.com/v1/live/sessions';
const attachUrl = (id: string) => `wss://api.openai.com/v1/live/sessions/${encodeURIComponent(id)}/attach`;

export const liveModel = () => process.env.VOICE_LIVE_MODEL ?? 'gpt-live-1';
const liveVoice = () => process.env.VOICE_LIVE_VOICE ?? 'marin';
const apiKey = () => process.env.VOICE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

export function liveInstructions(): string {
  return `You are Kyle's Agent, the voice of the AI agent on Kyle-Anthony Hay's portfolio site, on a call with a visitor, usually a recruiter, hiring manager or engineer. Speak warmly and briefly, one or two sentences at a time, and pause for them.
Delegate to the backend for anything about Kyle-Anthony: his projects, experience, skills, background, résumé, whether he fits a role, demos, links, booking time with him, or leaving him a message. Never answer those from memory and never guess; wait for the backend result and say only what it returns. While waiting, say in a few words that you are checking.
The backend also puts cards in the chat on screen: project cards, a fit report, a booking card, a note draft and so on. When a result mentions a card, point the visitor to it in a few words rather than reading it out. You cannot book meetings, send messages or open links yourself; the visitor confirms those on the cards.
When a visitor says they will send another job, acknowledge and wait for an actual new link or description. An old posting in context is not the promised new posting. If no new listing arrived, say so; never reassess the old listing as the new one. Typed input arrives separately from the backend result: receiving a message does not mean its assessment is complete. The backend already coordinates typed requests; do not delegate them again merely because they arrived.
Fit reports use Supported match for documented evidence, Needs confirmation for incomplete or unrecorded experience, and Confirmed gap only for an established shortfall. The portfolio may not contain all of Kyle-Anthony's experience. OR lists such as React, Angular, or Vue are alternatives.
Answer greetings, small talk and questions about how this call works yourself. When the visitor interrupts, stop talking to listen. Backend tasks can keep running while you listen. Delegate new requests, additions, corrections, cancellations, and answers to backend clarification questions so the backend can coordinate them. A new turn does not cancel earlier tasks. Never claim a task was canceled until the backend confirms it. When an existing task result arrives, use its task description and the latest conversation to decide how to present it; do not treat it as the answer to a different question. If they ask you to stop, stop and wait.
Timing and remaining-minute notices are handled for you; only mention time when instructed. Never end the call yourself; the visitor hangs up with the red button.`;
}

/** Recent chat turns as the voice model's starting context. */
function historyItems(history: ConversationMessage[]) {
  return history
    .filter((m) => m.content.trim() && !m.content.startsWith('[Asked the visitor'))
    .slice(-12)
    .map((m) => ({
      type: 'message',
      role: m.role,
      content: [{ type: m.role === 'user' ? 'input_text' : 'output_text', text: m.content.slice(0, 600) }],
    }));
}

export class LiveUnavailable extends Error {}

export async function createLiveSession(sdp: string, history: ConversationMessage[]): Promise<{ providerSessionId: string; sdp: string }> {
  const key = apiKey();
  if (!key) throw new LiveUnavailable('No OpenAI key');
  const response = await fetch(LIVE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15_000),
    body: JSON.stringify({
      session: {
        model: liveModel(),
        instructions: liveInstructions(),
        input: historyItems(history),
        audio: { output: { voice: liveVoice() } },
        delegation: { type: 'client' },
      },
      transport: { type: 'webrtc', sdp },
    }),
  });
  if (!response.ok) {
    console.error('voice: session creation failed', response.status, (await response.text()).slice(0, 300));
    throw new LiveUnavailable(`Provider refused (${response.status})`);
  }
  const result = (await response.json()) as { session?: { id?: string }; transport?: { sdp?: string } };
  if (!result.session?.id || !result.transport?.sdp) throw new LiveUnavailable('Provider returned no session');
  return { providerSessionId: result.session.id, sdp: result.transport.sdp };
}

/**
 * Steering events for a running session, sent from the server: attach,
 * send, wait for the provider's acknowledgements, detach. Several of these
 * can be attached at once.
 */
export async function sendToSession(providerSessionId: string, events: Record<string, unknown>[], timeoutMs = 6_000, beforeSend?: () => Promise<boolean>): Promise<void> {
  const key = apiKey();
  if (events.length === 0) return;
  if (!key) throw new LiveUnavailable('No OpenAI key');
  const socket = new WebSocket(attachUrl(providerSessionId), { headers: { Authorization: `Bearer ${key}` } });
  await deliverEvents(socket, events, timeoutMs, beforeSend);
}

/** The agent's answer as speech: no Markdown, no links, short enough for one append (500 tokens). */
export function spokenText(answer: string): string {
  return answer
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1400);
}

/** A conservative byte bound also bounds token count across languages (500-token append limit). */
export function limitedLiveText(content: string): string {
  if (Buffer.byteLength(content, 'utf8') <= 480) return content;
  let result = '';
  for (const character of content) {
    if (Buffer.byteLength(result + character, 'utf8') > 450) break;
    result += character;
  }
  return result.trimEnd() + '… More is in the chat.';
}
