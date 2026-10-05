'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ArrowUp, Square } from 'lucide-react';

/**
 * "/" commands, shaped after Beautiful UI's Prompt Bar (MIT, © 2026 Shane
 * Levine, beautifului.dev). `send` commands ask right away; `fill` commands
 * start the question and leave the cursor for the visitor to finish it.
 */
interface SlashCommand {
  name: string;
  hint: string;
  action: 'send' | 'fill';
  text: string;
}

const COMMANDS: SlashCommand[] = [
  { name: '/fit', hint: 'Check his fit for a role', action: 'fill', text: 'How well does Kyle-Anthony fit this role: ' },
  { name: '/book', hint: 'Book time with Kyle-Anthony', action: 'send', text: "I'd like to book time with Kyle-Anthony." },
  { name: '/projects', hint: "See everything he's built", action: 'send', text: 'What has Kyle-Anthony built?' },
  { name: '/journey', hint: 'Walk through his path so far', action: 'send', text: 'Walk me through how his experience developed.' },
  { name: '/experience', hint: 'Search his experience with…', action: 'fill', text: 'What experience does he have with ' },
  { name: '/links', hint: "Open a project's site or code", action: 'fill', text: 'Show me the links for ' },
  { name: '/resume', hint: 'Get his résumé and contact', action: 'send', text: 'Can I see his résumé and how to reach him?' },
];

function CommandMenu({
  commands,
  highlighted,
  onHover,
  onPick,
}: {
  commands: SlashCommand[];
  highlighted: number;
  onHover: (index: number) => void;
  onPick: (command: SlashCommand) => void;
}) {
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const row = rows.current[highlighted];
    if (row) setBox({ top: row.offsetTop, height: row.offsetHeight });
  }, [highlighted, commands]);

  return (
    <div
      role="listbox"
      aria-label="Commands"
      className="absolute inset-x-0 bottom-full mb-2 overflow-hidden rounded-[18px] border border-zinc-200 bg-white p-1.5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)]"
      style={{ animation: 'scaleIn 160ms cubic-bezier(0.23,1,0.32,1) both', transformOrigin: 'bottom center' }}
    >
      <div className="relative">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 rounded-xl bg-zinc-100"
          style={{
            top: box?.top ?? 0,
            height: box?.height ?? 0,
            opacity: box ? 1 : 0,
            transition: 'top 200ms cubic-bezier(0.23,1,0.32,1), height 200ms cubic-bezier(0.23,1,0.32,1)',
          }}
        />
        {commands.length === 0 ? (
          <p className="px-3 py-2 text-[13px] text-zinc-400">No matching command</p>
        ) : (
          commands.map((command, index) => (
            <button
              key={command.name}
              ref={(el) => {
                rows.current[index] = el;
              }}
              type="button"
              role="option"
              aria-selected={index === highlighted}
              onMouseEnter={() => onHover(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onPick(command)}
              className="relative z-10 flex h-9 w-full items-center gap-3 rounded-xl px-3 text-left"
            >
              <span className="text-[14px] font-medium text-zinc-900">{command.name}</span>
              <span className="truncate text-[13px] text-zinc-400">{command.hint}</span>
            </button>
          ))
        )}
      </div>
      <p className="mt-1 border-t border-zinc-100 px-3 pb-0.5 pt-1.5 text-[11.5px] text-zinc-400">
        ↑↓ to move · Enter to choose · Esc to close
      </p>
    </div>
  );
}

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** Sends a message directly, for "/" commands that ask right away. */
  onCommand?: (text: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export default function Composer({ value, onChange, onSend, onCommand, onStop, isStreaming, inputRef }: ComposerProps) {
  const [highlighted, setHighlighted] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  // The menu is open while the input is a lone "/word" the visitor hasn't dismissed.
  const slash = /^\/(\S*)$/.exec(value);
  const matches = useMemo(
    () => (slash ? COMMANDS.filter((command) => command.name.slice(1).startsWith(slash[1].toLowerCase())) : []),
    [slash?.[1]] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const menuOpen = Boolean(slash) && !dismissed;

  useEffect(() => {
    setHighlighted(0);
    if (!value.startsWith('/')) setDismissed(false);
  }, [value]);

  const pick = (command: SlashCommand) => {
    if (command.action === 'send' && onCommand && !isStreaming) {
      onChange('');
      onCommand(command.text);
      return;
    }
    onChange(command.text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(command.text.length, command.text.length);
      }
    });
  };

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
          className="pointer-events-auto relative mx-auto w-full max-w-3xl"
        >
          {menuOpen && <CommandMenu commands={matches} highlighted={highlighted} onHover={setHighlighted} onPick={pick} />}
          <div className="flex items-end gap-2 rounded-[22px] border border-zinc-200 bg-white py-2 pl-5 pr-2 shadow-[0_12px_32px_-18px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-300 focus-within:border-zinc-300 focus-within:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.3)]">
            <textarea
              ref={inputRef}
              value={value}
              rows={1}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (menuOpen && matches.length > 0) {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    const step = event.key === 'ArrowDown' ? 1 : -1;
                    setHighlighted((current) => (current + step + matches.length) % matches.length);
                    return;
                  }
                  if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
                    event.preventDefault();
                    pick(matches[highlighted] ?? matches[0]);
                    return;
                  }
                }
                if (menuOpen && event.key === 'Escape') {
                  event.preventDefault();
                  setDismissed(true);
                  return;
                }
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  if (canSend) onSend();
                }
              }}
              placeholder="Ask about his work, or type / for commands"
              aria-label="Message"
              aria-autocomplete="list"
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
