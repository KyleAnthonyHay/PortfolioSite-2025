import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import type { ChatEvent } from '../src/lib/chat-events';

process.env.OPENAI_API_KEY = 'test-only';
process.env.OPENAI_CHAT_MODEL = 'gpt-5.6-luna';
process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';
delete process.env.RESEND_API_KEY;

function stream(delta: object, finish: string): Response {
  const chunk = (d: object, reason: string | null) => ({ id: 'chat-test', object: 'chat.completion.chunk', created: 0, model: 'gpt-5.6-luna', choices: [{ index: 0, delta: d, finish_reason: reason }] });
  return new Response(`data: ${JSON.stringify(chunk(delta, null))}\n\ndata: ${JSON.stringify(chunk({}, finish))}\n\ndata: [DONE]\n\n`, { headers: { 'content-type': 'text/event-stream' } });
}

test('chat route streams a Luna tool call, tool result, answer, and follow-ups using compatible API parameters', async () => {
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    assert.equal(new URL(input instanceof Request ? input.url : String(input)).hostname, 'api.openai.com');
    const body = JSON.parse(String(init?.body));
    calls++;
    assert.equal(body.model, 'gpt-5.6-luna');
    assert.equal('temperature' in body, false);
    assert.equal('seed' in body, false);
    if (body.tools?.length) {
      // Mirror the API rejection that caused the production outage.
      if (body.reasoning_effort !== 'none') return Response.json({ error: { message: 'Function tools with reasoning_effort are not supported', type: 'invalid_request_error' } }, { status: 400 });
      assert.equal(body.stream, true);
      if (calls === 1) {
        assert.equal(body.tool_choice, 'required');
        return stream({ role: 'assistant', content: '', tool_calls: [{ index: 0, id: 'call_projects', type: 'function', function: { name: 'list_projects', arguments: '{}' } }] }, 'tool_calls');
      }
      const result = body.messages.find((message: { role: string }) => message.role === 'tool');
      assert.equal(result?.tool_call_id, 'call_projects');
      assert.match(result.content, /SelahNote/);
      return stream({ role: 'assistant', content: 'Kyle built SelahNote and other software products.' }, 'stop');
    }
    assert.equal(body.reasoning_effort, 'low');
    assert.equal(body.response_format.type, 'json_object');
    assert.equal(body.max_completion_tokens, 1024);
    assert.equal('max_tokens' in body, false);
    return Response.json({ id: 'follow-ups', object: 'chat.completion', created: 0, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify({ suggestions: ['What does SelahNote do?'] }) }, finish_reason: 'stop' }] });
  };
  const { POST } = await import('../src/app/api/chat/route');
  const response = await POST(new NextRequest('http://localhost/api/chat', { method: 'POST', body: JSON.stringify({ message: 'What projects has Kyle built?', history: [], context: { hiring: false } }) }));
  assert.equal(response.status, 200);
  const events: ChatEvent[] = (await response.text()).trim().split('\n').map((line) => JSON.parse(line));
  assert.equal(events.some((event) => event.type === 'error'), false, JSON.stringify(events));
  assert.ok(events.some((event) => event.type === 'step' && event.step.tool === 'list_projects' && event.step.status === 'done'));
  assert.ok(events.some((event) => event.type === 'text' && event.delta.includes('SelahNote')));
  assert.ok(events.some((event) => event.type === 'suggestions' && event.items.length > 0));
  assert.equal(events.at(-1)?.type, 'done');
  assert.equal(calls, 3);
});
