'use client';

import {
  MessageSquare,
  Upload,
  Calendar,
  Users,
  Bell,
  CreditCard,
  Search,
  Shield,
  Brain,
  TrendingUp,
  Filter,
  Database,
  BarChart3,
  FileText,
  History,
  ThumbsUp,
  BookOpen,
  Zap,
  Mic,
  FolderTree,
  Play,
  Youtube,
  FileAudio,
  Sparkles,
  RefreshCw,
  Globe,
  LayoutGrid,
  Flag,
  Building2,
  AudioLines,
  MousePointerClick,
  ScrollText,
  Gauge,
  Link2,
  Network,
  PanelTop,
} from 'lucide-react';

const ontractFeatures = [
  { icon: <Search className="w-4 h-4" />, title: 'AI-Powered Search', description: 'Semantic search using vector embeddings for natural language queries across all contracts.' },
  { icon: <MessageSquare className="w-4 h-4" />, title: 'Conversational Q&A', description: 'Chat interface powered by LangGraph agents with citations to source documents.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Automated Processing', description: 'Text extraction, intelligent chunking, and automatic metadata extraction from documents.' },
  { icon: <Calendar className="w-4 h-4" />, title: 'Lifecycle Management', description: 'Status tracking, expiration monitoring, and obligation tracking with audit trails.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Multi-Tenant Security', description: 'Organization-scoped data isolation using PostgreSQL Row Level Security.' },
  { icon: <Users className="w-4 h-4" />, title: 'Team Collaboration', description: 'Role-based access control, team invitations, and activity feeds.' },
  { icon: <Bell className="w-4 h-4" />, title: 'Alert System', description: 'Automated notifications for expirations, renewals, and custom reminders.' },
  { icon: <CreditCard className="w-4 h-4" />, title: 'Billing & Credits', description: 'Stripe-integrated subscription management with organization-wide credits.' },
];

const sentioFeatures = [
  { icon: <Brain className="w-4 h-4" />, title: 'AI-Powered Semantic Search', description: 'Semantic search across all reviews using vector embeddings, enabling natural language queries that understand context and meaning.' },
  { icon: <MessageSquare className="w-4 h-4" />, title: 'Conversational Q&A', description: 'Chat interface powered by LangGraph agents that can answer questions about reviews with citations to source documents.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Automated Document Processing', description: 'Text extraction and cleaning from CSV datasets, intelligent chunking for optimal retrieval, and metadata enrichment.' },
  { icon: <TrendingUp className="w-4 h-4" />, title: 'Aspect-Level Sentiment', description: 'Identifies specific product aspects driving sentiment, tracks trends across time and categories with evidence-grounded insights.' },
  { icon: <Filter className="w-4 h-4" />, title: 'Metadata-Aware Retrieval', description: 'Filter by app name, category, rating, date range with LLM-powered source selection for focused queries.' },
  { icon: <Database className="w-4 h-4" />, title: 'Vector Store Flexibility', description: 'Persistent local ChromaDB for development, HTTP client for distributed deployments, and ChromaDB Cloud for production.' },
  { icon: <BarChart3 className="w-4 h-4" />, title: 'Business Intelligence', description: 'Collection statistics, trend detection across time periods, category and rating-based analysis, and export-ready insights.' },
  { icon: <FileText className="w-4 h-4" />, title: 'Multi-Interface Access', description: 'Next.js web application for production, Streamlit demo for testing, and RESTful API for programmatic access.' },
];

const chatgptCloneFeatures = [
  { icon: <Brain className="w-4 h-4" />, title: 'AI Agent with Memory', description: 'LangGraph manages conversation state for multi-turn dialogues with context retention.' },
  { icon: <Search className="w-4 h-4" />, title: 'Semantic Search (RAG)', description: 'ChromaDB vector searches across policy documents for accurate, evidence-grounded responses.' },
  { icon: <BookOpen className="w-4 h-4" />, title: 'Policy-Specific Tools', description: 'Specialized tools for searching, listing, retrieving, and summarizing institutional policies.' },
  { icon: <History className="w-4 h-4" />, title: 'Persistent Chat History', description: 'Messages and threads saved to PostgreSQL for returning to previous conversations.' },
  { icon: <ThumbsUp className="w-4 h-4" />, title: 'Feedback System', description: 'Built-in mechanism for rating AI responses with LangSmith monitoring for quality assurance.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Modern UX', description: 'Responsive, dark-mode-first UI with message streaming and sidebar navigation.' },
];

