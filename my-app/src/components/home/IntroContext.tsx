'use client';

import { createContext, useContext, useState } from 'react';

/**
 * The opening sequence hands off to the page in two beats:
 * `reveal` lets the hero start rising while the loader is still settling,
 * `done` is the frame the typed name lands on the nav wordmark.
 */
export type IntroPhase = 'intro' | 'reveal' | 'done';

const IntroContext = createContext<{ phase: IntroPhase; setPhase: (phase: IntroPhase) => void }>({
  phase: 'done',
  setPhase: () => {},
});

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>('intro');
  return <IntroContext.Provider value={{ phase, setPhase }}>{children}</IntroContext.Provider>;
}

export const useIntro = () => useContext(IntroContext);
