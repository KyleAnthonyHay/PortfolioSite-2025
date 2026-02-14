'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';

const About = () => {
  const { ref, isInView } = useInView({ threshold: 0.1 });

  return (
    <section id="about" className="pt-24 pb-32 bg-none" ref={ref}
      
      style={{
        background: "linear-gradient(to bottom, white 0px, #F5F5F5 70px, #F5F5F5 100%)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        <div className="max-w-[720px] mx-auto">
          <h2 className={`text-[32px] font-medium mb-6 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
            I&apos;m a Software Developer & Entrepreneur crafting clean, user-focused experiences.
          </h2>
          
          <div className={`space-y-6 text-[#666666] text-[20px] leading-[1.6] mb-12 ${isInView ? 'animate-fade-in-up animation-delay-100' : 'opacity-0'}`}>
            <p>
            Hi, my name is Kyle-Anthony. I'm based in New York, and I'm an AI Engineer at <a href="https://www.cognizant.com/us/en" target="_blank" rel="noopener noreferrer" className="font-bold">Cognizant</a>. I’ve been building agentic solutions for enterpise companies and hacking away at personal projects whenever I can.
            </p>
            <p>
            I've also have a startup called <a href="https://annointedproductions.com" target="_blank" rel="noopener noreferrer" className="font-bold">Annointed Productions</a>, where I create media content and collaborate with individuals and businesses to meet their needs.
            </p>
          </div>

          <div className={`rounded-2xl overflow-hidden aspect-[16/10] relative ${isInView ? 'animate-scale-in animation-delay-200' : 'opacity-0'}`}>
            <Image
              src="/profile-3.jpg"
              alt="Kyle-Anthony Hay"
              fill
              className="object-cover object-center"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About; 