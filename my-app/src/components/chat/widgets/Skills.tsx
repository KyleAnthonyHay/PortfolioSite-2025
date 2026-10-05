'use client';

import type { Widget } from '@/lib/chat-events';

export function SkillsWidget({ widget }: { widget: Extract<Widget, { kind: 'skills' }> }) {
  const currentYear = new Date().getFullYear();
  return (
    <div className="agent-card p-4">
      <div className="space-y-4">
        {widget.groups.map((group) => (
          <div key={group.name}>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-widest text-zinc-400">{group.name}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.skills.map((skill) => (
                <span
                  key={skill.name}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-100 bg-zinc-50 px-2 py-1 text-xs text-zinc-700"
                >
                  {skill.name}
                  {skill.since && (
                    <span className="font-mono text-[10px] text-zinc-400">{Math.max(1, currentYear - skill.since)}y</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
