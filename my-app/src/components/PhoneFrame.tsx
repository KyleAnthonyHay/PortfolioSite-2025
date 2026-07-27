'use client';

import Image from 'next/image';
import { ReactNode } from 'react';
import { useInView } from '@/hooks/useInView';

/**
 * Geometry of /public/frames/iphone.png, measured off the frame artwork itself.
 * Everything is expressed as a percentage of the frame image so the mockup
 * stays pixel-accurate at any size. Swapping the frame artwork means
 * re-measuring these four numbers.
 */
const FRAME = {
  src: '/frames/iphone.png',
  width: 1060,
  height: 2160,
  /** Screen cutout, as a percentage of the frame image. */
  screen: { left: 5.3396, top: 1.9722, width: 90.4528, height: 96.0185 },
  /**
   * Screen corner radius. Percentages resolve against the screen box's own
   * width/height, so the pair keeps the corners circular rather than elliptical.
   */
  radius: { x: 14.3304, y: 6.6249 },
};

export type ScreenSource =
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string; webm?: string; poster?: string };

const SIZES = '(max-width: 768px) 280px, 320px';

/**
 * Fills the screen box. Rendered on its own so callers can animate between
 * sources without remounting — and therefore reflowing — the frame itself.
 */
export function PhoneScreen({
  source,
  priority = false,
  play = true,
}: {
  source: ScreenSource;
  priority?: boolean;
  /** Videos only load and play once this is true. */
  play?: boolean;
}) {
  if (source.type === 'image') {
    return (
      <Image
        src={source.src}
        alt={source.alt}
        fill
        sizes={SIZES}
        className="object-cover"
        priority={priority}
      />
    );
  }

  return (
    <video
      className="w-full h-full object-cover"
      poster={source.poster}
      autoPlay
      loop
      muted
      playsInline
      preload={play ? 'auto' : 'none'}
      aria-hidden="true"
    >
      {play && source.webm && <source src={source.webm} type="video/webm" />}
      {play && <source src={source.src} type="video/mp4" />}
    </video>
  );
}

interface PhoneFrameProps {
  /** Convenience for a single static screen. Omit when passing children. */
  screen?: ScreenSource;
  /** Custom screen content — sits beneath the frame, clipped to its corners. */
  children?: ReactNode;
  /** Rendered width of the whole mockup. */
  className?: string;
  priority?: boolean;
  /** Hold video playback until the frame scrolls into view. */
  lazyVideo?: boolean;
}

export default function PhoneFrame({
  screen,
  children,
  className = 'w-[280px] md:w-[320px]',
  priority = false,
  lazyVideo = false,
}: PhoneFrameProps) {
  const { ref, isInView } = useInView({ threshold: 0.15, rootMargin: '200px' });

  return (
    <div
      ref={ref}
      className={`relative select-none ${className}`}
      style={{ aspectRatio: `${FRAME.width} / ${FRAME.height}` }}
    >
      {/* Screen content sits beneath the frame, clipped to the screen's corners */}
      <div
        className="absolute overflow-hidden bg-white"
        style={{
          left: `${FRAME.screen.left}%`,
          top: `${FRAME.screen.top}%`,
          width: `${FRAME.screen.width}%`,
          height: `${FRAME.screen.height}%`,
          borderRadius: `${FRAME.radius.x}% / ${FRAME.radius.y}%`,
        }}
      >
        {children ??
          (screen && (
            <PhoneScreen source={screen} priority={priority} play={!lazyVideo || isInView} />
          ))}
      </div>

      {/* Frame artwork on top — the screen cutout is transparent */}
      <Image
        src={FRAME.src}
        alt=""
        fill
        sizes={SIZES}
        className="object-contain pointer-events-none"
        priority={priority}
      />
    </div>
  );
}
