'use client';

import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';
import ProjectCard from '@/components/ProjectCard';
import { featuredProjects } from '@/lib/projects';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

/**
 * Three tiers: OnTract and Sentio+ share the first row at half width each,
 * ProdBot takes two thirds beside SelahNote's phone, and the smaller tools
 * close out in thirds. Every landscape well keeps the recording's own
 * proportions, so the whole app window is always in view.
 */
const spans = ['md:col-span-6', 'md:col-span-6', 'md:col-span-8', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4', 'md:col-span-4'];

const Projects = () => {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="products" className="scroll-mt-20 py-20 md:py-28" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring }}
          className="mb-14 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-3">Selected Work</p>
            <h2 className="text-3xl md:text-5xl tracking-tighter leading-none text-zinc-900">
              Products I&apos;ve shipped
            </h2>
          </div>
          <p className="max-w-[44ch] text-sm leading-relaxed text-zinc-500">
            Applications built for companies, for my church, and for myself. The ones marked live are running today.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {featuredProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              show={isInView}
              delay={0.1 + i * 0.07}
              className={spans[i] ?? 'md:col-span-6'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
