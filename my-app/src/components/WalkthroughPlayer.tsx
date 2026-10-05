'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface WalkthroughPlayerProps {
  src: string;
  poster: string;
  className?: string;
  /** Fill the parent instead of drawing the rounded frame; the parent sets the size. */
  frameless?: boolean;
}

/**
 * The narrated walkthrough, playing on its own with the sound off. The only
 * controls are two small buttons in the corner that appear on hover: one for
 * sound, one for play/pause. Playback pauses while the video is off screen.
 */
export default function WalkthroughPlayer({ src, poster, className = '', frameless = false }: WalkthroughPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (playing) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [playing]);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const button =
    'flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900/80 text-white backdrop-blur-sm transition-colors hover:bg-zinc-900';

  return (
    <div
      className={`group relative overflow-hidden bg-white ${
        frameless ? 'absolute inset-0' : 'rounded-[1.25rem] border border-zinc-200/70 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)]'
      } ${className}`}
      style={frameless ? undefined : { aspectRatio: 16 / 9 }}
    >
      <video
        ref={ref}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full cursor-pointer object-contain"
      />
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
        <button type="button" onClick={toggleMute} aria-label={muted ? 'Turn sound on' : 'Turn sound off'} className={button}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button type="button" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'} className={button}>
          {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
      </div>
    </div>
  );
}
