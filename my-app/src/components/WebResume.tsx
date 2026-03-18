'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useInView } from '@/hooks/useInView';
import { IconSlider } from '@/components/IconSlider';

const spring = { type: "spring" as const, stiffness: 100, damping: 20 };

const techIconsRow1 = [
  'c++.svg', 'django.svg', 'figma.svg', 'firebase.svg', 'flutter.svg',
  'mongodb.svg', 'python.svg', 'reactjs.svg', 'swift.svg'
];

const techIconsRow2 = [
  'tailwindcss.svg', 'typescript.svg', 'anthropic.png', 'aws.png',
  'chromadb.png', 'docker.png', 'openai.png', 'supabase.png'
];

const experience = [
  { role: 'AI Engineer', company: 'Cognizant', period: '2024 - Present' },
  { role: 'Software Engineering Intern', company: 'The Difference', period: '2023' },
];

const WebResume = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="resume" className="py-24 md:py-32" ref={ref}>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-12 lg:gap-20">
          {/* Left: Profile */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ ...spring }}
          >
            <div className="bg-white rounded-[2rem] p-8 border border-slate-200/50 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.04)] text-center">
              <div className="w-full aspect-[4/5] relative rounded-[1.5rem] overflow-hidden mb-6">
                <Image
                  src="/profile-2.jpg"
                  alt="Kyle-Anthony Hay"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-500 text-xs font-medium">working at cognizant</span>
              </div>

              <h3 className="text-zinc-900 text-xl font-semibold mb-1 tracking-tight">Kyle-Anthony Hay</h3>
              <p className="text-zinc-400 text-sm mb-6">
                AI Engineer & Developer
                <br />Brooklyn, NY
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {[
                  { href: 'https://github.com/KyleAnthonyHay', icon: 'github' },
                  { href: 'https://linkedin.com/in/kyle-anthonyhay', icon: 'linkedin' },
                  { href: 'mailto:kyleanthonyhay@gmail.com', icon: 'email' },
                ].map((social) => (
                  <Link
                    key={social.icon}
                    href={social.href}
                    target={social.icon !== 'email' ? '_blank' : undefined}
                    className="w-10 h-10 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center justify-center active:scale-[0.95] transition-all duration-200"
                  >
                    <SocialIcon type={social.icon} />
                  </Link>
                ))}
              </div>

              <Link
                href="/contact"
                className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-xl font-medium text-sm active:scale-[0.98] transition-all duration-200 w-full"
              >
                Get in Touch
              </Link>
            </div>
          </motion.div>

          {/* Right: Details */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.1 }}
              className="mb-12"
            >
              <h3 className="text-2xl md:text-3xl tracking-tighter leading-none text-zinc-900 mb-4">
                See my experience as
                <br />
                <span className="text-zinc-400">a software engineer.</span>
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-[50ch]">
                Based in New York, developing solutions at Cognizant that blend modern AI with solid engineering. Always shipping side projects.
              </p>
            </motion.div>

            {/* Experience */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.2 }}
              className="mb-10"
            >
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-5">Experience</p>
              <div className="divide-y divide-zinc-100">
                {experience.map((exp, index) => (
                  <div key={index} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-zinc-900 font-medium text-sm">{exp.role}</p>
                      <p className="text-zinc-400 text-sm">{exp.company}</p>
                    </div>
                    <span className="text-zinc-400 text-xs font-mono">{exp.period}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Education */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.3 }}
              className="mb-10"
            >
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-5">Education</p>
              <div className="flex items-center justify-between py-4 border-t border-zinc-100">
                <div>
                  <p className="text-zinc-900 font-medium text-sm">B.S. Computer Science</p>
                  <p className="text-zinc-400 text-sm">CUNY Hunter College</p>
                </div>
                <span className="text-zinc-400 text-xs font-mono">2024</span>
              </div>
            </motion.div>

            {/* Tech Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ ...spring, delay: 0.4 }}
            >
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-5">Tech Stack</p>
              <div className="space-y-4">
                <IconSlider icons={techIconsRow1} duration={25} gradientColor="#f9fafb" />
                <IconSlider icons={[...techIconsRow2].reverse()} reverse duration={25} gradientColor="#f9fafb" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SocialIcon = ({ type }: { type: string }) => {
  if (type === 'github') return (
    <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
  if (type === 'linkedin') return (
    <svg className="w-4 h-4 text-zinc-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
  return (
    <svg className="w-4 h-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
};

export default WebResume;
