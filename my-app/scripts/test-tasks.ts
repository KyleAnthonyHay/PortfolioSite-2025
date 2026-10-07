import test from 'node:test';
import assert from 'node:assert/strict';
import * as mutations from '../convex/tasks';
import { validateTaskPlan, planTasks } from '../src/lib/tasks/planner';
import { addTaskEvent, type TaskSnapshot, type AgentTask } from '../src/lib/tasks/types';

process.env.BRIEF_WRITE_KEY = 'task-test-secret';
process.env.OPENAI_API_KEY = 'test-only';
process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';
const scope = { serverKey: 'task-test-secret', owner: 'visitor-a', conversationId: 'conversation-a' };
type Row = { _id: string; _creationTime: number; [key: string]: unknown };
function fixture() {
  const tables = new Map<string, Map<string, Row>>();
  const scheduled: unknown[] = [];
  let ids = 0;
  function table(name: string) { if (!tables.has(name)) tables.set(name, new Map()); return tables.get(name)!; }
  const ctx = {
    db: {
      get: async (id: string) => [...tables.values()].flatMap(t => [...t.values()]).find(row => row._id === id) ?? null,
      insert: async (name: string, values: Record<string, unknown>) => { const id = `${name}-${++ids}`; table(name).set(id, { ...values, _id: id, _creationTime: ids }); return id; },
      patch: async (id: string, values: Record<string, unknown>) => {
        const row = [...tables.values()].flatMap(t => [...t.values()]).find(row => row._id === id)!;
        for (const [key, value] of Object.entries(values)) { if (value === undefined) delete row[key]; else row[key] = value; }
      },
      query: (name: string) => {
        const predicates: ((row: Row) => boolean)[] = [];
        let desc = false;
        const rows = () => [...table(name).values()].filter(row => predicates.every(p => p(row))).sort((a,b) => (desc ? -1 : 1)*(a._creationTime-b._creationTime));
        const builder = {
          withIndex: (_name: string, callback: (q: { eq: (key: string, value: unknown) => unknown }) => unknown) => {
            type IndexBuilder = { eq: (key: string, value: unknown) => IndexBuilder };
            const q: IndexBuilder = { eq: (key: string, value: unknown): IndexBuilder => { predicates.push(row => row[key] === value); return q; } };
            callback(q); return builder;
          },
          order: (order: string) => { desc = order === 'desc'; return builder; },
          take: async (n: number) => rows().slice(0,n),
          unique: async () => { assert.ok(rows().length <= 1); return rows()[0] ?? null; },
        };
        return builder;
      },
    },
    scheduler: { runAfter: async (...args: unknown[]) => { scheduled.push(args); } },
  };
  const invoke = async <T = unknown>(fn: unknown, args: Record<string, unknown>): Promise<T> => (fn as { _handler: (ctx: unknown, args: unknown) => Promise<T> })._handler(ctx, { ...scope, ...args });
  const snapshot = () => invoke<TaskSnapshot>(mutations.snapshot, {});
  const receive = (requestId: string, message: string, voice = true) => invoke(mutations.receive, { requestId, input: JSON.stringify({ requestId, message, history: [], voice, sessionId: voice ? 'live-session' : undefined, delegationId: voice ? requestId : undefined }) });
  const plan = async (actions: unknown[], reply?: string) => {
    const state = await snapshot();
    const turnId = state.turns[0].id;
    await invoke(mutations.claimPlanning, { turnId, token: 'planner' });
    return invoke(mutations.applyPlan, { turnId, version: state.version, token: 'planner', actions, ...(reply ? { reply } : {}) });
  };
  return { invoke, snapshot, receive, plan, scheduled };
}

test('additive turns keep earlier work and both tasks can finish', async () => {
  const f = fixture();
  await f.receive('first', 'Find Kyle’s React experience');
  await f.plan([{ kind: 'start', instruction: 'Find React evidence' }]);
  const first = (await f.snapshot()).tasks[0];
  assert.equal(await f.invoke(mutations.claim, { taskId: first.id, revision: 1, lease: 'first-worker' }), true);
  await f.receive('second', 'Also show his resume');
  await f.plan([{ kind: 'continue', taskId: first.id }, { kind: 'start', instruction: 'Show resume' }]);
  const second = (await f.snapshot()).tasks[1];
  assert.equal((await f.snapshot()).tasks[0].status, 'running');
  await f.invoke(mutations.claim, { taskId: second.id, revision: 1, lease: 'second-worker' });
  for (const [task, lease] of [[first,'first-worker'], [second,'second-worker']] as const) assert.equal(await f.invoke(mutations.progress, { taskId: task.id, revision: 1, lease, events: '[]', answer: task.instruction, status: 'completed' }), true);
  assert.deepEqual((await f.snapshot()).tasks.map(task => task.status), ['completed','completed']);
});

