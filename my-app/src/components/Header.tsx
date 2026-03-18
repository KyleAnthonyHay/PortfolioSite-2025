'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const Header = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(input.trim())}`);
  };

  return (
    <header
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
      }`}
    >
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Kyle-Anthony.."
          className="w-80 sm:w-96 px-5 py-3.5 pr-12 bg-white/90 backdrop-blur-xl text-zinc-900 placeholder-zinc-400 rounded-2xl border border-zinc-200/60 focus:outline-none focus:ring-2 focus:ring-zinc-300/50 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-2 w-9 h-9 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 disabled:opacity-50 rounded-xl active:scale-[0.95] transition-all duration-200"
        >
          <ArrowIcon />
        </button>
      </form>
    </header>
  );
};

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default Header;
