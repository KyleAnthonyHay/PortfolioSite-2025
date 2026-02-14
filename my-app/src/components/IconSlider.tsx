'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';

interface IconSliderProps {
  icons: string[];
  reverse?: boolean;
  duration?: number;
  gradientColor?: string;
}

export function IconSlider({ icons, reverse = false, duration = 25, gradientColor = '#F5F5F5' }: IconSliderProps) {
  const setRef = useRef<HTMLDivElement>(null);
  const [setWidth, setSetWidth] = useState(0);

  useEffect(() => {
    if (setRef.current) {
      setSetWidth(setRef.current.scrollWidth);
    }
  }, []);

  const from = reverse ? -setWidth : 0;
  const to = reverse ? 0 : -setWidth;

  return (
    <div className="relative w-full overflow-hidden h-[40px]">
      <div className="absolute inset-y-0 left-0 w-[60px] z-10" style={{ background: `linear-gradient(to right, ${gradientColor}, transparent)` }} />
      <div className="absolute inset-y-0 right-0 w-[60px] z-10" style={{ background: `linear-gradient(to left, ${gradientColor}, transparent)` }} />
      <motion.div
        className="flex"
        animate={setWidth ? { x: [from, to] } : undefined}
        transition={{ duration, ease: 'linear', repeat: Infinity }}
      >
        <div ref={setRef} className="flex">
          {icons.map((icon, i) => (
            <div key={`a-${i}`} className="flex-none mx-4 opacity-50 w-[40px] h-[40px] relative">
              <Image src={`/icons/${icon}`} alt={icon.replace(/\.[^.]+$/, '')} fill className="grayscale object-contain" />
            </div>
          ))}
        </div>
        <div className="flex">
          {icons.map((icon, i) => (
            <div key={`b-${i}`} className="flex-none mx-4 opacity-50 w-[40px] h-[40px] relative">
              <Image src={`/icons/${icon}`} alt={icon.replace(/\.[^.]+$/, '')} fill className="grayscale object-contain" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
