'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';

/**
 * Weighted scrolling for the long pages. The chat page manages its own
 * scroller, so Lenis stays off there; reduced-motion visitors keep native
 * scrolling everywhere.
 */
export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/chat')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    // In-page anchors (#products, #about) glide instead of jumping.
    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement).closest('a');
      const href = anchor?.getAttribute('href');
      if (!href) return;
      const hash = href.startsWith('#') ? href : href.startsWith('/#') && window.location.pathname === '/' ? href.slice(1) : null;
      if (!hash) return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -72 });
      history.replaceState(null, '', hash);
    };
    document.addEventListener('click', onClick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('click', onClick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [pathname]);

  return null;
}
