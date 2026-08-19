'use client';

import TopHeader from '@/components/TopHeader';
import Footer from '@/components/Footer';
import ProjectCard from '@/components/ProjectCard';
import { projects, type ProjectCategory } from '@/lib/projects';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

type Filter = 'All' | ProjectCategory;

const categories: Filter[] = ['All', 'iOS Apps', 'Web Apps'];

const spring = { type: 'spring' as const, stiffness: 100, damping: 20 };

/**
 * Explicit 7/5 pairs so every row fills the 12-column grid — the old
 * `index % 3` pattern left some rows two columns short of full width.
 */
const spans = [
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-7',
  'md:col-span-5',
  'md:col-span-5',
  'md:col-span-7',
  'md:col-span-7',
  'md:col-span-5',
];

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<Filter>('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProjects =
    activeCategory === 'All' ? projects : projects.filter((p) => p.category === activeCategory);

  return (
    <>
      <TopHeader />
      <section className="pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring }}
          >
            <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-3">Portfolio</p>
            <h1 className="text-4xl md:text-6xl tracking-tighter leading-none text-zinc-900 mb-4">
              Projects
            </h1>
            <p className="text-base text-zinc-500 leading-relaxed max-w-[50ch]">
              A collection of apps and experiences I&apos;ve built — from mobile to web.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <motion.nav
            initial={{ opacity: 0, y: 10 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring, delay: 0.1 }}
            className="flex items-center gap-1 border-b border-zinc-200/60 pb-0"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-sm font-medium px-4 py-3 border-b-2 -mb-px transition-all duration-200 ${
                  activeCategory === category
                    ? 'text-zinc-900 border-zinc-900'
                    : 'text-zinc-400 border-transparent hover:text-zinc-600'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.nav>
        </div>
      </section>

      <section className="pt-12 pb-32">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                show={mounted}
                delay={0.15 + index * 0.07}
                className={spans[index % spans.length]}
                detailed
              />
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
