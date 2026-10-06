import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * The portfolio's only table: recruiter briefs, so share links outlive the
 * chat. The brief and its evidence are stored as written; the app owns their
 * shape (src/lib/recruiter-brief/types.ts).
 */
export default defineSchema({
  recruiterBriefs: defineTable({
    publicId: v.string(),
    createdAt: v.number(),
    roleTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
    generatedBrief: v.any(),
    evidenceReferences: v.any(),
    version: v.number(),
  }).index('by_publicId', ['publicId']),
});
