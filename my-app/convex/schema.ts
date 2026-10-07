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
  /**
   * Voice time used per visitor per New York day. `key` is an HMAC of the
   * visitor's public IP made by the site's server; the raw IP is never stored.
   */
  voiceDays: defineTable({
    key: v.string(),
    /** YYYY-MM-DD in America/New_York, so the allowance resets at midnight there. */
    day: v.string(),
    usedMs: v.number(),
  }).index('by_key_day', ['key', 'day']),
  /** One row per call. At most one is reserved or live per key at a time. */
  voiceSessions: defineTable({
    key: v.string(),
    day: v.string(),
    status: v.union(v.literal('reserved'), v.literal('live'), v.literal('closed')),
    providerSessionId: v.optional(v.string()),
    createdAt: v.number(),
    /** Connected time counts from here: when the provider accepted the call. */
    startedAt: v.optional(v.number()),
    /** startedAt + reservedMs: the server closes the call at this instant. */
    deadline: v.optional(v.number()),
    /** Everything left of the day's allowance when the call started. */
    reservedMs: v.number(),
    lastHeartbeat: v.number(),
    endedAt: v.optional(v.number()),
    chargedMs: v.optional(v.number()),
    closeReason: v.optional(v.string()),
    /** A development call that doesn't count against the day (see voice.reserve). */
    unlimited: v.optional(v.boolean()),
  })
    .index('by_key_status', ['key', 'status'])
    .index('by_provider', ['providerSessionId']),
});