test('correction changes only its task and rejects late old progress', async () => {
  const f = fixture();
  await f.receive('first', 'Check two jobs');
  await f.plan([{ kind: 'start', instruction: 'Job one' }, { kind: 'start', instruction: 'Job two' }]);
  const [first, second] = (await f.snapshot()).tasks;
  await f.invoke(mutations.claim, { taskId: first.id, revision: 1, lease: 'old' });
  await f.receive('correction', 'Use the new posting for job one');
  await f.plan([{ kind: 'update', taskId: first.id, instruction: 'New job one' }]);
  assert.equal(await f.invoke(mutations.progress, { taskId: first.id, revision: 1, lease: 'old', events: '[]', answer: 'Stale answer', status: 'completed' }), false);
  const tasks = (await f.snapshot()).tasks;
  assert.equal(tasks[0].revision, 2);
  assert.equal(tasks[0].answer, '');
  assert.equal(tasks[1].id, second.id);
  assert.equal(tasks[1].revision, 1);
  assert.equal(tasks[1].status, 'queued');
});

test('cancellation blocks only the targeted task; new speech alone does not change task state', async () => {
  const f = fixture();
  await f.receive('first', 'Find experience and projects');
  await f.plan([{ kind: 'start', instruction: 'Experience' }, { kind: 'start', instruction: 'Projects' }]);
  const first = (await f.snapshot()).tasks[0];
  await f.receive('speech', 'Wait a moment');
  assert.equal((await f.snapshot()).tasks[0].revision, 1);
  assert.equal((await f.snapshot()).tasks[0].status, 'queued');
  await f.plan([{ kind: 'cancel', taskId: first.id }]);
  const tasks = (await f.snapshot()).tasks;
  assert.deepEqual(tasks.map(task => task.status), ['canceled','queued']);
  assert.equal(await f.invoke(mutations.claim, { taskId: first.id, revision: 1, lease: 'late' }), false);
});

test('duplicate handoffs and duplicate workers do not duplicate tasks or execution', async () => {
  const f = fixture();
  assert.equal(await f.receive('same-handoff', 'Show projects'), true);
  assert.equal(await f.receive('same-handoff', 'Show projects'), false);
  await f.plan([{ kind: 'start', instruction: 'Show projects' }]);
  const task = (await f.snapshot()).tasks[0];
  assert.equal(await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'a' }), true);
  assert.equal(await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'b' }), false);
  assert.equal(f.scheduled.length, 1);
});

test('a stale plan cannot commit after newer input arrives', async () => {
  const f = fixture();
  await f.receive('first', 'Show projects');
  const state = await f.snapshot();
  await f.invoke(mutations.claimPlanning, { turnId: state.turns[0].id, token: 'planner' });
  assert.equal(await f.invoke(mutations.claimPlanning, { turnId: state.turns[0].id, token: 'other' }), false);
  await f.receive('second', 'Also show resume');
  assert.equal(await f.invoke(mutations.applyPlan, { turnId: state.turns[0].id, version: state.version, token: 'planner', actions: [{ kind: 'start', instruction: 'Show projects' }] }), false);
  assert.equal((await f.snapshot()).tasks.length, 0);
});

test('delivery is serialized and interruption retains the completed answer', async () => {
  const f = fixture();
  await f.receive('first', 'Two questions');
  await f.plan([{ kind: 'start', instruction: 'One' }, { kind: 'start', instruction: 'Two' }]);
  const [a,b] = (await f.snapshot()).tasks;
  for (const task of [a,b]) {
    await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: task.id });
    await f.invoke(mutations.progress, { taskId: task.id, revision: 1, lease: task.id, events: '[]', answer: `${task.instruction} verified result`, status: 'completed' });
  }
  assert.equal(typeof await f.invoke(mutations.claimDelivery, { taskId: a.id, revision: 1, token: 'delivery-a' }), 'number');
  assert.equal(await f.invoke(mutations.claimDelivery, { taskId: b.id, revision: 1, token: 'delivery-b' }), null);
  await f.invoke(mutations.finishDelivery, { taskId: a.id, revision: 1, token: 'delivery-a', delivery: 'interrupted', release: true });
  const result = (await f.snapshot()).tasks[0];
  assert.equal(result.status, 'completed');
  assert.match(result.answer, /verified result/);
  assert.equal(result.delivery, 'interrupted');
  assert.equal(typeof await f.invoke(mutations.claimDelivery, { taskId: b.id, revision: 1, token: 'delivery-b' }), 'number');
});

test('new unplanned input holds delivery until the model reconciles it', async () => {
  const f = fixture();
  await f.receive('first', 'Show projects');
  await f.plan([], 'The earlier result is ready.');
  const task = (await f.snapshot()).tasks[0];
  await f.receive('second', 'Wait, use another project');
  assert.equal(await f.invoke(mutations.claimDelivery, { taskId: task.id, revision: 1, token: 'd' }), null);
});

