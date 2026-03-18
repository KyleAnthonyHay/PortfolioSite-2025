import Image from 'next/image';
import Footer from '@/components/Footer';
import TopHeader from '@/components/TopHeader';
import { FaGithub } from 'react-icons/fa';
import { FiArrowUpRight } from 'react-icons/fi';
import ProjectFeatures from '@/components/ProjectFeatures';
import { AnimatedSection } from '@/components/AnimatedSection';

type Category = 'iOS' | 'Web';

interface Project {
  id: number;
  title: string;
  image: string;
  images?: string[];
  description: string;
  github?: string;
  link?: string;
  landscape?: boolean;
  category?: Category;
  overview?: string;
  purpose?: string;
  techStack?: {
    frontend?: string[];
    backend?: string[];
    infrastructure?: string[];
  };
  hasDetailedView?: boolean;
}

const projects: Project[] = [
  {
    id: 1,
    title: 'SelahNote',
    image: '/projects/selah-note.png',
    description: 'SelahNote is an AI notetaker for sermons. It provides file organization, recording summaries, and file upload capabilities to streamline the process of taking notes during sermons.',
    link: 'https://selahnote.app',
    category: 'iOS',
    overview: 'SelahNote (Lectra) is an AI-powered note-taking application for iOS that transforms live recordings, uploaded audio, and YouTube content into structured, reference-aware notes through a hybrid local-first and cloud-synced architecture. It now combines real-time transcription, agentic note generation, Convex-backed sync workflows, and Pinecone-powered reference retrieval to turn spoken content into searchable, enriched notes.',
    purpose: 'Serves as an intelligent audio-to-notes platform that closes the gap between listening and understanding. Users can capture sermons or lectures in real time, upload existing audio, or ingest YouTube transcripts, then receive structured notes, scripture-aware summaries, and synchronized content that stays available across devices.',
    techStack: {
      frontend: ['SwiftUI', 'Swift 5+', 'SwiftData', 'MVVM', 'AVFoundation', 'Starscream WebSockets', 'Firebase Auth', 'RevenueCat'],
      backend: ['Convex', 'AssemblyAI (streaming & batch)', 'OpenAI GPT-4o', 'OpenAI Embeddings', 'Pinecone', 'Google Cloud Run / Functions', 'Supadata API'],
      infrastructure: ['Local-first SwiftData storage', 'Convex cloud sync', 'Google Cloud', 'Firebase token validation', 'StoreKit / RevenueCat']
    },
    hasDetailedView: true
  },
  {
    id: 2,
    title: 'ExpenseTracker',
    image: '/projects/expense-tracker.png',
    description: 'ExpenseTracker is a finance analytics tool that gathers data from an API and displays your monthly transactions on a graph. It also allows you to assign transaction categories for organization.',
    github: 'https://github.com/KyleAnthonyHay/ExpenseTracker/tree/main/ExpenseTracker',
    category: 'iOS',
    overview: 'ExpenseTracker is an elegant iOS application built with SwiftUI that provides users with a comprehensive solution for tracking, visualizing, and managing personal financial transactions. The app fetches transaction data from a remote API, processes and organizes it by date and category, and presents it through an intuitive interface featuring interactive charts, detailed transaction views, and hierarchical category management.',
    purpose: 'Serves as a demonstration of modern iOS development capabilities while providing a functional expense tracking solution. The app transforms raw transaction data into actionable insights by fetching data asynchronously, grouping transactions chronologically, calculating cumulative expenses over time, and visualizing spending patterns through interactive charts.',
    techStack: {
      frontend: ['SwiftUI', 'Swift 5.0+', 'MVVM', 'Combine framework', 'SwiftUICharts', 'SwiftUIFontIcon', 'NavigationStack'],
      backend: ['JSON API endpoint', 'URLSession with Combine'],
      infrastructure: ['OrderedDictionary', 'DateFormatter extensions', 'Custom data processing']
    },
    hasDetailedView: true
  },
  {
    id: 3,
    title: 'TheWall',
    image: '/projects/the-wall.png',
    description: "TheWall is a social board application that displays users' posts to a collective feed called 'The Wall.' Users can sign up using Gmail.",
    github: 'https://github.com/KyleAnthonyHay/socialmedia-appV2.0',
    category: 'iOS',
    overview: 'A cross-platform social media application built with Flutter that enables users to create posts, view a shared feed, and interact with other users. The app provides a simple, real-time social networking experience with user authentication, profile management, and a public message wall where all users can share content.',
    purpose: 'Serves as a social media platform where users can post messages to a shared feed ("THE WALL") visible to all authenticated users. It provides a streamlined social networking experience focused on text-based posts and user discovery, enabling users to connect, share thoughts, and browse other users\' profiles.',
    techStack: {
      frontend: ['Flutter (Dart SDK >=3.3.0)', 'Material Design', 'Custom theme system', 'Reusable component architecture'],
      backend: ['Firebase Auth', 'Cloud Firestore', 'Real-time streams'],
      infrastructure: ['Firebase services']
    },
    hasDetailedView: true
  },
  {
    id: 4,
    title: 'CountryApp',
    image: '/projects/country-viewer.png',
    description: 'Allows you to view all the countries of the world and their relevant data. Country-relative population is automatically updated via a country data gathering API.',
    github: 'https://github.com/KyleAnthonyHay/Countries-App',
    category: 'iOS',
    overview: 'A native iOS application that displays information about countries worldwide. The app fetches country data from the REST Countries API and presents it in a clean, tab-based interface with search and detail views.',
    purpose: 'Provides users with quick access to country information including flags, official names, capitals, population, currencies, and languages. The app serves as a reference tool for exploring geographic and demographic data for all countries.',
    techStack: {
      frontend: ['UIKit', 'Swift', 'MVC architecture', 'Swift Concurrency (async/await)', 'UITableView', 'UIImageView', 'UILabel'],
      backend: ['REST Countries API v3.1', 'URLSession'],
      infrastructure: ['Custom UIImageView extension', 'Auto Layout constraints', 'Dynamic table view cell sizing']
    },
    hasDetailedView: true
  },
  {
    id: 5,
    title: 'OnTract',
    image: '/projects/ontract.png',
    images: ['/projects/ontract.png', '/projects/ontract-dash-dark.png', '/projects/ontract-dash-light.png'],
    description: 'An enterprise-grade Contract Management System that helps organizations efficiently manage, search, and analyze contracts using AI-powered features.',
    link: 'https://www.ontract.app/',
    landscape: true,
    category: 'Web',
    overview: 'A comprehensive, enterprise-grade Contract Management System designed to help organizations efficiently manage, search, and analyze their contract documents using AI-powered features. The platform combines modern web technologies with advanced AI orchestration to provide intelligent contract discovery, automated metadata extraction, and conversational Q&A capabilities.',
    purpose: 'Serves as a centralized "Contract Intelligence Platform" for organizations managing large volumes of legal documents. Uses Retrieval-Augmented Generation (RAG) to enable semantic search and natural language queries across all contracts, helping legal teams navigate complex contract portfolios with precision.',
    techStack: {
      frontend: ['Next.js 16', 'TypeScript', 'Tailwind CSS 4', 'Radix UI', 'React Hook Form', 'Zod'],
      backend: ['PostgreSQL + pgvector', 'Supabase Auth', 'FastAPI', 'LangChain & LangGraph', 'AWS Bedrock (Claude 3.5)', 'OpenAI GPT-4o'],
      infrastructure: ['Supabase', 'Stripe', 'Resend', 'LangSmith']
    },
    hasDetailedView: true
  },
  {
    id: 6,
    title: 'Sentio+',
    image: '/projects/sentio-1.png',
    images: ['/projects/sentio-1.png', '/projects/sentio-2.png'],
    description: 'An AI-powered decision-support platform that transforms customer review data into actionable business insights using RAG architecture.',
    github: 'https://github.com/KyleAnthonyHay/sentio',
    landscape: true,
    category: 'Web',
    overview: 'Sentio+ is an AI-powered decision-support platform that transforms large-scale, unstructured customer review data into actionable business insights using a Retrieval-Augmented Generation (RAG) architecture. Designed as an internal intelligence tool for Product, CX, Strategy, and Leadership teams, it enables aspect-level reasoning over customer feedback, grounding every insight in real review evidence.',
    purpose: 'Serves as a centralized "Customer Intelligence Platform" for organizations managing large volumes of customer feedback. Unlike systems that rely solely on manual tagging and keyword search, Sentio+ uses RAG to enable semantic search and natural language queries across all reviews. It helps teams navigate complex feedback portfolios, track sentiment trends, and extract insights from historical reviews.',
    techStack: {
      frontend: ['Next.js 16 (App Router)', 'TypeScript', 'Tailwind CSS 4', 'Radix UI primitives', 'Framer Motion', 'React Context API', 'Lucide React'],
      backend: ['FastAPI (Python)', 'LangChain & LangGraph', 'AWS Bedrock (Claude 3 Sonnet)', 'OpenAI-compatible APIs', 'OpenAI text-embedding-3-small', 'ChromaDB', 'Pandas', 'NumPy'],
      infrastructure: ['Docker & Docker Compose', 'ChromaDB (persistent, HTTP, cloud)', 'Local filesystem (CSV datasets)', 'Jupyter Notebooks']
    },
    hasDetailedView: true
  },
  {
    id: 7,
    title: 'ChatGPT Clone',
    image: '/projects/chatgpt-clone.png',
    description: 'A high-performance ChatGPT clone designed as a specialized AI Assistant for institutional policies using RAG architecture.',
    link: 'https://chat-gpt-clone-delta-ten.vercel.app/',
    landscape: true,
    category: 'Web',
    overview: 'A high-performance, full-stack ChatGPT clone designed as a specialized AI Assistant for institutional policies. It leverages modern web technologies and advanced AI orchestration to provide users with an intuitive chat interface capable of retrieving and reasoning over complex university or organizational documentation.',
    purpose: 'Serves as an "Institutional Policy Specialist." Unlike general-purpose LLMs that may hallucinate or lack specific internal data, this clone uses Retrieval-Augmented Generation (RAG) to ensure responses are grounded in actual policy documents. It is designed to help students, faculty, and staff navigate institutional rules with precision, conciseness, and accuracy.',
    techStack: {
      frontend: ['Next.js 14 (App Router)', 'TypeScript', 'Tailwind CSS', 'Motion (Framer Motion)', 'Lucide React', 'React Context API'],
      backend: ['FastAPI (Python 3.12+)', 'LangChain & LangGraph', 'OpenAI GPT-4o-mini', 'PostgreSQL / Supabase', 'LangGraph PostgresSaver'],
      infrastructure: ['Docker & Docker Compose', 'ChromaDB', 'OpenAI Embeddings', 'LangSmith']
    },
    hasDetailedView: true
  },
];

