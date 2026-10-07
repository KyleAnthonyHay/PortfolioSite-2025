import test from 'node:test';
import assert from 'node:assert/strict';
import { claimVerdict, markNeedsReview } from '../src/lib/recruiter-brief/verification';
import { createStageModel, evaluationIdentity, extractionIdentity, fitFallbackModel, PROMPT_VERSIONS, stageModel, withStageModel } from '../src/lib/fit-models';
import type { RoleMatch } from '../src/lib/recruiter-brief/types';

process.env.LANGCHAIN_TRACING_V2 = 'false';
process.env.LANGSMITH_TRACING = 'false';
process.env.OPENAI_API_KEY = 'test-only';
delete process.env.BRIEF_WRITE_KEY;
delete process.env.NEXT_PUBLIC_CONVEX_URL;
globalThis.fetch = async () => { throw new Error('Live network calls are forbidden in unit tests'); };

test('fit setting and legacy alias do not change writing or verification', () => {
  delete process.env.OPENAI_BRIEF_MODEL;
  delete process.env.OPENAI_VERIFICATION_MODEL;
  delete process.env.OPENAI_FIT_EXTRACTION_MODEL;
  process.env.OPENAI_FIT_MODEL = 'gpt-5.6-luna';
  assert.equal(stageModel('fit'), 'gpt-5.6-luna');
  assert.equal(stageModel('extraction'), 'gpt-5.6-luna');
  assert.equal(stageModel('brief'), 'gpt-5.6-luna');
  assert.equal(stageModel('verification'), 'gpt-5.6-luna');
  for (const stage of ['chat', 'evidence', 'technology'] as const) assert.equal(stageModel(stage), 'gpt-5.6-luna');
  delete process.env.OPENAI_FIT_FALLBACK_MODEL;
  assert.equal(fitFallbackModel(), '');
  delete process.env.OPENAI_FIT_MODEL;
  process.env.OPENAI_FIT_JUDGE_MODEL = 'gpt-4.1';
  assert.equal(stageModel('fit'), 'gpt-4.1');
  delete process.env.OPENAI_FIT_JUDGE_MODEL;
  assert.equal(stageModel('fit'), 'gpt-5.6-luna');
});

test('cache identities change with model, fallback, extraction and verifier; contain prompt versions', () => {
  process.env.OPENAI_FIT_MODEL = 'gpt-4.1';
  const baseline = evaluationIdentity();
  process.env.OPENAI_FIT_MODEL = 'gpt-5.6-luna';
  assert.notEqual(evaluationIdentity(), baseline);
  const luna = evaluationIdentity();
  process.env.OPENAI_VERIFICATION_MODEL = 'custom-verifier';
  assert.notEqual(evaluationIdentity(), luna);
  delete process.env.OPENAI_VERIFICATION_MODEL;
  const extraction = extractionIdentity();
  process.env.OPENAI_FIT_EXTRACTION_MODEL = 'gpt-4.1';
  assert.notEqual(extractionIdentity(), extraction);
  delete process.env.OPENAI_FIT_EXTRACTION_MODEL;
  process.env.OPENAI_FIT_FALLBACK_MODEL = 'gpt-4.1';
  assert.notEqual(evaluationIdentity(), luna);
  assert.equal(JSON.parse(evaluationIdentity())[1], PROMPT_VERSIONS.fit);
  assert.equal(JSON.parse(extractionIdentity())[1], PROMPT_VERSIONS.extraction);
});

test('Luna serializes low reasoning without temperature or seed; GPT-4.1 retains settings', () => {
  const luna = JSON.parse(JSON.stringify(createStageModel('gpt-5.6-luna').invocationParams()));
  assert.equal(luna.reasoning_effort, 'low');
  assert.equal('temperature' in luna, false);
  assert.equal('seed' in luna, false);
  const suggestions = JSON.parse(JSON.stringify(createStageModel('gpt-5.6-luna', 0.5, { maxTokens: 1024 }).invocationParams()));
  assert.equal(suggestions.max_completion_tokens, 1024);
  assert.equal('max_tokens' in suggestions, false);
  const original = createStageModel('gpt-4.1').invocationParams();
  assert.equal(original.temperature, 0);
  assert.equal(original.seed, 7);
  assert.equal(original.reasoning_effort, undefined);
});

