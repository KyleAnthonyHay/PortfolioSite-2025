'use client';

import { Card, CardContent } from '@/components/ui/card';
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
  MapPin,
  Flag,
  Building2,
  Languages
} from 'lucide-react';

const ontractFeatures = [
  {
    icon: <Search className="w-5 h-5 text-emerald-500" />,
    title: 'AI-Powered Search',
    description: 'Semantic search using vector embeddings for natural language queries across all contracts.'
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    title: 'Conversational Q&A',
    description: 'Chat interface powered by LangGraph agents with citations to source documents.'
  },
  {
    icon: <Upload className="w-5 h-5 text-purple-500" />,
    title: 'Automated Processing',
    description: 'Text extraction, intelligent chunking, and automatic metadata extraction from documents.'
  },
  {
    icon: <Calendar className="w-5 h-5 text-orange-500" />,
    title: 'Lifecycle Management',
    description: 'Status tracking, expiration monitoring, and obligation tracking with audit trails.'
  },
  {
    icon: <Shield className="w-5 h-5 text-red-500" />,
    title: 'Multi-Tenant Security',
    description: 'Organization-scoped data isolation using PostgreSQL Row Level Security.'
  },
  {
    icon: <Users className="w-5 h-5 text-cyan-500" />,
    title: 'Team Collaboration',
    description: 'Role-based access control, team invitations, and activity feeds.'
  },
  {
    icon: <Bell className="w-5 h-5 text-yellow-500" />,
    title: 'Alert System',
    description: 'Automated notifications for expirations, renewals, and custom reminders.'
  },
  {
    icon: <CreditCard className="w-5 h-5 text-pink-500" />,
    title: 'Billing & Credits',
    description: 'Stripe-integrated subscription management with organization-wide credits.'
  }
];

const sentioFeatures = [
  {
    icon: <Brain className="w-5 h-5 text-emerald-500" />,
    title: 'AI-Powered Semantic Search',
    description: 'Semantic search across all reviews using vector embeddings, enabling natural language queries that understand context and meaning rather than just keywords.'
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    title: 'Conversational Q&A with LangChain Agents',
    description: 'Chat interface powered by LangGraph agents that can answer questions about reviews with citations to source documents. Agents use tools for review search, collection statistics, and app listing.'
  },
  {
    icon: <Upload className="w-5 h-5 text-purple-500" />,
    title: 'Automated Document Processing',
    description: 'Text extraction and cleaning from CSV datasets, intelligent chunking for optimal retrieval, metadata enrichment, and hybrid stratified sampling for signal quality.'
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
    title: 'Aspect-Level Sentiment Analysis',
    description: 'Identifies specific product aspects driving sentiment (usability, payments, performance, pricing), tracks sentiment trends across time and categories, and provides evidence-grounded insights with source citations.'
  },
  {
    icon: <Filter className="w-5 h-5 text-red-500" />,
    title: 'Metadata-Aware Retrieval',
    description: 'Filter by app name, category, rating, date range. LLM-powered source selection for focused queries with distance threshold filtering for relevance.'
  },
  {
    icon: <Database className="w-5 h-5 text-cyan-500" />,
    title: 'Vector Store Flexibility',
    description: 'Persistent local ChromaDB for development, HTTP client for distributed deployments, and ChromaDB Cloud support for production.'
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-yellow-500" />,
    title: 'Business Intelligence',
    description: 'Collection statistics (total documents, unique apps, categories), trend detection across time periods, category and rating-based analysis, and export-ready insights for stakeholders.'
  },
  {
    icon: <FileText className="w-5 h-5 text-pink-500" />,
    title: 'Multi-Interface Access',
    description: 'Next.js web application for production use, Streamlit demo for quick testing and validation, and RESTful API for programmatic access.'
  }
];

const chatgptCloneFeatures = [
  {
    icon: <Brain className="w-5 h-5 text-emerald-500" />,
    title: 'AI Agent with Memory',
    description: 'Uses LangGraph to manage conversation state, allowing for multi-turn dialogues where the AI remembers previous context and maintains coherent conversations.'
  },
  {
    icon: <Search className="w-5 h-5 text-blue-500" />,
    title: 'Semantic Search (RAG)',
    description: 'Integrates ChromaDB to perform vector searches across policy documents, providing relevant excerpts to the LLM for accurate, evidence-grounded responses.'
  },
  {
    icon: <BookOpen className="w-5 h-5 text-purple-500" />,
    title: 'Policy-Specific Tools',
    description: 'Specialized tools including search_policies, list_all_policies, get_policy_by_name, and summarize_policy for navigating institutional documentation.'
  },
  {
    icon: <History className="w-5 h-5 text-orange-500" />,
    title: 'Persistent Chat History',
    description: 'Messages and threads are saved to a PostgreSQL database, allowing users to return to previous conversations and maintain context across sessions.'
  },
  {
    icon: <ThumbsUp className="w-5 h-5 text-red-500" />,
    title: 'Feedback System',
    description: 'Built-in mechanism for users to rate AI responses, facilitating continuous improvement and monitoring via LangSmith for quality assurance.'
  },
  {
    icon: <Zap className="w-5 h-5 text-cyan-500" />,
    title: 'Modern UX',
    description: 'A responsive, dark-mode-first UI that mimics the ChatGPT experience, including message streaming and sidebar navigation for seamless interaction.'
  }
];

