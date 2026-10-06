import type { ScreenSource } from '@/components/PhoneFrame';

export type ProjectCategory = 'iOS Apps' | 'macOS Apps' | 'Web Apps';

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
  video?: {
    src: string;
    webm?: string;
    poster?: string;
    url?: string;
    ratio?: number;
    /** The recording already carries its own window chrome, so skip BrowserFrame. */
    bare?: boolean;
  };
  link?: string;
  github?: string;
  landscape?: boolean;
  category: ProjectCategory;
  /** Included in the home page's curated grid. */
  featured?: boolean;
  /** Running today, for real users. */
  live?: boolean;
}

/**
 * Single source of truth for the project cards. Both the home grid and the
 * projects index read from here, so a card only has to be described once —
 * previously the two pages kept separate lists and drifted apart.
 */
export const projects: ProjectCardData[] = [
  {
    id: 11,
    title: 'V1 ProdBot',
    tagline: 'AI assistant for church production teams',
    description:
      'Documentation and troubleshooting assistant for V1 Church production volunteers, with grounded answers, an interactive wiring diagram, and AI-drafted docs an admin approves.',
    image: '/demos/prodbot/demo-poster.jpg',
    video: { src: '/products/prodbot/loop.mp4', poster: '/products/prodbot/poster.jpg', ratio: 16 / 9, bare: true },
    link: 'https://prodbot.kyleanthonyhay.com',
    github: 'https://github.com/KyleAnthonyHay/V1Church-ProdBot',
    landscape: true,
    category: 'Web Apps',
    featured: true,
    live: true,
  },
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
    live: true,
  },
  {
    id: 5,
    title: 'OnTract',
    tagline: 'Contract management, read for you',
    description:
      'Contract management platform: every contract on one dashboard, AI-extracted terms, answers that quote the clause they came from, and a client portal for review.',
    image: '/demos/ontract/overview.jpg',
    video: { src: '/products/ontract/loop.mp4', poster: '/products/ontract/poster.jpg', ratio: 16 / 9, bare: true },
    link: 'https://ontract.kyleanthonyhay.com',
    landscape: true,
    category: 'Web Apps',
    featured: true,
    live: true,
  },
  {
    id: 6,
    title: 'Sentio+',
    tagline: 'App-review intelligence',
    description:
      'Customer-intelligence platform that reads thousands of app reviews and answers questions with the numbers and the reviews behind them, using RAG and an LLM agent.',
    image: '/projects/sentio-1.png',
    video: { src: '/products/sentio/loop.mp4', poster: '/products/sentio/poster.jpg', ratio: 16 / 9, bare: true },
    link: 'https://sentio.kyleanthonyhay.com',
    github: 'https://github.com/KyleAnthonyHay/sentio',
    landscape: true,
    category: 'Web Apps',
    featured: true,
    live: true,
  },
  {
    id: 10,
    title: 'SelahNote Creator Dashboard',
    tagline: 'UGC creator referrals and payouts',
    description:
      'Internal dashboard for SelahNote\u2019s UGC creator program: live referral performance, subscription outcomes, a content log, and monthly payouts recorded in one transaction.',
    image: '/demos/selahnote-ugc/demo-poster.jpg',
    video: {
      src: '/demos/selahnote-ugc/demo.mp4',
      webm: '/demos/selahnote-ugc/demo.webm',
      poster: '/demos/selahnote-ugc/demo-poster.jpg',
      ratio: 1440 / 870,
      bare: true,
    },
    landscape: true,
    category: 'Web Apps',
    featured: true,
    live: true,
  },
  {
    id: 9,
    title: 'SoundSnag',
    tagline: 'Native Mac app for audio and file conversion',
    description:
      'Native SwiftUI Mac app that saves the audio from YouTube, Instagram, and TikTok links and converts images, PDFs, audio, and video locally, with no accounts or backend.',
    image: '/demos/soundsnag/demo-poster.jpg',
    video: {
      src: '/demos/soundsnag/demo.mp4',
      poster: '/demos/soundsnag/demo-poster.jpg',
      ratio: 1280 / 820,
      bare: true,
    },
    landscape: true,
    category: 'macOS Apps',
    featured: true,
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
    live: true,
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
];

export const featuredProjects = projects.filter((p) => p.featured);
