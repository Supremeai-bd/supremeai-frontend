import { create } from 'zustand';
import mistyFjordsBg from '../assets/images/bg_misty_fjords_1794588925307.jpg';
import emeraldHighlandsBg from '../assets/images/bg_emerald_highlands_1794588925886.jpg';
import amberCanyonBg from '../assets/images/bg_amber_canyon_1794588925843.jpg';
import obsidianPeaksBg from '../assets/images/bg_obsidian_peaks_1794588927192.jpg';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';
export type LiveThemeId =
  | 'alpine-dunes'
  | 'misty-fjords'
  | 'emerald-highlands'
  | 'amber-canyon'
  | 'midnight-peaks'
  | 'nebula'
  | 'cyberpunk'
  | 'aurora-borealis'
  | 'oceanic-horizon'
  | 'solar-meadow'
  | 'cyber-studio';

export interface ThemeAccentTokens {
  accent: string;
  accentHover: string;
  accentSoft: string;
  accentRing: string;
  accentContrast: string;
  accentGradient: string;
  accentSecondary: string;
}

export interface LiveThemeDefinition {
  id: LiveThemeId;
  name: string;
  subtitle: string;
  previewImage?: string;
  isNocturnalPhoto?: boolean;
  lightPreviewGradient: string;
  darkPreviewGradient: string;
  accentHex: string;
  tokens: {
    light: ThemeAccentTokens;
    dark: ThemeAccentTokens;
  };
}

