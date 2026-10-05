'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useIntro } from './IntroContext';

import { INITIALS, WORDMARK, wordmarkClass } from './Wordmark';
const SEEN_KEY = 'kah-intro-seen';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);

/**
 * Opening sequence. "KA" appears large and slightly slanted in the middle of
 * the page, the rest of the name types in between the initials, and the whole
 * word glides up and shrinks until it sits exactly on the nav wordmark, which
 * takes over on the same frame. Shown once per session; `?intro=1` replays it.
 */
export default function Intro() {
  const { setPhase } = useIntro();
  const [mounted, setMounted] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const force = new URLSearchParams(window.location.search).has('intro');
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === '1';
    } catch {}
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ((seen && !force) || reduced) {
      setPhase('done');
      setMounted(false);
      return;
    }
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {}

    const target = document.getElementById('wordmark');
    const word = wordRef.current;
    const overlay = overlayRef.current;
    if (!target || !word || !overlay) {
      setPhase('done');
      setMounted(false);
      return;
    }

    window.scrollTo(0, 0);
    document.documentElement.style.overflow = 'hidden';

    // Natural width of every character at nav size, measured once at full width.
    const chars = charRefs.current.filter(Boolean) as HTMLSpanElement[];
    const widths = chars.map((c) => c.getBoundingClientRect().width);
    const height = word.getBoundingClientRect().height;
    const rect = target.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const initialsWidth = widths.reduce((sum, w, i) => sum + (INITIALS.has(i) ? w : 0), 0);
    const startScale = Math.min((vw * (vw < 640 ? 0.42 : 0.24)) / initialsWidth, (vh * 0.34) / height);

    const typed = [...Array(WORDMARK.length).keys()].filter((i) => !INITIALS.has(i));
    const T = { fadeIn: 520, typeStart: 540, perChar: 40, charDur: 120, moveStart: 900, moveEnd: 1680, reveal: 1420, done: 1680, fade: 2100 };

    let frame = 0;
    let revealed = false;
    let done = false;
    const start = performance.now();

    const tick = (now: number) => {
      const ms = now - start;

      let width = 0;
      chars.forEach((el, i) => {
        let k = 1;
        if (!INITIALS.has(i)) {
          const order = typed.indexOf(i);
          k = easeOut(clamp((ms - T.typeStart - order * T.perChar) / T.charDur));
        }
        el.style.maxWidth = `${widths[i] * k}px`;
        el.style.opacity = String(k);
        width += widths[i] * k;
      });

      const m = easeInOut(clamp((ms - T.moveStart) / (T.moveEnd - T.moveStart)));
      // The word shrinks as it grows so it never runs off the screen while typing.
      const fit = (vw * (vw < 640 ? 0.86 : 0.7)) / Math.max(width, 1);
      const scale = Math.min(startScale, fit) + (1 - Math.min(startScale, fit)) * m;
      const cx = vw / 2 - (width * scale) / 2;
      const cy = vh / 2 - (height * scale) / 2;
      const x = cx + (rect.left - cx) * m;
      const y = cy + (rect.top - cy) * m;
      const appear = easeOut(clamp(ms / T.fadeIn));
      const skew = -9 * (1 - easeOut(clamp(ms / 1300)));

      word.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale}) skewX(${skew}deg)`;
      word.style.opacity = String(appear);
      word.style.filter = `blur(${(1 - appear) * 10}px)`;

      if (!revealed && ms >= T.reveal) {
        revealed = true;
        setPhase('reveal');
        overlay.style.transition = 'background-color 520ms cubic-bezier(0.16,1,0.3,1)';
        overlay.style.backgroundColor = 'rgba(243,239,232,0)';
      }
      if (!done && ms >= T.done) {
        done = true;
        setPhase('done');
        word.style.visibility = 'hidden';
        document.documentElement.style.overflow = '';
      }
      if (ms < T.fade) frame = requestAnimationFrame(tick);
      else setMounted(false);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      document.documentElement.style.overflow = '';
    };
  }, [setPhase]);

  useEffect(() => {
    // Safety net: never leave the page covered if something above throws.
    const id = setTimeout(() => {
      setPhase('done');
      setMounted(false);
    }, 4000);
    return () => clearTimeout(id);
  }, [setPhase]);

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="fixed inset-0 z-[100] bg-paper"
      style={{ pointerEvents: 'none' }}
    >
      <div
        ref={wordRef}
        className={`absolute left-0 top-0 origin-top-left will-change-transform ${wordmarkClass}`}
        style={{ opacity: 0 }}
      >
        {WORDMARK.split('').map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              charRefs.current[i] = el;
            }}
            className="inline-block overflow-hidden align-top"
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </div>
    </div>
  );
}
