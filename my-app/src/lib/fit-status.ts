import type { FitStatus } from './chat-events';

/** The fit check's three labels, shared by the chat card, the brief page, the PDF and the emails. */
export const STATUS_LABEL: Record<FitStatus, string> = { match: 'Supported match', related: 'Needs confirmation', gap: 'Confirmed gap' };

/** The chat card's colours for each status: icon, and chip text on its tint. */
export const STATUS_COLOR: Record<FitStatus, { color: string; background: string }> = {
  match: { color: '#047857', background: '#ecfdf5' },
  related: { color: '#6b4f8a', background: '#f3eff8' },
  gap: { color: '#71717a', background: '#f4f4f5' },
};
