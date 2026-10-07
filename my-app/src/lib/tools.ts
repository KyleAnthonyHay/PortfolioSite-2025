import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import fs from 'fs/promises';
import path from 'path';
import { getPersonalInfoDocument } from './content-store';
import { projects as projectCards } from './projects';
import { isEmailConfigured } from './email';
import { CAREER_FACTS, GPA, HIRING_DETAILS, WORK_ARRANGEMENT, WORK_EVIDENCE, workArrangement } from './facts';
import { getKnowledgeSections, getProjectResources, getProjectSections, searchKnowledge, type KnowledgeHit } from './knowledge';
import {
  catalog,
  findProjectByName,
  projectById,
  projectStackText,
  toCard,
  type CatalogProject,
} from './project-catalog';
import {
  contactLinks,
  findSkill,
  journey,
  findSkillsInText,
  profile,
  relatedStrengthsFor,
  timeline,
  toSkillGroups,
  type SkillMatch,
} from './profile';
import type { EvidenceProject, FitRequirement, FitStatus, ProjectResource, Recommendation, Widget } from './chat-events';

/**
 * Every tool returns this shape, serialised. `content` is what the model
 * reads; `widget` is what the visitor sees; `citedProjectIds` feed the source
 * pills under the answer.
 */
export interface ToolResult {
  content: string;
  citedProjectIds: number[];
  widget?: Widget;
}

function pack(result: ToolResult): string {
  return JSON.stringify(result);
}

export function parseToolResult(raw: unknown): ToolResult {
  if (typeof raw !== 'string') return { content: JSON.stringify(raw), citedProjectIds: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<ToolResult>;
    return {
      content: parsed.content ?? raw,
      citedProjectIds: parsed.citedProjectIds ?? [],
      widget: parsed.widget,
    };
  } catch {
    return { content: raw, citedProjectIds: [] };
  }
}

