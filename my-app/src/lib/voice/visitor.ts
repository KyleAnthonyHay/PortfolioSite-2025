import { createHmac } from 'crypto';
import type { NextRequest } from 'next/server';

/**
 * Who is calling, for the daily allowance: the public IP the hosting
 * platform saw, never a header the browser can set.
 *
 * On Vercel, x-vercel-forwarded-for and x-real-ip are written by the edge
 * and x-forwarded-for is overwritten with the client address, so a visitor
 * cannot spoof them. The first hop is the client. Locally there is no proxy,
 * so every request is the same "local" visitor.
 */
export function clientIp(request: NextRequest): string {
  const first = (value: string | null) => value?.split(',')[0]?.trim() || '';
  // Development only: lets a test stand in for different visitors on one machine.
  if (process.env.NODE_ENV !== 'production' && request.headers.get('x-voice-test-ip')) return first(request.headers.get('x-voice-test-ip'));
  return (
    first(request.headers.get('x-vercel-forwarded-for')) ||
    first(request.headers.get('x-real-ip')) ||
    first(request.headers.get('x-forwarded-for')) ||
    'local'
  );
}

/**
 * The stored identifier: an HMAC of the IP with a server-only secret, so the
 * ledger never holds an address and a leaked table can't be reversed by
 * hashing the IPv4 space.
 */
export function visitorKey(request: NextRequest): string {
  const secret = process.env.VOICE_IP_SECRET;
  if (!secret) throw new Error('VOICE_IP_SECRET is not set');
  return createHmac('sha256', secret).update(clientIp(request)).digest('base64url').slice(0, 32);
}
