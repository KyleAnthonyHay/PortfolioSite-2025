'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Floating prompt that follows the visitor once the hero's own agent button
 * has scrolled away, and steps aside over the footer.
 */
const Header = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      const footer = document.querySelector('footer');
      const nearFooter = footer ? footer.getBoundingClientRect().top < window.innerHeight - 40 : false;
      setIsVisible(window.scrollY > window.innerHeight * 0.75 && !nearFooter);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 h-1.5 w-1.5 rounded-full bg-clay" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask my agent anything…"
          aria-label="Ask my agent"
          className="h-12 w-[19rem] rounded-full border border-white/10 bg-ink/90 pl-9 pr-12 text-[14px] text-paper caret-[#c98a5f] placeholder-zinc-400 shadow-[0_20px_40px_-16px_rgba(26,22,19,0.5)] backdrop-blur-md focus:outline-none sm:w-[24rem]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Ask"
          className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-paper text-ink transition-all duration-200 active:scale-[0.95] disabled:opacity-40"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default Header;
