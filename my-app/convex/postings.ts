import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * The rows extracted from each job posting. Only the portfolio's server (it
 * holds BRIEF_WRITE_KEY) reads and writes them.
 */
function authorized(key: string): boolean {
  const expected = process.env.BRIEF_WRITE_KEY;
  return Boolean(expected) && key === expected;
}

export const get = query({
  args: { key: v.string(), hash: v.string() },
  handler: async (ctx, { key, hash }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const row = await ctx.db
      .query('postingExtractions')
      .withIndex('by_hash', (q) => q.eq('hash', hash))
      .unique();
    return row?.extracted ?? null;
  },
});

export const save = mutation({
  args: { key: v.string(), hash: v.string(), roleTitle: v.optional(v.string()), companyName: v.optional(v.string()), extracted: v.any() },
  handler: async (ctx, { key, ...posting }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const existing = await ctx.db
      .query('postingExtractions')
      .withIndex('by_hash', (q) => q.eq('hash', posting.hash))
      .unique();
    // First write wins: a posting keeps its rows until it is forgotten.
    if (!existing) await ctx.db.insert('postingExtractions', { ...posting, savedAt: Date.now() });
  },
});

export const getEvaluation = query({
  args: { key: v.string(), evaluationKey: v.string() },
  handler: async (ctx, { key, evaluationKey }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const row = await ctx.db
      .query('fitEvaluations')
      .withIndex('by_key', (q) => q.eq('key', evaluationKey))
      .unique();
    return row?.evaluation ?? null;
  },
});

export const saveEvaluation = mutation({
  args: { key: v.string(), evaluationKey: v.string(), roleTitle: v.optional(v.string()), companyName: v.optional(v.string()), evaluation: v.string() },
  handler: async (ctx, { key, evaluationKey, ...rest }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const existing = await ctx.db
      .query('fitEvaluations')
      .withIndex('by_key', (q) => q.eq('key', evaluationKey))
      .unique();
    if (!existing) await ctx.db.insert('fitEvaluations', { key: evaluationKey, ...rest, savedAt: Date.now() });
  },
});

/** Forget postings (rows and verdicts) whose role or company contains `match`, or every posting with "--all". */
export const forget = mutation({
  args: { key: v.string(), match: v.string() },
  handler: async (ctx, { key, match }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const term = match.trim().toLowerCase();
    const forgotten: string[] = [];
    const matches = (row: { roleTitle?: string; companyName?: string }) => {
      const label = `${row.roleTitle ?? ''} ${row.companyName ?? ''}`.trim();
      return term === '--all' || (Boolean(term) && label.toLowerCase().includes(term));
    };
    for (const row of await ctx.db.query('postingExtractions').collect()) {
      if (!matches(row)) continue;
      await ctx.db.delete(row._id);
      forgotten.push(`${row.roleTitle ?? ''} ${row.companyName ?? ''}`.trim() || row.hash);
    }
    for (const row of await ctx.db.query('fitEvaluations').collect()) {
      if (matches(row)) await ctx.db.delete(row._id);
    }
    return forgotten;
  },
});
