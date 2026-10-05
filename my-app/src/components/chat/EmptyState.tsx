'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { ClipboardCheck, LayoutGrid, Smartphone, Sparkles } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 120, damping: 20 };

export const JOB_FIT_TEMPLATE = "How well does Kyle-Anthony fit this role?\n\n";

const starters = [
  {
    icon: LayoutGrid,
    title: 'Show me what he has built',
    subtitle: 'Every project, as cards',
    prompt: 'Show me what Kyle-Anthony has built.',
    send: true,
  },
  {
    icon: Smartphone,
    title: 'Does he have iOS experience?',
    subtitle: 'Swift, SwiftUI, shipped apps',
    prompt: 'Does Kyle-Anthony have iOS experience?',
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
    title: 'Check fit for a role',
    subtitle: 'Paste a job description',
    prompt: JOB_FIT_TEMPLATE,
    send: false,
  },
];

interface EmptyStateProps {
  onPick: (prompt: string, send: boolean) => void;
}

export default function EmptyState({ onPick }: EmptyStateProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-2 pb-24 pt-10 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={spring}
        className="mb-5 h-16 w-16 overflow-hidden rounded-full ring-2 ring-zinc-200/60 ring-offset-2 ring-offset-[#f9fafb]"
      >
        <Image src="/profile.jpg" alt="Kyle-Anthony" width={64} height={64} className="h-full w-full object-cover" priority />
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        className="mb-2 text-2xl tracking-tight text-zinc-900 md:text-3xl"
      >
        Ask me about Kyle-Anthony.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="mb-8 max-w-md text-sm leading-relaxed text-zinc-500"
      >
        An agent grounded in his projects and résumé. It searches the work, shows you cards and sources, and gives
        honest answers about experience and fit.
      </motion.p>
      <div className="grid w-full max-w-xl grid-cols-1 gap-2.5 sm:grid-cols-2">
        {starters.map((starter, index) => {
          const Icon = starter.icon;
          return (
            <motion.button
              key={starter.title}
              type="button"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.15 + index * 0.05 }}
              onClick={() => onPick(starter.prompt, starter.send)}
              className="group flex items-start gap-3 rounded-2xl border border-zinc-200/60 bg-white p-4 text-left shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-300 hover:shadow-[0_12px_30px_-12px_rgba(0,0,0,0.12)] active:scale-[0.98]"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span>
                <span className="block text-sm font-medium text-zinc-900">{starter.title}</span>
                <span className="block text-xs text-zinc-400">{starter.subtitle}</span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
