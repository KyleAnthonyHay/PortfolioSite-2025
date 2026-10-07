import { v } from 'convex/values';
import { mutation, query, internalMutation, type QueryCtx } from './_generated/server';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
type TaskInput = { voice?: boolean; sessionId?: string; delegationId?: string; [key: string]: unknown };

const authArgs = { serverKey: v.string(), owner: v.string(), conversationId: v.string() };
function authorize(key: string) {
  if (!process.env.BRIEF_WRITE_KEY || key !== process.env.BRIEF_WRITE_KEY) throw new Error('Not allowed');
}
async function conversation(ctx: QueryCtx, owner: string, conversationId: string) {
  return ctx.db.query('taskConversations').withIndex('by_owner_conversation', q => q.eq('owner', owner).eq('conversationId', conversationId)).unique();
}
async function records(ctx: QueryCtx, owner: string, conversationId: string) {
  const recent = await ctx.db.query('agentTasks').withIndex('by_owner_conversation', q => q.eq('owner', owner).eq('conversationId', conversationId)).order('desc').take(32);
  const active = await Promise.all((['queued', 'running', 'waiting'] as const).map(status => ctx.db.query('agentTasks').withIndex('by_owner_conversation_status', q => q.eq('owner', owner).eq('conversationId', conversationId).eq('status', status)).take(8)));
  return [...new Map([...recent, ...active.flat()].map(task => [task._id, task])).values()].sort((a, b) => a._creationTime - b._creationTime);
}
function view(task: Doc<'agentTasks'>) {
  return { id: task._id, revision: task.revision, instruction: task.instruction, input: JSON.parse(task.input), status: task.status, events: JSON.parse(task.events), answer: task.answer, updatedAt: task.updatedAt, delivery: task.delivery, previousResult: task.previousResult ? JSON.parse(task.previousResult) : null };
}
const active = (task: Doc<'agentTasks'>) => ['queued', 'running', 'waiting'].includes(task.status);

export const receive = mutation({
  args: { ...authArgs, requestId: v.string(), input: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    if (args.input.length > 220_000 || args.requestId.length > 100) throw new Error('Request too large');
    const existing = await ctx.db.query('taskTurns').withIndex('by_owner_conversation_request', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('requestId', args.requestId)).unique();
    if (existing) return false;
    const pending = await ctx.db.query('taskTurns').withIndex('by_owner_conversation_planned', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('planned', false)).take(8);
    if (pending.length >= 8) throw new Error('Too many pending requests');
    let current = await conversation(ctx, args.owner, args.conversationId);
    if (!current) {
      const id = await ctx.db.insert('taskConversations', { owner: args.owner, conversationId: args.conversationId, version: 0 });
      current = (await ctx.db.get(id))!;
    }
    const version = current.version + 1;
    await ctx.db.patch(current._id, { version });
    await ctx.db.insert('taskTurns', { owner: args.owner, conversationId: args.conversationId, requestId: args.requestId, input: args.input, sequence: version, planned: false });
    return true;
  },
});

export const snapshot = query({
  args: authArgs, returns: v.any(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const current = await conversation(ctx, args.owner, args.conversationId);
    const turns = await ctx.db.query('taskTurns').withIndex('by_owner_conversation_planned', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('planned', false)).take(8);
    const tasks = await records(ctx, args.owner, args.conversationId);
    return { version: current?.version ?? 0, turns: turns.sort((a,b) => a.sequence-b.sequence).map(turn => ({ id: turn._id, input: JSON.parse(turn.input) })), tasks: tasks.map(view) };
  },
});

