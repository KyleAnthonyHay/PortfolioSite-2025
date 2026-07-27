import Image from 'next/image';
import { ReactNode } from 'react';

interface BrowserFrameProps {
  /** Shown in the address pill. Host only, no protocol. */
  url?: string;
  /** Convenience for a single screenshot. Omit when passing children. */
  src?: string;
  alt?: string;
  /** Aspect ratio of the viewport area, width / height. */
  ratio?: number;
  className?: string;
  priority?: boolean;
  /** Custom viewport content, e.g. an animated stack of screenshots. */
  children?: ReactNode;
}

/**
 * The landscape counterpart to PhoneFrame: a restrained browser chrome so web
 * screenshots read as a product shot rather than a bare image, matching how
 * the iOS projects sit in a device.
 */
export default function BrowserFrame({
  url,
  src,
  alt = '',
  ratio = 16 / 9,
  className = '',
  priority = false,
  children,
}: BrowserFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-[1.25rem] bg-white border border-slate-200/70 shadow-[0_12px_40px_-18px_rgba(0,0,0,0.18)] ${className}`}
    >
      <div className="flex items-center gap-3 px-4 h-11 border-b border-slate-200/70 bg-zinc-50/80">
        <div className="flex gap-1.5 shrink-0" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-zinc-300" />
        </div>
        {url && (
          <div className="flex-1 min-w-0 max-w-[22rem] mx-auto">
            <div className="truncate text-center text-[11px] text-zinc-400 bg-white border border-slate-200/70 rounded-md py-1 px-3">
              {url}
            </div>
          </div>
        )}
        <div className="w-[42px] shrink-0" aria-hidden />
      </div>

      <div className="relative bg-white" style={{ aspectRatio: ratio }}>
        {children ??
          (src && (
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(max-width: 1024px) 100vw, 900px"
              className="object-cover object-top"
              priority={priority}
            />
          ))}
      </div>
    </div>
  );
}
