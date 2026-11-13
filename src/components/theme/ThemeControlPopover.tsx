import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sun, Moon, Monitor, Check, Play, Pause, Palette, ChevronRight } from 'lucide-react';
import {
  useThemeStore,
  LIVE_THEMES,
  ThemeMode,
  LiveThemeId,
} from '../../stores/useThemeStore';

interface ThemeControlPopoverProps {
  compact?: boolean;
  onOpenSettings?: () => void;
  align?: 'left' | 'right';
  placement?: 'top' | 'bottom';
  triggerLabel?: string;
}

export const ThemeControlPopover: React.FC<ThemeControlPopoverProps> = ({
  compact = false,
  onOpenSettings,
  align = 'right',
  placement = 'bottom',
  triggerLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  }>({ left: 12, top: 60, maxHeight: 460 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const themeMode = useThemeStore((s) => s.themeMode);
  const osPrefersDark = useThemeStore((s) => s.osPrefersDark);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const liveMotion = useThemeStore((s) => s.liveMotion);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const setLiveTheme = useThemeStore((s) => s.setLiveTheme);
  const setLiveMotion = useThemeStore((s) => s.setLiveMotion);

  const activeThemeMeta = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];

  const modeOptions: { id: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { id: 'system', label: 'Auto OS', icon: <Monitor className="w-3.5 h-3.5" /> },
    { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
  ];

  const TriggerIcon =
    themeMode === 'system' ? Monitor : resolvedScheme === 'dark' ? Moon : Sun;

  const updatePosition = () => {
    if (!triggerRef.current || typeof window === 'undefined') return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const margin = 12;

    let left =
      align === 'left'
        ? rect.left
        : rect.right - popoverWidth;
    left = Math.max(margin, Math.min(window.innerWidth - popoverWidth - margin, left));

    if (placement === 'top') {
      const bottom = window.innerHeight - rect.top + 8;
      const availableHeight = Math.max(240, rect.top - 24);
      setCoords({ left, bottom, maxHeight: Math.min(480, availableHeight) });
    } else {
      const top = rect.bottom + 8;
      const availableHeight = Math.max(240, window.innerHeight - top - 16);
      setCoords({ left, top, maxHeight: Math.min(480, availableHeight) });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const onResize = () => updatePosition();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, align, placement]);

  const cycleNextLiveTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = LIVE_THEMES.findIndex((t) => t.id === liveTheme);
    const next = LIVE_THEMES[(idx + 1) % LIVE_THEMES.length];
    setLiveTheme(next.id);
  };

  const popoverNode =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[90]"
              onClick={() => setIsOpen(false)}
            />
            <div
              role="dialog"
              aria-label="Theme & Live Screen Switcher"
              style={{
                position: 'fixed',
                left: coords.left,
                top: coords.top,
                bottom: coords.bottom,
                maxHeight: coords.maxHeight,
                width: 'min(320px, calc(100vw - 24px))',
              }}
              className="z-[100] flex flex-col bg-white/95 dark:bg-[#111622]/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 rounded-2xl shadow-2xl p-3.5 space-y-3 text-xs text-slate-800 dark:text-slate-200"
            >
              {/* Header + OS Sync Live Status */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                    <span className="truncate">Theme & Live Screen</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {themeMode === 'system'
                      ? `Watching OS (${osPrefersDark ? 'Dark' : 'Light'} active)`
                      : `Manual (${resolvedScheme === 'dark' ? 'Dark' : 'Light'})`}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={cycleNextLiveTheme}
                    title="Cycle to next live theme"
                    className="inline-flex items-center gap-0.5 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiveMotion(!liveMotion)}
                    title={liveMotion ? 'Pause live screen motion' : 'Enable live screen motion'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                      liveMotion
                        ? 'theme-accent-active'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {liveMotion ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{liveMotion ? 'Live' : 'Still'}</span>
                  </button>
                </div>
              </div>

              {/* 3-Way Color Scheme Mode */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shrink-0">
                {modeOptions.map((opt) => {
                  const active = themeMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setThemeMode(opt.id)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {opt.icon}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Live Screen Gallery */}
              <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
                  <span>Live Screen Backdrops</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeThemeMeta.name} ({LIVE_THEMES.length})
                  </span>
                </div>

                <div className="flex-1 min-h-0 space-y-1.5 overflow-y-auto pr-0.5">
                  {LIVE_THEMES.map((theme) => {
                    const isSelected = liveTheme === theme.id;
                    const bgPreview =
                      resolvedScheme === 'dark'
                        ? theme.darkPreviewGradient
                        : theme.lightPreviewGradient;

                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setLiveTheme(theme.id as LiveThemeId)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'theme-accent-active text-slate-900 dark:text-white'
                            : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className="w-12 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 dark:border-white/10 relative"
                          style={{ background: bgPreview }}
                        >
                          {theme.previewImage && (
                            <img
                              src={theme.previewImage}
                              alt={theme.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              className="w-full h-full object-cover"
                              style={{
                                filter: theme.isNocturnalPhoto
                                  ? resolvedScheme === 'dark'
                                    ? 'brightness(0.86) contrast(1.06)'
                                    : 'brightness(1.22) contrast(0.94) saturate(0.88)'
                                  : resolvedScheme === 'dark'
                                  ? 'brightness(0.45) contrast(1.15) saturate(0.8)'
                                  : 'none',
                              }}
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold truncate">{theme.name}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {theme.subtitle}
                          </div>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full py-1.5 text-center text-[11px] font-medium theme-accent-text hover:underline cursor-pointer border-t border-slate-200/70 dark:border-slate-800 pt-2 shrink-0"
                >
                  Open full Appearance Settings
                </button>
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Switch theme & live screen backdrop"
        aria-expanded={isOpen}
        title={`Theme: ${themeMode === 'system' ? `Auto (${resolvedScheme})` : themeMode} · ${activeThemeMeta.name} — Click to switch`}
        className={
          compact
            ? `p-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                isOpen
                  ? 'theme-accent-active'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`
            : `inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium backdrop-blur-md border transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0 ${
                isOpen
                  ? 'theme-accent-active'
                  : 'bg-white/75 dark:bg-slate-900/75 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
              }`
        }
      >
        <TriggerIcon className="w-3.5 h-3.5 theme-accent-text shrink-0" />
        {compact && triggerLabel ? (
          <span className="text-[11px] font-medium truncate max-w-[96px]">
            {triggerLabel}
          </span>
        ) : !compact ? (
          <span className="hidden sm:inline">
            {themeMode === 'system' ? 'Auto' : resolvedScheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        ) : null}
      </button>

      {popoverNode}
    </div>
  );
};
