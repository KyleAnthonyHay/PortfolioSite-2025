/** GPT-Live transcript fragments are timestamped; a handoff must not consume a later utterance. */
export class TranscriptTimeline {
  private fragments: { delta: string; start?: number; end?: number }[] = [];
  private consumedThrough = -1;

  append(delta: string, start?: number, end?: number): boolean {
    if (end !== undefined && end <= this.consumedThrough) return false;
    this.fragments.push({ delta, start, end });
    if (this.fragments.length > 1000) this.fragments.shift();
    return true;
  }

  take(offset?: number): string {
    const selected = this.fragments.filter((part) => offset === undefined || part.start === undefined || part.start <= offset);
    this.fragments = this.fragments.filter((part) => !selected.includes(part));
    if (offset !== undefined) this.consumedThrough = Math.max(this.consumedThrough, offset);
    return selected.map((part) => part.delta).join('').trim();
  }
}
