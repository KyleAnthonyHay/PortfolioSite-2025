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
    // Lenis would otherwise carry the previous page's scroll position over.
    if (!window.location.hash) window.scrollTo(0, 0);
    if (pathname?.startsWith('/chat')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Phones and tablets keep native momentum scrolling; Lenis only adds lag
    // there and fights the rubber-band. In-page anchors glide via CSS instead.
    // An iPad with a trackpad or Magic Keyboard reports a fine primary
    // pointer and a desktop user agent, so any touch input counts too.
    const touch = window.matchMedia('(any-pointer: coarse)').matches || navigator.maxTouchPoints > 1;
    if (touch) return;

    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4) });
    if (!window.location.hash) lenis.scrollTo(0, { immediate: true });
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