test('worker expiry preserves results and does not silently repeat external actions', async () => {
  const f = fixture();
  await f.receive('first', 'Show projects');
  await f.plan([{ kind: 'start', instruction: 'Show projects' }]);
  const task = (await f.snapshot()).tasks[0];
  await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'worker' });
  await f.invoke(mutations.progress, { taskId: task.id, revision: 1, lease: 'worker', status: 'running', events: '[{"type":"text","delta":"Saved result"}]', answer: 'Saved result' });
  await f.invoke(mutations.expire, { taskId: task.id, revision: 1, lease: 'worker' });
  assert.equal((await f.snapshot()).tasks[0].status, 'failed');
  assert.equal((await f.snapshot()).tasks[0].answer, 'Saved result');
  assert.equal(await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'retry' }), false);
});

test('task storage rejects wrong ownership and unknown model targets', async () => {
  const f = fixture();
  await f.receive('first', 'Show projects');
  await f.plan([{ kind: 'start', instruction: 'Show projects' }]);
  const task = (await f.snapshot()).tasks[0];
  assert.equal(await f.invoke(mutations.claim, { owner: 'visitor-b', taskId: task.id, revision: 1, lease: 'other' }), false);
  await assert.rejects(f.invoke(mutations.snapshot, { serverKey: 'wrong' }), /Not allowed/);
  assert.throws(() => validateTaskPlan({ actions: [{ kind: 'cancel', taskId: 'unknown' }] }, [task]), /Unknown/);
});

test('execution concurrency is bounded across invocations', async () => {
  const f = fixture();
  await f.receive('first', 'Several requests');
  await f.plan([1,2,3,4].map(n => ({ kind: 'start', instruction: `Task ${n}` })));
  const tasks = (await f.snapshot()).tasks;
  for (const task of tasks.slice(0,3)) assert.equal(await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: task.id }), true);
  assert.equal(await f.invoke(mutations.claim, { taskId: tasks[3].id, revision: 1, lease: 'four' }), false);
});

test('streamed text is compacted without losing tool events', () => {
  const events = addTaskEvent(addTaskEvent([{ type: 'text', delta: 'Hello' }], { type: 'text', delta: ' world' }), { type: 'answered' });
  assert.deepEqual(events, [{ type: 'text', delta: 'Hello world' }, { type: 'answered' }]);
});

test('planner sends task records to the model rather than decoding intent with lexical rules', async () => {
  const original = globalThis.fetch;
  const task: AgentTask = { id: 'known-task', revision: 1, instruction: 'Find projects', input: { requestId: 'old', message: 'Find projects', history: [] }, status: 'running', events: [], answer: '', updatedAt: 1, delivery: 'quiet' };
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    const context = JSON.parse(body.messages.at(-1).content);
    assert.equal(context.tasks[0].status, 'running');
    assert.equal(context.newMessage, 'And his resume too, please');
    return Response.json({ id: 'test', object: 'chat.completion', created: 0, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify({ actions: [{ kind: 'continue', taskId: 'known-task' }, { kind: 'start', instruction: 'Show resume' }] }) }, finish_reason: 'stop' }] });
  };
  try {
    const plan = await planTasks({ requestId: 'new', message: 'And his resume too, please', history: [] }, [task]);
    assert.deepEqual(plan.actions.map(action => action.kind), ['continue','start']);
  } finally { globalThis.fetch = original; }
});

test('resuming interrupted speech queues the saved answer without rerunning its worker', async () => {
  const f = fixture();
  await f.receive('first', 'Show projects');
  await f.plan([], 'The project result is ready.');
  const task = (await f.snapshot()).tasks[0];
  await f.invoke(mutations.claimDelivery, { taskId: task.id, revision: 1, token: 'speech' });
  await f.invoke(mutations.finishDelivery, { taskId: task.id, revision: 1, token: 'speech', delivery: 'interrupted', release: true });
  await f.receive('resume', 'Finish the answer you were giving');
  await f.plan([{ kind: 'continue', taskId: task.id }]);
  const restored = (await f.snapshot()).tasks[0];
  assert.equal(restored.status, 'completed');
  assert.equal(restored.revision, 1);
  assert.equal(restored.answer, 'The project result is ready.');
  assert.equal(restored.delivery, 'pending');
  assert.equal(await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'duplicate' }), false);
});

test('clarification updates preserve actual original sources and archive earlier output', async () => {
  const f = fixture();
  await f.receive('first', 'Check https://example.com/job');
  await f.plan([{ kind: 'start', instruction: 'Assess the shared job' }]);
  const task = (await f.snapshot()).tasks[0];
  await f.invoke(mutations.claim, { taskId: task.id, revision: 1, lease: 'worker' });
  await f.invoke(mutations.progress, { taskId: task.id, revision: 1, lease: 'worker', status: 'waiting', events: '[]', answer: 'What role is this?' });
  await f.receive('clarification', 'Frontend React role');
  await f.plan([{ kind: 'update', taskId: task.id, instruction: 'Assess the original job as a frontend React role' }]);
  const updated = (await f.snapshot()).tasks[0];
  assert.ok(updated.input.history.some(message => message.content.includes('https://example.com/job')));
  assert.equal(updated.previousResult?.answer, 'What role is this?');
  assert.equal(updated.revision, 2);
});
