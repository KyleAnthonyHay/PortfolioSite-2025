'use client';

import Image from 'next/image';
import Link from 'next/link';
import { IconSlider } from '@/components/IconSlider';

const techIconsRow1 = [
  'c++.svg', 'django.svg', 'figma.svg', 'firebase.svg', 'flutter.svg',
  'mongodb.svg', 'python.svg', 'reactjs.svg', 'swift.svg'
];

const techIconsRow2 = [
  'tailwindcss.svg', 'typescript.svg', 'anthropic.png', 'aws.png', 
  'chromadb.png', 'docker.png', 'openai.png', 'supabase.png'
];

const experience = [
  { role: 'AI Engineer', company: 'Cognizant', year: '2026' },
  { role: 'Software Engineering Intern', company: 'The Difference', year: '2023' },
];

const WebResume = () => {
  return (
    <section id="resume" className="py-24 bg-[#F5F5F5]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Card */}
          <div className="lg:w-[320px] flex-shrink-0">
            <div className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-3xl p-6 text-center border border-gray-300">
              <div className="w-full aspect-[4/5] relative rounded-2xl overflow-hidden mb-4">
                <Image
                  src="/profile-2.jpg"
                  alt="Kyle-Anthony Hay"
                  fill
                  className="object-cover object-top"
                  priority
                />
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-green-400 text-sm">working at cognizant</span>
              </div>
              
              <h3 className="text-gray-900 text-2xl font-semibold mb-1">Kyle-Anthony Hay</h3>
              <p className="text-gray-600 text-sm mb-5">
                AI Engineer & Software Developer<br />Based in Brooklyn, NY
              </p>
              
              <div className="flex justify-center gap-3 mb-5">
                <Link 
                  href="https://github.com/KyleAnthonyHay" 
                  target="_blank"
                  className="w-10 h-10 bg-gray-300/50 hover:bg-gray-400/50 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </Link>
                <Link 
                  href="https://linkedin.com/in/kyle-anthonyhay" 
                  target="_blank"
                  className="w-10 h-10 bg-gray-300/50 hover:bg-gray-400/50 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </Link>
                <Link 
                  href="mailto:kyleanthonyhay@gmail.com"
                  className="w-10 h-10 bg-gray-300/50 hover:bg-gray-400/50 rounded-full flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </Link>
              </div>
              
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-medium transition-colors w-full justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contact Me
              </Link>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[#444] text-lg mb-8 leading-relaxed">
              I&apos;m Kyle-Anthony, an AI Engineer based in New York. I build intelligent software 
              solutions that blend modern AI capabilities with solid engineering practices. Currently 
              developing solutions at Cognizant and always shipping side projects.
            </p>

            {/* Experience */}
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Experience</h4>
              <div className="space-y-0">
                {experience.map((exp, index) => (
                  <div 
                    key={index} 
                    className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_120px_60px] items-center gap-4 py-4 border-b border-gray-200 last:border-b-0 min-h-[57px]"
                  >
                    <span className="font-medium text-gray-900">{exp.role}</span>
                    <span className="text-gray-500 text-sm hidden sm:block text-center">{exp.company}</span>
                    <span className="text-gray-400 text-sm text-right">{exp.year}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">B.S. Computer Science</span>
                  <span className="text-gray-500 text-sm ml-2">CUNY Hunter College</span>
                </div>
                <span className="text-gray-400 text-sm">2024</span>
              </div>
            </div>

            {/* Tech Icons Slider */}
            <div className="mt-8 pt-6 border-t border-gray-200 space-y-6">
              <IconSlider icons={techIconsRow1} duration={25} />
              <IconSlider icons={[...techIconsRow2].reverse()} reverse duration={25} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebResume;
