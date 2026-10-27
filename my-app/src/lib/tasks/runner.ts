import { randomUUID } from 'crypto';
import { runAgent } from '../chat-agent';
import { addTaskEvent, type AgentTask } from './types';
import { planTasks } from './planner';
import { taskStore, type TaskScope } from './store';
import type { ChatEvent } from '../chat-events';
import { recordMetric, withMeter, type MetricRow } from '../metrics';

/** Server work is independent of an individual browser request's AbortSignal. */
export async function executeTask(scope: TaskScope, task: AgentTask, deadline = Date.now() + 240_000): Promise<void> {
  const { meter, result } = withMeter(() => runTask(scope, task, deadline));
  const metric = await result;
  if (metric) await recordMetric(metric, meter);
}

async function runTask(scope: TaskScope, task: AgentTask, deadline: number): Promise<MetricRow | undefined> {
  const lease = randomUUID();
  if (!await taskStore.claim(scope, task.id, task.revision, lease)) return;
  const started = Date.now();
  let firstText: number | undefined;
  const toolStarts = new Map<string, number>();
  const tools: MetricRow['tools'] = [];
  let status = 'failed';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new Error('Task duration exceeded')), Math.max(1, Math.min(240_000, deadline - Date.now())));
  let events: ChatEvent[] = [];
  let answer = '';
  let failed = false;
  let lastFlush = 0;
  let checking = false;
  const monitor = setInterval(() => {
    if (checking || controller.signal.aborted) return;
    checking = true;
    void taskStore.snapshot(scope).then(snapshot => {
      const current = snapshot.tasks.find(current => current.id === task.id);
      if (!current || current.revision !== task.revision || current.status !== 'running') controller.abort();
    }).catch(() => controller.abort(new Error('Task ownership could not be checked'))).finally(() => { checking = false; });
  }, 1000);
  const flush = async (status: 'running'|'waiting'|'completed'|'failed') => {
    const accepted = await taskStore.progress(scope, task.id, task.revision, lease, JSON.stringify(events), answer, status);
    lastFlush = Date.now();
    if (!accepted) controller.abort();
    return accepted;
  };
  try {
    for await (const event of runAgent(task.input.message, task.input.history, {
      signal: controller.signal, context: task.input.context, receivedAt: task.input.receivedAt,
      conversationId: scope.conversationId, voice: task.input.voice, taskGoal: task.instruction, priorTaskResult: task.previousResult ?? undefined,
    })) {
      if (controller.signal.aborted) break;
      events = addTaskEvent(events, event);
      if (event.type === 'text') { answer += event.delta; firstText ??= Date.now(); }
      if (event.type === 'step' && event.step.status === 'running') toolStarts.set(event.step.id, Date.now());
      if (event.type === 'step' && event.step.status === 'done' && toolStarts.has(event.step.id)) tools.push({ name: event.step.tool, ms: Date.now() - toolStarts.get(event.step.id)! });
      if (event.type === 'error') { failed = true; answer ||= event.message; }
      if (JSON.stringify(events).length > 340_000) throw new Error('Task output limit exceeded');
      if (event.type !== 'text' || Date.now() - lastFlush >= 250) await flush('running');
    }
    if (controller.signal.aborted) throw controller.signal.reason ?? new Error('Task stopped');
    const waiting = events.some(event => event.type === 'widget' && event.widget.kind === 'question');
    if (!answer && waiting) {
      const question = events.find(event => event.type === 'widget' && event.widget.kind === 'question');
      if (question?.type === 'widget' && question.widget.kind === 'question') answer = question.widget.question;
    }
    const final = failed ? 'failed' : waiting ? 'waiting' : 'completed';
    status = final;
    await flush(final);
  } catch (error) {
    // A replaced/canceled task rejects this write; its successor's output is untouched.
    const message = controller.signal.aborted ? 'This task stopped before finishing. Its saved results are retained.' : 'I could not finish this task. You can ask me to retry it.';
    console.error('task execution stopped:', error instanceof Error ? error.message : 'unknown error');
    events = addTaskEvent(events, { type: 'error', message });
    answer ||= message;
    if (controller.signal.aborted) status = 'stopped';
    await flush('failed').catch(() => {});
  } finally {
    clearInterval(monitor);
    clearTimeout(timeout);
  }
  const accepted = task.input.acceptedAt;
  return {
    kind: 'answer', channel: task.input.voice ? 'voice' : 'typed', status, totalMs: Date.now() - started, tools,
    fitCheck: tools.some(tool => tool.name === 'assess_job_fit'),
    ...(firstText ? { firstTextMs: firstText - started } : {}),
    // A resumed answer keeps its original message time, so only a recent one counts as a wait.
    ...(firstText && accepted && firstText - accepted < 600_000 ? { waitMs: firstText - accepted } : {}),
  };
}

/** CAS planning prevents overlapping turns from applying plans against stale task state. */
export async function coordinateTasks(scope: TaskScope, deadline = Date.now() + 180_000): Promise<void> {
  for (let attempt = 0; attempt < 12 && Date.now() < deadline; attempt++) {
    const snapshot = await taskStore.snapshot(scope);
    const turn = snapshot.turns[0];
    if (!turn) return;
    const token = randomUUID();
    if (!await taskStore.claimPlanning(scope, turn.id, token)) return;
    const started = Date.now();
    const { meter, result } = withMeter(() => planTasks(turn.input, snapshot.tasks));
    try {
      const plan = await result;
      const totalMs = Date.now() - started;
      await taskStore.apply(scope, turn.id, snapshot.version, token, plan);
      await recordMetric({ kind: 'plan', channel: turn.input.voice ? 'voice' : 'typed', status: plan.actions.length ? 'planned' : 'replied', totalMs, tools: [], fitCheck: false }, meter);
    } catch (error) {
      console.error('task coordination failed:', error instanceof Error ? error.message : 'unknown error');
      const totalMs = Date.now() - started;
      await taskStore.failTurn(scope, turn.id, token);
      await recordMetric({ kind: 'plan', channel: turn.input.voice ? 'voice' : 'typed', status: 'failed', totalMs, tools: [], fitCheck: false }, meter);
    } finally {
      await taskStore.releasePlanning(scope, turn.id, token);
    }
  }
}

export async function runQueuedTasks(scope: TaskScope, deadline = Date.now() + 260_000): Promise<void> {
  // Claims in Convex cap concurrent execution across browser tabs/server invocations.
  for (let round = 0; round < 4 && Date.now() < deadline - 1000; round++) {
    const snapshot = await taskStore.snapshot(scope);
    const queued = snapshot.tasks.filter(task => task.status === 'queued').slice(0, 3);
    if (!queued.length) return;
    await Promise.all(queued.map(task => executeTask(scope, task, deadline)));
    const remaining = await taskStore.snapshot(scope);
    if (remaining.tasks.filter(task => task.status === 'running').length >= 3) return;
  }
}
export async function processTasks(scope: TaskScope): Promise<void> {
  const deadline = Date.now() + 270_000;
  await coordinateTasks(scope, deadline - 60_000);
  await runQueuedTasks(scope, deadline);
}
