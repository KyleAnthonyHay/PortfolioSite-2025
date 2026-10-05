/**
 * Wire format shared by the chat API route and the chat UI. The route streams
 * one JSON event per line (ndjson); the client folds them into a message.
 * Widgets are the structured payloads tools attach to their results so the
 * UI can render cards instead of prose.
 */

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
  requirement: string;
  status: FitStatus;
  /** Short justification shown under the requirement. */
  evidence: string;
  projects: ProjectCardData[];
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
  | {
      kind: 'fit_report';
      role?: string;
      requirements: FitRequirement[];
      summary: { match: number; related: number; gap: number };
    };

export interface SourceRef {
  id: number;
  title: string;
  image: string;
  href: string;
}

export interface ActivityStep {
  id: string;
  tool: string;
  label: string;
  status: 'running' | 'done';
}

export type ChatEvent =
  | { type: 'step'; step: ActivityStep }
  | { type: 'widget'; widget: Widget }
  | { type: 'text'; delta: string }
  | { type: 'sources'; sources: SourceRef[] }
  | { type: 'suggestions'; items: string[] }
  | { type: 'error'; message: string }
  | { type: 'done' };

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}
