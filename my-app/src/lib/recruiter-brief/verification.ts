import type { RoleMatch } from './types';

export type ClaimVerdict = 'supported' | 'overstated' | 'unsupported' | 'unknown';
export interface VerdictRow { index?: number; verdict?: string; fixed?: string }

/** Missing, duplicated or malformed verdicts are never positive evidence. */
export function claimVerdict(items: VerdictRow[] | undefined, index: number): { verdict: ClaimVerdict; fixed?: string } {
  const rows = Array.isArray(items) ? items.filter((row) => row?.index === index) : [];
  const row = rows.length === 1 ? rows[0] : undefined;
  if (!row || !['supported', 'overstated', 'unsupported'].includes(row.verdict ?? '')) return { verdict: 'unknown' };
  const raw = typeof row.fixed === 'string' ? row.fixed.trim() : '';
  const fixed = raw && !/^(no evidence|there is no|nothing|not (shown|supported|stated)|the evidence does not)/i.test(raw) ? raw : undefined;
  return { verdict: row.verdict as ClaimVerdict, fixed };
}

export function markNeedsReview(match: RoleMatch): void {
  match.assessment = 'gap';
  match.verificationStatus = 'unknown';
  match.evidence = 'Unknown — needs review: a complete verification verdict is unavailable.';
  match.projectIds = [];
}