export function generateStaticParams() {
  return projects.map((p) => ({ id: p.id.toString() }));
}

const techStackColors: Record<string, string> = {
  frontend: 'bg-blue-500',
  backend: 'bg-emerald-500',
  infrastructure: 'bg-amber-500',
};

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idNum = parseInt(id, 10);
  const project = projects.find((p) => p.id === idNum);

  if (!project) {
    return (
      <>
        <TopHeader />
        <div className="min-h-[100dvh] flex items-center justify-center">
          <p className="text-zinc-400 text-sm">Project not found</p>
        </div>
      </>
    );
  }

  if (project.hasDetailedView && project.techStack) {
    return (
      <>
        <TopHeader />
        <section className="pt-28 pb-24">
          <div className="max-w-[1100px] mx-auto px-6 md:px-10">
            {/* Hero */}
            <AnimatedSection className="mb-16" immediate>
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">
                {project.category === 'iOS' ? 'iOS App' : 'Web App'}
              </p>
              <div className="flex items-center gap-4 flex-wrap mb-6">
                <h1 className="text-4xl md:text-5xl tracking-tighter leading-none text-zinc-900">{project.title}</h1>
                {project.link && (
                  <a href={project.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center active:scale-[0.95] transition-all duration-200">
                    <FiArrowUpRight className="w-4 h-4 text-zinc-600" />
                  </a>
                )}
                {project.github && (
                  <a href={project.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center active:scale-[0.95] transition-all duration-200">
                    <FaGithub className="w-4 h-4 text-zinc-600" />
                  </a>
                )}
              </div>
              <p className="text-base text-zinc-500 leading-relaxed max-w-[65ch]">{project.overview}</p>
            </AnimatedSection>

            {/* Main Image */}
            <AnimatedSection className="mb-20" animation="scale-in" delay={100} immediate>
              <div className="relative overflow-hidden rounded-[2rem] bg-white border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)]">
                <div className="aspect-[16/9] relative m-4">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-contain rounded-[1.5rem]"
                  />
                </div>
              </div>
            </AnimatedSection>

            {/* Purpose */}
            <AnimatedSection className="mb-20">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">Purpose</p>
              <p className="text-base text-zinc-500 leading-relaxed max-w-[65ch]">{project.purpose}</p>
            </AnimatedSection>

            <div className="border-t border-zinc-200/60 my-16" />

            {/* Key Features */}
            <AnimatedSection className="mb-20">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-8">Key Features</p>
              <ProjectFeatures projectId={project.id} />
            </AnimatedSection>

            <div className="border-t border-zinc-200/60 my-16" />

            {/* Tech Stack */}
            <AnimatedSection className="mb-16">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-8">Tech Stack</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {(['frontend', 'backend', 'infrastructure'] as const).map((layer) => (
                  <div key={layer} className="bg-white rounded-[1.5rem] p-8 border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 mb-5">
                      <div className={`w-2 h-2 rounded-full ${techStackColors[layer]}`} />
                      <h3 className="text-zinc-900 font-medium text-sm capitalize">{layer}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.techStack![layer]?.map((tech, i) => (
                        <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-100 text-zinc-600 text-xs font-medium">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <TopHeader />
      <section className="pt-28 pb-32">
        <div className="max-w-[900px] mx-auto px-6 md:px-10 space-y-10">
          <AnimatedSection animation="scale-in" immediate>
            <div className="relative bg-white rounded-[2rem] overflow-hidden border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] aspect-[6/4] mx-auto max-w-[720px]">
              <div className={`absolute inset-0 flex justify-center ${project.landscape ? 'items-center' : 'items-start pt-16'}`}>
                <div className={`relative transform transition-transform duration-700 ${project.landscape ? 'w-[75%] aspect-[16/9]' : 'w-[45%] aspect-[9/19]'}`}>
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100} immediate>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl md:text-4xl tracking-tighter leading-none text-zinc-900">{project.title}</h1>
              {project.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-lg bg-zinc-100 text-zinc-500 text-xs font-medium">
                  {project.category}
                </span>
              )}
              {project.link ? (
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center active:scale-[0.95] transition-all duration-200">
                  <FiArrowUpRight className="w-4 h-4 text-zinc-600" />
                </a>
              ) : project.github && (
                <a href={project.github} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center active:scale-[0.95] transition-all duration-200">
                  <FaGithub className="w-4 h-4 text-zinc-600" />
                </a>
              )}
            </div>
          </AnimatedSection>
          <AnimatedSection delay={200} immediate>
            <p className="text-base text-zinc-500 leading-relaxed max-w-[65ch]">{project.description}</p>
          </AnimatedSection>
        </div>
        <Footer />
      </section>
    </>
  );
}
