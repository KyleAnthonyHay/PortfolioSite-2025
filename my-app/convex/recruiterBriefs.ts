import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

/**
 * Writes need the server-side key, so only the portfolio's own API can save
 * a brief; anyone with a link can read that one brief.
 */
function authorized(key: string): boolean {
  const expected = process.env.BRIEF_WRITE_KEY;
  return Boolean(expected) && key === expected;
}

export const save = mutation({
  args: {
    key: v.string(),
    publicId: v.string(),
    createdAt: v.number(),
    roleTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
    generatedBrief: v.any(),
    evidenceReferences: v.any(),
    version: v.number(),
  },
  handler: async (ctx, { key, ...brief }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    const existing = await ctx.db
      .query('recruiterBriefs')
      .withIndex('by_publicId', (q) => q.eq('publicId', brief.publicId))
      .unique();
    if (existing) await ctx.db.replace(existing._id, brief);
    else await ctx.db.insert('recruiterBriefs', brief);
  },
});

export const get = query({
  args: { publicId: v.string() },
  handler: async (ctx, { publicId }) => {
    const brief = await ctx.db
      .query('recruiterBriefs')
      .withIndex('by_publicId', (q) => q.eq('publicId', publicId))
      .unique();
    if (!brief) return null;
    const { _id, _creationTime, ...rest } = brief;
    void _id;
    void _creationTime;
    return rest;
  },
});

/** A visitor's opt-in to receive a brief by email; kept whether or not the email sends. */
export const recordRequest = mutation({
  args: {
    key: v.string(),
    publicId: v.string(),
    email: v.string(),
    roleTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    sent: v.boolean(),
  },
  handler: async (ctx, { key, ...request }) => {
    if (!authorized(key)) throw new Error('Not allowed');
    await ctx.db.insert('briefRequests', { ...request, createdAt: Date.now() });
  },
});
