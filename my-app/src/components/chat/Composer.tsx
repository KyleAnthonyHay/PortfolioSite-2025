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
          <div className="flex items-end gap-2 rounded-[22px] border border-zinc-200 bg-white py-2 pl-5 pr-2 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-300 focus-within:border-zinc-300 focus-within:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.3)]">
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
              className="block min-h-[36px] flex-1 resize-none bg-transparent py-[7px] text-[15px] leading-[22px] text-zinc-900 placeholder-zinc-400 caret-zinc-900 outline-none"
            />
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all active:scale-[0.95]"
              >
                <svg viewBox="0 0 36 36" className="absolute inset-0 h-9 w-9" aria-hidden>
                  <circle cx="18" cy="18" r="16.5" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeDasharray="22 82" strokeLinecap="round" className="arc-spin" />
                </svg>
                <Square className="h-2.5 w-2.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSend}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-[0.95] disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
              </button>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Grounded in Kyle-Anthony&apos;s projects and résumé. It can still make mistakes.
          </p>
        </form>
      </div>
    </div>
  );
}
