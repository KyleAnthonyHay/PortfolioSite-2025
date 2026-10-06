'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CornerDownRight, PenLine } from 'lucide-react';
import type { Widget } from '@/lib/chat-events';

const ease = [0.16, 1, 0.3, 1] as const;

interface QuestionCardProps {
  widget: Extract<Widget, { kind: 'question' }>;
  /** Only the latest question is answerable; older ones show what was picked. */
  active: boolean;
  answer?: string;
  onAnswer?: (text: string) => void;
}

/**
 * The agent asking before it answers. Options are a radio list (number keys
 * pick, Enter sends), with a free-text row for anything the options miss.
 */
export function QuestionCard({ widget, active, answer, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [other, setOther] = useState('');
  const otherIndex = widget.options.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const otherRef = useRef<HTMLInputElement>(null);

  const value =
    selected === null ? '' : selected === otherIndex ? other.trim() : widget.options[selected]?.label ?? '';

  const submit = () => {
    if (value && onAnswer) onAnswer(value);
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && target !== otherRef.current);
      if (typing) return;
      const n = Number(e.key);
      if (target !== otherRef.current && n >= 1 && n <= widget.options.length) {
        e.preventDefault();
        setSelected(n - 1);
      }
      if (e.key === 'Enter' && rootRef.current?.contains(target)) {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!active) {
    return (
      <div className="agent-card px-4 py-3.5">
        <p className="text-[14px] text-zinc-500">{widget.question}</p>
        {answer && (
          <p className="mt-1 flex items-center gap-1.5 text-[14px] font-medium text-ink">
            <CornerDownRight className="h-3.5 w-3.5 text-zinc-400" />
            {answer}
          </p>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="agent-card overflow-hidden" role="group" aria-label={widget.question}>
      <div className="px-4 pb-2 pt-4">
        <p className="font-display text-[16px] font-medium tracking-[-0.01em] text-ink">{widget.question}</p>
      </div>

      <div role="radiogroup" className="px-2 pb-1">
        {widget.options.map((option, i) => {
          const on = selected === i;
          return (
            <motion.button
              key={option.label}
              type="button"
              role="radio"
              aria-checked={on}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.05 }}
              onClick={() => setSelected(i)}
              onDoubleClick={() => onAnswer?.(option.label)}
              className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                on ? 'bg-zinc-100' : 'hover:bg-zinc-50'
              }`}
            >
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors ${
                  on ? 'border-ink' : 'border-zinc-300 group-hover:border-zinc-400'
                }`}
              >
                <AnimatePresence>
                  {on && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                      className="h-2 w-2 rounded-full bg-ink"
                    />
                  )}
                </AnimatePresence>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-ink">{option.label}</span>
                {option.detail && <span className="block text-[12px] text-zinc-400">{option.detail}</span>}
              </span>
              <span className="font-mono text-[11px] text-zinc-300 transition-colors group-hover:text-zinc-400">{i + 1}</span>
            </motion.button>
          );
        })}

        {widget.allowOther && (
          <label
            className={`flex w-full cursor-text items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors ${
              selected === otherIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50'
            }`}
          >
            <PenLine className="mx-px h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={otherRef}
              value={other}
              onFocus={() => setSelected(otherIndex)}
              onChange={(e) => {
                setOther(e.target.value);
                setSelected(otherIndex);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="Something else…"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink placeholder-zinc-400 outline-none"
            />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-200/80 px-4 py-2.5">
        <span className="hidden font-mono text-[11px] text-zinc-400 sm:block">
          1–{widget.options.length} to pick · ↵ to send
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onAnswer?.('Skip that. Just give me your best general answer.')}
            className="h-8 rounded-full px-3 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-ink"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={!value}
            onClick={submit}
            className="h-8 rounded-full bg-ink px-4 text-[13px] font-medium text-paper transition-all active:scale-[0.97] disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
