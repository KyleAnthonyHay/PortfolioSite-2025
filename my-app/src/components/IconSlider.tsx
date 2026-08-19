import Image from 'next/image';

interface IconSliderProps {
  icons: string[];
  reverse?: boolean;
  /** Seconds for one full pass through the set. */
  duration?: number;
  gradientColor?: string;
}

/**
 * Copies of the set laid end to end inside each row. A row has to be at least
 * as wide as its container or the tail of the set clears the viewport before
 * the wrap point, leaving a gap that scrolls through. The shortest set here is
 * eight icons — 576px — against a column that reaches ~980px, so one copy is
 * not enough and two comfortably clears it.
 */
const REPEAT = 2;

function IconRow({ icons, hidden = false }: { icons: string[]; hidden?: boolean }) {
  return (
    <div className="flex flex-none" aria-hidden={hidden || undefined}>
      {Array.from({ length: REPEAT }).map((_, pass) =>
        icons.map((icon, i) => (
          <div key={`${pass}-${i}`} className="flex-none mx-4 opacity-50 w-[40px] h-[40px] relative">
            <Image
              src={`/icons/${icon}`}
              /* Only the first pass of the visible row is announced; the rest
                 are duplicates that would otherwise be read out again. */
              alt={hidden || pass > 0 ? '' : icon.replace(/\.[^.]+$/, '')}
              fill
              sizes="40px"
              className="grayscale object-contain"
            />
          </div>
        ))
      )}
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

        That -50% now spans REPEAT copies of the set rather than one, so the
        duration scales with it to keep the icons moving at the same speed.

        The animation comes from a class rather than an inline style: Tailwind
        prunes @keyframes that nothing in the CSS refers to, and it cannot see
        a name that only ever appears in a style attribute.
      */}
      <div
        data-marquee
        className={`flex w-max will-change-transform motion-reduce:animate-none ${
          reverse ? 'animate-marquee-reverse' : 'animate-marquee'
        }`}
        style={
          { '--marquee-duration': `${duration * REPEAT}s` } as React.CSSProperties
        }
      >
        <IconRow icons={icons} />
        <IconRow icons={icons} hidden />
      </div>
    </div>
  );
}
