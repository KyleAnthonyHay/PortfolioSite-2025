'use client';

import TopHeader from '@/components/TopHeader';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { FaGithub } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';

type Category = 'All' | 'iOS Apps' | 'Web Apps';

const projects = [
  { id: 1, title: 'SelahNote', image: '/projects/selah-note.png', description: 'AI-powered notetaker for sermons with file organization, recording summaries, and file upload capabilities.', link: 'https://selahnote.app', category: 'iOS Apps' as Category },
  { id: 2, title: 'Expense Tracker', image: '/projects/expense-tracker.png', description: 'Finance analytics tool that gathers data from an API and displays monthly transactions on a graph with category assignment.', github: 'https://github.com', category: 'iOS Apps' as Category },
  { id: 3, title: 'The Wall', image: '/projects/the-wall.png', description: 'Social board application displaying user posts to a collective feed. Users can sign up using Gmail.', category: 'iOS Apps' as Category },
  { id: 4, title: 'Country Viewer', image: '/projects/country-viewer.png', description: 'Browse all countries and their data. Population is automatically updated via a country data gathering API.', github: 'https://github.com', category: 'iOS Apps' as Category },
  { id: 5, title: 'OnTract', image: '/projects/ontract.png', description: 'Enterprise-grade Contract Management System with AI-powered search, automated metadata extraction, and conversational Q&A.', link: 'https://www.ontract.app/', landscape: true, category: 'Web Apps' as Category },
  { id: 6, title: 'Sentio+', image: '/projects/sentio-1.png', description: 'AI-powered decision-support platform transforming customer review data into actionable insights using RAG architecture.', github: 'https://github.com/KyleAnthonyHay/sentio', landscape: true, category: 'Web Apps' as Category },
  { id: 7, title: 'ChatGPT Clone', image: '/projects/chatgpt-clone.png', description: 'Specialized AI Assistant for institutional policies using RAG architecture to ground responses in actual policy documents.', link: 'https://chat-gpt-clone-delta-ten.vercel.app/', landscape: true, category: 'Web Apps' as Category },
];

const categories: Category[] = ['All', 'iOS Apps', 'Web Apps'];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

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
            {filteredProjects.map((project, index) => {
              const isWide = index % 3 === 0;
              const colSpan = isWide ? 'md:col-span-7' : 'md:col-span-5';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={mounted ? { opacity: 1, y: 0 } : {}}
                  transition={{ ...spring, delay: 0.15 + index * 0.07 }}
                  className={colSpan}
                >
                  <Link href={`/projects/${project.id}`} className="group block">
                    <div className="relative bg-white rounded-[1.5rem] overflow-hidden border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-shadow duration-500">
                      <div className={`relative w-full ${project.landscape ? 'aspect-[16/10]' : 'aspect-[4/5]'} overflow-hidden bg-zinc-50`}>
                        <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-12'}`}>
                          <div className={`relative transform transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
                            project.landscape ? 'w-[85%] aspect-[16/9]' : 'w-[50%] aspect-[9/19]'
                          }`}>
                            <Image
                              src={project.image}
                              alt={project.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 50vw"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-zinc-900 font-medium text-base">{project.title}</h2>
                          {project.link && (
                            <span className="inline-flex text-zinc-400">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </span>
                          )}
                          {project.github && (
                            <span className="inline-flex text-zinc-400">
                              <FaGithub className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <p className="text-zinc-400 text-sm leading-relaxed">{project.description}</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
