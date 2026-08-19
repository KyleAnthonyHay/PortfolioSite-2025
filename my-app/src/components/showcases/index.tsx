'use client';

import {
  BarChart3,
  BookOpen,
  Brain,
  FolderTree,
  Gauge,
  Globe,
  LayoutDashboard,
  Library,
  MessageSquare,
  Mic,
  Moon,
  Play,
  Search,
  Sparkles,
  Sun,
  Users,
} from 'lucide-react';
import ProductShowcase, { type ShowcaseItem } from '@/components/ProductShowcase';

const ic = 'w-4 h-4';

interface Showcase {
  heading: string;
  orientation?: 'portrait' | 'landscape';
  items: ShowcaseItem[];
}

const selahNote: Showcase = {
  heading: 'Everything a sermon leaves behind, in one app.',
  items: [
    {
      label: 'Walkthrough',
      icon: <Play className={ic} />,
      title: 'From spoken word to structured notes.',
      description:
        'A full pass through the app: open a sermon, follow the live transcript, and land on notes that are already organized and referenced.',
      media: {
        kind: 'phone',
        screen: {
          type: 'video',
          src: '/demos/selahnote/onboarding.mp4',
          webm: '/demos/selahnote/onboarding.webm',
          poster: '/demos/selahnote/onboarding-poster.jpg',
        },
      },
    },
    {
      label: 'Record',
      icon: <Mic className={ic} />,
      title: 'Transcription that keeps up with the room.',
      description:
        'Audio streams to AssemblyAI over a WebSocket while you record, so the transcript fills in live. A batch pass runs afterward for accuracy.',
      media: { kind: 'phone', screen: { type: 'image', src: '/demos/selahnote/transcript.png', alt: 'Live transcript while recording a sermon' } },
    },
    {
      label: 'AI notes',
      icon: <Sparkles className={ic} />,
      title: 'Summaries written for sermons, not meetings.',
      description:
        'GPT-4o runs against prompts tuned for preaching and lecture content, returning structured markdown with headings, takeaways, and quoted passages.',
      media: { kind: 'phone', screen: { type: 'image', src: '/demos/selahnote/summary.png', alt: 'AI-generated sermon summary' } },
    },
    {
      label: 'Scripture',
      icon: <BookOpen className={ic} />,
      title: 'Every reference caught and timestamped.',
      description:
        'Scripture mentions are detected as they are spoken, matched against the text, and linked back to the moment in the recording.',
      media: { kind: 'phone', screen: { type: 'image', src: '/demos/selahnote/references.png', alt: 'Detected scripture references with timestamps' } },
    },
    {
      label: 'Organize',
      icon: <FolderTree className={ic} />,
      title: 'Folders that hold a season of notes.',
      description:
        'Drag notes between folders, search across every transcription, and keep it all local-first with SwiftData while Convex syncs across devices.',
      media: { kind: 'phone', screen: { type: 'image', src: '/demos/selahnote/home.png', alt: 'SelahNote home screen with folders' } },
    },
    {
      label: 'Library',
      icon: <Library className={ic} />,
      title: 'The whole archive, one search away.',
      description:
        'Notes group by month and stay searchable by transcript text, so a half-remembered line is enough to find the sermon it came from.',
      media: { kind: 'phone', screen: { type: 'image', src: '/demos/selahnote/library.png', alt: 'All notes grouped by month' } },
    },
  ],
};

const expenseTracker: Showcase = {
  heading: 'Every transaction, charted the moment it lands.',
  items: [
    {
      label: 'Overview',
      icon: <BarChart3 className={ic} />,
      title: 'Spending that explains itself.',
      description:
        'Transactions arrive over URLSession and Combine, group by month, and accumulate into a running total that SwiftUI Charts draws as a single line — so a month of spending reads at a glance before you touch a single row.',
      media: { kind: 'phone-image', src: '/demos/expense-tracker/device.png', alt: 'ExpenseTracker overview with a cumulative spending chart' },
    },
  ],
};

const theWall: Showcase = {
  heading: 'One shared wall, updating as people post.',
  items: [
    {
      label: 'The Wall',
      icon: <Users className={ic} />,
      title: 'A feed with no algorithm in the way.',
      description:
        'Posts write straight to Cloud Firestore and come back through a live stream, so every signed-in user sees the same wall update in real time. One Flutter codebase covers iOS, Android, web, and desktop.',
      media: { kind: 'phone-image', src: '/demos/the-wall/device.png', alt: 'The Wall shared feed in dark mode' },
    },
  ],
};

const countryApp: Showcase = {
  heading: 'Every country in the world, one tap away.',
  items: [
    {
      label: 'Browse',
      icon: <Globe className={ic} />,
      title: 'A reference tool that loads without blocking.',
      description:
        'Built in UIKit with Swift Concurrency: the REST Countries API is fetched with async/await while a custom UIImageView extension streams each flag in, so the table stays responsive as 250 countries populate.',
      media: { kind: 'phone-image', src: '/demos/country-viewer/device.png', alt: 'Country list with flags and official names' },
    },
  ],
};

