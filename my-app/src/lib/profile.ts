import type { ContactLink, JourneyNode, SkillGroup, TimelineItem } from './chat-events';

/**
 * Structured facts about Kyle-Anthony that the agent answers from directly.
 * The prose corpus in backend/project-descriptions stays the source for
 * open-ended questions; this file is for things that should never be fuzzy —
 * start years, links, the timeline.
 */

export const profile = {
  name: 'Kyle-Anthony Hay',
  headline: 'AI Engineer & Developer',
  location: 'Brooklyn, New York',
  summary:
    'Software developer focused on mobile and frontend work, with production experience shipping AI-powered products: RAG systems, vector search, and LLM orchestration. Currently an AI Engineer at Cognizant; always building on the side.',
  availability: [
    'Open to full-time software engineering roles',
    'Open to contract and freelance work',
    'Open to hybrid or on-site roles',
  ],
  interests: [
    'iOS / mobile development',
    'Frontend engineering',
    'AI/ML engineering and RAG systems',
    'Vector databases and LLM orchestration',
  ],
  email: 'haykyle917@gmail.com',
  resumePdf: '/Kyle-Anthony_Resume.pdf',
  resumePage: '/resume',
  contactPage: '/contact',
};

export const timeline: TimelineItem[] = [
  {
    kind: 'work',
    title: 'AI Engineer',
    org: 'Cognizant',
    period: 'Nov 2025 – Present',
    detail: 'AI-assisted synthetic-data testbed for a global data warehouse, a DistilBERT sentiment fine-tune, and ETL regression testing across millions of records.',
  },
  {
    kind: 'education',
    title: 'B.S. Computer Science',
    org: 'CUNY Hunter College',
    period: 'Jun 2024',
  },
  {
    kind: 'work',
    title: 'Software Engineering Intern',
    org: 'The Difference',
    period: 'Jul – Sep 2023',
    detail: 'Built a web version of a fitness app from Figma designs and evaluated web technologies for an app-to-web migration.',
  },
];

/**
 * Development journey for the flowchart card: work, school, and the projects
 * that mark each step, oldest first. Project dates come from their git
 * history and App Store records.
 */
export const journey: JourneyNode[] = [
  {
    id: 'start',
    kind: 'start',
    period: '2022',
    title: 'Started building software',
    caption: 'JavaScript, React and Next.js on the web; Python and Java.',
  },
  {
    id: 'intern',
    kind: 'work',
    period: 'Jul 2023',
    title: 'Software Engineering Intern, The Difference',
  },
  {
    id: 'ios',
    kind: 'project',
    period: '2023',
    title: 'First native iOS app',
    caption: 'UIKit fundamentals, networking, and Swift Concurrency.',
    projects: [{ id: 4, title: 'Country Viewer', href: '/projects/4' }],
  },
  {
    id: 'munchmap',
    kind: 'project',
    period: 'Feb 2024',
    title: '1st place, Headstarter Hackathon',
    caption: 'MunchMap: a role-based React food-donation workflow, built with a three-person team.',
  },
  {
    id: 'degree',
    kind: 'education',
    period: 'Jun 2024',
    title: 'B.S. Computer Science, CUNY Hunter College',
  },
  {
    id: 'selahnote',
    kind: 'launch',
    period: 'Aug 2025',
    title: 'Launched SelahNote on the App Store',
    caption: 'Solo AI product: live transcription, scripture detection, structured notes. 400+ users.',
    projects: [{ id: 1, title: 'SelahNote', href: '/projects/1' }],
  },
  {
    id: 'cognizant',
    kind: 'work',
    period: 'Nov 2025',
    title: 'AI Engineer, Cognizant',
    caption: 'Synthetic-data testbed for a global data warehouse, a DistilBERT fine-tune, ETL regression testing.',
  },
  {
    id: 'revature',
    kind: 'education',
    period: 'Jan 2026',
    title: 'Revature AI Engineering program',
    caption: 'Team-built RAG and agent products: AI and front-end on Sentio+, backend on OnTract.',
    projects: [
      { id: 6, title: 'Sentio+', href: '/projects/6' },
      { id: 5, title: 'OnTract', href: '/projects/5' },
    ],
  },
  {
    id: 'yarnscript',
    kind: 'project',
    period: 'Mar 2026',
    title: 'Four-hour product sprint',
    caption: 'Voice-following AI teleprompter with live transcription and vector search.',
    projects: [{ id: 8, title: 'YarnScript', href: '/projects/8' }],
  },
  {
    id: 'fall-2026',
    kind: 'launch',
    period: 'Sep 2026',
    title: 'Shipped tools for real users',
    caption: 'A production assistant requested by V1 Church, a creator-program dashboard, and a native Mac app.',
    projects: [
      { id: 11, title: 'V1 ProdBot', href: '/projects/11' },
      { id: 10, title: 'SelahNote Creator Dashboard', href: '/projects/10' },
      { id: 9, title: 'SoundSnag', href: '/projects/9' },
    ],
  },
  {
    id: 'rebuilds',
    kind: 'project',
    period: 'Oct 2026',
    title: 'Rebuilt Sentio+ and OnTract solo on Convex',
    caption: 'New interfaces, Convex backends, and live demos.',
    projects: [
      { id: 6, title: 'Sentio+', href: '/projects/6' },
      { id: 5, title: 'OnTract', href: '/projects/5' },
    ],
  },
];

