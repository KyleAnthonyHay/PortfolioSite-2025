'use client';

import { forwardRef } from 'react';
import { motion } from 'motion/react';

/**
 * A blue disc that springs in, a ring that ripples out once, and a check that
 * draws itself. Pairs with celebrate(), which fires as the stroke finishes.
 */
const SuccessCheck = forwardRef<HTMLSpanElement, { size?: number }>(function SuccessCheck({ size = 32 }, ref) {
  return (
    <span ref={ref} className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full bg-accent-blue"
        initial={{ scale: 1, opacity: 0.35 }}
        animate={{ scale: 1.9, opacity: 0 }}
        transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.span
        className="relative flex h-full w-full items-center justify-center rounded-full bg-accent-blue text-white shadow-[0_6px_16px_-6px_rgba(10,132,255,0.6)]"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22, mass: 0.7 }}
      >
        <svg viewBox="0 0 24 24" style={{ width: size / 2, height: size / 2 }} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3, delay: 0.1, ease: [0.65, 0, 0.35, 1] }}
          />
        </svg>
      </motion.span>
    </span>
  );
});

export default SuccessCheck;
