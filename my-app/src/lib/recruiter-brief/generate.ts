import { CAREER_FACTS, WORK_EVIDENCE } from '../facts';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { assessRequirements, type FitAssessment } from '../tools';
import { getKnowledgeSections, searchKnowledge, type KnowledgeHit } from '../knowledge';
import { catalog, findProjectByName, projectById } from '../project-catalog';
import { profile, skillGroups } from '../profile';
import type { FitStatus } from '../chat-events';
import {
  BRIEF_VERSION,
  type EvidenceReference,
  type MatchLevel,
  type RecommendationLevel,
  type RecruiterBrief,
  type RoleMatch,
  type StoredBrief,
} from './types';
import { newPublicId, saveBrief } from './store';

/**
 * Recruiter brief pipeline:
 *   posting → requirements (same rules as the fit check) → fit check →
 *   evidence set from the knowledge base → structured brief → every claim
 *   checked against the evidence it cites → saved.
 * Role Match rows come straight from the fit check, so the writer can't
 * soften a gap, and the recommendation can't go past what the fit check's
 * overall read allows.
 */

/** The fit check's extraction rules, shared with the chat agent's prompt. */
export const REQUIREMENT_RULES =
  'Extract every concrete requirement, including nice-to-haves, as a short phrase each (e.g. "3+ years Swift", "CI/CD", "Kotlin or Android"). Keep experience requirements whole, with the job function, domain and years as written (e.g. "4+ years as a data scientist in finance"), and never soften or drop a requirement he may not meet. Keep an "or" list as one requirement (e.g. "Java, Kotlin, Python or Go").';

/**
 * Facts not yet confirmed by Kyle-Anthony. Any sentence naming them is kept
 * out of the evidence and out of the brief. The Cognizant role is listed on
 * the site but unconfirmed as of October 2026.
 */
