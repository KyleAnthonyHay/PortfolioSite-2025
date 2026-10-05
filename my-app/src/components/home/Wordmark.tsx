export const WORDMARK = 'Kyle-Anthony';
/** Characters on screen from the loader's first frame; the rest type in between them. */
export const INITIALS = new Set([0, 5]);
export const wordmarkClass = 'whitespace-pre text-lg font-semibold leading-none tracking-tight text-zinc-900';

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