/* ------------------------------------------------------------------------ */
/* Evidence engine                                                           */
/* ------------------------------------------------------------------------ */

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word match: "Java" must not light up on "JavaScript". */
function termPattern(term: string): RegExp {
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(term.toLowerCase())}(?=[^a-z0-9]|$)`, 'i');
}

function variantsFor(term: string, skill: SkillMatch | null): string[] {
  const variants = new Set<string>([term.trim()]);
  if (skill) {
    variants.add(skill.skill.name);
    skill.skill.aliases?.forEach((alias) => variants.add(alias));
  }
  return [...variants].filter((value) => value.length >= 2);
}

/**
 * Aliases too generic to stand for a skill inside a requirement: "APIs" is not
 * REST, "real-time" is not WebSockets, "next" is not Next.js.
 */
const LOOSE_ALIASES = new Set(['api', 'apis', 'rest', 'real-time', 'realtime', 'real time', 'next', 'payments', 'payment', 'claude', 'anthropic', 'motion', 'containers', 'container', 'subscriptions', 'in-app purchases', 'in app purchases', 'ai', 'ml']);

function safeVariants(match: SkillMatch): string[] {
  return [match.skill.name, ...(match.skill.aliases ?? [])].filter((name) => name.length >= 2 && !LOOSE_ALIASES.has(name.toLowerCase()));
}

function containsAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function snippetAround(text: string, patterns: RegExp[], radius = 160): string {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match) {
      // Widen to the nearest sentence or bullet boundaries so the excerpt reads whole.
      const boundary = /[.!?]\s|\n\s*[-*•]\s|\n{2,}/g;
      let start = Math.max(0, match.index - radius);
      let end = Math.min(text.length, match.index + match[0].length + radius);
      let cursor: RegExpExecArray | null;
      boundary.lastIndex = 0;
      while ((cursor = boundary.exec(text)) !== null) {
        const at = cursor.index + cursor[0].length;
        if (at <= match.index && at > start) start = at;
        if (cursor.index >= match.index + match[0].length && cursor.index < end) {
          end = cursor.index + (cursor[0].startsWith('\n') ? 0 : 1);
          break;
        }
      }
      const raw = text.slice(start, end).replace(/\s+/g, ' ').trim();
      return `${start > 0 && !/^[A-Z]/.test(raw) ? '…' : ''}${raw}${end < text.length && !/[.!?]$/.test(raw) ? '…' : ''}`;
    }
  }
  return text.slice(0, radius * 2).replace(/\s+/g, ' ').trim();
}

interface Evidence {
  term: string;
  displayName: string;
  skill: SkillMatch | null;
  since?: number;
  years?: number;
  projects: EvidenceProject[];
  backgroundSnippets: string[];
  related: string[];
  hasExperience: boolean;
  /** True when a listed skill or a project's stack names it; false when only prose mentions it. */
  strong: boolean;
}

function stackUsage(project: CatalogProject, patterns: RegExp[]): string | null {
  const groups: [string, string[] | undefined][] = [
    ['Frontend', project.techStack.frontend],
    ['Backend', project.techStack.backend],
    ['Infrastructure', project.techStack.infrastructure],
  ];
  const hits: string[] = [];
  for (const [label, items] of groups) {
    const matched = (items ?? []).filter((item) => containsAny(item, patterns));
    if (matched.length > 0) hits.push(`${label}: ${matched.slice(0, 3).join(', ')}`);
  }
  return hits.length > 0 ? hits.join(' · ') : null;
}

async function gatherEvidence(term: string): Promise<Evidence> {
  const skill = findSkill(term);
  const variants = variantsFor(term, skill);
  const patterns = variants.map(termPattern);
  const currentYear = new Date().getFullYear();

  const projects: EvidenceProject[] = [];
  const seen = new Set<number>();
  let stackHits = 0;

  for (const project of catalog) {
    const usage = stackUsage(project, patterns);
    if (usage) {
      projects.push({ project: toCard(project), usage });
      seen.add(project.id);
      stackHits += 1;
      continue;
    }
    const prose = `${project.overview} ${project.description}`;
    if (containsAny(prose, patterns) || projectStackText(project).some((item) => containsAny(item, patterns))) {
      projects.push({ project: toCard(project), usage: snippetAround(project.overview, patterns, 90) });
      seen.add(project.id);
    }
  }

  const [sections, personalInfo] = await Promise.all([getKnowledgeSections(), getPersonalInfoDocument()]);

  for (const section of sections) {
    const project = projectById(section.projectId);
    if (!project || seen.has(project.id)) continue;
    const listed = section.technologies.some((tech) => containsAny(tech, patterns));
    if (listed || containsAny(section.text, patterns)) {
      projects.push({ project: toCard(project), usage: snippetAround(section.text, patterns, 110) });
      seen.add(project.id);
      if (listed) stackHits += 1;
    }
  }

  const backgroundSnippets =
    personalInfo?.chunks
      .filter((chunk) => containsAny(chunk.content, patterns))
      .slice(0, 2)
      .map((chunk) => snippetAround(chunk.content, patterns, 140)) ?? [];

  const since = skill?.skill.since;
  const hasExperience = Boolean(skill) || projects.length > 0 || backgroundSnippets.length > 0;

  return {
    term,
    displayName: skill?.skill.name ?? term.trim(),
    skill,
    since,
    years: since ? Math.max(1, currentYear - since) : undefined,
    projects,
    backgroundSnippets,
    related: hasExperience ? [] : relatedStrengthsFor(term),
    hasExperience,
    strong: Boolean(skill) || stackHits > 0,
  };
}

/* ------------------------------------------------------------------------ */
/* Semantic evidence                                                         */
/* ------------------------------------------------------------------------ */

/**
 * Dense similarity alone can't tell "deep learning" (real evidence in
 * Sentio+) from "Kubernetes" (none): both score ~0.22. So retrieval finds
 * candidate sections and a small model judges them, citing only what the
 * excerpts say.
 */
export type Verdict = 'direct' | 'related' | 'none';

export interface JudgedItem {
  verdict: Verdict;
  projects: { id: number; why: string; section: string }[];
  /** In a fit check, work with no write-up (Cognizant, the internship) that supports the item. */
  work?: { where: string; text: string }[];
}

let judgeModel: ChatOpenAI | null = null;
let fitJudgeModel: ChatOpenAI | null = null;
function getJudge(mode: 'evidence' | 'fit' = 'evidence'): ChatOpenAI {
  // Fit checks are what recruiters act on, and the small model kept counting
  // adjacent work as a match, so they get the larger model.
  if (mode === 'fit') {
    // A fixed seed so the same posting gets the same rows run to run.
    fitJudgeModel ??= new ChatOpenAI({ model: process.env.OPENAI_FIT_JUDGE_MODEL ?? 'gpt-4.1', temperature: 0, modelKwargs: { seed: 7 } });
    return fitJudgeModel;
  }
  judgeModel ??= new ChatOpenAI({ model: process.env.OPENAI_JUDGE_MODEL ?? 'gpt-4.1-mini', temperature: 0, modelKwargs: { seed: 7 } });
  return judgeModel;
}

function excerpt(hit: KnowledgeHit): string {
  const text = hit.text.replace(/\s+/g, ' ').trim();
  // Whole sections: the decisive line (an outcome, a stakeholder) is often the last one.
  return text.length > 2400 ? `${text.slice(0, 2400)}…` : text;
}

function sourceLabel(source: 'résumé' | 'his account'): string {
  return source === 'résumé' ? 'from his résumé' : 'in his own words, not yet on his résumé';
}

/** Search or judge calls that failed and were read as "no evidence"; a fit made during one is not saved. */
export let judgeFailures = 0;

/** Retrieves candidate sections for each question and judges them in one model call. */
/**
 * Extra rules when the items are job requirements: a recruiter reads "match"
 * as "has done this job", so building software near a domain is not enough.
 */
const FIT_RUBRIC = `
These ITEMs are requirements from a job posting. Judge them the way a hiring manager would:
- "direct" only when an excerpt shows Kyle-Anthony doing that exact kind of work.
- Building software for a domain is not experience as a practitioner in it: a billing ledger or payout tool is not finance or accounting experience; a dashboard is not data science or analytics experience.
- A requirement that names a profession or job function (data scientist, analyst, designer, product manager, sales, finance) is "direct" only if the excerpts show him working in that function; otherwise "related" at most.
- Analytical methods (forecasting, statistical modeling, experimentation or A/B testing, causal inference, pricing analysis) need an excerpt showing him doing that analysis, not building a feature next to it.
- Examples: "finance fluency" is not met by building a payments ledger; "pricing experimentation" is not met by building subscription tiers; "revenue forecasting" is not met by tracking subscriptions. Those are "related".
- Infrastructure and SRE work (large-scale distributed systems, incident response, on-call, database reliability at scale, container orchestration) needs an excerpt showing him operating production infrastructure at that scale; apps with a few hundred users, demo datasets or multi-tenant isolation do not qualify.
- Calling LLM APIs or building agents is not training or deploying ML models; a training-program project is not production.
- Business and analytics terms keep their business meaning: owning his own app is not running an executive business review; embeddings or vector search are not a semantic or metrics layer; a payout ledger is not finance or revenue analytics; custom charts are not BI tooling.
- Personal traits and ways of working (curiosity, juggling work streams, communication, thriving in ambiguity) are "related" at most unless an excerpt describes exactly that.
- For each project also give "same_context": true only if the excerpt shows the work in the setting the requirement means (analytics work in an analytics or finance function, executive work with executives, infrastructure at production scale, a technology used by him). A project with same_context false can support "related", never "direct".
- A requirement naming specific tools (Redshift, Snowflake, dbt, Looker, Kubernetes) is fully met only when those tools, or ones the posting calls equivalent, are shown; general SQL in app migrations is partial for a data-warehouse SQL requirement. Analytics engineering means building analytics data models and pipelines, not keeping an app codebase tested. Partnering with finance teams means working with a finance function; building a payout tool for his own app is partial at most.
- Schema design or migrations are not database reliability work or troubleshooting production databases.
- Production means shipped to real users: a live App Store app or a deployed web app with users. SelahNote is production Swift and production iOS; count it as such whenever a row asks for production apps in Swift or iOS.
- "Work history" excerpts are his jobs, which have no project write-up; cite them with their ref (e.g. "0.w1") under the same rules. A sentence about what his team does supports "related"; "direct" needs a sentence saying he did it himself.
- Mentoring a friend outside work is "related" at most for mentoring, coaching or leading engineers or a team at work; it is never team leadership.
- When unsure between two verdicts, choose the lower one.
${CAREER_FACTS}`;

/** Team projects, where a write-up's stack lists describe the team's system rather than his part. */
const TEAM_PROJECT_IDS = new Set([5, 6]);
const ATTRIBUTION = /\b(kyle|he|his|him|himself|solo|alone|rebuil\w*|redesign\w*)\b/i;
const REJECTED = /chosen over|instead of|rather than|alternatives?\b|\bvs\.?\b|versus|would (make|have|need)|teammates?|the team built|was not (used|wired)|never (wired|deployed|shipped)/i;

function rank(section: { projectId: number; section: string }): number {
  if (!TEAM_PROJECT_IDS.has(section.projectId)) return 0;
  return /role/i.test(section.section) ? 1 : 2;
}

function normalizeQuote(text: string): string {
  return text.toLowerCase().replace(/[“”"‘’'`*_]/g, '').replace(/[–—]/g, '-').replace(/(^|\s)[-•]\s+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** The quote is in the excerpt: every piece between ellipses, and at least one long enough to mean something. */
function quoteFound(quote: string, source: string): boolean {
  const haystack = normalizeQuote(source);
  const pieces = normalizeQuote(quote)
    .split(/…|\.\.\./)
    .map((piece) => piece.replace(/^[\s\-:;,.]+|[\s\-:;,.]+$/g, ''))
    .filter((piece) => piece.length >= 12);
  return pieces.some((piece) => piece.length >= 20) && pieces.every((piece) => haystack.includes(piece));
}

/**
 * Retrieves candidate sections for each question and judges them in one
 * model call. Every project the judge cites must come with a sentence copied
 * from its excerpt, and that sentence is checked here: it has to be in the
 * excerpt, name the technology when the question is about one, not describe
 * an alternative he passed on, and on team projects say it was his work.
 */
async function judgeEvidence(
  questions: string[],
  perQuestion = 6,
  mode: 'evidence' | 'fit' = 'evidence',
  mustMention: (RegExp[] | null)[] = [],
  /** Terms whose sections are fetched by keyword without the quote having to name them (kinds of work). */
  alsoFetch: (RegExp[] | null)[] = []
): Promise<JudgedItem[]> {
  // A long batch makes the judge skip items, and a skipped item would read as
  // a gap, so rows are judged three at a time.
  const size = 3;
  const chunks: number[][] = [];
  for (let start = 0; start < questions.length; start += size) chunks.push(questions.slice(start, start + size).map((_, k) => start + k));
  const judged = await Promise.all(
    chunks.map((indexes) =>
      judgeChunk(indexes.map((i) => questions[i]), perQuestion, mode, indexes.map((i) => mustMention[i] ?? null), indexes.map((i) => alsoFetch[i] ?? null))
    )
  );
  return judged.flat();
}

async function judgeChunk(
  questions: string[],
  perQuestion: number,
  mode: 'evidence' | 'fit',
  mustMention: (RegExp[] | null)[],
  alsoFetch: (RegExp[] | null)[] = []
): Promise<JudgedItem[]> {
  const empty: JudgedItem = { verdict: 'none', projects: [] };
  if (questions.length === 0) return [];

  // Over-fetch, then keep at most two sections per project so one project's
  // many similar sections can't crowd out another project's single strong one.
  // Semantic hits, plus (for a named technology) the sections that actually
  // name it, which dense search can rank below looser matches.
  const sections = mustMention.some(Boolean) || alsoFetch.some(Boolean) ? await getKnowledgeSections() : [];
  const hitLists = await Promise.all(
    questions.map((question, i) =>
      searchKnowledge(question, { recordType: 'project', topK: Math.min(perQuestion * 3, 30) })
        .then((hits) => {
          const terms = mustMention[i] ?? alsoFetch[i];
          const named: KnowledgeHit[] = terms
            ? sections
                .filter((section) => terms.some((term) => term.test(section.text)))
                // Solo projects first; on team projects, the section listing his own work first.
                .sort((a, b) => rank(a) - rank(b))
                .slice(0, 4)
                .map((section) => ({ ...section, recordType: 'project' as const, score: 0 }))
            : [];
          const perProject = new Map<number, number>();
          const seenSections = new Set<string>();
          return [...named, ...hits].filter((hit) => {
            const key = `${hit.projectId}|${hit.section}`;
            if (seenSections.has(key)) return false;
            seenSections.add(key);
            const count = perProject.get(hit.projectId) ?? 0;
            perProject.set(hit.projectId, count + 1);
            return count < 2;
          }).slice(0, perQuestion + named.length);
        })
        .catch((error) => {
          judgeFailures++;
          console.error('judgeEvidence: search failed', error);
          return [] as KnowledgeHit[];
        })
    )
  );
  // A fit check also reads his work history, which has no write-up: a QA
  // requirement can be met by his Cognizant role, not only by a project.
  const work = mode === 'fit' ? WORK_EVIDENCE : [];
  if (hitLists.every((hits) => hits.length === 0) && work.length === 0) return questions.map(() => empty);

  const blocks = questions.map((question, i) => {
    const lines = [
      ...hitLists[i].map((hit, j) => `  [${i}.${j}] "${hit.projectName}" / ${hit.section}: ${excerpt(hit)}`),
      ...work.map((item, k) => `  [${i}.w${k}] Work history / ${item.where}: ${item.text}`),
    ];
    return `ITEM ${i}: ${question}\n${lines.join('\n') || '  (no excerpts)'}`;
  });

  try {
    // A named technology gets the larger model: the small one quotes "SwiftUI" for "Swift".
    const response = await getJudge(mode === 'fit' || mustMention.some(Boolean) ? 'fit' : 'evidence')
      .bind({ response_format: { type: 'json_object' } })
      .invoke([
        new SystemMessage(
          `You check a software engineer's portfolio for evidence. The engineer is Kyle-Anthony Hay. For each ITEM, read only its excerpts and decide:
- "direct": an excerpt shows Kyle-Anthony himself built, used, or did this (on team projects, only the parts the excerpt attributes to him or the team he was on).
- "related": no direct use, but excerpts show clearly adjacent or transferable work.
- "none": nothing relevant.
List each relevant project once, strongest evidence first: "ref" is the excerpt id that best supports it (e.g. "0.3"), "quote" is the one sentence from that excerpt (at most 35 words), copied exactly with no ellipses, that shows it, and "why" (under 18 words) answers the ITEM itself, not a generic project summary, stating concretely what he did. Be strict: leave out projects whose excerpts only loosely touch the ITEM, and never upgrade a claim (a take-home brief is not a client; a team project is not solo work). Never infer beyond the excerpts.
- A technology the excerpt names only as an alternative he did not pick ("chosen over X", "X vs Y", "alternatives would be X", "instead of X") is evidence AGAINST that technology: verdict "none" for it.
- On team projects (OnTract, Sentio+), tech-stack, architecture and "skills demonstrated" lists describe the team's system; count a technology only where the excerpt says he built or used it, or it is part of his solo rebuild.
- Using a model through a cloud provider counts as using that model: Claude called through AWS Bedrock is hands-on Claude use.
- The excerpt must address the ITEM itself, not a word near it: REST is not GraphQL, WebSockets are not Kafka, Next.js is not "next-generation", Bedrock calls are not running AWS infrastructure, a trained model that was never deployed is not "deployed ML in production", a troubleshooting assistant is not incident response.${mode === 'fit' ? FIT_RUBRIC : ''}
Being on the team that built something is not his use of it. When the ITEM names a technology, the quote must contain that technology's exact name (not a related one: "SwiftUI" is not "Swift"). If no sentence shows it, the verdict is "none" with no projects; never cite a project to say it lacks something.
Return one entry for every ITEM, in order. Return JSON: {"items":[{"index":0,"verdict":"direct|related|none","projects":[{"ref":"0.3","quote":"...","why":"..."${mode === 'fit' ? ',"same_context":true' : ''}}]}]}`
        ),
        new HumanMessage(blocks.join('\n\n')),
      ]);
    const text = typeof response.content === 'string' ? response.content : '';
    const parsed = JSON.parse(text) as {
      items?: { index?: number; verdict?: string; projects?: { ref?: string; quote?: string; why?: string; same_context?: boolean }[] }[];
    };
    return questions.map((_, i) => {
      const item = parsed.items?.find((candidate) => candidate.index === i);
      if (!item) return empty;
      const verdict: Verdict = item.verdict === 'direct' || item.verdict === 'related' ? item.verdict : 'none';
      const seen = new Set<number>();
      const terms = mustMention[i];
      // Work-history refs ("0.w2") are checked like project quotes, minus the team-project rule.
      const workRefs = (item.projects ?? []).flatMap((p) => {
        const k = /^\d+\.w(\d+)$/.exec(String(p.ref ?? ''))?.[1];
        const entry = k !== undefined ? work[Number(k)] : undefined;
        const why = (p.why ?? '').trim();
        if (!entry || !why || !quoteFound(p.quote ?? '', entry.text)) return [];
        if (REJECTED.test(normalizeQuote(p.quote ?? '')) || /^(no|not|there is no|nothing)\b/i.test(why)) return [];
        if (terms && terms.length > 0 && !terms.some((term) => term.test(normalizeQuote(p.quote ?? '')))) return [];
        return [{ where: entry.where, text: entry.text, context: p.same_context === true }];
      });
      const projects = (item.projects ?? []).flatMap((p) => {
        const j = Number(String(p.ref ?? '').split('.')[1]);
        const hit = Number.isInteger(j) ? hitLists[i][j] : undefined;
        if (!hit || !projectById(hit.projectId) || seen.has(hit.projectId)) return [];
        const quote = normalizeQuote(p.quote ?? '');
        const why = (p.why ?? '').trim();
        if (!quoteFound(p.quote ?? '', hit.text)) return [];
        if (REJECTED.test(quote) || /^(no|not|there is no|nothing)\b/i.test(why) || /\bon the team that\b|\bteam(mates)? (built|wrote)\b/i.test(why)) return [];
        if (terms && terms.length > 0 && !terms.some((term) => term.test(quote))) return [];
        // On team projects the sentence has to say it was his, unless it comes from the section listing his own commits.
        if (TEAM_PROJECT_IDS.has(hit.projectId) && !ATTRIBUTION.test(quote) && !/role/i.test(hit.section)) return [];
        seen.add(hit.projectId);
        return [{ id: hit.projectId, why, section: hit.section, context: mode !== 'fit' || p.same_context === true }];
      });
      // In a fit check, "direct" needs at least one project or job doing it in the setting the requirement means.
      const direct = verdict === 'direct' && (projects.some((p) => p.context) || workRefs.some((w) => w.context));
      const ordered = [...projects.filter((p) => p.context), ...projects.filter((p) => !p.context)].map(({ id, why, section }) => ({ id, why, section }));
      const cited = projects.length + workRefs.length;
      return {
        verdict: cited === 0 ? 'none' : direct ? 'direct' : verdict === 'none' ? 'none' : 'related',
        projects: ordered,
        work: [...workRefs.filter((w) => w.context), ...workRefs.filter((w) => !w.context)].map(({ where, text }) => ({ where, text })),
      };
    });
  } catch (error) {
    judgeFailures++;
    console.error('judgeEvidence: judge failed', error);
    return questions.map(() => empty);
  }
}

/* ------------------------------------------------------------------------ */
/* Tools                                                                     */
/* ------------------------------------------------------------------------ */

export const checkExperience = tool(
  async ({ technology }) => {
    // A mention is not experience: write-ups name tools he chose against and
    // tools teammates built. The judge has to see his own use.
    const evidence = await gatherEvidence(technology);
    const [judged] = await judgeEvidence([`Kyle-Anthony's own hands-on use of ${technology}`], 6, 'evidence', [variantsFor(technology, evidence.skill).map(termPattern)]);
    // Work with no write-up (Cognizant, the internship, the hackathon) counts too.
    const patterns = variantsFor(technology, evidence.skill).map(termPattern);
    const resume = WORK_EVIDENCE.filter((item) => patterns.some((pattern) => pattern.test(item.text)));
    const verdict = resume.length > 0 && judged?.verdict !== 'direct' ? 'direct' : judged?.verdict ?? 'none';
    const hasExperience = verdict === 'direct';
    const projects: EvidenceProject[] = (judged?.projects ?? []).slice(0, 4).map(({ id, why }) => ({ project: toCard(projectById(id)!), usage: why }));
    const name = evidence.displayName;
    const listed = evidence.skill && evidence.skill.group !== 'Discipline';

    let content: string;
    if (resume.length > 0 && projects.length === 0) {
      content = [`His work history shows him using ${name} (no project write-up covers this work):`, ...resume.map((item) => `- ${item.where} (${sourceLabel(item.source)}): ${item.text}`)].join('\n');
    } else if (hasExperience) {
      content = [
        `Kyle-Anthony has used ${name}${evidence.since ? ` (listed since ${evidence.since}, about ${evidence.years} year${evidence.years === 1 ? '' : 's'}, mostly on personal and training projects)` : ''}:`,
        ...projects.map((p) => `- ${p.project.title}: ${p.usage}`),
        ...resume.map((item) => `- ${item.where} (${sourceLabel(item.source)}): ${item.text}`),
      ].join('\n');
    } else if (verdict === 'related') {
      content = [`No project shows him using ${name} itself. Related work only:`, ...projects.map((p) => `- ${p.project.title}: ${p.usage}`)].join('\n');
    } else if (listed) {
      content = `${name} is listed among his skills${evidence.since ? ` (since ${evidence.since})` : ''}, but no project write-up shows him using it. Say exactly that; do not say he has experience with it, and suggest asking him.`;
    } else {
      content = `No evidence of ${name} in his projects or background. Say so plainly; do not offer substitutes he has not used.`;
    }

    const widget: Widget = {
      kind: 'experience_check',
      technology: name,
      hasExperience,
      since: hasExperience ? evidence.since : undefined,
      years: hasExperience ? evidence.years : undefined,
      category: evidence.skill?.group,
      projects: verdict === 'none' ? [] : projects,
      related: [],
    };

    return pack({
      content,
      citedProjectIds: verdict === 'none' ? [] : projects.map(({ project }) => project.id),
      widget,
    });
  },
  {
    name: 'check_experience',
    description:
      "Verify whether Kyle-Anthony has experience with a specific technology, framework, language, platform, or discipline, with start year and every project where it appears. Use for any 'does he know / has he used / how long has he worked with X' question and for 'what did he build with X' or 'which projects use X'. Call once per technology.",
    schema: z.object({
      technology: z.string().describe("The technology to check, e.g. 'Swift', 'LangGraph', 'Kubernetes', 'iOS development'"),
    }),
  }
);

export const getExperience = tool(
  async ({ query }) => {
    const [judged] = await judgeEvidence([query], 10);
    const verdictConfidence: Record<Verdict, Recommendation['confidence']> = { direct: 'high', related: 'medium', none: 'low' };

    const recommendations: Recommendation[] = (judged?.projects ?? []).slice(0, 5).map(({ id, why, section }, index) => ({
      project: toCard(projectById(id)!),
      why,
      section: section || undefined,
      // The judge lists the strongest evidence first; later entries in a "related" verdict are weaker.
      confidence: judged.verdict === 'direct' && index < 3 ? 'high' : verdictConfidence[judged.verdict === 'direct' ? 'related' : judged.verdict],
    }));

    if (recommendations.length === 0) {
      return pack({
        content: `No project shows evidence of "${query}". Kyle-Anthony's projects are: ${catalog.map((p) => p.title).join(', ')}. Say so plainly and mention the closest strengths you know of, if any.`,
        citedProjectIds: [],
      });
    }

    // Give the writer the underlying sections, not just the one-liners.
    const sections = await searchKnowledge(query, { recordType: 'project', topK: 8 }).catch(() => [] as KnowledgeHit[]);
    const cited = new Set(recommendations.map((r) => r.project.id));
    const detail = sections
      .filter((hit) => cited.has(hit.projectId))
      .slice(0, 5)
      .map((hit) => `### ${hit.projectName} — ${hit.section}\n${excerpt(hit)}`)
      .join('\n\n');

    const content = [
      `Evidence for "${query}" (${judged.verdict === 'direct' ? 'direct experience' : 'related work only'}):`,
      ...recommendations.map((r) => `- ${r.project.title}: ${r.why}`),
      detail ? `\nSupporting excerpts:\n${detail}` : '',
    ].join('\n');

    return pack({
      content,
      citedProjectIds: recommendations.map((r) => r.project.id),
      widget: { kind: 'recommendations', query, items: recommendations },
    });
  },
  {
    name: 'get_experience',
    description:
      "Use when the visitor asks about Kyle-Anthony's broader experience with a capability, domain, or kind of work rather than one named project: 'has he worked with AI?', 'what's his backend experience?', 'has he used vector databases?', 'has he worked with real clients?', 'what has he built with SwiftUI?', 'anything relevant to fintech?'. Searches every project write-up and shows the most relevant projects as recommendation cards, each with why it is relevant.",
    schema: z.object({
      query: z.string().describe("The capability or topic in the visitor's words, e.g. 'vector databases', 'working with nontechnical stakeholders'"),
    }),
  }
);

export const getProject = tool(
  async ({ name, query }) => {
    const project = findProjectByName(name);
    if (!project) {
      // The model sometimes passes a technology ("Convex") as the project. Answer
      // with where that technology is used rather than "no such project", which
      // reads as "he has never used it".
      if (findSkill(name) || (await gatherEvidence(name)).hasExperience) {
        return (await checkExperience.invoke({ technology: name })) as string;
      }
      return pack({
        content: `No project named "${name}". Available projects: ${catalog.map((p) => p.title).join(', ')}. This says nothing about technologies; for those use check_experience.`,
        citedProjectIds: [],
      });
    }

    let body = '';
    if (query && query.trim()) {
      const hits = await searchKnowledge(query, { projectId: project.id, topK: 4 }).catch(() => [] as KnowledgeHit[]);
      body = hits.map((hit) => `## ${hit.section}\n${hit.text}`).join('\n\n');
    }
    if (!body) {
      // No specific question: the overview, role, features, architecture, and outcomes cover most first asks.
      const wanted = ['overview', 'role', 'features', 'architecture', 'outcomes', 'status'];
      const sections = await getProjectSections(project.id);
      body = sections
        .filter((section) => wanted.includes(section.category) || /overview|role|feature|architecture|outcome|status/i.test(section.section))
        .map((section) => `## ${section.section}\n${section.text}`)
        .join('\n\n');
    }
    const trimmed = body.length > 7000 ? `${body.slice(0, 7000)}\n[truncated]` : body;

    const content = [
      `# ${project.title} — ${project.tagline} (${project.category})`,
      project.link ? `Live: ${project.link}` : null,
      project.github ? `Source: ${project.github}` : null,
      trimmed || project.overview,
    ]
      .filter(Boolean)
      .join('\n');

    return pack({
      content,
      citedProjectIds: [project.id],
      widget: { kind: 'project', project: toCard(project), overview: project.overview, techStack: project.techStack },
    });
  },
  {
    name: 'get_project',
    description:
      "Use whenever the visitor asks about one identifiable project: what it is, how a feature works, architecture, why a technology was chosen, what was hard, Kyle-Anthony's role, results, or status ('What is SelahNote?', 'How does it find scripture references?', 'Why Convex?', 'What did he do on OnTract?'). Pass the visitor's actual question as `query` so the right sections are retrieved. Shows a project card.",
    schema: z.object({
      name: z.string().describe("Project name, e.g. 'SelahNote', 'OnTract', 'V1 ProdBot'. Never a technology: for 'what did he build with Convex' use check_experience."),
      query: z.string().optional().describe("What the visitor wants to know about it, in their words. Omit only for a general 'tell me about X'."),
    }),
  }
);

export const listProjects = tool(
  async ({ category }) => {
    const filtered = category && category !== 'all' ? catalog.filter((p) => p.category === category) : catalog;
    const content = filtered
      .map((p) => `- ${p.title} (${p.category}): ${p.tagline}. ${p.highlights.join(', ')}.`)
      .join('\n');

    return pack({
      content: `${filtered.length} projects:\n${content}`,
      citedProjectIds: filtered.map((p) => p.id),
      widget: {
        kind: 'projects',
        title: category && category !== 'all' ? category : undefined,
        projects: filtered.map(toCard),
      },
    });
  },
  {
    name: 'list_projects',
    description:
      "List Kyle-Anthony's projects, optionally filtered to iOS or web apps. Shows them as a card carousel, so keep the accompanying text short.",
    schema: z.object({
      category: z.enum(['all', 'iOS Apps', 'macOS Apps', 'Web Apps']).default('all').describe('Filter by platform'),
    }),
  }
);

const backgroundSections = ['summary', 'skills', 'experience', 'education', 'work_status', 'contact', 'interests'] as const;

export const getBackground = tool(
  async ({ section }) => {
    switch (section) {
      case 'skills': {
        const groups = toSkillGroups();
        const currentYear = new Date().getFullYear();
        const content = groups
          .map(
            (group) =>
              `${group.name}: ${group.skills
                .map((s) => (s.since ? `${s.name} (since ${s.since}, ~${currentYear - s.since}y)` : s.name))
                .join(', ')}`
          )
          .join('\n');
        return pack({ content, citedProjectIds: [], widget: { kind: 'skills', groups } });
      }
      case 'experience':
      case 'education': {
        const content = timeline
          .map((item) => `${item.period}: ${item.title} at ${item.org}${item.detail ? ` — ${item.detail}` : ''}`)
          .join('\n');
        return pack({
          content: `${content}\n\n${PROFESSIONAL_TENURE} Describe the Cognizant work only with the timeline's words; none of his portfolio projects were built there.`,
          citedProjectIds: [],
          widget: { kind: 'timeline', items: timeline },
        });
      }
      case 'work_status':
      case 'contact': {
        const content = [
          `${profile.name} — ${profile.headline}, based in ${profile.location}.`,
          ...profile.availability,
          ...[...WORK_ARRANGEMENT, ...HIRING_DETAILS].map((text) => `${text} (his own words)`),
          ...contactLinks.map((link) => `${link.label}: ${link.detail ?? link.href}`),
          'Anything about where or how he works that is not listed above is not stated: say so and suggest asking him directly. Questions about how he works or thinks are for him to answer: suggest asking him.',
        ].join('\n');
        return pack({
          content,
          citedProjectIds: [],
          widget: {
            kind: 'contact',
            name: profile.name,
            headline: profile.headline,
            location: profile.location,
            availability: profile.availability,
            links: contactLinks,
          },
        });
      }
      case 'interests':
        return pack({ content: `Career interests: ${profile.interests.join('; ')}.`, citedProjectIds: [] });
      case 'summary':
      default:
        return pack({
          content: `${profile.summary}\nLocation: ${profile.location}. Education: B.S. Computer Science, CUNY Hunter College, 2024. Interests: ${profile.interests.join('; ')}.`,
          citedProjectIds: [],
        });
    }
  },
  {
    name: 'get_background',
    description:
      "Get a structured section of Kyle-Anthony's background: 'summary', 'skills' (full stack with start years), 'experience' or 'education' (timeline), 'work_status' or 'contact' (availability, location, links, résumé), or 'interests'. Prefer this over search for these topics.",
    schema: z.object({
      section: z.enum(backgroundSections),
    }),
  }
);

export const searchBackground = tool(
  async ({ query }) => {
    try {
      const hits = await searchKnowledge(query, { recordType: 'personal_info', topK: 3 });
      if (hits.length > 0) {
        return pack({
          content: hits.map((hit) => `${hit.section}: ${hit.text.replace(/\s+/g, ' ').slice(0, 700)}`).join('\n\n'),
          citedProjectIds: [],
        });
      }
    } catch (error) {
      console.error('search_background: vector search failed', error);
    }

    const personalInfo = await getPersonalInfoDocument();
    const pattern = termPattern(query);
    const chunks = personalInfo?.chunks.filter((chunk) => pattern.test(chunk.content)).slice(0, 3) ?? [];
    return pack({
      content:
        chunks.length > 0
          ? chunks.map((chunk) => chunk.content.slice(0, 700)).join('\n\n')
          : `Nothing specific found for "${query}". Summary: ${profile.summary}`,
      citedProjectIds: [],
    });
  },
  {
    name: 'search_background',
    description:
      "Free-text search over Kyle-Anthony's background notes and recruiter FAQ for questions the structured sections don't cover (e.g. 'leadership', 'hackathons', 'what is he strongest at').",
    schema: z.object({
      query: z.string(),
    }),
  }
);

const YEARS_PATTERN = /(\d+)\s*\+?\s*(?:(?:-|–|—|to)\s*\d+\s*)?(?:years?|yrs?)/i;

/** His only confirmed professional role, for tenure questions. Side projects are not professional years. */
const PROFESSIONAL_TENURE =
  'About one year of professional experience: AI Engineer at Cognizant since November 2025, plus a three-month internship in 2023. His other years are personal and training-program work.';

type Shortcut = FitRequirement | { judge: true; requirement: string; requiredYears: number | null };

/**
 * Rows the portfolio answers without reading project write-ups: degrees,
 * professional tenure, and where he can work. Everything else goes to the
 * judge, which needs an excerpt showing his own use.
 */
function shortcut(requirement: string): Shortcut {
  const text = requirement.trim();
  const lower = text.toLowerCase();
  const yearsMatch = YEARS_PATTERN.exec(text);
  const requiredYears = yearsMatch ? parseInt(yearsMatch[1], 10) : null;

  if (/\bgpa\b|grade point/i.test(lower)) {
    const asked = /(\d\.\d+)/.exec(text)?.[1];
    if (GPA === null) return { requirement: text, status: 'gap', evidence: 'His GPA is not stated: ask him.', projects: [] };
    const met = !asked || GPA >= parseFloat(asked);
    return { requirement: text, status: met ? 'match' : 'gap', evidence: `Undergraduate GPA ${GPA} (his own words), B.S. Computer Science, CUNY Hunter College (2024).`, projects: [] };
  }

  if (/\b(degree|bachelor|b\.?s\.?\b|master'?s|ph\.?d|doctorate)\b/i.test(lower) || /\bcomputer science\b/i.test(lower)) {
    // His degree is a B.S. in Computer Science; anything beyond that, or a different field, is not met.
    const advanced = /\b(master'?s?|m\.?sc?\b|ph\.?d|doctorate|graduate degree|mba)/i.test(lower);
    const bachelorAccepted = /\b(bachelor|b\.?s\.?\b|b\.?a\.?\b|undergraduate)/i.test(lower);
    if (advanced && !bachelorAccepted) {
      return { requirement: text, status: 'gap', evidence: 'His highest degree is a B.S. in Computer Science (CUNY Hunter College, 2024).', projects: [] };
    }
    const otherField = /\b(statistics|mathematics|math|economics|finance|physics|accounting|biology|chemistry|business)\b/i.test(lower);
    const csNamed = /\b(computer science|cs\b|software|computer engineering)/i.test(lower);
    if (otherField && !csNamed) {
      // "Finance, economics, or a related field": CS may count as quantitative, but it is not the field named.
      const loose = /\b(related|equivalent|technical|stem|quantitative)\b/i.test(lower);
      return {
        requirement: text,
        status: loose ? 'related' : 'gap',
        evidence: `His degree is a B.S. in Computer Science, not one of the fields named${loose ? '; whether it counts as related is for the team to judge' : ''}.`,
        projects: [],
      };
    }
    return { requirement: text, status: 'match', evidence: 'B.S. Computer Science, CUNY Hunter College (2024).', projects: [] };
  }

  if (/\b(relocat\w*|on-?site|in[- ]office|hybrid|remote|based in|located in|work authori[sz]ation|authori[sz]ed to work|visas?|sponsorship|citizen\w*|green card|permanent resident|security clearance|time ?zones?|travel\w*)\b/i.test(lower)) {
    const arrangement = workArrangement(text);
    return { requirement: text, status: arrangement.met ? 'match' : 'gap', evidence: arrangement.evidence, projects: [] };
  }

  // Years of experience in general, in industry, or in a job function: tenure, not a technology.
  if (requiredYears !== null) {
    const skills = findSkillsInText(text).filter((match) => termPattern(match.skill.name).test(text));
    const professional = /\b(professional|industry|industrial|full[- ]time|commercial)\b|\bas an? [a-z]/i.test(lower);
    if (skills.length === 0 || professional) {
      return { requirement: text, status: requiredYears <= 1 ? 'match' : 'gap', evidence: PROFESSIONAL_TENURE, projects: [] };
    }
  }

  return { judge: true, requirement: text, requiredYears };
}

export type FitRead = 'strong fit' | 'good fit with some gaps' | 'partial fit: real gaps to weigh' | 'weak fit for this role';

export interface FitAssessment {
  requirements: FitRequirement[];
  summary: { match: number; related: number; gap: number };
  read: FitRead;
}

export const MAX_REQUIREMENTS = 20;

/**
 * Listed skills that name a kind of work rather than a tool. "QA test cases
 * for software or AI agents" must not need a sentence containing "AI agents",
 * and "prompt engineering" is shown by prompt design without that phrase.
 */
const KINDS_OF_WORK = new Set(['AI agents', 'Prompt engineering']);

/** Requirements about temperament rather than work done; the rubric already says related at most, the judge doesn't always hold to it. */
const DISPOSITION = /\b(mindset|adaptab\w*|ambigu\w*|thrive\w*|resilien\w*|growth)\b/i;

/**
 * The fit check itself, shared by assess_job_fit and the recruiter brief.
 * A row is a match only when a write-up shows him doing it: keyword hits and
 * skill aliases ("apis", "real-time", "next") no longer count on their own,
 * and a technology a write-up says he chose against is evidence against it.
 */
export async function assessRequirements(requirements: string[]): Promise<FitAssessment> {
  const trimmed = requirements.map((r) => r.trim()).filter(Boolean).slice(0, MAX_REQUIREMENTS);
  const results: FitRequirement[] = new Array(trimmed.length);
  const toJudge: { index: number; requirement: string; requiredYears: number | null }[] = [];

  trimmed.forEach((requirement, index) => {
    const quick = shortcut(requirement);
    if ('judge' in quick) toJudge.push({ index, requirement: quick.requirement, requiredYears: quick.requiredYears });
    else results[index] = quick;
  });

  if (toJudge.length > 0) {
    // When a row names technologies, the quoted sentence has to name one of them.
    // Only when the row names the technology itself; "API design" or "agentic workflows" are kinds of work, not a tool to quote.
    // Kinds of work (AI agents, prompt engineering) still pull the sections naming them, but the quote need not repeat the phrase.
    const namedSkills = toJudge.map(({ requirement }) => findSkillsInText(requirement).filter((match) => termPattern(match.skill.name).test(requirement)));
    const toTerms = (skills: SkillMatch[]) => (skills.length > 0 ? skills.flatMap(safeVariants).map(termPattern) : null);
    const named = namedSkills.map((skills) => toTerms(skills.filter((match) => !KINDS_OF_WORK.has(match.skill.name))));
    const kinds = namedSkills.map((skills) => toTerms(skills.filter((match) => KINDS_OF_WORK.has(match.skill.name))));
    const judged = await judgeEvidence(toJudge.map((row) => row.requirement), 5, 'fit', named, kinds);
    const currentYear = new Date().getFullYear();
    toJudge.forEach(({ index, requirement, requiredYears }, i) => {
      const verdict = judged[i];
      if (!verdict || verdict.verdict === 'none') {
        results[index] = { requirement, status: 'gap', evidence: 'Nothing in his projects or work history shows this.', projects: [] };
        return;
      }
      const projects = verdict.projects.slice(0, 3).map(({ id }) => toCard(projectById(id)!));
      // A job has no write-up, so its own line is quoted rather than the judge's paraphrase.
      const job = verdict.work?.[0];
      const atJob = job
        ? / at /.test(job.where)
          ? `At ${job.where.replace(/^.* at |\s*\(.*\)$/g, '')}: ${job.text.replace(/^./, (c) => c.toLowerCase())}`
          : `${job.where}: ${job.text}`
        : '';
      const lead = verdict.projects[0] ?? { why: atJob };
      let status: FitStatus = verdict.verdict === 'direct' ? 'match' : 'related';
      let evidence = `${lead.why}${atJob && verdict.projects.length > 0 ? ` ${atJob}` : ''}${status === 'related' ? ' (adjacent, not a direct match)' : ''}`;

      // "3+ years of Swift": the judge settles use; the start year settles length.
      if (requiredYears !== null) {
        const since = findSkillsInText(requirement)
          .filter((match) => termPattern(match.skill.name).test(requirement))
          .map((match) => match.skill.since)
          .filter((year): year is number => typeof year === 'number');
        const years = since.length > 0 ? currentYear - Math.min(...since) : null;
        if (years === null) {
          status = 'related';
          evidence = `${lead.why} How long he has used it isn't recorded.`;
        } else if (years < requiredYears) {
          status = requiredYears - years <= 1 && status === 'match' ? 'related' : 'gap';
          evidence = `${lead.why} About ${years} year${years === 1 ? '' : 's'} of use, mostly on personal and training projects, against ${requiredYears} asked.`;
        } else {
          evidence = `${lead.why} About ${years} years of use, mostly on personal and training projects.`;
        }
      }
      // A write-up shows what he built, not a disposition: "growth mindset" or "thrives in ambiguity" is related at most.
      if (status === 'match' && DISPOSITION.test(requirement)) {
        status = 'related';
        evidence = `${lead.why} (shows the work, not the trait itself)`;
      }
      results[index] = { requirement, status, evidence, projects };
    });
  }

  const summary = {
    match: results.filter((r) => r.status === 'match').length,
    related: results.filter((r) => r.status === 'related').length,
    gap: results.filter((r) => r.status === 'gap').length,
  };

  const score = (summary.match + summary.related * 0.5) / Math.max(1, results.length);
  const read: FitRead =
    score >= 0.85 && summary.gap === 0
      ? 'strong fit'
      : score >= 0.65
        ? 'good fit with some gaps'
        : score >= 0.4
          ? 'partial fit: real gaps to weigh'
          : 'weak fit for this role';
  return { requirements: results, summary, read };
}

export const assessJobFit = tool(
  async ({ role, requirements }) => {
    const { requirements: results, summary, read } = await assessRequirements(requirements);
    const content = [
      `Fit assessment${role ? ` for ${role}` : ''}: ${summary.match} match, ${summary.related} related, ${summary.gap} gap out of ${results.length}. Overall read: ${read}. Use this read in your summary; do not call it a stronger fit than this.`,
      ...results.map((r) => `- [${r.status.toUpperCase()}] ${r.requirement} — ${r.evidence}`),
    ].join('\n');

    return pack({
      content,
      citedProjectIds: [...new Set(results.flatMap((r) => r.projects.map((p) => p.id)))],
      widget: { kind: 'fit_report', role, requirements: results, summary },
    });
  },
  {
    name: 'assess_job_fit',
    description:
      "Compare a job description or a list of requirements against Kyle-Anthony's verified skills and projects. Extract the concrete requirements (technologies, years of experience, degree, team skills) from the visitor's message first, one short phrase each, then call this once. Shows a match/related/gap report.",
    schema: z.object({
      role: z.string().optional().describe("Role title if given, e.g. 'Senior iOS Engineer'"),
      requirements: z
        .array(z.string())
        .min(1)
        .max(MAX_REQUIREMENTS)
        .describe("Concrete requirements, one per entry, e.g. ['3+ years Swift', 'SwiftUI', 'REST APIs', 'CI/CD', 'Bachelor's degree']"),
    }),
  }
);

export const askVisitor = tool(
  async ({ question, options, allow_other }) =>
    pack({
      content:
        'The question card is now shown to the visitor with these options. Stop here: do not answer yet and do not call other tools. Their choice arrives as their next message.',
      citedProjectIds: [],
      widget: { kind: 'question', question, options, allowOther: allow_other ?? true },
    }),
  {
    name: 'ask_visitor',
    description:
      "Ask the visitor one clarifying question as a card with 2-4 tappable options, when the request is ambiguous in a way that changes the answer (e.g. 'is he a fit for my team?' with no role, 'check fit for a role' with no job description, 'what should I look at?' with no context). Never use it when the question is already clear, and never twice in a row. Do not include an 'Other' or 'Something else' option; the card adds a free-text row itself.",
    schema: z.object({
      question: z.string().describe('One short question, under 12 words, e.g. "What kind of role are you hiring for?"'),
      options: z
        .array(z.object({ label: z.string().describe('2-5 words'), detail: z.string().optional().describe('Optional hint, under 8 words') }))
        .min(2)
        .max(4),
      allow_other: z.boolean().optional().describe('Show a free-text "Something else" row. Default true.'),
    }),
  }
);

/* ------------------------------------------------------------------------ */
/* Resources, job postings, journey, booking                                 */
/* ------------------------------------------------------------------------ */

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
};

/** Only public http(s) pages: no localhost, private ranges, or bare IPs. */
function isPublicUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return null;
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return null;
    return url;
  } catch {
    return null;
  }
}

