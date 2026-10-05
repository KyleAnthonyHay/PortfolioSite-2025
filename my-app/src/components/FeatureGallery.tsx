'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import SnapshotFrame from '@/components/SnapshotFrame';

export interface Feature {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  /** Optional HTML snapshot of the screen; rendered live when present. */
  html?: string;
  /** CSS selector inside the snapshot to ring. */
  highlight?: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

/**
 * Three screens, three features. Each capture is a whole app window, shown
 * uncropped on a soft panel, with the story of that feature underneath.
 */
export default function FeatureGallery({ heading, features }: { heading: string; features: Feature[] }) {
  return (
    <section>
      <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">How it works</p>
      <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-tighter leading-[1.05] text-zinc-900 text-balance max-w-[40rem] mb-10">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
        {features.map((feature, i) => (
          <motion.figure
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, ease, delay: i * 0.08 }}
          >
            <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-100/80 border border-slate-200/50 p-4 pb-0 md:p-5 md:pb-0">
              <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl border border-b-0 border-slate-200/70 bg-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.25)]">
                {feature.html ? (
                  <SnapshotFrame html={feature.html} highlight={feature.highlight} fallback={feature.image} alt={feature.alt} />
                ) : (
                  <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover object-top" />
                )}
              </div>
            </div>
            <figcaption className="mt-5 px-1">
              <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-2">{feature.eyebrow}</p>
              <h3 className="text-lg font-semibold tracking-tight text-zinc-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
