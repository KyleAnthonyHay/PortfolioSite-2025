import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Recruiter briefs, so share links outlive the chat, and the requirement rows
 * extracted from each posting, so one posting always gets the same rows. The
 * app owns the shape of what is stored (src/lib/recruiter-brief/).
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
  postingExtractions: defineTable({
    /** sha256 of the posting text with whitespace collapsed, first 16 hex characters. */
    hash: v.string(),
    savedAt: v.number(),
    roleTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    extracted: v.any(),
  }).index('by_hash', ['hash']),
  /** A posting's judged fit, keyed by the posting and a hash of the facts and write-ups it was judged against. */
  fitEvaluations: defineTable({
    key: v.string(),
    savedAt: v.number(),
    roleTitle: v.optional(v.string()),
    companyName: v.optional(v.string()),
    /** The evaluation as JSON text. */
    evaluation: v.string(),
  }).index('by_key', ['key']),
});