interface FetchedPage {
  status: number;
  html: string | null;
  /** Why there is no html, in words the visitor can act on. */
  problem?: string;
}

async function fetchPage(url: URL, ms: number): Promise<FetchedPage> {
  try {
    const response = await fetch(url, { headers: FETCH_HEADERS, redirect: 'follow', signal: AbortSignal.timeout(ms) });
    if (response.status === 404 || response.status === 410)
      return { status: response.status, html: null, problem: 'the page does not exist (404); the link may be wrong or the job may be closed' };
    if (response.status === 401 || response.status === 403 || response.status === 429)
      return { status: response.status, html: null, problem: `the site blocked the request (${response.status})` };
    if (!response.ok) return { status: response.status, html: null, problem: `the site returned an error (${response.status})` };
    const type = response.headers.get('content-type') ?? '';
    if (!type.includes('html') && !type.includes('text')) return { status: response.status, html: null, problem: 'the link is not a web page' };
    return { status: response.status, html: (await response.text()).slice(0, 1_500_000) };
  } catch {
    return { status: 0, html: null, problem: 'the site did not respond in time' };
  }
}

async function fetchHtml(url: URL, ms: number): Promise<string | null> {
  return (await fetchPage(url, ms)).html;
}

/**
 * Job boards (Ashby, Greenhouse, Lever, Workday, many careers sites) render
 * the posting with JavaScript but embed it as schema.org JobPosting JSON-LD
 * for search engines. Reading that covers most boards without a browser or
 * a parser per board.
 */
