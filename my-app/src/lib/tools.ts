import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import fs from 'fs/promises';
import path from 'path';
import { getPersonalInfoDocument } from './content-store';
import { projects as projectCards } from './projects';
import { isEmailConfigured } from './email';
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

function describeEvidence(evidence: Evidence): string {
  const lines: string[] = [];
  const { displayName, since, years, projects, backgroundSnippets, related, skill } = evidence;

  if (!evidence.hasExperience) {
    lines.push(`No direct evidence of ${displayName} in Kyle-Anthony's projects or background.`);
    if (related.length > 0) lines.push(`Closest related strengths: ${related.join(', ')}.`);
    return lines.join('\n');
  }

  lines.push(
    `Kyle-Anthony has experience with ${displayName}${since ? ` since ${since} (about ${years} year${years === 1 ? '' : 's'})` : ''}${skill ? ` [${skill.group}]` : ''}.`
  );
  if (projects.length > 0) {
    lines.push('Projects where it appears:');
    projects.forEach(({ project, usage }) => lines.push(`- ${project.title}: ${usage}`));
  }
  if (backgroundSnippets.length > 0) {
    lines.push('Background notes:');
    backgroundSnippets.forEach((snippet) => lines.push(`- ${snippet}`));
  }
  return lines.join('\n');
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
}

let judgeModel: ChatOpenAI | null = null;
function getJudge(): ChatOpenAI {
  judgeModel ??= new ChatOpenAI({ model: process.env.OPENAI_JUDGE_MODEL ?? 'gpt-4.1-mini', temperature: 0 });
  return judgeModel;
}

function excerpt(hit: KnowledgeHit): string {
  const text = hit.text.replace(/\s+/g, ' ').trim();
  // Whole sections: the decisive line (an outcome, a stakeholder) is often the last one.
  return text.length > 2400 ? `${text.slice(0, 2400)}…` : text;
}

/** Retrieves candidate sections for each question and judges them in one model call. */
async function judgeEvidence(questions: string[], perQuestion = 6): Promise<JudgedItem[]> {
  const empty: JudgedItem = { verdict: 'none', projects: [] };
  if (questions.length === 0) return [];

  // Over-fetch, then keep at most two sections per project so one project's
  // many similar sections can't crowd out another project's single strong one.
  const hitLists = await Promise.all(
    questions.map((question) =>
      searchKnowledge(question, { recordType: 'project', topK: Math.min(perQuestion * 3, 30) })
        .then((hits) => {
          const perProject = new Map<number, number>();
          return hits.filter((hit) => {
            const count = perProject.get(hit.projectId) ?? 0;
            perProject.set(hit.projectId, count + 1);
            return count < 2;
          }).slice(0, perQuestion);
        })
        .catch((error) => {
          console.error('judgeEvidence: search failed', error);
          return [] as KnowledgeHit[];
        })
    )
  );
  if (hitLists.every((hits) => hits.length === 0)) return questions.map(() => empty);

  const blocks = questions.map((question, i) => {
    const lines = hitLists[i].map(
      (hit, j) => `  [${i}.${j}] "${hit.projectName}" / ${hit.section}: ${excerpt(hit)}`
    );
    return `ITEM ${i}: ${question}\n${lines.join('\n') || '  (no excerpts)'}`;
  });

  try {
    const response = await getJudge()
      .bind({ response_format: { type: 'json_object' } })
      .invoke([
        new SystemMessage(
          `You check a software engineer's portfolio for evidence. The engineer is Kyle-Anthony Hay. For each ITEM, read only its excerpts and decide:
- "direct": an excerpt shows Kyle-Anthony himself built, used, or did this (on team projects, only the parts the excerpt attributes to him or the team he was on).
- "related": no direct use, but excerpts show clearly adjacent or transferable work.
- "none": nothing relevant.
List each relevant project once, strongest evidence first: "ref" is the excerpt id that best supports it (e.g. "0.3") and "why" (under 18 words) answers the ITEM itself, not a generic project summary, stating concretely what he did. Be strict: leave out projects whose excerpts only loosely touch the ITEM, and never upgrade a claim (a take-home brief is not a client; a team project is not solo work). Never infer beyond the excerpts. Return JSON: {"items":[{"index":0,"verdict":"direct|related|none","projects":[{"ref":"0.3","why":"..."}]}]}`
        ),
        new HumanMessage(blocks.join('\n\n')),
      ]);
    const text = typeof response.content === 'string' ? response.content : '';
    const parsed = JSON.parse(text) as {
      items?: { index?: number; verdict?: string; projects?: { ref?: string; why?: string }[] }[];
    };
    return questions.map((_, i) => {
      const item = parsed.items?.find((candidate) => candidate.index === i);
      if (!item) return empty;
      const verdict: Verdict = item.verdict === 'direct' || item.verdict === 'related' ? item.verdict : 'none';
      const seen = new Set<number>();
      const projects = (item.projects ?? []).flatMap((p) => {
        const j = Number(String(p.ref ?? '').split('.')[1]);
        const hit = Number.isInteger(j) ? hitLists[i][j] : undefined;
        if (!hit || !projectById(hit.projectId) || seen.has(hit.projectId)) return [];
        seen.add(hit.projectId);
        return [{ id: hit.projectId, why: (p.why ?? '').trim(), section: hit.section }];
      });
      return { verdict: projects.length === 0 ? 'none' : verdict, projects };
    });
  } catch (error) {
    console.error('judgeEvidence: judge failed', error);
    return questions.map(() => empty);
  }
}

