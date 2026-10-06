/**
 * Career facts every answer has to respect, shared by the chat agent and the
 * recruiter brief so the two can't drift apart. They come from the project
 * write-ups and his résumé; anything not here or in a tool result is "not
 * stated", never inferred.
 */
export const CAREER_FACTS = `Fixed facts (never contradict, never go beyond):
- Solo projects: SelahNote, SelahNote Creator Dashboard, SoundSnag, V1 ProdBot, YarnScript, Country Viewer.
- Team projects: OnTract and Sentio+, built by teams in the Revature AI Engineering training program (January 2026), not at an employer. On OnTract he was a backend engineer on database migrations and design; teammates built the AI agent and the ingestion pipeline, which he later reimplemented in his solo Convex rebuild. On Sentio+ he did the AI and front-end work; teammates built the FastAPI service and the Docker setup. He later rebuilt both solo on Convex. Credit him only with his part, even when a question assumes more.
- Sentio+'s fine-tuned RoBERTa model was trained on open-source data and never wired into the live app. Sentio+ has no user, usage or revenue figures.
- SelahNote has over 400 users (about 40 paying subscribers) and a 5.0 App Store rating across 16 ratings. These are his largest real numbers; nothing he built runs at large scale, so never call any of it large-scale.
- V1 ProdBot was requested by V1 Church's head global audio engineer, the one real outside stakeholder; a rollout across campuses is planned, not done.
- YarnScript was a four-hour take-home challenge for the startup Yarn (March 2026), not client work; Yarn did not hire him.
- Professional experience, from his résumé: AI Engineer at Cognizant since November 2025, and a Software Engineering internship at The Difference (July to September 2023). His Cognizant work, in the résumé's words: an AI-assisted synthetic-data testbed for the global data warehouse using column metadata and business rules; fine-tuning DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points; ETL regression testing across millions of records. Describe Cognizant only with those words; none of his portfolio projects were built there.
- Professional tenure is about one year (Cognizant since November 2025, plus the three-month internship). Never count side projects or training programs as professional years.
- Client and real-user work: V1 ProdBot is the one project built at an outside stakeholder's request. SelahNote has real users and paying subscribers. The Creator Dashboard is an internal tool for SelahNote's staff and creators. YarnScript, Sentio+, OnTract, SoundSnag and Country Viewer have no stated users.
- Never classify an employer (big tech, startup, enterprise) or state what he has not done unless a tool says so; name what his résumé lists instead. Never speculate about weaknesses.
- Also from his résumé: first place at the Headstarter Hackathon (MunchMap, February 2024, three-person team); top 5% of applicants in the Yarn challenge.
- His background notes are his own account. A claim found only there (for example that he has led small teams) is "he says", not a verified fact, and no project shows him leading a team.`;

/**
 * Work his résumé describes that has no project write-up: the Cognizant role,
 * the internship and the hackathon. check_experience counts these as his own
 * use, citing the résumé, so "has he fine-tuned DistilBERT?" agrees with it.
 */
export const RESUME_EVIDENCE: { where: string; text: string }[] = [
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Designed an AI-assisted synthetic-data testbed for the global data warehouse using column metadata and business rules to reduce manual test-data preparation.' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Fine-tuned DistilBERT, increasing sentiment-analysis accuracy by 25 percentage points.' },
  { where: 'AI Engineer at Cognizant (Nov 2025 to present)', text: 'Executed ETL regression testing across millions of records to surface pre-production data defects.' },
  { where: 'Software Engineering Intern at The Difference (Jul to Sep 2023)', text: 'Built a web version of a fitness app from Figma designs using WordPress, HTML, and CSS.' },
  { where: 'MunchMap, 1st place at the Headstarter Hackathon (Feb 2024)', text: 'Built a role-based React food-donation workflow with a three-person team.' },
];
