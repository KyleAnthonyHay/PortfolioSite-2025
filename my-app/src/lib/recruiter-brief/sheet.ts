import type { FitStatus } from '../chat-events';
import { STATUS_LABEL } from '../fit-status';
import type { RecommendationLevel } from './types';
import { briefTitle, type BriefView } from './view';

/**
 * The brief is the fit check: the role, the recommendation, and every
 * requirement row with its evidence and projects, as the chat's fit card
 * shows them. The web page, the PDF, the Copy text and the email all set
 * this, so they say the same thing.
 */

export interface FitSheetRow {
  requirement: string;
  status: FitStatus;
  evidence: string;
  projects: { id: number; title: string; href: string; image?: string }[];
}

export interface FitSheet {
  title: string;
  general: boolean;
  verdict: { nextStep: string; reason: string; level: RecommendationLevel };
  summary: Record<FitStatus, number>;
  rows: FitSheetRow[];
}

const STATUS: Record<'strong' | 'relevant' | 'gap', FitStatus> = { strong: 'match', relevant: 'related', gap: 'gap' };

export const VERDICT_WORD: Record<RecommendationLevel, string> = {
  advance: 'Recommended',
  screen: 'Worth a call',
  conditional: 'Conditional',
  decline: 'Not recommended',
};

export { STATUS_LABEL };

export function toFitSheet(view: BriefView): FitSheet {
  const { brief, projectNames } = view;
  const ordered = [...brief.roleMatches.filter((m) => m.required), ...brief.roleMatches.filter((m) => !m.required)];
  const rows = ordered.map((match) => ({
    requirement: `${match.requirement}${match.required ? '' : ' (nice-to-have)'}`,
    status: match.verificationStatus === 'unknown' ? ('related' as const) : STATUS[match.assessment],
    evidence: match.evidence,
    projects: match.projectIds.flatMap((id) => (projectNames[id] ? [{ id, ...projectNames[id] }] : [])),
  }));
  return {
    title: briefTitle(view),
    general: rows.length === 0,
    verdict: { nextStep: brief.recommendation.nextStep.replace(/\.\s*$/, ''), reason: brief.recommendation.rationale, level: brief.recommendation.level },
    summary: {
      match: rows.filter((r) => r.status === 'match').length,
      related: rows.filter((r) => r.status === 'related').length,
      gap: rows.filter((r) => r.status === 'gap').length,
    },
    rows,
  };
}
