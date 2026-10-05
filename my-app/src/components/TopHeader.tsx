'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import Wordmark from '@/components/home/Wordmark';
import { useIntro } from '@/components/home/IntroContext';

const links = [
  { href: '/#products', label: 'Products' },
  { href: '/#about', label: 'About' },
  { href: '/#experience', label: 'Experience' },
  { href: 'https://medium.com/@kyleanthonyhay', label: 'Writing', external: true },
];

const TopHeader = () => {
  const { phase } = useIntro();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const settled = phase === 'done';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const fade = {
    initial: { opacity: 0, y: -6 },
    animate: phase === 'intro' ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 },
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-[background-color,border-color] duration-500 ${
        scrolled || open ? 'border-b border-zinc-200/70 bg-paper/85 backdrop-blur-md' : 'border-b border-transparent bg-paper'
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        <Link href="/" className="-my-2 py-2" aria-label="Kyle-Anthony Hay, home">
          <Wordmark hidden={!settled} />
        </Link>

        <motion.div
          {...fade}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="hidden items-center gap-7 md:flex"
        >
          {links.map((link) =>
            link.external ? (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 transition-colors hover:text-ink">
                {link.label}
              </a>
            ) : (
              <Link key={link.label} href={link.href} className="text-[13px] text-zinc-500 transition-colors hover:text-ink">
                {link.label}
              </Link>
            )
          )}
          <Link href="/chat" className="group inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-ink">
            <span className="h-1.5 w-1.5 rounded-full bg-clay" />
            Ask my agent
          </Link>
        </motion.div>

        <motion.div
          {...fade}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="hidden items-center gap-5 md:flex"
        >
          <a href="/resume" target="_blank" rel="noopener noreferrer" className="text-[13px] text-zinc-500 transition-colors hover:text-ink">
            Résumé
          </a>
          <Link
            href="/contact"
            className="inline-flex h-9 items-center rounded-full bg-ink px-4 text-[13px] font-medium text-paper transition-transform duration-200 hover:bg-zinc-800 active:scale-[0.97]"
          >
            Get in touch
          </Link>
        </motion.div>

        <button
          onClick={() => setOpen(!open)}
          className="-mr-2 p-2 text-zinc-700 md:hidden"
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className="relative block h-3 w-5">
            <span className={`absolute left-0 block h-[1.5px] w-5 bg-current transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
            <span className={`absolute left-0 block h-[1.5px] w-5 bg-current transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
          </span>
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden md:hidden"
          >
            <div className="flex flex-col px-6 pb-6 pt-2">
              {[...links, { href: '/chat', label: 'Ask my agent' }, { href: '/resume', label: 'Résumé' }, { href: '/contact', label: 'Get in touch' }].map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-zinc-200/70 py-3.5 font-display text-2xl tracking-tight text-ink"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopHeader;
