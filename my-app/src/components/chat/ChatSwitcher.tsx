'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { stampFor, type ChatSummary } from './chat-history';

/**
 * The header's "New chat" control: a pill with the new-chat action on the
 * left and a chevron on the right that opens the list of chats in this
 * browser, the current one marked, so starting a new chat never loses one.
 */
export default function ChatSwitcher({
  current,
  parked,
  onNew,
  onOpen,
  onRemove,
}: {
  current: ChatSummary | null;
  parked: ChatSummary[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const rows = [...(current ? [{ ...current, isCurrent: true }] : []), ...parked.map((chat) => ({ ...chat, isCurrent: false }))];

  return (
    <div ref={rootRef} className="relative">
      <div className="inline-flex h-10 items-stretch overflow-hidden rounded-full border border-zinc-200/60 bg-white text-zinc-600 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onNew();
          }}
          aria-label="New chat"
          className="inline-flex items-center justify-center px-2 transition-colors hover:text-zinc-900 active:scale-[0.97] sm:gap-1.5 sm:pl-3.5 sm:pr-3 sm:text-[12px]"
        >
          <Plus className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> <span className="hidden sm:inline">New chat</span>
        </button>
        <span aria-hidden className="my-2.5 w-px bg-zinc-200" />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label="Switch chat"
          aria-haspopup="menu"
          aria-expanded={open}
          className={`inline-flex w-6 items-center justify-center transition-colors hover:text-zinc-900 sm:w-8 ${open ? 'bg-zinc-100 text-zinc-900' : ''}`}
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="chats"
            role="menu"
            aria-label="Your chats"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] origin-top-right rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.22)]"
          >
            <p className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-400">Your chats</p>
            {rows.length === 0 && <p className="px-3 pb-2 text-[13px] text-zinc-500">Nothing yet. Ask something to start one.</p>}
            {rows.map((row) => (
              <div key={row.id} className="group/row relative">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (!row.isCurrent) onOpen(row.id);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors hover:bg-zinc-100 ${row.isCurrent ? 'bg-zinc-50' : ''}`}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {row.isCurrent && <Check className="h-3.5 w-3.5 text-accent-blue" strokeWidth={2.5} />}
                  </span>
                  <span className="min-w-0 flex-1 pr-6">
                    <span className="block truncate text-[13px] font-medium text-zinc-900">{row.title}</span>
                    <span className="block text-[11px] text-zinc-400">{row.isCurrent ? 'Current · ' : ''}{stampFor(row.updatedAt)}</span>
                  </span>
                </button>
                {!row.isCurrent && (
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    aria-label={`Delete chat “${row.title}”`}
                    className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-200/70 hover:text-zinc-900 focus:opacity-100 group-hover/row:opacity-100 [@media(pointer:coarse)]:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
