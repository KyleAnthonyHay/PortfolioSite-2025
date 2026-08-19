'use client';

import { ReactNode, useRef } from 'react';

interface IconSliderGroupProps {
  children: ReactNode;
  /**
   * Playback rate while the pointer is over the group. 1 is the slider's own
   * speed, so 0.5 is half. Applies to every row at once — one row crawling
   * while its neighbour races reads as a glitch rather than a response.
   */
  hoverSpeed?: number;
  className?: string;
}

export function IconSliderGroup({
  children,
  hoverSpeed = 0.5,
  className,
}: IconSliderGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  /*
    Rate is changed through the animation itself rather than by rewriting
    animation-duration. Duration is a divisor of the current time, so editing
    it mid-flight recomputes progress and the strip visibly jumps; changing
    playbackRate keeps the current position and only alters what happens next.
  */
  const setRate = (rate: number) => {
    ref.current?.querySelectorAll<HTMLElement>('[data-marquee]').forEach((track) => {
      track.getAnimations().forEach((animation) => animation.updatePlaybackRate(rate));
    });
  };

  return (
    <div
      ref={ref}
      className={className}
      // Touch fires enter without a matching leave, which would strand the
      // rows at half speed, so only a real pointer drives this.
      onPointerEnter={(e) => e.pointerType === 'mouse' && setRate(hoverSpeed)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setRate(1)}
      onPointerCancel={() => setRate(1)}
    >
      {children}
    </div>
  );
}
