import { profile } from '../profile';
import { projectById } from '../project-catalog';
import type { MatchLevel, RecommendationLevel, RecruiterBrief, StoredBrief } from './types';

/**
 * Everything the web brief, the chat preview and the PDF render, resolved
 * from a stored brief: the candidate header and each project's card data.
 * Kept serialisable so it can ride in a chat widget.
 */
export interface BriefProjectView {
  id: number;
  title: string;
  tagline: string;
  category: string;
  image: string;
  href: string;
  relevance: string;
  evidence: string[];
}

export interface BriefView {
  publicId: string;
  createdAt: number;
  roleTitle?: string;
  companyName?: string;
  candidate: {
    name: string;
    headline: string;
    location: string;
    photo: string;
    email: string;
    links: { label: string; href: string; display: string }[];
  };
  brief: RecruiterBrief;
  projects: BriefProjectView[];
  /** Project names for the evidence chips in Role Match. */
  projectNames: Record<number, { title: string; href: string }>;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://kyleanthonyhay.com').replace(/\/$/, '');

export const MATCH_LABEL: Record<MatchLevel, string> = { strong: 'Strong match', relevant: 'Relevant', gap: 'Gap' };

export const RECOMMENDATION_LABEL: Record<RecommendationLevel, string> = {
  advance: 'Recommended',
  screen: 'Worth a conversation',
  conditional: 'Conditional',
  decline: 'Not recommended',
};

export function toBriefView(record: StoredBrief): BriefView {
  const { brief } = { brief: record.generatedBrief };
  const ids = new Set<number>([...brief.projects.map((p) => p.projectId), ...brief.roleMatches.flatMap((m) => m.projectIds)]);
  const projectNames: BriefView['projectNames'] = {};
  for (const id of ids) {
    const project = projectById(id);
    if (project) projectNames[id] = { title: project.title, href: project.href };
  }

  return {
    publicId: record.publicId,
    createdAt: record.createdAt,
    roleTitle: record.roleTitle,
    companyName: record.companyName,
    candidate: {
      name: profile.name,
      headline: profile.headline,
      location: profile.location,
      photo: '/profile.jpg',
      email: profile.email,
      links: [
        { label: 'Portfolio', href: SITE_URL, display: SITE_URL.replace(/^https?:\/\//, '') },
        { label: 'GitHub', href: 'https://github.com/KyleAnthonyHay', display: 'github.com/KyleAnthonyHay' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyle-anthonyhay/', display: 'linkedin.com/in/kyle-anthonyhay' },
      ],
    },
    brief,
    projects: brief.projects.flatMap((item) => {
      const project = projectById(item.projectId);
      if (!project) return [];
      return [
        {
          id: project.id,
          title: project.title,
          tagline: project.tagline,
          category: project.category === 'iOS Apps' ? 'iOS App' : project.category === 'macOS Apps' ? 'macOS App' : 'Web App',
          image: project.image,
          href: project.href,
          relevance: item.relevance,
          evidence: item.evidence,
        },
      ];
    }),
    projectNames,
  };
}

export function briefTitle(view: Pick<BriefView, 'roleTitle' | 'companyName'>): string {
  if (view.roleTitle && view.companyName) return `${view.roleTitle}, ${view.companyName}`;
  return view.roleTitle ?? view.companyName ?? 'General candidate brief';
}
