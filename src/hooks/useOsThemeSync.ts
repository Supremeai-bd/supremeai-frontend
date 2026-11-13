import { useEffect, useRef } from 'react';
import { useThemeStore, applyThemeToDom } from '../stores/useThemeStore';
import { toast } from '../stores/useToastStore';

/**
 * Watches the OS color scheme (`prefers-color-scheme: dark`) and reduced motion
 * preference (`prefers-reduced-motion: reduce`), automatically updating the app
 * theme whenever the system setting changes while `themeMode === 'system'`.
 */
export function useOsThemeSync() {
  const themeMode = useThemeStore((s) => s.themeMode);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const surfaceTone = useThemeStore((s) => s.surfaceTone);
  const setOsPrefersDark = useThemeStore((s) => s.setOsPrefersDark);
  const setPrefersReducedMotion = useThemeStore((s) => s.setPrefersReducedMotion);

  const themeModeRef = useRef(themeMode);
  themeModeRef.current = themeMode;

  // Keep DOM classes & attributes synchronized
  useEffect(() => {
    applyThemeToDom(resolvedScheme, themeMode, liveTheme, false, surfaceTone);
  }, [resolvedScheme, themeMode, liveTheme, surfaceTone]);

  // Watch OS color scheme & reduced-motion media queries in real time
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Sync initial state on mount without transition flash
    setOsPrefersDark(colorQuery.matches, false);
    setPrefersReducedMotion(motionQuery.matches);

    const handleColorChange = (e: MediaQueryListEvent) => {
      const nextIsDark = e.matches;
      setOsPrefersDark(nextIsDark, true);

      if (themeModeRef.current === 'system') {
        toast.info(
          'OS Theme Synchronized',
          `Appearance automatically switched to ${nextIsDark ? 'Dark' : 'Light'} mode.`
        );
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    if (typeof colorQuery.addEventListener === 'function') {
      colorQuery.addEventListener('change', handleColorChange);
    } else if (typeof colorQuery.addListener === 'function') {
      colorQuery.addListener(handleColorChange);
    }

    if (typeof motionQuery.addEventListener === 'function') {
      motionQuery.addEventListener('change', handleMotionChange);
    } else if (typeof motionQuery.addListener === 'function') {
      motionQuery.addListener(handleMotionChange);
    }

    return () => {
      if (typeof colorQuery.removeEventListener === 'function') {
        colorQuery.removeEventListener('change', handleColorChange);
      } else if (typeof colorQuery.removeListener === 'function') {
        colorQuery.removeListener(handleColorChange);
      }

      if (typeof motionQuery.removeEventListener === 'function') {
        motionQuery.removeEventListener('change', handleMotionChange);
      } else if (typeof motionQuery.removeListener === 'function') {
        motionQuery.removeListener(handleMotionChange);
      }
    };
  }, [setOsPrefersDark, setPrefersReducedMotion]);
}
