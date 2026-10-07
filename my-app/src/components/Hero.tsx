'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';
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
              className="mb-12"
            >
              {/*
                One primary action. The agent button is the only saturated
                colour on the page, sits first, and is the largest control, so
                the eye lands on it before anything else; the résumé is a quiet
                secondary link beside it.
              */}
              <div className="flex flex-wrap items-center gap-3">
                {/* One blue control with two ways in: type to the agent, or call it. */}
                <div className="inline-flex h-[52px] items-stretch overflow-hidden rounded-xl bg-accent-blue text-white shadow-[0_10px_28px_-8px_rgba(10,132,255,0.6)] transition-shadow duration-200 hover:shadow-[0_14px_32px_-8px_rgba(10,132,255,0.7)]">
                <Link
                  href="/chat"
                  className="group inline-flex items-center gap-2.5 pl-4 pr-5 text-[15px] font-medium hover:bg-[#0077e6] active:scale-[0.98] transition-all duration-200"
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15">
                    <Image src="/agent.png" alt="" width={26} height={26} className="h-[26px] w-[26px] object-contain" />
                    <span aria-hidden className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-accent-blue" />
                  </span>
                  Talk to my AI Agent
                  <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/chat?call=1"
                  aria-label="Call my AI Agent"
                  title="Call my AI Agent"
                  className="inline-flex items-center gap-1.5 border-l border-white/25 px-4 text-[14px] font-medium hover:bg-[#0077e6] active:scale-[0.98] transition-all duration-200"
                >
                  <Phone aria-hidden="true" className="h-4 w-4" />
                  <span className="max-sm:hidden">Call</span>
                </Link>
                </div>
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
                  className="inline-flex items-center rounded-xl h-[52px] px-5 text-sm font-medium text-zinc-600 hover:bg-white hover:text-zinc-900 border border-transparent hover:border-zinc-200 active:scale-[0.98] transition-all duration-200"
                >
                  View Resume
                </a>
              </div>
              <p className="mt-4 flex items-center gap-2 text-[13px] text-zinc-500">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Online now. Ask about any project, my experience, or whether I fit your role, and get answers with sources in seconds.
              </p>
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
