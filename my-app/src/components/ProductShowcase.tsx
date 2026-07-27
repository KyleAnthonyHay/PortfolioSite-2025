'use client';

import Image from 'next/image';
import { ReactNode, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import PhoneFrame, { PhoneScreen, ScreenSource } from '@/components/PhoneFrame';
import BrowserFrame from '@/components/BrowserFrame';

/** Matches the easing already used by the site's CSS keyframes. */
const ease = [0.16, 1, 0.3, 1] as const;
/** Crossfades want even pacing — an expo-out curve leaves a lingering ghost. */
const crossfade = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };
const pillSpring = { type: 'spring' as const, stiffness: 520, damping: 40, mass: 0.6 };

export type ShowcaseMedia =
  /** Live content rendered inside our own iPhone frame. */
  | { kind: 'phone'; screen: ScreenSource }
  /** A mockup that already includes the device, trimmed to the device bounds. */
  | { kind: 'phone-image'; src: string; alt: string }
  /** A web screenshot, shown in browser chrome. */
  | { kind: 'browser'; src: string; alt: string; url?: string; ratio?: number };

export interface ShowcaseItem {
  /** Pill label. Only rendered when a showcase has more than one item. */
  label: string;
  icon: ReactNode;
  /** Headline shown alongside the media when this item is active. */
  title: string;
  description: string;
  media: ShowcaseMedia;
}

interface ProductShowcaseProps {
  heading: string;
  items: ShowcaseItem[];
  /**
   * 'portrait' puts a phone beside the copy. 'landscape' stacks a full-width
   * browser shot above it — a wide screenshot squeezed into half a column is
   * unreadable.
   */
  orientation?: 'portrait' | 'landscape';
}

/** Shared by the visible copy and the hidden sizers, so both measure alike. */
function Copy({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h3 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-900">{title}</h3>
      <p className="mt-3 text-base text-zinc-500 leading-relaxed max-w-[60ch]">{description}</p>
    </>
  );
}

function Media({ media, priority }: { media: ShowcaseMedia; priority?: boolean }) {
  if (media.kind === 'phone') {
    return <PhoneScreen source={media.screen} priority={priority} />;
  }
  if (media.kind === 'phone-image') {
    return (
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes="(max-width: 768px) 240px, 300px"
        className="object-contain"
        priority={priority}
      />
    );
  }
  return (
    <Image
      src={media.src}
      alt={media.alt}
      fill
      sizes="(max-width: 1024px) 100vw, 900px"
      className="object-cover object-top"
      priority={priority}
    />
  );
}

export default function ProductShowcase({
  heading,
  items,
  orientation = 'portrait',
}: ProductShowcaseProps) {
  const [active, setActive] = useState(0);
  const current = items[active];
  const showPills = items.length > 1;
  const landscape = orientation === 'landscape';

  const pills = showPills && (
    <div className="flex flex-wrap gap-2.5 mt-8">
      {items.map((item, i) => {
        const isActive = i === active;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => setActive(i)}
            aria-pressed={isActive}
            className={`relative inline-flex items-center gap-2 rounded-full pl-4 pr-5 py-2.5 text-sm font-medium transition-[transform,color] duration-300 active:scale-[0.97] ${
              isActive
                ? 'text-white'
                : 'bg-white text-zinc-600 hover:text-zinc-900 border border-slate-200/70 shadow-[0_2px_8px_-6px_rgba(0,0,0,0.15)]'
            }`}
          >
            {/* The dark background slides between pills rather than blinking */}
            {isActive && (
              <motion.span
                layoutId={`showcase-active-pill-${heading}`}
                transition={pillSpring}
                className="absolute inset-0 rounded-full bg-zinc-900 shadow-[0_4px_14px_-6px_rgba(0,0,0,0.45)]"
              />
            )}
            {/* Fading the label colour keeps it legible while the pill is
                still travelling across it */}
            <span className="relative z-10 inline-flex items-center gap-2 transition-colors duration-300">
              <span className={`transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                {item.icon}
              </span>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );

  /*
    Every state is stacked into one grid cell. The hidden copies still take part
    in sizing, so the row is always as tall as the wordiest item — the block
    never resizes when you switch tabs, and nothing below or beside it (the
    media included) shifts. Only the text inside changes.
  */
  const copy = (
    <div className={`grid grid-cols-1 grid-rows-1 ${landscape ? 'mt-10' : 'mt-10'}`}>
      {items.map((item) => (
        <div key={item.label} className="col-start-1 row-start-1 invisible" aria-hidden>
          <Copy title={item.title} description={item.description} />
        </div>
      ))}

      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={active}
          className="col-start-1 row-start-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease }}
        >
          <Copy title={current.title} description={current.description} />
        </motion.div>
      </AnimatePresence>
    </div>
  );

  /** The frame stays put while only its contents crossfade. */
  const animatedMedia = (
    <AnimatePresence initial={false}>
      <motion.div
        key={active}
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={crossfade}
      >
        <Media media={current.media} priority={active === 0} />
      </motion.div>
    </AnimatePresence>
  );

  const panel = 'relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-zinc-100/70 border border-slate-200/50';
  const headingEl = (
    <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-tighter leading-[1.05] text-zinc-900 text-balance">
      {heading}
    </h2>
  );

  if (landscape) {
    const first = items[0].media;
    const ratio = first.kind === 'browser' ? first.ratio ?? 16 / 9 : 16 / 9;
    const url = first.kind === 'browser' ? first.url : undefined;

    return (
      <div className={panel}>
        <div className="px-6 py-12 md:px-14 md:py-16">
          <div className="max-w-[46rem]">
            {headingEl}
            {pills}
          </div>

          <div className="mt-12">
            <BrowserFrame url={url} ratio={ratio} priority>
              {animatedMedia}
            </BrowserFrame>
          </div>

          <div className="max-w-[46rem]">{copy}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={panel}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 lg:gap-8 items-center px-6 py-12 md:px-14 md:py-16">
        <div className="max-w-[34rem]">
          {headingEl}
          {pills}
          {copy}
        </div>

        <div className="flex justify-center lg:justify-end">
          {current.media.kind === 'phone' ? (
            <PhoneFrame className="w-[240px] sm:w-[270px] md:w-[300px]" priority>
              {animatedMedia}
            </PhoneFrame>
          ) : (
            /* Pre-framed mockups are trimmed to the same aspect as PhoneFrame,
               so both render at an identical device size. */
            <div
              className="relative w-[240px] sm:w-[270px] md:w-[300px]"
              style={{ aspectRatio: '1060 / 2160' }}
            >
              {animatedMedia}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
