'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { IconSlider } from '@/components/IconSlider';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const Hero = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openResume = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.title = 'Kyle-Anthony Hay | Resume';
      const style = win.document.createElement('style');
      style.innerHTML = `html, body { margin:0; padding:0; overflow:hidden; height:100%; width:100%; } embed { position:absolute; top:0; left:0; width:100%; height:100%; }`;
      win.document.head.appendChild(style);
      const embed = win.document.createElement('embed');
      embed.src = '/Kyle-Anthony_Resume.pdf';
      embed.type = 'application/pdf';
      win.document.body.appendChild(embed);
    }
  };

  const techIcons = [
    'c++.svg', 'django.svg', 'figma.svg', 'firebase.svg', 'flutter.svg',
    'mongodb.svg', 'python.svg', 'reactjs.svg', 'swift.svg', 'tailwindcss.svg', 'typescript.svg',
    'anthropic.png', 'aws.png', 'chromadb.png', 'docker.png', 'openai.png', 'supabase.png'
  ];

  return (
    <section className="min-h-[100dvh] flex items-center relative">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center py-24 lg:py-0">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-200/60 ring-offset-2 ring-offset-[#f9fafb]">
                <Image
                  src="/profile.jpg"
                  alt="Kyle-Anthony Hay"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <p className="text-zinc-900 text-sm font-medium">Kyle-Anthony Hay</p>
                <p className="text-zinc-400 text-xs">AI Engineer & Entrepreneur</p>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.1 }}
              className="text-4xl md:text-6xl tracking-tighter leading-none text-zinc-900 mb-6"
            >
              Building intelligent
              <br />
              <span className="text-zinc-400">software that ships.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.2 }}
              className="text-base text-zinc-500 leading-relaxed max-w-[50ch] mb-10"
            >
              Software developer crafting AI-powered products and modern web experiences.
              Currently engineering solutions at Cognizant, always building on the side.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.3 }}
              className="flex flex-wrap gap-3 mb-16"
            >
              <button
                onClick={openResume}
                className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl h-12 px-7 text-sm font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                View Resume
              </button>
              <Link href="/chat">
                <span className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-300 hover:bg-white rounded-xl h-12 px-7 text-sm font-medium text-zinc-600 hover:text-zinc-900 active:scale-[0.98] transition-all duration-200">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Talk to my AI Agent
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">Technologies</p>
              <IconSlider icons={techIcons} gradientColor="#f9fafb" duration={60} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={mounted ? { opacity: 1, scale: 1, x: 0 } : {}}
            transition={{ ...spring, delay: 0.2 }}
            className="order-1 lg:order-2 hidden lg:block"
          >
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[560px] rounded-[2rem] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)]">
              <Image
                src="/profile-3.jpg"
                alt="Kyle-Anthony Hay"
                fill
                className="object-cover object-center"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