export const claimPlanning = mutation({
  args: { ...authArgs, turnId: v.id('taskTurns'), token: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const turn = await ctx.db.get(args.turnId);
    if (!turn || turn.owner !== args.owner || turn.conversationId !== args.conversationId || turn.planned || (turn.planUntil ?? 0) > Date.now()) return false;
    await ctx.db.patch(turn._id, { planToken: args.token, planUntil: Date.now() + 75_000 });
    return true;
  },
});
export const releasePlanning = mutation({
  args: { ...authArgs, turnId: v.id('taskTurns'), token: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const turn = await ctx.db.get(args.turnId);
    if (turn && turn.owner === args.owner && turn.conversationId === args.conversationId && turn.planToken === args.token) await ctx.db.patch(turn._id, { planToken: undefined, planUntil: undefined });
    return null;
  },
});

const actionValidator = v.object({ kind: v.union(v.literal('start'), v.literal('update'), v.literal('cancel'), v.literal('continue')), taskId: v.optional(v.id('agentTasks')), instruction: v.optional(v.string()) });
export const applyPlan = mutation({
  args: { ...authArgs, turnId: v.id('taskTurns'), version: v.number(), token: v.string(), actions: v.array(actionValidator), reply: v.optional(v.string()) }, returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const current = await conversation(ctx, args.owner, args.conversationId);
    const turn = await ctx.db.get(args.turnId);
    if (!current || current.version !== args.version || !turn || turn.planned || turn.planToken !== args.token || turn.owner !== args.owner || turn.conversationId !== args.conversationId) return false;
    const input = JSON.parse(turn.input) as TaskInput;
    const tasks = await records(ctx, args.owner, args.conversationId);
    const plan = args.actions;
    if (plan.length > 8) throw new Error('Too many task actions');
    const handled = new Set<string>();
    for (const action of plan) {
      if (action.kind === 'start') {
        if (!action.instruction?.trim() || action.instruction.length > 8000) throw new Error('Invalid task instruction');
      } else {
        const target = tasks.find(task => task._id === action.taskId);
        if (!target || handled.has(target._id)) throw new Error('Invalid task target');
        handled.add(target._id);
        if (action.kind === 'update' && (!action.instruction?.trim() || action.instruction.length > 8000)) throw new Error('Invalid update');
        if (action.kind === 'continue' && !active(target) && !(target.status === 'completed' && target.delivery === 'interrupted')) throw new Error('Cannot continue a finished task');
      }
    }
    const remaining = tasks.filter(active).length + plan.filter(a => a.kind === 'start').length - plan.filter(a => a.kind === 'cancel' && tasks.some(t => t._id === a.taskId && active(t))).length + plan.filter(a => a.kind === 'update' && tasks.some(t => t._id === a.taskId && !active(t))).length;
    if (remaining > 8) throw new Error('Too many active tasks');
    for (const action of plan) {
      if (action.kind === 'start') {
        await ctx.db.insert('agentTasks', { owner: args.owner, conversationId: args.conversationId, revision: 1, instruction: action.instruction!, input: turn.input, status: 'queued', events: '[]', answer: '', updatedAt: Date.now(), delivery: input.sessionId ? 'pending' : 'quiet' });
      } else if (action.kind === 'update') {
        const target = tasks.find(task => task._id === action.taskId)!;
        await ctx.db.insert('agentTaskRevisions', { taskId: target._id, revision: target.revision, instruction: target.instruction, input: target.input, status: target.status, events: target.events, answer: target.answer });
        const previousResult = JSON.stringify({ goal: target.instruction, status: target.status, answer: target.answer });
        const previous = JSON.parse(target.input) as TaskInput;
        // Updating a voice task with typed data keeps its original voice handoff.
        const priorMessages = [...(Array.isArray(previous.history) ? previous.history : []), { role: 'user', content: previous.message, receivedAt: previous.receivedAt, channel: previous.voice ? 'voice' : 'typed' }];
        const currentHistory = Array.isArray(input.history) ? input.history : [];
        const history = [...priorMessages, ...currentHistory].filter((message, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(message)) === index).slice(-20);
        const merged = { ...input, history, ...(previous.voice && !input.voice ? { voice: true, sessionId: previous.sessionId, delegationId: previous.delegationId } : {}) };
        await ctx.db.patch(target._id, { revision: target.revision + 1, previousResult, instruction: action.instruction!, input: JSON.stringify(merged), status: 'queued', events: '[]', answer: '', lease: undefined, deliveryToken: undefined, delivery: merged.sessionId ? 'pending' : 'quiet', updatedAt: Date.now() });
      } else if (action.kind === 'continue') {
        const target = tasks.find(task => task._id === action.taskId)!;
        if (target.delivery === 'interrupted' && ['completed','waiting'].includes(target.status)) {
          const previous = JSON.parse(target.input) as TaskInput;
          const resumed = input.sessionId ? { ...previous, sessionId: input.sessionId, delegationId: input.delegationId, voice: input.voice } : previous;
          await ctx.db.patch(target._id, { input: JSON.stringify(resumed), delivery: resumed.sessionId ? 'pending' : 'quiet', deliveryToken: undefined, updatedAt: Date.now() });
        }
      } else if (action.kind === 'cancel') {
        const target = tasks.find(task => task._id === action.taskId)!;
        await ctx.db.patch(target._id, { revision: target.revision + 1, status: 'canceled', lease: undefined, deliveryToken: undefined, delivery: 'quiet', updatedAt: Date.now() });
      }
    }
    if (args.reply?.trim()) {
      const answer = args.reply.slice(0, 2400);
      await ctx.db.insert('agentTasks', { owner: args.owner, conversationId: args.conversationId, revision: 1, instruction: 'Conversation clarification or task status', input: turn.input, status: 'completed', events: JSON.stringify([{ type: 'text', delta: answer }, { type: 'answered' }, { type: 'done' }]), answer, updatedAt: Date.now(), delivery: input.sessionId ? 'pending' : 'quiet' });
    }
    await ctx.db.patch(turn._id, { planned: true });
    await ctx.db.patch(current._id, { version: current.version + 1 });
    return true;
  },
});

