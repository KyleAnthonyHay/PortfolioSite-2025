import { profile } from './profile';

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
- Professional experience, from his résumé: AI Engineer at Cognizant since November 2025, and a Software Engineering internship at The Difference (July to September 2023). His Cognizant work, in the résumé's words: an AI-assisted synthetic-data testbed for the global data warehouse using column metadata and business rules; fine-tuning DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points; ETL regression testing across millions of records. In his own words (October 2026, not yet on his résumé): his AI Engineer role sits on a QA team whose core work is regression testing and functional and technical recon; he is helping his team lead organize that work and is being trained to help team leads coordinate operations with the offshore team, working alongside them. He does not lead the team. Describe Cognizant only with these words; none of his portfolio projects were built there.
- Professional tenure is about one year (Cognizant since November 2025, plus the three-month internship). Never count side projects or training programs as professional years.
- Client and real-user work: V1 ProdBot is the one project built at an outside stakeholder's request. SelahNote has real users and paying subscribers. The Creator Dashboard is an internal tool for SelahNote's staff and creators. YarnScript, Sentio+, OnTract, SoundSnag and Country Viewer have no stated users.
- Never classify an employer (big tech, FAANG, startup, enterprise) or answer yes or no to whether he has worked at one: list the employers his résumé names (Cognizant, The Difference) and let the visitor judge. Never state what he has not done unless a tool says so. Never speculate about weaknesses.
- Also from his résumé: first place at the Headstarter Hackathon (MunchMap, February 2024, three-person team); top 5% of applicants in the Yarn challenge.
- Work arrangement, in his own words (October 2026): he is willing to work in the office five days a week. He is based in Brooklyn, New York. Relocation, visa or sponsorship status, salary and start date are not stated.
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
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Works on a QA team as part of his AI Engineer role; regression testing and functional and technical recon are the team\'s core work.', source: 'his account' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Helps his team lead organize the QA work, and is being trained to help team leads coordinate operations with the offshore team while working alongside them.', source: 'his account' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Fine-tuned DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points.', source: 'résumé' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Executed ETL regression testing across millions of records to surface pre-production data defects.', source: 'résumé' },
  { where: 'Software Engineering Intern at The Difference (Jul to Sep 2023)', text: 'Built a web version of a fitness app from Figma designs using WordPress, HTML, and CSS.', source: 'résumé' },
  { where: 'MunchMap, 1st place at the Headstarter Hackathon (Feb 2024)', text: 'Built a role-based React food-donation workflow with a three-person team.', source: 'résumé' },
];

/** His answer on office attendance, in his own words (October 2026). */
export const IN_OFFICE = 'Willing to work in the office five days a week (his own words).';

/**
 * A posting's location or work-arrangement condition against what he has
 * said: office work in New York is met; remote-only, another city,
 * relocation, visas, sponsorship and travel are not stated, so ask him.
 */
export function workArrangement(condition: string): { met: boolean; evidence: string } {
  const text = condition.toLowerCase();
  const base = `Based in ${profile.location}.`;
  if (/\b(visas?|sponsor\w*|authori[sz]\w*|relocat\w*|travel\w*|time ?zones?)\b/.test(text)) {
    return { met: false, evidence: `${base} ${IN_OFFICE} Relocation, travel and work authorization are not stated: ask him.` };
  }
  const inOffice = /\b(office|on-?site|hybrid|in[- ]person)\b/.test(text);
  if (inOffice && /\b(new york|nyc|brooklyn|manhattan)\b/.test(text)) {
    return { met: true, evidence: `${base} ${IN_OFFICE}` };
  }
  if (/\b(remote|telecommute|distributed)\b/.test(text) && !inOffice) {
    return { met: false, evidence: `${base} ${IN_OFFICE} Whether fully remote suits him is not stated: ask him.` };
  }
  return { met: false, evidence: `${base} ${IN_OFFICE} Working outside New York would mean relocating, which is not stated: ask him.` };
}
