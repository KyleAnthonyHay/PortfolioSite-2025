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

function ShimmeringText({ text }: { text: string }) {
  return (
    <span className="inline-block bg-gradient-to-r from-gray-400 via-gray-600 to-gray-400 bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer">
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
      <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
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
    <div className="prose prose-sm prose-gray max-w-none">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
          code: ({ children }) => (
            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-gray-800 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs mb-2">
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
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-xs text-gray-500 mb-1.5">Sources:</p>
      <div className="flex flex-wrap gap-1.5">
        {projects.map((project) => {
          const projectId = projectNameToId[project];
          if (projectId) {
            return (
              <Link
                key={project}
                href={`/projects/${projectId}`}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                {project}
              </Link>
            );
          }
          return (
            <span
              key={project}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-700"
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

  useEffect(() => {
    const stored = loadMessagesFromStorage();
    setMessages(stored);
    setIsHydrated(true);
  }, []);

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
      <div className="mb-4 flex-shrink-0 pt-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <BackIcon />
          <span className="text-sm">Back</span>
        </Link>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide min-h-0 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-2 border-gray-200">
              <Image src="/profile.jpg" alt="Kyle-Anthony" width={64} height={64} className="object-cover" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Chat with Kyle&apos;s AI Assistant</h2>
            <p className="max-w-md text-sm">
              Ask me anything about Kyle-Anthony&apos;s projects, skills, or experience. I have detailed knowledge of all his work.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {[
                'What projects has Kyle built?',
                'Tell me about his iOS apps',
                'What AI/ML experience does he have?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
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
              transition={{ duration: 0.2 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gray-900 text-white rounded-br-md'
                    : 'bg-gray-100 text-gray-800 rounded-bl-md'
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

      <form onSubmit={sendMessage} className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pt-4 pb-6 z-40 safe-area-inset-bottom">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Kyle's projects..."
              className="w-full px-5 py-4 pr-14 bg-white text-gray-900 placeholder-gray-400 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-sm"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:opacity-50 rounded-full transition-colors"
              aria-label="Send message"
            >
              <ArrowIcon />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            KyleGPT is AI and can make mistakes. Check important info.
          </p>
        </div>
      </form>
    </div>
  );
}

const BackIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);
