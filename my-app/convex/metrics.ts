import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/** Rows older than this are deleted as new ones arrive. */
const KEEP_MS = 90 * 24 * 60 * 60 * 1000;

function authorize(key: string) {
  if (!process.env.BRIEF_WRITE_KEY || key !== process.env.BRIEF_WRITE_KEY) throw new Error('Not allowed');
}

/** One row per answer or planning step: timings, tool names and token counts only. */
export const record = mutation({
  args: {
    key: v.string(),
    kind: v.union(v.literal('answer'), v.literal('plan')),
    channel: v.union(v.literal('typed'), v.literal('voice')),
    status: v.string(),
    waitMs: v.optional(v.number()),
    firstTextMs: v.optional(v.number()),
    totalMs: v.number(),
    tools: v.array(v.object({ name: v.string(), ms: v.number() })),
    fitCheck: v.boolean(),
    modelCalls: v.number(),
    inputTokens: v.number(),
    outputTokens: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, { key, ...row }) => {
    authorize(key);
    const at = Date.now();
    await ctx.db.insert('agentMetrics', { at, ...row, tools: row.tools.slice(0, 20) });
    const old = await ctx.db.query('agentMetrics').withIndex('by_at', (q) => q.lt('at', at - KEEP_MS)).take(20);
    for (const row of old) await ctx.db.delete(row._id);
    return null;
  },
});

/** The dashboard's data: rows since a time, newest first. */
export const since = query({
  args: { key: v.string(), since: v.number() },
  returns: v.any(),
  handler: async (ctx, { key, since }) => {
    authorize(key);
    return ctx.db.query('agentMetrics').withIndex('by_at', (q) => q.gte('at', since)).order('desc').take(5000);
  },
});
