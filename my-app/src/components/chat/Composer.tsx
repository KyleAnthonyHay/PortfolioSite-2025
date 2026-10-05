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
      <div className="h-10 bg-gradient-to-t from-[#f9fafb] to-transparent" />
      <div className="bg-[#f9fafb] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (canSend) onSend();
          }}
          className="pointer-events-auto mx-auto w-full max-w-3xl"
        >
          <div className="rounded-[22px] border border-zinc-200/70 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.14)] transition-all focus-within:border-zinc-300 focus-within:shadow-[0_12px_36px_-12px_rgba(0,0,0,0.18)]">
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
              placeholder="Ask about Kyle-Anthony's projects, skills, or fit for a role…"
              aria-label="Message"
              className="block w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-[15px] leading-6 text-zinc-900 placeholder-zinc-400 outline-none"
            />
            <div className="flex items-center justify-between px-2 pb-2 pl-4">
              <span className="hidden text-[11px] text-zinc-400 sm:block">
                Enter to send · Shift + Enter for a new line
              </span>
              <span className="sm:hidden" />
              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStop}
                  aria-label="Stop generating"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-[0.95]"
                >
                  <Square className="h-3 w-3 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white transition-all hover:bg-zinc-800 active:scale-[0.95] disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2.2} />
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-center text-[11px] text-zinc-400">
            Answers are grounded in Kyle-Anthony&apos;s projects and résumé. It can still make mistakes.
          </p>
        </form>
      </div>
    </div>
  );
}
