'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import Wordmark from '@/components/home/Wordmark';
import { useIntro } from '@/components/home/IntroContext';

const TopHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { phase } = useIntro();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Everything but the wordmark waits for the loader to hand over.
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: -4 },
    animate: phase === 'intro' ? { opacity: 0, y: -4 } : { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
  });

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-500 ${
        scrolled || isMenuOpen ? 'border-zinc-200/70 bg-paper/80' : 'border-transparent bg-paper/0'
      }`}
    >
      <nav className="max-w-[1400px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
        <Link href="/" aria-label="Kyle-Anthony Hay, home">
          <Wordmark hidden={phase !== 'done'} />
        </Link>

        <motion.div {...reveal(0.1)} className="hidden md:flex items-center gap-1">
          {[
            { href: '/', label: 'Home' },
            { href: '/#products', label: 'Products' },
            { href: '/#about', label: 'About' },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-zinc-500 hover:text-zinc-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-100/80 transition-all duration-200"
            >
              {link.label}
            </Link>
          ))}
          {[
            { href: 'https://medium.com/@kyleanthonyhay', label: 'Blog' },
            { href: 'https://github.com/kyleanthonyhay', label: 'GitHub' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-100/80 transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/chat"
            className="text-zinc-500 hover:text-zinc-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-zinc-100/80 transition-all duration-200"
          >
            Ask my agent
          </Link>
        </motion.div>

        <motion.div {...reveal(0.2)} className="hidden md:flex items-center gap-2">
          <a
            href="/Kyle-Anthony_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-zinc-600 border border-zinc-300/80 rounded-xl hover:bg-zinc-100 hover:border-zinc-300 active:scale-[0.98] transition-all duration-200"
          >
            Resume
          </a>
          <Link
            href="/contact"
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200"
          >
            Contact
          </Link>
        </motion.div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-zinc-600 hover:text-zinc-900 active:scale-[0.95] transition-all duration-200"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-paper/95 backdrop-blur-xl border-b border-slate-200/50 z-50">
          <div className="flex flex-col px-6 py-4 gap-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/#products', label: 'Products' },
              { href: '/#about', label: 'About' },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="text-zinc-600 hover:text-zinc-900 text-sm font-medium py-3 px-3 rounded-lg hover:bg-zinc-100/80 transition-all"
              >
                {link.label}
              </Link>
            ))}
            {[
              { href: 'https://medium.com/@kyleanthonyhay', label: 'Blog' },
              { href: 'https://github.com/kyleanthonyhay', label: 'GitHub' },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-600 hover:text-zinc-900 text-sm font-medium py-3 px-3 rounded-lg hover:bg-zinc-100/80 transition-all"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/chat"
              onClick={closeMenu}
              className="text-zinc-600 hover:text-zinc-900 text-sm font-medium py-3 px-3 rounded-lg hover:bg-zinc-100/80 transition-all"
            >
              Ask my agent
            </Link>
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-zinc-200/60">
              <a
                href="/Kyle-Anthony_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all text-center"
              >
                Resume
              </a>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="px-4 py-2.5 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all text-center"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default TopHeader;
