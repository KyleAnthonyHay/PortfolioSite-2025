'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { IconSlider } from '@/components/IconSlider';
import { IconSliderGroup } from '@/components/IconSliderGroup';


const techIconsRow1 = [
  'c++.svg', 'django.svg', 'figma.svg', 'firebase.svg', 'flutter.svg',
  'mongodb.svg', 'python.svg', 'reactjs.svg', 'swift.svg'
];

const techIconsRow2 = [
  'tailwindcss.svg', 'typescript.svg', 'anthropic.png', 'aws.png',
  'chromadb.png', 'docker.png', 'openai.png', 'supabase.png'
];

const experience = [
  { role: 'AI Engineer', company: 'Cognizant', period: '2026 - Present' },
  { role: 'Software Engineering Intern', company: 'The Difference', period: '2023' },
];

const ease = [0.16, 1, 0.3, 1] as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-10%' },
  transition: { duration: 0.9, ease, delay },
});

const WebResume = () => {
  return (
    <section id="experience" className="border-t border-zinc-300/70 py-24 md:py-32">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 md:px-10 lg:grid-cols-12 lg:gap-10">
        <motion.div {...rise()} className="lg:col-span-3">
          <h2 className="font-display text-[clamp(1.9rem,3.2vw,2.75rem)] font-medium leading-none tracking-[-0.04em] text-ink">
            Experience
          </h2>
          <div className="mt-6 flex gap-2">
            {[
              { href: 'https://github.com/KyleAnthonyHay', icon: 'github', label: 'GitHub' },
              { href: 'https://linkedin.com/in/kyle-anthonyhay', icon: 'linkedin', label: 'LinkedIn' },
            ].map((social) => (
              <Link
                key={social.icon}
                href={social.href}
                target="_blank"
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300/80 transition-colors hover:border-ink"
              >
                <SocialIcon type={social.icon} />
              </Link>
            ))}
            <a
              href="/Kyle-Anthony_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-full border border-zinc-300/80 px-4 text-[13px] text-zinc-700 transition-colors hover:border-ink hover:text-ink"
            >
              Résumé PDF
            </a>
          </div>
        </motion.div>

        <div className="min-w-0 lg:col-span-9">
          <motion.div {...rise(0.05)}>
            <p className="label mb-3">Work</p>
            <div className="border-t border-zinc-300/70">
              {experience.map((exp) => (
                <div key={exp.role} className="grid grid-cols-12 items-baseline gap-4 border-b border-zinc-300/70 py-5">
                  <p className="col-span-12 font-display text-[clamp(1.25rem,2vw,1.6rem)] tracking-[-0.03em] text-ink md:col-span-6">{exp.role}</p>
                  <p className="col-span-8 text-[14px] text-zinc-500 md:col-span-4">{exp.company}</p>
                  <p className="col-span-4 text-right font-mono text-[11px] text-zinc-400 md:col-span-2">{exp.period}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div {...rise(0.1)} className="mt-12">
            <p className="label mb-3">Education</p>
            <div className="grid grid-cols-12 items-baseline gap-4 border-y border-zinc-300/70 py-5">
              <p className="col-span-12 font-display text-[clamp(1.25rem,2vw,1.6rem)] tracking-[-0.03em] text-ink md:col-span-6">B.S. Computer Science</p>
              <p className="col-span-8 text-[14px] text-zinc-500 md:col-span-4">CUNY Hunter College</p>
              <p className="col-span-4 text-right font-mono text-[11px] text-zinc-400 md:col-span-2">2024</p>
            </div>
          </motion.div>

          <motion.div {...rise(0.15)} className="mt-12">
            <p className="label mb-5">Tools I reach for</p>
            <IconSliderGroup className="space-y-4" hoverSpeed={0.5}>
              <IconSlider icons={techIconsRow1} duration={30} gradientColor="#f3efe8" />
              <IconSlider icons={[...techIconsRow2].reverse()} reverse duration={30} gradientColor="#f3efe8" />
            </IconSliderGroup>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const SocialIcon = ({ type }: { type: string }) => {
  if (type === 'github') return (
    <svg className="w-4 h-4 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
  if (type === 'linkedin') return (
    <svg className="w-4 h-4 text-zinc-700" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  return (
    <svg className="w-4 h-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
};

export default WebResume;