const selahNoteFeatures = [
  { icon: <Mic className="w-4 h-4" />, title: 'Real-Time Transcription', description: 'High-quality audio capture with WebSocket-based streaming transcription to AssemblyAI during recording.' },
  { icon: <FileAudio className="w-4 h-4" />, title: 'Multiple Audio Sources', description: 'Direct recording, audio file upload from Files app, and YouTube video transcript extraction.' },
  { icon: <Sparkles className="w-4 h-4" />, title: 'AI Note Generation', description: 'Automated transcription with intelligent summarization via GPT-4o and scripture reference detection.' },
  { icon: <FolderTree className="w-4 h-4" />, title: 'Hierarchical Organization', description: 'Folder-based organization with drag-and-drop, search and sort, and cascade deletion.' },
  { icon: <Youtube className="w-4 h-4" />, title: 'YouTube Integration', description: 'URL validation supporting various YouTube formats with Cloud Run transcript fetching.' },
  { icon: <Play className="w-4 h-4" />, title: 'Advanced Audio Processing', description: 'Audio format conversion, background session management, and interruption handling.' },
  { icon: <Brain className="w-4 h-4" />, title: 'Dual Transcription', description: 'Live streaming for immediate feedback combined with batch transcription for maximum accuracy.' },
  { icon: <FileText className="w-4 h-4" />, title: 'Custom Prompts', description: 'Sophisticated prompts for sermon and lecture content with structured markdown output.' },
];

const countryViewerFeatures = [
  { icon: <Globe className="w-4 h-4" />, title: 'Country List', description: 'Scrollable table view with flag thumbnails, common names, and official names.' },
  { icon: <FileText className="w-4 h-4" />, title: 'Country Details', description: 'Flag banner, official name, capital, population, currency, and languages.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Async Data Loading', description: 'Swift Concurrency (async/await) for non-blocking API calls.' },
  { icon: <Flag className="w-4 h-4" />, title: 'Image Loading', description: 'Custom async image loading with URLSession for flag images.' },
  { icon: <LayoutGrid className="w-4 h-4" />, title: 'Tab Navigation', description: 'Tab bar interface with Countries and Settings tabs.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Error Handling', description: 'HTTP status code validation and graceful network error management.' },
  { icon: <Building2 className="w-4 h-4" />, title: 'Dynamic Layout', description: 'Auto Layout with responsive design and dynamic cell sizing.' },
  { icon: <Database className="w-4 h-4" />, title: 'REST API Integration', description: 'REST Countries API v3.1 with network requests and response parsing.' },
];

const yarnScriptFeatures = [
  { icon: <Mic className="w-4 h-4" />, title: 'Real-Time Voice Tracking', description: 'Streams microphone audio to AssemblyAI and receives live transcription updates while the user speaks.' },
  { icon: <Brain className="w-4 h-4" />, title: 'Hybrid Script Alignment', description: 'Combines low-latency word matching with semantic recovery to keep the teleprompter synchronized.' },
  { icon: <AudioLines className="w-4 h-4" />, title: 'Skip & Ad-Lib Recovery', description: 'Recognizes when the speaker has rephrased, skipped, or added content and searches ahead for the most likely continuation.' },
  { icon: <Search className="w-4 h-4" />, title: 'Intelligent Lookahead', description: 'Confidence thresholds and a controlled forward search window prevent isolated future words from pulling the teleprompter off course.' },
  { icon: <ScrollText className="w-4 h-4" />, title: 'Automatic Scrolling', description: 'Keeps the active line centered with smooth scrolling based on spoken progress rather than a fixed timer.' },
  { icon: <MousePointerClick className="w-4 h-4" />, title: 'Interactive Seeking', description: 'Click any word to jump forward or backward — tracking resets and resumes from that point.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Script Input & Upload', description: 'Supports scripts pasted directly into the editor or imported from a .txt file.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Reading Controls', description: 'Small, medium, and large text options, spoken-word highlighting, manual scrolling, auto-scroll recovery, rewind, and stop.' },
  { icon: <Database className="w-4 h-4" />, title: 'Prepared Semantic Search', description: 'Creates embeddings for sections of the script and stores them for fast similarity matching during the reading session.' },
  { icon: <Gauge className="w-4 h-4" />, title: 'Responsive Demo Experience', description: 'Polished browser demo with microphone status, session controls, progress feedback, and a limited live-transcription timer.' },
];

