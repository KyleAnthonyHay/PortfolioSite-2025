/** Live, paid comparison. Never writes Convex or sends email. Run from my-app. */
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import cases from './fixtures/fit-cases.json';

process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';
delete process.env.BRIEF_WRITE_KEY;
delete process.env.NEXT_PUBLIC_CONVEX_URL;
process.env.OPENAI_FIT_FALLBACK_MODEL = '';
process.env.OPENAI_VERIFICATION_MODEL = 'gpt-4.1';
delete process.env.OPENAI_FIT_EXTRACTION_MODEL;

// Each retrieval request is performed once, then replayed byte-for-byte for
// the other model. Only model output is live on both passes.
const retrieval = new Map<string, Promise<{ body: string; status: number; type: string }>>();
const realFetch = globalThis.fetch;
const rates: Record<string, { input: number; cached: number; write?: number; output: number }> = {
  'gpt-4.1': { input: 2, cached: 0.5, output: 8 },
  'gpt-5.6-luna': { input: 0.2, cached: 0.02, write: 0.25, output: 1.2 },
};
type Call = { stage: string; model: string; returnedModel?: string; ms: number; input: number; cached: number; cacheWrite: number; output: number; reasoning: number; usd: number | null; status: number };
let calls: Call[] = [];
globalThis.fetch = async (input, init) => {
  const url = String(input instanceof Request ? input.url : input);
  const body = String(init?.body ?? '');
  if (url.includes('pinecone.io')) {
    const key = createHash('sha256').update(url + body).digest('hex');
    if (!retrieval.has(key)) retrieval.set(key, (async () => {
      const response = await realFetch(input, init);
      return { body: await response.text(), status: response.status, type: response.headers.get('content-type') ?? 'application/json' };
    })());
    const stored = await retrieval.get(key)!;
    if (stored.status >= 400) throw new Error(`Retrieval failed: HTTP ${stored.status}`);
    return new Response(stored.body, { status: stored.status, headers: { 'content-type': stored.type } });
  }
  if (!url.includes('api.openai.com')) throw new Error('Benchmark blocked unexpected external request');
  const request = JSON.parse(body);
  const system = request.messages?.[0]?.content ?? '';
  const stage = system.startsWith('You read a job posting') ? 'extraction' : system.startsWith('You audit') ? 'verification' : 'fit';
  const start = performance.now();
  const response = await realFetch(input, init);
  const json = await response.clone().json();
  const u = json.usage;
  const cached = u?.prompt_tokens_details?.cached_tokens ?? 0;
  const cacheWrite = u?.prompt_tokens_details?.cache_creation_tokens ?? 0;
  const r = rates[request.model];
  const usd = u && r ? ((u.prompt_tokens - cached - cacheWrite) * r.input + cached * r.cached + cacheWrite * (r.write ?? r.input) + u.completion_tokens * r.output) / 1e6 : null;
  calls.push({ stage, model: request.model, returnedModel: json.model, ms: Math.round(performance.now() - start), input: u?.prompt_tokens ?? 0, cached, cacheWrite, output: u?.completion_tokens ?? 0, reasoning: u?.completion_tokens_details?.reasoning_tokens ?? 0, usd, status: response.status });
  return response;
};

