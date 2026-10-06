'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

interface SnapshotFrameProps {
  /** Static HTML snapshot of the screen, served from /public. */
  html: string;
  /** CSS selector of the element to ring. */
  highlight?: string;
  /** Flat capture, shown until the snapshot loads or if it fails. */
  fallback: string;
  alt: string;
}

const SNAPSHOT_WIDTH = 1440;
const SNAPSHOT_HEIGHT = 900;

/**
 * A feature screen rendered from its HTML snapshot rather than a flat image.
 * The page is laid out at its real size inside a sandboxed, scriptless
 * iframe and scaled down to fit, so the type stays crisp; the highlighted
 * element gets a ring drawn by a stylesheet injected ahead of the markup.
 */
export default function SnapshotFrame({ html, highlight, fallback, alt }: SnapshotFrameProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<string | null>(null);
  const [scale, setScale] = useState(0.25);

  useEffect(() => {
    let cancelled = false;
    fetch(html)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
      .then((text) => {
        if (cancelled) return;
        const ring = highlight
          ? `${highlight} { outline: 3px solid #18181b; outline-offset: 6px; border-radius: 10px; box-shadow: 0 0 0 9999px rgba(24,24,27,0.06); }`
          : '';
        const style = `<style>html,body{margin:0;overflow:hidden;width:${SNAPSHOT_WIDTH}px;height:${SNAPSHOT_HEIGHT}px;} *{cursor:default!important;} ${ring}</style>`;
        setDoc(text.includes('</head>') ? text.replace('</head>', `${style}</head>`) : style + text);
      })
      .catch(() => {
        /* The flat capture stays up. */
      });
    return () => {
      cancelled = true;
    };
  }, [html, highlight]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const update = () => setScale(host.clientWidth / SNAPSHOT_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="absolute inset-0 overflow-hidden">
      <Image src={fallback} alt={alt} fill sizes="(max-width: 768px) 100vw, 360px" className="object-cover object-top" />
      {doc && (
        <iframe
          title={alt}
          srcDoc={doc}
          sandbox=""
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 origin-top-left border-0 bg-white"
          style={{ width: SNAPSHOT_WIDTH, height: SNAPSHOT_HEIGHT, transform: `scale(${scale})` }}
        />
      )}
    </div>
  );
}
