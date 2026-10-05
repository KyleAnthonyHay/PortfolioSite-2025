'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight, ClipboardCheck, LayoutGrid, Sparkles, Users } from 'lucide-react';


export const JOB_FIT_TEMPLATE = "How well does Kyle-Anthony fit this role?\n\n";

const starters = [
  {
    icon: LayoutGrid,
    title: 'Show me what he has shipped',
    subtitle: 'Products, as cards',
    prompt: 'Show me what Kyle-Anthony has built.',
    send: true,
  },
  {
    icon: Users,
    title: 'Is he a fit for my team?',
    subtitle: 'He will ask what you are hiring for',
    prompt: 'Is Kyle-Anthony a fit for my team?',
    send: true,
  },
  {
    icon: Sparkles,
    title: "What's his AI/ML background?",
    subtitle: 'RAG, agents, vector search',
    prompt: "What's Kyle-Anthony's AI and ML background?",
    send: true,
  },
  {
    icon: ClipboardCheck,
    title: 'Check a job description',
    subtitle: 'Paste it and get a fit report',
    prompt: JOB_FIT_TEMPLATE,
    send: false,
  },
];

interface EmptyStateProps {
  onPick: (prompt: string, send: boolean) => void;
}

export default function EmptyState({ onPick }: EmptyStateProps) {
  const ease = [0.16, 1, 0.3, 1] as const;
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-2 pb-24 pt-[6vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, ease }}
        className="relative mb-7 h-[72px] w-[72px]"
      >
        <div className="h-full w-full overflow-hidden rounded-full bg-zinc-200">
          <Image src="/profile.jpg" alt="Kyle-Anthony" width={72} height={72} className="h-full w-full object-cover" priority />
        </div>
        <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-[2.5px] border-paper bg-olive" />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.06 }}
        className="mb-3 font-display text-[clamp(1.9rem,4vw,2.6rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink"
      >
        Ask me about Kyle-Anthony.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.12 }}
        className="mb-10 max-w-[44ch] text-[15px] leading-relaxed text-zinc-500"
      >
        I search his products and résumé, show you cards and sources, and ask when I need more to go on.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.18 }}
        className="agent-card w-full max-w-xl overflow-hidden p-1.5 text-left"
      >
        {starters.map((starter, index) => {
          const Icon = starter.icon;
          return (
            <motion.button
              key={starter.title}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease, delay: 0.24 + index * 0.05 }}
              onClick={() => onPick(starter.prompt, starter.send)}
              className="group flex w-full items-center gap-3.5 rounded-[14px] px-3 py-3 text-left transition-colors hover:bg-zinc-100"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-paper text-zinc-500 transition-colors group-hover:border-ink group-hover:bg-ink group-hover:text-paper">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-ink">{starter.title}</span>
                <span className="block text-[12px] text-zinc-400">{starter.subtitle}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-zinc-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
