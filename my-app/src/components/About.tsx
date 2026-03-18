'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const About = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="about" className="py-32 md:py-40" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ ...spring }}
            className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]"
          >
            <Image
              src="/profile-3.jpg"
              alt="Kyle-Anthony Hay"
              fill
              className="object-cover object-center"
              priority
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
                <a href="https://www.cognizant.com/us/en" target="_blank" rel="noopener noreferrer" className="text-zinc-900 font-medium hover:text-zinc-600 transition-colors">
                  Cognizant
                </a>
                , building agentic solutions for enterprise companies and hacking away at personal projects whenever I can.
              </p>
              <p>
                I also run{' '}
                <a href="https://annointedproductions.com" target="_blank" rel="noopener noreferrer" className="text-zinc-900 font-medium hover:text-zinc-600 transition-colors">
                  Annointed Productions
                </a>
                , where I create media content and collaborate with individuals and businesses to meet their needs.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.35 }}
              className="mt-10 flex gap-8"
            >
              <div>
                <p className="text-2xl font-semibold text-zinc-900 tracking-tight">2+</p>
                <p className="text-xs text-zinc-400 mt-1">Years Experience</p>
              </div>
              <div className="w-px bg-zinc-200" />
              <div>
                <p className="text-2xl font-semibold text-zinc-900 tracking-tight">6+</p>
                <p className="text-xs text-zinc-400 mt-1">Projects Shipped</p>
              </div>
              <div className="w-px bg-zinc-200" />
              <div>
                <p className="text-2xl font-semibold text-zinc-900 tracking-tight">B.S.</p>
                <p className="text-xs text-zinc-400 mt-1">Computer Science</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
