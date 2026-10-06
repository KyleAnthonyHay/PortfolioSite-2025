import type { MatchLevel, RecommendationLevel } from './types';
import { briefTitle, type BriefView } from './view';

/**
 * The brief cut to one page, shared by the web page and the PDF so both say
 * the same few things: a short snapshot, the role match with project names as
 * evidence, and one line each for the rest. The full brief stays in storage;
 * this only decides what fits.
 */

/** The site's one colour accent (--olive in globals.css). */
export const ACCENT = '#10b981';

export interface OnePagerRow {
  requirement: string;
  level: MatchLevel;
  evidence: string;
  core: boolean;
}

export interface OnePager {
  title: string;
  snapshot: string;
  verdict: { nextStep: string; reason: string; level: RecommendationLevel };
  rows: OnePagerRow[];
  /** Nice-to-haves that didn't fit as rows, by name. */
  moreRows: number;
  why: string[];
  work: { title: string; href: string; line: string }[];
  validate: string[];
  questions: string[];
  general: boolean;
}

const MAX_ROWS = 7;

/** Sentence ends, but not inside "B.S." or "e.g.": the period must follow a lowercase letter, digit or bracket. */
const SENTENCE_END = /(?<=[A-Za-z0-9)\]”"]{2}[.!?])\s+(?=[A-Z“"])/;

function sentences(text: string, count: number): string {
  return text.replace(/\s+/g, ' ').trim().split(SENTENCE_END).slice(0, count).join(' ').trim();
}

/** Short enough to read at a glance: the first clause, capped. */
function clause(text: string, max = 90): string {
  const first = text.replace(/\s+/g, ' ').trim().split(SENTENCE_END)[0].split(/(?<=[;:])\s|\s[—–]\s/)[0].replace(/[.;:]$/, '');
  return first.length > max ? `${first.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : first;
}

export const LEVEL_WORD: Record<MatchLevel, string> = { strong: 'Strong', relevant: 'Relevant', gap: 'Gap' };

export const VERDICT_WORD: Record<RecommendationLevel, string> = {
  advance: 'Recommended',
  screen: 'Worth a call',
  conditional: 'Conditional',
  decline: 'Not recommended',
};

/**
 * Rough height of the PDF page in points, from line counts at the PDF's
 * column widths. Letter leaves about 714pt; the estimate is deliberately
 * pessimistic so the real page always has room.
 */
function lines(text: string, charsPerLine: number): number {
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

function estimateHeight(page: OnePager): number {
  let h = 44 + 20; // header
  h += 11 + 20 + lines(page.snapshot, 100) * 15 + (lines(`Recommendation: ${page.verdict.nextStep}. ${page.verdict.reason}`, 95) * 15 + 12) + 8;
  if (page.rows.length > 0) {
    h += 16 + 14;
    for (const row of page.rows) h += Math.max(lines(row.requirement, 44), lines(row.evidence, 30)) * 13 + 10;
    if (page.moreRows > 0) h += 12;
  }
  if (page.why.length || page.work.length) h += 14 + 11 + Math.max(page.why.length, page.work.length) * 17;
  if (page.validate.length || page.questions.length) {
    h += 14 + 11 + Math.max(
      page.validate.reduce((sum, line) => sum + lines(line, 42) * 13.5 + 5, 0),
      page.questions.reduce((sum, line) => sum + lines(line, 42) * 13.5 + 5, 0)
    );
  }
  return h;
}

const PAGE_BUDGET = 720;

/** Trims the page until it fits, least important things first. */
function fitToPage(page: OnePager): OnePager {
  const steps: ((p: OnePager) => boolean)[] = [
    (p) => (p.questions.length > 1 ? (p.questions = p.questions.slice(0, 1), true) : false),
    (p) => (p.validate.length > 1 ? (p.validate = p.validate.slice(0, 1), true) : false),
    (p) => (p.rows.length > 6 ? ((p.moreRows += p.rows.length - 6), (p.rows = p.rows.slice(0, 6)), true) : false),
    (p) => {
      const one = sentences(p.snapshot, 1);
      if (one.length < p.snapshot.length) {
        p.snapshot = one;
        return true;
      }
      return false;
    },
    (p) => (p.rows.length > 5 ? ((p.moreRows += p.rows.length - 5), (p.rows = p.rows.slice(0, 5)), true) : false),
    (p) => (p.why.length > 2 ? (p.why = p.why.slice(0, 2), true) : false),
  ];
  for (const step of steps) {
    if (estimateHeight(page) <= PAGE_BUDGET) break;
    step(page);
  }
  return page;
}

function buildOnePager(view: BriefView): OnePager {
  const { brief, projectNames } = view;
  const ordered = [...brief.roleMatches.filter((m) => m.required), ...brief.roleMatches.filter((m) => !m.required)];
  const shown = ordered.slice(0, MAX_ROWS);

  const rows = shown.map((match) => {
    const names = match.projectIds.map((id) => projectNames[id]?.title).filter(Boolean) as string[];
    let evidence: string;
    if (match.assessment === 'gap') evidence = 'Not shown in his portfolio';
    else if (names.length > 0) evidence = names.slice(0, 3).join(', ');
    else evidence = clause(match.evidence, 72);
    return { requirement: clause(match.requirement, 120), level: match.assessment, evidence, core: Boolean(match.core) };
  });

  return {
    title: briefTitle(view),
    // Two sentences when they fit in three lines, otherwise one.
    snapshot: sentences(brief.candidateSummary, 2).length > 220 ? sentences(brief.candidateSummary, 1) : sentences(brief.candidateSummary, 2),
    verdict: { nextStep: brief.recommendation.nextStep.replace(/\.\s*$/, ''), reason: sentences(brief.recommendation.rationale, 1), level: brief.recommendation.level },
    rows,
    moreRows: ordered.length - shown.length,
    why: brief.reasonsToConsider.slice(0, 3).map((reason) => reason.title),
    work: view.projects.slice(0, 3).map((project) => ({ title: project.title, href: project.href, line: clause(project.relevance.replace(/^(Shows|Demonstrates|Illustrates)\s+/i, (m) => m), 60) })),
    validate: brief.validationAreas.slice(0, 3).map((area) => clause(area, 80)),
    // The question itself, without its "If not, how would you…" follow-up.
    questions: brief.interviewQuestions.slice(0, 2).map((q) => sentences(q.question, 1)),
    general: brief.roleMatches.length === 0,
  };
}

export function toOnePager(view: BriefView): OnePager {
  return fitToPage(buildOnePager(view));
}
