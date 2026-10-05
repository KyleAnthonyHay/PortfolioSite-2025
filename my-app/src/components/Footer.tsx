'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const links = [
  { href: 'https://www.linkedin.com/in/kyle-anthonyhay/', label: 'LinkedIn' },
  { href: 'https://github.com/KyleAnthonyHay', label: 'GitHub' },
  { href: 'https://x.com/KyleAnthonyHay', label: 'X' },
  { href: 'https://www.instagram.com/kyleanthonyhay/', label: 'Instagram' },
  { href: 'https://medium.com/@kyleanthonyhay', label: 'Medium' },
];

const Footer = () => {
  return (
    <footer className="grain relative overflow-hidden bg-stage text-paper">
      <div className="mx-auto max-w-[1400px] px-6 pb-10 pt-24 md:px-10 md:pt-36">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="label mb-6 text-[#8c8176]!"
        >
          Have something worth building?
        </motion.p>
        <motion.a
          href="mailto:haykyle917@gmail.com"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10%' }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
          className="group block font-display text-[clamp(2.6rem,8.5vw,8.5rem)] font-medium leading-[0.92] tracking-[-0.05em]"
        >
          Let&apos;s talk.
          <span className="mt-4 block text-[clamp(1.1rem,2.2vw,1.9rem)] font-normal tracking-[-0.02em] text-[#8c8176] transition-colors duration-300 group-hover:text-[#c98a5f]">
            haykyle917@gmail.com ↗
          </span>
        </motion.a>

        <div className="mt-24 flex flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#b3a99e] transition-colors hover:text-paper">
                {link.label}
              </a>
            ))}
            <Link href="/chat" className="text-[13px] text-[#b3a99e] transition-colors hover:text-paper">
              Ask my agent
            </Link>
          </div>
          <p className="font-mono text-[11px] text-[#6f665d]">© {new Date().getFullYear()} Kyle-Anthony Hay · Brooklyn, NY</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
