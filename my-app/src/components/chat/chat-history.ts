import type { VisitorContext } from '@/lib/chat-events';

/**
 * Past chats, kept in this browser only. "New chat" used to wipe the
 * conversation; now the old one is parked here and the header's chevron
 * lists it, so a recruiter juggling two things can pick either back up.
 */
export interface StoredChat<M> {
  id: string;
  messages: M[];
  context: VisitorContext | null;
  updatedAt: number;
}

/** A row in the switcher: the current chat or a parked one. */
export interface ChatSummary {
  id: string;
  title: string;
  updatedAt: number;
}

const ARCHIVE_KEY = 'portfolio-chat-archive-v1';
export const MAX_CHATS = 8;
const TITLE_LENGTH = 56;

export function loadArchive<M>(): StoredChat<M>[] {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredChat<M>[];
    return Array.isArray(parsed) ? parsed.filter((chat) => chat && typeof chat.id === 'string' && Array.isArray(chat.messages)) : [];
  } catch {
    return [];
  }
}

export function saveArchive<M>(chats: StoredChat<M>[]) {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(chats.slice(0, MAX_CHATS)));
  } catch {
    // Storage unavailable; parked chats just won't survive a reload.
  }
}

/** The first thing the visitor asked, as the chat's name. */
export function chatTitle(messages: { role: string; content?: string }[]): string {
  const first = messages.find((m) => m.role === 'user')?.content?.replace(/\s+/g, ' ').trim();
  if (!first) return 'New chat';
  return first.length > TITLE_LENGTH ? `${first.slice(0, TITLE_LENGTH - 1).trimEnd()}…` : first;
}

/** "9:28 AM" today, otherwise "Oct 6 at 1:21 PM", like a Messages thread. */
export function stampFor(ms: number): string {
  const date = new Date(ms);
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return time;
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`;
}
