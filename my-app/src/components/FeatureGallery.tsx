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
 * uncropped and centred on a soft panel, with the story of that feature
 * underneath. On a tablet (md to lg) a third of the row leaves the screens too
 * small to read, so each feature takes its own row with the story beside it.
 */
export default function FeatureGallery({ heading, features }: { heading: string; features: Feature[] }) {
  return (
    <section>
      <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-4">How it works</p>
      <h2 className="text-3xl md:text-[2.75rem] font-semibold tracking-tighter leading-[1.05] text-zinc-900 text-balance max-w-[40rem] mb-10">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-8 md:gap-10 lg:grid-cols-3 lg:gap-6">
        {features.map((feature, i) => (
          <motion.figure
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.8, ease, delay: i * 0.08 }}
            className="md:max-lg:grid md:max-lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:max-lg:items-center md:max-lg:gap-8"
          >
            <div className="relative overflow-hidden rounded-[1.5rem] bg-zinc-100/80 border border-slate-200/50 p-4 md:p-5">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-200/70 bg-white shadow-[0_18px_40px_-24px_rgba(0,0,0,0.25)]">
                {feature.html ? (
                  <SnapshotFrame html={feature.html} highlight={feature.highlight} fallback={feature.image} alt={feature.alt} />
                ) : (
                  <Image src={feature.image} alt={feature.alt} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 480px, 360px" className="object-cover object-top" />
                )}
              </div>
            </div>
            <figcaption className="mt-5 md:max-lg:mt-0 px-1">
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
