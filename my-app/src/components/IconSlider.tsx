import Image from 'next/image';

interface IconSliderProps {
  icons: string[];
  reverse?: boolean;
  /** Seconds for one full pass through the set. */
  duration?: number;
  gradientColor?: string;
}

function IconRow({ icons, hidden = false }: { icons: string[]; hidden?: boolean }) {
  return (
    <div className="flex flex-none" aria-hidden={hidden || undefined}>
      {icons.map((icon, i) => (
        <div key={i} className="flex-none mx-4 opacity-50 w-[40px] h-[40px] relative">
          <Image
            src={`/icons/${icon}`}
            alt={hidden ? '' : icon.replace(/\.[^.]+$/, '')}
            fill
            sizes="40px"
            className="grayscale object-contain"
          />
        </div>
      ))}
    </div>
  );
}

export function IconSlider({
  icons,
  reverse = false,
  duration = 25,
  gradientColor = '#F5F5F5',
}: IconSliderProps) {
  return (
    <div className="relative w-full overflow-hidden h-[40px]">
      <div
        className="absolute inset-y-0 left-0 w-[60px] z-10 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${gradientColor}, transparent)` }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[60px] z-10 pointer-events-none"
        style={{ background: `linear-gradient(to left, ${gradientColor}, transparent)` }}
      />
      {/*
        Two identical rows in a w-max track. The keyframes translate by exactly
        -50%, which is one row, so the wrap point is pixel-identical to the
        start — seamless, and immune to the sub-pixel drift that comes from
        measuring scrollWidth (which also omits the last child's margin).
      */}
      <div
        className="flex w-max will-change-transform motion-reduce:animate-none"
        style={{
          animation: `${reverse ? 'marquee-reverse' : 'marquee'} ${duration}s linear infinite`,
        }}
      >
        <IconRow icons={icons} />
        <IconRow icons={icons} hidden />
      </div>
    </div>
  );
}
