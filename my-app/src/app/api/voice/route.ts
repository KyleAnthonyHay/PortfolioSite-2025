import { NextRequest } from 'next/server';
import { sanitizeHistory } from '@/lib/chat-request';
import { createLiveSession, sendToSession } from '@/lib/voice/live';
import { ledger, sessionIdFrom } from '@/lib/voice/ledger';
import { visitorKey } from '@/lib/voice/visitor';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Voice calls (see src/lib/voice/live.ts). The browser never holds a key or
 * decides how long it may talk: the ledger in Convex times every call from
 * the server's clock and a scheduled worker closes it at the deadline.
 *
 * GET: today's remaining time. POST actions: start, heartbeat, end, context.
 */

function keyOr503(request: NextRequest): string | Response {
  try {
    return visitorKey(request);
  } catch (error) {
    console.error('voice: not configured', error);
    return Response.json({ error: 'VOICE_UNAVAILABLE' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const key = keyOr503(request);
  if (key instanceof Response) return key;
  try {
    return Response.json(await ledger.allowance(key));
  } catch (error) {
    console.error('voice: allowance failed', error);
    return Response.json({ error: 'VOICE_UNAVAILABLE' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  // sendBeacon posts text/plain; read the body as text either way.
  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (raw.length > 200_000) return Response.json({ error: 'VOICE_INVALID_REQUEST' }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return Response.json({ error: 'VOICE_INVALID_REQUEST' }, { status: 400 });
  }
  const key = keyOr503(request);
  if (key instanceof Response) return key;

  try {
    switch (body.action) {
      case 'start':
        return await start(key, body);
      case 'heartbeat': {
        const sessionId = sessionIdFrom(body.sessionId);
        const state = sessionId ? await ledger.heartbeat(key, sessionId) : null;
        return state ? Response.json(state) : Response.json({ error: 'VOICE_NOT_FOUND' }, { status: 404 });
      }
      case 'end': {
        const sessionId = sessionIdFrom(body.sessionId);
        const reason = typeof body.reason === 'string' && /^[a-z_]{2,30}$/.test(body.reason) ? body.reason : 'hung_up';
        const result = sessionId ? await ledger.end(key, sessionId, reason) : null;
        return result ? Response.json(result) : Response.json({ error: 'VOICE_NOT_FOUND' }, { status: 404 });
      }
      case 'context':
        return await context(key, body);
      default:
        return Response.json({ error: 'VOICE_INVALID_REQUEST' }, { status: 400 });
    }
  } catch (error) {
    console.error('voice: request failed', body.action, error);
    return Response.json({ error: 'VOICE_UNAVAILABLE' }, { status: 503 });
  }
}

async function start(key: string, body: Record<string, unknown>): Promise<Response> {
  const sdp = typeof body.sdp === 'string' ? body.sdp : '';
  if (!sdp.trim() || sdp.length > 150_000) return Response.json({ error: 'VOICE_INVALID_REQUEST' }, { status: 400 });
  const replace = sessionIdFrom(body.replace) ?? undefined;

  const reserved = await ledger.reserve(key, replace);
  if (!reserved.ok) return Response.json({ error: reserved.error, resetAt: 'resetAt' in reserved ? reserved.resetAt : undefined }, { status: reserved.error === 'VOICE_BUSY' ? 409 : 429 });

  let providerSessionId: string | null = null;
  try {
    const live = await createLiveSession(sdp, sanitizeHistory(body.history, 12));
    providerSessionId = live.providerSessionId;
    const { deadline, serverNow } = await ledger.attach(reserved.sessionId, live.providerSessionId);
    return Response.json({ sessionId: reserved.sessionId, sdp: live.sdp, deadline, serverNow }, { status: 201 });
  } catch (error) {
    await ledger.fail(reserved.sessionId).catch(() => {});
    // The provider accepted but our ledger didn't: don't leave an untimed call running.
    if (providerSessionId) await sendToSession(providerSessionId, [{ type: 'session.close' }]).catch(() => {});
    throw error;
  }
}

/** A typed exchange during a call, so the voice knows what was said in text. */
async function context(key: string, body: Record<string, unknown>): Promise<Response> {
  const sessionId = sessionIdFrom(body.sessionId);
  const state = sessionId ? await ledger.owned(key, sessionId) : null;
  if (!state || state.status !== 'live' || !state.providerSessionId) return Response.json({ ok: false });
  const user = typeof body.user === 'string' ? body.user.slice(0, 600) : '';
  const assistant = typeof body.assistant === 'string' ? body.assistant.slice(0, 900) : '';
  if (!user) return Response.json({ ok: false });
  await sendToSession(state.providerSessionId, [
    {
      type: 'session.thinking.append',
      delegation_id: null,
      content: `The visitor typed in the chat during the call: "${user}". The agent answered in the chat: "${assistant}". Do not repeat this aloud unless they ask about it.`,
    },
  ]);
  return Response.json({ ok: true });
}
