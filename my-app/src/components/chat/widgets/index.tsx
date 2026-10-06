'use client';

import type { Widget } from '@/lib/chat-events';
import { ProjectDetailWidget, ProjectsWidget } from './ProjectCards';
import { ExperienceCheckWidget } from './ExperienceCheck';
import { SkillsWidget } from './Skills';
import { TimelineWidget } from './Timeline';
import { ContactWidget } from './Contact';
import { FitReportWidget } from './FitReport';
import { QuestionCard } from './Question';
import { RecommendationsWidget } from './Recommendations';
import { JourneyWidget } from './Journey';
import { ResourcesWidget } from './Resources';
import { BookTimeWidget } from './BookTime';
import { ResumeWidget } from './Resume';
import { DemoWidget } from './Demo';
import { NoteWidget, type ChatHandle } from './Note';
import { RecruiterBriefWidget } from './RecruiterBrief';

interface WidgetRendererProps {
  widget: Widget;
  /** For question cards: whether the visitor can still answer, what they picked, and how to send it. */
  active?: boolean;
  answer?: string;
  onAnswer?: (text: string) => void;
  /** For the note card: the chat so far and the intake answer. */
  chat?: ChatHandle;
  /** Turns a fit report into a recruiter brief. */
  onBrief?: () => void;
}

export default function WidgetRenderer({ widget, active = false, answer, onAnswer, chat, onBrief }: WidgetRendererProps) {
  switch (widget.kind) {
    case 'projects':
      return <ProjectsWidget widget={widget} />;
    case 'project':
      return <ProjectDetailWidget widget={widget} />;
    case 'experience_check':
      return <ExperienceCheckWidget widget={widget} />;
    case 'skills':
      return <SkillsWidget widget={widget} />;
    case 'timeline':
      return <TimelineWidget widget={widget} />;
    case 'contact':
      return <ContactWidget widget={widget} />;
    case 'question':
      return <QuestionCard widget={widget} active={active} answer={answer} onAnswer={onAnswer} />;
    case 'fit_report':
      return <FitReportWidget widget={widget} onBrief={onBrief} />;
    case 'recommendations':
      return <RecommendationsWidget widget={widget} onAsk={active ? onAnswer : undefined} />;
    case 'journey':
      return <JourneyWidget widget={widget} />;
    case 'resources':
      return <ResourcesWidget widget={widget} />;
    case 'book_time':
      return <BookTimeWidget widget={widget} />;
    case 'resume':
      return <ResumeWidget widget={widget} />;
    case 'demo':
      return <DemoWidget widget={widget} />;
    case 'recruiter_brief':
      return <RecruiterBriefWidget widget={widget} />;
    case 'note':
      return <NoteWidget widget={widget} chat={chat} />;
    default:
      return null;
  }
}