const onTract: Showcase = {
  heading: 'Contract intelligence for teams buried in paperwork.',
  orientation: 'landscape',
  items: [
    {
      label: 'Overview',
      icon: <LayoutDashboard className={ic} />,
      title: 'A single home for the whole contract portfolio.',
      description:
        'Documents are parsed, chunked, and embedded into PostgreSQL with pgvector on upload, and metadata is extracted automatically — so a contract becomes searchable the moment it lands rather than after someone tags it.',
      media: { kind: 'browser', src: '/demos/ontract/overview.jpg', alt: 'OnTract marketing overview', url: 'ontract.app', ratio: 1800 / 1012 },
    },
    {
      label: 'Dashboard',
      icon: <Moon className={ic} />,
      title: 'Status, expirations, and obligations in one view.',
      description:
        'Row Level Security scopes every query to the signed-in organization, so the same dashboard serves multiple tenants without a leak. Alerts fire on renewals and expirations before they become someone\'s problem.',
      media: { kind: 'browser', src: '/demos/ontract/dashboard-dark.jpg', alt: 'OnTract dashboard in dark mode', url: 'ontract.app/dashboard', ratio: 1800 / 1012 },
    },
    {
      label: 'Light mode',
      icon: <Sun className={ic} />,
      title: 'The same dashboard, built for daylight.',
      description:
        'Theming runs on Tailwind tokens over Radix primitives, so both themes share one component tree and stay accessible without a parallel set of styles to maintain.',
      media: { kind: 'browser', src: '/demos/ontract/dashboard-light.jpg', alt: 'OnTract dashboard in light mode', url: 'ontract.app/dashboard', ratio: 1800 / 1012 },
    },
  ],
};

const sentio: Showcase = {
  heading: 'Thousands of reviews, reduced to what actually matters.',
  orientation: 'landscape',
  items: [
    {
      label: 'Overview',
      icon: <Search className={ic} />,
      title: 'Ask a question, get an answer with receipts.',
      description:
        'A LangGraph agent runs semantic search over review embeddings in ChromaDB and answers in plain language, citing the specific reviews behind every claim so nothing rests on the model\'s word alone.',
      media: { kind: 'browser', src: '/demos/sentio/overview.jpg', alt: 'Sentio+ landing view', ratio: 1800 / 973 },
    },
    {
      label: 'Insights',
      icon: <Gauge className={ic} />,
      title: 'Sentiment traced back to the aspect driving it.',
      description:
        'Rather than one score per review, Sentio+ pulls out the specific aspects customers react to and tracks each across time, category, and rating — turning a pile of feedback into a trend a team can act on.',
      media: { kind: 'browser', src: '/demos/sentio/insights.jpg', alt: 'Sentio+ insights view', ratio: 1800 / 974 },
    },
  ],
};

const chatgptClone: Showcase = {
  heading: 'A policy expert that never has to guess.',
  orientation: 'landscape',
  items: [
    {
      label: 'Chat',
      icon: <MessageSquare className={ic} />,
      title: 'Answers grounded in the actual handbook.',
      description:
        'Every reply is retrieved from institutional policy documents in ChromaDB before generation, and LangGraph keeps conversation state in PostgreSQL so follow-up questions carry context. Where a general model would improvise, this one cites.',
      media: { kind: 'browser', src: '/demos/chatgpt-clone/chat.jpg', alt: 'Institutional policy chat interface', url: 'chat-gpt-clone-delta-ten.vercel.app', ratio: 1800 / 1012 },
    },
  ],
};

const yarnScript: Showcase = {
  heading: 'A teleprompter that listens while you speak.',
  orientation: 'landscape',
  items: [
    {
      label: 'Demo',
      icon: <Play className={ic} />,
      title: 'From pasted script to live delivery.',
      description:
        'Paste a script, allow microphone access, and start reading. AssemblyAI transcribes your voice over a WebSocket while YarnScript highlights each spoken word — and when you ad-lib, skip, or rephrase, semantic search over OpenAI embeddings recovers your position and keeps the active line centered.',
      media: {
        kind: 'browser-video',
        src: '/demos/yarnscript/demo.mp4',
        webm: '/demos/yarnscript/demo.webm',
        poster: '/demos/yarnscript/demo-poster.jpg',
        url: 'yarn-script.vercel.app',
        ratio: 16 / 9,
      },
    },
  ],
};

const showcases: Record<number, Showcase> = {
  1: selahNote,
  2: expenseTracker,
  3: theWall,
  4: countryApp,
  5: onTract,
  6: sentio,
  7: chatgptClone,
  8: yarnScript,
};

export default function ProjectShowcase({ projectId }: { projectId: number }) {
  const showcase = showcases[projectId];
  if (!showcase) return null;
  return (
    <ProductShowcase
      heading={showcase.heading}
      items={showcase.items}
      orientation={showcase.orientation}
    />
  );
}
