import { useRef } from 'react';
import { useEffect } from 'react';

export function useFadeIn(delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    
    const animationFrame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1), transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
        el.style.transitionDelay = `${delay}s`;
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [delay]);

  return ref;
}