'use client';

/**
 * The call's three sound cues, synthesized with the Web Audio API so nothing
 * is downloaded: mute (two soft notes stepping down), unmute (the same two
 * stepping up) and hang-up (a lower, slower pair, like a line going quiet).
 * They play only from the visitor's own taps on the card, never on their own.
 */

export type Cue = 'mute' | 'unmute' | 'hangup';

const SHAPES: Record<Cue, { notes: [number, number]; length: number; gap: number; gain: number }> = {
  mute: { notes: [622, 440], length: 0.08, gap: 0.095, gain: 0.07 },
  unmute: { notes: [440, 622], length: 0.08, gap: 0.095, gain: 0.07 },
  hangup: { notes: [392, 262], length: 0.15, gap: 0.18, gain: 0.09 },
};

let shared: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    shared ??= new AudioContext();
    if (shared.state === 'suspended') void shared.resume().catch(() => {});
    return shared;
  } catch {
    return null;
  }
}

/** Create the audio context inside a tap, so a cue that follows later (the server ending the call) can still sound. */
export function primeCues(): void {
  context();
}

export function playCue(cue: Cue): void {
  const audio = context();
  if (!audio) return;
  const { notes, length, gap, gain } = SHAPES[cue];
  const start = audio.currentTime + 0.01;
  notes.forEach((frequency, index) => {
    const at = start + index * gap;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    // A short attack and an exponential tail: no clicks, no ring.
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(gain, at + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
    oscillator.connect(envelope).connect(audio.destination);
    oscillator.start(at);
    oscillator.stop(at + length + 0.02);
  });
}
