'use client';

import { useState } from 'react';
import Link from 'next/link';

const TopHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-gray-50 border-b border-gray-200 relative">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-gray-900 font-semibold text-lg flex items-center gap-2">
          Kyle-Anthony
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Home
          </Link>
          <Link href="/projects" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Projects
          </Link>
          <Link href="/#about" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            About
          </Link>
          <a 
            href="https://medium.com/@kyleanthonyhay" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            Blog
          </a>
          <a 
            href="https://github.com/kyleanthonyhay" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            GitHub
          </a>
          <Link href="/chat" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Chat
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/Kyle-Anthony_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            Resume
          </a>
          <Link
            href="/contact"
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors"
          >
            Contact
          </Link>
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <CloseIcon /> : <HamburgerIcon />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gray-50 border-b border-gray-200 shadow-lg z-50">
          <div className="flex flex-col px-6 py-4 gap-4">
            <Link href="/" onClick={closeMenu} className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2">
              Home
            </Link>
            <Link href="/projects" onClick={closeMenu} className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2">
              Projects
            </Link>
            <Link href="/#about" onClick={closeMenu} className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2">
              About
            </Link>
            <a 
              href="https://medium.com/@kyleanthonyhay" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
            >
              Blog
            </a>
            <a 
              href="https://github.com/kyleanthonyhay" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2"
            >
              GitHub
            </a>
            <Link href="/chat" onClick={closeMenu} className="text-gray-600 hover:text-gray-900 text-sm font-medium py-2">
              Chat
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
              <a
                href="/Kyle-Anthony_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-center"
              >
                Resume
              </a>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors text-center"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const HamburgerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default TopHeader;
