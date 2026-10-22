import test from 'node:test';
import assert from 'node:assert/strict';
import { claimVerdict, markNeedsReview } from '../src/lib/recruiter-brief/verification';
import { createStageModel, evaluationIdentity, extractionIdentity, fitFallbackModel, PROMPT_VERSIONS, stageModel, withStageModel } from '../src/lib/fit-models';
import { assessmentDay, CAREER_PERIODS, professionalTenureVerdict, tenureBounds } from '../src/lib/professional-tenure';
import { currentBackgroundHits, type KnowledgeHit } from '../src/lib/knowledge';
import { CAREER_FACTS, WORK_EVIDENCE } from '../src/lib/facts';
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
  assert.equal(row.assessment, 'relevant');
  assert.equal(row.verificationStatus, 'unknown');
  assert.deepEqual(row.projectIds, []);
  assert.match(row.evidence, /needs confirmation/i);
});

test('degree and missing experience shortcuts do not turn graduation uncertainty into eligibility', async () => {
  const { assessRequirements } = await import('../src/lib/tools');
  const report = await assessRequirements(["Bachelor's degree in Computer Science", 'Graduated within 24 months of October 7, 2026', '5+ years of professional software engineering experience'], '2026-10-09');
  assert.equal(report.requirements[0].status, 'match');
  assert.equal(report.requirements[1].verificationStatus, 'unknown');
  assert.notEqual(report.requirements[1].status, 'match');
  assert.equal(report.requirements[2].status, 'gap');
  assert.match(report.requirements[2].evidence, /complete employed history does not meet/i);
  assert.equal(report.requirements[2].verificationStatus, undefined);
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
  assert.equal(row.assessment, 'relevant');
});

const completion = (content: string) => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
const socketClosed = (bytesWritten: number) => Object.assign(new TypeError('fetch failed'), { cause: { code: 'UND_ERR_SOCKET', socket: { bytesWritten } } });

test('a model request whose connection dropped is sent once more; other failures are not retried', async () => {
  const { verifyClaims } = await import('../src/lib/recruiter-brief/generate');
  let calls = 0;
  globalThis.fetch = async () => { calls++; if (calls === 1) throw socketClosed(44634); return completion('{"items":[{"index":0,"verdict":"supported"}]}'); };
  let applied = '';
  await verifyClaims([{text:'Claim A',evidenceIds:[],apply:(verdict)=>{applied=verdict;}}], []);
  assert.equal(calls, 2);
  assert.equal(applied, 'supported');
  calls = 0;
  globalThis.fetch = async () => { calls++; throw socketClosed(0); };
  await assert.rejects(verifyClaims([{text:'Claim A',evidenceIds:[],apply:()=>{}}], []));
  assert.equal(calls, 2);
  calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('unavailable'); };
  await assert.rejects(verifyClaims([{text:'Claim A',evidenceIds:[],apply:()=>{}}], []));
  assert.equal(calls, 1);
});

test('a failed claim check withholds only its own claim', async () => {
  globalThis.fetch = async (_input, init) => String(init?.body).includes('Claim B') ? Promise.reject(new Error('unavailable')) : completion('{"items":[{"index":0,"verdict":"supported"}]}');
  const { verifyClaims } = await import('../src/lib/recruiter-brief/generate');
  const applied: Record<string, string> = {};
  const result = await verifyClaims(['Claim A', 'Claim B'].map((text) => ({text,evidenceIds:[],apply:(verdict)=>{applied[text]=verdict;}})), []);
  assert.deepEqual(applied, {'Claim A':'supported','Claim B':'unknown'});
  assert.deepEqual(result, {rewritten:0,removed:1,unknown:1});
});

test('a failed audit call leaves only its own row needing review', async () => {
  globalThis.fetch = async (_input, init) => String(init?.body).includes('Row B') ? Promise.reject(new Error('unavailable')) : completion('{"rows":[{"index":0,"met":"full","projects":[],"basis":"Built and shipped it himself."}]}');
  const { auditRoleMatches } = await import('../src/lib/recruiter-brief/generate');
  const rows: RoleMatch[] = ['Row A', 'Row B'].map((requirement) => ({requirement,assessment:'strong',evidence:'Fit check evidence',required:true,projectIds:[]}));
  await auditRoleMatches(rows, []);
  assert.equal(rows[0].assessment, 'strong');
  assert.equal(rows[0].verificationStatus, undefined);
  assert.equal(rows[1].assessment, 'relevant');
  assert.equal(rows[1].verificationStatus, 'unknown');
});

test('unknown rows never upgrade a confirmed missing core requirement', async () => {
  const { ceilingFor } = await import('../src/lib/recruiter-brief/generate');
  const rows: RoleMatch[] = [
    {requirement:'Senior SRE experience',assessment:'gap',evidence:'He confirmed he has not worked as an SRE',required:true,core:true,projectIds:[]},
    {requirement:'Graduation eligibility',assessment:'gap',verificationStatus:'unknown',evidence:'Needs review',required:true,projectIds:[]},
  ];
  const fit = {requirements:[],summary:{match:0,related:0,gap:2},read:'needs review: verification incomplete' as const};
  assert.equal(ceilingFor(fit, rows, 0), 'decline');
  assert.equal(ceilingFor(fit, rows.slice(1)), 'conditional');
});

