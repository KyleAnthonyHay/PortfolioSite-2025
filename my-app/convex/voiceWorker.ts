'use node';
import WebSocket from 'ws';
import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { internal } from './_generated/api';

/**
 * Scheduled server-side steering for live calls: the five- and one-minute
 * mentions, the goodbye, and the cutoff. Each opens a short sideband
 * connection to the provider session (as SelahNote's worker does), sends its
 * events and leaves. The cutoff closes the provider session itself, so the
 * allowance holds even if the browser never hangs up.
 */

const attachUrl = (id: string) => `wss://api.openai.com/v1/live/sessions/${encodeURIComponent(id)}/attach`;
const apiKey = () => process.env.VOICE_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;

/** Attach, send the events, wait for the provider to acknowledge (or close), detach. */
async function sideband(providerSessionId: string, events: Record<string, unknown>[], timeoutMs = 6_000): Promise<void> {
  const key = apiKey();
  if (!key) {
    console.warn('voice worker: no OpenAI key in the Convex environment');
    return;
  }
  await new Promise<void>((resolve) => {
    const socket = new WebSocket(attachUrl(providerSessionId), { headers: { Authorization: `Bearer ${key}` } });
    const pending = new Set(events.map((event) => String(event.event_id)));
    const done = () => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // Already closed.
      }
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    socket.on('open', () => events.forEach((event) => socket.send(JSON.stringify(event))));
    socket.on('message', (raw) => {
      try {
        const event = JSON.parse(raw.toString()) as { type?: string; client_event_id?: string };
        if (event.type === 'session.closed') return done();
        if (event.client_event_id) pending.delete(event.client_event_id);
        if (pending.size === 0) done();
      } catch {
        // Audio and other frames we don't read.
      }
    });
    socket.on('unexpected-response', (_request, response) => {
      // 404/410: the session is already gone, which is the outcome we want anyway.
      if (response.statusCode !== 404 && response.statusCode !== 410) console.warn('voice worker: attach refused', response.statusCode);
      done();
    });
    socket.on('error', done);
    socket.on('close', done);
  });
}

const NOTICES = {
  five: 'About five minutes of voice time are left today. At the next natural pause, mention it in one short sentence, then carry on.',
  one: 'About one minute of voice time is left today. At the next natural pause, mention it in one short sentence, and say the chat keeps going in text afterwards.',
  goodbye: "The voice time for today has run out. Say one short goodbye sentence saying the conversation can continue by typing in the chat, then stop speaking.",
} as const;

export const notice = internalAction({
  args: { sessionId: v.id('voiceSessions'), kind: v.union(v.literal('five'), v.literal('one'), v.literal('goodbye')) },
  handler: async (ctx, { sessionId, kind }) => {
    const session = await ctx.runQuery(internal.voice.forWorker, { sessionId });
    if (!session || session.status !== 'live' || !session.providerSessionId) return;
    await sideband(session.providerSessionId, [
      { type: 'session.instructions.append', event_id: `${kind}-${sessionId}`, delegation_id: null, content: NOTICES[kind] },
    ]);
  },
});

/** The deadline: charge the full reservation and close the provider session, whatever the browser does. */
export const cutoff = internalAction({
  args: { sessionId: v.id('voiceSessions') },
  handler: async (ctx, { sessionId }) => {
    const providerSessionId = await ctx.runMutation(internal.voice.settleAtDeadline, { sessionId });
    // settle() already scheduled closeProvider; closing here as well removes the scheduling delay.
    if (providerSessionId) await sideband(providerSessionId, [{ type: 'session.close', event_id: `cutoff-${sessionId}` }], 8_000);
  },
});

/** Close a provider session (hang-up backstop, abandoned tab, reconnect). */
export const closeProvider = internalAction({
  args: { providerSessionId: v.string() },
  handler: async (_ctx, { providerSessionId }) => {
    await sideband(providerSessionId, [{ type: 'session.close', event_id: `close-${providerSessionId.slice(-12)}` }], 8_000);
  },
});
