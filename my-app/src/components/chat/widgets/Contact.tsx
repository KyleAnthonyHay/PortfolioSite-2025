'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, FileText, Mail, MapPin, Send } from 'lucide-react';
import { FaGithub, FaLinkedin, FaMedium, FaXTwitter, FaInstagram } from 'react-icons/fa6';
import type { ContactLink, Widget } from '@/lib/chat-events';

const icons: Record<ContactLink['kind'], React.ComponentType<{ className?: string }>> = {
  email: Mail,
  linkedin: FaLinkedin,
  github: FaGithub,
  medium: FaMedium,
  x: FaXTwitter,
  instagram: FaInstagram,
  resume: FileText,
  contact: Send,
};

export function ContactWidget({ widget }: { widget: Extract<Widget, { kind: 'contact' }> }) {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-zinc-100">
          <Image src="/profile.jpg" alt={widget.name} width={48} height={48} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{widget.name}</p>
          <p className="text-xs text-zinc-500">{widget.headline}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400">
            <MapPin className="h-3 w-3" /> {widget.location}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {widget.availability.map((item, index) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-600"
          >
            {index === 0 && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            {item.replace(/^Open to /, 'Open to ')}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {widget.links.map((link) => {
          const Icon = icons[link.kind];
          const external = link.href.startsWith('http');
          const className =
            'group flex items-center gap-3 rounded-xl border border-zinc-100 px-3 py-2.5 transition-all hover:border-zinc-300 hover:bg-zinc-50 active:scale-[0.99]';
          const inner = (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover:bg-zinc-900 group-hover:text-white">
                <Icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-zinc-900">{link.label}</span>
                {link.detail && <span className="block truncate text-xs text-zinc-400">{link.detail}</span>}
              </span>
              {external && <ArrowUpRight className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500" />}
            </>
          );
          return external || link.href.startsWith('mailto:') || link.href.endsWith('.pdf') ? (
            <a
              key={link.kind}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={className}
            >
              {inner}
            </a>
          ) : (
            <Link key={link.kind} href={link.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