export const LIVE_THEMES: LiveThemeDefinition[] = [
  {
    id: 'alpine-dunes',
    name: 'Alpine Dunes',
    subtitle: 'Sunlit snow dunes by day · Moonlit ridge by night',
    previewImage: '/assets/aistudio/image_09edce9c.png',
    lightPreviewGradient: 'linear-gradient(160deg, #9ec5df 0%, #dfeaf2 48%, #f2e5d4 100%)',
    darkPreviewGradient: 'linear-gradient(160deg, #0b162c 0%, #172a4a 52%, #1f293d 100%)',
    accentHex: '#0284c7',
    tokens: {
      light: {
        accent: '#0284c7',
        accentHover: '#0369a1',
        accentSoft: 'rgba(2, 132, 199, 0.12)',
        accentRing: 'rgba(2, 132, 199, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
        accentSecondary: '#2563eb',
      },
      dark: {
        accent: '#38bdf8',
        accentHover: '#0ea5e9',
        accentSoft: 'rgba(56, 189, 248, 0.16)',
        accentRing: 'rgba(56, 189, 248, 0.42)',
        accentContrast: '#062033',
        accentGradient: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
        accentSecondary: '#818cf8',
      },
    },
  },
  {
    id: 'misty-fjords',
    name: 'Misty Fjords',
    subtitle: 'Nordic granite cliffs & glassy dawn waters',
    previewImage: mistyFjordsBg,
    lightPreviewGradient: 'linear-gradient(165deg, #cbd5e1 0%, #e2e8f0 50%, #94a3b8 100%)',
    darkPreviewGradient: 'linear-gradient(165deg, #0b1420 0%, #18293d 52%, #0f172a 100%)',
    accentHex: '#0d9488',
    tokens: {
      light: {
        accent: '#0f766e',
        accentHover: '#115e59',
        accentSoft: 'rgba(15, 118, 110, 0.12)',
        accentRing: 'rgba(15, 118, 110, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #0f766e 0%, #0284c7 100%)',
        accentSecondary: '#0284c7',
      },
      dark: {
        accent: '#2dd4bf',
        accentHover: '#14b8a6',
        accentSoft: 'rgba(45, 212, 191, 0.16)',
        accentRing: 'rgba(45, 212, 191, 0.42)',
        accentContrast: '#042f2e',
        accentGradient: 'linear-gradient(135deg, #2dd4bf 0%, #38bdf8 100%)',
        accentSecondary: '#38bdf8',
      },
    },
  },
  {
    id: 'emerald-highlands',
    name: 'Emerald Highlands',
    subtitle: 'Misty pine valleys & deep forest stillness',
    previewImage: emeraldHighlandsBg,
    lightPreviewGradient: 'linear-gradient(160deg, #d1fae5 0%, #a7f3d0 45%, #3f6251 100%)',
    darkPreviewGradient: 'linear-gradient(160deg, #071913 0%, #0e2e24 52%, #13221d 100%)',
    accentHex: '#047857',
    tokens: {
      light: {
        accent: '#047857',
        accentHover: '#065f46',
        accentSoft: 'rgba(4, 120, 87, 0.12)',
        accentRing: 'rgba(4, 120, 87, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #047857 0%, #0d9488 100%)',
        accentSecondary: '#0d9488',
      },
      dark: {
        accent: '#34d399',
        accentHover: '#10b981',
        accentSoft: 'rgba(52, 211, 153, 0.16)',
        accentRing: 'rgba(52, 211, 153, 0.42)',
        accentContrast: '#022c22',
        accentGradient: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
        accentSecondary: '#2dd4bf',
      },
    },
  },
  {
    id: 'amber-canyon',
    name: 'Amber Canyon',
    subtitle: 'Sculpted sandstone ridges under golden light',
    previewImage: amberCanyonBg,
    lightPreviewGradient: 'linear-gradient(160deg, #fed7aa 0%, #fdba74 48%, #c2410c 100%)',
    darkPreviewGradient: 'linear-gradient(160deg, #1f110b 0%, #3a1d12 52%, #1c1412 100%)',
    accentHex: '#c2410c',
    tokens: {
      light: {
        accent: '#c2410c',
        accentHover: '#9a3412',
        accentSoft: 'rgba(194, 65, 12, 0.12)',
        accentRing: 'rgba(194, 65, 12, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #c2410c 0%, #d97706 100%)',
        accentSecondary: '#d97706',
      },
      dark: {
        accent: '#fb923c',
        accentHover: '#f97316',
        accentSoft: 'rgba(251, 146, 60, 0.16)',
        accentRing: 'rgba(251, 146, 60, 0.42)',
        accentContrast: '#2a1004',
        accentGradient: 'linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)',
        accentSecondary: '#fbbf24',
      },
    },
  },
  {
    id: 'midnight-peaks',
    name: 'Midnight Peaks',
    subtitle: 'Starlit alpine silhouettes & quiet indigo air',
    previewImage: obsidianPeaksBg,
    isNocturnalPhoto: true,
    lightPreviewGradient: 'linear-gradient(165deg, #cbd5e1 0%, #94a3b8 48%, #334155 100%)',
    darkPreviewGradient: 'linear-gradient(165deg, #050814 0%, #0f172a 52%, #1e1b4b 100%)',
    accentHex: '#4f46e5',
    tokens: {
      light: {
        accent: '#4338ca',
        accentHover: '#3730a3',
        accentSoft: 'rgba(67, 56, 202, 0.12)',
        accentRing: 'rgba(67, 56, 202, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 100%)',
        accentSecondary: '#6366f1',
      },
      dark: {
        accent: '#818cf8',
        accentHover: '#6366f1',
        accentSoft: 'rgba(129, 140, 248, 0.18)',
        accentRing: 'rgba(129, 140, 248, 0.44)',
        accentContrast: '#0f0e2c',
        accentGradient: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 100%)',
        accentSecondary: '#38bdf8',
      },
    },
  },
  {
    id: 'nebula',
    name: 'Nebula',
    subtitle: 'Deep indigo & violet cosmic nebula clouds',
    lightPreviewGradient: 'linear-gradient(145deg, #e0e7ff 0%, #c7d2fe 45%, #ddd6fe 100%)',
    darkPreviewGradient: 'linear-gradient(145deg, #070316 0%, #1e1145 48%, #3b0f6c 100%)',
    accentHex: '#6d28d9',
    tokens: {
      light: {
        accent: '#4f46e5',
        accentHover: '#4338ca',
        accentSoft: 'rgba(79, 70, 229, 0.13)',
        accentRing: 'rgba(124, 58, 237, 0.38)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #9333ea 100%)',
        accentSecondary: '#7c3aed',
      },
      dark: {
        accent: '#a78bfa',
        accentHover: '#8b5cf6',
        accentSoft: 'rgba(139, 92, 246, 0.22)',
        accentRing: 'rgba(167, 139, 250, 0.48)',
        accentContrast: '#100528',
        accentGradient: 'linear-gradient(135deg, #818cf8 0%, #a855f7 55%, #c084fc 100%)',
        accentSecondary: '#c084fc',
      },
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    subtitle: 'Neon green & magenta digital-matrix rain',
    lightPreviewGradient: 'linear-gradient(150deg, #ecfdf5 0%, #a7f3d0 45%, #f5d0fe 100%)',
    darkPreviewGradient: 'linear-gradient(150deg, #020806 0%, #051b12 48%, #280624 100%)',
    accentHex: '#10b981',
    tokens: {
      light: {
        accent: '#047857',
        accentHover: '#065f46',
        accentSoft: 'rgba(4, 120, 87, 0.13)',
        accentRing: 'rgba(192, 38, 211, 0.40)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #047857 0%, #059669 48%, #a21caf 100%)',
        accentSecondary: '#c026d3',
      },
      dark: {
        accent: '#22ff88',
        accentHover: '#00e676',
        accentSoft: 'rgba(34, 255, 136, 0.16)',
        accentRing: 'rgba(255, 42, 212, 0.48)',
        accentContrast: '#03160d',
        accentGradient: 'linear-gradient(135deg, #22ff88 0%, #00e5a3 45%, #ff2ad4 100%)',
        accentSecondary: '#ff2ad4',
      },
    },
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    subtitle: 'Flowing polar ribbons & celestial mist',
    lightPreviewGradient: 'linear-gradient(145deg, #d7f2ef 0%, #cfe4f7 52%, #e6def8 100%)',
    darkPreviewGradient: 'linear-gradient(145deg, #05121d 0%, #0a2e38 48%, #1e163b 100%)',
    accentHex: '#059669',
    tokens: {
      light: {
        accent: '#059669',
        accentHover: '#047857',
        accentSoft: 'rgba(5, 150, 105, 0.12)',
        accentRing: 'rgba(5, 150, 105, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
        accentSecondary: '#0d9488',
      },
      dark: {
        accent: '#34d399',
        accentHover: '#10b981',
        accentSoft: 'rgba(52, 211, 153, 0.16)',
        accentRing: 'rgba(52, 211, 153, 0.42)',
        accentContrast: '#022c22',
        accentGradient: 'linear-gradient(135deg, #34d399 0%, #22d3ee 100%)',
        accentSecondary: '#22d3ee',
      },
    },
  },
  {
    id: 'oceanic-horizon',
    name: 'Pacific Horizon',
    subtitle: 'Living coastal swells & distant haze',
    lightPreviewGradient: 'linear-gradient(170deg, #bae6fd 0%, #e0f2fe 50%, #cbd5e1 100%)',
    darkPreviewGradient: 'linear-gradient(170deg, #061325 0%, #0b2942 52%, #0f172a 100%)',
    accentHex: '#0369a1',
    tokens: {
      light: {
        accent: '#0369a1',
        accentHover: '#075985',
        accentSoft: 'rgba(3, 105, 161, 0.12)',
        accentRing: 'rgba(3, 105, 161, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        accentSecondary: '#0284c7',
      },
      dark: {
        accent: '#22d3ee',
        accentHover: '#06b6d4',
        accentSoft: 'rgba(34, 211, 238, 0.16)',
        accentRing: 'rgba(34, 211, 238, 0.42)',
        accentContrast: '#083344',
        accentGradient: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 100%)',
        accentSecondary: '#3b82f6',
      },
    },
  },
  {
    id: 'solar-meadow',
    name: 'Golden Dawn',
    subtitle: 'Warm horizon rays & drifting light motes',
    lightPreviewGradient: 'linear-gradient(155deg, #dbeafe 0%, #fef3c7 55%, #fde68a 100%)',
    darkPreviewGradient: 'linear-gradient(155deg, #111827 0%, #291d2e 55%, #3b2416 100%)',
    accentHex: '#d97706',
    tokens: {
      light: {
        accent: '#d97706',
        accentHover: '#b45309',
        accentSoft: 'rgba(217, 119, 6, 0.12)',
        accentRing: 'rgba(217, 119, 6, 0.38)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #d97706 0%, #ea580c 100%)',
        accentSecondary: '#ea580c',
      },
      dark: {
        accent: '#fbbf24',
        accentHover: '#f59e0b',
        accentSoft: 'rgba(251, 191, 36, 0.16)',
        accentRing: 'rgba(251, 191, 36, 0.42)',
        accentContrast: '#1c1917',
        accentGradient: 'linear-gradient(135deg, #fbbf24 0%, #fb7185 100%)',
        accentSecondary: '#fb7185',
      },
    },
  },
  {
    id: 'cyber-studio',
    name: 'Studio Neural',
    subtitle: 'Classic geometric grid & reactive neural wave',
    lightPreviewGradient: 'linear-gradient(155deg, #f8fafc 0%, #e0f2fe 55%, #ede9fe 100%)',
    darkPreviewGradient: 'linear-gradient(155deg, #080b11 0%, #0f172a 55%, #1e1b4b 100%)',
    accentHex: '#0891b2',
    tokens: {
      light: {
        accent: '#0891b2',
        accentHover: '#0e7490',
        accentSoft: 'rgba(8, 145, 178, 0.12)',
        accentRing: 'rgba(8, 145, 178, 0.36)',
        accentContrast: '#ffffff',
        accentGradient: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
        accentSecondary: '#3b82f6',
      },
      dark: {
        accent: '#22d3ee',
        accentHover: '#06b6d4',
        accentSoft: 'rgba(34, 211, 238, 0.16)',
        accentRing: 'rgba(34, 211, 238, 0.42)',
        accentContrast: '#082f49',
        accentGradient: 'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
        accentSecondary: '#8b5cf6',
      },
    },
  },
];

