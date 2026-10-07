'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowLeft, AudioLines, Briefcase, Check, Copy, RefreshCw, X } from 'lucide-react';
import type { ActivityStep, ChatEvent, ConversationMessage, SourceRef, VisitorContext, Widget } from '@/lib/chat-events';
import ActivitySteps from './ActivitySteps';
import Composer from './Composer';
import EmptyState from './EmptyState';
import { intakeMessage } from './HiringIntake';
import Markdown from './Markdown';
import SourcePills from './SourcePills';
import WidgetRenderer from './widgets';
import { BRIEF_PROMPT, BriefButton, BriefNudge } from './BriefEntry';
import ChatSwitcher from './ChatSwitcher';
import { chatTitle, loadArchive, MAX_CHATS, saveArchive, stampFor, type StoredChat } from './chat-history';
import CallEndedEntry from './voice/CallEndedEntry';
import CallCard from './voice/CallCard';
import { useVoiceCall, type Delegation } from './voice/useVoiceCall';
import type { CallEndReason } from './voice/types';

interface UserMessage {
  id: string;
  role: 'user';
  content: string;
  /** Client clock, for the time stamps between messages. */
  at?: number;
  /** Spoken on a call rather than typed. */
  voice?: boolean;
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
  /** Came from a call: the agent's answer to a spoken question, or the voice's own small talk. */
  voice?: boolean;
}

/** The "Call ended" line a call leaves in the chat. Never sent to the agent. */
interface CallMessage {
  id: string;
  role: 'call';
  at: number;
  durationMs: number;
  reason: CallEndReason;
}

type ChatMessage = UserMessage | AssistantMessage | CallMessage;

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
    .filter((m): m is UserMessage | AssistantMessage => m.role !== 'call')
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

