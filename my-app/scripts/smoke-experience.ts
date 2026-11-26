/**
 * Explicit paid live-AI check that the agent states Kyle's experience
 * accurately around the two newest projects: Sovereign Realms (a personal,
 * unreleased Unreal Engine game; no Unity) and Playback Support Agent (a
 * deployed Regal take-home demo, not employment). Convex is mocked; email is
 * disabled. Every case runs and is reported; the exit code is non-zero if any
 * check fails.
 *
 *   npm run smoke:experience -- --live-ai
 */
import assert from 'node:assert/strict';
import type { ChatEvent, FitRequirement } from '../src/lib/chat-events';

type Check = { name: string; ok: boolean };

async function main() {
  assert.ok(process.argv.includes('--live-ai'), 'Pass --live-ai to run paid model calls');
  process.env.LANGCHAIN_TRACING_V2 = 'false';
  process.env.LANGSMITH_TRACING = 'false';
  for (const key of ['OPENAI_CHAT_MODEL', 'OPENAI_JUDGE_MODEL', 'OPENAI_TECH_JUDGE_MODEL', 'OPENAI_FIT_MODEL', 'OPENAI_FIT_JUDGE_MODEL', 'OPENAI_FIT_EXTRACTION_MODEL', 'OPENAI_BRIEF_MODEL', 'OPENAI_VERIFICATION_MODEL', 'RESEND_API_KEY']) delete process.env[key];
  process.env.OPENAI_FIT_FALLBACK_MODEL = '';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://experience-smoke.convex.cloud';
  process.env.BRIEF_WRITE_KEY = 'experience-smoke-only';
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === 'experience-smoke.convex.cloud') return Response.json({ status: 'success', value: null });
    assert.ok(url.hostname === 'api.openai.com' || url.hostname.endsWith('.pinecone.io'), `Unexpected external service: ${url.hostname}`);
    return realFetch(input, init);
  };
  const { runAgent } = await import('../src/lib/chat-agent');

  const results: { label: string; answer: string; fit?: { requirement: string; status: string; evidence: string; projects: string[] }[]; checks: Check[] }[] = [];

  async function ask(label: string, message: string, checks: (answer: string, fit: FitRequirement[] | undefined) => Check[]) {
    const events: ChatEvent[] = [];
    for await (const event of runAgent(message, [], { context: { hiring: true }, conversationId: `experience-${label}`, signal: AbortSignal.timeout(120_000) })) events.push(event);
    const answer = events.filter((e) => e.type === 'text').map((e) => (e as { delta: string }).delta).join('');
    const report = events.find((e) => e.type === 'widget' && e.widget.kind === 'fit_report');
    const fit = report?.type === 'widget' && report.widget.kind === 'fit_report' ? report.widget.requirements : undefined;
    const errored = events.some((e) => e.type === 'error');
    const result = {
      label,
      answer,
      fit: fit?.map((row) => ({ requirement: row.requirement, status: row.status, evidence: row.evidence, projects: row.projects.map((p) => p.title) })),
      checks: [{ name: 'no error event', ok: !errored }, ...checks(answer, fit)],
    };
    results.push(result);
    console.log(JSON.stringify(result, null, 2));
  }

  const claimsUnity = (text: string) => /\b(built|developed|made|uses|used|using|in|with)\b[^.]{0,40}\bUnity\b/i.test(text) && !/\b(not|no|isn'?t|wasn'?t|rather than|instead of|n't)\b[^.]{0,60}\bUnity\b|\bUnity\b[^.]{0,60}\b(not|no)\b/i.test(text);
  const row = (fit: FitRequirement[] | undefined, re: RegExp) => fit?.find((r) => re.test(r.requirement));
  /** True if any sentence says the game is released or shipped without negating it. */
  const affirmsRelease = (text: string) => text.split(/(?<=[.!?])\s+/).some((sentence) => /\b(released|shipped|launched|on Steam)\b/i.test(sentence) && !/\b(not|no|never|yet|isn['’]?t|hasn['’]?t|wasn['’]?t)\b|unreleased/i.test(sentence));

  await ask('unity-direct', 'Does Kyle have Unity experience?', (a) => [
    { name: 'does not claim Unity use', ok: !claimsUnity(a) },
  ]);

  await ask('game-dev-professional', 'Does Kyle have professional game development experience?', (a) => [
    { name: 'says it is not professional / personal project', ok: /personal|not (a )?professional|no professional|side project|hasn'?t|has not/i.test(a) },
    { name: 'does not call the game released or shipped', ok: !affirmsRelease(a) },
  ]);

  await ask('unreal-cpp', 'Has Kyle used Unreal Engine or C++?', (a) => [
    { name: 'confirms Unreal Engine via Sovereign Realms', ok: /Unreal/i.test(a) && /Sovereign Realms/i.test(a) },
    { name: 'frames it as personal / in development', ok: /personal|in development|unreleased|not (yet )?released|side project/i.test(a) },
  ]);

  await ask('regal', 'Has Kyle worked at Regal?', (a) => [
    { name: 'denies employment at Regal', ok: /\b(no|not|hasn'?t|has not|didn'?t|did not)\b/i.test(a) },
    { name: 'identifies the take-home', ok: /take-?home/i.test(a) },
  ]);

  await ask('voice-ai', 'What voice AI experience does Kyle have?', (a) => [
    { name: 'names Playback Support Agent', ok: /Playback/i.test(a) },
    { name: 'does not claim real customers or results', ok: !/\b(customers? (use|rely)|reduced|increased|resolution rate|in production for)\b/i.test(a) || /simulated|demo|no (real|stated)/i.test(a) },
  ]);

  await ask('tenure', 'How many years of professional experience does Kyle have?', (a) => [
    { name: 'does not claim 5+ years', ok: !/(?<![\d.–-])\b([5-9]|1\d)\+?\s*(or more )?years\b(?![^.]{0,20}\b(fewer|less)\b)/i.test(a) || /fewer than 5|less than 5/i.test(a) },
    { name: 'does not count the game or the take-home as employment', ok: !/(Sovereign Realms|Regal)[^.]{0,60}\b(job|employ|role at|worked at)\b/i.test(a) },
  ]);

  await ask(
    'fit-unity-role',
    'Check Kyle’s fit for this job posting:\nGameplay Programmer at Experience Test Studio. Responsibilities: build gameplay systems and tools for our shipped PC title. Required qualifications: 2+ years of professional experience developing games in Unity with C#; at least one shipped commercial game. Nice to have: experience with RTS or strategy game AI. This fictional posting only tests the portfolio agent; evaluate the stated requirements only.',
    (a, fit) => {
      const unity = row(fit, /Unity/i);
      const shipped = row(fit, /shipped|commercial/i);
      const rts = row(fit, /RTS|strategy/i);
      return [
        { name: 'returns a fit report', ok: Boolean(fit?.length) },
        { name: 'Unity/C# professional requirement is not a match', ok: Boolean(unity) && unity!.status !== 'match' },
        { name: 'shipped commercial game is not a match', ok: Boolean(shipped) && shipped!.status !== 'match' },
        { name: 'shipped-game evidence does not call the game shipped or commercial', ok: Boolean(shipped) && !/commercial-style/i.test(shipped!.evidence) && affirmsRelease(shipped!.evidence) === false },
        { name: 'RTS / strategy AI credits Sovereign Realms', ok: Boolean(rts) && rts!.status !== 'gap' && rts!.projects.some((p) => /Sovereign/i.test(p.title)) },
        { name: 'answer does not claim Unity use', ok: !claimsUnity(a) },
      ];
    },
  );

  await ask(
    'fit-voice-role',
    'Check Kyle’s fit for this job posting:\nVoice AI Engineer at Experience Test Company. Responsibilities: design and evaluate voice agents for customer support. Required qualifications: hands-on experience building a voice agent with tool calling and retrieval; experience operating a voice agent in production with real customer traffic. This fictional posting only tests the portfolio agent; evaluate the stated requirements only.',
    (_a, fit) => {
      const build = row(fit, /building|tool calling|retrieval/i);
      const prod = row(fit, /production|real customer/i);
      return [
        { name: 'returns a fit report', ok: Boolean(fit?.length) },
        { name: 'building a voice agent is supported by a voice project', ok: Boolean(build) && build!.status !== 'gap' && build!.projects.some((p) => /Playback|SelahNote/i.test(p.title)) },
        { name: 'production with real customer traffic is not a match', ok: Boolean(prod) && prod!.status !== 'match' },
      ];
    },
  );

  const failed = results.flatMap((r) => r.checks.filter((c) => !c.ok).map((c) => `${r.label}: ${c.name}`));
  console.log(JSON.stringify({ cases: results.length, checks: results.reduce((n, r) => n + r.checks.length, 0), failed }, null, 2));
  if (failed.length) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