const selahNoteFeatures = [
  {
    icon: <Mic className="w-5 h-5 text-emerald-500" />,
    title: 'Real-Time Audio Recording with Live Transcription',
    description: 'High-quality audio capture using AVFoundation with WebSocket-based streaming transcription to AssemblyAI during recording. Real-time partial transcript updates displayed to user with background task management.'
  },
  {
    icon: <FileAudio className="w-5 h-5 text-blue-500" />,
    title: 'Multiple Audio Input Sources',
    description: 'Direct recording via device microphone, audio file upload from Files app, and YouTube video transcript extraction via Cloud Run service. Support for various audio formats with automatic processing.'
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-500" />,
    title: 'AI-Powered Note Generation',
    description: 'Automated transcription using AssemblyAI with intelligent summarization via OpenAI GPT-4o. Structured markdown output with hierarchical headings, scripture reference detection, and chronological preservation of content order.'
  },
  {
    icon: <FolderTree className="w-5 h-5 text-orange-500" />,
    title: 'Hierarchical Organization System',
    description: 'Folder-based organization (RootDirectory → Folders → TranscriptionTuples) with drag-and-drop management, search and sort functionality, recent items tracking, and cascade deletion for data integrity.'
  },
  {
    icon: <Youtube className="w-5 h-5 text-red-500" />,
    title: 'YouTube Integration',
    description: 'URL validation and normalization supporting various YouTube formats. Cloud Run service for transcript fetching with async job polling, automatic note generation from YouTube transcripts, and metadata extraction.'
  },
  {
    icon: <Play className="w-5 h-5 text-cyan-500" />,
    title: 'Advanced Audio Processing',
    description: 'Audio format conversion (device format → 16kHz PCM-16 for streaming), background audio session management, interruption handling, and route change detection for seamless recording experience.'
  },
  {
    icon: <Brain className="w-5 h-5 text-yellow-500" />,
    title: 'Dual Transcription Modalities',
    description: 'Live streaming transcription for immediate feedback during recording, combined with batch transcription for maximum accuracy. Balances real-time responsiveness with transcription fidelity.'
  },
  {
    icon: <FileText className="w-5 h-5 text-pink-500" />,
    title: 'Custom Prompt Engineering',
    description: 'Sophisticated system prompts designed for sermon and lecture content with structured markdown output, scripture handling, chronological preservation, and language-aware processing.'
  }
];

const expenseTrackerFeatures = [
  {
    icon: <RefreshCw className="w-5 h-5 text-emerald-500" />,
    title: 'Asynchronous Data Fetching with Combine',
    description: 'URLSession dataTaskPublisher for network requests with Combine operators (tryMap, decode, receive, sink) for data processing. Reactive updates to UI via @Published properties with proper error handling and cancellable management.'
  },
  {
    icon: <LineChart className="w-5 h-5 text-blue-500" />,
    title: 'Transaction Data Visualization',
    description: 'SwiftUI Charts integration with LineChart component for cumulative expense tracking over time. Interactive chart display with formatted currency labels, custom styling with gradient colors, and empty state handling.'
  },
  {
    icon: <Tag className="w-5 h-5 text-purple-500" />,
    title: 'Hierarchical Category System',
    description: 'Main categories (Auto & Transport, Bills & Utilities, Entertainment, etc.) with subcategories. Category icons using FontAwesome integration, category selection and editing functionality for transaction organization.'
  },
  {
    icon: <Calendar className="w-5 h-5 text-orange-500" />,
    title: 'Transaction Organization',
    description: 'Grouping by month using OrderedDictionary with chronological display and section headers. Recent transactions preview with configurable count, full transaction list with navigation, and date-based filtering.'
  },
  {
    icon: <FileText className="w-5 h-5 text-red-500" />,
    title: 'Transaction Detail View',
    description: 'Comprehensive transaction information display including merchant, date, financial institution, and account details. Category editing with navigation to CategoriesView, formatted currency and date displays.'
  },
  {
    icon: <DollarSign className="w-5 h-5 text-cyan-500" />,
    title: 'Cumulative Expense Calculation',
    description: 'Date interval calculation for current month with daily expense aggregation using stride iteration. Running sum calculation with rounding, TransactionPrefixSum data structure for chart data, and expense filtering.'
  },
  {
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    title: 'Reactive State Management',
    description: '@EnvironmentObject for shared ViewModel across views, @Published properties for automatic UI updates, ObservableObject protocol conformance, and Combine cancellables for subscription management.'
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-pink-500" />,
    title: 'Computed Properties and Data Processing',
    description: 'Transaction.signedAmount calculates positive/negative based on type, Transaction.dateParsed converts string dates to Date objects, Transaction.month extracts month-year string for grouping, and Transaction.categoryItem resolves category object from ID.'
  }
];

