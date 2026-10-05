import type { Feature } from '@/components/FeatureGallery';

/** Three screens per product, captured from the running apps. Filled in per capture. */
export const featureGalleries: Record<number, { heading: string; features: Feature[] }> = {};
