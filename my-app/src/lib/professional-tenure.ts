/** Candidate-confirmed dates; month precision is preserved rather than invented. */
export interface CareerPeriod {
  name: string;
  kind: 'employment' | 'internship' | 'independent' | 'training';
  start: string; // YYYY-MM
  end?: string; // YYYY-MM, inclusive; absent means ongoing
}

export const CAREER_PERIODS: CareerPeriod[] = [
  { name: 'Cognizant', kind: 'employment', start: '2025-11' },
  { name: 'The Difference', kind: 'internship', start: '2023-07', end: '2023-09' },
];

// Kyle confirmed on 2026-10-09 that these are his complete employed roles,
// apart from independent products. Update this alongside any new employment.
export const EMPLOYMENT_HISTORY_COMPLETE = true;
export const TENURE_CONFIRMATION = { asOf: '2026-10-09', fewerThanYears: 5 } as const;
const DAY = 86_400_000;
const YEAR_DAYS = 365.2425;

export function assessmentDay(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function monthStart(value: string, offset = 0): number {
  const [year, month] = value.split('-').map(Number);
  return Date.UTC(year, month - 1 + offset, 1);
}

/** Calendar anniversaries avoid turning exactly one ordinary year into <1 year. */
function calendarYears(start: number, end: number): number {
  if (end <= start) return 0;
  const from = new Date(start), to = new Date(end);
  const anniversary = (years: number) => Date.UTC(from.getUTCFullYear() + years, from.getUTCMonth(), from.getUTCDate());
  let whole = to.getUTCFullYear() - from.getUTCFullYear();
  if (anniversary(whole) > end) whole--;
  return whole + (end - anniversary(whole)) / (anniversary(whole + 1) - anniversary(whole));
}

function unionYears(intervals: [number, number][]): number {
  const sorted = intervals.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  let total = 0, left = 0, right = 0;
  for (const [start, end] of sorted) {
    if (start > right) { total += calendarYears(left, right); left = start; right = end; }
    else right = Math.max(right, end);
  }
  return total + calendarYears(left, right);
}

/** Bounds account for unspecified start/end days and overlapping jobs. */
export function tenureBounds(periods: CareerPeriod[], day: string, includeInternships = true) {
  const now = Date.parse(`${day}T00:00:00Z`);
  const qualifying = periods.filter(p => p.kind === 'employment' || (includeInternships && p.kind === 'internship'));
  const lower = qualifying.map(p => [monthStart(p.start, 1), Math.min(now, p.end ? monthStart(p.end) : now)] as [number, number]);
  const upper = qualifying.map(p => [monthStart(p.start), Math.min(now, p.end ? monthStart(p.end, 1) : now)] as [number, number]);
  return { minYears: unionYears(lower), maxYears: unionYears(upper) };
}

export function professionalTenureEvidence(day = assessmentDay(), includeInternships = true): string {
  const bounds = tenureBounds(CAREER_PERIODS, day, includeInternships);
  const months = `${Math.floor(bounds.minYears * 12)}-${Math.ceil(bounds.maxYears * 12)}`;
  return `Cognizant since November 2025${includeInternships ? ', plus The Difference internship (July-September 2023)' : '; internships excluded'}. He confirmed this is his complete employed history on 2026-10-09. Recorded dates support approximately ${months} months as of ${day}; exact start/end days are not recorded. Independent products and training are separate from employed tenure.`;
}

/** Only a complete history or an explicit candidate confirmation can establish a shortfall. */
export function professionalTenureVerdict(requiredYears: number, day = assessmentDay(), includeInternships = true): 'match' | 'related' | 'gap' {
  const bounds = tenureBounds(CAREER_PERIODS, day, includeInternships);
  if (bounds.minYears >= requiredYears) return 'match';
  if (EMPLOYMENT_HISTORY_COMPLETE && bounds.maxYears < requiredYears) return 'gap';
  const elapsedDays = (Date.parse(`${day}T00:00:00Z`) - Date.parse(`${TENURE_CONFIRMATION.asOf}T00:00:00Z`)) / DAY;
  // Grow the confirmed upper bound with calendar time, never double-counting concurrent work.
  if (elapsedDays >= 0 && requiredYears >= TENURE_CONFIRMATION.fewerThanYears + elapsedDays / YEAR_DAYS) return 'gap';
  return 'related';
}