const UNCONFIRMED: RegExp[] = [];
const DRAFT_MARKER = /\[NEEDS KYLE/i;

function scrub(text: string): string {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"“(])/)
    .filter((sentence) => !UNCONFIRMED.some((pattern) => pattern.test(sentence)) && !DRAFT_MARKER.test(sentence))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function model(temperature = 0.2): ChatOpenAI {
  return new ChatOpenAI({ model: process.env.OPENAI_BRIEF_MODEL ?? 'gpt-4.1', temperature, modelKwargs: { seed: 7 } });
}

async function askJson<T>(system: string, user: string, temperature = 0.2): Promise<T> {
  const response = await model(temperature)
    .bind({ response_format: { type: 'json_object' } })
    .invoke([new SystemMessage(system), new HumanMessage(user)]);
  const text = typeof response.content === 'string' ? response.content : '';
  return JSON.parse(text) as T;
}

/* ------------------------------------------------------------------------ */
/* Requirements                                                              */
/* ------------------------------------------------------------------------ */

interface ExtractedPosting {
  roleTitle?: string;
  companyName?: string;
  requirements: { text: string; required: boolean }[];
  /** Index of the requirement that names the job itself, when there is one. */
  coreIndex?: number;
  /** Location, on-site days, visas, travel: things the portfolio can't speak to. */
  logistics: string[];
}

/** One extraction per posting text, so the chat card and a later brief (and a rerun) read the same rows. */
const extractions = new Map<string, Promise<ExtractedPosting>>();

/**
 * Extractions are also saved to disk, one file per posting, so a server
 * restart doesn't re-split the same posting into different rows. Delete a
 * file (or run `npm run postings:forget`) to extract that posting again.
 * Where the disk is read-only (Vercel), this quietly falls back to memory.
 */
const postingsDir = process.env.PORTFOLIO_POSTINGS_DIR || path.resolve(process.cwd(), '.cache/postings');

function postingFile(text: string): string {
  const hash = createHash('sha256').update(text.replace(/\s+/g, ' ').trim()).digest('hex').slice(0, 16);
  return path.join(postingsDir, `${hash}.json`);
}

async function savedExtraction(text: string): Promise<ExtractedPosting> {
  const file = postingFile(text);
  try {
    return JSON.parse(await fs.readFile(file, 'utf-8')).extracted as ExtractedPosting;
  } catch {
    const extracted = await extractRequirementsOnce(text);
    await fs
      .mkdir(postingsDir, { recursive: true })
      .then(() => fs.writeFile(file, JSON.stringify({ savedAt: new Date().toISOString(), extracted }, null, 2)))
      .catch(() => undefined);
    return extracted;
  }
}

function extractRequirements(jobDescription: string): Promise<ExtractedPosting> {
  const key = jobDescription.trim();
  if (!extractions.has(key)) {
    const run = savedExtraction(key);
    extractions.set(key, run);
    run.catch(() => extractions.delete(key));
    if (extractions.size > 200) extractions.delete(extractions.keys().next().value!);
  }
  return extractions.get(key)!;
}

async function extractRequirementsOnce(jobDescription: string): Promise<ExtractedPosting> {
  const parsed = await askJson<{
    roleTitle?: string | null;
    companyName?: string | null;
    requirements?: { text?: string; required?: boolean }[];
    coreFunction?: string | null;
    logistics?: string[];
  }>(
    `You read a job posting for a recruiter. ${REQUIREMENT_RULES}
Mark each one required or nice-to-have, as the posting does (preferred, bonus, plus = nice-to-have). Return at most 11, required ones first; when the posting lists more, merge closely related ones into one row rather than dropping any. If the posting lists more, merge only near-duplicates; never drop a hard requirement such as years of experience, a degree, a domain or the job function itself. Leave location, office attendance, travel, work authorization and compensation out of requirements. List in "logistics" only conditions a candidate must meet about where or how they work (e.g. "Hybrid in San Francisco, 25% in office", "On-site in New York"); not employment type, pay or benefits.
"coreFunction" is the job itself as one experience requirement: the kind of engineer or specialist and the seniority the posting implies (e.g. "Senior-level experience as a site reliability engineer", "Experience as a data scientist in finance", "Experience as a full-stack engineer building AI products"). Name a domain only when the job is a specialist in it (a finance data scientist); the company's product area (fintech, health, education) is not part of the job itself. It is always required.
Return the role title and the hiring company exactly as the posting states them, or null.
JSON: {"roleTitle": string|null, "companyName": string|null, "coreFunction": string, "requirements": [{"text": string, "required": boolean}], "logistics": [string]}`,
    jobDescription.slice(0, 14000),
    0
  );
  const requirements = (parsed.requirements ?? [])
    .filter((r): r is { text: string; required?: boolean } => typeof r.text === 'string' && r.text.trim().length > 1)
    .map((r) => ({ text: r.text.trim().slice(0, 160), required: r.required !== false }));
  // The job itself goes first, so the fit check judges "has he done this job" before any single skill.
  const core = parsed.coreFunction?.trim();
  if (core) requirements.unshift({ text: core.slice(0, 160), required: true });
  return {
    roleTitle: parsed.roleTitle?.trim() || undefined,
    companyName: parsed.companyName?.trim() || undefined,
    requirements: requirements.slice(0, 12),
    coreIndex: core ? 0 : undefined,
    logistics: (parsed.logistics ?? []).filter((l): l is string => typeof l === 'string' && l.trim().length > 3 && !/^[A-Z_ ]+$/.test(l.trim())).slice(0, 4),
  };
}

/* ------------------------------------------------------------------------ */
/* Evidence                                                                  */
/* ------------------------------------------------------------------------ */

const knowledgeDir =
  process.env.PORTFOLIO_KNOWLEDGE_DIR || path.resolve(process.cwd(), '../backend/project-descriptions/knowledge');

let rolesPromise: Promise<Map<number, string>> | null = null;

/** The `role:` line from each write-up's front matter: solo, or what he did on a team. */
function projectRoles(): Promise<Map<number, string>> {
  rolesPromise ??= fs
    .readdir(knowledgeDir)
    .then(async (files) => {
      const roles = new Map<number, string>();
      for (const file of files.filter((name) => name.endsWith('.md') && name !== 'README.md')) {
        const raw = await fs.readFile(path.join(knowledgeDir, file), 'utf-8');
        const name = /^project:\s*(.+)$/m.exec(raw)?.[1].trim().replace(/^"|"$/g, '');
        const role = /^role:\s*(.+)$/m.exec(raw)?.[1].trim().replace(/^"|"$/g, '');
        const project = name ? findProjectByName(name) : null;
        if (project && role) roles.set(project.id, role);
      }
      return roles;
    })
    .catch(() => new Map<number, string>());
  return rolesPromise;
}

function profileFacts(): EvidenceReference[] {
  const year = new Date().getFullYear();
  const skills = skillGroups
    .map((group) => `${group.name}: ${group.skills.map((s) => (s.since ? `${s.name} (since ${s.since})` : s.name)).join(', ')}`)
    .join('. ');
  return [
    { id: 'P1', kind: 'profile', section: 'Education', excerpt: 'B.S. in Computer Science, CUNY Hunter College, 2024.' },
    {
      id: 'P2',
      kind: 'profile',
      section: 'Experience to date',
      excerpt: `Building software since 2022 (about ${year - 2022} years), mostly through personal and team projects. ${WORK_EVIDENCE.map((item) => `${item.where}${item.source === 'his account' ? ', in his own words' : ''}: ${item.text}`).join(' ')} Revature AI Engineering training program in January 2026, where OnTract and Sentio+ were built as team projects. Professional tenure is about one year.`,
    },
    { id: 'P3', kind: 'profile', section: 'Location and availability', excerpt: `Based in ${profile.location}. ${profile.availability.join('. ')}.` },
    { id: 'P4', kind: 'profile', section: 'Listed skills with start years', excerpt: skills },
  ];
}

interface EvidenceSet {
  items: EvidenceReference[];
  fitIds: Map<number, string>;
}

async function buildEvidence(queries: string[], broadQuery: string, fit: FitAssessment | null): Promise<EvidenceSet> {
  const search = (query: string, topK: number, recordType: 'project' | 'personal_info' = 'project') =>
    searchKnowledge(query, { recordType, topK }).catch((error) => {
      console.error('recruiter brief: search failed', error);
      return [] as KnowledgeHit[];
    });

  const [perQuery, broad, personal, roles, sections] = await Promise.all([
    Promise.all(queries.slice(0, 16).map((query) => search(query, 4))),
    search(broadQuery, 10),
    search(broadQuery, 3, 'personal_info'),
    projectRoles(),
    getKnowledgeSections(),
  ]);

  // Best score per section; at most four sections per project so one long
  // write-up can't crowd out another project's single relevant section.
  const best = new Map<string, KnowledgeHit>();
  for (const hit of [...perQuery.flat(), ...broad]) {
    if (!projectById(hit.projectId)) continue;
    const key = `${hit.projectId}|${hit.section}`;
    if (!best.has(key) || best.get(key)!.score < hit.score) best.set(key, hit);
  }
  const perProject = new Map<number, number>();
  const chosen = [...best.values()]
    .sort((a, b) => b.score - a.score)
    .filter((hit) => {
      const count = perProject.get(hit.projectId) ?? 0;
      perProject.set(hit.projectId, count + 1);
      return count < 4;
    })
    .slice(0, 22);

  const projectIds = new Set<number>([...chosen.map((hit) => hit.projectId), ...(fit?.requirements.flatMap((r) => r.projects.map((p) => p.id)) ?? [])]);

  // Each project's role section always comes along, so team work is credited correctly.
  for (const id of projectIds) {
    const role = sections.find((section) => section.projectId === id && /role/i.test(section.section));
    if (role && !chosen.some((hit) => hit.projectId === id && hit.section === role.section)) {
      chosen.push({ ...role, recordType: 'project', score: 0 });
    }
  }

  const items: EvidenceReference[] = [];
  chosen.forEach((hit, i) => {
    const text = scrub(hit.text);
    if (!text) return;
    items.push({
      id: `S${i + 1}`,
      kind: 'section',
      projectId: hit.projectId,
      projectName: projectById(hit.projectId)?.title ?? hit.projectName,
      section: hit.section,
      excerpt: text.length > 1600 ? `${text.slice(0, 1600)}…` : text,
    });
  });

  [...projectIds].forEach((id, i) => {
    const role = roles.get(id);
    const project = projectById(id);
    if (role && project) items.push({ id: `R${i + 1}`, kind: 'section', projectId: id, projectName: project.title, section: 'Who built it', excerpt: `${project.title}: ${role}.` });
  });

  personal.forEach((hit, i) => {
    const text = scrub(hit.text);
    if (text) items.push({ id: `B${i + 1}`, kind: 'section', section: `Background: ${hit.section}`, excerpt: text.slice(0, 1200) });
  });

  items.push(...profileFacts());

  const fitIds = new Map<number, string>();
  fit?.requirements.forEach((row, i) => {
    const id = `F${i + 1}`;
    fitIds.set(i, id);
    items.push({
      id,
      kind: 'fit',
      section: 'Fit check',
      excerpt: `Requirement "${row.requirement}": ${LEVEL[row.status]}. ${scrub(row.evidence)}${row.projects.length ? ` Projects: ${row.projects.map((p) => p.title).join(', ')}.` : ''}`,
    });
  });

  return { items, fitIds };
}

/* ------------------------------------------------------------------------ */
/* Recommendation bounds                                                     */
/* ------------------------------------------------------------------------ */

const LEVEL: Record<FitStatus, MatchLevel> = { match: 'strong', related: 'relevant', gap: 'gap' };
const RANK: Record<RecommendationLevel, number> = { decline: 0, conditional: 1, screen: 2, advance: 3 };
const HARD_REQUIREMENT = /\d+\s*\+?\s*(?:years?|yrs?)|degree|bachelor|master|ph\.?d|\bas an?\b|experience (?:as|in)\b/i;

/** The most positive next step the fit check allows. */
function ceilingFor(fit: FitAssessment | null, matches: RoleMatch[], coreIndex?: number): RecommendationLevel {
  if (!fit || matches.length === 0) return 'screen';
  // Not having done the job itself caps everything else, however many skills line up.
  const core = coreIndex !== undefined ? matches[coreIndex] : undefined;
  if (core?.assessment === 'gap') return 'decline';
  const bySkills = ceilingFromRead(fit, matches);
  return core?.assessment === 'relevant' && RANK[bySkills] > RANK.conditional ? 'conditional' : bySkills;
}

function ceilingFromRead(fit: FitAssessment, matches: RoleMatch[]): RecommendationLevel {
  const requiredGaps = matches.filter((m) => m.required && m.assessment === 'gap');
  const hardGap = requiredGaps.some((m) => HARD_REQUIREMENT.test(m.requirement));
  switch (fit.read) {
    case 'strong fit':
      return 'advance';
    case 'good fit with some gaps':
      return hardGap ? 'conditional' : 'advance';
    case 'partial fit: real gaps to weigh':
      return hardGap ? 'conditional' : 'screen';
    default:
      return 'decline';
  }
}

const NEXT_STEP: Record<RecommendationLevel, RegExp> = {
  advance: /^(technical (screen|interview)|move to (a )?technical)/i,
  screen: /^(recruiter |intro(ductory)? )?(phone screen|intro call|screening call)$/i,
  conditional: /^phone screen only if\b/i,
  decline: /^not a fit for this role/i,
};

function defaultRecommendation(level: RecommendationLevel, matches: RoleMatch[]): { nextStep: string; rationale: string } {
  const gaps = matches.filter((m) => m.required && m.assessment === 'gap').map((m) => m.requirement);
  const list = gaps.slice(0, 2).map((g) => `"${g}"`).join(' and ');
  switch (level) {
    case 'decline':
      return {
        nextStep: 'Not a fit for this role',
        rationale: gaps.length
          ? `The posting's core requirements, including ${list}, are not shown anywhere in his portfolio.`
          : 'Too few of the posting’s requirements are shown in his portfolio.',
      };
    case 'conditional':
      return {
        nextStep: gaps.length ? `Phone screen only if ${gaps[0]} can be relaxed` : 'Phone screen only if the gaps below can be relaxed',
        rationale: `Several requirements are met in his projects, but ${list || 'the gaps below'} ${gaps.length === 1 ? 'is' : 'are'} not.`,
      };
    case 'screen':
      return { nextStep: 'Recruiter phone screen', rationale: 'The portfolio shows relevant work, with open questions to settle in a short call.' };
    default:
      return { nextStep: 'Technical screen', rationale: 'The posting’s requirements are largely shown in his projects.' };
  }
}

/* ------------------------------------------------------------------------ */
/* Writing                                                                   */
/* ------------------------------------------------------------------------ */

interface Draft {
  candidateSummary?: { text?: string; evidenceIds?: string[] };
  reasonsToConsider?: { title?: string; explanation?: string; evidenceIds?: string[] }[];
  projects?: { projectId?: number; relevance?: string; evidence?: string[]; evidenceIds?: string[] }[];
  standoutSignal?: { title?: string; explanation?: string; evidenceIds?: string[] } | null;
  validationAreas?: string[];
  interviewQuestions?: { question?: string; rationale?: string }[];
  recommendation?: { level?: string; nextStep?: string; rationale?: string };
}

const FACTS = CAREER_FACTS;

function writerPrompt(ceiling: RecommendationLevel, hasPosting: boolean): string {
  const allowed = (Object.keys(RANK) as RecommendationLevel[]).filter((level) => RANK[level] <= RANK[ceiling]);
  return `You write a recruiter brief about a software engineer, Kyle-Anthony Hay, for a recruiter to forward to a hiring manager. You are an evaluator, not his advocate: a single overstated claim makes the whole brief worthless to them.

Rules:
- Use only the EVIDENCE items. Every candidateSummary, reason, project line and standout signal cites the ids of the items that directly support it in "evidenceIds". If nothing supports a point, leave it out.
- Never upgrade: a training-program project is not a job, a team project is not solo work, a personal-use app is not a shipped product, a planned feature is not a built one. Use numbers (users, counts, dates) only when an item states them. No percentages, scores or ratings.
- ${hasPosting ? 'Role Match is already decided by the fit check (the F items); you cannot change it. Never present a requirement marked gap as a strength, and do not call a "relevant" row a match.' : 'There is no job posting, so this is a general brief shaped by the recruiter context.'}
- Plain, specific language. No hype words (exceptional, passionate, rockstar, world-class, seasoned, expert). Name what he built and how.
${FACTS}

Write:
- candidateSummary: 2-3 sentences, specific to this role, that a hiring manager could read alone.
- reasonsToConsider: up to 3 conclusions (title under 7 words, explanation 1-2 sentences), each tied to the role. Fewer is fine when the evidence is thin.
- projects: up to 3 projects most relevant to the role by what they show, not by size. projectId is the number from PROJECTS. relevance: one sentence on why it matters for this role. evidence: 2-3 short concrete lines (technologies, architecture, responsibilities, outcomes).
- standoutSignal: the single most compelling differentiator for this role (title under 7 words, explanation 1-2 sentences), or null if nothing stands out honestly.
- validationAreas: 2-5 things to validate in an interview, phrased neutrally ("Depth of ...", "Professional tenure relative to ..."). Cover every required gap and every required requirement that is only relevant.
- interviewQuestions: 3 questions, each with a one-sentence rationale. At least one leads into his strongest evidence; at least one probes the biggest gap or open question.
- recommendation: "level" is one of ${allowed.map((l) => `"${l}"`).join(', ')} (no higher). nextStep wording by level: advance = "Technical screen"; screen = "Recruiter phone screen"; conditional = "Phone screen only if <specific condition>"; decline = "Not a fit for this role". rationale: 1-2 sentences grounded in the evidence. ${ceiling === 'decline' ? 'The portfolio does not show the job this role is built around, or too few of its requirements; say so plainly and name the main gaps.' : 'If the required gaps are in years, domain, degree or the job function itself, choose conditional or decline.'}

Return JSON: {"candidateSummary":{"text":"","evidenceIds":[]},"reasonsToConsider":[{"title":"","explanation":"","evidenceIds":[]}],"projects":[{"projectId":0,"relevance":"","evidence":[""],"evidenceIds":[]}],"standoutSignal":{"title":"","explanation":"","evidenceIds":[]},"validationAreas":[""],"interviewQuestions":[{"question":"","rationale":""}],"recommendation":{"level":"","nextStep":"","rationale":""}}`;
}

function evidenceBlock(items: EvidenceReference[]): string {
  return items
    .map((item) => `[${item.id}] ${item.projectName ? `${item.projectName} / ` : ''}${item.section ?? ''}: ${item.excerpt}`)
    .join('\n');
}

/* ------------------------------------------------------------------------ */
/* Claim check                                                               */
/* ------------------------------------------------------------------------ */

interface Claim {
  text: string;
  evidenceIds: string[];
  apply: (verdict: 'supported' | 'overstated' | 'unsupported', fixed?: string) => void;
}

/** A second model reads each claim beside only the items it cites. */
async function verifyClaims(claims: Claim[], items: EvidenceReference[]): Promise<{ rewritten: number; removed: number }> {
  if (claims.length === 0) return { rewritten: 0, removed: 0 };
  const byId = new Map(items.map((item) => [item.id, item]));
  const blocks = claims.map((claim, i) => {
    const cited = claim.evidenceIds.map((id) => byId.get(id)).filter((item): item is EvidenceReference => Boolean(item));
    return `CLAIM ${i}: ${claim.text}\n${cited.map((item) => `  [${item.id}] ${item.projectName ? `${item.projectName} / ` : ''}${item.section ?? ''}: ${item.excerpt}`).join('\n') || '  (no evidence cited)'}`;
  });

  const parsed = await askJson<{ items?: { index?: number; verdict?: string; fixed?: string }[] }>(
    `You fact-check a recruiter brief about Kyle-Anthony Hay. For each CLAIM, read only the evidence printed under it, plus these facts:
${FACTS}
Verdicts:
- "supported": everything the claim says about him is stated in its evidence.
- "overstated": the core is supported but it upgrades something (solo vs team, built vs planned, a number, a technology, scope, "production" or "at scale", employment). Give "fixed": the same point rewritten to say only what the evidence supports, no longer than the original.
- "unsupported": the evidence does not support it. Give "fixed" only if a smaller true version of the point exists in the evidence.
"fixed" is the same point with the unsupported part removed, in the same form and voice as the claim: a positive statement of what he did, never a note about missing evidence or who else did what. If nothing true remains, omit "fixed".
On OnTract and Sentio+ (team projects) a technology or feature counts as his only when the evidence attributes it to him or to his solo rebuild; a "Tech stack" or "Skills demonstrated" list, or the team's architecture, is not attribution.
Role match lines: judge the whole requirement, not the "Basis" alone. "Fully met" needs evidence for every part of it (a line showing SQL and Python but not dbt or a warehouse is overstated; years of use is not the same as doing that work). Working on a developer team is not partnering with finance, product or GTM leadership; building a tool for a business user is not answering executives' questions. Each named project must show it as his work.
Interview questions are claims only in what they presuppose about his work. Recommendations and validation notes may state gaps; judge only what they say he has done. Be strict.
JSON: {"items":[{"index":0,"verdict":"supported|overstated|unsupported","fixed":"..."}]}`,
    blocks.join('\n\n'),
    0
  );

  let rewritten = 0;
  let removed = 0;
  claims.forEach((claim, i) => {
    const item = parsed.items?.find((candidate) => candidate.index === i);
    const verdict = item?.verdict === 'overstated' || item?.verdict === 'unsupported' ? item.verdict : 'supported';
    // A "fix" that only says what isn't there is a removal.
    const raw = item?.fixed?.trim();
    const fixed = raw && !/^(no evidence|there is no|nothing|not (shown|supported|stated)|the evidence does not)/i.test(raw) ? raw : undefined;
    if (verdict === 'overstated' && fixed) rewritten += 1;
    if (verdict === 'unsupported') {
      if (fixed) rewritten += 1;
      else removed += 1;
    }
    claim.apply(verdict, fixed);
  });
  return { rewritten, removed };
}

const BANNED = /\d+(?:\.\d+)?\s*%|\bpercent\b/i;

function clean(text: string | undefined): string {
  if (!text) return '';
  return scrub(text)
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !BANNED.test(sentence))
    .join(' ')
    .trim();
}

/* ------------------------------------------------------------------------ */
/* Role match audit                                                          */
/* ------------------------------------------------------------------------ */

function readFor(matches: RoleMatch[]): FitAssessment['read'] {
  const strong = matches.filter((m) => m.assessment === 'strong').length;
  const relevant = matches.filter((m) => m.assessment === 'relevant').length;
  const gap = matches.length - strong - relevant;
  const score = (strong + relevant * 0.5) / Math.max(1, matches.length);
  return score >= 0.85 && gap === 0 ? 'strong fit' : score >= 0.65 ? 'good fit with some gaps' : score >= 0.4 ? 'partial fit: real gaps to weigh' : 'weak fit for this role';
}

/**
 * The fit check names every project a keyword appears in, team work
 * included, and counts years of using a language as doing the work. A second
 * read against the write-ups (with who-did-what) settles each row. Rows can
 * only stay or move down.
 */
async function auditRoleMatches(matches: RoleMatch[], items: EvidenceReference[]): Promise<void> {
  // Rows about years of using a named technology are settled by his start year, which the excerpts can't show.
  const yearsOfTech = (requirement: string) => /\d+\s*\+?\s*(?:(?:-|–|—|to)\s*\d+\s*)?(?:years?|yrs?)/i.test(requirement) && !/\b(professional|industry|as an?)\b/i.test(requirement);
  const rows = matches.map((match, i) => ({ match, i })).filter(({ match }) => match.assessment !== 'gap' && !yearsOfTech(match.requirement));
  if (rows.length === 0) return;
  const background = items.filter((item) => item.id.startsWith('B') || item.kind === 'profile');
  const blocks = rows.map(({ match }, k) => {
    const sections = items
      .filter((item) => item.projectId && match.projectIds.includes(item.projectId) && item.kind === 'section')
      .sort((a, b) => Number(/role|who built/i.test(b.section ?? '')) - Number(/role|who built/i.test(a.section ?? '')))
      .slice(0, 8);
    return `ROW ${k}: "${match.requirement}"\nFit check said: ${match.assessment === 'strong' ? 'met' : 'partly met'} — ${match.evidence}\nProjects named: ${match.projectIds.map((id) => projectById(id)?.title).join(', ') || 'none'}\n${sections.map((item) => `  [${item.id}] ${item.projectName} / ${item.section}: ${item.excerpt}`).join('\n')}`;
  });
  const parsed = await askJson<{ rows?: { index?: number; met?: string; projects?: string[]; basis?: string }[] }>(
    `You audit a job-fit check for Kyle-Anthony Hay the way a skeptical hiring manager would. For each ROW decide from its excerpts and the BACKGROUND only:
- "met": "full" when the excerpts show him doing every part of the requirement; "partial" when they show some of it or adjacent work; "none" when they show nothing he did.
- "projects": the named projects that show it as HIS work. On team projects (OnTract, Sentio+) count only what the excerpts attribute to him or to his solo rebuild; a tech-stack or skills list, or what teammates built, does not count.
- "basis": under 22 words, a positive statement of what he did that supports the row (no notes about missing evidence; empty if "none").
Strictness: years since he started using a language are not experience doing the job; working on a developer team is not partnering with business leadership; building a tool for business users is not doing their analysis; a requirement with several parts (e.g. "SQL, Python, dbt and a cloud warehouse", "data visualization and BI tooling") is "full" only if every part is shown, and custom charts in a web app are not BI tooling; a requirement naming a product domain or quality ("AI-powered financial products") is "full" only if one project has all of it, not pieces spread across projects. A requirement naming specific tools (Redshift, Snowflake, dbt, Looker, Kubernetes) is fully met only when those tools, or ones the posting calls equivalent, are shown; general SQL in app migrations is partial for a data-warehouse SQL requirement. Analytics engineering means building analytics data models and pipelines, not keeping an app codebase tested. Partnering with finance teams means working with a finance function; building a payout tool for his own app is partial at most. Schema work or migrations are not assessing database reliability or troubleshooting production databases. Business terms keep their business meaning: a payout ledger or subscription tracking is not revenue or growth analytics, owning his own app is not running an executive review, embeddings are not a metrics layer. Personal traits and ways of working (curiosity, juggling work streams, thriving in ambiguity) are "partial" at most unless an excerpt describes exactly that.
${FACTS}
JSON: {"rows":[{"index":0,"met":"full|partial|none","projects":["..."],"basis":"..."}]}`,
    `BACKGROUND:\n${background.map((item) => `[${item.id}] ${item.section}: ${item.excerpt}`).join('\n')}\n\n${blocks.join('\n\n')}`,
    0
  );
  const cap: Record<string, MatchLevel> = { full: 'strong', partial: 'relevant', none: 'gap' };
  const order: MatchLevel[] = ['gap', 'relevant', 'strong'];
  rows.forEach(({ match }, k) => {
    const row = parsed.rows?.find((candidate) => candidate.index === k);
    if (!row) return;
    const level = cap[row.met ?? ''] ?? match.assessment;
    if (order.indexOf(level) < order.indexOf(match.assessment)) match.assessment = level;
    const keep = new Set((row.projects ?? []).map((name) => findProjectByName(name)?.id).filter((id): id is number => typeof id === 'number'));
    match.projectIds = match.projectIds.filter((id) => keep.has(id));
    const basis = clean(row.basis);
    if (match.assessment === 'gap') {
      match.evidence = 'Not shown in the portfolio.';
      match.projectIds = [];
    } else if (basis && !/^(no |there is no|nothing|not )/i.test(basis)) {
      match.evidence = basis;
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Entry point                                                               */
/* ------------------------------------------------------------------------ */

export interface FitInput {
  jobDescription?: string;
  roleTitle?: string;
  companyName?: string;
  recruiterContext?: string;
  /** A requirement list with no posting (typed by the visitor, or rows already shown). */
  knownRequirements?: string[];
}

/** One fit evaluation: what the chat's fit card shows and what a brief made from it builds on. */
export interface FitEvaluation {
  roleTitle?: string;
  companyName?: string;
  requirements: { text: string; required: boolean }[];
  coreIndex?: number;
  logistics: string[];
  fit: FitAssessment | null;
  evidence: EvidenceSet;
  roleMatches: RoleMatch[];
  read?: FitAssessment['read'];
  ceiling: RecommendationLevel;
  broadQuery: string;
}

/**
 * The whole fit pipeline, shared by the chat's assess_job_fit and the brief so
 * they can never disagree: requirements from the posting (with the job itself
 * as the first row), the evidence check, the skeptical audit, and the bound on
 * how positive the recommendation may be.
 */
/** Recent evaluations by posting, so asking twice about one posting gives one answer. */
const evaluationCache = new Map<string, { at: number; result: Promise<FitEvaluation> }>();
const EVALUATION_TTL = 60 * 60 * 1000;

export function evaluateFit(input: FitInput): Promise<FitEvaluation> {
  const key = JSON.stringify([input.jobDescription?.trim() ?? '', input.knownRequirements ?? [], input.recruiterContext ?? '']);
  const hit = evaluationCache.get(key);
  if (hit && Date.now() - hit.at < EVALUATION_TTL) return hit.result;
  const result = evaluateFitOnce(input);
  evaluationCache.set(key, { at: Date.now(), result });
  result.catch(() => evaluationCache.delete(key));
  if (evaluationCache.size > 200) evaluationCache.delete(evaluationCache.keys().next().value!);
  return result;
}

async function evaluateFitOnce(input: FitInput): Promise<FitEvaluation> {
  const jobDescription = input.jobDescription?.trim() || undefined;

  // 1. Requirements: the ones the chat's fit check used when there was one,
  //    otherwise extracted from the posting with the same rules.
  let roleTitle = input.roleTitle?.trim() || undefined;
  let companyName = input.companyName?.trim() || undefined;
  let requirements: { text: string; required: boolean }[] = [];
  let coreIndex: number | undefined;
  let logistics: string[] = [];
  if (jobDescription) {
    const extracted = await extractRequirements(jobDescription);
    roleTitle ||= extracted.roleTitle;
    companyName ||= extracted.companyName;
    requirements = extracted.requirements;
    coreIndex = extracted.coreIndex;
    logistics = extracted.logistics;
    // After a fit check in the same chat, judge the same rows it showed, plus the job itself.
    if (input.knownRequirements?.length) {
      const core = coreIndex !== undefined ? [requirements[coreIndex]] : [];
      requirements = [...core, ...input.knownRequirements.map((text) => ({ text, required: true }))];
      coreIndex = core.length ? 0 : undefined;
    }
  }
  if (requirements.length === 0 && input.knownRequirements?.length) {
    requirements = input.knownRequirements.map((text) => ({ text, required: true }));
  }

  // 2. Fit check and retrieval run side by side.
  const broadQuery = [roleTitle, companyName, input.recruiterContext, jobDescription?.slice(0, 800)].filter(Boolean).join('. ') || 'software engineer, AI products, full-stack and iOS';
  const fitPromise = requirements.length > 0 ? assessRequirements(requirements.map((r) => r.text)) : Promise.resolve(null);
  const fit = await fitPromise;
  const evidence = await buildEvidence(
    requirements.length > 0 ? requirements.map((r) => r.text) : [broadQuery],
    broadQuery,
    fit
  );

  const roleMatches: RoleMatch[] =
    fit?.requirements.map((row, i) => ({
      requirement: row.requirement,
      assessment: LEVEL[row.status],
      evidence: clean(row.evidence) || (row.status === 'gap' ? 'Not shown in the portfolio.' : row.evidence),
      required: requirements[i]?.required ?? true,
      core: i === coreIndex || undefined,
      projectIds: row.projects.map((p) => p.id),
    })) ?? [];
  let read = fit?.read;
  if (fit) {
    try {
      await auditRoleMatches(roleMatches, evidence.items);
    } catch (error) {
      console.error('recruiter brief: role match audit failed', error);
    }
    read = readFor(roleMatches);
    // Not having done the job itself caps the read, as it caps the recommendation.
    const coreRow = coreIndex !== undefined ? roleMatches[coreIndex] : undefined;
    if (coreRow?.assessment === 'gap' && (read === 'strong fit' || read === 'good fit with some gaps')) read = 'partial fit: real gaps to weigh';
    // The writer and the claim check see the audited rows, not the raw fit check.
    roleMatches.forEach((match, i) => {
      const item = evidence.items.find((candidate) => candidate.id === evidence.fitIds.get(i));
      if (item) item.excerpt = `Requirement "${match.requirement}": ${match.assessment}${match.required ? '' : ' (nice-to-have)'}. ${match.evidence}${match.projectIds.length ? ` Projects: ${match.projectIds.map((id) => projectById(id)?.title).join(', ')}.` : ''}`;
    });
  }
  const ceiling = ceilingFor(fit && read ? { ...fit, read } : null, roleMatches, coreIndex);

  return { roleTitle, companyName, requirements, coreIndex, logistics, fit, evidence, roleMatches, read, ceiling, broadQuery };
}

/** How the chat's fit card reads the brief's levels. */
export const STATUS_FOR: Record<MatchLevel, FitStatus> = { strong: 'match', relevant: 'related', gap: 'gap' };

/** The recommendation level in plain words, for the chat answer. */
export function describeCeiling(evaluation: FitEvaluation): string {
  return defaultRecommendation(evaluation.ceiling, evaluation.roleMatches).nextStep;
}

export interface BriefInput {
  jobDescription?: string;
  roleTitle?: string;
  companyName?: string;
  recruiterContext?: string;
  /** Requirements from a fit check already shown in this chat, so the brief agrees with it. */
  knownRequirements?: string[];
  /** The chat's own fit evaluation for this posting, reused as-is. */
  evaluation?: FitEvaluation;
}

export async function generateRecruiterBrief(input: BriefInput): Promise<StoredBrief> {
  const jobDescription = input.jobDescription?.trim() || undefined;

  // 1-2. Requirements, fit check, audit and bounds: reused from the chat's fit check when there was one.
  const evaluation = input.evaluation ?? (await evaluateFit({ ...input, jobDescription }));
  const { roleTitle, companyName, fit, evidence, roleMatches, read, ceiling, logistics } = evaluation;
  void logistics;

  // 3. Write.
  const projectList = catalog.map((p) => `${p.id}: ${p.title} (${p.category}) — ${p.tagline}`).join('\n');
  const draft = await askJson<Draft>(
    writerPrompt(ceiling, Boolean(fit)),
    [
      `ROLE: ${roleTitle ?? 'not stated'}${companyName ? ` at ${companyName}` : ''}`,
      input.recruiterContext ? `RECRUITER CONTEXT: ${input.recruiterContext}` : '',
      jobDescription ? `POSTING:\n${jobDescription.slice(0, 6000)}` : '',
      fit ? `FIT CHECK (overall read: ${read}; recommendation may go no higher than "${ceiling}")` : '',
      `PROJECTS:\n${projectList}`,
      `EVIDENCE:\n${evidenceBlock(evidence.items)}`,
    ]
      .filter(Boolean)
      .join('\n\n')
  );

  // 4. Keep only citations that exist; a claim citing nothing is dropped.
  const known = new Set(evidence.items.map((item) => item.id));
  const ids = (list?: string[]) => (list ?? []).filter((id) => typeof id === 'string' && known.has(id));
  const evidenceProjects = new Set(evidence.items.map((item) => item.projectId).filter(Boolean));

  const brief: RecruiterBrief = {
    candidateSummary: clean(draft.candidateSummary?.text),
    roleMatches,
    reasonsToConsider: (draft.reasonsToConsider ?? [])
      .map((r) => ({ title: clean(r.title), explanation: clean(r.explanation), evidenceIds: ids(r.evidenceIds) }))
      .filter((r) => r.title && r.explanation && r.evidenceIds.length > 0)
      .slice(0, 3),
    projects: (draft.projects ?? [])
      .filter((p) => typeof p.projectId === 'number' && projectById(p.projectId) && evidenceProjects.has(p.projectId))
      .map((p) => ({
        projectId: p.projectId!,
        relevance: clean(p.relevance),
        evidence: (p.evidence ?? []).map(clean).filter(Boolean).slice(0, 3),
        evidenceIds: ids(p.evidenceIds),
      }))
      .filter((p, i, all) => p.relevance && p.evidenceIds.length > 0 && all.findIndex((q) => q.projectId === p.projectId) === i)
      .slice(0, 3),
    standoutSignal:
      draft.standoutSignal?.title && draft.standoutSignal.explanation && ids(draft.standoutSignal.evidenceIds).length > 0
        ? { title: clean(draft.standoutSignal.title), explanation: clean(draft.standoutSignal.explanation), evidenceIds: ids(draft.standoutSignal.evidenceIds) }
        : null,
    validationAreas: (draft.validationAreas ?? []).map(clean).filter(Boolean).slice(0, 5),
    interviewQuestions: (draft.interviewQuestions ?? [])
      .map((q) => ({ question: clean(q.question), rationale: clean(q.rationale) }))
      .filter((q) => q.question)
      .slice(0, 3),
    recommendation: { level: 'screen', nextStep: '', rationale: '' },
    overallRead: read,
  };
  const summaryIds = ids(draft.candidateSummary?.evidenceIds);

  // 5. Recommendation within the fit check's bounds.
  const asked = (['advance', 'screen', 'conditional', 'decline'] as RecommendationLevel[]).find((l) => l === draft.recommendation?.level);
  const level: RecommendationLevel = asked && RANK[asked] <= RANK[ceiling] ? asked : ceiling;
  const nextStep = clean(draft.recommendation?.nextStep);
  const rationale = clean(draft.recommendation?.rationale);
  brief.recommendation =
    level === asked && NEXT_STEP[level].test(nextStep) && rationale
      ? { level, nextStep, rationale }
      : { level, ...defaultRecommendation(level, roleMatches) };

  // 6. Check every claim against what it cites.
  // Who-did-what evidence for a project, so team work can't be credited to him.
  const roleEvidence = (projectId: number) =>
    evidence.items
      .filter((item) => item.projectId === projectId && (item.id.startsWith('R') || /role/i.test(item.section ?? '')))
      .map((item) => item.id);

  const fitEvidence = [...evidence.fitIds.values()];
  const claims: Claim[] = [];
  if (brief.candidateSummary) {
    claims.push({
      text: brief.candidateSummary,
      evidenceIds: summaryIds.length ? summaryIds : fitEvidence,
      apply: (verdict, fixed) => {
        if (verdict !== 'supported') brief.candidateSummary = fixed ?? '';
      },
    });
  }
  brief.reasonsToConsider.forEach((reason) =>
    claims.push({
      text: `${reason.title}: ${reason.explanation}`,
      evidenceIds: reason.evidenceIds,
      apply: (verdict, fixed) => {
        if (verdict === 'supported') return;
        if (fixed) reason.explanation = fixed.replace(new RegExp(`^${reason.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`), '');
        else reason.title = '';
      },
    })
  );
  brief.projects.forEach((project) => {
    const title = projectById(project.projectId)!.title;
    project.evidenceIds = [...new Set([...project.evidenceIds, ...roleEvidence(project.projectId)])];
    claims.push({
      text: `${title} — why it matters: ${project.relevance}`,
      evidenceIds: project.evidenceIds,
      apply: (verdict, fixed) => {
        if (verdict !== 'supported') project.relevance = fixed ?? '';
      },
    });
    project.evidence.forEach((line, j) =>
      claims.push({
        text: `${title}: ${line}`,
        evidenceIds: project.evidenceIds,
        apply: (verdict, fixed) => {
          if (verdict !== 'supported') project.evidence[j] = fixed?.replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*`), '') ?? '';
        },
      })
    );
  });
  const standout = brief.standoutSignal;
  if (standout) {
    claims.push({
      text: `${standout.title}: ${standout.explanation}`,
      evidenceIds: standout.evidenceIds,
      apply: (verdict, fixed) => {
        if (verdict === 'supported') return;
        if (fixed) standout.explanation = fixed;
        else brief.standoutSignal = null;
      },
    });
  }
  const allIds = evidence.items.map((item) => item.id);
  brief.interviewQuestions.forEach((question) =>
    claims.push({
      text: `Interview question: ${question.question}`,
      evidenceIds: allIds.filter((id) => !id.startsWith('P4')).slice(0, 40),
      apply: (verdict, fixed) => {
        // A rewrite has to still be a question; otherwise the question goes.
        if (verdict !== 'supported') question.question = fixed && /\?["”]?$/.test(fixed.trim()) ? fixed.replace(/^Interview question:\s*/, '') : '';
      },
    })
  );
  claims.push({
    text: `Recommendation rationale: ${brief.recommendation.rationale}`,
    evidenceIds: [...fitEvidence, ...summaryIds],
    apply: (verdict, fixed) => {
      if (verdict !== 'supported') brief.recommendation.rationale = fixed ?? defaultRecommendation(brief.recommendation.level, roleMatches).rationale;
    },
  });

  let verification = { rewritten: 0, removed: 0 };
  try {
    verification = await verifyClaims(claims, evidence.items);
  } catch (error) {
    // Unchecked claims are not shipped: fall back to the parts the fit check decided.
    console.error('recruiter brief: claim check failed', error);
    brief.reasonsToConsider = [];
    brief.projects = [];
    brief.standoutSignal = null;
    brief.interviewQuestions = [];
    brief.candidateSummary = '';
    brief.recommendation = { level: brief.recommendation.level, ...defaultRecommendation(brief.recommendation.level, roleMatches) };
  }

  brief.reasonsToConsider = brief.reasonsToConsider.filter((r) => r.title && r.explanation);
  brief.projects = brief.projects
    .map((p) => ({ ...p, evidence: p.evidence.map(clean).filter(Boolean) }))
    .filter((p) => p.relevance && p.evidence.length > 0);
  brief.interviewQuestions = brief.interviewQuestions.filter((q) => q.question);
  brief.candidateSummary = clean(brief.candidateSummary);
  if (!brief.candidateSummary) {
    const strong = roleMatches.filter((m) => m.assessment === 'strong').map((m) => m.requirement);
    brief.candidateSummary = strong.length
      ? `Software developer whose portfolio shows ${strong.slice(0, 3).join(', ')}. See the role match below for what it does and does not show.`
      : 'Software developer building AI-powered web and iOS products. See the role match below for what the portfolio does and does not show.';
  }

  // Every required gap gets a line in Validate, in case the writer skipped one.
  const significant = (text: string) => text.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 3);
  for (const match of roleMatches.filter((m) => m.required && m.assessment === 'gap')) {
    const words = significant(match.requirement);
    const covered = brief.validationAreas.some((area) => words.filter((word) => area.toLowerCase().includes(word)).length >= Math.min(2, words.length));
    if (!covered && brief.validationAreas.length < 6) brief.validationAreas.push(`${match.requirement}: not shown in the portfolio.`);
  }

  // The portfolio can't answer logistics; say so rather than guess.
  for (const item of logistics) {
    if (brief.validationAreas.length >= 7) break;
    const label = item.replace(/\.$/, '');
    brief.validationAreas.push(
      /new york|nyc|brooklyn/i.test(item)
        ? `${label}: he is based in ${profile.location} and open to hybrid or on-site roles.`
        : /remote|telecommute/i.test(item) && !/office|on-?site|hybrid/i.test(item)
          ? `${label}: his portfolio lists hybrid and on-site roles; ask whether remote suits him.`
          : `${label}: he is based in ${profile.location} and open to hybrid or on-site roles; relocation is not stated, so ask him.`
    );
  }

  const record: StoredBrief = {
    publicId: newPublicId(),
    createdAt: Date.now(),
    roleTitle,
    companyName,
    jobDescription,
    generatedBrief: { ...brief, verification: { checked: claims.length, ...verification } },
    evidenceReferences: evidence.items,
    version: BRIEF_VERSION,
  };
  await saveBrief(record);
  return record;
}