async function main() {
  if (!process.argv.includes('--live-ai')) {
    const saved = JSON.parse(await fs.readFile('evals/fit-comparison.json', 'utf8'));
    console.log(JSON.stringify({ source: 'saved responses; no network calls', passed: saved.passed, totals: saved.totals }, null, 2));
    return;
  }
  const { evaluateFit } = await import('../src/lib/recruiter-brief/generate');
  const { judgeFailures } = await import('../src/lib/tools');
  const initialFailures = judgeFailures;
  const results: { id: string; model: string; ms: number; checks: { requirement: string; allowed: string[]; actual: string; pass: boolean }[]; rows: { requirement: string; assessment: string; evidence: string; required: boolean }[]; read?: string; ceiling: string; calls: Call[]; usd: number | null }[] = [];
  for (const [index, fixture] of cases.entries()) {
    const models = index % 2 ? ['gpt-5.6-luna', 'gpt-4.1'] : ['gpt-4.1', 'gpt-5.6-luna'];
    for (const model of models) {
      process.env.OPENAI_FIT_MODEL = model;
      calls = [];
      const start = performance.now();
      const evaluation = await evaluateFit(fixture.input);
      const rows = evaluation.roleMatches.map((row) => ({ requirement: row.requirement, assessment: row.verificationStatus === 'unknown' ? 'unknown' : row.assessment, evidence: row.evidence, required: row.required }));
      const checks = fixture.expected
        ? fixture.expected.map((allowed, i) => ({ requirement: fixture.input.knownRequirements![i], allowed, actual: rows[i]?.assessment, pass: allowed.includes(rows[i]?.assessment) }))
        : fixture.expectedExtracted!.map((expected) => {
          const found = rows.filter((row) => new RegExp(expected.pattern, 'i').test(row.requirement));
          return { requirement: expected.pattern, allowed: expected.allowed, actual: found.map((row) => row.assessment).join(','), pass: found.length > 0 && found.every((row) => expected.allowed.includes(row.assessment) && (expected.required === undefined || row.required === expected.required)) };
        });
      const result = { id: fixture.id, model, ms: Math.round(performance.now() - start), checks, rows, read: evaluation.read, ceiling: evaluation.ceiling, calls: [...calls], usd: calls.every((call) => call.usd !== null) ? calls.reduce((sum, call) => sum + call.usd!, 0) : null };
      results.push(result);
      console.log(`${fixture.id} | ${model} | ${checks.filter((c) => c.pass).length}/${checks.length} | ${result.ms} ms | $${result.usd?.toFixed(6)}`);
      await fs.writeFile('evals/fit-comparison.json', JSON.stringify({ date: '2026-10-07', pricingSource: 'https://developers.openai.com/api/docs/pricing', rates, results }, null, 2));
    }
  }
  const finalFailures = (await import('../src/lib/tools')).judgeFailures;
  const totals = Object.fromEntries(['gpt-4.1', 'gpt-5.6-luna'].map((model) => {
    const runs = results.filter((r) => r.model === model);
    const checks = runs.flatMap((r) => r.checks);
    const modelCalls = runs.flatMap((r) => r.calls);
    return [model, { correct: checks.filter((c) => c.pass).length, total: checks.length, meanMs: runs.reduce((s,r) => s+r.ms,0)/runs.length, usd: runs.reduce((s,r)=>s+(r.usd??0),0), tokens: modelCalls.reduce((t,c)=>({input:t.input+c.input,cached:t.cached+c.cached,output:t.output+c.output,reasoning:t.reasoning+c.reasoning}),{input:0,cached:0,output:0,reasoning:0}) }];
  }));
  const baseline = totals['gpt-4.1']; const luna = totals['gpt-5.6-luna'];
  const passed = finalFailures === initialFailures && results.filter((r) => r.id !== 'ambiguous-graduation').every((r) => r.calls.length > 0) && results.every((r) => r.calls.every((c) => c.status === 200 && c.usd !== null)) && luna.correct === luna.total && luna.correct >= baseline.correct && luna.usd < baseline.usd && luna.meanMs <= baseline.meanMs * 1.25;
  const evidenceHash = createHash('sha256').update(JSON.stringify(await Promise.all([...retrieval.entries()].sort().map(async ([key,value]) => [key, await value])))).digest('hex');
  const report = { date: '2026-10-07', pricingSource: 'https://developers.openai.com/api/docs/pricing', rates, gate: 'All Luna expectations pass; no failed API/retrieval calls; accuracy >= baseline; lower measured token cost; mean end-to-end latency <= 1.25x baseline.', passed, retrievalRequests: retrieval.size, evidenceHash, totals, results };
  await fs.writeFile('evals/fit-comparison.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed, totals }, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
