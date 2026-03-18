'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const projects = [
  {
    id: 1,
    title: 'Selah Note',
    description: 'AI-powered journaling app',
    image: '/projects/selah-note.png',
    link: 'https://selahnote.app',
    detailPage: '/projects/1',
  },
  {
    id: 2,
    title: 'Expense Tracker',
    description: 'iOS finance management',
    image: '/projects/expense-tracker.png',
    github: 'https://github.com/KyleAnthonyHay/ExpenseTracker/tree/main/ExpenseTracker',
    detailPage: '/projects/2',
  },
  {
    id: 3,
    title: 'The Wall',
    description: 'Social media platform',
    image: '/projects/the-wall.png',
    github: 'https://github.com/KyleAnthonyHay/socialmedia-appV2.0',
    detailPage: '/projects/3',
  },
  {
    id: 4,
    title: 'OnTract',
    description: 'Productivity dashboard',
    image: '/projects/ontract.png',
    detailPage: '/projects/5',
    landscape: true,
  },
  {
    id: 5,
    title: 'Sentio+',
    description: 'Sentiment analysis tool',
    image: '/projects/sentio-1.png',
    github: 'https://github.com/KyleAnthonyHay/sentio',
    detailPage: '/projects/6',
    landscape: true,
  },
  {
    id: 6,
    title: 'ChatGPT Clone',
    description: 'AI chat interface',
    image: '/projects/chatgpt-clone.png',
    link: 'https://chat-gpt-clone-delta-ten.vercel.app/',
    detailPage: '/projects/7',
    landscape: true,
  },
];

const Projects = () => {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section className="py-24 md:py-32" ref={ref}>
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
          {/* Row 1: 7/5 split */}
          <ProjectCard project={projects[0]} isInView={isInView} delay={0.1} className="md:col-span-7" portrait />
          <ProjectCard project={projects[1]} isInView={isInView} delay={0.2} className="md:col-span-5" portrait />

          {/* Row 2: 5/7 split (zig-zag) */}
          <ProjectCard project={projects[2]} isInView={isInView} delay={0.3} className="md:col-span-5" portrait />
          <ProjectCard project={projects[3]} isInView={isInView} delay={0.4} className="md:col-span-7" />

          {/* Row 3: 7/5 split */}
          <ProjectCard project={projects[4]} isInView={isInView} delay={0.5} className="md:col-span-7" />
          <ProjectCard project={projects[5]} isInView={isInView} delay={0.6} className="md:col-span-5" />
        </div>
      </div>
    </section>
  );
};

interface ProjectCardProps {
  project: typeof projects[number];
  isInView: boolean;
  delay: number;
  className?: string;
  portrait?: boolean;
}

const ProjectCard = ({ project, isInView, delay, className = '', portrait }: ProjectCardProps) => {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ ...spring, delay }}
      className={`group relative bg-white rounded-[1.5rem] overflow-hidden border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] transition-shadow duration-500 ${className}`}
    >
      <div className={`relative w-full ${portrait ? 'aspect-[4/5]' : 'aspect-[16/10]'} overflow-hidden`}>
        <div className={`absolute inset-0 flex justify-center ${portrait && !project.landscape ? 'items-start pt-12' : 'items-center'}`}>
          <div className={`relative transform transition-transform duration-700 ease-out group-hover:scale-[1.03] ${
            portrait && !project.landscape ? 'w-[50%] aspect-[9/19]' : 'w-[85%] aspect-[16/9]'
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
        <h3 className="text-zinc-900 font-medium text-base mb-1">{project.title}</h3>
        <p className="text-zinc-400 text-sm">{project.description}</p>
      </div>
    </motion.div>
  );

  if (project.detailPage) {
    return <Link href={project.detailPage} className={className}>{content}</Link>;
  }

  const href = project.link || project.github || '#';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
    </a>
  );
};

export default Projects;