/** The chat as the agent's history. A turn that only asked a question has no prose; it sends the question so the agent knows what the next message answers. */
function toHistory(messages: ChatMessage[]): ConversationMessage[] {
  return messages
    .filter((m): m is UserMessage | AssistantMessage => m.role !== 'call')
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

const STAMP_GAP_MS = 10 * 60_000;

function messageTime(message: ChatMessage): number | undefined {
  return message.role === 'assistant' ? message.startedAt : message.at;
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
  // Chats parked by "New chat" or by switching away, newest first.
  const [archive, setArchive] = useState<StoredChat<ChatMessage>[]>([]);
  const archiveRef = useRef<StoredChat<ChatMessage>[]>([]);
  const conversationRef = useRef('');
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const hasSentInitialRef = useRef(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** The live call's session id, for telling the voice about typed turns. */
  const callSessionRef = useRef<(() => string | null) | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    archiveRef.current = loadArchive<ChatMessage>();
    setArchive(archiveRef.current);
    setIsHydrated(true);
  }, []);

  const updateArchive = useCallback((next: StoredChat<ChatMessage>[]) => {
    const trimmed = next.slice(0, MAX_CHATS);
    archiveRef.current = trimmed;
    setArchive(trimmed);
    saveArchive(trimmed);
  }, []);

  /** Park the chat on screen so it can be reopened from the switcher. Empty chats are dropped. */
  const stashCurrent = useCallback(() => {
    const current = messagesRef.current;
    if (!current.some((m) => m.role === 'user')) return;
    const settled = current.map((m) => (m.role === 'assistant' && m.status === 'streaming' ? { ...m, status: 'done' as const } : m));
    const times = settled.map(messageTime).filter((t): t is number => t !== undefined);
    const parked: StoredChat<ChatMessage> = {
      id: conversationRef.current,
      messages: settled.slice(-MAX_STORED),
      context: visitorRef.current,
      updatedAt: times.length > 0 ? Math.max(...times) : Date.now(),
    };
    updateArchive([parked, ...archiveRef.current.filter((chat) => chat.id !== parked.id)]);
  }, [updateArchive]);

  const updateVisitor = useCallback((next: VisitorContext | null) => {
    visitorRef.current = next;
    setVisitor(next);
    persistContext(next);
  }, []);

  // Desktop only: on a phone a programmatic focus would raise the keyboard
  // over the opening card before the visitor has asked for it.
  useEffect(() => {
    if (!isHydrated || isStreaming) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    inputRef.current?.focus();
  }, [isHydrated, isStreaming]);

  // iPhone keyboard: the fixed chat shell shrinks to the visual viewport, so
  // the composer rides on the keyboard and the header stays put, instead of
  // Safari sliding the whole shell up to reveal the input.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const root = document.documentElement;
    const update = () => {
      const keyboardUp = window.innerHeight - viewport.height > 80;
      if (keyboardUp) {
        root.style.setProperty('--chat-vh', `${viewport.height}px`);
        if (window.scrollY > 0 || viewport.offsetTop > 0) window.scrollTo(0, 0);
      } else {
        root.style.removeProperty('--chat-vh');
      }
    };
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    update();
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      root.style.removeProperty('--chat-vh');
    };
  }, []);

  // When the shell shrinks for the keyboard, keep following the newest message.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => {
      if (stickToBottomRef.current) el.scrollTop = el.scrollHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Follow the newest content unless the visitor has scrolled up to read.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
      stickToBottomRef.current = near;
      setAtBottom(near);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Follow the answer as it streams in: new messages, prose, steps and
  // cards. Follow-ups, sources and the done mark leave the scroll where it
  // is, so the thread never snaps down once the reader has started reading.
  const last = messages[messages.length - 1];
  const followKey =
    last?.role === 'assistant' ? `${messages.length}:${last.content.length}:${last.steps.length}:${last.widgets.length}` : `${messages.length}`;
  useEffect(() => {
    const el = scrollerRef.current;
    if (el && stickToBottomRef.current && messages.length > 0) el.scrollTop = el.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followKey]);

  const scrollToBottom = () => {
    const el = scrollerRef.current;
    if (!el) return;
    stickToBottomRef.current = true;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  };

  const send = useCallback(
    async (text: string, options?: { replaceFromIndex?: number; voice?: Delegation & { userId: string | null } }) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      abortRef.current?.abort();

      const voice = options?.voice;
      const base =
        options?.replaceFromIndex !== undefined
          ? messagesRef.current.slice(0, options.replaceFromIndex)
          : messagesRef.current;
      // A spoken question is already on screen as the visitor's voice bubble; the history stops before it.
      const spokenIndex = voice?.userId ? base.findIndex((m) => m.id === voice.userId) : -1;
      const history = toHistory(spokenIndex >= 0 ? base.slice(0, spokenIndex) : base);

      const assistantId = newId();
      const assistant: AssistantMessage = { id: assistantId, role: 'assistant', content: '', steps: [], widgets: [], sources: [], suggestions: [], status: 'streaming', startedAt: Date.now(), ...(voice ? { voice: true } : {}) };
      const next: ChatMessage[] =
        spokenIndex >= 0
          ? [...base, assistant]
          : [...base, { id: newId(), role: 'user', content: trimmed, at: Date.now(), ...(voice ? { voice: true } : {}) }, assistant];
      stickToBottomRef.current = true;
      setMessages(next);

      const controller = new AbortController();
      abortRef.current = controller;

      const update = (fn: (m: AssistantMessage) => AssistantMessage) =>
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId && m.role === 'assistant' ? fn(m) : m))
        );

      try {
        const response = await fetch(voice ? '/api/voice/delegate' : '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            history,
            context: visitorRef.current ?? undefined,
            conversationId: conversationRef.current,
            ...(voice ? { sessionId: voice.sessionId, delegationId: voice.delegationId } : {}),
          }),
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
        // Typed during a call: let the voice know what was said, so the two stay one conversation.
        const callSession = callSessionRef.current?.();
        if (!voice && callSession) {
          const answered = messagesRef.current.find((m) => m.id === assistantId);
          void fetch('/api/voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'context', sessionId: callSession, user: trimmed, assistant: answered?.role === 'assistant' ? answered.content : '' }),
          }).catch(() => {});
        }
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

  // Spoken turns. The visitor's speech becomes a voice bubble as it is
  // transcribed; a hand-off sends it to the agent like a typed message; the
  // voice's own small talk becomes a reply bubble. Bubbles group by pauses,
  // since the two sides can talk over each other. While the voice reads an
  // agent answer aloud, that answer is already on screen, so its words are
  // left out until the voice has gone quiet after the answer.
  const voiceUserRef = useRef<{ id: string; at: number } | null>(null);
  const voiceReplyRef = useRef<{ id: string; at: number } | null>(null);
  const handedOffUserRef = useRef<string | null>(null);
  const readingRef = useRef<{ done: boolean; at: number } | null>(null);
  const call = useVoiceCall({
    history: () => toHistory(messagesRef.current),
    onUserSpeech: (delta) => {
      const now = Date.now();
      const open = voiceUserRef.current;
      if (open && now - open.at < 1800) {
        voiceUserRef.current = { id: open.id, at: now };
        setMessages((prev) => prev.map((m) => (m.id === open.id && m.role === 'user' ? { ...m, content: m.content + delta } : m)));
        return;
      }
      // Recognition noise on its own (a lone symbol or comma) doesn't start a bubble.
      if (!/[\p{L}\p{N}]/u.test(delta)) return;
      const fresh = newId();
      voiceUserRef.current = { id: fresh, at: now };
      stickToBottomRef.current = true;
      setMessages((prev) => [...prev, { id: fresh, role: 'user', voice: true, content: delta.trimStart(), at: now }]);
    },
    onAssistantSpeech: (delta) => {
      const now = Date.now();
      const reading = readingRef.current;
      if (reading) {
        if (!reading.done || now - reading.at < 3000) {
          readingRef.current = { done: reading.done, at: now };
          return;
        }
        readingRef.current = null;
      }
      const open = voiceReplyRef.current;
      if (open && now - open.at < 2500) {
        voiceReplyRef.current = { id: open.id, at: now };
        setMessages((prev) => prev.map((m) => (m.id === open.id && m.role === 'assistant' ? { ...m, content: m.content + delta } : m)));
        return;
      }
      if (!/[\p{L}\p{N}]/u.test(delta)) return;
      const fresh = newId();
      voiceReplyRef.current = { id: fresh, at: now };
      setMessages((prev) => [
        ...prev,
        { id: fresh, role: 'assistant', voice: true, content: delta.trimStart(), steps: [], widgets: [], sources: [], suggestions: [], status: 'done', startedAt: now, endedAt: now },
      ]);
    },
    onHandOff: () => {
      readingRef.current = { done: false, at: Date.now() };
      handedOffUserRef.current = voiceUserRef.current?.id ?? null;
      voiceUserRef.current = null;
      voiceReplyRef.current = null;
    },
    onDelegation: (delegation) => {
      const userId = handedOffUserRef.current;
      handedOffUserRef.current = null;
      const bubble = userId ? messagesRef.current.find((m) => m.id === userId) : undefined;
      const question = delegation.text || (bubble?.role === 'user' ? bubble.content : '');
      void send(question.trim() || '(The visitor spoke, but the words were not transcribed.)', { voice: { ...delegation, userId } }).finally(() => {
        if (readingRef.current) readingRef.current = { done: true, at: Date.now() };
      });
    },
    onEnded: ({ durationMs, reason }) => {
      voiceUserRef.current = null;
      voiceReplyRef.current = null;
      readingRef.current = null;
      stickToBottomRef.current = true;
      setMessages((prev) => [...prev, { id: newId(), role: 'call', at: Date.now(), durationMs, reason }]);
    },
    onNotice: setNotice,
  });
  callSessionRef.current = call.sessionId;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // The homepage's Call button lands here with ?call=1.
  const calledFromLinkRef = useRef(false);
  useEffect(() => {
    if (!isHydrated || calledFromLinkRef.current || searchParams.get('call') !== '1') return;
    calledFromLinkRef.current = true;
    void call.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated]);

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

  const handleNewChat = (options?: { discard?: boolean }) => {
    if (call.active) call.hangUp();
    abortRef.current?.abort();
    if (!options?.discard) stashCurrent();
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

  /** Bring a parked chat back; the one on screen is parked in its place. */
  const openChat = (id: string) => {
    const chat = archiveRef.current.find((item) => item.id === id);
    if (!chat || id === conversationRef.current) return;
    if (call.active) call.hangUp();
    abortRef.current?.abort();
    stashCurrent();
    updateArchive(archiveRef.current.filter((item) => item.id !== id));
    conversationRef.current = chat.id;
    try {
      localStorage.setItem(CONVERSATION_KEY, chat.id);
    } catch {
      // Storage unavailable; the id still lives in the ref for this visit.
    }
    updateVisitor(chat.context);
    stickToBottomRef.current = true;
    setMessages(chat.messages);
    setInput('');
  };

  /** Delete a chat for good: a parked one leaves the list; the current one is cleared without being parked. */
  const removeChat = (id: string) => {
    if (id === conversationRef.current) handleNewChat({ discard: true });
    else updateArchive(archiveRef.current.filter((item) => item.id !== id));
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
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/60 bg-white text-zinc-600 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)] transition-colors hover:text-zinc-900"
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
            {isHydrated && (messages.length > 0 || archive.length > 0) && (
              <ChatSwitcher
                current={
                  userMessages.length > 0
                    ? { id: conversationRef.current, title: chatTitle(messages), updatedAt: Math.max(...messages.map(messageTime).filter((t): t is number => t !== undefined), 0) || Date.now() }
                    : null
                }
                parked={archive.map((chat) => ({ id: chat.id, title: chatTitle(chat.messages), updatedAt: chat.updatedAt }))}
                onNew={() => handleNewChat()}
                onOpen={openChat}
                onRemove={removeChat}
              />
            )}
          </div>
        </div>
      </header>

      <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        <div className={`mx-auto w-full max-w-3xl px-4 pb-48 transition-[padding] duration-300 ${call.active ? 'pt-28' : 'pt-8'}`}>
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
              {messages.map((message, index) => {
                const time = messageTime(message);
                const previous = index > 0 ? messageTime(messages[index - 1]) : undefined;
                const stamp = time !== undefined && (previous === undefined || time - previous > STAMP_GAP_MS) ? stampFor(time) : null;
                if (message.role === 'call') {
                  return (
                    <motion.div key={message.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
                      {stamp && <p className="mb-4 text-center text-[12px] text-zinc-400">{stamp}</p>}
                      <CallEndedEntry durationMs={message.durationMs} reason={message.reason} />
                    </motion.div>
                  );
                }
                return message.role === 'user' ? (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {stamp && <p className="mb-4 text-center text-[12px] text-zinc-400">{stamp}</p>}
                    <div className="flex justify-end">
                      <div className="max-w-[85%] whitespace-pre-wrap [overflow-wrap:anywhere] rounded-[22px] rounded-br-md bg-accent-blue px-4 py-2.5 text-[16px] leading-[1.4] text-white">
                        {message.voice && <AudioLines aria-label="Spoken" className="-mt-0.5 mr-1.5 inline h-3.5 w-3.5 opacity-75" />}
                        {message.content}
                      </div>
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

                    {message.content && (
                      <div className="flex">
                        <div className="max-w-[88%] rounded-[22px] rounded-bl-md bg-zinc-100 px-4 py-2.5">
                          {message.voice && !message.steps.length && <AudioLines aria-label="Spoken" className="mb-1 h-3.5 w-3.5 text-zinc-400" />}
                          <Markdown content={message.content} streaming={message.status === 'streaming'} />
                        </div>
                      </div>
                    )}

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
                      <div className="mt-4 flex max-w-[88%] flex-col gap-2">
                        {message.suggestions.map((suggestion, i) => (
                          <motion.button
                            key={suggestion}
                            type="button"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.06 }}
                            onClick={() => send(suggestion)}
                            className="w-full rounded-2xl border border-dashed border-zinc-300 px-4 py-2.5 text-left text-[14px] leading-snug text-zinc-800 transition-colors hover:border-zinc-400 hover:bg-zinc-50 active:scale-[0.99]"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!atBottom && messages.length > 0 && (
          <motion.button
            key="to-bottom"
            type="button"
            onClick={scrollToBottom}
            aria-label="Scroll to the latest message"
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-[9.5rem] left-1/2 z-40 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-zinc-200/60 bg-white text-zinc-700 shadow-[0_6px_20px_-6px_rgba(0,0,0,0.25)] active:scale-[0.95]"
          >
            <ArrowDown className="h-4 w-4" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      <Composer
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onCommand={(text) => send(text)}
        onStop={handleStop}
        isStreaming={isStreaming}
        inputRef={inputRef}
        onTalk={call.active ? undefined : () => void call.start()}
      />
      <AnimatePresence>
        {call.active && (
          <CallCard
            key="call"
            phase={call.phase}
            muted={call.muted}
            remainingMs={call.remainingMs}
            level={call.level}
            warning={call.warning}
            onDismissWarning={call.dismissWarning}
            onMute={call.toggleMute}
            onHangUp={call.hangUp}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notice && (
          <motion.div
            key="notice"
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute inset-x-0 top-[100px] z-50 flex justify-center px-4"
          >
            <p className="pointer-events-auto flex w-full max-w-[400px] items-start gap-2 rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[13.5px] leading-snug text-zinc-800 shadow-[0_12px_28px_-16px_rgba(0,0,0,0.3)]">
              <span className="flex-1">{notice}</span>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900">
                <X className="h-3.5 w-3.5" />
              </button>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
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
