import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { TaskInput, TaskPlan, TaskSnapshot, TaskStatus, TaskDelivery } from './types';

export interface TaskScope { owner: string; conversationId: string }
let client: ConvexHttpClient | undefined;
function connection() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('Task storage is not configured');
  return client ??= new ConvexHttpClient(url);
}
function auth(scope: TaskScope) {
  const serverKey = process.env.BRIEF_WRITE_KEY;
  if (!serverKey) throw new Error('Task storage is not configured');
  return { ...scope, serverKey };
}
export const taskStore = {
  receive: (scope: TaskScope, input: TaskInput) => connection().mutation(api.tasks.receive, { ...auth(scope), requestId: input.requestId, input: JSON.stringify(input) }),
  snapshot: async (scope: TaskScope): Promise<TaskSnapshot> => connection().query(api.tasks.snapshot, auth(scope)),
  apply: (scope: TaskScope, turnId: string, version: number, token: string, plan: TaskPlan) => connection().mutation(api.tasks.applyPlan, { ...auth(scope), turnId: turnId as Id<'taskTurns'>, version, token, actions: plan.actions.map(({ taskId, ...action }) => ({ ...action, ...(taskId ? { taskId: taskId as Id<'agentTasks'> } : {}) })), ...(plan.reply ? { reply: plan.reply } : {}) }),
  claimPlanning: (scope: TaskScope, turnId: string, token: string) => connection().mutation(api.tasks.claimPlanning, { ...auth(scope), turnId: turnId as Id<'taskTurns'>, token }),
  releasePlanning: (scope: TaskScope, turnId: string, token: string) => connection().mutation(api.tasks.releasePlanning, { ...auth(scope), turnId: turnId as Id<'taskTurns'>, token }),
  failTurn: (scope: TaskScope, turnId: string, token: string) => connection().mutation(api.tasks.failTurn, { ...auth(scope), turnId: turnId as Id<'taskTurns'>, token }),
  claim: (scope: TaskScope, taskId: string, revision: number, lease: string) => connection().mutation(api.tasks.claim, { ...auth(scope), taskId: taskId as Id<'agentTasks'>, revision, lease }),
  progress: (scope: TaskScope, taskId: string, revision: number, lease: string, events: string, answer: string, status: Extract<TaskStatus, 'running'|'waiting'|'completed'|'failed'>) => connection().mutation(api.tasks.progress, { ...auth(scope), taskId: taskId as Id<'agentTasks'>, revision, lease, events, answer, status }),
  cancelAll: (scope: TaskScope) => connection().mutation(api.tasks.cancelAll, auth(scope)),
  claimDelivery: (scope: TaskScope, taskId: string, revision: number, token: string) => connection().mutation(api.tasks.claimDelivery, { ...auth(scope), taskId: taskId as Id<'agentTasks'>, revision, token }),
  finishDelivery: (scope: TaskScope, taskId: string, revision: number, token: string, delivery: TaskDelivery, release: boolean) => connection().mutation(api.tasks.finishDelivery, { ...auth(scope), taskId: taskId as Id<'agentTasks'>, revision, token, delivery, release }),
};
