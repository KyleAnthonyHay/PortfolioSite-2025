import { projects as projectCards } from './projects';
import type { ProjectCardData, TechStack } from './chat-events';

/**
 * Everything the chat agent and its widgets know about a project, in one
 * place. Card copy comes from projects.ts (shared with the home grid); the
 * tech stacks and overviews mirror the detail pages. `corpusNames` are the
 * document names the RAG index derives from backend/project-descriptions
 * filenames, so tool citations can be resolved back to a card.
 */
export interface CatalogProject extends ProjectCardData {
  aliases: string[];
  corpusNames: string[];
  overview: string;
  techStack: TechStack;
}

interface CatalogDetails {
  aliases: string[];
  corpusNames: string[];
  image: string;
  /** Set when the image is a bare screenshot rather than a framed device render. */
  unframed?: boolean;
  highlights: string[];
  overview: string;
  techStack: TechStack;
}

const details: Record<number, CatalogDetails> = {
  1: {
    aliases: ['SelahNote', 'Selahnote', 'Selah Note', 'Lectra'],
    corpusNames: ['Selahnote'],
    image: '/demos/selahnote/home.png',
    unframed: true,
    highlights: ['SwiftUI', 'Convex', 'AssemblyAI', 'Pinecone'],
    overview:
      'AI-powered note-taking app for iOS that turns live recordings, uploaded audio, and YouTube content into structured, reference-aware notes. Real-time transcription over WebSockets, agentic note generation, Convex-backed cross-device sync, and Pinecone-powered scripture retrieval, all on a local-first SwiftData store.',
    techStack: {
      frontend: ['SwiftUI', 'Swift 5+', 'SwiftData', 'MVVM', 'AVFoundation', 'Starscream WebSockets', 'Firebase Auth', 'RevenueCat'],
      backend: ['Convex', 'AssemblyAI (streaming & batch)', 'OpenAI GPT-4o', 'OpenAI Embeddings', 'Pinecone', 'Google Cloud Run / Functions', 'Supadata API'],
      infrastructure: ['Local-first SwiftData storage', 'Convex cloud sync', 'Google Cloud', 'Firebase token validation', 'StoreKit / RevenueCat'],
    },
  },
  4: {
    aliases: ['Country Viewer', 'Country App', 'CountryApp', 'Countries App'],
    corpusNames: ['Country App'],
    image: '/demos/country-viewer/device.png',
    highlights: ['UIKit', 'Swift', 'async/await'],
    overview:
      'Native UIKit reference app that pulls every country from the REST Countries API and presents flags, capitals, population, currencies, and languages in a tab-based interface with search and detail views. Uses Swift Concurrency for networking and Auto Layout for dynamic cells.',
    techStack: {
      frontend: ['UIKit', 'Swift', 'MVC architecture', 'Swift Concurrency (async/await)', 'UITableView', 'UIImageView', 'UILabel'],
      backend: ['REST Countries API v3.1', 'URLSession'],
      infrastructure: ['Custom UIImageView extension', 'Auto Layout constraints', 'Dynamic table view cell sizing'],
    },
  },
  5: {
    aliases: ['OnTract', 'Ontract'],
    corpusNames: ['Ontract'],
    image: '/demos/ontract/overview.jpg',
    highlights: ['Next.js', 'pgvector', 'LangGraph', 'Bedrock'],
    overview:
      'Enterprise contract management platform with AI-powered search, automated metadata extraction, and conversational Q&A over a contract portfolio. Retrieval-Augmented Generation on PostgreSQL + pgvector, multi-tenant Supabase auth with Row Level Security, and Stripe billing.',
    techStack: {
      frontend: ['Next.js 16', 'TypeScript', 'Tailwind CSS 4', 'Radix UI', 'React Hook Form', 'Zod'],
      backend: ['PostgreSQL + pgvector', 'Supabase Auth', 'FastAPI', 'LangChain & LangGraph', 'AWS Bedrock (Claude 3.5)', 'OpenAI GPT-4o'],
      infrastructure: ['Supabase', 'Stripe', 'Resend', 'LangSmith'],
    },
  },
  6: {
    aliases: ['Sentio+', 'Sentio Plus', 'Sentio', 'SentioPlus'],
    corpusNames: ['Sentio Plus', 'Finetuned Sentiment Analysis'],
    image: '/demos/sentio/overview.jpg',
    highlights: ['FastAPI', 'LangGraph', 'ChromaDB', 'RoBERTa'],
    overview:
      'Customer-intelligence platform that turns large volumes of unstructured reviews into decision-ready insights. RAG over ChromaDB for aspect-level reasoning, a fine-tuned RoBERTa sentiment model, and a FastAPI + LangGraph backend behind a Next.js dashboard.',
    techStack: {
      frontend: ['Next.js 16 (App Router)', 'TypeScript', 'Tailwind CSS 4', 'Radix UI primitives', 'Framer Motion', 'React Context API', 'Lucide React'],
      backend: ['FastAPI (Python)', 'LangChain & LangGraph', 'AWS Bedrock (Claude 3 Sonnet)', 'OpenAI-compatible APIs', 'OpenAI text-embedding-3-small', 'ChromaDB', 'Pandas', 'NumPy', 'Fine-tuned RoBERTa'],
      infrastructure: ['Docker & Docker Compose', 'ChromaDB (persistent, HTTP, cloud)', 'Local filesystem (CSV datasets)', 'Jupyter Notebooks'],
    },
  },
  7: {
    aliases: ['ChatGPT Clone', 'Chatgpt Clone', 'GPT Clone'],
    corpusNames: ['Chatgpt Clone'],
    image: '/demos/chatgpt-clone/chat.jpg',
    highlights: ['Next.js', 'FastAPI', 'LangGraph', 'ChromaDB'],
    overview:
      'Full-stack ChatGPT-style assistant specialised for institutional policy. Retrieval-Augmented Generation grounds every answer in real policy documents, with a FastAPI + LangGraph backend, ChromaDB vector store, PostgreSQL checkpointing, and a streaming Next.js chat UI.',
    techStack: {
      frontend: ['Next.js 14 (App Router)', 'TypeScript', 'Tailwind CSS', 'Motion (Framer Motion)', 'Lucide React', 'React Context API'],
      backend: ['FastAPI (Python 3.12+)', 'LangChain & LangGraph', 'OpenAI GPT-4o-mini', 'PostgreSQL / Supabase', 'LangGraph PostgresSaver'],
      infrastructure: ['Docker & Docker Compose', 'ChromaDB', 'OpenAI Embeddings', 'LangSmith'],
    },
  },
  8: {
    aliases: ['YarnScript', 'Yarnscript', 'Yarn Script'],
    corpusNames: ['Yarnscript'],
    image: '/demos/yarnscript/demo-poster.jpg',
    highlights: ['Next.js', 'AssemblyAI', 'Convex', 'Embeddings'],
    overview:
      'AI teleprompter that follows your voice instead of scrolling at a fixed speed. Live AssemblyAI transcription is matched semantically against the script with OpenAI embeddings and Convex vector search, so it keeps up even when you skip words, ad-lib, or jump ahead. Designed, built, and polished as a four-hour product sprint.',
    techStack: {
      frontend: ['Next.js 16', 'React 19', 'TypeScript', 'CSS Modules', 'Web Audio API', 'WebSockets'],
      backend: ['Next.js API Routes', 'AssemblyAI Streaming Speech-to-Text', 'OpenAI text-embedding-3-small', 'Convex database & vector search', 'Server-side script preparation', 'Temporary AssemblyAI auth tokens'],
      infrastructure: ['Vercel', 'Convex cloud infrastructure', 'Vitest', 'ESLint'],
    },
  },
  9: {
    aliases: ['SoundSnag', 'Sound Snag', 'Soundsnag'],
    corpusNames: ['Soundsnag'],
    image: '/demos/soundsnag/demo-poster.jpg',
    unframed: true,
    highlights: ['SwiftUI', 'SwiftData', 'yt-dlp', 'ffmpeg'],
    overview:
      'Native SwiftUI Mac app with two tools: Snag Audio saves the audio from YouTube, Instagram, and TikTok links through a bundled yt-dlp, and Convert Files converts images, PDFs, audio, and video locally with ImageIO and ffmpeg. Runs fully sandboxed with no backend or accounts, plus a menu bar extra, SwiftData history, and Swift Charts insights.',
    techStack: {
      frontend: ['SwiftUI', 'Swift 6', 'AppKit menu bar extra', 'Swift Charts', 'Observation', 'UserNotifications'],
      backend: ['Bundled yt-dlp (onedir)', 'Bundled ffmpeg', 'Deno for yt-dlp challenges', 'ImageIO & CoreGraphics', 'AVFoundation'],
      infrastructure: ['SwiftData', 'App Sandbox', 'Security-scoped bookmarks', 'XcodeGen', 'Pinned, checksummed binaries'],
    },
  },
  10: {
    aliases: ['SelahNote Creator Dashboard', 'Creator Dashboard', 'SelahNote UGC Dashboard', 'UGC Dashboard'],
    corpusNames: ['Selahnote Creator Dashboard'],
    image: '/demos/selahnote-ugc/demo-poster.jpg',
    unframed: true,
    highlights: ['Next.js', 'Convex', 'RevenueCat', 'Firebase Auth'],
    overview:
      'Internal web app for SelahNote\'s UGC creator program. Live Convex subscriptions show referral performance and subscription outcomes as RevenueCat webhooks arrive, staff log creator content and reconcile events, and monthly payouts are recorded as one idempotent, serializable transaction with a full audit trail.',
    techStack: {
      frontend: ['Next.js 16', 'React 19', 'TypeScript', 'Convex React client', 'Firebase Authentication'],
      backend: ['Convex queries & mutations', 'RevenueCat webhooks', 'Role-based admin membership', 'Idempotent payout batches', 'Audit log'],
      infrastructure: ['Convex cloud', 'Firebase', 'Environment-scoped indexes', 'Vitest'],
    },
  },
  11: {
    aliases: ['V1 ProdBot', 'ProdBot', 'Prod Bot', 'V1Church ProdBot', 'V1 Church ProdBot'],
    corpusNames: ['V1 Prodbot'],
    image: '/demos/prodbot/demo-poster.jpg',
    unframed: true,
    highlights: ['React', 'Convex', 'OpenAI', 'React Flow'],
    overview:
      'Documentation and troubleshooting assistant for V1 Church production teams. Streams answers grounded in approved campus docs with a visible reasoning summary, renders the campus wiring diagram with React Flow, and lets admins turn notes and chat descriptions into AI drafts that are reviewed against the approved version before they go live.',
    techStack: {
      frontend: ['Vite', 'React 19', 'TypeScript', 'Tailwind CSS 4', 'shadcn/ui', 'ElevenLabs UI', 'React Flow', 'Streamdown'],
      backend: ['Convex', 'OpenAI Responses API', 'Structured outputs', 'unpdf PDF extraction', 'Zod', 'YAML wiring documents'],
      infrastructure: ['Vercel', 'Convex cloud', 'Bun', 'GitHub Actions CI', 'convex-test'],
    },
  },
};