function jobPostingFromJsonLd(html: string): string | null {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const candidates: Record<string, unknown>[] = [];
  const collect = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') {
      const node = value as Record<string, unknown>;
      if (node['@type'] === 'JobPosting' || (Array.isArray(node['@type']) && node['@type'].includes('JobPosting'))) candidates.push(node);
      if (node['@graph']) collect(node['@graph']);
    }
  };
  for (const block of blocks) {
    try {
      collect(JSON.parse(block[1].trim()));
    } catch {
      // Malformed JSON-LD is common; skip it.
    }
  }
  const job = candidates[0];
  if (!job) return null;

  const str = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() ? value.trim() : undefined);
  const org = job.hiringOrganization as Record<string, unknown> | undefined;
  const locations = ([] as unknown[])
    .concat(job.jobLocation ?? [])
    .map((loc) => {
      const address = (loc as Record<string, unknown>)?.address as Record<string, unknown> | undefined;
      return [str(address?.addressLocality), str(address?.addressRegion), str(address?.addressCountry)].filter(Boolean).join(', ');
    })
    .filter(Boolean);
  const salary = job.baseSalary as Record<string, unknown> | undefined;
  const salaryValue = salary?.value as Record<string, unknown> | undefined;
  const pay =
    salaryValue && (salaryValue.minValue || salaryValue.maxValue)
      ? `${salaryValue.minValue ?? ''}–${salaryValue.maxValue ?? ''} ${str(salary?.currency) ?? ''} ${str(salaryValue.unitText) ?? ''}`.trim()
      : undefined;
  const description = str(job.description);

  const lines = [
    str(job.title) && `Title: ${str(job.title)}`,
    str(org?.name) && `Company: ${str(org?.name)}`,
    locations.length > 0 && `Location: ${locations.join(' / ')}`,
    str(job.jobLocationType) && `Workplace: ${str(job.jobLocationType)}`,
    typeof job.employmentType === 'string' && `Employment: ${job.employmentType}`,
    pay && `Pay: ${pay}`,
    description && `\n${readableText(decodeEntities(description))}`,
  ].filter(Boolean);
  return lines.length > 1 ? lines.join('\n') : null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function metaContent(html: string, key: string): string | undefined {
  const pattern = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`,
    'i'
  );
  const match = pattern.exec(html);
  const value = match?.[1] ?? match?.[2];
  return value ? decodeEntities(value).trim() : undefined;
}

const previewCache = new Map<string, Promise<Pick<ProjectResource, 'title' | 'description' | 'image'>>>();

/** Open Graph preview for a link, falling back to the page title and description. */
function linkPreview(url: URL): Promise<Pick<ProjectResource, 'title' | 'description' | 'image'>> {
  const key = url.toString();
  if (!previewCache.has(key)) {
    previewCache.set(
      key,
      fetchHtml(url, 4000).then((html) => {
        if (!html) return { title: '' };
        const head = html.slice(0, 200_000);
        const image = metaContent(head, 'og:image') ?? metaContent(head, 'twitter:image');
        return {
          title: metaContent(head, 'og:title') ?? decodeEntities(/<title[^>]*>([^<]*)<\/title>/i.exec(head)?.[1] ?? '').trim(),
          description: metaContent(head, 'og:description') ?? metaContent(head, 'description'),
          image: image ? new URL(image, url).toString() : undefined,
        };
      })
    );
  }
  return previewCache.get(key)!;
}

const RESOURCE_TYPES: ProjectResource['type'][] = ['website', 'github', 'app-store', 'demo', 'video', 'docs', 'case-study'];

export const getProjectResource = tool(
  async ({ project: name, type }) => {
    const project = findProjectByName(name);
    if (!project) {
      return pack({ content: `No project named "${name}". Available projects: ${catalog.map((p) => p.title).join(', ')}.`, citedProjectIds: [] });
    }

    const raw = [
      ...(project.link ? [{ type: 'website', title: `${project.title} website`, url: project.link }] : []),
      ...(project.github ? [{ type: 'github', title: `${project.title} on GitHub`, url: project.github }] : []),
      ...(await getProjectResources(project.id)),
    ];
    // Every link comes back; a requested type just goes first.
    const unique = [...new Map(raw.map((r) => [r.url.replace(/\/$/, ''), r])).values()].sort(
      (a, b) => Number(b.type === type) - Number(a.type === type)
    );

    const resources: ProjectResource[] = (
      await Promise.all(
        unique.slice(0, 4).map(async (r): Promise<ProjectResource | null> => {
          const url = isPublicUrl(r.url);
          if (!url) return null;
          const preview = await linkPreview(url);
          return {
            type: (RESOURCE_TYPES.includes(r.type as ProjectResource['type']) ? r.type : 'website') as ProjectResource['type'],
            title: preview.title || r.title,
            url: r.url,
            description: preview.description,
            image: preview.image,
            domain: url.hostname.replace(/^www\./, ''),
          };
        })
      )
    ).filter((r): r is ProjectResource => r !== null);

    if (resources.length === 0) {
      return pack({
        content: `${project.title} has no public ${type && type !== 'any' ? type : 'link'}${
          project.category === 'macOS Apps' ? ' (it is a personal-use Mac app)' : ''
        }. Link its page on this site exactly as [its project page](${project.href}), a relative link with no domain.`,
        citedProjectIds: [project.id],
      });
    }

    return pack({
      content: `Link cards are shown for ${project.title}: ${resources.map((r) => r.type).join(', ')}. Do not list or repeat the links in prose; one short sentence is enough.`,
      citedProjectIds: [project.id],
      widget: { kind: 'resources', project: toCard(project), resources },
    });
  },
  {
    name: 'get_project_resource',
    description:
      "Use when the visitor wants the links for a project: 'What's the website?', 'Is there a GitHub?', 'App Store link?', 'Where can I learn more?'. Call it once per project: it returns every link (website, GitHub, App Store) as preview cards, so don't repeat the URLs in prose. To watch or try the product inside the chat, use show_demo instead.",
    schema: z.object({
      project: z.string().describe("Project name, e.g. 'SelahNote'"),
      type: z.enum(['any', 'website', 'github', 'app-store', 'demo', 'video', 'docs']).optional().describe('A specific kind of link, if asked for'),
    }),
  }
);

/** Readable text from a page: drop scripts, styles, nav and chrome, keep everything else. */
function readableText(html: string): string {
  const body = /<main[\s\S]*?<\/main>/i.exec(html)?.[0] ?? /<article[\s\S]*?<\/article>/i.exec(html)?.[0] ?? html;
  const text = body
    .replace(/<(script|style|noscript|svg|nav|footer|header|form|iframe|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section)[^>]*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

export type JobPostingRead =
  | { ok: true; host: string; title?: string; text: string }
  | { ok: false; host?: string; status: number; reason: string };

const postingCache = new Map<string, Promise<JobPostingRead>>();

/**
 * Fetches a posting once per URL per server process, so a link from the
 * intake step can ride along in every later turn without refetching.
 */
/** Board and job id for a Greenhouse posting: a Greenhouse board URL, or any page with ?gh_jid= on a company domain. */
function greenhouseIds(url: URL): { boards: string[]; id: string } | null {
  const direct = /(?:^|\.)greenhouse\.io$/.test(url.hostname) ? /^\/(?:embed\/job_app\?for=)?([\w-]+)\/jobs\/(\d+)/.exec(url.pathname) : null;
  if (direct) return { boards: [direct[1]], id: direct[2] };
  const id = url.searchParams.get('gh_jid') ?? (url.hostname.endsWith('greenhouse.io') ? url.searchParams.get('token') : null);
  if (!id || !/^\d+$/.test(id)) return null;
  const forBoard = url.searchParams.get('for');
  // careers.duolingo.com → "duolingo"; www.airbnb.com → "airbnb"
  const labels = url.hostname.replace(/^www\./, '').split('.');
  const guess = labels.length >= 2 ? labels[labels.length - 2] : labels[0];
  return { boards: [...new Set([forBoard, guess, labels[0]].filter((b): b is string => Boolean(b)))], id };
}

async function readGreenhouse(url: URL): Promise<JobPostingRead | null> {
  const ids = greenhouseIds(url);
  if (!ids) return null;
  for (const board of ids.boards) {
    try {
      const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${ids.id}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) continue;
      const job = (await response.json()) as { title?: string; company_name?: string; location?: { name?: string }; content?: string };
      if (!job.title || !job.content) continue;
      const body = readableText(decodeEntities(job.content));
      const text = [
        `Title: ${job.title}`,
        job.company_name && `Company: ${job.company_name}`,
        job.location?.name && `Location: ${job.location.name}`,
        `\n${body}`,
      ]
        .filter(Boolean)
        .join('\n');
      return { ok: true, host: url.hostname, title: job.title, text };
    } catch {
      // Try the next board name, then fall back to the page itself.
    }
  }
  return null;
}

export function readJobPosting(raw: string): Promise<JobPostingRead> {
  const url = isPublicUrl(raw.trim());
  if (!url) return Promise.resolve({ ok: false, status: 0, reason: 'that is not a public web address' });
  const key = url.toString();
  if (!postingCache.has(key)) {
    const read = (async (): Promise<JobPostingRead> => {
      // Greenhouse boards render with JavaScript, but its public API has the full posting.
      const greenhouse = await readGreenhouse(url);
      if (greenhouse) return greenhouse;
      const page = await fetchPage(url, 9000);
      const html = page.html;
      let text = html ? jobPostingFromJsonLd(html) ?? readableText(html) : '';
      // Some boards render the posting only inside <main>-less shells; fall back to the whole page.
      if (html && text.length < 400 && !text.startsWith('Title:')) text = readableText(html.replace(/<main[\s\S]*?<\/main>/i, ''));
      if (!text || text.length < 200) {
        return {
          ok: false,
          host: url.hostname,
          status: page.status,
          reason: page.problem ?? 'the page only loads its content with JavaScript, so the posting text is not in it',
        };
      }
      const raw = text.startsWith('Title:')
        ? text.slice(6, text.indexOf('\n') > 0 ? text.indexOf('\n') : undefined)
        : html
          ? metaContent(html, 'og:title') ?? /<title[^>]*>([^<]*)/i.exec(html)?.[1]
          : undefined;
      // "Full-Stack Engineer | ElevenLabs careers" → "Full-Stack Engineer"
      const title = raw ? decodeEntities(raw).split(/\s+[|–—]\s+|\s+-\s+/)[0].trim() : undefined;
      return { ok: true, host: url.hostname, title: title || undefined, text };
    })();
    postingCache.set(key, read);
    // Failures are worth retrying later (a timeout, a rate limit); successes are kept.
    read.then((result) => {
      if (!result.ok) postingCache.delete(key);
    });
  }
  return postingCache.get(key)!;
}

export const getJobPosting = tool(
  async ({ url: raw }) => {
    const posting = await readJobPosting(raw);
    if (!posting.ok) {
      if (!posting.host) {
        return pack({ content: 'That is not a public job posting URL. Ask the visitor to paste the job description instead.', citedProjectIds: [] });
      }
      return pack({
        content: `Could not read the posting at ${posting.host}: ${posting.reason}. Tell the visitor this reason in plain words and ask them to paste the job description${
          posting.status === 404 ? ' or check the link' : ''
        }.`,
        citedProjectIds: [],
      });
    }
    const { host, title, text } = posting;
    return pack({
      content: `Job posting from ${host}${title ? ` — ${title}` : ''}:\n\n${text.slice(0, 12000)}${
        text.length > 12000 ? '\n[truncated]' : ''
      }\n\nNext: extract the concrete requirements and call assess_job_fit with the role title.`,
      citedProjectIds: [],
    });
  },
  {
    name: 'get_job_posting',
    description:
      "Use only when the visitor shares a job posting URL (or one is in the conversation) and the answer depends on what that posting asks for: 'here's the role', 'how does he line up with this posting?', 'does he have the technologies it mentions?'. Returns the posting's readable text. Then call assess_job_fit with its requirements.",
    schema: z.object({
      url: z.string().describe('The job posting URL'),
    }),
  }
);

export const showDemo = tool(
  async ({ project: name, view }) => {
    const project = findProjectByName(name);
    if (!project) {
      return pack({ content: `No project named "${name}". Available projects: ${catalog.map((p) => p.title).join(', ')}.`, citedProjectIds: [] });
    }
    // The narrated walkthrough when there is one, otherwise the home grid's recording.
    const card = projectCards.find((p) => p.id === project.id);
    const video = project.video ?? (card?.video ? { src: card.video.src, poster: card.video.poster ?? project.image } : undefined);
    const liveUrl = project.link;
    const appStoreUrl = (await getProjectResources(project.id).catch(() => [])).find((r) => r.type === 'app-store')?.url;
    if (!video && !liveUrl) {
      return pack({
        content: `${project.title} has no walkthrough recording or live version to show${project.category === 'macOS Apps' ? ' (it is a personal-use Mac app)' : ''}. Link its page on this site exactly as [its project page](${project.href}), a relative link with no domain.`,
        citedProjectIds: [project.id],
      });
    }
    const initial: 'video' | 'live' = view === 'live' && liveUrl ? 'live' : video ? 'video' : 'live';
    const native = project.category !== 'Web Apps';
    const parts = [
      video && 'the walkthrough video',
      liveUrl && (native ? `its website (${liveUrl})` : `the live app (${liveUrl})`),
      appStoreUrl && 'an App Store button to install it',
    ].filter(Boolean);
    return pack({
      content: `A demo card is shown for ${project.title} with ${parts.join(' and ')}, opening on the ${initial === 'video' ? 'video' : native ? 'website' : 'live app'}${
        parts.length > 1 ? '; the visitor can switch between them' : ''
      }. ${view === 'live' && native ? `${project.title} is a native ${project.category === 'iOS Apps' ? 'iOS' : 'Mac'} app, so it cannot run in the browser; say so in a clause. ` : ''}${
        !native && liveUrl ? 'The live app may ask them to sign in or use a demo account. ' : ''
      }Keep the reply to one or two sentences and do not paste the links.`,
      citedProjectIds: [project.id],
      widget: { kind: 'demo', project: toCard(project), video, liveUrl, appStoreUrl, initial },
    });
  },
  {
    name: 'show_demo',
    description:
      "Use when the visitor wants to see a product working rather than read about it: 'show me a demo', 'can I see it in action?', 'play the walkthrough', 'let me try OnTract', 'open the live app'. Plays the walkthrough video, or opens the live app inside the chat, for one project. Use view 'live' when they ask to try, use, or open the app itself; otherwise 'video'. If they say 'it', use the project being discussed.",
    schema: z.object({
      project: z.string().describe("Project name, e.g. 'OnTract', 'Sentio+'"),
      view: z.enum(['video', 'live']).optional().describe("'video' for the walkthrough (default), 'live' to open the running app"),
    }),
  }
);

export const getJourney = tool(
  async () =>
    pack({
      content: journey
        .map((node) => `${node.period}: ${node.title}${node.caption ? ` — ${node.caption}` : ''}${node.projects ? ` [${node.projects.map((p) => p.title).join(', ')}]` : ''}`)
        .join('\n')
        .concat('\n\nThe flowchart shows every step, so write at most two sentences: the arc of his path, not the list.'),
      citedProjectIds: [...new Set(journey.flatMap((node) => node.projects?.map((p) => p.id) ?? []))],
      widget: { kind: 'journey', nodes: journey },
    }),
  {
    name: 'get_journey',
    description:
      "Use when the visitor asks how Kyle-Anthony's experience developed over time: his path, story, progression, 'how did he get into AI?', 'what has he done over the past few years?', 'walk me through his background'. Shows a flowchart of work, school, and the projects at each step.",
    schema: z.object({}),
  }
);

export const bookTime = tool(
  async () => {
    const url = process.env.NEXT_PUBLIC_CALENDLY_URL || undefined;
    return pack({
      content: url
        ? 'A booking card with Kyle-Anthony\'s calendar is shown. Keep the reply to one short sentence.'
        : `A card is shown with his email (${profile.email}) and contact page for scheduling. Keep the reply to one short sentence.`,
      citedProjectIds: [],
      widget: { kind: 'book_time', url, email: profile.email, contactPage: profile.contactPage },
    });
  },
  {
    name: 'book_time',
    description:
      "Use when the visitor wants to talk to Kyle-Anthony directly: book a call, schedule an interview or intro chat, meet, or 'how do I get in touch to set something up?'. Shows a booking card.",
    schema: z.object({}),
  }
);

export const sendNote = tool(
  async ({ message, name, email }) =>
    pack({
      content:
        'A note card is shown with your draft, ready for the visitor to check, add their email, and press Send. Nothing has been sent yet, so never say it was. Keep the reply to one short sentence.',
      citedProjectIds: [],
      widget: {
        kind: 'note',
        draft: message.trim(),
        name: name?.trim() || undefined,
        email: email?.trim() || undefined,
        configured: isEmailConfigured(),
        fallbackEmail: profile.email,
      },
    }),
  {
    name: 'send_note',
    description:
      "Use when the visitor wants to leave Kyle-Anthony a message or have him get back to them: 'can you pass this on?', 'tell him I'm interested', 'I'd like him to reach out', 'leave a note', 'how do I contact him about this role?'. Shows a note card prefilled with your draft that the visitor edits and sends themselves; the chat so far is attached to the email. For booking a call, use book_time instead.",
    schema: z.object({
      message: z
        .string()
        .describe("A draft in the visitor's own voice, first person, from what they said (2-4 sentences, e.g. who they are, the role, what they'd like). Never invent details they did not give."),
      name: z.string().optional().describe('Their name, only if they gave it'),
      email: z.string().optional().describe('Their email, only if they gave it'),
    }),
  }
);

/** Page count and size of the résumé PDF in public/, for the card's caption. */
async function resumeFileFacts(): Promise<{ pages?: number; size?: string }> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), 'public', profile.resumePdf.replace(/^\//, '')));
    // The page tree's root carries the total in /Count; outlines can too, so prefer the /Pages one.
    const text = file.toString('latin1');
    const count = text.match(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/) ?? text.match(/\/Count\s+(\d+)/);
    const pages = Number(count?.[1]);
    return { pages: pages > 0 ? pages : undefined, size: `${Math.max(1, Math.round(file.byteLength / 1024))} KB` };
  } catch {
    return {};
  }
}

export const getResume = tool(
  async () => {
    const facts = await resumeFileFacts();
    return pack({
      content:
        "A résumé card is shown with buttons to view his résumé in the browser and download the PDF. Keep the reply to one short sentence; do not paste the links.",
      citedProjectIds: [],
      widget: {
        kind: 'resume',
        name: profile.name,
        headline: profile.headline,
        viewUrl: profile.resumePage,
        downloadUrl: profile.resumePdf,
        ...facts,
      },
    });
  },
  {
    name: 'get_resume',
    description:
      "Use when the visitor asks for Kyle-Anthony's résumé or CV: to see it, view it, download it, or get a copy. Shows a résumé card with view and download links.",
    schema: z.object({}),
  }
);

export const allTools = [
  checkExperience,
  getExperience,
  getProject,
  listProjects,
  getBackground,
  searchBackground,
  askVisitor,
  getProjectResource,
  showDemo,
  getJobPosting,
  getJourney,
  bookTime,
  sendNote,
  getResume,
];

/** Human labels for the activity line while a tool runs and after it finishes. */
export function describeToolCall(name: string, args: Record<string, unknown>): { running: string; done: string } {
  const str = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : '');
  switch (name) {
    case 'check_experience':
      return { running: `Checking ${str('technology')} experience`, done: `Checked ${str('technology')} experience` };
    case 'get_experience':
      return { running: 'Searching every project', done: 'Searched every project' };
    case 'get_project':
      return { running: `Reading ${findProjectByName(str('name'))?.title ?? str('name')}`, done: `Read ${findProjectByName(str('name'))?.title ?? str('name')}` };
    case 'get_project_resource':
      return { running: `Finding links for ${findProjectByName(str('project'))?.title ?? str('project')}`, done: `Found links for ${findProjectByName(str('project'))?.title ?? str('project')}` };
    case 'show_demo': {
      const title = findProjectByName(str('project'))?.title ?? str('project');
      return str('view') === 'live'
        ? { running: `Opening ${title}`, done: `Opened ${title}` }
        : { running: `Loading the ${title} walkthrough`, done: `Loaded the ${title} walkthrough` };
    }
    case 'get_job_posting':
      return { running: 'Reading the job posting', done: 'Read the job posting' };
    case 'get_journey':
      return { running: 'Mapping his journey', done: 'Mapped his journey' };
    case 'book_time':
      return { running: 'Opening his calendar', done: 'Opened his calendar' };
    case 'get_resume':
      return { running: 'Fetching his résumé', done: 'Fetched his résumé' };
    case 'send_note':
      return { running: 'Drafting a note to Kyle-Anthony', done: 'Drafted a note to Kyle-Anthony' };
    case 'list_projects':
      return { running: 'Gathering projects', done: 'Gathered projects' };
    case 'get_background': {
      const section = str('section').replace('_', ' ');
      return { running: `Looking up ${section}`, done: `Looked up ${section}` };
    }
    case 'search_background':
      return { running: `Searching background for “${str('query')}”`, done: `Searched background for “${str('query')}”` };
    case 'assess_job_fit': {
      const count = Array.isArray(args.requirements) ? args.requirements.length : 0;
      return count > 0
        ? { running: `Assessing fit across ${count} requirements`, done: `Assessed ${count} requirements` }
        : { running: 'Reading the posting and checking fit', done: 'Checked fit against the posting' };
    }
    case 'ask_visitor':
      return { running: 'Writing a question for you', done: 'Asked a question' };
    case 'generate_recruiter_brief':
      return { running: 'Writing a recruiter brief and checking each claim', done: 'Wrote a recruiter brief' };
    default:
      return { running: `Running ${name}`, done: `Ran ${name}` };
  }
}
