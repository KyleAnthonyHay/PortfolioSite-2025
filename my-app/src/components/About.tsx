'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

const ease = [0.16, 1, 0.3, 1] as const;
const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 24, filter: 'blur(6px)' },
  whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
  viewport: { once: true, margin: '-12%' },
  transition: { duration: 1, ease, delay },
});

const facts = [
  { value: '350+', label: 'SelahNote users' },
  { value: '40', label: 'paying subscribers' },
  { value: '3', label: 'products live today' },
  { value: 'B.S.', label: 'Computer Science, Hunter' },
];

const About = () => {
  return (
    <section id="about" className="border-t border-zinc-300/70 py-24 md:py-36">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-14 px-6 md:px-10 lg:grid-cols-12 lg:gap-10">
        <motion.div {...rise()} className="lg:col-span-3">
          <div className="relative aspect-square w-40 overflow-hidden rounded-[22px] bg-zinc-200 md:w-48">
            <Image src="/profile.jpg" alt="Portrait of Kyle-Anthony Hay" fill sizes="192px" className="object-cover" />
          </div>
          <p className="label mt-4">About</p>
        </motion.div>

        <div className="lg:col-span-9">
          <motion.p
            {...rise(0.05)}
            className="font-display text-[clamp(1.6rem,2.9vw,2.6rem)] leading-[1.18] tracking-[-0.03em] text-ink"
          >
            I&apos;m an AI engineer at{' '}
            <a href="https://www.cognizant.com/us/en" target="_blank" rel="noopener noreferrer" className="text-clay transition-colors hover:text-ink">
              Cognizant
            </a>
            , building agentic systems for enterprise teams. Outside of work I run{' '}
            <a href="https://selahnote.app/" target="_blank" rel="noopener noreferrer" className="text-clay transition-colors hover:text-ink">
              SelahNote
            </a>
            , an AI notetaker for sermons, and I build tools for the people around me.{' '}
            <span className="text-zinc-400">I care about the last ten percent: the loading state, the empty state, the answer that cites its source.</span>
          </motion.p>

          <div className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-zinc-300/70 pt-8 md:grid-cols-4">
            {facts.map((fact, i) => (
              <motion.div key={fact.label} {...rise(0.1 + i * 0.06)}>
                <p className="font-display text-[clamp(2rem,3.4vw,3rem)] font-medium leading-none tracking-[-0.045em] text-ink">{fact.value}</p>
                <p className="mt-2 text-[13px] text-zinc-500">{fact.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
