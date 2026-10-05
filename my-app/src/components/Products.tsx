'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { products, type Product } from '@/lib/products';
import TourModal from '@/components/home/TourModal';

const ease = [0.16, 1, 0.3, 1] as const;

function LoopVideo({ product }: { product: Product }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      src={product.loop}
      poster={product.poster}
      muted
      loop
      playsInline
      preload="metadata"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}

function ProductCard({
  product,
  index,
  total,
  progress,
  onTour,
}: {
  product: Product;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onTour: () => void;
}) {
  // Each card recedes a little as the next one slides over it.
  const start = index / total;
  const scale = useTransform(progress, [start, start + 1 / total], [1, index === total - 1 ? 1 : 0.94]);
  const dim = useTransform(progress, [start, start + 1 / total], [0, index === total - 1 ? 0 : 0.5]);
  const host = product.live.replace(/^https?:\/\//, '');

  return (
    <div
      className={`sticky top-[76px] h-[calc(100dvh-96px)] min-h-[600px] md:top-[88px] ${index < total - 1 ? 'mb-[14vh]' : ''}`}
      style={{ zIndex: index + 1 }}
    >
      <motion.article
        style={{ scale }}
        className="relative flex h-full origin-top flex-col overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#1f1a16] shadow-[0_-30px_60px_-30px_rgba(0,0,0,0.6)] lg:flex-row"
      >
        <div className="flex flex-col justify-between gap-8 p-7 md:p-10 lg:w-[38%] lg:p-12">
          <div>
            <div className="mb-10 flex items-center justify-between font-mono text-[11px] text-[#8c8176]">
              <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
              <span>{product.kind}</span>
            </div>
            <h3 className="font-display text-[clamp(2.4rem,4.2vw,4rem)] font-medium leading-[0.95] tracking-[-0.045em] text-[#f3efe8]">
              {product.name}
            </h3>
            <p className="mt-2 font-display text-[clamp(1.25rem,2vw,1.6rem)] tracking-[-0.03em] text-[#c98a5f]">{product.motto}</p>
            <p className="mt-6 max-w-[42ch] text-[15px] leading-[1.65] text-[#b3a99e]">{product.summary}</p>
          </div>

          <div>
            <dl className="mb-8 grid grid-cols-[88px_1fr] gap-y-2.5 text-[13px]">
              <dt className="text-[#8c8176]">Built for</dt>
              <dd className="text-[#e6dfd5]">{product.builtFor}</dd>
              <dt className="text-[#8c8176]">Stack</dt>
              <dd className="text-[#e6dfd5]">{product.stack.join(', ')}</dd>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={product.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#f3efe8] px-5 text-[13px] font-medium text-ink transition-transform active:scale-[0.97]"
              >
                Open the app
                <span className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
              </a>
              <Link
                href={`/projects/${product.projectId}`}
                className="inline-flex h-11 items-center rounded-full border border-white/15 px-5 text-[13px] text-[#e6dfd5] transition-colors hover:border-white/35"
              >
                Case study
              </Link>
            </div>
            <p className="mt-4 font-mono text-[11px] text-[#6f665d]">{host}</p>
          </div>
        </div>

        <div className="relative min-h-[260px] flex-1 p-3 pt-0 md:p-4 lg:pl-0 lg:pt-4">
          <div className="relative h-full overflow-hidden rounded-[20px] bg-[#f3efe8]">
            <LoopVideo product={product} />
            <button
              type="button"
              onClick={onTour}
              className="group absolute bottom-4 left-4 inline-flex h-11 items-center gap-3 rounded-full bg-ink/85 pl-1.5 pr-4 text-[13px] text-paper backdrop-blur-md transition-transform active:scale-[0.97]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay transition-transform duration-300 group-hover:scale-110">
                <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor"><path d="M10.5 6 0 12V0z" /></svg>
              </span>
              Watch the tour
              <span className="font-mono text-[11px] text-zinc-400">{product.tourLength}</span>
            </button>
          </div>
        </div>
        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-[#0d0b09]" />
      </motion.article>
    </div>
  );
}

const Products = () => {
  const stackRef = useRef<HTMLDivElement>(null);
  const [tour, setTour] = useState<Product | null>(null);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start start', 'end end'] });

  return (
    <section id="products" className="grain relative bg-stage text-paper">
      <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-24 md:px-10 md:pb-32 md:pt-32">
        <div className="mb-14 grid grid-cols-1 gap-6 px-2 md:mb-20 md:grid-cols-12 md:px-0">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease }}
            className="font-display text-[clamp(2.4rem,5vw,4.75rem)] font-medium leading-[0.95] tracking-[-0.045em] md:col-span-8"
          >
            Products I&apos;ve shipped.
            <br />
            <span className="text-[#6f665d]">Live, and in use.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-15%' }}
            transition={{ duration: 1, ease, delay: 0.1 }}
            className="self-end text-[15px] leading-[1.65] text-[#a1978c] md:col-span-4"
          >
            Three applications I designed and built end to end, for companies and for a church I serve. Each one is
            running today; open it, or watch a narrated tour.
          </motion.p>
        </div>

        <div ref={stackRef} className="relative">
          {products.map((product, index) => (
            <ProductCard
              key={product.slug}
              product={product}
              index={index}
              total={products.length}
              progress={scrollYProgress}
              onTour={() => setTour(product)}
            />
          ))}
        </div>
      </div>
      <TourModal product={tour} onClose={() => setTour(null)} />
    </section>
  );
};

export default Products;
