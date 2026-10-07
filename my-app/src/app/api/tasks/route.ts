import { after, NextRequest } from 'next/server';
import { MAX_MESSAGE_LENGTH, sanitizeContext, sanitizeConversationId, sanitizeHistory, sanitizeReceivedAt } from '@/lib/chat-request';
import { visitorKey } from '@/lib/voice/visitor';
import { correctProjectNames } from '@/lib/voice/names';
import { ledger, sessionIdFrom } from '@/lib/voice/ledger';
import { taskStore, type TaskScope } from '@/lib/tasks/store';
import { processTasks, runQueuedTasks } from '@/lib/tasks/runner';
import { deliverNextTask } from '@/lib/tasks/delivery';
import type { TaskInput } from '@/lib/tasks/types';

export const runtime = 'nodejs';
export const maxDuration = 300;
function scopeFor(request: NextRequest, id: unknown): TaskScope | null {
  const conversationId = sanitizeConversationId(id);
  return conversationId ? { owner: visitorKey(request), conversationId } : null;
}
function background(scope: TaskScope, coordinate: boolean) {
  after(async () => {
    try { await (coordinate ? processTasks(scope) : runQueuedTasks(scope)); }
    catch (error) { console.error('background task failed:', error instanceof Error ? error.message : 'unknown error'); }
  });
}
export async function GET(request: NextRequest) {
  try {
    const scope = scopeFor(request, request.nextUrl.searchParams.get('conversationId'));
    if (!scope) return Response.json({ error: 'Invalid conversation' }, { status: 400 });
    const snapshot = await taskStore.snapshot(scope);
    if (snapshot.turns.length || snapshot.tasks.some(task => task.status === 'queued')) background(scope, snapshot.turns.length > 0);
    return Response.json(snapshot, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Task state is unavailable' }, { status: 503 });
  }
}
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON body' }, { status: 400 }); }
  try {
    const scope = scopeFor(request, body.conversationId);
    if (!scope) return Response.json({ error: 'Invalid conversation' }, { status: 400 });
    if (body.action === 'stop') {
      await taskStore.cancelAll(scope);
      return Response.json({ ok: true });
    }
    if (body.action === 'deliver') {
      const sessionId = sessionIdFrom(body.sessionId);
      if (!sessionId) return Response.json({ error: 'Invalid call' }, { status: 400 });
      return Response.json({ delivery: await deliverNextTask(scope, sessionId) });
    }
    if (body.action === 'settleDelivery') {
      const taskId = typeof body.taskId === 'string' && /^[a-z0-9]{20,40}$/.test(body.taskId) ? body.taskId : '';
      if (!taskId || !Number.isSafeInteger(body.revision) || typeof body.token !== 'string' || body.token.length > 100) return Response.json({ error: 'Invalid delivery' }, { status: 400 });
      await taskStore.finishDelivery(scope, taskId, body.revision as number, body.token, body.interrupted ? 'interrupted' : 'submitted', true);
      return Response.json({ ok: true });
    }
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const requestId = typeof body.requestId === 'string' && /^[\w-]{4,100}$/.test(body.requestId) ? body.requestId : '';
    if (!message || message.length > MAX_MESSAGE_LENGTH || !requestId) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const sessionId = sessionIdFrom(body.sessionId);
    const delegationId = typeof body.delegationId === 'string' && /^[\w-]{4,100}$/.test(body.delegationId) ? body.delegationId : undefined;
    if (body.voice && (!sessionId || !delegationId)) return Response.json({ error: 'Invalid handoff' }, { status: 400 });
    if (sessionId) {
      const state = await ledger.owned(scope.owner, sessionId);
      if (!state || state.status !== 'live') return Response.json({ error: 'Call is not live' }, { status: 409 });
    }
    const input: TaskInput = {
      requestId, message: body.voice ? correctProjectNames(message) : message, history: sanitizeHistory(body.history), context: sanitizeContext(body.context),
      receivedAt: sanitizeReceivedAt(body.receivedAt), voice: !!body.voice,
      ...(sessionId ? { sessionId } : {}), ...(delegationId ? { delegationId } : {}),
    };
    await taskStore.receive(scope, input);
    background(scope, true);
    return Response.json({ accepted: true, requestId }, { status: 202 });
  } catch (error) {
    console.error('task request failed:', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'Could not accept this task request' }, { status: 503 });
  }
}
