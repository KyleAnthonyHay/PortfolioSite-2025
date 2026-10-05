'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Check, Copy, Plus, RefreshCw } from 'lucide-react';
import type { ActivityStep, ChatEvent, ConversationMessage, SourceRef, Widget } from '@/lib/chat-events';
import ActivitySteps from './ActivitySteps';
import Composer from './Composer';
import EmptyState from './EmptyState';
import Markdown from './Markdown';
import SourcePills from './SourcePills';
import WidgetRenderer from './widgets';

interface UserMessage {
  id: string;
  role: 'user';
  content: string;
}

interface AssistantMessage {
  id: string;
  role: 'assistant';
  content: string;
  steps: ActivityStep[];
  widgets: Widget[];
  sources: SourceRef[];
  suggestions: string[];
  status: 'streaming' | 'done' | 'error';
}

type ChatMessage = UserMessage | AssistantMessage;

const STORAGE_KEY = 'portfolio-chat-v2';
const MAX_STORED = 40;
const spring = { type: 'spring' as const, stiffness: 120, damping: 20 };

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadStored(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.map((message) =>
      message.role === 'assistant' && message.status === 'streaming' ? { ...message, status: 'done' } : message
    );
  } catch {
    return [];
  }
}

function persist(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    // Storage unavailable; the conversation just won't survive a reload.
  }
}

function applyEvent(message: AssistantMessage, event: ChatEvent): AssistantMessage {
  switch (event.type) {
    case 'text':
      return { ...message, content: message.content + event.delta };
    case 'step': {
      const exists = message.steps.some((step) => step.id === event.step.id);
      return {
        ...message,
        steps: exists
          ? message.steps.map((step) => (step.id === event.step.id ? event.step : step))
          : [...message.steps, event.step],
      };
    }
    case 'widget':
      return { ...message, widgets: [...message.widgets, event.widget] };
    case 'sources':
      return { ...message, sources: event.sources };
    case 'suggestions':
      return { ...message, suggestions: event.items };
    case 'error':
      return { ...message, status: 'error', content: message.content || event.message };
    case 'done':
      return { ...message, status: 'done' };
    default:
      return message;
  }
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard blocked; nothing to do.
        }
      }}
      aria-label="Copy answer"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ChatInterface() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const hasSentInitialRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = messages.some((m) => m.role === 'assistant' && m.status === 'streaming');

  useEffect(() => {
    messagesRef.current = messages;
    if (isHydrated) persist(messages);
  }, [messages, isHydrated]);

  useEffect(() => {
    setMessages(loadStored());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !isStreaming) inputRef.current?.focus();
  }, [isHydrated, isStreaming]);

  // Follow the newest content unless the visitor has scrolled up to read.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = useCallback(
    async (text: string, options?: { replaceFromIndex?: number }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      abortRef.current?.abort();

      const base =
        options?.replaceFromIndex !== undefined
          ? messagesRef.current.slice(0, options.replaceFromIndex)
          : messagesRef.current;
      const history: ConversationMessage[] = base
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const assistantId = newId();
      const next: ChatMessage[] = [
        ...base,
        { id: newId(), role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', steps: [], widgets: [], sources: [], suggestions: [], status: 'streaming' },
      ];
      stickToBottomRef.current = true;
      setMessages(next);

      const controller = new AbortController();
      abortRef.current = controller;

      const update = (fn: (m: AssistantMessage) => AssistantMessage) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId && m.role === 'assistant' ? fn(m) : m))
        );

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: trimmed, history }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`Request failed (${response.status})`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as ChatEvent;
            update((m) => applyEvent(m, event));
          }
        }
        update((m) => (m.status === 'streaming' ? { ...m, status: 'done' } : m));
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          update((m) => ({ ...m, status: 'done' }));
        } else {
          console.error('Chat error:', error);
          update((m) => ({
            ...m,
            status: 'error',
            content: m.content || 'Sorry, something went wrong while answering. Please try again.',
          }));
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (isHydrated && initialQuery && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      send(initialQuery);
    }
  }, [isHydrated, initialQuery, send]);

  const handleSend = () => {
    const text = input;
    setInput('');
    inputRef.current?.focus();
    send(text);
  };

  const handleStop = () => abortRef.current?.abort();

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setInput('');
    inputRef.current?.focus();
  };

  const regenerate = (assistantIndex: number) => {
    const user = messagesRef.current[assistantIndex - 1];
    if (user?.role === 'user') send(user.content, { replaceFromIndex: assistantIndex - 1 });
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200/50 bg-[#f9fafb]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            className="group inline-flex items-center gap-3 rounded-lg py-1 pr-2 text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="flex items-center gap-2.5">
              <span className="relative h-7 w-7 overflow-hidden rounded-full ring-1 ring-zinc-200">
                <Image src="/profile.jpg" alt="" fill sizes="28px" className="object-cover" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium text-zinc-900">Kyle-Anthony</span>
                <span className="block text-[11px] text-zinc-400">AI agent · grounded in his work</span>
              </span>
            </span>
          </Link>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200/70 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]"
            >
              <Plus className="h-3.5 w-3.5" /> New chat
            </button>
          )}
        </div>
      </header>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-44 pt-6">
          {isHydrated && messages.length === 0 && (
            <EmptyState
              onPick={(prompt, sendNow) => {
                if (sendNow) {
                  send(prompt);
                } else {
                  setInput(prompt);
                  requestAnimationFrame(() => {
                    const el = inputRef.current;
                    if (el) {
                      el.focus();
                      el.setSelectionRange(el.value.length, el.value.length);
                    }
                  });
                }
              }}
            />
          )}

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((message, index) =>
                message.role === 'user' ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-lg bg-zinc-100 px-4 py-2.5 text-[15px] leading-6 text-zinc-800">
                      {message.content}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="group/message"
                  >
                    <ActivitySteps
                      steps={message.steps}
                      isStreaming={message.status === 'streaming'}
                      hasText={message.content.length > 0}
                    />

                    {message.content && <Markdown content={message.content} />}

                    {message.status === 'done' && !message.content && message.widgets.length === 0 && (
                      <p className="text-sm text-zinc-400">Stopped.</p>
                    )}

                    {message.widgets.length > 0 && (
                      <div className={`space-y-3 ${message.content ? 'mt-4' : ''}`}>
                        {message.widgets.map((widget, widgetIndex) => (
                          <motion.div
                            key={`${message.id}-${widgetIndex}`}
                            initial={{ opacity: 0, y: 10, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={spring}
                          >
                            <WidgetRenderer widget={widget} />
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <SourcePills sources={message.sources} />

                    {message.status !== 'streaming' && (message.content || message.widgets.length > 0) && (
                      <div className="mt-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
                        <CopyButton text={message.content} />
                        {index === lastAssistantIndex && (
                          <button
                            type="button"
                            onClick={() => regenerate(index)}
                            aria-label="Regenerate answer"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {index === lastAssistantIndex && message.status === 'done' && message.suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...spring, delay: 0.1 }}
                        className="mt-4 flex flex-wrap gap-2"
                      >
                        {message.suggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onClick={() => send(suggestion)}
                            className="rounded-full border border-zinc-200/70 bg-white px-3.5 py-1.5 text-xs text-zinc-600 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] transition-all hover:border-zinc-300 hover:text-zinc-900 active:scale-[0.97]"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
        inputRef={inputRef}
      />
    </div>
  );
}
