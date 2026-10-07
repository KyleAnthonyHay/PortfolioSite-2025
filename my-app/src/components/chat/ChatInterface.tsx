'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Briefcase, Check, Copy, CornerDownRight, Plus, RefreshCw, X } from 'lucide-react';
import type { ActivityStep, ChatEvent, ConversationMessage, SourceRef, VisitorContext, Widget } from '@/lib/chat-events';
import ActivitySteps from './ActivitySteps';
import Composer from './Composer';
import EmptyState from './EmptyState';
import { intakeMessage } from './HiringIntake';
import Markdown from './Markdown';
import SourcePills from './SourcePills';
import WidgetRenderer from './widgets';
import { BRIEF_PROMPT, BriefButton, BriefNudge } from './BriefEntry';

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
  /** The text is complete, so cards can come in after it. */
  answered?: boolean;
  /** Client clock: when the turn started and when the answer (or the turn) first landed. */
  startedAt?: number;
  endedAt?: number;
}

type ChatMessage = UserMessage | AssistantMessage;

const STORAGE_KEY = 'portfolio-chat-v2';
const CONTEXT_KEY = 'portfolio-chat-context';
const CONVERSATION_KEY = 'portfolio-chat-id';
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

function loadContext(): VisitorContext | null {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as VisitorContext) : null;
  } catch {
    return null;
  }
}

function persistContext(context: VisitorContext | null) {
  try {
    if (context) localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
    else localStorage.removeItem(CONTEXT_KEY);
  } catch {
    // Storage unavailable; the intake just asks again next visit.
  }
}

