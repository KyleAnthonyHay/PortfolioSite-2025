'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react';
import { alsoShipped } from '@/lib/products';

/**
 * A plain index of the smaller things that shipped. On a pointer device a
 * preview follows the cursor down the list.
 */
export default function AlsoShipped() {
  const listRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 300, damping: 30, mass: 0.5 });
  const sy = useSpring(y, { stiffness: 300, damping: 30, mass: 0.5 });

  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="mb-10 flex items-end justify-between gap-6">
          <h2 className="font-display text-[clamp(1.9rem,3.2vw,2.75rem)] font-medium leading-none tracking-[-0.04em] text-ink">
            Also shipped
          </h2>
          <Link href="/projects" className="text-[13px] text-zinc-500 transition-colors hover:text-ink">
            Everything I&apos;ve built →
          </Link>
        </div>

        <div
          ref={listRef}
          className="relative border-t border-zinc-300/70"
          onPointerMove={(e) => {
            const rect = listRef.current?.getBoundingClientRect();
            if (!rect) return;
            x.set(e.clientX - rect.left);
            y.set(e.clientY - rect.top);
          }}
          onPointerLeave={() => setActive(null)}
        >
          {alsoShipped.map((item, i) => (
            <Link
              key={item.name}
              href={`/projects/${item.projectId}`}
              onPointerEnter={() => setActive(i)}
              className="group grid grid-cols-12 items-baseline gap-4 border-b border-zinc-300/70 py-6 transition-colors md:py-7"
            >
              <span className="col-span-12 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] tracking-[-0.035em] text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 md:col-span-5">
                {item.name}
              </span>
              <span className="col-span-8 text-[14px] text-zinc-500 md:col-span-5">{item.note}</span>
              <span className="col-span-4 text-right font-mono text-[11px] text-zinc-400 md:col-span-2">{item.kind}</span>
            </Link>
          ))}

          <AnimatePresence>
            {active !== null && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ left: sx, top: sy }}
                className="pointer-events-none absolute z-10 hidden h-[200px] w-[300px] -translate-x-1/2 -translate-y-[115%] overflow-hidden rounded-2xl bg-zinc-200 shadow-[0_30px_60px_-20px_rgba(26,22,19,0.45)] md:block"
              >
                <Image src={alsoShipped[active].image} alt="" fill sizes="300px" className="object-cover object-top" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
