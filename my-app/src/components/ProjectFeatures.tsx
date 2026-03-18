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
  LineChart,
  Tag,
  DollarSign,
  RefreshCw,
  User,
  Globe,
  Moon,
  LayoutGrid,
  Flag,
  Building2,
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

const expenseTrackerFeatures = [
  { icon: <RefreshCw className="w-4 h-4" />, title: 'Async Data Fetching', description: 'URLSession with Combine operators for reactive updates via @Published properties.' },
  { icon: <LineChart className="w-4 h-4" />, title: 'Data Visualization', description: 'SwiftUI Charts with LineChart for cumulative expense tracking over time.' },
  { icon: <Tag className="w-4 h-4" />, title: 'Category System', description: 'Hierarchical categories with subcategories and FontAwesome icon integration.' },
  { icon: <Calendar className="w-4 h-4" />, title: 'Transaction Organization', description: 'Grouping by month with chronological display, section headers, and date-based filtering.' },
  { icon: <FileText className="w-4 h-4" />, title: 'Transaction Detail', description: 'Comprehensive info display including merchant, date, institution, and category editing.' },
  { icon: <DollarSign className="w-4 h-4" />, title: 'Expense Calculation', description: 'Date interval calculation with daily aggregation and running sum for chart data.' },
  { icon: <Zap className="w-4 h-4" />, title: 'Reactive State', description: '@EnvironmentObject for shared ViewModel with @Published properties for automatic UI updates.' },
  { icon: <BarChart3 className="w-4 h-4" />, title: 'Data Processing', description: 'Computed properties for signed amounts, date parsing, month extraction, and category resolution.' },
];

const theWallFeatures = [
  { icon: <User className="w-4 h-4" />, title: 'User Authentication', description: 'Email/password registration via Firebase Auth with automatic session management.' },
  { icon: <MessageSquare className="w-4 h-4" />, title: 'Real-Time Feed', description: 'Public message wall with real-time updates via Firestore streams.' },
  { icon: <Upload className="w-4 h-4" />, title: 'Post Creation', description: 'Text-based posts immediately visible to all authenticated users.' },
  { icon: <Users className="w-4 h-4" />, title: 'User Profiles', description: 'Profile pages with username, email, and user discovery features.' },
  { icon: <Moon className="w-4 h-4" />, title: 'Dark Mode', description: 'System-wide light and dark theme switching with Material Design.' },
  { icon: <Globe className="w-4 h-4" />, title: 'Cross-Platform', description: 'Single codebase for iOS, Android, Web, Linux, macOS, and Windows.' },
  { icon: <LayoutGrid className="w-4 h-4" />, title: 'Component Architecture', description: 'Modular UI components for consistent patterns and maintainability.' },
  { icon: <Database className="w-4 h-4" />, title: 'Firestore Integration', description: 'Database service layer for post creation, retrieval, and real-time streams.' },
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

interface ProjectFeaturesProps {
  projectId: number;
}

export default function ProjectFeatures({ projectId }: ProjectFeaturesProps) {
  const features = projectId === 1 ? selahNoteFeatures : projectId === 2 ? expenseTrackerFeatures : projectId === 3 ? theWallFeatures : projectId === 4 ? countryViewerFeatures : projectId === 6 ? sentioFeatures : projectId === 7 ? chatgptCloneFeatures : ontractFeatures;

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
