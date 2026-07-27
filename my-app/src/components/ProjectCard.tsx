'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FaGithub } from 'react-icons/fa';
import PhoneFrame from '@/components/PhoneFrame';
import type { ProjectCardData } from '@/lib/projects';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

interface ProjectCardProps {
  project: ProjectCardData;
  /** Drives the entrance animation — in-view on the home grid, mounted on the index. */
  show: boolean;
  delay?: number;
  className?: string;
  /** Use the longer `description` and show link/GitHub icons by the title. */
  detailed?: boolean;
}

const ExternalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

/**
 * The project card, shared by the home grid and the projects index. Portrait
 * projects get a phone-sized well; landscape ones a wide one. When a project
 * supplies a `screen`, it renders in a real device frame instead of a flat
 * screenshot — which is how the SelahNote demo loops in both grids.
 */
export default function ProjectCard({
  project,
  show,
  delay = 0,
  className = '',
  detailed = false,
}: ProjectCardProps) {
  const portrait = !project.landscape;

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={show ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay }}
      // h-full + column flex makes the card fill its grid row, and the media
      // area absorbs the slack — so paired cards line up instead of leaving a
      // ragged gap under the shorter one. The aspect ratio stays the minimum.
      className="group relative h-full flex flex-col bg-white rounded-[1.5rem] overflow-hidden border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-shadow duration-500"
    >
      <div className={`relative w-full grow ${portrait ? 'aspect-[4/5]' : 'aspect-[16/10]'} overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {/*
            Portrait devices are sized off the well's height, not its width.
            The well stretches to match the tallest card in its row, so a
            width-based device would come out small and marooned in the shorter
            card — height-based keeps every phone the same size across a row.
            Landscape shots stay width-based; they run out of width first.
          */}
          {project.screen ? (
            <PhoneFrame
              screen={project.screen}
              lazyVideo
              className="h-[82%] w-auto transform transition-transform duration-700 ease-out group-hover:scale-[1.03]"
            />
          ) : (
            <div
              className={`relative transform transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                portrait ? 'h-[82%] w-auto aspect-[1060/2160]' : 'w-[85%] aspect-[16/9]'
              }`}
            >
              <Image
                src={project.image}
                alt={project.title}
                fill
                className={portrait ? 'object-contain' : 'object-cover'}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-zinc-900 font-medium text-base">{project.title}</h3>
          {detailed && project.link && (
            <span className="inline-flex text-zinc-400">
              <ExternalIcon />
            </span>
          )}
          {detailed && project.github && (
            <span className="inline-flex text-zinc-400">
              <FaGithub className="w-4 h-4" />
            </span>
          )}
        </div>
        <p className={`text-zinc-400 text-sm ${detailed ? 'leading-relaxed' : ''}`}>
          {detailed ? project.description : project.tagline}
        </p>
      </div>
    </motion.div>
  );

  return (
    <Link href={`/projects/${project.id}`} className={className}>
      {content}
    </Link>
  );
}