/* ------------------------------------------------------------------------ */
/* Tools                                                                     */
/* ------------------------------------------------------------------------ */

export const checkExperience = tool(
  async ({ technology }) => {
    const evidence = await gatherEvidence(technology);
    let content = describeEvidence(evidence);

    let projects = evidence.projects.slice(0, 4);
    let hasExperience = evidence.hasExperience;

    if (!evidence.hasExperience) {
      // No keyword evidence: let the knowledge base and the judge find adjacent work.
      const [judged] = await judgeEvidence([`Experience with ${technology}`]);
      if (judged && judged.verdict !== 'none') {
        hasExperience = judged.verdict === 'direct';
        projects = judged.projects.slice(0, 4).map(({ id, why }) => ({ project: toCard(projectById(id)!), usage: why }));
        content = hasExperience
          ? `Kyle-Anthony has worked with ${evidence.displayName} (from project write-ups, not a listed skill):\n${projects.map((p) => `- ${p.project.title}: ${p.usage}`).join('\n')}`
          : `${content}\n\nRelated (not direct) work:\n${projects.map((p) => `- ${p.project.title}: ${p.usage}`).join('\n')}`;
      }
    }

    const widget: Widget = {
      kind: 'experience_check',
      technology: evidence.displayName,
      hasExperience,
      since: evidence.since,
      years: evidence.years,
      category: evidence.skill?.group,
      projects,
      related: evidence.related,
    };

    return pack({
      content,
      citedProjectIds: projects.map(({ project }) => project.id),
      widget,
    });
  },
  {
    name: 'check_experience',
    description:
      "Verify whether Kyle-Anthony has experience with a specific technology, framework, language, platform, or discipline, with start year and the projects where it appears. Use for any 'does he know / has he used / how long has he worked with X' question. Call once per technology.",
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
      return pack({
        content: `No project named "${name}". Available projects: ${catalog.map((p) => p.title).join(', ')}.`,
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
      name: z.string().describe("Project name, e.g. 'SelahNote', 'OnTract', 'V1 ProdBot'"),
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
          content: `${content}\n\nExperience includes professional work, freelance projects, hackathons, and production-level personal apps. Has worked on teams of 15+ developers and led small teams.`,
          citedProjectIds: [],
          widget: { kind: 'timeline', items: timeline },
        });
      }
      case 'work_status':
      case 'contact': {
        const content = [
          `${profile.name} — ${profile.headline}, based in ${profile.location}.`,
          ...profile.availability,
          ...contactLinks.map((link) => `${link.label}: ${link.detail ?? link.href}`),
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

const YEARS_PATTERN = /(\d+)\s*\+?\s*(?:years?|yrs?)/i;

async function assessRequirement(requirement: string): Promise<FitRequirement> {
  const text = requirement.trim();
  const lower = text.toLowerCase();
  const currentYear = new Date().getFullYear();

  // Non-technical requirements the corpus answers directly.
  if (/\b(degree|bachelor|b\.?s\.?|computer science|cs\b)/i.test(lower)) {
    return {
      requirement: text,
      status: 'match',
      evidence: 'B.S. Computer Science, CUNY Hunter College (2024).',
      projects: [],
    };
  }
  if (/\b(team|collaborat|communicat|agile|scrum|code review|cross-functional|leadership|mentor)/i.test(lower)) {
    return {
      requirement: text,
      status: 'match',
      evidence: 'Worked on teams of 15+ developers, led small teams, comfortable with ownership and code reviews.',
      projects: [],
    };
  }

  const skills = findSkillsInText(text);
  const whole = findSkill(text);
  if (whole && !skills.some((match) => match.skill.name === whole.skill.name)) skills.unshift(whole);

  const yearsMatch = YEARS_PATTERN.exec(text);
  const requiredYears = yearsMatch ? parseInt(yearsMatch[1], 10) : null;

  if (skills.length === 0) {
    // Maybe a discipline ("mobile development") or a generic years-of-experience line.
    const discipline = findSkill(text.replace(YEARS_PATTERN, '').replace(/\b(of|in|with|experience|professional)\b/gi, '').trim());
    if (discipline?.skill.since) {
      const years = currentYear - discipline.skill.since;
      const enough = requiredYears === null || years >= requiredYears;
      return {
        requirement: text,
        status: enough ? 'match' : 'related',
        evidence: `${discipline.skill.name} since ${discipline.skill.since} (~${years} years)${enough ? '' : `, short of the ${requiredYears} asked for`}.`,
        projects: [],
      };
    }
    if (requiredYears !== null && /experience/i.test(text)) {
      const years = currentYear - 2022;
      const enough = years >= requiredYears;
      return {
        requirement: text,
        status: enough ? 'match' : 'related',
        evidence: `Building software since 2022 (~${years} years across professional, freelance, and production side projects).`,
        projects: [],
      };
    }
    const related = relatedStrengthsFor(text);
    const evidenceList = await Promise.all(
      text
        .split(/[,/]|\bor\b|\band\b/i)
        .map((part) => part.trim())
        .filter((part) => part.length >= 2 && part.length <= 40)
        .slice(0, 3)
        .map(gatherEvidence)
    );
    const found = evidenceList.find((evidence) => evidence.hasExperience);
    if (found) {
      const [projectLine] = found.projects;
      return {
        requirement: text,
        status: found.strong ? 'match' : 'related',
        evidence: found.strong
          ? describeEvidence(found).split('\n')[0]
          : `Comes up in ${found.projects.map(({ project }) => project.title).join(', ')}${projectLine ? ` (${projectLine.usage})` : ''}, though it is not a listed skill.`,
        projects: found.projects.slice(0, 3).map(({ project }) => project),
      };
    }
    return {
      requirement: text,
      status: related.length > 0 ? 'related' : 'gap',
      evidence:
        related.length > 0
          ? `No direct experience, but adjacent strengths in ${related.join(', ')}.`
          : 'No direct evidence in the portfolio.',
      projects: [],
    };
  }

  const evidences = await Promise.all(skills.slice(0, 3).map((match) => gatherEvidence(match.skill.name)));
  const sinceYears = evidences.map((e) => e.years ?? 0).filter(Boolean);
  const bestYears = sinceYears.length > 0 ? Math.max(...sinceYears) : null;
  const meetsYears = requiredYears === null || bestYears === null || bestYears >= requiredYears;

  const projects = [...new Map(evidences.flatMap((e) => e.projects).map((p) => [p.project.id, p.project])).values()].slice(0, 3);
  const summary = evidences
    .map((e) => `${e.displayName}${e.since ? ` since ${e.since} (~${e.years}y)` : ''}`)
    .join(', ');

  let status: FitStatus = 'match';
  if (!meetsYears) status = 'related';

  return {
    requirement: text,
    status,
    evidence: `${summary}${projects.length > 0 ? ` · used in ${projects.map((p) => p.title).join(', ')}` : ''}${
      meetsYears ? '' : ` · short of the ${requiredYears} years asked for`
    }.`,
    projects,
  };
}

export const assessJobFit = tool(
  async ({ role, requirements }) => {
    const trimmed = requirements.map((r) => r.trim()).filter(Boolean).slice(0, 12);
    const results = await Promise.all(trimmed.map(assessRequirement));

    // Keyword matching misses work described in prose (fine-tuning a transformer
    // is deep learning; an ETL and analytics dashboard is data analysis), so
    // weak rows get a second look against the project write-ups.
    const weak = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'gap' || (result.projects.length === 0 && !/degree|team|bachelor/i.test(result.requirement)));
    if (weak.length > 0) {
      const judged = await judgeEvidence(weak.map(({ result }) => result.requirement), 5);
      weak.forEach(({ result, index }, i) => {
        const verdict = judged[i];
        if (!verdict || verdict.verdict === 'none') return;
        const projects = verdict.projects.slice(0, 3).map(({ id }) => toCard(projectById(id)!));
        const lead = verdict.projects[0];
        results[index] = {
          ...result,
          status: verdict.verdict === 'direct' && result.status !== 'related' ? 'match' : result.status === 'match' ? 'match' : 'related',
          evidence:
            result.status === 'gap'
              ? `${lead.why}${verdict.verdict === 'related' ? ' (adjacent, not a direct match)' : ''}`
              : result.evidence,
          projects,
        };
      });
    }
    const summary = {
      match: results.filter((r) => r.status === 'match').length,
      related: results.filter((r) => r.status === 'related').length,
      gap: results.filter((r) => r.status === 'gap').length,
    };

    const content = [
      `Fit assessment${role ? ` for ${role}` : ''}: ${summary.match} match, ${summary.related} related, ${summary.gap} gap out of ${results.length}.`,
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
        .max(12)
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
        }. Its page on this site is ${project.href}.`,
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
export function readJobPosting(raw: string): Promise<JobPostingRead> {
  const url = isPublicUrl(raw.trim());
  if (!url) return Promise.resolve({ ok: false, status: 0, reason: 'that is not a public web address' });
  const key = url.toString();
  if (!postingCache.has(key)) {
    const read = (async (): Promise<JobPostingRead> => {
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
      const title = html && !text.startsWith('Title:') ? metaContent(html, 'og:title') ?? /<title[^>]*>([^<]*)/i.exec(html)?.[1]?.trim() : undefined;
      return { ok: true, host: url.hostname, title: title ? decodeEntities(title) : undefined, text };
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
    if (!video && !liveUrl) {
      return pack({
        content: `${project.title} has no walkthrough recording or live version to show${project.category === 'macOS Apps' ? ' (it is a personal-use Mac app)' : ''}. Its page on this site is ${project.href}.`,
        citedProjectIds: [project.id],
      });
    }
    const initial: 'video' | 'live' = view === 'live' && liveUrl ? 'live' : video ? 'video' : 'live';
    const native = project.category !== 'Web Apps';
    const parts = [video && 'the walkthrough video', liveUrl && (native ? `its website (${liveUrl})` : `the live app (${liveUrl})`)].filter(Boolean);
    return pack({
      content: `A demo card is shown for ${project.title} with ${parts.join(' and ')}, opening on the ${initial === 'video' ? 'video' : native ? 'website' : 'live app'}${
        parts.length > 1 ? '; the visitor can switch between them' : ''
      }. ${view === 'live' && native ? `${project.title} is a native ${project.category === 'iOS Apps' ? 'iOS' : 'Mac'} app, so it cannot run in the browser; say so in a clause. ` : ''}${
        !native && liveUrl ? 'The live app may ask them to sign in or use a demo account. ' : ''
      }Keep the reply to one or two sentences and do not paste the links.`,
      citedProjectIds: [project.id],
      widget: { kind: 'demo', project: toCard(project), video, liveUrl, initial },
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
  assessJobFit,
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
      return { running: `Assessing fit across ${count} requirements`, done: `Assessed ${count} requirements` };
    }
    case 'ask_visitor':
      return { running: 'Writing a question for you', done: 'Asked a question' };
    default:
      return { running: `Running ${name}`, done: `Ran ${name}` };
  }
}
