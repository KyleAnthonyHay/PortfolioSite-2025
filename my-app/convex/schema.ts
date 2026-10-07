import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Recruiter briefs, so share links outlive the chat, and the requirement rows
 * extracted from each posting, so one posting always gets the same rows. The
 * app owns the shape of what is stored (src/lib/recruiter-brief/).
 */
export default defineSchema({
  /** Task coordination records; conversation text still belongs to the existing chat. */
  taskConversations: defineTable({
    owner: v.string(), conversationId: v.string(), version: v.number(),
    deliveryToken: v.optional(v.string()), deliveryUntil: v.optional(v.number()),
  }).index('by_owner_conversation', ['owner', 'conversationId']),
  taskTurns: defineTable({
    owner: v.string(), conversationId: v.string(), requestId: v.string(),
    sequence: v.number(), input: v.string(), planned: v.boolean(),
    planToken: v.optional(v.string()), planUntil: v.optional(v.number()),
  }).index('by_owner_conversation_request', ['owner', 'conversationId', 'requestId'])
    .index('by_owner_conversation_planned', ['owner', 'conversationId', 'planned']),
  agentTasks: defineTable({
    owner: v.string(), conversationId: v.string(), revision: v.number(),
    instruction: v.string(), input: v.string(),
    status: v.union(v.literal('queued'), v.literal('running'), v.literal('waiting'), v.literal('completed'), v.literal('canceled'), v.literal('failed')),
    events: v.string(), answer: v.string(), updatedAt: v.number(),
    lease: v.optional(v.string()),
    delivery: v.union(v.literal('pending'), v.literal('submitted'), v.literal('interrupted'), v.literal('quiet')),
    deliveryToken: v.optional(v.string()),
    previousResult: v.optional(v.string()),
  }).index('by_owner_conversation', ['owner', 'conversationId'])
    .index('by_owner_conversation_status', ['owner', 'conversationId', 'status']),
  agentTaskRevisions: defineTable({
    taskId: v.id('agentTasks'), revision: v.number(), instruction: v.string(), input: v.string(),
    status: v.string(), events: v.string(), answer: v.string(),
  }).index('by_task_revision', ['taskId', 'revision']),
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
    /** Legacy arrival counter retained for stored calls. Current task revisions live in agentTasks. */
    taskRevision: v.optional(v.number()),
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
