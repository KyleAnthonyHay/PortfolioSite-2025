'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const About = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="about" className="py-20 md:py-28" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring }}
            className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_24px_48px_-20px_rgba(0,0,0,0.25)]"
          >
            <Image
              src="/profile.jpg"
              alt="Kyle-Anthony Hay"
              fill
              className="object-cover object-[50%_30%]"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.1 }}
              className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4"
            >
              About
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.15 }}
              className="text-3xl md:text-4xl tracking-tighter leading-none text-zinc-900 mb-8"
            >
              Developer & Entrepreneur
              <br />
              <span className="text-zinc-400">crafting clean experiences.</span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.25 }}
              className="space-y-5 text-base text-zinc-500 leading-relaxed max-w-[50ch]"
            >
              <p>
                Based in New York, I work as an AI Engineer at{' '}
                <a href="https://www.cognizant.com/us/en" target="_blank" rel="noopener noreferrer" className="text-zinc-900 font-medium underline decoration-zinc-300 underline-offset-4 hover:text-clay hover:decoration-clay transition-colors">
                  Cognizant
                </a>
                , building agentic solutions for enterprise companies and hacking away at personal projects whenever I can.
              </p>
              <p>
                I also run{' '}
                <a href="https://selahnote.app/" target="_blank" rel="noopener noreferrer" className="text-zinc-900 font-medium underline decoration-zinc-300 underline-offset-4 hover:text-clay hover:decoration-clay transition-colors">
                  SelahNote
                </a>
                , an AI notetaker for sermons that has grown to over 400 users and 40 paying subscribers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.35 }}
              className="mt-10 flex gap-8"
            >
              {[
                { value: '6', label: 'Products live' },
                { value: '400+', label: 'SelahNote users' },
                { value: 'B.S.', label: 'Computer Science' },
              ].map((stat, i) => (
                <div key={stat.label} className="flex gap-8">
                  {i > 0 && <div className="w-px bg-zinc-300/70" />}
                  <div>
                    <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{stat.value}</p>
                    <p className="text-xs text-zinc-400 mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
