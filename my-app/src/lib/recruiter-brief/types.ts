/**
 * The recruiter brief as data. The model decides what goes in it; the
 * components in components/brief decide how it looks, on the web and in
 * the PDF. Stored as-is, so a brief reads the same every time its link opens.
 */

export type MatchLevel = 'strong' | 'relevant' | 'gap';

export interface RoleMatch {
  requirement: string;
  assessment: MatchLevel;
  evidence: string;
  /** False when the posting lists it as a nice-to-have. */
  required: boolean;
  /** The job itself ("experience as a data scientist in finance") rather than one skill. */
  core?: boolean;
  projectIds: number[];
}

/** How far the recommendation may go, set by the fit check rather than the writer. */
export type RecommendationLevel = 'advance' | 'screen' | 'conditional' | 'decline';

export interface RecruiterBrief {
  candidateSummary: string;
  roleMatches: RoleMatch[];
  reasonsToConsider: { title: string; explanation: string; evidenceIds: string[] }[];
  projects: { projectId: number; relevance: string; evidence: string[]; evidenceIds: string[] }[];
  standoutSignal: { title: string; explanation: string; evidenceIds: string[] } | null;
  validationAreas: string[];
  interviewQuestions: { question: string; rationale: string }[];
  recommendation: { nextStep: string; rationale: string; level: RecommendationLevel };
  /** The fit check's overall read; absent for a general brief with no posting. */
  overallRead?: string;
  /** How many claims the second model checked, and how many it rewrote or removed. */
  verification?: { checked: number; rewritten: number; removed: number };
}

/** One piece of portfolio evidence the brief was allowed to cite. */
export interface EvidenceReference {
  id: string;
  kind: 'section' | 'fit' | 'profile';
  projectId?: number;
  projectName?: string;
  section?: string;
  excerpt: string;
}

/** The persisted record. Field names follow the recruiterBriefs table in the plan. */
export interface StoredBrief {
  publicId: string;
  createdAt: number;
  roleTitle?: string;
  companyName?: string;
  jobDescription?: string;
  generatedBrief: RecruiterBrief;
  evidenceReferences: EvidenceReference[];
  version: number;
}

export const BRIEF_VERSION = 1;
