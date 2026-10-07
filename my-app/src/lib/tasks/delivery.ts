import { randomUUID } from 'crypto';
import { taskStore, type TaskScope } from './store';
import { ledger, sessionIdFrom } from '../voice/ledger';
import { sendToSession, spokenText, limitedLiveText } from '../voice/live';

/** The browser requests one delivery at a listening pause; Convex arbitrates across tabs. */
export async function deliverNextTask(scope: TaskScope, sessionId: string) {
  const session = sessionIdFrom(sessionId);
  if (!session) return null;
  const owned = await ledger.owned(scope.owner, session);
  if (!owned || owned.status !== 'live' || !owned.providerSessionId) return null;
  const snapshot = await taskStore.snapshot(scope);
  const task = snapshot.tasks.find(task => task.input.sessionId === session && task.delivery === 'pending' && ['completed','waiting','failed'].includes(task.status));
  if (!task) return null;
  const token = randomUUID();
  const version = await taskStore.claimDelivery(scope, task.id, task.revision, token);
  if (version === null) return null;
  let eligible = false;
  try {
    const answer = spokenText(task.answer) || 'The result is on the card in the chat.';
    const state = task.status === 'failed' ? 'Task failed' : task.status === 'waiting' ? 'Task needs your input' : 'Task completed';
    await sendToSession(owned.providerSessionId, [{
      type: task.input.voice ? 'session.commentary.append' : 'session.thinking.append', delegation_id: task.input.voice ? task.input.delegationId ?? null : null,
      content: limitedLiveText(`${state}: ${task.instruction.slice(0, 100)}. Result: ${answer}`),
    }], 6000, async () => {
      const latest = await taskStore.snapshot(scope);
      const current = latest.tasks.find(current => current.id === task.id);
      const live = await ledger.owned(scope.owner, session);
      eligible = !latest.turns.length && latest.version === version && current?.revision === task.revision && current.delivery === 'pending' && ['completed','waiting','failed'].includes(current.status) && live?.status === 'live';
      return eligible;
    });
    await taskStore.finishDelivery(scope, task.id, task.revision, token, eligible ? 'submitted' : 'pending', !eligible || !task.input.voice);
    return eligible && task.input.voice ? { taskId: task.id, revision: task.revision, token } : null;
  } catch (error) {
    // Provider acknowledgment failure can be ambiguous. Retain the answer and do not replay automatically.
    await taskStore.finishDelivery(scope, task.id, task.revision, token, 'interrupted', true);
    throw error;
  }
}