export const failTurn = mutation({
  args: { ...authArgs, turnId: v.id('taskTurns'), token: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const turn = await ctx.db.get(args.turnId);
    if (turn && turn.owner === args.owner && turn.conversationId === args.conversationId && !turn.planned && turn.planToken === args.token) {
      await ctx.db.patch(turn._id, { planned: true });
      const current = await conversation(ctx, args.owner, args.conversationId);
      if (current) await ctx.db.patch(current._id, { version: current.version + 1 });
      const input = JSON.parse(turn.input) as TaskInput;
      const answer = 'I could not coordinate that request. Existing tasks are still available; please try again.';
      await ctx.db.insert('agentTasks', { owner: args.owner, conversationId: args.conversationId, revision: 1, instruction: 'Request coordination failed', input: turn.input, status: 'failed', events: JSON.stringify([{ type: 'error', message: answer }, { type: 'done' }]), answer, updatedAt: Date.now(), delivery: input.sessionId ? 'pending' : 'quiet' });
    }
    return null;
  },
});

export const claim = mutation({
  args: { ...authArgs, taskId: v.id('agentTasks'), revision: v.number(), lease: v.string() }, returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.owner !== args.owner || task.conversationId !== args.conversationId || task.status !== 'queued' || task.revision !== args.revision) return false;
    const running = await ctx.db.query('agentTasks').withIndex('by_owner_conversation_status', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('status', 'running')).take(3);
    if (running.length >= 3) return false;
    await ctx.db.patch(task._id, { status: 'running', lease: args.lease, updatedAt: Date.now() });
    await ctx.scheduler.runAfter(270_000, internal.tasks.expire, { taskId: task._id, revision: args.revision, lease: args.lease });
    return true;
  },
});

