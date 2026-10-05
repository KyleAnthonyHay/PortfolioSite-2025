'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useIntro } from '@/components/home/IntroContext';
import AskAgentButton from '@/components/home/AskAgentButton';

const ease = [0.16, 1, 0.3, 1] as const;

function Line({ children, delay, show, className = '' }: { children: React.ReactNode; delay: number; show: boolean; className?: string }) {
  return (
    <span className="line-mask">
      <motion.span
        className={`block ${className}`}
        initial={{ y: '110%' }}
        animate={show ? { y: '0%' } : { y: '110%' }}
        transition={{ duration: 1, ease, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

const Hero = () => {
  const { phase } = useIntro();
  const show = phase !== 'intro';

  const soft = (delay: number) => ({
    initial: { opacity: 0, y: 12, filter: 'blur(6px)' },
    animate: show ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 12, filter: 'blur(6px)' },
    transition: { duration: 0.9, ease, delay },
  });

  return (
    <section className="relative">
      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1400px] grid-cols-1 items-end gap-12 px-6 pb-14 pt-10 md:px-10 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-6">
        <div className="lg:col-span-7 lg:pb-4">
          <motion.p {...soft(0.05)} className="mb-8 flex items-center gap-2.5 text-[13px] text-zinc-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-olive/50 [animation-duration:2.4s]" />
              <span className="relative h-2 w-2 rounded-full bg-olive" />
            </span>
            AI Engineer at Cognizant · New York
          </motion.p>

          <h1 className="font-display text-[clamp(2.75rem,5.7vw,6.25rem)] lg:whitespace-nowrap font-medium leading-[0.94] tracking-[-0.048em] text-ink">
            <Line show={show} delay={0}>I build AI products</Line>
            <Line show={show} delay={0.08} className="text-zinc-400">people actually use.</Line>
          </h1>

          <motion.p {...soft(0.25)} className="mt-8 max-w-[52ch] text-[17px] leading-[1.6] text-zinc-600">
            I ship agentic software for companies and for myself: contract intelligence, review analytics, a
            production assistant for church tech teams, and an iOS app with paying subscribers.
          </motion.p>

          <motion.div {...soft(0.35)} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <AskAgentButton />
            <Link href="/#products" className="group inline-flex items-center gap-2 text-[14px] text-zinc-600 transition-colors hover:text-ink">
              See what I&apos;ve shipped
              <span className="inline-block transition-transform duration-300 group-hover:translate-y-0.5">↓</span>
            </Link>
          </motion.div>
        </div>

        <div className="lg:col-span-5">
          <motion.figure
            initial={{ clipPath: 'inset(100% 0% 0% 0% round 28px)' }}
            animate={show ? { clipPath: 'inset(0% 0% 0% 0% round 28px)' } : { clipPath: 'inset(100% 0% 0% 0% round 28px)' }}
            transition={{ duration: 1.2, ease, delay: 0.1 }}
            className="relative aspect-[4/5] w-full overflow-hidden rounded-[28px] bg-zinc-200 lg:aspect-[4/5.4]"
          >
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.15 }}
              animate={show ? { scale: 1 } : { scale: 1.15 }}
              transition={{ duration: 1.8, ease, delay: 0.1 }}
            >
              <Image
                src="/profile-3.jpg"
                alt="Kyle-Anthony Hay sitting on a stone bench in New York"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-[38%_40%] scale-[1.06]"
              />
            </motion.div>
          </motion.figure>
          <motion.figcaption {...soft(0.5)} className="mt-3 flex justify-between font-mono text-[11px] text-zinc-400">
            <span>Kyle-Anthony Hay</span>
            <span>Brooklyn, NY</span>
          </motion.figcaption>
        </div>
      </div>
    </section>
  );
};

export default Hero;