const THEME_STORAGE_KEY = 'supremeai_studio_theme_v2';

interface PersistedThemeConfig {
  themeMode: ThemeMode;
  liveTheme: LiveThemeId;
  liveMotion: boolean;
}

const getInitialOsDark = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const getInitialReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const loadPersistedConfig = (): PersistedThemeConfig => {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const validModes: ThemeMode[] = ['system', 'light', 'dark'];
      const validThemes: LiveThemeId[] = LIVE_THEMES.map((t) => t.id);
      return {
        themeMode: validModes.includes(parsed.themeMode) ? parsed.themeMode : 'system',
        liveTheme: validThemes.includes(parsed.liveTheme) ? parsed.liveTheme : 'alpine-dunes',
        liveMotion: typeof parsed.liveMotion === 'boolean' ? parsed.liveMotion : true,
      };
    }

    const legacy = localStorage.getItem('supremeai_studio_theme');
    if (legacy === 'light' || legacy === 'dark') {
      return {
        themeMode: 'system',
        liveTheme: 'alpine-dunes',
        liveMotion: true,
      };
    }
  } catch {
    // Ignore storage read failures
  }

  return {
    themeMode: 'system',
    liveTheme: 'alpine-dunes',
    liveMotion: true,
  };
};

const savePersistedConfig = (cfg: PersistedThemeConfig) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // Ignore storage write failures
  }
};

