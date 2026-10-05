import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getPersonalInfoDocument, getProjectDocuments, getProjectDocumentsByName } from './content-store';
import { searchProjectEmbeddings } from './pinecone';
import {
  catalog,
  findProjectByCorpusName,
  findProjectByName,
  projectStackText,
  toCard,
  type CatalogProject,
} from './project-catalog';
import {
  contactLinks,
  findSkill,
  findSkillsInText,
  profile,
  relatedStrengthsFor,
  timeline,
  toSkillGroups,
  type SkillMatch,
} from './profile';
import type { EvidenceProject, FitRequirement, FitStatus, Widget } from './chat-events';

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

  const [projectDocs, personalInfo] = await Promise.all([getProjectDocuments(), getPersonalInfoDocument()]);

  for (const doc of projectDocs) {
    const project = findProjectByCorpusName(doc.projectName);
    if (!project || seen.has(project.id)) continue;
    const chunk = doc.chunks.find((candidate) => containsAny(candidate.content, patterns));
    if (chunk) {
      projects.push({ project: toCard(project), usage: snippetAround(chunk.content, patterns, 110) });
      seen.add(project.id);
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
/* Tools                                                                     */
/* ------------------------------------------------------------------------ */

export const checkExperience = tool(
  async ({ technology }) => {
    const evidence = await gatherEvidence(technology);
    let content = describeEvidence(evidence);

    if (!evidence.hasExperience) {
      // Give the model something adjacent to talk about instead of a flat no.
      try {
        const semantic = await searchProjectEmbeddings(technology, 3, 0.35, { record_type: { $eq: 'project' } });
        if (semantic.length > 0) {
          content += `\n\nSemantically related work (not direct evidence): ${[
            ...new Set(semantic.map((hit) => findProjectByCorpusName(hit.project_name)?.title ?? hit.project_name)),
          ].join(', ')}.`;
        }
      } catch {
        // Vector search is best-effort here.
      }
    }

    const widget: Widget = {
      kind: 'experience_check',
      technology: evidence.displayName,
      hasExperience: evidence.hasExperience,
      since: evidence.since,
      years: evidence.years,
      category: evidence.skill?.group,
      projects: evidence.projects.slice(0, 4),
      related: evidence.related,
    };

    return pack({
      content,
      citedProjectIds: evidence.projects.map(({ project }) => project.id),
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

export const searchProjects = tool(
  async ({ query }) => {
    const matched = new Map<number, { project: CatalogProject; snippet: string; score: number }>();

    try {
      const hits = await searchProjectEmbeddings(query, 6, 0.3, { record_type: { $eq: 'project' } });
      hits.forEach((hit) => {
        const project = findProjectByCorpusName(hit.project_name);
        if (!project) return;
        const existing = matched.get(project.id);
        if (!existing || existing.score < hit.similarity) {
          matched.set(project.id, {
            project,
            snippet: hit.content.replace(/\s+/g, ' ').slice(0, 420),
            score: hit.similarity,
          });
        }
      });
    } catch (error) {
      console.error('search_projects: vector search failed', error);
    }

    // Keyword pass so a technology name always finds the projects that list it.
    const skills = findSkillsInText(query);
    const patterns = [query, ...skills.flatMap((match) => [match.skill.name, ...(match.skill.aliases ?? [])])]
      .filter((value) => value.length >= 3)
      .map(termPattern);
    for (const project of catalog) {
      if (matched.has(project.id)) continue;
      const usage = stackUsage(project, patterns);
      if (usage || containsAny(`${project.overview} ${project.description}`, patterns)) {
        matched.set(project.id, { project, snippet: usage ?? project.overview, score: 0.25 });
      }
    }

    const ranked = [...matched.values()].sort((a, b) => b.score - a.score).slice(0, 5);

    if (ranked.length === 0) {
      return pack({
        content: `No projects matched "${query}". Kyle-Anthony's projects are: ${catalog.map((p) => p.title).join(', ')}.`,
        citedProjectIds: [],
      });
    }

    const content = ranked
      .map(({ project, snippet }) => `## ${project.title} (${project.category}) — ${project.tagline}\n${snippet}`)
      .join('\n\n');

    return pack({
      content,
      citedProjectIds: ranked.map(({ project }) => project.id),
      widget: { kind: 'projects', projects: ranked.slice(0, 4).map(({ project }) => toCard(project)) },
    });
  },
  {
    name: 'search_projects',
    description:
      "Semantic search across Kyle-Anthony's projects for a topic, feature, technology, or problem space (e.g. 'real-time audio', 'RAG', 'payments', 'apps with authentication'). Returns matching projects with relevant excerpts and shows them as cards.",
    schema: z.object({
      query: z.string().describe('What to look for across the projects'),
    }),
  }
);

export const getProject = tool(
  async ({ name }) => {
    const project = findProjectByName(name);
    if (!project) {
      return pack({
        content: `No project named "${name}". Available projects: ${catalog.map((p) => p.title).join(', ')}.`,
        citedProjectIds: [],
      });
    }

    const docs = (
      await Promise.all(project.corpusNames.map((corpusName) => getProjectDocumentsByName(corpusName)))
    ).flat();
    const corpus = docs.map((doc) => doc.fullContent).join('\n\n');
    const stack = [
      project.techStack.frontend && `Frontend: ${project.techStack.frontend.join(', ')}`,
      project.techStack.backend && `Backend: ${project.techStack.backend.join(', ')}`,
      project.techStack.infrastructure && `Infrastructure: ${project.techStack.infrastructure.join(', ')}`,
    ]
      .filter(Boolean)
      .join('\n');

    const content = [
      `# ${project.title} — ${project.tagline} (${project.category})`,
      project.overview,
      stack,
      project.link ? `Live: ${project.link}` : null,
      project.github ? `Source: ${project.github}` : null,
      corpus ? `\n${corpus.slice(0, 3500)}${corpus.length > 3500 ? '\n[truncated]' : ''}` : null,
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
      'Get the full write-up for one project by name: overview, purpose, architecture, tech stack, and links. Shows a detailed project card. Use when the visitor asks about a specific project.',
    schema: z.object({
      name: z.string().describe("Project name, e.g. 'SelahNote', 'OnTract', 'YarnScript'"),
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
      const hits = await searchProjectEmbeddings(query, 4, 0.25, { record_type: { $eq: 'personal_info' } });
      if (hits.length > 0) {
        return pack({
          content: hits.map((hit) => hit.content.replace(/\s+/g, ' ').slice(0, 700)).join('\n\n'),
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

export const allTools = [
  checkExperience,
  searchProjects,
  getProject,
  listProjects,
  getBackground,
  searchBackground,
  assessJobFit,
];

/** Human labels for the activity line while a tool runs and after it finishes. */
export function describeToolCall(name: string, args: Record<string, unknown>): { running: string; done: string } {
  const str = (key: string) => (typeof args[key] === 'string' ? (args[key] as string) : '');
  switch (name) {
    case 'check_experience':
      return { running: `Checking ${str('technology')} experience`, done: `Checked ${str('technology')} experience` };
    case 'search_projects':
      return { running: `Searching projects for “${str('query')}”`, done: `Searched projects for “${str('query')}”` };
    case 'get_project':
      return { running: `Reading ${findProjectByName(str('name'))?.title ?? str('name')}`, done: `Read ${findProjectByName(str('name'))?.title ?? str('name')}` };
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
    default:
      return { running: `Running ${name}`, done: `Ran ${name}` };
  }
}