const soundSnagFeatures = [
  { icon: <Link2 className="w-4 h-4" />, title: 'Snag Audio', description: 'Paste a YouTube, Instagram, or TikTok link, preview its metadata, and save the audio in its native M4A or WebM format.' },
  { icon: <RefreshCw className="w-4 h-4" />, title: 'Convert Files', description: 'Images to JPEG, PNG, HEIC, TIFF, or one combined PDF; PDFs to images; audio and video to MP3, M4A, WAV, or FLAC.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Sandboxed by Design', description: 'Bundled, pinned yt-dlp, ffmpeg, and Deno run inside the App Sandbox from argument arrays, never a shell, to block option injection.' },
  { icon: <PanelTop className="w-4 h-4" />, title: 'Menu Bar Extra', description: 'Paste a link or drop files on the menu bar icon, pick formats, watch progress, and drag finished files straight out of the panel.' },
  { icon: <History className="w-4 h-4" />, title: 'History & Insights', description: 'SwiftData keeps every snag and conversion, and Swift Charts plots both over time.' },
  { icon: <FolderTree className="w-4 h-4" />, title: 'One Save Location', description: 'Downloads or any folder through a security-scoped bookmark, shared by snags and conversions, and existing files are never overwritten.' },
  { icon: <Bell className="w-4 h-4" />, title: 'Completion Notifications', description: 'Banners when a job finishes in the background; clicking one reveals the file in Finder.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Automation Hooks', description: 'Launch arguments that snag, convert, and screenshot the app, used to test it end to end.' },
];

const selahNoteDashboardFeatures = [
  { icon: <Users className="w-4 h-4" />, title: 'Creator Management', description: 'Creator records, referral codes, offer mappings, and per-creator logins with owner, admin, viewer, and creator roles.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Live Data', description: 'Convex websocket subscriptions keep every page current, with a Live, Syncing, or Reconnecting indicator in the header.' },
  { icon: <CreditCard className="w-4 h-4" />, title: 'Monthly Payouts', description: 'Idempotent payout batches that re-check every reward, settle partial payments oldest first, and carry the remainder forward.' },
  { icon: <RefreshCw className="w-4 h-4" />, title: 'Event Reconciliation', description: 'RevenueCat webhook events listed by environment, with retry and reprocess for anything that failed to attribute.' },
  { icon: <FileText className="w-4 h-4" />, title: 'UGC Activity Log', description: 'Creators log their own posts, and staff see that content next to each creator\'s referral results.' },
  { icon: <Shield className="w-4 h-4" />, title: 'Membership-Gated Access', description: 'Firebase proves who you are; an admin membership row decides what you can do, and revoking it cuts off live queries at once.' },
  { icon: <History className="w-4 h-4" />, title: 'Audit Trail', description: 'Every dashboard write records the verified actor along with before-and-after details.' },
  { icon: <Calendar className="w-4 h-4" />, title: 'Consistent Reporting', description: 'Integer-cent money math and America/New_York month boundaries keep every total the same wherever it is shown.' },
];

const prodBotFeatures = [
  { icon: <MessageSquare className="w-4 h-4" />, title: 'Grounded Chat', description: 'Streamed answers from the OpenAI Responses API, grounded in each campus\'s approved and shared documentation.' },
  { icon: <Brain className="w-4 h-4" />, title: 'Visible Reasoning', description: 'The model\'s reasoning summary streams into a collapsible Thinking block above every answer.' },
  { icon: <Network className="w-4 h-4" />, title: 'Wiring Explorer', description: 'Interactive campus wiring diagram with device search, fullscreen, PNG export, and double-click into a device\'s internal wiring.' },
  { icon: <Sparkles className="w-4 h-4" />, title: 'Chat-Drawn Diagrams', description: 'Describe a change in plain language and the AI redraws the diagram; nothing is stored until you save a revision.' },
  { icon: <FileText className="w-4 h-4" />, title: 'Reviewed AI Drafts', description: 'Generated pitfalls, runbooks, and systems docs sit beside the approved version so an admin can approve, edit, or discard them.' },
  { icon: <History className="w-4 h-4" />, title: 'Safe Revisions', description: 'Approval keeps the previous version, and a draft cannot overwrite docs that changed after it started generating.' },
  { icon: <ThumbsUp className="w-4 h-4" />, title: 'Volunteer Fix Reports', description: 'Volunteers report a resolved issue in chat, and it lands in an admin review queue with their report attached as evidence.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Import & Export', description: 'Approved docs export as a ZIP of YAML and markdown and re-import atomically as drafts.' },
];

const featuresByProject: Record<number, typeof ontractFeatures> = {
  1: selahNoteFeatures,
  4: countryViewerFeatures,
  5: ontractFeatures,
  6: sentioFeatures,
  7: chatgptCloneFeatures,
  8: yarnScriptFeatures,
  9: soundSnagFeatures,
  10: selahNoteDashboardFeatures,
  11: prodBotFeatures,
};

interface ProjectFeaturesProps {
  projectId: number;
}

export default function ProjectFeatures({ projectId }: ProjectFeaturesProps) {
  const features = featuresByProject[projectId] ?? ontractFeatures;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <div
          key={index}
          className="bg-white rounded-[1.25rem] p-6 border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.06)] transition-shadow duration-300"
        >
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-zinc-50 rounded-xl text-zinc-500 shrink-0">
              {feature.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-zinc-900 font-medium text-sm mb-1.5">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
