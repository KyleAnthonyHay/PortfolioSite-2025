'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
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

        <motion.div {...reveal(0.1)} className="hidden lg:flex items-center gap-1">
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
        </motion.div>

        {/*
          The agent is the one filled button in the header; everything else stays quiet.
          On a tablet (md to lg) the full row doesn't fit, so only the agent
          button stays visible and the rest folds into the menu beside it.
        */}
        <motion.div {...reveal(0.2)} className="hidden md:flex items-center gap-2 max-lg:ml-auto max-lg:mr-2">
          <a
            href="/Kyle-Anthony_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="max-lg:hidden px-3 py-2 text-sm font-medium text-zinc-500 rounded-lg hover:bg-zinc-100/80 hover:text-zinc-900 active:scale-[0.98] transition-all duration-200"
          >
            Resume
          </a>
          <Link
            href="/contact"
            className="max-lg:hidden px-4 py-2 text-sm font-medium text-zinc-700 border border-zinc-300/80 rounded-xl hover:bg-zinc-100 hover:border-zinc-300 active:scale-[0.98] transition-all duration-200"
          >
            Contact
          </Link>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 whitespace-nowrap pl-2.5 pr-4 py-1.5 max-lg:py-2 text-sm font-medium text-white bg-accent-blue rounded-xl shadow-[0_6px_18px_-6px_rgba(10,132,255,0.6)] hover:bg-[#0077e6] active:scale-[0.98] transition-all duration-200"
          >
            <Image src="/agent.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            Ask my agent
          </Link>
        </motion.div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="lg:hidden p-2 -mr-2 h-11 w-11 inline-flex items-center justify-center text-zinc-600 hover:text-zinc-900 active:scale-[0.95] transition-all duration-200"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </nav>

      <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          key="menu"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="lg:hidden absolute top-full left-0 right-0 bg-paper border-b border-slate-200/50 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.18)] z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
            className="flex flex-col max-w-[1400px] mx-auto px-6 md:px-10 py-4 gap-1"
          >
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
            <div className="flex flex-col md:flex-row gap-2 pt-4 mt-2 border-t border-zinc-200/60">
              {/* Already beside the menu button from md up. */}
              <Link
                href="/chat"
                onClick={closeMenu}
                className="md:hidden inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-accent-blue rounded-xl shadow-[0_8px_20px_-8px_rgba(10,132,255,0.6)] hover:bg-[#0077e6] transition-all"
              >
                <Image src="/agent.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
                Ask my agent
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-all text-center"
              >
                Contact
              </Link>
              <a
                href="/Kyle-Anthony_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-sm font-medium text-zinc-600 rounded-xl hover:bg-zinc-50 transition-all text-center"
              >
                Resume
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
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