export const catalog: CatalogProject[] = projectCards
  .filter((card) => details[card.id])
  .map((card) => {
    const extra = details[card.id];
    return {
      id: card.id,
      title: card.title,
      tagline: card.tagline,
      description: card.description,
      category: card.category,
      image: extra.image,
      orientation: card.landscape ? 'landscape' : 'portrait',
      framed: !extra.unframed,
      href: `/projects/${card.id}`,
      link: card.link,
      github: card.github,
      highlights: extra.highlights,
      aliases: extra.aliases,
      corpusNames: extra.corpusNames,
      overview: extra.overview,
      techStack: extra.techStack,
    };
  });

export function toCard(project: CatalogProject): ProjectCardData {
  const { id, title, tagline, description, category, image, orientation, framed, href, link, github, highlights } = project;
  return { id, title, tagline, description, category, image, orientation, framed, href, link, github, highlights };
}

function squash(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function findProjectByName(name: string): CatalogProject | null {
  const needle = squash(name);
  if (!needle) return null;

  const exact = catalog.find((project) =>
    [project.title, ...project.aliases, ...project.corpusNames].some((alias) => squash(alias) === needle)
  );
  if (exact) return exact;

  return (
    catalog.find((project) =>
      [project.title, ...project.aliases].some((alias) => {
        const candidate = squash(alias);
        return candidate.includes(needle) || needle.includes(candidate);
      })
    ) ?? null
  );
}

export function findProjectByCorpusName(corpusName: string): CatalogProject | null {
  const needle = squash(corpusName);
  return catalog.find((project) => project.corpusNames.some((name) => squash(name) === needle)) ?? null;
}

export function projectById(id: number): CatalogProject | null {
  return catalog.find((project) => project.id === id) ?? null;
}

/** Every string a project's stack is described with, for keyword evidence. */
export function projectStackText(project: CatalogProject): string[] {
  return [
    ...(project.techStack.frontend ?? []),
    ...(project.techStack.backend ?? []),
    ...(project.techStack.infrastructure ?? []),
    ...project.highlights,
  ];
}

/**
 * Longest-first alias list for inline mention detection in the chat UI. Short
 * aliases such as "Sentio" or "Next" are excluded so ordinary prose does not
 * light up as a project link.
 */
export const mentionAliases: { alias: string; id: number }[] = catalog
  .flatMap((project) =>
    [project.title, ...project.aliases]
      .filter((alias) => alias.length >= 6 || alias.includes('+'))
      .map((alias) => ({ alias, id: project.id }))
  )
  .sort((a, b) => b.alias.length - a.alias.length);
