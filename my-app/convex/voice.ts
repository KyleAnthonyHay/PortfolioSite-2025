import { v } from 'convex/values';
import { internalMutation, internalQuery, mutation, query, type MutationCtx, type QueryCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { nextReset, nyDay } from './voiceDay';

/**
 * The voice allowance ledger. Each public IP (as an HMAC the site's server
 * makes; never the raw address) gets VOICE_DAILY_SECONDS of connected call
 * time per New York day, shared across calls, with one call at a time.
 *
 * Time is the server's: a call is charged from the moment the provider
 * accepts it to the moment it is settled, whatever the browser says, so
 * mute, silence, background tabs and reconnects all count. The deadline is
 * fixed when the call starts and a scheduled worker closes the provider
 * session at that instant (voiceWorker.ts), so a browser that ignores its
 * own countdown is still cut off.
 *
 * Only the portfolio's server can call these (it holds BRIEF_WRITE_KEY).
 */

const DEFAULT_DAILY_SECONDS = 600;
/** A call with less than this left is not worth connecting. */
const MIN_CALL_MS = 5_000;
/** The browser heartbeats every 10 s; this much silence means the tab is gone. */
const STALE_MS = 60_000;
const SWEEP_MS = 20_000;

function authorized(serverKey: string): boolean {
  const expected = process.env.BRIEF_WRITE_KEY;
  return Boolean(expected) && serverKey === expected;
}

function allowanceMs(): number {
  const seconds = Number(process.env.VOICE_DAILY_SECONDS);
  return (Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_DAILY_SECONDS) * 1000;
}

async function dayRow(ctx: MutationCtx, key: string, day: string): Promise<Doc<'voiceDays'>> {
  const row = await ctx.db.query('voiceDays').withIndex('by_key_day', (q) => q.eq('key', key).eq('day', day)).unique();
  if (row) return row;
  const id = await ctx.db.insert('voiceDays', { key, day, usedMs: 0 });
  return (await ctx.db.get(id))!;
}

async function openSession(ctx: QueryCtx, key: string): Promise<Doc<'voiceSessions'> | null> {
  return (
    (await ctx.db.query('voiceSessions').withIndex('by_key_status', (q) => q.eq('key', key).eq('status', 'live')).first()) ??
    (await ctx.db.query('voiceSessions').withIndex('by_key_status', (q) => q.eq('key', key).eq('status', 'reserved')).first())
  );
}

/** Charge connected time once and close the row. Returns what was charged. */
async function settle(ctx: MutationCtx, session: Doc<'voiceSessions'>, reason: string, now: number): Promise<number> {
  if (session.status === 'closed') return session.chargedMs ?? 0;
  const charged = session.startedAt ? Math.min(Math.max(0, now - session.startedAt), session.reservedMs) : 0;
  if (!session.unlimited) {
    const day = await dayRow(ctx, session.key, session.day);
    await ctx.db.patch(day._id, { usedMs: day.usedMs + charged });
  }
  await ctx.db.patch(session._id, { status: 'closed', endedAt: now, chargedMs: charged, closeReason: reason });
  // The browser may be gone: make sure the provider stops too. Harmless if it already closed.
  if (session.providerSessionId) await ctx.scheduler.runAfter(0, internal.voiceWorker.closeProvider, { providerSessionId: session.providerSessionId });
  return charged;
}

function remainingFor(usedMs: number): number {
  return Math.max(0, allowanceMs() - usedMs);
}

/** What a visitor has left today, for the Talk button. */
export const allowance = query({
  args: { serverKey: v.string(), key: v.string() },
  handler: async (ctx, { serverKey, key }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const now = Date.now();
    const day = await ctx.db.query('voiceDays').withIndex('by_key_day', (q) => q.eq('key', key).eq('day', nyDay(now))).unique();
    const open = await openSession(ctx, key);
    const running = open?.status === 'live' && open.startedAt ? Math.min(now - open.startedAt, open.reservedMs) : 0;
    return { remainingMs: Math.max(0, remainingFor(day?.usedMs ?? 0) - running), allowanceMs: allowanceMs(), active: Boolean(open), resetAt: nextReset(now) };
  },
});

/**
 * Hold the rest of today's allowance for a new call. Refuses a second call
 * while one is open for this key, unless that call is the one being replaced
 * (a reconnect from the same tab) or it has stopped heartbeating.
 */
export const reserve = mutation({
  args: { serverKey: v.string(), key: v.string(), replace: v.optional(v.string()), unlimited: v.optional(v.boolean()) },
  handler: async (ctx, { serverKey, key, replace, unlimited: asked }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const now = Date.now();
    const open = await openSession(ctx, key);
    if (open) {
      const stale = now - open.lastHeartbeat > STALE_MS;
      if (open._id !== replace && !stale) return { ok: false as const, error: 'VOICE_BUSY' as const };
      await settle(ctx, open, open._id === replace ? 'reconnected' : 'abandoned', now);
    }
    const day = nyDay(now);
    // Development testing: a full-length call that isn't counted. Needs the site to ask (it only does outside
    // production, with VOICE_DEV_UNLIMITED=1) and this deployment to allow it (VOICE_ALLOW_UNLIMITED=1, never set on prod).
    const unlimited = Boolean(asked) && process.env.VOICE_ALLOW_UNLIMITED === '1';
    const row = await dayRow(ctx, key, day);
    const remaining = unlimited ? allowanceMs() : remainingFor(row.usedMs);
    if (remaining < MIN_CALL_MS) return { ok: false as const, error: 'VOICE_NO_TIME' as const, resetAt: nextReset(now) };
    const sessionId = await ctx.db.insert('voiceSessions', { key, day, status: 'reserved', createdAt: now, reservedMs: remaining, lastHeartbeat: now, ...(unlimited ? { unlimited } : {}) });
    // A reservation the provider never accepted is released, uncharged.
    await ctx.scheduler.runAfter(SWEEP_MS, internal.voice.sweep, { sessionId });
    return { ok: true as const, sessionId, reservedMs: remaining };
  },
});

/** The provider accepted the call: connected time starts now, and the server-side cutoff is scheduled. */
export const attach = mutation({
  args: { serverKey: v.string(), sessionId: v.id('voiceSessions'), providerSessionId: v.string() },
  handler: async (ctx, { serverKey, sessionId, providerSessionId }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== 'reserved') throw new Error('VOICE_NOT_FOUND');
    const now = Date.now();
    const deadline = now + session.reservedMs;
    await ctx.db.patch(sessionId, { status: 'live', providerSessionId, startedAt: now, deadline, lastHeartbeat: now });
    if (session.reservedMs > 5 * 60_000 + 10_000) await ctx.scheduler.runAt(deadline - 5 * 60_000, internal.voiceWorker.notice, { sessionId, kind: 'five' });
    if (session.reservedMs > 60_000 + 10_000) await ctx.scheduler.runAt(deadline - 60_000, internal.voiceWorker.notice, { sessionId, kind: 'one' });
    // Early enough for one short sentence to finish before the line goes dead.
    await ctx.scheduler.runAt(Math.max(now, deadline - 9_000), internal.voiceWorker.notice, { sessionId, kind: 'goodbye' });
    await ctx.scheduler.runAt(deadline, internal.voiceWorker.cutoff, { sessionId });
    return { deadline, serverNow: now };
  },
});