let themeTransitionTimer: ReturnType<typeof setTimeout> | null = null;

export const getThemeTokens = (
  liveTheme: LiveThemeId,
  resolvedScheme: ResolvedColorScheme
): ThemeAccentTokens => {
  const def = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];
  return def.tokens[resolvedScheme];
};

export const applyThemeToDom = (
  resolvedScheme: ResolvedColorScheme,
  themeMode: ThemeMode,
  liveTheme: LiveThemeId,
  animateTransition: boolean = false
) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  if (animateTransition) {
    root.classList.add('theme-transitioning');
    if (themeTransitionTimer) clearTimeout(themeTransitionTimer);
    themeTransitionTimer = setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 520);
  }

  if (resolvedScheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  root.style.colorScheme = resolvedScheme;
  root.dataset.themeMode = themeMode;
  root.dataset.liveTheme = liveTheme;

  const tokens = getThemeTokens(liveTheme, resolvedScheme);
  root.style.setProperty('--theme-accent', tokens.accent);
  root.style.setProperty('--theme-accent-hover', tokens.accentHover);
  root.style.setProperty('--theme-accent-soft', tokens.accentSoft);
  root.style.setProperty('--theme-accent-ring', tokens.accentRing);
  root.style.setProperty('--theme-accent-contrast', tokens.accentContrast);
  root.style.setProperty('--theme-accent-gradient', tokens.accentGradient);
  root.style.setProperty('--theme-accent-secondary', tokens.accentSecondary);
};

