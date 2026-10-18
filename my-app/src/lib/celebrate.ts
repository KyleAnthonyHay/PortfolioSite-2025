/**
 * The site's one completion burst: two short sprays angled in from either side
 * of the element, then a soft pop at its centre, in the chat's blues. Timed
 * to land as SuccessCheck finishes drawing. Nothing under reduced motion.
 */
const COLORS = ['#0a84ff', '#5ac8fa', '#93c5fd', '#2563eb', '#dbeafe'];

/** When the burst fires after the check appears, so the two read as one beat. */
export const BURST_DELAY_MS = 260;

export async function celebrate(source?: Element | null, delay = BURST_DELAY_MS): Promise<void> {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');
  const rect = source?.getBoundingClientRect();
  const w = window.innerWidth;
  const h = window.innerHeight;
  const cx = rect ? (rect.left + rect.width / 2) / w : 0.5;
  const cy = rect ? (rect.top + rect.height / 2) / h : 0.5;
  const half = rect ? Math.min(rect.width / 2, 120) / w : 0.04;
  const base = { colors: COLORS, zIndex: 100, gravity: 1.1, decay: 0.91, scalar: 0.8, ticks: 200, shapes: ['square', 'circle'] as ('square' | 'circle')[] };

  window.setTimeout(() => {
    confetti({ ...base, particleCount: 24, angle: 62, spread: 42, startVelocity: 34, drift: 0.2, origin: { x: cx - half, y: cy } });
    confetti({ ...base, particleCount: 24, angle: 118, spread: 42, startVelocity: 34, drift: -0.2, origin: { x: cx + half, y: cy } });
    window.setTimeout(() => confetti({ ...base, particleCount: 16, spread: 360, startVelocity: 11, scalar: 0.55, ticks: 110, gravity: 0.6, origin: { x: cx, y: cy } }), 90);
    navigator.vibrate?.(12);
  }, delay);
}
