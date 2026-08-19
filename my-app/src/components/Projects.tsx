'use client';

import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';
import ProjectCard from '@/components/ProjectCard';
import { featuredProjects } from '@/lib/projects';

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

/** Zig-zag 7/5 → 7/5 → 5/7 across three rows — YarnScript's video row leads wide. */
const spans = ['md:col-span-7', 'md:col-span-5', 'md:col-span-7', 'md:col-span-5', 'md:col-span-5', 'md:col-span-7'];

const Projects = () => {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section className="py-20 md:py-28" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ ...spring }}
          className="mb-16"
        >
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-3">Selected Work</p>
          <h2 className="text-3xl md:text-4xl tracking-tighter leading-none text-zinc-900">
            Projects I&apos;ve built
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {featuredProjects.map((project, i) => (
            <ProjectCard
              key={project.id}
              project={project}
              show={isInView}
              delay={0.1 + i * 0.1}
              className={spans[i] ?? 'md:col-span-6'}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
