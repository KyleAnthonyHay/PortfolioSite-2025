/** Explicit paid live-AI smoke test. Convex is mocked; email is disabled. */
import assert from 'node:assert/strict';
import type { ChatEvent, ConversationMessage } from '../src/lib/chat-events';

async function main() {
  assert.ok(process.argv.includes('--live-ai'), 'Pass --live-ai to run paid model calls');
  process.env.LANGCHAIN_TRACING_V2 = 'false';
  process.env.LANGSMITH_TRACING = 'false';
  for (const key of ['OPENAI_CHAT_MODEL', 'OPENAI_JUDGE_MODEL', 'OPENAI_TECH_JUDGE_MODEL', 'OPENAI_FIT_MODEL', 'OPENAI_FIT_JUDGE_MODEL', 'OPENAI_FIT_EXTRACTION_MODEL', 'OPENAI_BRIEF_MODEL', 'OPENAI_VERIFICATION_MODEL', 'RESEND_API_KEY']) delete process.env[key];
  process.env.OPENAI_FIT_FALLBACK_MODEL = '';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://release-smoke.convex.cloud';
  process.env.BRIEF_WRITE_KEY = 'release-smoke-only';
  const realFetch = globalThis.fetch;
  const calls: { model: string; reasoning: string; tools: boolean; status: number }[] = [];
  let savedBriefs = 0;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    const body = JSON.parse(String(init?.body ?? '{}'));
    if (url.hostname === 'release-smoke.convex.cloud') {
      if (body.path === 'recruiterBriefs:save') savedBriefs++;
      return Response.json({ status: 'success', value: null });
    }
    assert.ok(url.hostname === 'api.openai.com' || url.hostname.endsWith('.pinecone.io'), `Unexpected external service: ${url.hostname}`);
    const response = await realFetch(input, init);
    if (url.hostname === 'api.openai.com') {
      calls.push({ model: body.model, reasoning: body.reasoning_effort, tools: Boolean(body.tools?.length), status: response.status });
      assert.equal(body.model, 'gpt-5.6-luna');
      assert.equal(response.status, 200, response.ok ? undefined : await response.clone().text());
    }
    return response;
  };
  const { runAgent } = await import('../src/lib/chat-agent');
  async function turn(label: string, message: string, history: ConversationMessage[] = [], expectedWidget?: string) {
    const started = performance.now();
    const events: ChatEvent[] = [];
    for await (const event of runAgent(message, history, { context: { hiring: false }, conversationId: 'release-smoke', signal: AbortSignal.timeout(60_000) })) events.push(event);
    assert.equal(events.at(-1)?.type, 'done');
    assert.equal(events.some((event) => event.type === 'error'), false);
    const answer = events.filter((event) => event.type === 'text').map((event) => event.delta).join('');
    const widgets = events.filter((event) => event.type === 'widget').map((event) => event.widget);
    assert.ok(answer.trim() || widgets.some((widget) => widget.kind === 'question'));
    if (expectedWidget) assert.ok(widgets.some((widget) => widget.kind === expectedWidget), `${label}: missing ${expectedWidget}; ${answer}`);
    for (const event of events) if (event.type === 'step') assert.ok(!event.step.detail?.some((detail) => /tool failed/i.test(detail)), JSON.stringify(event));
    const summary = { label, ms: Math.round(performance.now() - started), tools: events.flatMap((event) => event.type === 'step' && event.step.status === 'done' ? [event.step.tool] : []), widgets: widgets.map((widget) => widget.kind), answer, suggestions: events.some((event) => event.type === 'suggestions') };
    console.log(JSON.stringify(summary));
    return [...history, { role: 'user' as const, content: message }, { role: 'assistant' as const, content: answer }];
  }
  await turn('greeting', 'Hello');
  const history = await turn('project list', 'What projects has Kyle built?');
  await turn('project follow-up', 'Tell me more about SelahNote.', history, 'project');
  await turn('named technology evidence', 'Has Kyle used Swift?');
  await turn('general evidence', 'What backend engineering experience does Kyle have?');
  await turn('forced clarification', 'Is he a fit for my team?', [], 'question');
  const posting = 'Check Kyle’s fit for this job posting:\nJunior iOS Engineer at Release Test Company. About the role: Build and maintain customer-facing iOS apps. Responsibilities: implement screens using SwiftUI, integrate backend APIs, debug problems, collaborate with designers, and ship app updates. Required qualifications: experience building iOS apps with Swift and SwiftUI; a bachelor’s degree in Computer Science or a related field. Nice to have: production Kubernetes experience. This is a fictional posting used only to test the portfolio agent. Evaluate the stated requirements only, and do not infer extra qualifications or professional tenure requirements.';
  const fitHistory = await turn('posting extraction and fit', posting, [], 'fit_report');
  await turn('brief writing and verification', 'Create a recruiter brief for this role.', fitHistory, 'recruiter_brief');
  assert.ok(savedBriefs > 0, 'Brief must reach the mocked persistence boundary');
  assert.ok(calls.some((call) => call.tools && call.reasoning === 'none'));
  assert.ok(calls.some((call) => !call.tools && call.reasoning === 'low'));
  console.log(JSON.stringify({ passed: true, modelCalls: calls.length, models: [...new Set(calls.map((call) => call.model))], savedBriefs, realEmailSends: 0, realConvexWrites: 0 }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
