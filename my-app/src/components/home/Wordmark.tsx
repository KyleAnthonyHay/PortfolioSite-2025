export const WORDMARK = 'kyle-anthony hay';
export const wordmarkClass = 'whitespace-pre font-display text-[15px] font-medium leading-none tracking-[-0.02em] text-ink';

/**
 * Set character by character, exactly like the loader's copy, so the typed
 * name lands on it without a visible shift in kerning.
 */
export default function Wordmark({ hidden = false }: { hidden?: boolean }) {
  return (
    <span id="wordmark" className={`inline-block ${wordmarkClass}`} style={{ opacity: hidden ? 0 : 1 }} aria-label="Kyle-Anthony Hay">
      {WORDMARK.split('').map((ch, i) => (
        <span key={i} aria-hidden className="inline-block align-top">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}
