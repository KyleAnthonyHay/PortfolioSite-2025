import type { Metadata } from 'next';

const PDF = '/Kyle-Anthony_Resume.pdf';

export const metadata: Metadata = {
  title: 'Kyle-Anthony Hay | Resume',
  description: 'Resume for Kyle-Anthony Hay, AI Engineer and Developer.',
};

/**
 * The résumé shown in the browser's own PDF viewer, filling the tab.
 *
 * Linking straight at the .pdf hands the file to the browser, which downloads
 * it outright for anyone who has Chrome's "Download PDFs instead of
 * automatically opening them" setting on. Embedding it asks for the viewer
 * instead of a navigation, so the document renders in the page.
 *
 * <object> rather than <iframe> for the fallback: when a platform has no PDF
 * viewer to offer — mobile Safari, mostly — it renders its children instead of
 * an empty white rectangle.
 */
export default function ResumePage() {
  return (
    <object data={PDF} type="application/pdf" className="fixed inset-0 w-full h-full border-0">
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#f9fafb]">
        <p className="text-base text-zinc-500 max-w-[40ch]">
          This browser can&apos;t display PDFs inline.
        </p>
        <a
          href={PDF}
          className="inline-flex items-center bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl h-12 px-7 text-sm font-medium active:scale-[0.98] transition-all duration-200"
        >
          Open the resume
        </a>
      </div>
    </object>
  );
}
