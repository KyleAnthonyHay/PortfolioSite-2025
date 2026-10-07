'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';

interface WalkthroughPlayerProps {
  src: string;
  poster: string;
  className?: string;
  /** Fill the parent instead of drawing the rounded frame; the parent sets the size. */
  frameless?: boolean;
}

/**
 * The narrated walkthrough, playing on its own with the sound off. The
 * controls appear on hover: two small buttons in the corner, for sound and
 * play/pause, and a progress bar along the bottom edge that can be clicked
 * or dragged to skip through. Playback pauses while the video is off screen.
 */
export default function WalkthroughPlayer({ src, poster, className = '', frameless = false }: WalkthroughPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  // Whether the visitor wants it playing. Off-screen pauses must not count as
  // a choice, or a card that mounts below the fold would never start.
  const wantsPlay = useRef(true);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  // 0..1 through the video, kept in state only while something can show it.
  const [progress, setProgress] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const scrubbingRef = useRef(false);

  // The timeupdate event only fires a few times a second, which makes the
  // bar hop. While the video plays, read its clock every frame instead.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      const video = ref.current;
      if (video && !scrubbingRef.current && Number.isFinite(video.duration) && video.duration > 0) {
        setProgress(video.currentTime / video.duration);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (wantsPlay.current) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const togglePlay = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      wantsPlay.current = true;
      video.play().catch(() => {});
    } else {
      wantsPlay.current = false;
      video.pause();
    }
  };

  const seekTo = (clientX: number) => {
    const video = ref.current;
    const bar = barRef.current;
    if (!video || !bar || !Number.isFinite(video.duration)) return;
    const rect = bar.getBoundingClientRect();
    const fraction = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = fraction * video.duration;
    setProgress(fraction);
  };

  // A drag is tracked on the window, so letting go anywhere ends it, even
  // off the bar or outside the player; pointer capture alone proved
  // unreliable for the release.
  const onBarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.preventDefault();
    scrubbingRef.current = true;
    setScrubbing(true);
    seekTo(event.clientX);
    const move = (e: globalThis.PointerEvent) => {
      if (scrubbingRef.current) seekTo(e.clientX);
    };
    const stop = () => {
      scrubbingRef.current = false;
      setScrubbing(false);
      // Some browsers pause on a seek; a scrub should never stop the video.
      const video = ref.current;
      if (video && wantsPlay.current && video.paused) video.play().catch(() => {});
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('blur', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('blur', stop);
  };

  const onBarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const video = ref.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const step = event.shiftKey ? 10 : 5;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') video.currentTime = Math.min(video.duration, video.currentTime + step);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') video.currentTime = Math.max(0, video.currentTime - step);
    else if (event.key === 'Home') video.currentTime = 0;
    else if (event.key === 'End') video.currentTime = video.duration;
    else return;
    event.preventDefault();
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
      className={`group overflow-hidden bg-white ${
        frameless ? 'absolute inset-0' : 'relative rounded-[1.25rem] border border-zinc-200/70 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)]'
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
        onTimeUpdate={(event) => {
          // Covers seeks while paused; the frame loop handles playback.
          const video = event.currentTarget;
          if (!scrubbing && video.paused && Number.isFinite(video.duration) && video.duration > 0) setProgress(video.currentTime / video.duration);
        }}
        className="absolute inset-0 h-full w-full cursor-pointer object-contain"
      />
      {/* Scrub bar: a thin line along the bottom that thickens on hover; click or drag to skip. */}
      <div
        ref={barRef}
        role="slider"
        tabIndex={0}
        aria-label="Video progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        onPointerDown={onBarPointerDown}
        onKeyDown={onBarKeyDown}
        className={`group/bar absolute inset-x-0 bottom-0 z-10 flex h-5 cursor-pointer touch-none items-end opacity-0 transition-opacity duration-300 focus:opacity-100 focus:outline-none group-hover:opacity-100 ${
          scrubbing ? 'opacity-100' : ''
        }`}
      >
        <div className={`relative w-full bg-zinc-900/15 transition-[height] duration-150 group-hover/bar:h-1.5 ${scrubbing ? 'h-1.5' : 'h-1'}`}>
          <div className="absolute inset-y-0 left-0 bg-zinc-900/80" style={{ width: `${progress * 100}%` }} />
          <div
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900 shadow-[0_1px_4px_rgba(0,0,0,0.35)] ring-2 ring-white transition-opacity ${
              scrubbing ? 'opacity-100' : 'opacity-0 group-hover/bar:opacity-100'
            }`}
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-5 right-4 flex items-center gap-2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
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
