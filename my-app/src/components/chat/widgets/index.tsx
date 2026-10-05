'use client';

import type { Widget } from '@/lib/chat-events';
import { ProjectDetailWidget, ProjectsWidget } from './ProjectCards';
import { ExperienceCheckWidget } from './ExperienceCheck';
import { SkillsWidget } from './Skills';
import { TimelineWidget } from './Timeline';
import { ContactWidget } from './Contact';
import { FitReportWidget } from './FitReport';
import { QuestionCard } from './Question';

interface WidgetRendererProps {
  widget: Widget;
  /** For question cards: whether the visitor can still answer, what they picked, and how to send it. */
  active?: boolean;
  answer?: string;
  onAnswer?: (text: string) => void;
}

export default function WidgetRenderer({ widget, active = false, answer, onAnswer }: WidgetRendererProps) {
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
      return <FitReportWidget widget={widget} />;
    default:
      return null;
  }
}