test('an audit finding no evidence requests confirmation instead of declaring a gap', async () => {
  globalThis.fetch = async () => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:'{"rows":[{"index":0,"met":"none","projects":[],"basis":""}]}'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  const { auditRoleMatches, ceilingFor } = await import('../src/lib/recruiter-brief/generate');
  const row: RoleMatch = { requirement:'Angular experience', assessment:'strong', evidence:'Claimed experience', required:true, core:true, projectIds:[1] };
  await auditRoleMatches([row], []);
  assert.equal(row.assessment, 'relevant');
  assert.match(row.evidence, /missing evidence is not proof of a gap/i);
  assert.deepEqual(row.projectIds, []);
  assert.equal(ceilingFor({requirements:[],summary:{match:0,related:1,gap:0},read:'potential fit: pending confirmation'}, [row], 0), 'conditional');
});


test('confirmed complete tenure handles fractional thresholds, date precision and internship policy', () => {
  const day = '2026-10-09';
  assert.equal(professionalTenureVerdict(5, day), 'gap');
  assert.equal(professionalTenureVerdict(1.5, day), 'gap');
  assert.equal(professionalTenureVerdict(1, day), 'related');
  assert.equal(professionalTenureVerdict(1, day, false), 'gap');
  assert.equal(professionalTenureVerdict(1, '2026-11-01', false), 'related');
  assert.equal(professionalTenureVerdict(1, '2026-12-01', false), 'match');
  assert.equal(professionalTenureVerdict(5, '2031-12-01', false), 'match');
});

test('tenure excludes independent/training/future work and does not double-count overlapping jobs', () => {
  const period = {name:'Job A',kind:'employment' as const,start:'2025-01',end:'2025-12'};
  const baseline = tenureBounds([period], '2026-10-09');
  const actual = tenureBounds([
    period, {...period, name:'Concurrent job'},
    {name:'Training',kind:'training',start:'2010-01'},
    {name:'Independent product',kind:'independent',start:'2010-01'},
    {name:'Future role',kind:'employment',start:'2027-01'},
  ], '2026-10-09');
  assert.deepEqual(actual, baseline);
  assert.equal(actual.maxYears, 1);
  assert.ok(actual.minYears < 1);
  assert.deepEqual(tenureBounds([], '2026-10-09'), {minYears:0,maxYears:0});
  assert.ok(tenureBounds(CAREER_PERIODS, '2026-10-09').minYears < 1);
  assert.ok(tenureBounds(CAREER_PERIODS, '2026-10-09').maxYears > 1);
});

test('Mirage tenure and compound AND requirements remain confirmed gaps', async () => {
  const { assessRequirements } = await import('../src/lib/tools');
  const report = await assessRequirements([
    '5+ years of professional industry experience',
    '1.5 years of professional experience',
    '3–5 years of professional engineering experience',
    "Bachelor's degree AND 5 years of professional experience",
    '1 year of professional experience excluding internships',
  ], '2026-10-09');
  assert.deepEqual(report.summary, {match:0,related:0,gap:5});
  assert.ok(report.requirements.every(row => row.status === 'gap' && !row.verificationStatus));
  assert.match(report.requirements[0].evidence, /Cognizant since November 2025/);
  assert.match(report.requirements[0].evidence, /July-September 2023/);
});

test('alternatives, specialized scope and absent evidence are not automatically declared gaps or matches', async () => {
  // An incomplete evidence response must not override the distinction between unknown and false.
  globalThis.fetch = async () => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:'{"items":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  const { assessRequirements } = await import('../src/lib/tools');
  const report = await assessRequirements([
    "Bachelor's degree OR 5 years of professional experience",
    '1 year of professional experience as a senior agentic systems engineer',
    'Experience with an undocumented proprietary platform',
    '5 years of experience including independent projects',
    '1 year of full-time professional experience',
    'Up to 5 years of professional experience',
  ], '2026-10-09');
  assert.ok(report.requirements.every(row => row.status === 'related'));
  assert.equal(report.summary.gap, 0);
});

