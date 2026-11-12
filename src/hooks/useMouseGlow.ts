import { useRef, useCallback, useEffect } from 'react';

/**
 * useMouseGlow
 * Tracks cursor position relative to the attached container element
 * and updates CSS variables (--mouse-x, --mouse-y) for interactive neon spotlight shaders.
 */
export function useMouseGlow<T extends HTMLElement = HTMLDivElement>() {
  const elementRef = useRef<T | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const el = elementRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    el.style.setProperty('--mouse-x', `${x}px`);
    el.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseEnter = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    el.style.setProperty('--glow-opacity', '1');
  }, []);

  const handleMouseLeave = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    el.style.setProperty('--glow-opacity', '0');
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseenter', handleMouseEnter);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseenter', handleMouseEnter);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  return elementRef;
}
