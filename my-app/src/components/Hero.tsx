'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { IconSlider } from '@/components/IconSlider';
import { IconSliderGroup } from '@/components/IconSliderGroup';
import { useIntro } from '@/components/home/IntroContext';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const Hero = () => {
  // Waits for the opening loader to hand over before anything rises in.
  const { phase } = useIntro();
  const mounted = phase !== 'intro';
  const ease = [0.16, 1, 0.3, 1] as const;


  const techIcons = [
    'c++.svg', 'django.svg', 'figma.svg', 'firebase.svg', 'flutter.svg',
    'mongodb.svg', 'python.svg', 'reactjs.svg', 'swift.svg', 'tailwindcss.svg', 'typescript.svg',
    'anthropic.png', 'aws.png', 'chromadb.png', 'docker.png', 'openai.png', 'supabase.png'
  ];

  // The hero is sized to the viewport minus the sticky header, so it frames
  // exactly one screen instead of overflowing by the header's height. Its
  // bottom padding is deliberately heavier than the top: with items-center
  // that pulls the content up, trimming the dead space above the avatar while
  // still leaving a hint of the next section below the fold.
  return (
    <section className="min-h-[calc(100dvh-4.5rem)] flex items-center relative">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center pt-12 pb-20 lg:pt-8 lg:pb-28">
          <div className="order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0 }}
              className="flex items-center gap-3 mb-8"
            >
              <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-zinc-200/60 ring-offset-2 ring-offset-paper">
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

            <h1 className="text-4xl md:text-6xl tracking-tighter leading-none text-zinc-900 mb-6">
              <span className="line-mask">
                <motion.span
                  className="block"
                  initial={{ y: '105%' }}
                  animate={mounted ? { y: '0%' } : {}}
                  transition={{ duration: 0.9, ease, delay: 0.05 }}
                >
                  Building intelligent
                </motion.span>
              </span>
              <span className="line-mask">
                <motion.span
                  className="block text-zinc-400"
                  initial={{ y: '105%' }}
                  animate={mounted ? { y: '0%' } : {}}
                  transition={{ duration: 0.9, ease, delay: 0.13 }}
                >
                  software that ships.
                </motion.span>
              </span>
            </h1>

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
              className="flex flex-wrap gap-3 mb-12"
            >
              {/*
                Opens the web résumé, not the PDF — the header already covers
                the download. A plain link rather than a scripted window.open:
                the old handler opened an empty tab and wrote markup into
                about:blank, which popup blockers stop and which the browser
                replaces out from under the injected content anyway.
              */}
              <a
                href="/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl h-12 px-7 text-sm font-medium active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                View Resume
              </a>
              <Link href="/chat">
                <span className="group inline-flex items-center gap-2.5 border border-zinc-300/80 bg-white/60 hover:border-zinc-400 hover:bg-white rounded-xl h-12 px-6 text-sm font-medium text-zinc-700 hover:text-zinc-900 active:scale-[0.98] transition-all duration-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/60 [animation-duration:2s]" />
                    <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  Talk to my AI Agent
                  <span className="text-zinc-400 transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={mounted ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">Technologies</p>
              <IconSliderGroup hoverSpeed={0.5}>
                <IconSlider icons={techIcons} gradientColor="#f9fafb" duration={60} />
              </IconSliderGroup>
            </motion.div>
          </div>

          <motion.div
            initial={{ clipPath: 'inset(12% 8% 12% 8% round 2rem)', opacity: 0 }}
            animate={mounted ? { clipPath: 'inset(0% 0% 0% 0% round 2rem)', opacity: 1 } : {}}
            transition={{ duration: 1.1, ease, delay: 0.15 }}
            className="order-1 lg:order-2 hidden lg:block"
          >
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[560px] rounded-[2rem] overflow-hidden shadow-[0_24px_48px_-20px_rgba(0,0,0,0.25)]">
              <motion.div
                className="absolute inset-0"
                initial={{ scale: 1.12 }}
                animate={mounted ? { scale: 1.04 } : {}}
                transition={{ duration: 1.6, ease, delay: 0.15 }}
              >
                <Image
                  src="/profile-3.jpg"
                  alt="Kyle-Anthony Hay"
                  fill
                  className="object-cover object-[42%_50%]"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
