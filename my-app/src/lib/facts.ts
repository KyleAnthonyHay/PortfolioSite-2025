import fs from 'fs';
import path from 'path';
import { profile } from './profile';

/**
 * Facts Kyle has stated himself, from backend/project-descriptions/kyle-profile.md:
 * one entry per bullet, grouped by its "##" heading. He edits that file; the
 * agent cites these as his own account. If it can't be read, none of them are
 * used rather than guessed.
 */
const profileFile =
  process.env.PORTFOLIO_PROFILE_FILE || path.resolve(process.cwd(), '../backend/project-descriptions/kyle-profile.md');

function readOwnAccount(): { topic: string; text: string }[] {
  let raw = '';
  try {
    raw = fs.readFileSync(profileFile, 'utf-8');
  } catch {
    console.warn(`kyle-profile.md not found at ${profileFile}; his own-account facts are left out`);
    return [];
  }
  const facts: { topic: string; text: string }[] = [];
  let topic = '';
  for (const line of raw.split('\n')) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) topic = heading[1].trim();
    else if (topic && /^-\s+/.test(line)) facts.push({ topic, text: line.replace(/^-\s+/, '').trim() });
  }
  return facts;
}

const OWN_ACCOUNT = readOwnAccount();
const ownFacts = (topic: RegExp) => OWN_ACCOUNT.filter((fact) => topic.test(fact.topic)).map((fact) => fact.text);
const cognizantOwn = ownFacts(/^work:.*cognizant/i);
/** His answers on where and how he works, in his words. */
export const WORK_ARRANGEMENT = ownFacts(/^work arrangement/i);
const arrangement = WORK_ARRANGEMENT;
/** Citizenship, start date, pay, employment type, GPA and the like, in his words. */
export const HIRING_DETAILS = [...ownFacts(/^hiring/i), ...ownFacts(/^education/i)];

/**
 * Career facts every answer has to respect, shared by the chat agent and the
 * recruiter brief so the two can't drift apart. They come from the project
 * write-ups and his résumé; anything not here or in a tool result is "not
 * stated", never inferred.
 */
export const CAREER_FACTS = `Fixed facts (never contradict, never go beyond):
- Solo projects: SelahNote, SelahNote Creator Dashboard, SoundSnag, V1 ProdBot, YarnScript, Country Viewer.
- Team projects: OnTract and Sentio+, built by teams in the Revature AI Engineering training program (January 2026), not at an employer. On OnTract he was a backend engineer on database migrations and design; teammates built the AI agent and the ingestion pipeline, which he later reimplemented in his solo Convex rebuild. On Sentio+ he did the AI and front-end work; teammates built the FastAPI service and the Docker setup. He later rebuilt both solo on Convex. Credit him only with his part, even when a question assumes more.
- Claude: on the Sentio+ team version he wrote the first chat API route himself, calling Anthropic's Claude 3 Sonnet through AWS Bedrock (not Anthropic's own API). That is his hands-on Claude use.
- Sentio+'s fine-tuned RoBERTa model was trained on open-source data and never wired into the live app. Sentio+ has no user, usage or revenue figures.
- SelahNote is a production Swift app: he wrote it himself in Swift and SwiftUI, and it has been live on the App Store since August 2025. V1 ProdBot, OnTract (his rebuild), Sentio+ (his rebuild) and YarnScript are deployed web apps; SoundSnag and Country Viewer are not distributed.
- SelahNote has over 400 users (about 40 paying subscribers) and a 5.0 App Store rating across 16 ratings. These are his largest real numbers; nothing he built runs at large scale, so never call any of it large-scale.
- V1 ProdBot was requested by V1 Church's head global audio engineer, the one real outside stakeholder; a rollout across campuses is planned, not done.
- YarnScript was a four-hour take-home challenge for the startup Yarn (March 2026), not client work; Yarn did not hire him.
- Professional experience, from his résumé: AI Engineer at Cognizant since November 2025, and a Software Engineering internship at The Difference (July to September 2023). His Cognizant work, in the résumé's words: an AI-assisted synthetic-data testbed for the global data warehouse using column metadata and business rules; fine-tuning DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points; ETL regression testing across millions of records. ${cognizantOwn.length ? `In his own words (not yet on his résumé): ${cognizantOwn.join(' ')}` : ''} Describe Cognizant only with these words; none of his portfolio projects were built there.
- Professional tenure is about one year (Cognizant since November 2025, plus the three-month internship). Never count side projects or training programs as professional years.
- Client and real-user work: V1 ProdBot is the one project built at an outside stakeholder's request. SelahNote has real users and paying subscribers. The Creator Dashboard is an internal tool for SelahNote's staff and creators. YarnScript, Sentio+, OnTract, SoundSnag and Country Viewer have no stated users.
- Never classify an employer (big tech, FAANG, startup, enterprise) or answer yes or no to whether he has worked at one: list the employers his résumé names (Cognizant, The Difference) and let the visitor judge. Never state what he has not done unless a tool says so. Never speculate about weaknesses.
- Also from his résumé: first place at the Headstarter Hackathon (MunchMap, February 2024, three-person team); top 5% of applicants in the Yarn challenge.
- Work arrangement, in his own words: ${arrangement.join(' ') || 'not stated.'} He is based in ${profile.location}.${HIRING_DETAILS.length ? ` Hiring details, in his own words: ${HIRING_DETAILS.join(' ')}` : ''} Anything not listed here (for example notice details or a salary figure) is not stated.
- His background notes are his own account. A claim found only there (for example that he has led small teams) is "he says", not a verified fact, and no project shows him leading a team.`;

