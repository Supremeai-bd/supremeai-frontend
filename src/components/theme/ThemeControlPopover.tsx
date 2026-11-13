import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Play,
  Pause,
  Palette,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useThemeStore,
  LIVE_THEMES,
  ThemeMode,
  LiveThemeId,
  MotionSpeed,
  SurfaceTone,
  ScrimIntensity,
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
  const [showControlsTab, setShowControlsTab] = useState(false);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  }>({ left: 12, top: 60, maxHeight: 520 });

  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const themeMode = useThemeStore((s) => s.themeMode);
  const osPrefersDark = useThemeStore((s) => s.osPrefersDark);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const liveMotion = useThemeStore((s) => s.liveMotion);
  const overrideReducedMotion = useThemeStore((s) => s.overrideReducedMotion);
  const prefersReducedMotion = useThemeStore((s) => s.prefersReducedMotion);
  const motionSpeed = useThemeStore((s) => s.motionSpeed);
  const surfaceTone = useThemeStore((s) => s.surfaceTone);
  const scrimIntensity = useThemeStore((s) => s.scrimIntensity);
  const themeOptions = useThemeStore((s) => s.themeOptions);

  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const setLiveTheme = useThemeStore((s) => s.setLiveTheme);
  const setLiveMotion = useThemeStore((s) => s.setLiveMotion);
  const setOverrideReducedMotion = useThemeStore((s) => s.setOverrideReducedMotion);
  const setMotionSpeed = useThemeStore((s) => s.setMotionSpeed);
  const setSurfaceTone = useThemeStore((s) => s.setSurfaceTone);
  const setScrimIntensity = useThemeStore((s) => s.setScrimIntensity);
  const updateThemeOptions = useThemeStore((s) => s.updateThemeOptions);

  const activeThemeMeta = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];
  const isAnimating = liveMotion && (!prefersReducedMotion || overrideReducedMotion);

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
    const popoverWidth = Math.min(344, window.innerWidth - 24);
    const margin = 12;

    let left = align === 'left' ? rect.left : rect.right - popoverWidth;
    left = Math.max(margin, Math.min(window.innerWidth - popoverWidth - margin, left));

    if (placement === 'top') {
      const bottom = window.innerHeight - rect.top + 8;
      const availableHeight = Math.max(260, rect.top - 24);
      setCoords({ left, bottom, maxHeight: Math.min(540, availableHeight) });
    } else {
      const top = rect.bottom + 8;
      const availableHeight = Math.max(260, window.innerHeight - top - 16);
      setCoords({ left, top, maxHeight: Math.min(540, availableHeight) });
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

  const renderThemeSpecificOptions = () => {
    switch (liveTheme) {
      case 'alpine-dunes':
        return (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Atmosphere Tone
              </div>
              <div className="grid grid-cols-2 gap-1">
                {(['daylight', 'moonlit'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateThemeOptions({ alpineTime: opt })}
                    className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                      (themeOptions.alpineTime || 'daylight') === opt
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt === 'daylight' ? 'Sunlit Snow' : 'Moonlit Night'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Snowfall / Spindrift
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['gentle', 'brisk', 'off'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateThemeOptions({ snowIntensity: opt })}
                    className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                      (themeOptions.snowIntensity || 'gentle') === opt
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'misty-fjords':
        return (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Lake Water Ripples
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['calm', 'lively', 'off'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateThemeOptions({ waterRipple: opt })}
                    className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                      (themeOptions.waterRipple || 'lively') === opt
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Valley Mist Density
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['light', 'lively', 'dense'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateThemeOptions({ mistDensity: opt })}
                    className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                      (themeOptions.mistDensity || 'lively') === opt
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'emerald-highlands':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Forest Atmosphere Effect
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'fireflies', label: 'Fireflies' },
                  { id: 'rain', label: 'Rain' },
                  { id: 'mist', label: 'Mist Only' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateThemeOptions({ forestEffect: opt.id })}
                  className={`py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    (themeOptions.forestEffect || 'fireflies') === opt.id
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'amber-canyon':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Canyon Light & Dust Effect
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'heat-dust', label: 'Dust Motes' },
                  { id: 'sunbeams', label: 'Sunbeams' },
                  { id: 'mist', label: 'Desert Haze' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateThemeOptions({ canyonEffect: opt.id })}
                  className={`py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    (themeOptions.canyonEffect || 'heat-dust') === opt.id
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'midnight-peaks':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Night Sky Effect
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'shooting-stars', label: 'Meteors' },
                  { id: 'polar-glow', label: 'Polar Glow' },
                  { id: 'starfield', label: 'Starfield' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateThemeOptions({ midnightSky: opt.id })}
                  className={`py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    (themeOptions.midnightSky || 'shooting-stars') === opt.id
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'nebula':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Cosmic Star Motion
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'warp-stars', label: '3D Warp' },
                  { id: 'constellation', label: 'Constellation' },
                  { id: 'drift', label: 'Deep Drift' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateThemeOptions({ nebulaEffect: opt.id })}
                  className={`py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    (themeOptions.nebulaEffect || 'warp-stars') === opt.id
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'cyberpunk':
        return (
          <div className="space-y-2">
            <div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Matrix Neon Palette
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'neon-emerald', label: 'Green/Pink' },
                    { id: 'cyber-cyan', label: 'Cyan/Violet' },
                    { id: 'synth-amber', label: 'Amber/Red' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ cyberPalette: opt.id })}
                    className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium cursor-pointer ${
                      (themeOptions.cyberPalette || 'neon-emerald') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="grid grid-cols-3 gap-1 flex-1">
                {(['sparse', 'normal', 'overdrive'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updateThemeOptions({ cyberDensity: d })}
                    className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium capitalize cursor-pointer ${
                      (themeOptions.cyberDensity || 'normal') === d
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateThemeOptions({ cyberScanlines: themeOptions.cyberScanlines === false })
                }
                className={`py-1 px-2 rounded-lg border text-[10px] font-medium cursor-pointer ${
                  themeOptions.cyberScanlines !== false
                    ? 'theme-accent-active'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
              >
                CRT
              </button>
            </div>
          </div>
        );

      case 'aurora-borealis':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Aurora Curtain Palette
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: 'polar-emerald', label: 'Polar Green' },
                  { id: 'cosmic-violet', label: 'Violet Glow' },
                  { id: 'solar-crimson', label: 'Solar Red' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateThemeOptions({ auroraPalette: opt.id })}
                  className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium cursor-pointer ${
                    (themeOptions.auroraPalette || 'polar-emerald') === opt.id
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'oceanic-horizon':
        return (
          <div>
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              Ocean Wave Energy
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(['calm', 'rolling', 'choppy'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateThemeOptions({ oceanWaveEnergy: opt })}
                  className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                    (themeOptions.oceanWaveEnergy || 'rolling') === opt
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );

      case 'solar-meadow':
        return (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Sweeping Sunbeams & Rays
            </span>
            <button
              type="button"
              onClick={() =>
                updateThemeOptions({ dawnSunbeams: themeOptions.dawnSunbeams === false })
              }
              className={`py-1 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                themeOptions.dawnSunbeams !== false
                  ? 'theme-accent-active'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              {themeOptions.dawnSunbeams !== false ? 'On' : 'Off'}
            </button>
          </div>
        );

      case 'cyber-studio':
        return (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600 dark:text-slate-300">
              Autonomous Neural Mesh
            </span>
            <button
              type="button"
              onClick={() =>
                updateThemeOptions({ neuralMesh: themeOptions.neuralMesh === false })
              }
              className={`py-1 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                themeOptions.neuralMesh !== false
                  ? 'theme-accent-active'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}
            >
              {themeOptions.neuralMesh !== false ? 'Active' : 'Grid Only'}
            </button>
          </div>
        );
    }
  };

  const popoverNode =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setIsOpen(false)} />
            <div
              role="dialog"
              aria-label="Theme & Live Screen Switcher"
              style={{
                position: 'fixed',
                left: coords.left,
                top: coords.top,
                bottom: coords.bottom,
                maxHeight: coords.maxHeight,
                width: 'min(344px, calc(100vw - 24px))',
              }}
              className="z-[100] flex flex-col theme-surface-strong border rounded-2xl shadow-2xl p-3.5 space-y-2.5 text-xs text-slate-800 dark:text-slate-200"
            >
              {/* Header + Controls */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/70 dark:border-slate-800 shrink-0">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                    <span className="truncate">Theme & Live Screen</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {themeMode === 'system'
                      ? `OS Sync (${osPrefersDark ? 'Dark' : 'Light'})`
                      : `Manual (${resolvedScheme === 'dark' ? 'Dark' : 'Light'})`}{' '}
                    · {surfaceTone === 'adaptive' ? 'Tinted Glass' : 'B&W Classic'}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowControlsTab((v) => !v)}
                    title="Theme & animation options"
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                      showControlsTab
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Tune</span>
                  </button>

                  <button
                    type="button"
                    onClick={cycleNextLiveTheme}
                    title="Cycle to next live theme"
                    className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiveMotion(!liveMotion)}
                    title={isAnimating ? 'Pause live screen motion' : 'Enable live screen motion'}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                      isAnimating
                        ? 'theme-accent-active'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    <span>{isAnimating ? 'Live' : 'Still'}</span>
                  </button>
                </div>
              </div>

              {/* OS Reduced Motion Notice (if blocking animations) */}
              {prefersReducedMotion && !overrideReducedMotion && (
                <div className="p-2 rounded-xl bg-amber-500/12 border border-amber-500/30 flex items-center justify-between gap-2 text-[11px] text-amber-700 dark:text-amber-300 shrink-0">
                  <span className="truncate">OS Reduce Motion is pausing animations.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOverrideReducedMotion(true);
                      setLiveMotion(true);
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-semibold shrink-0 cursor-pointer"
                  >
                    Force Live
                  </button>
                </div>
              )}

              {/* 3-Way Color Scheme Mode */}
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shrink-0">
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

              {/* Either Tune Controls OR Live Screen Gallery */}
              {showControlsTab ? (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-0.5 py-0.5">
                  {/* Surface Tone: Adaptive vs B&W */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      UI Surface Color (Fix B&W Mismatch)
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {(
                        [
                          { id: 'adaptive' as SurfaceTone, label: 'Theme-Tinted Glass' },
                          { id: 'monochrome' as SurfaceTone, label: 'Classic B&W' },
                        ]
                      ).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSurfaceTone(t.id)}
                          className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                            surfaceTone === t.id
                              ? 'theme-accent-active'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Motion Speed */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Animation Speed
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['calm', 'normal', 'dynamic'] as MotionSpeed[]).map((sp) => (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => setMotionSpeed(sp)}
                          className={`py-1 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                            motionSpeed === sp
                              ? 'theme-accent-active'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {sp}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Scrim Visibility */}
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                      Backdrop Visibility in Chat
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: 'subtle' as ScrimIntensity, label: 'Vibrant' },
                          { id: 'balanced' as ScrimIntensity, label: 'Balanced' },
                          { id: 'focus' as ScrimIntensity, label: 'Focus' },
                        ]
                      ).map((sc) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => setScrimIntensity(sc.id)}
                          className={`py-1 px-2 rounded-lg border text-[11px] font-medium cursor-pointer ${
                            scrimIntensity === sc.id
                              ? 'theme-accent-active'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {sc.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Per-Theme Custom Options */}
                  <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="text-[10px] font-semibold uppercase tracking-wider theme-accent-text flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>{activeThemeMeta.name} Options</span>
                    </div>
                    {renderThemeSpecificOptions()}
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between shrink-0">
                    <span>Live Animated Screens</span>
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

                      const schemeMismatch =
                        (theme.recommendedScheme === 'dark' && resolvedScheme === 'light') ||
                        (theme.recommendedScheme === 'light' && resolvedScheme === 'dark');

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
                            className={`w-12 h-8 rounded-lg overflow-hidden shrink-0 border border-black/10 dark:border-white/10 relative ${
                              !theme.previewImage && isAnimating ? 'theme-preview-animated' : ''
                            }`}
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
                                      : 'brightness(1.16) contrast(0.95) saturate(0.9)'
                                    : resolvedScheme === 'dark'
                                    ? 'brightness(0.54) contrast(1.12) saturate(0.88)'
                                    : 'none',
                                }}
                              />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                              <span className="truncate">{theme.name}</span>
                              {schemeMismatch && (
                                <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 shrink-0">
                                  {theme.recommendedScheme === 'dark' ? 'Best Dark' : 'Best Light'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {theme.animationLabel}
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
              )}

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