export const progress = mutation({
  args: { ...authArgs, taskId: v.id('agentTasks'), revision: v.number(), lease: v.string(), events: v.string(), answer: v.string(), status: v.union(v.literal('running'), v.literal('waiting'), v.literal('completed'), v.literal('failed')) }, returns: v.boolean(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.owner !== args.owner || task.conversationId !== args.conversationId || task.revision !== args.revision || task.lease !== args.lease || task.status !== 'running') return false;
    if (args.events.length > 350_000 || args.answer.length > 32_000) throw new Error('Task output too large');
    await ctx.db.patch(task._id, { status: args.status, events: args.events, answer: args.answer, updatedAt: Date.now() });
    if (args.status !== 'running') {
      const current = await conversation(ctx, args.owner, args.conversationId);
      if (current) await ctx.db.patch(current._id, { version: current.version + 1 });
    }
    return true;
  },
});

export const expire = internalMutation({
  args: { taskId: v.id('agentTasks'), revision: v.number(), lease: v.string() }, returns: v.null(),
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (task?.status === 'running' && task.revision === args.revision && task.lease === args.lease) {
      const current = await conversation(ctx, task.owner, task.conversationId);
      if (current) await ctx.db.patch(current._id, { version: current.version + 1 });
      const message = 'This task stopped before finishing. Its saved results are retained; ask me to retry if needed.';
      await ctx.db.patch(task._id, { status: 'failed', events: JSON.stringify([...JSON.parse(task.events), { type: 'error', message }, { type: 'done' }]), answer: task.answer || message, updatedAt: Date.now() });
    }
    return null;
  },
});

/** A user pressed the explicit Stop button. Speech by itself never calls this. */
export const cancelAll = mutation({
  args: authArgs, returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const tasks = await records(ctx, args.owner, args.conversationId);
    for (const task of tasks.filter(active)) await ctx.db.patch(task._id, { revision: task.revision + 1, status: 'canceled', lease: undefined, delivery: 'quiet', updatedAt: Date.now() });
    const turns = await ctx.db.query('taskTurns').withIndex('by_owner_conversation_planned', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('planned', false)).take(8);
    for (const turn of turns) await ctx.db.patch(turn._id, { planned: true });
    const current = await conversation(ctx, args.owner, args.conversationId);
    if (current) await ctx.db.patch(current._id, { version: current.version + 1 });
    return null;
  },
});

export const claimDelivery = mutation({
  args: { ...authArgs, taskId: v.id('agentTasks'), revision: v.number(), token: v.string() }, returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const current = await conversation(ctx, args.owner, args.conversationId);
    const task = await ctx.db.get(args.taskId);
    const pending = await ctx.db.query('taskTurns').withIndex('by_owner_conversation_planned', q => q.eq('owner', args.owner).eq('conversationId', args.conversationId).eq('planned', false)).take(1);
    if (!current || pending.length || (current.deliveryUntil ?? 0) > Date.now() || !task || task.owner !== args.owner || task.conversationId !== args.conversationId || task.revision !== args.revision || task.delivery !== 'pending' || !['completed','waiting','failed'].includes(task.status)) return null;
    await ctx.db.patch(current._id, { deliveryToken: args.token, deliveryUntil: Date.now() + 90_000 });
    await ctx.db.patch(task._id, { deliveryToken: args.token });
    return current.version;
  },
});

export const finishDelivery = mutation({
  args: { ...authArgs, taskId: v.id('agentTasks'), revision: v.number(), token: v.string(), delivery: v.union(v.literal('pending'), v.literal('submitted'), v.literal('interrupted'), v.literal('quiet')), release: v.boolean() }, returns: v.null(),
  handler: async (ctx, args) => {
    authorize(args.serverKey);
    const task = await ctx.db.get(args.taskId);
    const current = await conversation(ctx, args.owner, args.conversationId);
    if (task && task.owner === args.owner && task.conversationId === args.conversationId && task.revision === args.revision && task.deliveryToken === args.token) await ctx.db.patch(task._id, { delivery: args.delivery });
    if (current?.deliveryToken === args.token && args.release) await ctx.db.patch(current._id, { deliveryToken: undefined, deliveryUntil: undefined });
    return null;
  },
});
