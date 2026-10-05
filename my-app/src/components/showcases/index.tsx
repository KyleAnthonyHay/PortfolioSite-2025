'use client';

import {
  BookOpen,
  Brain,
  FolderTree,
  Gauge,
  Globe,
  LayoutDashboard,
  Library,
  MessageSquare,
  Mic,
  Play,
  Search,
  Sparkles,
  Sun,
} from 'lucide-react';
import ProductShowcase, { type ShowcaseItem } from '@/components/ProductShowcase';
import WalkthroughPlayer from '@/components/WalkthroughPlayer';

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
      icon: <Sun className={ic} />,
      title: 'Status, expirations, and obligations in one view.',
      description:
        'Row Level Security scopes every query to the signed-in organization, so the same dashboard serves multiple tenants without a leak. Alerts fire on renewals and expirations before they become someone\'s problem.',
      media: { kind: 'browser', src: '/demos/ontract/dashboard-light.jpg', alt: 'OnTract dashboard', url: 'ontract.app/dashboard', ratio: 1800 / 1012 },
    },
    {
      label: 'Walkthrough',
      icon: <Play className={ic} />,
      title: 'A narrated tour of OnTract.',
      description:
        'Under a minute in the real app: the dashboard, the terms OnTract reads for you, an answer that quotes its clause, and the client portal.',
      media: { kind: 'walkthrough', src: '/products/ontract/tour.mp4', poster: '/products/ontract/tour-poster.jpg' },
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
      media: { kind: 'browser', src: '/demos/sentio/overview.jpg', alt: 'Sentio+ Ask view', ratio: 16 / 9 },
    },
    {
      label: 'Insights',
      icon: <Gauge className={ic} />,
      title: 'Sentiment traced back to the aspect driving it.',
      description:
        'Rather than one score per review, Sentio+ pulls out the specific aspects customers react to and tracks each across time, category, and rating — turning a pile of feedback into a trend a team can act on.',
      media: { kind: 'browser', src: '/demos/sentio/insights.jpg', alt: 'Sentio+ analytics view', ratio: 16 / 9 },
    },
    {
      label: 'Walkthrough',
      icon: <Play className={ic} />,
      title: 'A narrated tour of Sentio+.',
      description:
        'Under a minute in the real app: the analytics, a question answered with the numbers and the reviews behind them, and the live customer map.',
      media: { kind: 'walkthrough', src: '/products/sentio/tour.mp4', poster: '/products/sentio/tour-poster.jpg' },
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

const soundSnag: Showcase = {
  heading: 'Save the sound, convert the file, never leave your Mac.',
  orientation: 'landscape',
  items: [
    {
      label: 'Demo',
      icon: <Play className={ic} />,
      title: 'Paste a link, keep the audio.',
      description:
        'Paste a YouTube, Instagram, or TikTok link and SoundSnag previews it, then saves the audio in its original format through a bundled, pinned yt-dlp. Drop images, PDFs, audio, or video on Convert Files and ImageIO and ffmpeg handle the rest locally, all inside the App Sandbox with no accounts and no server.',
      media: {
        kind: 'recording',
        src: '/demos/soundsnag/demo.mp4',
        poster: '/demos/soundsnag/demo-poster.jpg',
        ratio: 1280 / 820,
      },
    },
  ],
};

const selahNoteDashboard: Showcase = {
  heading: 'A creator program, run from one live dashboard.',
  orientation: 'landscape',
  items: [
    {
      label: 'Demo',
      icon: <Play className={ic} />,
      title: 'Referrals, rewards, and payouts as they happen.',
      description:
        'Every page is a Convex subscription, so a RevenueCat webhook landing on the backend shows up without a refresh. Staff follow each creator\'s trials and conversions, log their UGC posts, and record a month\'s payout as a single serializable transaction that cannot pay the same reward twice.',
      media: {
        kind: 'recording',
        src: '/demos/selahnote-ugc/demo.mp4',
        webm: '/demos/selahnote-ugc/demo.webm',
        poster: '/demos/selahnote-ugc/demo-poster.jpg',
        ratio: 1440 / 870,
      },
    },
  ],
};

const prodBot: Showcase = {
  heading: 'Answers for the production booth before the service starts.',
  orientation: 'landscape',
  items: [
    {
      label: 'Demo',
      icon: <Play className={ic} />,
      title: 'Ask, explore the wiring, keep the docs current.',
      description:
        'Volunteers ask a question and get a streamed answer grounded in the campus\'s approved documentation, with the model\'s reasoning in a collapsible Thinking block. Explore draws the campus wiring diagram with React Flow, and admins describe a change in chat, let the AI redraw it, and approve it as a new revision.',
      media: {
        kind: 'recording',
        src: '/demos/prodbot/demo.mp4',
        poster: '/demos/prodbot/demo-poster.jpg',
        ratio: 1280 / 772,
      },
    },
    {
      label: 'Walkthrough',
      icon: <Play className={ic} />,
      title: 'A narrated tour of ProdBot.',
      description:
        'Under a minute in the real app: a volunteer asks for help, ProdBot starts from the point in the signal chain closest to the problem, and the fix becomes next week’s docs.',
      media: { kind: 'walkthrough', src: '/products/prodbot/tour.mp4', poster: '/products/prodbot/tour-poster.jpg' },
    },
    {
      label: 'Launch',
      icon: <Sparkles className={ic} />,
      title: 'The launch film.',
      description:
        'ProdBot’s 30-second launch film.',
      media: { kind: 'walkthrough', src: '/products/prodbot/launch.mp4', poster: '/products/prodbot/launch-poster.jpg' },
    },
  ],
};

const showcases: Record<number, Showcase> = {
  1: selahNote,
  4: countryApp,
  5: onTract,
  6: sentio,
  7: chatgptClone,
  8: yarnScript,
  9: soundSnag,
  10: selahNoteDashboard,
  11: prodBot,
};

export default function ProjectShowcase({ projectId }: { projectId: number }) {
  const showcase = showcases[projectId];
  if (!showcase) return null;

  // A narrated walkthrough says it all, so it replaces the tabbed showcase.
  const walkthrough = showcase.items.find((item) => item.media.kind === 'walkthrough');
  if (walkthrough && walkthrough.media.kind === 'walkthrough') {
    return (
      <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-zinc-100/70 border border-slate-200/50">
        <div className="px-6 py-12 md:px-14 md:py-16">
          <h2 className="max-w-[46rem] text-3xl md:text-[2.75rem] font-semibold tracking-tighter leading-[1.05] text-zinc-900 text-balance">
            {showcase.heading}
          </h2>
          <WalkthroughPlayer src={walkthrough.media.src} poster={walkthrough.media.poster} className="mt-12" />
        </div>
      </div>
    );
  }

  return (
    <ProductShowcase
      heading={showcase.heading}
      items={showcase.items}
      orientation={showcase.orientation}
    />
  );
}