/**
 * Work with no project write-up: the Cognizant role, the internship and the
 * hackathon, from his résumé or, where marked, his own account. This is the
 * one source for that work: check_experience counts it as his own use, the
 * fit check judges requirements against it, and the brief's background cites
 * it, so "has he fine-tuned DistilBERT?" and "QA test cases" agree everywhere.
 */
export const WORK_EVIDENCE: { where: string; text: string; source: 'résumé' | 'his account' }[] = [
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Designed an AI-assisted synthetic-data testbed for the global data warehouse using column metadata and business rules to reduce manual test-data preparation.', source: 'résumé' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Fine-tuned DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points.', source: 'résumé' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Executed ETL regression testing across millions of records to surface pre-production data defects.', source: 'résumé' },
  { where: 'Software Engineering Intern at The Difference (Jul to Sep 2023)', text: 'Built a web version of a fitness app from Figma designs using WordPress, HTML, and CSS.', source: 'résumé' },
  { where: 'MunchMap, 1st place at the Headstarter Hackathon (Feb 2024)', text: 'Built a role-based React food-donation workflow with a three-person team.', source: 'résumé' },
  // His jobs and other work from kyle-profile.md; where he works, hiring details and education are answered elsewhere.
  ...OWN_ACCOUNT.filter((fact) => !/^(work arrangement|hiring|education)/i.test(fact.topic)).map((fact) => ({
    where: fact.topic.replace(/^work:\s*/i, ''),
    text: fact.text,
    source: 'his account' as const,
  })),
];

/** His answers on where he works, from kyle-profile.md; an answer that isn't there is "ask him". */
// The office bullet mentions relocating too, so each answer prefers a bullet about only that.
const own = (pattern: RegExp) => arrangement.find((text) => pattern.test(text) && !(pattern.source !== 'office' && /office/i.test(text))) ?? arrangement.find((text) => pattern.test(text));
export const IN_OFFICE = own(/office/i) ? `${own(/office/i)!.replace(/\.$/, '')} (his own words).` : '';
const AUTHORIZED = own(/sponsor/i) ? `${own(/sponsor/i)!.replace(/\.$/, '')} (his own words).` : '';
const REMOTE = own(/remote/i) ? `${own(/remote/i)!.replace(/\.$/, '')} (his own words).` : '';
const TRAVEL = own(/travel/i) ? `${own(/travel/i)!.replace(/\.$/, '')} (his own words).` : '';
const RELOCATE = own(/relocat/i) ? `${own(/relocat/i)!.replace(/\.$/, '')} (his own words).` : '';

/**
 * A posting's location or work-arrangement condition against what he has
 * said: office or hybrid work, work authorization and relocation are met;
 * travel and remote-only roles he has not spoken to, so ask him.
 */
export function workArrangement(condition: string): { met: boolean; evidence: string } {
  const text = condition.toLowerCase();
  const base = `Based in ${profile.location}.`;
  const ask = (what: string) => ({ met: false, evidence: `${base} ${what} is not stated: ask him.` });
  if (/\btravel\w*/.test(text)) return TRAVEL ? { met: true, evidence: `${base} ${TRAVEL}` } : ask('Travel');
  if (/\btime ?zones?\b/.test(text)) return ask('Time-zone flexibility');
  if (/\b(visas?|sponsor\w*|authori[sz]\w*|citizen\w*|green card)\b/.test(text)) {
    const citizen = HIRING_DETAILS.find((t) => /citizen/i.test(t));
    const said = [citizen ? `${citizen.replace(/\.$/, '')} (his own words).` : '', AUTHORIZED].filter(Boolean).join(' ');
    return said ? { met: true, evidence: `${base} ${said}` } : ask('Work authorization');
  }
  const inOffice = /\b(office|on-?site|hybrid|in[- ]person)\b/.test(text);
  if (/\b(remote|telecommute|distributed)\b/.test(text) && !inOffice) return REMOTE ? { met: true, evidence: `${base} ${REMOTE}` } : ask('Whether fully remote suits him');
  const local = /\b(new york|nyc|brooklyn|manhattan|queens|bronx|staten island|new jersey|nj|jersey city|hoboken|newark)\b/.test(text);
  if (inOffice && !IN_OFFICE) return ask('Office attendance');
  if (!local && !RELOCATE) return ask('Relocation');
  return { met: true, evidence: [base, inOffice ? IN_OFFICE : '', local ? '' : RELOCATE].filter(Boolean).join(' ') };
}

/** His GPA from kyle-profile.md, when he has given it. */
export const GPA = (() => {
  const line = HIRING_DETAILS.find((text) => /\bGPA\b/i.test(text));
  const value = line ? /GPA\s*(?:of\s*)?(\d(?:\.\d+)?)/i.exec(line)?.[1] : undefined;
  return value ? parseFloat(value) : null;
})();
