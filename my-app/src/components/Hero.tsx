'use client';

import { Button } from '@/components/ui/button';
import Profile from './Profile';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { IconSlider } from '@/components/IconSlider';

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
    <section className="pt-32 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="max-w-[600px] mx-auto">
          <div className={mounted ? 'animate-fade-in-up' : 'opacity-0'}>
            <Profile />
          </div>
          <div className="space-y-6">
            <h1 className={`text-[32px] leading-[1.1] font-normal tracking-[-0.02em] ${mounted ? 'animate-fade-in-up animation-delay-100' : 'opacity-0'}`}>
            Solving problems <br /> using AI and modern frameworks
            </h1>
            <p className={`text-[20px] leading-[1.6] text-[#666666] ${mounted ? 'animate-fade-in-up animation-delay-200' : 'opacity-0'}`}>
            I'm a software developer who is building, learning and integrating constantly. If you'd like to connect, my info is below.
            </p>
            <div className={`flex gap-3 pt-2 ${mounted ? 'animate-fade-in-up animation-delay-300' : 'opacity-0'}`}>
              <Button
                onClick={() => openResume()}
                className="bg-black text-white hover:bg-black/90 rounded-xl h-12 px-6 text-[15px] transition-transform transform hover:scale-105 duration-200 ease-in-out"
              >
                Resume →
              </Button>
              <Link href="/chat">
                <Button
                  variant="outline"
                  className="border-[#E5E5E5] hover:bg-[#F5F5F5] rounded-xl h-12 px-6 text-[15px] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Talk to my AI Agent
                </Button>
              </Link>
            </div>
            
            <div className={`mt-16 ${mounted ? 'animate-fade-in animation-delay-400' : 'opacity-0'}`}>
              <IconSlider icons={techIcons} gradientColor="#FFFFFF" duration={60} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 