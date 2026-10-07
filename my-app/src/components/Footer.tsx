'use client';

import { profile } from '@/lib/profile';

import Link from 'next/link';
import { FaLinkedin, FaInstagram, FaTwitter, FaEnvelope, FaMedium } from 'react-icons/fa';

const links = [
  { href: `mailto:${profile.email}?cc=${encodeURIComponent(profile.emailCc)}`, icon: FaEnvelope, label: 'Email', detail: profile.email },
  { href: 'https://www.linkedin.com/in/kyle-anthonyhay/', icon: FaLinkedin, label: 'LinkedIn', detail: 'Professional background', external: true },
  { href: 'https://www.instagram.com/kyleanthonyhay/', icon: FaInstagram, label: 'Instagram', detail: 'Behind the scenes', external: true },
  { href: 'https://x.com/KyleAnthonyHay', icon: FaTwitter, label: 'X / Twitter', detail: 'Developer journey', external: true },
  { href: 'https://medium.com/@kyleanthonyhay', icon: FaMedium, label: 'Medium', detail: 'Thoughts & tutorials', external: true },
];

const Footer = () => {
  return (
    <footer id="contact" className="border-t border-zinc-200/70 pt-20 pb-28 md:pt-28">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 lg:gap-20">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">Connect</p>
          <h2 className="text-3xl md:text-4xl tracking-tighter leading-none text-zinc-900">
            Let&apos;s build
            <br />
            <span className="text-zinc-400">something useful.</span>
          </h2>
          <a
            href={`mailto:${profile.email}?cc=${encodeURIComponent(profile.emailCc)}`}
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-zinc-900 px-6 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-800 active:scale-[0.98]"
          >
            Email me
            <span aria-hidden>→</span>
          </a>
        </div>
        <div className="divide-y divide-zinc-200/70 border-y border-zinc-200/70">
          {links.map((link) => {
            const Icon = link.icon;
            const inner = (
              <div className="group flex items-center justify-between py-5 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 group-hover:bg-zinc-900 rounded-xl flex items-center justify-center transition-all duration-200">
                    <Icon className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-zinc-900 text-sm font-medium">{link.label}</span>
                </div>
                <span className="text-zinc-400 text-sm hidden sm:flex items-center gap-2">{link.detail}<span className="text-zinc-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-zinc-900">→</span></span>
              </div>
            );

            if (link.external) {
              return (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="block">
                  {inner}
                </a>
              );
            }

            return (
              <Link key={link.label} href={link.href} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 mt-20 flex items-center justify-between font-mono text-[11px] text-zinc-400">
        <span>© {new Date().getFullYear()} Kyle-Anthony Hay</span>
        <span>Brooklyn, NY</span>
      </div>
    </footer>
  );
};

export default Footer;
