/**
 * Wire format shared by the chat API route and the chat UI. The route streams
 * one JSON event per line (ndjson); the client folds them into a message.
 * Widgets are the structured payloads tools attach to their results so the
 * UI can render cards instead of prose.
 */

import type { BriefView } from './recruiter-brief/view';

export type ProjectCategory = 'iOS Apps' | 'macOS Apps' | 'Web Apps';

export interface ProjectCardData {
  id: number;
  title: string;
  tagline: string;
  description: string;
  category: ProjectCategory;
  /** Static preview. Portrait previews are framed phones on a transparent bg. */
  image: string;
  orientation: 'portrait' | 'landscape';
  /** False when a portrait image is a bare screenshot that needs a drawn device frame. */
  framed: boolean;
  /** Walkthrough video; the detail card plays it in place of the image. */
  video?: { src: string; poster: string };
  /** Detail page on this site. */
  href: string;
  link?: string;
  github?: string;
  /** A handful of headline technologies for chips. */
  highlights: string[];
}

export interface TechStack {
  frontend?: string[];
  backend?: string[];
  infrastructure?: string[];
}

export interface SkillEntry {
  name: string;
  /** Year Kyle-Anthony started using it; omitted when the corpus only lists the skill. */
  since?: number;
}

export interface SkillGroup {
  name: string;
  skills: SkillEntry[];
}

export interface TimelineItem {
  kind: 'work' | 'education';
  title: string;
  org: string;
  period: string;
  detail?: string;
}

export interface ContactLink {
  kind: 'email' | 'linkedin' | 'github' | 'medium' | 'x' | 'instagram' | 'resume' | 'contact';
  label: string;
  href: string;
  detail?: string;
}

export interface EvidenceProject {
  project: ProjectCardData;
  /** One line on how the technology shows up in this project. */
  usage: string;
}

export type FitStatus = 'match' | 'related' | 'gap';

export interface FitRequirement {
  verificationStatus?: 'unknown';
  requirement: string;
  status: FitStatus;
  /** Short justification shown under the requirement. */
  evidence: string;
  projects: ProjectCardData[];
}

export interface Recommendation {
  project: ProjectCardData;
  /** One line on why this project is relevant to what the visitor asked. */
  why: string;
  /** The write-up section the evidence came from. */
  section?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface JourneyNode {
  id: string;
  kind: 'start' | 'work' | 'education' | 'project' | 'launch';
  period: string;
  title: string;
  caption?: string;
  projects?: { id: number; title: string; href: string }[];
}

export interface ProjectResource {
  type: 'website' | 'github' | 'app-store' | 'demo' | 'video' | 'docs' | 'case-study';
  title: string;
  url: string;
  description?: string;
  image?: string;
  domain: string;
}

export type Widget =
  | { kind: 'projects'; title?: string; projects: ProjectCardData[] }
  | { kind: 'project'; project: ProjectCardData; overview: string; techStack: TechStack }
  | {
      kind: 'experience_check';
      technology: string;
      hasExperience: boolean;
      since?: number;
      years?: number;
      category?: string;
      projects: EvidenceProject[];
      related: string[];
    }
  | { kind: 'skills'; groups: SkillGroup[] }
  | { kind: 'timeline'; items: TimelineItem[] }
  | {
      kind: 'contact';
      name: string;
      headline: string;
      location: string;
      availability: string[];
      links: ContactLink[];
    }
  | {
      kind: 'question';
      question: string;
      options: { label: string; detail?: string }[];
      allowOther: boolean;
    }
  | { kind: 'recommendations'; query: string; items: Recommendation[] }
  | { kind: 'journey'; nodes: JourneyNode[] }
  | { kind: 'resources'; project: ProjectCardData; resources: ProjectResource[] }
  | { kind: 'book_time'; url?: string; email: string; contactPage: string }
  | {
      kind: 'demo';
      project: ProjectCardData;
      /** Walkthrough recording, when there is one. */
      video?: { src: string; poster: string };
      /** The running product, opened in a frame. */
      liveUrl?: string;
      /** Native apps: where to install it. */
      appStoreUrl?: string;
      /** Which view opens first. */
      initial: 'video' | 'live';
    }
  | {
      kind: 'note';
      /** The agent's draft of the visitor's message, editable before sending. */
      draft: string;
      name?: string;
      email?: string;
      /** False without a Resend key: the card opens the visitor's mail app instead. */
      configured: boolean;
      /** Where the mail app fallback addresses the note. */
      fallbackEmail: string;
    }
  | { kind: 'resume'; name: string; headline: string; viewUrl: string; downloadUrl: string; pages?: number; size?: string }
  | { kind: 'recruiter_brief'; view: BriefView; jobUrl?: string }
  | {
      kind: 'fit_report';
      role?: string;
      /** The visitor-supplied posting selected by the assessment tool. */
      jobUrl?: string;
      requirements: FitRequirement[];
      summary: { match: number; related: number; gap: number };
    };

export interface SourceRef {
  id: number;
  title: string;
  image: string;
  /** The product's own app icon or favicon, when it has one. */
  icon?: string;
  href: string;
}

export interface ActivityStep {
  id: string;
  tool: string;
  label: string;
  status: 'running' | 'done';
  /** The main argument, shown as a chip beside the label (a query, a project, a URL). */
  chip?: string;
  /** A few lines on what the tool found, shown when the row is expanded. */
  detail?: string[];
}

export type ChatEvent =
  | { type: 'step'; step: ActivityStep }
  | { type: 'widget'; widget: Widget }
  | { type: 'text'; delta: string }
  /** The answer's text is complete; sources and follow-ups may still come. */
  | { type: 'answered' }
  | { type: 'sources'; sources: SourceRef[] }
  | { type: 'suggestions'; items: string[] }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  /** Ids of the project cards this reply put on screen, so a follow-up doesn't send them again. */
  projectCards?: number[];
}

/**
 * What the visitor told the intake step before chatting. Sent with every
 * turn so answers lean on the most relevant work for the role.
 */
export interface VisitorContext {
  hiring: boolean;
  role?: string;
  jobUrl?: string;
}
