'use client';

import TopHeader from '@/components/TopHeader';
import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import { FaGithub } from 'react-icons/fa';
import { useState } from 'react';

type Category = 'All' | 'iOS Apps' | 'Web Apps';

const projects = [
  { id: 1, title: 'SelahNote', image: '/projects/selah-note.png', description: 'SelahNote is an AI notetaker for sermons. It provides file organization, recording summaries, and file upload capabilities to streamline the process of taking notes during sermons.', link: 'https://selahnote.app', category: 'iOS Apps' as Category },
  { id: 2, title: 'Expense Tracker', image: '/projects/expense-tracker.png', description: 'ExpenseTracker is a finance analytics tool that gathers data from an API and displays your monthly transactions on a graph. It also allows you to assign transaction categories for organization.', github: 'https://github.com', category: 'iOS Apps' as Category },
  { id: 3, title: 'The Wall', image: '/projects/the-wall.png', description: 'TheWall is a social board application that displays users posts to a collective feed called "The Wall." Users can sign up using Gmail.', category: 'iOS Apps' as Category },
  { id: 4, title: 'Country Viewer', image: '/projects/country-viewer.png', description: 'Allows you to view all the countries of the world and their relevant data. Country-relative population is automatically updated via a country data gathering API.', github: 'https://github.com', category: 'iOS Apps' as Category },
  { id: 5, title: 'OnTract', image: '/projects/ontract.png', description: 'An enterprise-grade Contract Management System that helps organizations efficiently manage, search, and analyze contracts using AI-powered features. Provides intelligent contract discovery, automated metadata extraction, and conversational Q&A capabilities.', link: 'https://www.ontract.app/', landscape: true, category: 'Web Apps' as Category },
  { id: 6, title: 'Sentio+', image: '/projects/sentio-1.png', description: 'An AI-powered decision-support platform that transforms customer review data into actionable business insights using RAG architecture. Designed for Product, CX, and Strategy teams, it enables aspect-level reasoning over customer feedback with evidence-grounded insights.', github: 'https://github.com/KyleAnthonyHay/sentio', landscape: true, category: 'Web Apps' as Category },
  { id: 7, title: 'ChatGPT Clone', image: '/projects/chatgpt-clone.png', description: 'A high-performance ChatGPT clone designed as a specialized AI Assistant for institutional policies. Uses RAG architecture to ground responses in actual policy documents, helping users navigate complex institutional rules with precision and accuracy.', link: 'https://chat-gpt-clone-delta-ten.vercel.app/', landscape: true, category: 'Web Apps' as Category },
];

const categories: Category[] = ['All', 'iOS Apps', 'Web Apps'];

export default function ProjectsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('All');

  const filteredProjects = activeCategory === 'All' 
    ? projects 
    : projects.filter(p => p.category === activeCategory);

  return (
    <>
      <TopHeader />
      <section className="pt-16 pb-16">
        <div className="max-w-[800px] mx-auto px-6 md:px-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">Projects</h1>
          <p className="text-lg text-gray-600 max-w-[600px] mx-auto">
            A collection of apps and experiences I&apos;ve built — from mobile to web.
          </p>
        </div>
      </section>

      <section className="pb-8">
        <div className="max-w-[800px] mx-auto px-6 md:px-12">
          <nav className="flex items-center justify-center gap-6 border-b border-gray-200 pb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`text-sm font-medium transition-colors pb-2 border-b-2 -mb-[18px] ${
                  activeCategory === category
                    ? 'text-gray-900 border-gray-900'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>
      </section>

      <section className="pt-16 pb-40">
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="space-y-4">
                {project.id === 1 || project.id === 2 || project.id === 3 || project.id === 4 || project.id === 5 || project.id === 6 || project.id === 7 ? (
                  <Link href={`/projects/${project.id}`} className="block group relative bg-[#F5F5F5] rounded-[20px] overflow-hidden aspect-[6/4] cursor-pointer">
                    <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-12'}`}>
                      <div className={`relative transform transition-transform duration-800 ${project.landscape ? 'w-[75%] aspect-[16/9] group-hover:scale-105' : 'w-[45%] aspect-[9/19] group-hover:-translate-y-3'}`}>
                        <Image src={project.image} alt={project.title} fill className="object-cover" />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="group relative bg-[#F5F5F5] rounded-[20px] overflow-hidden aspect-[6/4]">
                    <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-12'}`}>
                      <div className={`relative transform transition-transform duration-800 ${project.landscape ? 'w-[75%] aspect-[16/9] hover:scale-105' : 'w-[45%] aspect-[9/19] hover:-translate-y-3'}`}>
                        <Image src={project.image} alt={project.title} fill className="object-cover" />
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <h2 className="text-[22px] font-medium text-[#666666]">{project.title}</h2>
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-500 hover:text-gray-700 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center">
                      <FaGithub className="w-5 h-5 text-gray-500 grayscale hover:grayscale-0 transition-all" />
                    </a>
                  )}
                </div>
                <p className="text-[16px] leading-[1.6] text-[#666666]">{project.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
