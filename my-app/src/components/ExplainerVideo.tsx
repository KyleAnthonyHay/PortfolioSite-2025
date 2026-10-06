'use client';

import { useRef, useState } from 'react';
import type { Product } from '@/lib/products';

/**
 * The narrated explainer for a product. Nothing loads until the visitor
 * presses play, so the page stays light; then the native controls take over.
 */
export default function ExplainerVideo({ product }: { product: Product }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);

  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-medium mb-2">Explainer</p>
          <h2 className="text-2xl md:text-3xl tracking-tighter leading-none text-zinc-900">
            {product.name} in {product.tourLength.replace(/^0:/, '')} seconds
          </h2>
        </div>
      </div>
      <div className="relative aspect-video overflow-hidden rounded-[1.5rem] border border-zinc-200/70 bg-zinc-100 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)]">
        <video
          ref={ref}
          src={product.tour}
          poster={product.tourPoster}
          controls={started}
          playsInline
          preload="none"
          className="absolute inset-0 h-full w-full object-contain"
        />
        {!started && (
          <button
            type="button"
            onClick={() => {
              setStarted(true);
              ref.current?.play().catch(() => {});
            }}
            className="group absolute inset-0 flex items-end justify-start p-5 md:p-6"
            aria-label={`Play the ${product.name} explainer`}
          >
            <span className="inline-flex items-center gap-3 rounded-full bg-zinc-900 py-2 pl-2 pr-5 text-sm font-medium text-white shadow-[0_12px_30px_-10px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:scale-[1.03]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-zinc-900">
                <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><path d="M10 6 0 12V0z" /></svg>
              </span>
              Play explainer
              <span className="font-mono text-xs text-zinc-400">{product.tourLength}</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
