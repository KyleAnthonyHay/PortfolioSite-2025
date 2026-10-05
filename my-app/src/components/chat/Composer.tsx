'use client';

import { useEffect, type RefObject } from 'react';
import { ArrowUp, Square } from 'lucide-react';

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function Composer({ value, onChange, onSend, onStop, isStreaming, inputRef }: ComposerProps) {
  // Grow with the text up to a few lines, then scroll.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 168)}px`;
  }, [value, inputRef]);

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
      <div className="h-12 bg-gradient-to-t from-paper to-transparent" />
      <div className="bg-paper px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) onSend();
          }}
          className="pointer-events-auto mx-auto w-full max-w-3xl"
        >
          <div className="rounded-[24px] border border-zinc-300/70 bg-white shadow-[0_18px_44px_-24px_rgba(26,22,19,0.35)] transition-[border-color,box-shadow] duration-300 focus-within:border-zinc-400 focus-within:shadow-[0_22px_50px_-22px_rgba(26,22,19,0.42)]">
            <textarea
              ref={inputRef}
              value={value}
              rows={1}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (canSend) onSend();
                }
              }}
              placeholder="Ask about his products, skills, or fit for a role…"
              aria-label="Message"
              className="block w-full resize-none bg-transparent px-5 pb-1 pt-4 text-[15px] leading-6 text-ink placeholder-zinc-400 caret-[#a95b31] outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2 pl-5">
              <span className="hidden font-mono text-[11px] text-zinc-400 sm:block">↵ send · ⇧↵ new line</span>
              <span className="sm:hidden" />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition-all active:scale-[0.95]"
                >
                  <svg viewBox="0 0 36 36" className="absolute inset-0 h-9 w-9" aria-hidden>
                    <circle cx="18" cy="18" r="16.5" fill="none" stroke="#c98a5f" strokeWidth="1.5" strokeDasharray="22 82" strokeLinecap="round" className="arc-spin" />
                  </svg>
                  <Square className="h-2.5 w-2.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper transition-all hover:bg-zinc-800 active:scale-[0.95] disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Grounded in Kyle-Anthony&apos;s projects and résumé. It can still make mistakes.
          </p>
        </form>
      </div>
    </div>
  );
}
