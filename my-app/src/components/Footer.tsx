'use client';

import Link from 'next/link';
import { FaLinkedin, FaInstagram, FaTwitter, FaEnvelope, FaMedium } from 'react-icons/fa';

const links = [
  { href: 'mailto:haykyle917@gmail.com', icon: FaEnvelope, label: 'Email', detail: 'haykyle917@gmail.com' },
  { href: 'https://www.linkedin.com/in/kyle-anthonyhay/', icon: FaLinkedin, label: 'LinkedIn', detail: 'Professional background', external: true },
  { href: 'https://www.instagram.com/kyleanthonyhay/', icon: FaInstagram, label: 'Instagram', detail: 'Behind the scenes', external: true },
  { href: 'https://x.com/KyleAnthonyHay', icon: FaTwitter, label: 'X / Twitter', detail: 'Developer journey', external: true },
  { href: 'https://medium.com/@kyleanthonyhay', icon: FaMedium, label: 'Medium', detail: 'Thoughts & tutorials', external: true },
];

const Footer = () => {
  return (
    <footer className="py-24 pb-32">
      <div className="max-w-[680px] mx-auto px-6 md:px-10">
        <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-8">Connect</p>
        <div className="divide-y divide-zinc-200/60">
          {links.map((link) => {
            const Icon = link.icon;
            const inner = (
              <div className="group flex items-center justify-between py-5 transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 group-hover:bg-zinc-200 rounded-xl flex items-center justify-center transition-all duration-200">
                    <Icon className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-zinc-900 text-sm font-medium">{link.label}</span>
                </div>
                <span className="text-zinc-400 text-sm hidden sm:block">{link.detail}</span>
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
    </footer>
  );
};

export default Footer;
