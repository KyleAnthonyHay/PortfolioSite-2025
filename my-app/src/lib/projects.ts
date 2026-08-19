import type { ScreenSource } from '@/components/PhoneFrame';

export type ProjectCategory = 'iOS Apps' | 'Web Apps';

export interface ProjectCardData {
  /** Detail page id — the card links to /projects/{id}. */
  id: number;
  title: string;
  /** One-liner for the dense home grid. */
  tagline: string;
  /** Fuller copy for the projects index. */
  description: string;
  image: string;
  /** When set, the card renders this in a phone frame instead of `image`. */
  screen?: ScreenSource;
  /** Landscape counterpart to `screen`: a looping demo shown in browser chrome. */
  video?: { src: string; webm?: string; poster?: string; url?: string; ratio?: number };
  link?: string;
  github?: string;
  landscape?: boolean;
  category: ProjectCategory;
  /** Included in the home page's curated grid. */
  featured?: boolean;
}

/**
 * Single source of truth for the project cards. Both the home grid and the
 * projects index read from here, so a card only has to be described once —
 * previously the two pages kept separate lists and drifted apart.
 */
export const projects: ProjectCardData[] = [
  {
    id: 1,
    title: 'SelahNote',
    tagline: 'AI notetaker for sermons',
    description:
      'AI-powered notetaker for sermons with file organization, recording summaries, and file upload capabilities.',
    image: '/projects/selah-note.png',
    screen: {
      type: 'video',
      src: '/demos/selahnote/onboarding.mp4',
      webm: '/demos/selahnote/onboarding.webm',
      poster: '/demos/selahnote/onboarding-poster.jpg',
    },
    link: 'https://selahnote.app',
    category: 'iOS Apps',
    featured: true,
  },
  {
    id: 2,
    title: 'Expense Tracker',
    tagline: 'iOS finance management',
    description:
      'Finance analytics tool that gathers data from an API and displays monthly transactions on a graph with category assignment.',
    image: '/demos/expense-tracker/device.png',
    github: 'https://github.com/KyleAnthonyHay/ExpenseTracker/tree/main/ExpenseTracker',
    category: 'iOS Apps',
    featured: true,
  },
  {
    id: 3,
    title: 'The Wall',
    tagline: 'Social media platform',
    description:
      'Social board application displaying user posts to a collective feed. Users can sign up using Gmail.',
    image: '/demos/the-wall/device.png',
    github: 'https://github.com/KyleAnthonyHay/socialmedia-appV2.0',
    category: 'iOS Apps',
    featured: true,
  },
  {
    id: 4,
    title: 'Country Viewer',
    tagline: 'World country reference',
    description:
      'Browse all countries and their data. Population is automatically updated via a country data gathering API.',
    image: '/demos/country-viewer/device.png',
    github: 'https://github.com/KyleAnthonyHay/Countries-App',
    category: 'iOS Apps',
  },
  {
    id: 8,
    title: 'YarnScript',
    tagline: 'AI teleprompter that follows your voice',
    description:
      'AI-powered teleprompter that follows your voice using live transcription and semantic matching — even when you skip words, ad-lib, or jump ahead.',
    image: '/demos/yarnscript/demo-poster.jpg',
    video: {
      src: '/demos/yarnscript/demo.mp4',
      webm: '/demos/yarnscript/demo.webm',
      poster: '/demos/yarnscript/demo-poster.jpg',
      url: 'yarn-script.vercel.app',
    },
    link: 'https://yarn-script.vercel.app',
    github: 'https://github.com/KyleAnthonyHay/yarn-script',
    landscape: true,
    category: 'Web Apps',
    featured: true,
  },
  {
    id: 6,
    title: 'Sentio+',
    tagline: 'Sentiment analysis tool',
    description:
      'AI-powered decision-support platform transforming customer review data into actionable insights using RAG architecture.',
    image: '/projects/sentio-1.png',
    github: 'https://github.com/KyleAnthonyHay/sentio',
    landscape: true,
    category: 'Web Apps',
    featured: true,
  },
  {
    id: 5,
    title: 'OnTract',
    tagline: 'Contract management system',
    description:
      'Enterprise-grade Contract Management System with AI-powered search, automated metadata extraction, and conversational Q&A.',
    image: '/projects/ontract.png',
    link: 'https://www.ontract.app/',
    landscape: true,
    category: 'Web Apps',
    featured: true,
  },
  {
    id: 7,
    title: 'ChatGPT Clone',
    tagline: 'AI chat interface',
    description:
      'Specialized AI Assistant for institutional policies using RAG architecture to ground responses in actual policy documents.',
    image: '/projects/chatgpt-clone.png',
    link: 'https://chat-gpt-clone-delta-ten.vercel.app/',
    landscape: true,
    category: 'Web Apps',
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
