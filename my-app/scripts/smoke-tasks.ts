import assert from 'node:assert/strict';
import { randomUUID } from 'crypto';
import { planTasks } from '../src/lib/tasks/planner';
import type { AgentTask, TaskSnapshot } from '../src/lib/tasks/types';

async function main() {
if (!process.argv.includes('--live-ai')) throw new Error('Pass --live-ai to run the real OpenAI planner and localhost integration.');
process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';
const task = (id: string, instruction: string, status: AgentTask['status'] = 'running'): AgentTask => ({ id, revision: 1, instruction, input: { requestId: id, message: instruction, history: [] }, status, events: [], answer: status === 'completed' ? 'The resume card is ready in the chat.' : '', updatedAt: Date.now(), delivery: 'quiet' });
const projects = task('project-task', "Explain Kyle's projects");
const resume = task('resume-task', "Show Kyle's resume");
const scenarios = [
  { message: 'Oh, also show me his resume.', tasks: [projects], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.actions.some(a => a.kind === 'start' && /resume|résumé/i.test(a.instruction!))); assert.ok(!plan.actions.some(a => a.kind === 'cancel' || a.kind === 'update')); } },
  { message: 'Actually, explain SoundSnag instead of SelahNote.', tasks: [task('project-task', 'Explain SelahNote'), resume], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.actions.some(a => a.kind === 'update' && a.taskId === 'project-task' && /SoundSnag/i.test(a.instruction!))); assert.ok(!plan.actions.some(a => a.taskId === 'resume-task' && a.kind !== 'continue')); } },
  { message: 'Stop the project explanation, but keep working on the resume.', tasks: [projects, resume], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.actions.some(a => a.kind === 'cancel' && a.taskId === 'project-task')); assert.ok(!plan.actions.some(a => a.kind === 'cancel' && a.taskId === 'resume-task')); } },
  { message: 'I am going to send you another listing. Check it out.', tasks: [task('old-job', 'Assess the old job at https://example.com/old', 'completed')], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.reply); assert.ok(!plan.actions.some(a => a.kind === 'start' || a.kind === 'update')); } },
  { message: 'It is a frontend role using React.', tasks: [task('fit-task', 'Check whether Kyle fits the role; awaiting role details', 'waiting')], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.actions.some(a => a.kind === 'update' && a.taskId === 'fit-task')); } },
  { message: 'You were interrupted. Finish telling me the resume result.', tasks: [{ ...task('resume-task', 'Show resume', 'completed'), delivery: 'interrupted' as const }], check: (plan: Awaited<ReturnType<typeof planTasks>>) => { assert.ok(plan.reply || plan.actions.some(a => a.kind === 'continue')); assert.ok(!plan.actions.some(a => a.kind === 'start' || a.kind === 'update')); } },
];
for (const scenario of scenarios) {
  const plan = await planTasks({ requestId: randomUUID(), message: scenario.message, history: [] }, scenario.tasks);
  scenario.check(plan);
  console.log('PASS planner:', scenario.message, JSON.stringify(plan.actions));
}

if (process.argv.includes('--planner-only')) return;
const base = process.env.TASK_TEST_ORIGIN ?? 'http://localhost:3000';
const conversationId = randomUUID();
const first = "Show me Kyle's projects and describe SelahNote.";
async function send(message: string, history: { role: 'user'; content: string }[] = [], requestId = randomUUID()) {
  const response = await fetch(`${base}/api/tasks`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId, requestId, message, history, context: { hiring: false }, receivedAt: Date.now() }) });
  assert.equal(response.status, 202, await response.text());
}
async function snapshot(): Promise<TaskSnapshot> {
  const response = await fetch(`${base}/api/tasks?conversationId=${conversationId}`);
  assert.equal(response.status, 200);
  return response.json();
}
async function waitFor(predicate: (state: TaskSnapshot) => boolean, seconds = 90) {
  const deadline = Date.now() + seconds*1000;
  while (Date.now() < deadline) {
    const state = await snapshot();
    if (predicate(state)) return state;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out: ${JSON.stringify(await snapshot())}`);
}
const firstRequest = randomUUID();
await send(first, [], firstRequest);
await send('Also show me his resume.', [{ role: 'user', content: first }]);
// Replayed handoff: must not start a third copy of the original request.
await send(first, [], firstRequest);
const completed = await waitFor(state => !state.turns.length && state.tasks.length >= 2 && state.tasks.every(task => ['completed','waiting'].includes(task.status)));
assert.ok(completed.tasks.some(task => task.events.some(event => event.type === 'widget' && event.widget.kind === 'resume')));
assert.ok(completed.tasks.some(task => /project|SelahNote/i.test(task.instruction) && task.events.some(event => event.type === 'widget')));
assert.ok(completed.tasks.every(task => task.status !== 'canceled'));
assert.equal(completed.tasks.filter(task => task.input.requestId === firstRequest).length, 1);
console.log('PASS localhost: overlapping additions and duplicate handoff; both results retained');

// Cancel a fresh task while its worker is running. A completed resume remains available.
await send('Please investigate his experience with React, Angular, and Vue in detail.');
const running = await waitFor(state => state.tasks.some(task => task.status === 'running'));
const target = running.tasks.find(task => task.status === 'running')!;
await send('Stop the framework experience investigation. Keep the earlier resume result.');
const canceled = await waitFor(state => !state.turns.length && state.tasks.find(task => task.id === target.id)?.status === 'canceled');
assert.ok(canceled.tasks.some(task => task.events.some(event => event.type === 'widget' && event.widget.kind === 'resume') && task.status === 'completed'));
await new Promise(resolve => setTimeout(resolve, 1500));
assert.equal((await snapshot()).tasks.find(task => task.id === target.id)?.status, 'canceled');
console.log('PASS localhost: selective cancellation rejects late worker output and preserves resume');

}
main().catch(error => { console.error(error); process.exitCode = 1; });