test('fallback is fit-only, configurable, and can be disabled', async () => {
  process.env.OPENAI_FIT_MODEL = 'gpt-5.6-luna';
  process.env.OPENAI_FIT_FALLBACK_MODEL = 'gpt-4.1';
  const seen: string[] = [];
  const result = await withStageModel('fit', async (model) => {
    seen.push(model.model);
    if (model.model === 'gpt-5.6-luna') throw new Error('unavailable');
    return model.model;
  });
  assert.equal(result, 'gpt-4.1');
  assert.deepEqual(seen, ['gpt-5.6-luna', 'gpt-4.1']);
  process.env.OPENAI_FIT_FALLBACK_MODEL = '';
  await assert.rejects(withStageModel('fit', async () => { throw new Error('unavailable'); }));
  process.env.OPENAI_FIT_FALLBACK_MODEL = 'gpt-4.1';
  let calls = 0;
  await assert.rejects(withStageModel('verification', async () => { calls++; throw new Error('unavailable'); }));
  assert.equal(calls, 1);
});

test('missing, invalid, duplicated and wrong-index claim verdicts are unknown', () => {
  for (const items of [undefined, [], [{index: 1, verdict: 'supported'}], [{index: 0, verdict: 'yes'}], [{index: 0, verdict:'supported'}, {index:0, verdict:'unsupported'}]]) {
    assert.equal(claimVerdict(items, 0).verdict, 'unknown');
  }
  assert.equal(claimVerdict([{index: 0, verdict:'supported'}], 0).verdict, 'supported');
  assert.equal(claimVerdict([{index: 0, verdict:'unsupported',fixed:'No evidence for that.'}], 0).fixed, undefined);
});

test('incomplete audit cannot retain a positive match or project attribution', () => {
  const row: RoleMatch = { requirement: 'Kubernetes', assessment:'strong', evidence:'Claimed evidence',required:true,projectIds:[1] };
  markNeedsReview(row);
  assert.equal(row.assessment, 'gap');
  assert.equal(row.verificationStatus, 'unknown');
  assert.deepEqual(row.projectIds, []);
  assert.match(row.evidence, /needs review/i);
});

test('degree and missing experience shortcuts do not turn graduation uncertainty into eligibility', async () => {
  const { assessRequirements } = await import('../src/lib/tools');
  const report = await assessRequirements(["Bachelor's degree in Computer Science", 'Graduated within 24 months of October 7, 2026', '5+ years of professional software engineering experience']);
  assert.equal(report.requirements[0].status, 'match');
  assert.equal(report.requirements[1].verificationStatus, 'unknown');
  assert.notEqual(report.requirements[1].status, 'match');
  assert.equal(report.requirements[2].status, 'gap');
});

test('real verification pipeline with omitted verdict removes the claim and counts unknown', async () => {
  globalThis.fetch = async () => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:'{"items":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  const { verifyClaims } = await import('../src/lib/recruiter-brief/generate');
  let applied = '';
  const result = await verifyClaims([{text:'Unsupported claim',evidenceIds:[],apply:(verdict)=>{applied=verdict;}}], []);
  assert.equal(applied, 'unknown');
  assert.deepEqual(result, {rewritten:0,removed:1,unknown:1});
});

test('real audit pipeline marks an omitted row unknown instead of preserving strong', async () => {
  globalThis.fetch = async () => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:'{"rows":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  const { auditRoleMatches } = await import('../src/lib/recruiter-brief/generate');
  const row: RoleMatch = {requirement:'Production Kubernetes',assessment:'strong',evidence:'Unsupported claim',required:true,projectIds:[1]};
  await auditRoleMatches([row], []);
  assert.equal(row.verificationStatus, 'unknown');
  assert.equal(row.assessment, 'gap');
});

test('unknown rows never upgrade a confirmed missing core requirement', async () => {
  const { ceilingFor } = await import('../src/lib/recruiter-brief/generate');
  const rows: RoleMatch[] = [
    {requirement:'Senior SRE experience',assessment:'gap',evidence:'Not shown',required:true,core:true,projectIds:[]},
    {requirement:'Graduation eligibility',assessment:'gap',verificationStatus:'unknown',evidence:'Needs review',required:true,projectIds:[]},
  ];
  const fit = {requirements:[],summary:{match:0,related:0,gap:2},read:'needs review: verification incomplete' as const};
  assert.equal(ceilingFor(fit, rows, 0), 'decline');
  assert.equal(ceilingFor(fit, rows.slice(1)), 'conditional');
});
