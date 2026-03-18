'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citedProjects?: string[];
}

interface ChatResponse {
  message: string;
  toolsUsed: string[];
  citedProjects: string[];
}

const thinkingPhrases = [
  'Agent is thinking...',
  'Searching projects...',
  'Analyzing your question...',
  'Generating response...',
];

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

function ShimmeringText({ text }: { text: string }) {
  return (
    <span className="inline-block bg-gradient-to-r from-zinc-400 via-zinc-600 to-zinc-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer text-sm">
      {text}
    </span>
  );
}

function ThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % thinkingPhrases.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200/50 px-4 py-3 rounded-2xl rounded-bl-md shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={phraseIndex}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <ShimmeringText text={thinkingPhrases[phraseIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function MarkdownResponse({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-zinc max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1 text-sm">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
          h1: ({ children }) => <h1 className="text-base font-semibold mb-2 text-zinc-900">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold mb-2 text-zinc-900">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mb-1 text-zinc-900">{children}</h3>,
          code: ({ children }) => (
            <code className="bg-zinc-100 px-1.5 py-0.5 rounded-md text-xs font-mono">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl overflow-x-auto text-xs mb-2 font-mono">
              {children}
            </pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

const projectNameToId: Record<string, number> = {
  'Selahnote': 1,
  'SelahNote': 1,
  'Expense Tracker': 2,
  'ExpenseTracker': 2,
  'The Wall': 3,
  'TheWall': 3,
  'Country App': 4,
  'CountryApp': 4,
  'Ontract': 5,
  'OnTract': 5,
  'Sentio Plus': 6,
  'Sentio+': 6,
  'Chatgpt Clone': 7,
  'ChatGPT Clone': 7,
};

function CitedSources({ projects }: { projects: string[] }) {
  if (!projects || projects.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-zinc-100">
      <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium mb-2">Sources</p>
      <div className="flex flex-wrap gap-1.5">
        {projects.map((project) => {
          const projectId = projectNameToId[project];
          if (projectId) {
            return (
              <Link
                key={project}
                href={`/projects/${projectId}`}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-zinc-50 border border-zinc-100 text-zinc-600 hover:bg-zinc-100 hover:border-zinc-200 active:scale-[0.97] transition-all duration-200"
              >
                {project}
              </Link>
            );
          }
          return (
            <span
              key={project}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs bg-zinc-50 border border-zinc-100 text-zinc-500"
            >
              {project}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const STORAGE_KEY = 'portfolio-chat-history';

function loadMessagesFromStorage(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMessagesToStorage(messages: Message[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Storage full or unavailable
  }
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const hasSentInitialRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = loadMessagesFromStorage();
    setMessages(stored);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      saveMessagesToStorage(messages);
    }
  }, [messages, isHydrated]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessageText = async (text: string, currentMessages: Message[]) => {
    if (!text.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: currentMessages,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const data: ChatResponse = await response.json();
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.message,
        citedProjects: data.citedProjects,
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isHydrated && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      sendMessageText(initialQuery, messages);
    }
  }, [isHydrated, initialQuery]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    sendMessageText(text, messages);
  };

  return (
    <div className="flex flex-col flex-1 max-w-3xl mx-auto w-full px-4 h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 pt-6 pb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 active:scale-[0.97] transition-all duration-200"
        >
          <BackIcon />
          <span className="text-sm font-medium">Back</span>
        </Link>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs font-medium text-zinc-400 hover:text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-100 active:scale-[0.97] transition-all duration-200"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide min-h-0 pb-36">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-14 h-14 rounded-full overflow-hidden mb-5 ring-2 ring-zinc-200/60 ring-offset-2 ring-offset-[#f9fafb]">
              <Image src="/profile.jpg" alt="Kyle-Anthony" width={56} height={56} className="object-cover" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 tracking-tight mb-2">
              Chat with Kyle&apos;s AI Assistant
            </h2>
            <p className="max-w-sm text-sm text-zinc-400 leading-relaxed mb-8">
              Ask me anything about Kyle-Anthony&apos;s projects, skills, or experience.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'What projects has Kyle built?',
                'Tell me about his iOS apps',
                'What AI/ML experience does he have?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 text-sm bg-white border border-zinc-200/60 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 rounded-xl active:scale-[0.97] transition-all duration-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-zinc-900 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-zinc-700 rounded-2xl rounded-bl-md border border-slate-200/50 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]'
                }`}
              >
                {message.role === 'assistant' ? (
                  <>
                    <MarkdownResponse content={message.content} />
                    <CitedSources projects={message.citedProjects || []} />
                  </>
                ) : (
                  <p className="text-sm leading-relaxed">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && <ThinkingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="fixed bottom-0 left-0 right-0 bg-[#f9fafb]/80 backdrop-blur-xl border-t border-zinc-200/40 px-4 pt-4 pb-6 z-40">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Kyle's projects..."
              className="w-full px-5 py-3.5 pr-14 bg-white text-zinc-900 placeholder-zinc-400 rounded-2xl border border-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-zinc-300/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.06)] text-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:opacity-50 rounded-xl active:scale-[0.95] transition-all duration-200"
              aria-label="Send message"
            >
              <ArrowIcon />
            </button>
          </div>
          <p className="text-center text-[11px] text-zinc-400 mt-2.5">
            KyleGPT is AI and can make mistakes.
          </p>
        </div>
      </form>
    </div>
  );
}

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