export const contactLinks: ContactLink[] = [
  { kind: 'email', label: 'Email', href: `mailto:${profile.email}`, detail: profile.email },
  { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/kyle-anthonyhay/' },
  { kind: 'github', label: 'GitHub', href: 'https://github.com/KyleAnthonyHay' },
  { kind: 'resume', label: 'Résumé (PDF)', href: profile.resumePdf },
  { kind: 'contact', label: 'Contact form', href: profile.contactPage },
  { kind: 'medium', label: 'Medium', href: 'https://medium.com/@kyleanthonyhay' },
  { kind: 'x', label: 'X / Twitter', href: 'https://x.com/KyleAnthonyHay' },
];

/**
 * Skills with the year Kyle-Anthony started using them. Aliases let a visitor
 * ask "does he know postgres?" and land on PostgreSQL. Keep names in the form
 * they should be displayed.
 */
export interface SkillDefinition {
  name: string;
  since?: number;
  aliases?: string[];
}

export interface SkillGroupDefinition {
  name: string;
  skills: SkillDefinition[];
}

export const skillGroups: SkillGroupDefinition[] = [
  {
    name: 'Languages',
    skills: [
      { name: 'Swift', since: 2023 },
      { name: 'TypeScript', since: 2022, aliases: ['ts'] },
      { name: 'JavaScript', since: 2022, aliases: ['js', 'es6'] },
      { name: 'Python', since: 2022 },
      { name: 'Java', since: 2022 },
      { name: 'Dart', since: 2023 },
      { name: 'C++', aliases: ['cpp', 'c plus plus'] },
      { name: 'SQL', since: 2023 },
    ],
  },
  {
    name: 'Mobile',
    skills: [
      { name: 'SwiftUI', since: 2023, aliases: ['swift ui'] },
      { name: 'UIKit', since: 2023, aliases: ['ui kit'] },
      { name: 'Flutter', since: 2023 },
      { name: 'SwiftData', since: 2023 },
      { name: 'Combine', since: 2023, aliases: ['combine framework'] },
      { name: 'Swift Concurrency', since: 2023, aliases: ['async/await', 'async await'] },
      { name: 'AVFoundation', aliases: ['av foundation'] },
      { name: 'StoreKit 2', aliases: ['storekit', 'in-app purchases', 'in app purchases', 'subscriptions'] },
      { name: 'RevenueCat', aliases: ['revenue cat'] },
      { name: 'MVVM', aliases: ['mvvm architecture'] },
    ],
  },
  {
    name: 'Frontend',
    skills: [
      { name: 'React', since: 2022, aliases: ['reactjs', 'react.js'] },
      { name: 'Next.js', since: 2022, aliases: ['nextjs', 'next js', 'next'] },
      { name: 'Tailwind CSS', since: 2022, aliases: ['tailwind', 'tailwindcss'] },
      { name: 'Radix UI', aliases: ['radix'] },
      { name: 'Framer Motion', aliases: ['motion', 'framer'] },
      { name: 'React Hook Form', aliases: ['hook form'] },
      { name: 'Zod' },
      { name: 'Figma' },
      { name: 'HTML & CSS', aliases: ['html', 'css'] },
    ],
  },
  {
    name: 'Backend & Data',
    skills: [
      { name: 'Node.js', since: 2022, aliases: ['node', 'nodejs'] },
      { name: 'FastAPI', since: 2024, aliases: ['fast api'] },
      { name: 'Django', since: 2024 },
      { name: 'Spring Boot', since: 2024, aliases: ['spring', 'springboot'] },
      { name: 'Javalin' },
      { name: 'REST APIs', aliases: ['rest', 'restful', 'rest api', 'api design', 'apis'] },
      { name: 'PostgreSQL', since: 2023, aliases: ['postgres', 'postgresql', 'relational databases'] },
      { name: 'pgvector', aliases: ['pg vector'] },
      { name: 'Supabase', since: 2024 },
      { name: 'Firebase', since: 2023, aliases: ['firestore', 'cloud firestore', 'firebase auth'] },
      { name: 'Convex', since: 2025 },
      { name: 'WebSockets', aliases: ['websocket', 'web sockets', 'realtime', 'real-time'] },
    ],
  },
  {
    name: 'AI & ML',
    skills: [
      { name: 'LangChain', since: 2024, aliases: ['lang chain'] },
      { name: 'LangGraph', since: 2024, aliases: ['lang graph'] },
      { name: 'OpenAI APIs', since: 2024, aliases: ['openai', 'gpt', 'gpt-4o', 'chatgpt api', 'llm', 'llms', 'large language models'] },
      { name: 'AWS Bedrock', since: 2024, aliases: ['bedrock', 'claude', 'anthropic'] },
      { name: 'Retrieval-Augmented Generation', aliases: ['rag', 'retrieval augmented generation', 'retrieval'] },
      { name: 'Vector databases', aliases: ['vector database', 'vector search', 'vector db', 'embeddings', 'semantic search'] },
      { name: 'Pinecone' },
      { name: 'ChromaDB', since: 2025, aliases: ['chroma'] },
      { name: 'AI agents', aliases: ['agents', 'agentic', 'tool calling', 'function calling', 'ai orchestration'] },
      { name: 'Prompt engineering', aliases: ['prompting', 'prompt design'] },
      { name: 'AssemblyAI', aliases: ['speech-to-text', 'speech to text', 'transcription'] },
      { name: 'Fine-tuning (RoBERTa)', aliases: ['fine-tuning', 'fine tuning', 'roberta', 'transformers', 'hugging face', 'huggingface'] },
      { name: 'TensorFlow / Keras', since: 2025, aliases: ['tensorflow', 'keras'] },
      { name: 'Pandas & NumPy', aliases: ['pandas', 'numpy'] },
      { name: 'LangSmith', aliases: ['ai observability', 'llm observability'] },
    ],
  },
  {
    name: 'Cloud & Infrastructure',
    skills: [
      { name: 'Docker', since: 2025, aliases: ['docker compose', 'containers'] },
      { name: 'AWS', aliases: ['amazon web services'] },
      { name: 'Google Cloud', since: 2024, aliases: ['gcp', 'google cloud platform', 'cloud run', 'cloud functions'] },
      { name: 'Vercel' },
      { name: 'Stripe', since: 2025, aliases: ['payments', 'payment processing'] },
      { name: 'Resend', aliases: ['transactional email'] },
      { name: 'Git & GitHub', since: 2022, aliases: ['git', 'github', 'version control'] },
      { name: 'Postman' },
      { name: 'Jupyter', aliases: ['jupyter notebooks', 'notebooks'] },
    ],
  },
];

/** Broad categories with a start year, for "how long has he been doing X" questions. */
export const disciplines: SkillDefinition[] = [
  { name: 'Software development', since: 2022, aliases: ['software engineering', 'programming', 'coding', 'development'] },
  { name: 'iOS development', since: 2023, aliases: ['ios', 'iphone', 'mobile development', 'mobile', 'apple platforms'] },
  { name: 'Frontend development', since: 2022, aliases: ['frontend', 'front-end', 'front end', 'web development', 'web'] },
  { name: 'Backend development', since: 2024, aliases: ['backend', 'back-end', 'back end', 'apis and services'] },
  { name: 'AI/ML engineering', since: 2025, aliases: ['ai', 'ml', 'machine learning', 'artificial intelligence', 'ai engineering', 'ai/ml'] },
  { name: 'Full-stack development', since: 2022, aliases: ['full stack', 'full-stack', 'fullstack'] },
];

/**
 * When a visitor asks about something Kyle-Anthony has not used, point at the
 * closest thing he has. Keys are lowercase search terms.
 */
export const relatedStrengths: Record<string, string[]> = {
  'react native': ['React', 'SwiftUI', 'Flutter'],
  kotlin: ['Swift', 'Java', 'Flutter'],
  android: ['Flutter', 'SwiftUI', 'Java'],
  vue: ['React', 'Next.js', 'TypeScript'],
  angular: ['React', 'Next.js', 'TypeScript'],
  svelte: ['React', 'Next.js'],
  go: ['Python', 'FastAPI', 'Java'],
  golang: ['Python', 'FastAPI', 'Java'],
  rust: ['C++', 'Swift', 'Python'],
  'c#': ['Java', 'Swift', 'TypeScript'],
  '.net': ['Spring Boot', 'FastAPI', 'Java'],
  ruby: ['Python', 'Django', 'FastAPI'],
  rails: ['Django', 'Next.js', 'FastAPI'],
  php: ['Node.js', 'Python', 'Django'],
  laravel: ['Django', 'Next.js'],
  express: ['Node.js', 'Next.js', 'FastAPI'],
  graphql: ['REST APIs', 'Supabase', 'Convex'],
  kubernetes: ['Docker', 'Google Cloud', 'AWS'],
  terraform: ['Docker', 'Google Cloud', 'AWS'],
  azure: ['AWS', 'Google Cloud', 'Supabase'],
  pytorch: ['TensorFlow / Keras', 'Fine-tuning (RoBERTa)', 'Pandas & NumPy'],
  'hugging face': ['Fine-tuning (RoBERTa)', 'OpenAI APIs', 'TensorFlow / Keras'],
  redis: ['PostgreSQL', 'Supabase', 'Firebase'],
  mysql: ['PostgreSQL', 'SQL', 'Supabase'],
  weaviate: ['Pinecone', 'ChromaDB', 'pgvector'],
  qdrant: ['Pinecone', 'ChromaDB', 'pgvector'],
  llamaindex: ['LangChain', 'LangGraph', 'Retrieval-Augmented Generation'],
  gemini: ['OpenAI APIs', 'AWS Bedrock', 'LangChain'],
  mistral: ['OpenAI APIs', 'AWS Bedrock', 'LangChain'],
};

export function toSkillGroups(): SkillGroup[] {
  return skillGroups.map((group) => ({
    name: group.name,
    skills: group.skills.map(({ name, since }) => (since ? { name, since } : { name })),
  }));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#./ ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export interface SkillMatch {
  skill: SkillDefinition;
  group: string;
}

/** Exact match on a skill name or alias, after loose normalisation. */
export function findSkill(term: string): SkillMatch | null {
  const needle = normalize(term);
  if (!needle) return null;

  for (const discipline of disciplines) {
    const names = [discipline.name, ...(discipline.aliases ?? [])].map(normalize);
    if (names.includes(needle)) return { skill: discipline, group: 'Discipline' };
  }

  for (const group of skillGroups) {
    for (const skill of group.skills) {
      const names = [skill.name, ...(skill.aliases ?? [])].map(normalize);
      if (names.includes(needle)) return { skill, group: group.name };
    }
  }

  return null;
}

/** Skills whose name or alias appears inside a longer phrase ("experience with React and Node"). */
export function findSkillsInText(text: string): SkillMatch[] {
  const haystack = ` ${normalize(text)} `;
  const matches: SkillMatch[] = [];
  const seen = new Set<string>();

  for (const group of skillGroups) {
    for (const skill of group.skills) {
      const names = [skill.name, ...(skill.aliases ?? [])].map(normalize);
      if (names.some((name) => name.length > 1 && haystack.includes(` ${name} `)) && !seen.has(skill.name)) {
        seen.add(skill.name);
        matches.push({ skill, group: group.name });
      }
    }
  }

  return matches;
}

export function relatedStrengthsFor(term: string): string[] {
  const needle = normalize(term);
  for (const [key, related] of Object.entries(relatedStrengths)) {
    if (needle === key || needle.includes(key)) return related;
  }
  return [];
}
