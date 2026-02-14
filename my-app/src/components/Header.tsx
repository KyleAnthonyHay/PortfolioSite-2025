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
    <header className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Kyle-Anthony.."
          className="w-80 sm:w-96 px-5 py-3 pr-12 bg-white text-gray-900 placeholder-gray-400 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-lg"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="absolute right-2 w-9 h-9 flex items-center justify-center bg-gray-900 hover:bg-gray-700 disabled:bg-gray-300 disabled:opacity-50 rounded-full transition-colors"
        >
          <ArrowIcon />
        </button>
      </form>
    </header>
  );
};

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

export default Header; 