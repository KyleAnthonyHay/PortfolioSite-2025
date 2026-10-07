import { ReactNode } from 'react';

interface RecordingFrameProps {
  /** Aspect ratio of the recording, width / height. */
  ratio?: number;
  className?: string;
  children: ReactNode;
}

/**
 * For screen recordings that already carry their own window chrome and
 * backdrop. Wrapping those in BrowserFrame would draw a second browser around
 * the first, so this only rounds and seats the video.
 */
export default function RecordingFrame({ ratio = 16 / 9, className = '', children }: RecordingFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[1.25rem] bg-zinc-100 border border-slate-200/70 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)] ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {children}
    </div>
  );
}
