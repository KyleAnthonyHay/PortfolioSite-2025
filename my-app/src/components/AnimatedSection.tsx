'use client';

import { useInView } from '@/hooks/useInView';
import { useEffect, useState, ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fade-in-up' | 'fade-in' | 'scale-in';
  delay?: number;
  immediate?: boolean;
}

export function AnimatedSection({ 
  children, 
  className = '', 
  animation = 'fade-in-up',
  delay = 0,
  immediate = false
}: AnimatedSectionProps) {
  const { ref, isInView } = useInView({ threshold: 0.1 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldAnimate = immediate ? mounted : isInView;
  const animationClass = shouldAnimate ? `animate-${animation}` : 'opacity-0';
  const delayClass = delay > 0 ? `animation-delay-${delay}` : '';

  return (
    <div ref={ref} className={`${className} ${animationClass} ${delayClass}`}>
      {children}
    </div>
  );
}
