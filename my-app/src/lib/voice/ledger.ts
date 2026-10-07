import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

/** The voice allowance ledger in Convex (convex/voice.ts); only this server holds the key. */

export type VoiceSessionId = Id<'voiceSessions'>;

let client: ConvexHttpClient | null = null;
function convex(): ConvexHttpClient {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL is not set');
  client ??= new ConvexHttpClient(url);
  return client;
}

function serverKey(): string {
  const key = process.env.BRIEF_WRITE_KEY;
  if (!key) throw new Error('BRIEF_WRITE_KEY is not set');
  return key;
}

/** Convex ids are opaque strings; reject anything that isn't shaped like one before it reaches a query. */
export function sessionIdFrom(value: unknown): VoiceSessionId | null {
  return typeof value === 'string' && /^[a-z0-9]{20,40}$/.test(value) ? (value as VoiceSessionId) : null;
}

export const ledger = {
  allowance: (key: string) => convex().query(api.voice.allowance, { serverKey: serverKey(), key }),
  reserve: (key: string, replace?: VoiceSessionId) => convex().mutation(api.voice.reserve, { serverKey: serverKey(), key, ...(replace ? { replace } : {}) }),
  attach: (sessionId: VoiceSessionId, providerSessionId: string) => convex().mutation(api.voice.attach, { serverKey: serverKey(), sessionId, providerSessionId }),
  fail: (sessionId: VoiceSessionId) => convex().mutation(api.voice.fail, { serverKey: serverKey(), sessionId }),
  heartbeat: (key: string, sessionId: VoiceSessionId) => convex().mutation(api.voice.heartbeat, { serverKey: serverKey(), key, sessionId }),
  owned: (key: string, sessionId: VoiceSessionId) => convex().query(api.voice.owned, { serverKey: serverKey(), key, sessionId }),
  end: (key: string, sessionId: VoiceSessionId, reason: string) => convex().mutation(api.voice.end, { serverKey: serverKey(), key, sessionId, reason }),
};