const theWallFeatures = [
  {
    icon: <User className="w-5 h-5 text-emerald-500" />,
    title: 'User Authentication',
    description: 'Email/password registration and login via Firebase Auth with automatic session management and protected routes. Secure authentication flow with login and registration pages.'
  },
  {
    icon: <MessageSquare className="w-5 h-5 text-blue-500" />,
    title: 'Real-Time Feed',
    description: 'Public message wall ("THE WALL") displaying all user posts in reverse chronological order with real-time updates via Firestore streams. Instant visibility of new posts to all authenticated users.'
  },
  {
    icon: <Upload className="w-5 h-5 text-purple-500" />,
    title: 'Post Creation',
    description: 'Users can create and publish text-based posts that are immediately visible to all authenticated users. Simple post creation interface with instant feed updates.'
  },
  {
    icon: <Users className="w-5 h-5 text-orange-500" />,
    title: 'User Profiles',
    description: 'Profile pages displaying username, email, and profile icon for each registered user. User discovery feature to browse all registered users in the application.'
  },
  {
    icon: <Moon className="w-5 h-5 text-red-500" />,
    title: 'Dark Mode Support',
    description: 'System-wide light and dark theme switching with Material Design color schemes. Custom theme system for consistent UI experience across the application.'
  },
  {
    icon: <Globe className="w-5 h-5 text-cyan-500" />,
    title: 'Cross-Platform',
    description: 'Single codebase deployment to iOS, Android, Web, Linux, macOS, and Windows platforms. Flutter framework enables consistent experience across all platforms.'
  },
  {
    icon: <LayoutGrid className="w-5 h-5 text-yellow-500" />,
    title: 'Reusable Component Architecture',
    description: 'Modular UI components including MyButton, MyTextField, MyDrawer, MyListTile, MyPostButton, and MyBackButton for consistent UI patterns and maintainable codebase.'
  },
  {
    icon: <Database className="w-5 h-5 text-pink-500" />,
    title: 'Firestore Database Integration',
    description: 'Firestore database service layer handling post creation, retrieval, and real-time stream updates. Posts stored with user email, message content, and timestamp for chronological organization.'
  }
];

const countryViewerFeatures = [
  {
    icon: <Globe className="w-5 h-5 text-emerald-500" />,
    title: 'Country List',
    description: 'Displays all countries in a scrollable table view with flag thumbnails, common names, and official names. Clean, organized interface for browsing countries worldwide.'
  },
  {
    icon: <FileText className="w-5 h-5 text-blue-500" />,
    title: 'Country Details',
    description: 'Comprehensive detail view showing country flag banner image, official name, capital city, population, currency name and symbol, and native languages.'
  },
  {
    icon: <Zap className="w-5 h-5 text-purple-500" />,
    title: 'Asynchronous Data Loading',
    description: 'Uses Swift Concurrency (async/await) for non-blocking API calls and data fetching. Ensures smooth UI performance without blocking the main thread.'
  },
  {
    icon: <Flag className="w-5 h-5 text-orange-500" />,
    title: 'Image Loading',
    description: 'Custom asynchronous image loading with URLSession for flag images with proper memory management and main thread updates. Efficient image caching and display.'
  },
  {
    icon: <LayoutGrid className="w-5 h-5 text-red-500" />,
    title: 'Tab-Based Navigation',
    description: 'Tab bar interface with Countries and Settings tabs for easy navigation between different sections of the application.'
  },
  {
    icon: <Shield className="w-5 h-5 text-cyan-500" />,
    title: 'Error Handling',
    description: 'HTTP status code validation and error handling for API requests. Robust error management ensures graceful handling of network issues.'
  },
  {
    icon: <Building2 className="w-5 h-5 text-yellow-500" />,
    title: 'Dynamic UI Layout',
    description: 'Auto Layout constraints for responsive design and dynamic table view cell sizing based on image dimensions. Adapts to different screen sizes and content.'
  },
  {
    icon: <Database className="w-5 h-5 text-pink-500" />,
    title: 'REST Countries API Integration',
    description: 'API client implementing REST Countries API v3.1 integration. Handles network requests, response parsing, and provides methods for fetching all countries and individual country details.'
  }
];

interface ProjectFeaturesProps {
  projectId: number;
}

export default function ProjectFeatures({ projectId }: ProjectFeaturesProps) {
  const features = projectId === 1 ? selahNoteFeatures : projectId === 2 ? expenseTrackerFeatures : projectId === 3 ? theWallFeatures : projectId === 4 ? countryViewerFeatures : projectId === 6 ? sentioFeatures : projectId === 7 ? chatgptCloneFeatures : ontractFeatures;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <Card key={index} className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