interface ThemeStoreState {
  themeMode: ThemeMode;
  osPrefersDark: boolean;
  resolvedScheme: ResolvedColorScheme;
  liveTheme: LiveThemeId;
  liveMotion: boolean;
  prefersReducedMotion: boolean;
  lastSyncedAt: number | null;
  accentTokens: ThemeAccentTokens;

  setThemeMode: (mode: ThemeMode) => void;
  cycleThemeMode: () => void;
  setLiveTheme: (theme: LiveThemeId) => void;
  setLiveMotion: (enabled: boolean) => void;
  setOsPrefersDark: (prefersDark: boolean, animate?: boolean) => void;
  setPrefersReducedMotion: (reduced: boolean) => void;
}

const initialConfig = loadPersistedConfig();
const initialOsDark = getInitialOsDark();
const initialResolved: ResolvedColorScheme =
  initialConfig.themeMode === 'system'
    ? initialOsDark
      ? 'dark'
      : 'light'
    : initialConfig.themeMode;

applyThemeToDom(initialResolved, initialConfig.themeMode, initialConfig.liveTheme, false);

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  themeMode: initialConfig.themeMode,
  osPrefersDark: initialOsDark,
  resolvedScheme: initialResolved,
  liveTheme: initialConfig.liveTheme,
  liveMotion: initialConfig.liveMotion,
  prefersReducedMotion: getInitialReducedMotion(),
  lastSyncedAt: Date.now(),
  accentTokens: getThemeTokens(initialConfig.liveTheme, initialResolved),

  setThemeMode: (themeMode) => {
    const { osPrefersDark, liveTheme, liveMotion } = get();
    const resolvedScheme: ResolvedColorScheme =
      themeMode === 'system' ? (osPrefersDark ? 'dark' : 'light') : themeMode;

    applyThemeToDom(resolvedScheme, themeMode, liveTheme, true);
    savePersistedConfig({ themeMode, liveTheme, liveMotion });

    set({
      themeMode,
      resolvedScheme,
      accentTokens: getThemeTokens(liveTheme, resolvedScheme),
      lastSyncedAt: Date.now(),
    });
  },

  cycleThemeMode: () => {
    const current = get().themeMode;
    const nextOrder: Record<ThemeMode, ThemeMode> = {
      system: 'light',
      light: 'dark',
      dark: 'system',
    };
    get().setThemeMode(nextOrder[current]);
  },

  setLiveTheme: (liveTheme) => {
    const { themeMode, resolvedScheme, liveMotion } = get();
    applyThemeToDom(resolvedScheme, themeMode, liveTheme, true);
    savePersistedConfig({ themeMode, liveTheme, liveMotion });
    set({
      liveTheme,
      accentTokens: getThemeTokens(liveTheme, resolvedScheme),
    });
  },

  setLiveMotion: (liveMotion) => {
    const { themeMode, liveTheme } = get();
    savePersistedConfig({ themeMode, liveTheme, liveMotion });
    set({ liveMotion });
  },

  setOsPrefersDark: (osPrefersDark, animate = true) => {
    const { themeMode, liveTheme } = get();
    const resolvedScheme: ResolvedColorScheme =
      themeMode === 'system' ? (osPrefersDark ? 'dark' : 'light') : themeMode;

    applyThemeToDom(resolvedScheme, themeMode, liveTheme, animate);
    set({
      osPrefersDark,
      resolvedScheme,
      accentTokens: getThemeTokens(liveTheme, resolvedScheme),
      lastSyncedAt: Date.now(),
    });
  },

  setPrefersReducedMotion: (prefersReducedMotion) => {
    set({ prefersReducedMotion });
  },
}));
