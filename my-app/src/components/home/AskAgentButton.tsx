'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const questions = [
  'What has he shipped?',
  'How does OnTract use RAG?',
  'Does he know SwiftUI?',
  'Is he a fit for my team?',
];

/**
 * The hero's one animated control. It looks like a closed prompt that keeps
 * typing a question, so it says what the agent is before anyone clicks, and
 * clicking sends whatever question is showing.
 */
export default function AskAgentButton() {
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const question = questions[index];

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(question.length);
      return;
    }
    let delay = deleting ? 22 : 48;
    if (!deleting && count === question.length) delay = 2200;
    if (deleting && count === 0) delay = 260;
    const id = setTimeout(() => {
      if (!deleting && count === question.length) setDeleting(true);
      else if (deleting && count === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % questions.length);
      } else setCount((c) => c + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(id);
  }, [count, deleting, question.length]);

  return (
    <Link
      href={`/chat?q=${encodeURIComponent(question)}`}
      className="group relative inline-flex h-14 w-full max-w-[25rem] items-center gap-3 rounded-full bg-ink pl-5 pr-2 text-paper shadow-[0_18px_40px_-18px_rgba(26,22,19,0.55)] transition-transform duration-300 active:scale-[0.985] sm:w-[25rem]"
    >
      <span className="shrink-0 text-[13px] text-zinc-400">Ask my agent</span>
      <span className="min-w-0 flex-1 truncate text-[14px]">
        {question.slice(0, count)}
        <span className="caret ml-px inline-block h-[1.05em] w-[1.5px] translate-y-[3px] bg-clay" />
      </span>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-transform duration-300 group-hover:-rotate-45">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
