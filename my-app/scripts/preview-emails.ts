/** Local previews from saved model judgments. Live AI is never used here. */
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import type { Widget } from '../src/lib/chat-events';
import type { StoredBrief, MatchLevel } from '../src/lib/recruiter-brief/types';

async function main() {
  const send = process.argv.find((arg) => arg.startsWith('--send-email='))?.split('=')[1];
  if (send && !['fit', 'brief'].includes(send)) throw new Error('Delivery checks accept --send-email=fit or --send-email=brief');
  if (send && !process.env.RESEND_API_KEY) throw new Error('A delivery check needs a configured RESEND_API_KEY');
  process.env.LANGCHAIN_TRACING_V2 = 'false';
  process.env.LANGSMITH_TRACING = 'false';
  process.env.RESEND_API_KEY ||= 'local-preview-only';
  delete process.env.OPENAI_API_KEY;
  const dir = path.resolve('.data/email-previews');
  await fs.mkdir(dir, { recursive: true });
  const realFetch = globalThis.fetch;
  let kind = 'fit';
  let actualSends = 0;
  globalThis.fetch = async (input, init) => {
    const url = String(input instanceof Request ? input.url : input);
    if (url !== 'https://api.resend.com/emails') throw new Error('Layout tests block all external calls except explicitly opted-in Resend delivery');
    const payload = JSON.parse(String(init?.body));
    await fs.writeFile(path.join(dir, `${kind}.html`), payload.html);
    await fs.writeFile(path.join(dir, `${kind}.txt`), payload.text);
    for (const attachment of payload.attachments ?? []) {
      const data = Buffer.from(attachment.content, 'base64');
      if (attachment.filename.endsWith('.pdf')) assert.equal(data.subarray(0, 5).toString(), '%PDF-');
      await fs.writeFile(path.join(dir, `${kind}-${path.basename(attachment.filename)}`), data);
    }
    assert.ok(payload.attachments.some((a: {filename:string}) => a.filename.endsWith('.pdf')), 'PDF generation must succeed');
    if (send === kind) {
      assert.equal(actualSends++, 0, 'At most one delivery request per explicit run');
      return realFetch(input, init);
    }
    return Response.json({ id: `local-preview-${kind}` });
  };
  const saved = JSON.parse(await fs.readFile('evals/fit-comparison.json', 'utf8'));
  const result = saved.results.find((r: {id:string;model:string}) => r.id === 'posting-extraction' && r.model === 'gpt-5.6-luna');
  assert.ok(result, 'Run the explicit model comparison once to save responses');
  const status = { strong: 'match', relevant: 'related', gap: 'gap', unknown: 'gap' } as const;
  const requirements = result.rows.map((row: {requirement:string;assessment:keyof typeof status;evidence:string}) => ({ requirement: row.requirement, status: status[row.assessment], evidence: row.evidence, ...(row.assessment === 'unknown' ? { verificationStatus: 'unknown' as const } : {}), projects: [] }));
  const report: Extract<Widget, {kind:'fit_report'}> = { kind:'fit_report', role:'Junior iOS Engineer — saved comparison fixture', requirements, summary: {match:requirements.filter((r: {status:string})=>r.status==='match').length,related:requirements.filter((r: {status:string})=>r.status==='related').length,gap:requirements.filter((r: {status:string})=>r.status==='gap').length} };
  await fs.writeFile(path.join(dir, 'fit-widget.json'), JSON.stringify(report, null, 2));
  const { notifyFitCheck, notifyRecruiterBrief } = await import('../src/lib/notify');
  const { toBriefView } = await import('../src/lib/recruiter-brief/view');
  const transcript = [{role:'user' as const,content:'Local layout fixture using saved judgments; no new model call.'}];
  assert.equal(await notifyFitCheck({report,transcript,conversationId:'local-layout-preview'}), 'sent');
  // The brief shell is fixed layout data; role judgments are saved AI output.
  const brief: StoredBrief = { publicId:'localpreview',createdAt:1791374400000,roleTitle:report.role,version:1,evidenceReferences:[],generatedBrief:{candidateSummary:'Local layout fixture using saved fit-check judgments.',roleMatches:result.rows.map((row: {requirement:string;assessment:MatchLevel|'unknown';evidence:string;required:boolean})=>({...row,assessment:row.assessment==='unknown'?'gap':row.assessment, ...(row.assessment==='unknown'?{verificationStatus:'unknown'}:{}), projectIds:[]})),reasonsToConsider:[],projects:[],standoutSignal:null,validationAreas:['Graduation eligibility needs review.'],interviewQuestions:[],recommendation:{level:'conditional',nextStep:'Phone screen only if graduation eligibility can be verified',rationale:'A 2024 graduation year does not establish the exact month needed for the eligibility window.'}}};
  const view = toBriefView(brief);
  await fs.writeFile(path.join(dir, 'brief-view.json'), JSON.stringify(view, null, 2));
  kind = 'brief';
  assert.equal(await notifyRecruiterBrief({view,transcript}), 'sent');
  console.log(`Previews: ${dir}\nLive AI calls: 0. Real email delivery requests: ${actualSends}.`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