/** Creating the provider session failed: release the reservation, nothing charged. */
export const fail = mutation({
  args: { serverKey: v.string(), sessionId: v.id('voiceSessions') },
  handler: async (ctx, { serverKey, sessionId }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const session = await ctx.db.get(sessionId);
    if (session && session.status === 'reserved') await ctx.db.patch(sessionId, { status: 'closed', endedAt: Date.now(), chargedMs: 0, closeReason: 'creation_failed' });
  },
});

function view(session: Doc<'voiceSessions'>, now: number) {
  return {
    status: session.status,
    deadline: session.deadline ?? null,
    serverNow: now,
    remainingMs: session.deadline ? Math.max(0, session.deadline - now) : session.reservedMs,
    closeReason: session.closeReason ?? null,
    chargedMs: session.chargedMs ?? null,
    providerSessionId: session.providerSessionId ?? null,
  };
}

/** The browser is still there. Also how it learns the server ended the call. */
export const heartbeat = mutation({
  args: { serverKey: v.string(), key: v.string(), sessionId: v.id('voiceSessions') },
  handler: async (ctx, { serverKey, key, sessionId }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const session = await ctx.db.get(sessionId);
    if (!session || session.key !== key) return null;
    const now = Date.now();
    if (session.status !== 'closed') await ctx.db.patch(sessionId, { lastHeartbeat: now });
    return view(session, now);
  },
});

