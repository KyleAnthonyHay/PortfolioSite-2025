'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Product } from '@/lib/products';

type LenisLike = { stop: () => void; start: () => void };

export default function TourModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  useEffect(() => {
    if (!product) return;
    const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      lenis?.start();
      window.removeEventListener('keydown', onKey);
    };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="tour"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0d0b09]/85 p-4 backdrop-blur-sm md:p-10"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} tour`}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between text-paper">
              <p className="font-display text-lg tracking-tight">
                {product.name} <span className="text-zinc-400">· a {product.tourLength} tour</span>
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close tour"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-paper transition-colors hover:border-white/40"
              >
                ✕
              </button>
            </div>
            <video src={product.tour} poster={product.poster} controls autoPlay playsInline className="aspect-video w-full rounded-2xl bg-black" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
