import Link from 'next/link';

const TopHeader = () => {
  return (
    <header className="bg-gray-50 border-b border-gray-200">
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

        <div className="flex items-center gap-3">
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
      </nav>
    </header>
  );
};

export default TopHeader;