function loadConversationId(): string {
  try {
    const stored = localStorage.getItem(CONVERSATION_KEY);
    if (stored) return stored;
    const id = newId();
    localStorage.setItem(CONVERSATION_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

const widgetNames: Partial<Record<Widget['kind'], string>> = {
  fit_report: 'fit report',
  projects: 'project cards',
  project: 'project card',
  recommendations: 'recommendations',
  experience_check: 'experience check',
  demo: 'demo',
  resources: 'links',
  journey: 'journey',
  resume: 'résumé',
  book_time: 'booking card',
  note: 'note card',
  recruiter_brief: 'recruiter brief',
};

/** The chat as plain messages for the note's transcript: prose, plus what cards were shown. */
function toTranscript(messages: ChatMessage[]): ConversationMessage[] {
  return messages
    .map((m) => {
      if (m.role === 'user') return { role: m.role, content: m.content };
      const cards = m.widgets.map((w) => {
        if (w.kind === 'question') return `asked: ${w.question}`;
        if (w.kind === 'fit_report') return `fit report${w.role ? ` for ${w.role}` : ''} (${w.summary.match} match, ${w.summary.related} related, ${w.summary.gap} gap)`;
        if (w.kind === 'demo' || w.kind === 'resources' || w.kind === 'project') return `${widgetNames[w.kind]}: ${w.project.title}`;
        return widgetNames[w.kind] ?? w.kind;
      });
      const shown = cards.length > 0 ? `[Shown: ${cards.join('; ')}]` : '';
      return { role: m.role, content: [m.content.trim(), shown].filter(Boolean).join('\n\n') };
    })
    .filter((m) => m.content.trim().length > 0);
}

function applyEvent(message: AssistantMessage, event: ChatEvent): AssistantMessage {
  switch (event.type) {
    case 'text':
      return { ...message, content: message.content + event.delta, endedAt: message.endedAt ?? Date.now() };
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
    case 'answered':
      return { ...message, answered: true };
    case 'sources':
      return { ...message, sources: event.sources };
    case 'suggestions':
      return { ...message, suggestions: event.items };
    case 'error':
      return { ...message, status: 'error', content: message.content || event.message };
    case 'done':
      return { ...message, status: 'done', endedAt: message.endedAt ?? Date.now() };
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
      className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-ink"
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
  // Null until the visitor answers or skips the opening question.
  const [visitor, setVisitor] = useState<VisitorContext | null>(null);
  const visitorRef = useRef<VisitorContext | null>(null);
  const conversationRef = useRef('');
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
    const stored = loadContext();
    visitorRef.current = stored;
    setVisitor(stored);
    conversationRef.current = loadConversationId();
    setIsHydrated(true);
  }, []);

  const updateVisitor = useCallback((next: VisitorContext | null) => {
    visitorRef.current = next;
    setVisitor(next);
    persistContext(next);
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
    if (el && stickToBottomRef.current && messages.length > 0) el.scrollTop = el.scrollHeight;
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
      // A turn that only asked a question has no prose; send the question
      // itself so the agent knows what the visitor's next message answers.
      const history: ConversationMessage[] = base
        .map((m) => {
          if (m.role === 'assistant' && !m.content.trim()) {
            const asked = m.widgets.find((w) => w.kind === 'question');
            if (asked && asked.kind === 'question') return { role: m.role, content: `[Asked the visitor: ${asked.question}]` };
          }
          if (m.role === 'assistant') {
            const projectCards = m.widgets.flatMap((w) => (w.kind === 'project' ? [w.project.id] : []));
            if (projectCards.length > 0) return { role: m.role, content: m.content, projectCards };
          }
          return { role: m.role, content: m.content };
        })
        .filter((m) => m.content.trim().length > 0);

      const assistantId = newId();
      const next: ChatMessage[] = [
        ...base,
        { id: newId(), role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', steps: [], widgets: [], sources: [], suggestions: [], status: 'streaming', startedAt: Date.now() },
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
          body: JSON.stringify({ message: trimmed, history, context: visitorRef.current ?? undefined, conversationId: conversationRef.current }),
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
        update((m) => (m.status === 'streaming' ? { ...m, status: 'done', endedAt: m.endedAt ?? Date.now() } : m));
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
    updateVisitor(null);
    try {
      localStorage.removeItem(CONVERSATION_KEY);
    } catch {
      // Storage unavailable; a fresh id below is enough.
    }
    conversationRef.current = loadConversationId();
    setInput('');
    inputRef.current?.focus();
  };

  const regenerate = (assistantIndex: number) => {
    const user = messagesRef.current[assistantIndex - 1];
    if (user?.role === 'user') send(user.content, { replaceFromIndex: assistantIndex - 1 });
  };

  const lastAssistantIndex = messages.map((m) => m.role).lastIndexOf('assistant');

  // The brief needs something to judge against: a role, a posting, or a fit check.
  const userMessages = messages.filter((m) => m.role === 'user');
  const fitShown = messages.some((m) => m.role === 'assistant' && m.widgets.some((w) => w.kind === 'fit_report'));
  const briefReady =
    Boolean(visitor?.role || visitor?.jobUrl) || fitShown || userMessages.some((m) => /https?:\/\//i.test(m.content) || m.content.length >= 500);
  const latestBrief = [...messages]
    .reverse()
    .flatMap((m) => (m.role === 'assistant' ? [...m.widgets].reverse() : []))
    .find((w) => w.kind === 'recruiter_brief');
  const briefId = latestBrief?.kind === 'recruiter_brief' ? latestBrief.view.publicId : undefined;
  const makeBrief = () => send(BRIEF_PROMPT);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Like a Messages thread: the agent's avatar and name centred, controls either side. */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-zinc-200/70 bg-paper/85 backdrop-blur-md">
        <div className="relative mx-auto flex h-[92px] w-full max-w-3xl items-center justify-between px-4">
          <Link
            href="/"
            aria-label="Back to the portfolio"
            className="group flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          </Link>

          <div className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
            <Image src="/agent.png" alt="" width={56} height={56} priority className="h-14 w-14 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.12)]" />
            <span className="-mt-2 rounded-full border border-zinc-200/80 bg-white px-3 py-0.5 text-[13px] font-medium text-zinc-900 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.12)]">
              Kyle&apos;s Agent
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isHydrated && <BriefButton ready={briefReady} busy={isStreaming} briefId={briefId} onMake={makeBrief} />}
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleNewChat}
                aria-label="New chat"
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-zinc-200 px-3 text-[12px] text-zinc-600 transition-all hover:border-zinc-400 hover:text-zinc-900 active:scale-[0.97]"
              >
                <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">New chat</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 pb-48 pt-8">
          {isHydrated && messages.length === 0 && (
            <EmptyState
              onIntake={
                visitor === null && !initialQuery
                  ? (context) => {
                      updateVisitor(context);
                      if (context.hiring) send(intakeMessage(context));
                    }
                  : undefined
              }
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

          {visitor?.hiring && messages.length > 0 && (
            <div className="mb-6 flex justify-center">
              <span className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-white pl-2.5 pr-1 text-[12px] text-zinc-600">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">
                  Hiring for {visitor.role ?? 'a role'}
                  {visitor.jobUrl ? ' · posting linked' : ''}
                </span>
                <button
                  type="button"
                  onClick={() => updateVisitor({ hiring: false })}
                  aria-label="Stop using this role as context"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}

          <div className="space-y-8">
            <AnimatePresence initial={false}>
              {messages.map((message, index) =>
                message.role === 'user' ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-[22px] rounded-br-md bg-zinc-200/70 px-4 py-2.5 text-[15px] leading-6 text-ink">
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
                      hasText={message.content.length > 0 || (Boolean(message.answered) && message.widgets.length > 0)}
                      startedAt={message.startedAt}
                      endedAt={message.endedAt}
                    />

                    {message.content && <Markdown content={message.content} streaming={message.status === 'streaming'} />}

                    {message.status === 'done' && !message.content && message.widgets.length === 0 && (
                      <p className="text-sm text-zinc-400">Stopped.</p>
                    )}

                    {/* Cards wait for the answer to finish, then rise in after it. */}
                    {message.widgets.length > 0 && (message.answered || message.status !== 'streaming') && (
                      <div className={`space-y-3 ${message.content ? 'mt-5' : ''}`}>
                        {message.widgets.map((widget, widgetIndex) => {
                          const next = messages[index + 1];
                          return (
                            <motion.div
                              key={`${message.id}-${widgetIndex}`}
                              initial={{ opacity: 0, y: 14, scale: 0.98, filter: 'blur(6px)' }}
                              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.08 + widgetIndex * 0.08 }}
                            >
                              <WidgetRenderer
                                widget={widget}
                                active={index === lastAssistantIndex && message.status !== 'streaming' && !isStreaming}
                                answer={next?.role === 'user' ? next.content : undefined}
                                onAnswer={(text) => send(text)}
                                onBrief={isStreaming ? undefined : makeBrief}
                                chat={{ transcript: () => toTranscript(messagesRef.current), context: visitor }}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    <SourcePills sources={message.sources} />

                    {message.status !== 'streaming' && message.content && (
                      <div className="mt-2 flex items-center gap-0.5 opacity-60 transition-opacity group-hover/message:opacity-100 focus-within:opacity-100">
                        <CopyButton text={message.content} />
                        {index === lastAssistantIndex && (
                          <button
                            type="button"
                            onClick={() => regenerate(index)}
                            aria-label="Regenerate answer"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-200/60 hover:text-ink"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {index === lastAssistantIndex && message.status === 'done' && message.suggestions.length > 0 && (
                      <div className="mt-6">
                        <p className="label mb-1.5">Follow-ups</p>
                        <div className="border-t border-zinc-200/80">
                          {message.suggestions.map((suggestion, i) => (
                            <motion.button
                              key={suggestion}
                              type="button"
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.06 }}
                              onClick={() => send(suggestion)}
                              className="group flex w-full items-center gap-2.5 border-b border-zinc-200/80 py-2.5 text-left text-[14px] text-zinc-600 transition-colors hover:text-ink"
                            >
                              <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover:text-clay" />
                              <span className="transition-transform duration-300 group-hover:translate-x-0.5">{suggestion}</span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
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
        onCommand={(text) => send(text)}
        onStop={handleStop}
        isStreaming={isStreaming}
        inputRef={inputRef}
      />
      <BriefNudge
        engaged={fitShown || userMessages.length >= 3}
        ready={briefReady}
        busy={isStreaming}
        briefId={briefId}
        activity={messages.length}
        onMake={makeBrief}
      />
    </div>
  );
}
