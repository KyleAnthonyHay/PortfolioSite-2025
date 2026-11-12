'use client';

import { useEffect, useState } from 'react';
import type { Widget } from './chat-events';

export type FitBrief = NonNullable<Extract<Widget, { kind: 'fit_report' }>['brief']>;

const POLL_MS = 2000;
/** A brief takes about half a minute after its card; one not saved by now was not written. */
const GIVE_UP_MS = 150_000;

/** One check per brief, shared by the card and the header's Brief button. */
const checks = new Map<string, Promise<FitBrief | null>>();

function waitForBrief(publicId: string): Promise<FitBrief | null> {
  let check = checks.get(publicId);
  if (!check) {
    check = (async () => {
      const started = Date.now();
      while (Date.now() - started < GIVE_UP_MS) {
        try {
          const response = await fetch(`/brief/${encodeURIComponent(publicId)}/status`, { cache: 'no-store' });
          if (response.ok) {
            const saved = (await response.json()) as { nextStep: string; level: FitBrief['level'] };
            return { publicId, nextStep: saved.nextStep, level: saved.level };
          }
        } catch {
          // Offline for a moment; check again.
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      }
      return null;
    })();
    checks.set(publicId, check);
  }
  return check;
}

/**
 * A fit check's brief as it stands: ready (saved, with its own recommendation),
 * still being written, or not written at all.
 */
export function useSavedBrief(brief?: FitBrief): { brief?: FitBrief; writing: boolean; failed: boolean } {
  const waitingId = brief?.pending ? brief.publicId : undefined;
  const [found, setFound] = useState<{ publicId: string; brief: FitBrief | null }>();

  useEffect(() => {
    if (!waitingId) return;
    let live = true;
    void waitForBrief(waitingId).then((saved) => {
      if (live) setFound({ publicId: waitingId, brief: saved });
    });
    return () => {
      live = false;
    };
  }, [waitingId]);

  if (!brief) return { writing: false, failed: false };
  if (!brief.pending) return { brief, writing: false, failed: false };
  if (found?.publicId !== brief.publicId) return { writing: true, failed: false };
  return found.brief ? { brief: found.brief, writing: false, failed: false } : { writing: false, failed: true };
}