/** A session this key owns, for routes that act on it (delegation). */
export const owned = query({
  args: { serverKey: v.string(), key: v.string(), sessionId: v.id('voiceSessions') },
  handler: async (ctx, { serverKey, key, sessionId }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const session = await ctx.db.get(sessionId);
    if (!session || session.key !== key) return null;
    return view(session, Date.now());
  },
});

/** Hang-up, a dropped tab's beacon, or the provider's own close: charge connected time once. */
export const end = mutation({
  args: { serverKey: v.string(), key: v.string(), sessionId: v.id('voiceSessions'), reason: v.string() },
  handler: async (ctx, { serverKey, key, sessionId, reason }) => {
    if (!authorized(serverKey)) throw new Error('Not allowed');
    const session = await ctx.db.get(sessionId);
    if (!session || session.key !== key) return null;
    const now = Date.now();
    const charged = await settle(ctx, session, reason.slice(0, 40), now);
    const day = await ctx.db.query('voiceDays').withIndex('by_key_day', (q) => q.eq('key', key).eq('day', nyDay(now))).unique();
    return { chargedMs: charged, remainingMs: remainingFor(day?.usedMs ?? 0), closeReason: (await ctx.db.get(sessionId))?.closeReason ?? reason };
  },
});

/** Backstop: release reservations that never connected, and close calls whose tab went quiet. */
export const sweep = internalMutation({
  args: { sessionId: v.id('voiceSessions') },
  handler: async (ctx, { sessionId }) => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status === 'closed') return;
    const now = Date.now();
    if (session.status === 'reserved') {
      if (now - session.createdAt > SWEEP_MS) await ctx.db.patch(sessionId, { status: 'closed', endedAt: now, chargedMs: 0, closeReason: 'never_connected' });
      else await ctx.scheduler.runAfter(SWEEP_MS, internal.voice.sweep, { sessionId });
      return;
    }
    if (now - session.lastHeartbeat > STALE_MS) {
      await settle(ctx, session, 'abandoned', now);
      return;
    }
    if (session.deadline && now > session.deadline + 15_000) {
      // The cutoff worker should have done this; settle at the deadline regardless.
      await settle(ctx, session, 'limit', session.deadline);
      return;
    }
    await ctx.scheduler.runAfter(SWEEP_MS, internal.voice.sweep, { sessionId });
  },
});

/** For the worker: the call as it stands. */
export const forWorker = internalQuery({
  args: { sessionId: v.id('voiceSessions') },
  handler: async (ctx, { sessionId }) => ctx.db.get(sessionId),
});

/** The cutoff fired: charge the whole reservation and close. */
export const settleAtDeadline = internalMutation({
  args: { sessionId: v.id('voiceSessions') },
  handler: async (ctx, { sessionId }): Promise<string | null> => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== 'live' || !session.deadline) return null;
    await settle(ctx, session, 'limit', session.deadline);
    return session.providerSessionId ?? null;
  },
});

/**
 * Admin tool (npx convex run voice:adjustUsage): set how much of today a key
 * has used, to give a visitor time back or to test the warnings and cutoff.
 */
export const adjustUsage = internalMutation({
  args: { key: v.string(), usedMs: v.number() },
  handler: async (ctx, { key, usedMs }) => {
    const row = await dayRow(ctx, key, nyDay(Date.now()));
    await ctx.db.patch(row._id, { usedMs: Math.max(0, usedMs) });
  },
});

export type VoiceSessionId = Id<'voiceSessions'>;
