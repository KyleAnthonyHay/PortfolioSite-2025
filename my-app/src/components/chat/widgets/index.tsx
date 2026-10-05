'use client';

import type { Widget } from '@/lib/chat-events';
import { ProjectDetailWidget, ProjectsWidget } from './ProjectCards';
import { ExperienceCheckWidget } from './ExperienceCheck';
import { SkillsWidget } from './Skills';
import { TimelineWidget } from './Timeline';
import { ContactWidget } from './Contact';
import { FitReportWidget } from './FitReport';

export default function WidgetRenderer({ widget }: { widget: Widget }) {
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
    case 'fit_report':
      return <FitReportWidget widget={widget} />;
    default:
      return null;
  }
}