test('known tenure gap survives audit alongside unknown scope and changes next step to employer flexibility', async () => {
  const { auditRoleMatches, ceilingFor, defaultRecommendation, readFor } = await import('../src/lib/recruiter-brief/generate');
  const gap: RoleMatch = {requirement:'5+ years of professional industry experience',assessment:'gap',evidence:'Complete employed history is below five years.',required:true,projectIds:[]};
  const original = structuredClone(gap);
  globalThis.fetch = async () => Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:'{"rows":[]}'},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  const matches: RoleMatch[] = [gap,{requirement:'Senior- or staff-scope agentic systems experience',assessment:'relevant',evidence:'Scope not established.',required:true,core:true,projectIds:[]}];
  await auditRoleMatches(matches, []);
  assert.deepEqual(gap, original);
  assert.equal(matches[1].verificationStatus, 'unknown');
  matches.push({requirement:'Production Swift apps',assessment:'strong',evidence:'SelahNote is deployed.',required:true,projectIds:[1]});
  const read = readFor(matches);
  assert.notEqual(read, 'potential fit: pending confirmation');
  const fit = {requirements:[],summary:{match:1,related:1,gap:1},read};
  assert.equal(ceilingFor(fit, matches, 1), 'conditional');
  const recommendation = defaultRecommendation('conditional', matches);
  assert.match(recommendation.nextStep, /employer can relax 5\+ years/);
  assert.match(recommendation.rationale, /does not meet/);
  assert.doesNotMatch(recommendation.nextStep, /can be confirmed/);
});

test('evaluation cache changes at local midnight as tenure accrues', () => {
  const before = new Date('2026-10-10T03:59:59Z');
  const after = new Date('2026-10-10T04:00:00Z');
  assert.equal(assessmentDay(before), '2026-10-09');
  assert.equal(assessmentDay(after), '2026-10-10');
  assert.notEqual(evaluationIdentity(before), evaluationIdentity(after));
});

test('background retrieval replaces stale embeddings and drops deleted sections', () => {
  const stale: KnowledgeHit = {recordType:'personal_info',projectId:0,projectName:'Personal Info',section:'EXPERIENCE',category:'background',technologies:[],text:'DistilBERT improved accuracy by 25 percentage points.',score:0.8};
  const project: KnowledgeHit = {...stale,recordType:'project',projectId:1};
  const source = 'EXPERIENCE: DistilBERT was a Cognizant training project; no measured accuracy improvement is confirmed.';
  assert.equal(currentBackgroundHits([stale], [source])[0].text, source);
  assert.deepEqual(currentBackgroundHits([stale], []), []);
  assert.deepEqual(currentBackgroundHits([project], []), [project]);
  assert.doesNotMatch(CAREER_FACTS, /25 percentage|millions of records/i);
  assert.match(CAREER_FACTS, /built an MVP; operational adoption is pending/);
  const distilbert = WORK_EVIDENCE.filter(item => /DistilBERT/.test(item.text));
  assert.ok(distilbert.length > 0);
  assert.ok(distilbert.every(item => /training project/.test(item.text) && !/25 percentage/.test(item.text)));
});


test('saved recruiter brief cannot soften a confirmed gap in writer or verifier output', async () => {
  const { generateRecruiterBrief } = await import('../src/lib/recruiter-brief/generate');
  const row: RoleMatch = {requirement:'5+ years of professional industry experience',assessment:'gap',evidence:'Confirmed complete employment history does not meet five years.',required:true,projectIds:[]};
  const fit = {requirements:[],summary:{match:0,related:0,gap:1},read:'weak fit for this role' as const};
  const item = {id:'F1',kind:'fit' as const,section:'Fit',excerpt:row.evidence};
  let saved: unknown;
  process.env.BRIEF_WRITE_KEY = 'test-only';
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-only.convex.cloud';
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    const request = JSON.parse(String(init?.body ?? '{}'));
    if (url.startsWith('https://test-only.convex.cloud/')) {
      saved = request.args;
      return Response.json({status:'success',value:null});
    }
    assert.ok(url.includes('api.openai.com'));
    const system = request.messages?.[0]?.content ?? '';
    const content = system.startsWith('You write')
      ? {recommendation:{level:'conditional',nextStep:'Phone screen only if five years can be confirmed',rationale:'His additional experience needs confirmation.'}}
      : {items:[{index:0,verdict:'overstated',fixed:'He may have more experience to confirm.'}]};
    return Response.json({id:'mock',object:'chat.completion',created:0,model:'gpt-4.1',choices:[{index:0,message:{role:'assistant',content:JSON.stringify(content)},finish_reason:'stop'}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}});
  };
  try {
    const brief = await generateRecruiterBrief({evaluation:{
      roleTitle:'Software Engineer, Agents',companyName:'Mirage',requirements:[{text:row.requirement,required:true}],
      logistics:[],fit,evidence:{items:[item],fitIds:new Map([[0,'F1']])},roleMatches:[row],read:fit.read,
      ceiling:'conditional',broadQuery:'Mirage',evaluationIdentity:evaluationIdentity(),
    }});
    assert.equal(brief.generatedBrief.roleMatches[0].assessment, 'gap');
    assert.match(brief.generatedBrief.recommendation.nextStep, /employer can relax/);
    assert.match(brief.generatedBrief.recommendation.rationale, /does not meet/);
    assert.ok(saved, 'Brief persistence received the corrected payload through mocked transport');
    assert.match(JSON.stringify(saved), /employer can relax/);
    assert.doesNotMatch(JSON.stringify(saved), /five years can be confirmed|may have more experience/);
  } finally {
    delete process.env.BRIEF_WRITE_KEY;
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    globalThis.fetch = async () => { throw new Error('Live network calls are forbidden in unit tests'); };
  }
});
