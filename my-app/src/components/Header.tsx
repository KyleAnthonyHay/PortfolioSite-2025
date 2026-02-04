'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Header = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <TooltipProvider>
      <header className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
        <nav className="bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg rounded-full px-6 py-3 flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/" className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image src="/profile.jpg" alt="Kyle-Anthony Hay" width={32} height={32} className="object-cover" />
                </div>
                <span className="hidden sm:inline text-gray-800 font-medium">Kyle-Anthony Hay</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Home</p>
            </TooltipContent>
          </Tooltip>
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/" className="text-gray-700 hover:text-gray-900">
                  <HomeIcon />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Home</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/projects" className="text-gray-700 hover:text-gray-900">
                  <FolderIcon />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Projects</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <a href="https://medium.com/@kyleanthonyhay" target="_blank" rel="noopener noreferrer" className="text-gray-700 hover:text-gray-900">
                  <PenIcon />
                </a>
              </TooltipTrigger>
              <TooltipContent>
                <p>Blog</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/contact" className="text-gray-700 hover:text-gray-900">
                  <EnvelopeIcon />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Contact</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </nav>
      </header>
    </TooltipProvider>
  );
};

// Icon components
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 19l7-7 3 3-7 7-3-3z" />
    <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
    <path d="M2 2l7.586 7.586" />
    <circle cx="11" cy="11" r="2" />
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

export default Header; 