import { create } from 'zustand';
import alpineDunesBg from '../assets/images/bg_alpine_dunes_clean_1794595839927.jpg';
import mistyFjordsBg from '../assets/images/bg_misty_fjords_1794588925307.jpg';
import emeraldHighlandsBg from '../assets/images/bg_emerald_highlands_1794588925886.jpg';
import amberCanyonBg from '../assets/images/bg_amber_canyon_1794588925843.jpg';
import obsidianPeaksBg from '../assets/images/bg_obsidian_peaks_1794588927192.jpg';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedColorScheme = 'light' | 'dark';
export type SurfaceTone = 'adaptive' | 'monochrome';
export type MotionSpeed = 'calm' | 'normal' | 'dynamic';
export type ScrimIntensity = 'subtle' | 'balanced' | 'focus';

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

export interface ThemeSurfaceTokens {
  surfaceGlass: string;
  surfaceStrong: string;
  surfaceSidebar: string;
  surfaceInput: string;
  surfaceBorder: string;
  scrimOverlay: string;
  cardShadow: string;
}

export interface ThemeBackdropNoiseConfig {
  enabled: boolean;
  opacityLight: number;
  opacityDark: number;
  blendMode: 'overlay' | 'soft-light' | 'screen';
  baseFrequency: number;
}

export interface ThemeBackdropGridConfig {
  enabled: boolean;
  cellSizePx: number;
  opacityLight: number;
  opacityDark: number;
  colorLight: string;
  colorDark: string;
}

export interface ThemeBackdropAnimationConfig {
  canvasSpeed: number;
  gradientDurationSec: number;
  gridDurationSec: number;
  photoBreathScale: number;
  photoDriftPx: number;
}

export interface ThemeBackdropConfig {
  aesthetic: string;
  baseGradient: {
    light: string;
    dark: string;
  };
  radialOverlays: {
    light: string[];
    dark: string[];
  };
  vignette: {
    light: string;
    dark: string;
  };
  noiseOverlay: ThemeBackdropNoiseConfig;
  particleDensity: {
    count: number;
    secondaryCount: number;
    glowIntensity: number;
  };
  animationSpeed: ThemeBackdropAnimationConfig;
  gridOverlay?: ThemeBackdropGridConfig;
}

export const MOTION_SPEED_MULTIPLIER: Record<MotionSpeed, number> = {
  calm: 0.55,
  normal: 1.0,
  dynamic: 1.65,
};

export interface ThemeSpecificOptions {
  // Alpine Dunes
  alpineTime?: 'daylight' | 'moonlit';
  snowIntensity?: 'gentle' | 'brisk' | 'off';
  // Misty Fjords
  waterRipple?: 'calm' | 'lively' | 'off';
  mistDensity?: 'light' | 'lively' | 'dense';
  // Emerald Highlands
  forestEffect?: 'fireflies' | 'rain' | 'mist';
  // Amber Canyon
  canyonEffect?: 'heat-dust' | 'sunbeams' | 'mist';
  // Midnight Peaks
  midnightSky?: 'shooting-stars' | 'polar-glow' | 'starfield';
  // Nebula
  nebulaEffect?: 'warp-stars' | 'constellation' | 'drift';
  // Cyberpunk
  cyberPalette?: 'neon-emerald' | 'cyber-cyan' | 'synth-amber';
  cyberDensity?: 'sparse' | 'normal' | 'overdrive';
  cyberScanlines?: boolean;
  // Aurora Borealis
  auroraPalette?: 'polar-emerald' | 'cosmic-violet' | 'solar-crimson';
  // Pacific Horizon
  oceanWaveEnergy?: 'calm' | 'rolling' | 'choppy';
  // Golden Dawn
  dawnSunbeams?: boolean;
  // Studio Neural
  neuralMesh?: boolean;
}

export const DEFAULT_THEME_OPTIONS: ThemeSpecificOptions = {
  alpineTime: 'daylight',
  snowIntensity: 'gentle',
  waterRipple: 'lively',
  mistDensity: 'lively',
  forestEffect: 'fireflies',
  canyonEffect: 'heat-dust',
  midnightSky: 'shooting-stars',
  nebulaEffect: 'warp-stars',
  cyberPalette: 'neon-emerald',
  cyberDensity: 'normal',
  cyberScanlines: true,
  auroraPalette: 'polar-emerald',
  oceanWaveEnergy: 'rolling',
  dawnSunbeams: true,
  neuralMesh: true,
};

export interface LiveThemeDefinition {
  id: LiveThemeId;
  name: string;
  subtitle: string;
  previewImage?: string;
  isNocturnalPhoto?: boolean;
  recommendedScheme: 'dark' | 'light' | 'both';
  schemeBadge?: string;
  animationLabel: string;
  lightPreviewGradient: string;
  darkPreviewGradient: string;
  accentHex: string;
  tokens: {
    light: ThemeAccentTokens;
    dark: ThemeAccentTokens;
  };
  surfaces: {
    light: ThemeSurfaceTokens;
    dark: ThemeSurfaceTokens;
  };
}

export const LIVE_THEMES: LiveThemeDefinition[] = [
  {
    id: 'alpine-dunes',
    name: 'Alpine Dunes',
    subtitle: 'Sunlit snow dunes & drifting spindrift snow',
    previewImage: alpineDunesBg,
    recommendedScheme: 'light',
    schemeBadge: 'Daylight / Moonlit',
    animationLabel: 'Drifting Snow & Spindrift',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(244, 249, 255, 0.78)',
        surfaceStrong: 'rgba(248, 252, 255, 0.92)',
        surfaceSidebar: 'rgba(238, 246, 253, 0.74)',
        surfaceInput: 'rgba(255, 255, 255, 0.86)',
        surfaceBorder: 'rgba(148, 197, 232, 0.45)',
        scrimOverlay: 'rgba(235, 245, 255, 0.56)',
        cardShadow: '0 8px 30px -6px rgba(2, 132, 199, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(11, 22, 42, 0.76)',
        surfaceStrong: 'rgba(14, 27, 50, 0.92)',
        surfaceSidebar: 'rgba(9, 18, 36, 0.78)',
        surfaceInput: 'rgba(15, 29, 54, 0.84)',
        surfaceBorder: 'rgba(56, 189, 248, 0.22)',
        scrimOverlay: 'rgba(7, 15, 30, 0.64)',
        cardShadow: '0 8px 30px -6px rgba(14, 165, 233, 0.18)',
      },
    },
  },
  {
    id: 'misty-fjords',
    name: 'Misty Fjords',
    subtitle: 'Nordic granite cliffs & live lake ripples',
    previewImage: mistyFjordsBg,
    recommendedScheme: 'both',
    schemeBadge: 'Balanced Light & Dark',
    animationLabel: 'Water Ripples & Valley Fog',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(241, 247, 248, 0.78)',
        surfaceStrong: 'rgba(246, 251, 252, 0.92)',
        surfaceSidebar: 'rgba(232, 242, 244, 0.75)',
        surfaceInput: 'rgba(250, 254, 255, 0.86)',
        surfaceBorder: 'rgba(94, 168, 164, 0.36)',
        scrimOverlay: 'rgba(232, 242, 246, 0.54)',
        cardShadow: '0 8px 30px -6px rgba(15, 118, 110, 0.12)',
      },
      dark: {
        surfaceGlass: 'rgba(11, 22, 32, 0.76)',
        surfaceStrong: 'rgba(14, 28, 40, 0.92)',
        surfaceSidebar: 'rgba(9, 18, 28, 0.78)',
        surfaceInput: 'rgba(15, 30, 44, 0.84)',
        surfaceBorder: 'rgba(45, 212, 191, 0.20)',
        scrimOverlay: 'rgba(6, 14, 22, 0.64)',
        cardShadow: '0 8px 30px -6px rgba(20, 184, 166, 0.16)',
      },
    },
  },
  {
    id: 'emerald-highlands',
    name: 'Emerald Highlands',
    subtitle: 'Misty pine valleys, fireflies & forest rain',
    previewImage: emeraldHighlandsBg,
    recommendedScheme: 'dark',
    schemeBadge: 'Forest Tinted Glass',
    animationLabel: 'Fireflies / Forest Rain & Mist',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(236, 249, 243, 0.80)',
        surfaceStrong: 'rgba(242, 252, 247, 0.93)',
        surfaceSidebar: 'rgba(226, 244, 235, 0.76)',
        surfaceInput: 'rgba(247, 253, 250, 0.86)',
        surfaceBorder: 'rgba(52, 168, 124, 0.34)',
        scrimOverlay: 'rgba(225, 245, 235, 0.52)',
        cardShadow: '0 8px 30px -6px rgba(4, 120, 87, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(7, 24, 18, 0.76)',
        surfaceStrong: 'rgba(10, 32, 24, 0.92)',
        surfaceSidebar: 'rgba(6, 20, 15, 0.80)',
        surfaceInput: 'rgba(12, 36, 27, 0.84)',
        surfaceBorder: 'rgba(52, 211, 153, 0.22)',
        scrimOverlay: 'rgba(4, 15, 11, 0.62)',
        cardShadow: '0 8px 30px -6px rgba(16, 185, 129, 0.18)',
      },
    },
  },
  {
    id: 'amber-canyon',
    name: 'Amber Canyon',
    subtitle: 'Golden sandstone ridges, dust & sunbeams',
    previewImage: amberCanyonBg,
    recommendedScheme: 'both',
    schemeBadge: 'Warm Sepia Glass',
    animationLabel: 'Golden Dust Motes & Sunbeams',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(255, 247, 237, 0.80)',
        surfaceStrong: 'rgba(255, 250, 243, 0.93)',
        surfaceSidebar: 'rgba(253, 240, 224, 0.78)',
        surfaceInput: 'rgba(255, 251, 245, 0.88)',
        surfaceBorder: 'rgba(234, 138, 72, 0.38)',
        scrimOverlay: 'rgba(254, 241, 224, 0.50)',
        cardShadow: '0 8px 30px -6px rgba(194, 65, 12, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(28, 16, 11, 0.78)',
        surfaceStrong: 'rgba(38, 21, 14, 0.92)',
        surfaceSidebar: 'rgba(23, 13, 9, 0.82)',
        surfaceInput: 'rgba(42, 24, 16, 0.85)',
        surfaceBorder: 'rgba(251, 146, 60, 0.24)',
        scrimOverlay: 'rgba(18, 10, 7, 0.62)',
        cardShadow: '0 8px 30px -6px rgba(249, 115, 22, 0.18)',
      },
    },
  },
  {
    id: 'midnight-peaks',
    name: 'Midnight Peaks',
    subtitle: 'Starlit alpine silhouettes & shooting stars',
    previewImage: obsidianPeaksBg,
    isNocturnalPhoto: true,
    recommendedScheme: 'dark',
    schemeBadge: 'Best in Dark / Dusk',
    animationLabel: 'Shooting Stars & Night Sky',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(232, 236, 248, 0.80)',
        surfaceStrong: 'rgba(239, 242, 252, 0.92)',
        surfaceSidebar: 'rgba(224, 230, 245, 0.78)',
        surfaceInput: 'rgba(244, 246, 253, 0.86)',
        surfaceBorder: 'rgba(129, 140, 248, 0.36)',
        scrimOverlay: 'rgba(218, 224, 242, 0.48)',
        cardShadow: '0 8px 30px -6px rgba(67, 56, 202, 0.15)',
      },
      dark: {
        surfaceGlass: 'rgba(9, 12, 28, 0.76)',
        surfaceStrong: 'rgba(13, 17, 38, 0.92)',
        surfaceSidebar: 'rgba(7, 10, 24, 0.80)',
        surfaceInput: 'rgba(15, 20, 44, 0.84)',
        surfaceBorder: 'rgba(129, 140, 248, 0.24)',
        scrimOverlay: 'rgba(4, 7, 18, 0.60)',
        cardShadow: '0 8px 30px -6px rgba(99, 102, 241, 0.22)',
      },
    },
  },
  {
    id: 'nebula',
    name: 'Nebula',
    subtitle: '3D flying starfield & swirling cosmic dust',
    recommendedScheme: 'dark',
    schemeBadge: 'Best in Dark / Dusk',
    animationLabel: '3D Starfield & Pulsar Rings',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(238, 234, 254, 0.80)',
        surfaceStrong: 'rgba(244, 241, 255, 0.92)',
        surfaceSidebar: 'rgba(231, 226, 252, 0.78)',
        surfaceInput: 'rgba(247, 245, 255, 0.88)',
        surfaceBorder: 'rgba(139, 92, 246, 0.34)',
        scrimOverlay: 'rgba(229, 223, 252, 0.46)',
        cardShadow: '0 8px 30px -6px rgba(109, 40, 217, 0.16)',
      },
      dark: {
        surfaceGlass: 'rgba(16, 8, 36, 0.76)',
        surfaceStrong: 'rgba(22, 11, 48, 0.92)',
        surfaceSidebar: 'rgba(12, 6, 28, 0.80)',
        surfaceInput: 'rgba(25, 13, 54, 0.84)',
        surfaceBorder: 'rgba(167, 139, 250, 0.26)',
        scrimOverlay: 'rgba(8, 3, 22, 0.58)',
        cardShadow: '0 8px 30px -6px rgba(168, 85, 247, 0.24)',
      },
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    subtitle: 'Live digital-matrix rain & neon grid HUD',
    recommendedScheme: 'dark',
    schemeBadge: 'Best in Dark',
    animationLabel: 'Matrix Glyph Rain & Scanlines',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(232, 250, 242, 0.80)',
        surfaceStrong: 'rgba(239, 253, 247, 0.92)',
        surfaceSidebar: 'rgba(222, 246, 236, 0.78)',
        surfaceInput: 'rgba(244, 254, 250, 0.88)',
        surfaceBorder: 'rgba(16, 185, 129, 0.36)',
        scrimOverlay: 'rgba(226, 248, 238, 0.46)',
        cardShadow: '0 8px 30px -6px rgba(16, 185, 129, 0.16)',
      },
      dark: {
        surfaceGlass: 'rgba(4, 16, 12, 0.78)',
        surfaceStrong: 'rgba(6, 22, 16, 0.92)',
        surfaceSidebar: 'rgba(3, 12, 9, 0.82)',
        surfaceInput: 'rgba(8, 26, 19, 0.85)',
        surfaceBorder: 'rgba(34, 255, 136, 0.28)',
        scrimOverlay: 'rgba(2, 10, 7, 0.56)',
        cardShadow: '0 0 28px -6px rgba(34, 255, 136, 0.22)',
      },
    },
  },
  {
    id: 'aurora-borealis',
    name: 'Aurora Borealis',
    subtitle: 'Dancing polar light curtains & arctic mist',
    recommendedScheme: 'dark',
    schemeBadge: 'Best in Dark',
    animationLabel: 'Polar Aurora Curtains & Stars',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(228, 246, 244, 0.80)',
        surfaceStrong: 'rgba(238, 250, 249, 0.92)',
        surfaceSidebar: 'rgba(220, 242, 240, 0.78)',
        surfaceInput: 'rgba(244, 252, 251, 0.88)',
        surfaceBorder: 'rgba(20, 184, 166, 0.34)',
        scrimOverlay: 'rgba(220, 242, 242, 0.46)',
        cardShadow: '0 8px 30px -6px rgba(13, 148, 136, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(6, 20, 28, 0.76)',
        surfaceStrong: 'rgba(8, 26, 36, 0.92)',
        surfaceSidebar: 'rgba(5, 16, 24, 0.80)',
        surfaceInput: 'rgba(10, 30, 42, 0.84)',
        surfaceBorder: 'rgba(52, 211, 153, 0.24)',
        scrimOverlay: 'rgba(4, 12, 20, 0.56)',
        cardShadow: '0 8px 30px -6px rgba(34, 211, 238, 0.20)',
      },
    },
  },
  {
    id: 'oceanic-horizon',
    name: 'Pacific Horizon',
    subtitle: 'Rolling ocean waves & shimmering moonlight',
    recommendedScheme: 'both',
    schemeBadge: 'Coastal Tinted Glass',
    animationLabel: 'Continuous Ocean Waves',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(232, 246, 255, 0.80)',
        surfaceStrong: 'rgba(241, 250, 255, 0.92)',
        surfaceSidebar: 'rgba(222, 240, 252, 0.78)',
        surfaceInput: 'rgba(247, 252, 255, 0.88)',
        surfaceBorder: 'rgba(56, 189, 248, 0.36)',
        scrimOverlay: 'rgba(224, 242, 254, 0.48)',
        cardShadow: '0 8px 30px -6px rgba(3, 105, 161, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(6, 20, 38, 0.76)',
        surfaceStrong: 'rgba(9, 27, 50, 0.92)',
        surfaceSidebar: 'rgba(5, 16, 32, 0.80)',
        surfaceInput: 'rgba(11, 32, 58, 0.84)',
        surfaceBorder: 'rgba(34, 211, 238, 0.24)',
        scrimOverlay: 'rgba(4, 12, 24, 0.58)',
        cardShadow: '0 8px 30px -6px rgba(34, 211, 238, 0.18)',
      },
    },
  },
  {
    id: 'solar-meadow',
    name: 'Golden Dawn',
    subtitle: 'Sweeping sunbeams, twilight hills & motes',
    recommendedScheme: 'light',
    schemeBadge: 'Warm Dawn Glass',
    animationLabel: 'Sweeping Sunbeams & Motes',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(254, 249, 236, 0.80)',
        surfaceStrong: 'rgba(255, 251, 242, 0.93)',
        surfaceSidebar: 'rgba(252, 243, 224, 0.78)',
        surfaceInput: 'rgba(255, 252, 246, 0.88)',
        surfaceBorder: 'rgba(245, 158, 11, 0.34)',
        scrimOverlay: 'rgba(253, 243, 220, 0.48)',
        cardShadow: '0 8px 30px -6px rgba(217, 119, 6, 0.14)',
      },
      dark: {
        surfaceGlass: 'rgba(28, 20, 26, 0.76)',
        surfaceStrong: 'rgba(38, 26, 34, 0.92)',
        surfaceSidebar: 'rgba(22, 16, 22, 0.80)',
        surfaceInput: 'rgba(42, 28, 36, 0.84)',
        surfaceBorder: 'rgba(251, 191, 36, 0.22)',
        scrimOverlay: 'rgba(18, 13, 18, 0.58)',
        cardShadow: '0 8px 30px -6px rgba(245, 158, 11, 0.18)',
      },
    },
  },
  {
    id: 'cyber-studio',
    name: 'Studio Neural',
    subtitle: 'Autonomous neural network & travelling pulses',
    recommendedScheme: 'both',
    schemeBadge: 'Classic Light & Dark',
    animationLabel: 'Neural Network Data Pulses',
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
    surfaces: {
      light: {
        surfaceGlass: 'rgba(255, 255, 255, 0.82)',
        surfaceStrong: 'rgba(255, 255, 255, 0.94)',
        surfaceSidebar: 'rgba(255, 255, 255, 0.74)',
        surfaceInput: 'rgba(255, 255, 255, 0.86)',
        surfaceBorder: 'rgba(6, 182, 212, 0.22)',
        scrimOverlay: 'rgba(248, 250, 252, 0.45)',
        cardShadow: '0 8px 28px -6px rgba(15, 23, 42, 0.08)',
      },
      dark: {
        surfaceGlass: 'rgba(11, 15, 25, 0.80)',
        surfaceStrong: 'rgba(15, 20, 34, 0.92)',
        surfaceSidebar: 'rgba(13, 17, 28, 0.80)',
        surfaceInput: 'rgba(20, 25, 38, 0.84)',
        surfaceBorder: 'rgba(34, 211, 238, 0.20)',
        scrimOverlay: 'rgba(8, 11, 17, 0.52)',
        cardShadow: '0 8px 28px -6px rgba(0, 0, 0, 0.45)',
      },
    },
  },
];

export const THEME_BACKDROP_CONFIGS: Record<LiveThemeId, ThemeBackdropConfig> = {
  'alpine-dunes': {
    aesthetic: 'arctic-crystalline',
    baseGradient: {
      light: 'linear-gradient(160deg, #9ec5df 0%, #dfeaf2 48%, #f2e5d4 100%)',
      dark: 'linear-gradient(160deg, #0b162c 0%, #172a4a 52%, #1f293d 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 75% 55% at 78% 18%, rgba(255, 248, 232, 0.42) 0%, rgba(186, 230, 253, 0.16) 45%, transparent 75%)',
        'radial-gradient(ellipse 65% 48% at 18% 82%, rgba(125, 211, 252, 0.24) 0%, transparent 70%)',
      ],
      dark: [
        'radial-gradient(ellipse 68% 50% at 76% 18%, rgba(56, 189, 248, 0.22) 0%, rgba(129, 140, 248, 0.10) 45%, transparent 75%)',
        'radial-gradient(ellipse 70% 45% at 22% 85%, rgba(14, 116, 144, 0.20) 0%, transparent 72%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, rgba(148, 197, 232, 0.22) 100%)',
      dark: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 50%, rgba(4, 10, 24, 0.55) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.035,
      opacityDark: 0.055,
      blendMode: 'soft-light',
      baseFrequency: 0.85,
    },
    particleDensity: {
      count: 72,
      secondaryCount: 12,
      glowIntensity: 0.75,
    },
    animationSpeed: {
      canvasSpeed: 1.0,
      gradientDurationSec: 18,
      gridDurationSec: 8,
      photoBreathScale: 1.07,
      photoDriftPx: 18,
    },
  },
  'misty-fjords': {
    aesthetic: 'nordic-slate-mist',
    baseGradient: {
      light: 'linear-gradient(165deg, #cbd5e1 0%, #e2e8f0 50%, #94a3b8 100%)',
      dark: 'linear-gradient(165deg, #0b1420 0%, #18293d 52%, #0f172a 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 80% 45% at 50% 22%, rgba(240, 253, 250, 0.45) 0%, transparent 72%)',
        'radial-gradient(ellipse 70% 40% at 30% 78%, rgba(94, 234, 212, 0.16) 0%, transparent 72%)',
      ],
      dark: [
        'radial-gradient(ellipse 75% 48% at 62% 20%, rgba(45, 212, 191, 0.16) 0%, rgba(56, 189, 248, 0.08) 48%, transparent 76%)',
        'radial-gradient(ellipse 85% 42% at 35% 84%, rgba(15, 118, 110, 0.20) 0%, transparent 75%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 85% at 50% 50%, transparent 58%, rgba(100, 116, 139, 0.20) 100%)',
      dark: 'radial-gradient(ellipse 92% 85% at 50% 50%, transparent 50%, rgba(3, 8, 16, 0.58) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.04,
      opacityDark: 0.06,
      blendMode: 'overlay',
      baseFrequency: 0.78,
    },
    particleDensity: {
      count: 18,
      secondaryCount: 14,
      glowIntensity: 0.68,
    },
    animationSpeed: {
      canvasSpeed: 1.05,
      gradientDurationSec: 16,
      gridDurationSec: 8,
      photoBreathScale: 1.06,
      photoDriftPx: 16,
    },
  },
  'emerald-highlands': {
    aesthetic: 'deep-canopy-bioluminescence',
    baseGradient: {
      light: 'linear-gradient(160deg, #d1fae5 0%, #a7f3d0 45%, #3f6251 100%)',
      dark: 'linear-gradient(160deg, #071913 0%, #0e2e24 52%, #13221d 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 68% 55% at 24% 24%, rgba(254, 249, 195, 0.36) 0%, rgba(110, 231, 183, 0.18) 45%, transparent 74%)',
        'radial-gradient(ellipse 72% 52% at 78% 76%, rgba(16, 185, 129, 0.24) 0%, transparent 72%)',
      ],
      dark: [
        'radial-gradient(ellipse 65% 52% at 26% 28%, rgba(52, 211, 153, 0.20) 0%, rgba(16, 185, 129, 0.08) 48%, transparent 75%)',
        'radial-gradient(ellipse 70% 54% at 76% 74%, rgba(20, 184, 166, 0.18) 0%, rgba(250, 204, 21, 0.06) 46%, transparent 76%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 90% 86% at 50% 50%, transparent 54%, rgba(6, 95, 70, 0.20) 100%)',
      dark: 'radial-gradient(ellipse 90% 86% at 50% 50%, transparent 46%, rgba(2, 12, 8, 0.65) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.045,
      opacityDark: 0.065,
      blendMode: 'soft-light',
      baseFrequency: 0.82,
    },
    particleDensity: {
      count: 68,
      secondaryCount: 14,
      glowIntensity: 0.92,
    },
    animationSpeed: {
      canvasSpeed: 1.1,
      gradientDurationSec: 15,
      gridDurationSec: 8,
      photoBreathScale: 1.07,
      photoDriftPx: 18,
    },
  },
  'amber-canyon': {
    aesthetic: 'warm-terracotta-sunbeam',
    baseGradient: {
      light: 'linear-gradient(160deg, #fed7aa 0%, #fdba74 48%, #c2410c 100%)',
      dark: 'linear-gradient(160deg, #1f110b 0%, #3a1d12 52%, #1c1412 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 70% 54% at 74% 20%, rgba(254, 240, 138, 0.48) 0%, rgba(251, 146, 60, 0.22) 48%, transparent 76%)',
        'radial-gradient(ellipse 75% 48% at 22% 84%, rgba(234, 88, 12, 0.24) 0%, transparent 74%)',
      ],
      dark: [
        'radial-gradient(ellipse 70% 52% at 74% 22%, rgba(251, 146, 60, 0.24) 0%, rgba(245, 158, 11, 0.10) 48%, transparent 76%)',
        'radial-gradient(ellipse 72% 48% at 20% 80%, rgba(194, 65, 12, 0.22) 0%, transparent 74%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 86% at 50% 50%, transparent 54%, rgba(154, 52, 18, 0.22) 100%)',
      dark: 'radial-gradient(ellipse 92% 86% at 50% 50%, transparent 46%, rgba(18, 7, 3, 0.64) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.055,
      opacityDark: 0.07,
      blendMode: 'overlay',
      baseFrequency: 0.9,
    },
    particleDensity: {
      count: 62,
      secondaryCount: 10,
      glowIntensity: 0.85,
    },
    animationSpeed: {
      canvasSpeed: 1.05,
      gradientDurationSec: 16,
      gridDurationSec: 8,
      photoBreathScale: 1.07,
      photoDriftPx: 18,
    },
  },
  'midnight-peaks': {
    aesthetic: 'nocturnal-starlit-indigo',
    baseGradient: {
      light: 'linear-gradient(165deg, #cbd5e1 0%, #94a3b8 48%, #334155 100%)',
      dark: 'linear-gradient(165deg, #050814 0%, #0f172a 52%, #1e1b4b 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 72% 50% at 72% 18%, rgba(165, 180, 252, 0.34) 0%, transparent 70%)',
        'radial-gradient(ellipse 68% 45% at 24% 80%, rgba(148, 163, 184, 0.28) 0%, transparent 72%)',
      ],
      dark: [
        'radial-gradient(ellipse 70% 48% at 74% 16%, rgba(129, 140, 248, 0.24) 0%, rgba(56, 189, 248, 0.10) 46%, transparent 74%)',
        'radial-gradient(ellipse 78% 44% at 24% 82%, rgba(67, 56, 202, 0.22) 0%, transparent 75%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 52%, rgba(51, 65, 85, 0.26) 100%)',
      dark: 'radial-gradient(ellipse 90% 85% at 50% 50%, transparent 45%, rgba(2, 4, 12, 0.68) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.045,
      opacityDark: 0.065,
      blendMode: 'soft-light',
      baseFrequency: 0.88,
    },
    particleDensity: {
      count: 85,
      secondaryCount: 14,
      glowIntensity: 0.95,
    },
    animationSpeed: {
      canvasSpeed: 1.15,
      gradientDurationSec: 14,
      gridDurationSec: 8,
      photoBreathScale: 1.06,
      photoDriftPx: 15,
    },
  },
  nebula: {
    aesthetic: 'deep-space-nebula-warp',
    baseGradient: {
      light: 'radial-gradient(ellipse 95% 75% at 50% 35%, #ece8fe 0%, #ddd6fe 46%, #e0e7ff 100%)',
      dark: 'radial-gradient(ellipse 95% 75% at 50% 35%, #23114f 0%, #12082e 48%, #060314 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(circle at 22% 26%, rgba(129, 140, 248, 0.36) 0%, rgba(167, 139, 250, 0.16) 44%, transparent 70%)',
        'radial-gradient(circle at 78% 72%, rgba(217, 70, 239, 0.24) 0%, rgba(99, 102, 241, 0.14) 48%, transparent 72%)',
        'radial-gradient(ellipse 52% 38% at 50% 45%, rgba(255, 255, 255, 0.45) 0%, transparent 72%)',
      ],
      dark: [
        'radial-gradient(circle at 22% 28%, rgba(124, 58, 237, 0.40) 0%, rgba(79, 70, 229, 0.18) 46%, transparent 72%)',
        'radial-gradient(circle at 80% 72%, rgba(192, 38, 211, 0.28) 0%, rgba(139, 92, 246, 0.16) 48%, transparent 74%)',
        'radial-gradient(ellipse 56% 40% at 50% 42%, rgba(56, 189, 248, 0.14) 0%, transparent 72%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 55%, rgba(109, 40, 217, 0.18) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 45%, rgba(3, 1, 12, 0.72) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.04,
      opacityDark: 0.075,
      blendMode: 'screen',
      baseFrequency: 0.92,
    },
    particleDensity: {
      count: 165,
      secondaryCount: 3,
      glowIntensity: 1.0,
    },
    animationSpeed: {
      canvasSpeed: 1.2,
      gradientDurationSec: 13,
      gridDurationSec: 7,
      photoBreathScale: 1.05,
      photoDriftPx: 12,
    },
  },
  cyberpunk: {
    aesthetic: 'neon-matrix-crt-grid',
    baseGradient: {
      light: 'linear-gradient(165deg, #e7fbf3 0%, #d1fae5 52%, #f7e6fe 100%)',
      dark: 'linear-gradient(165deg, #020806 0%, #04130d 50%, #1c051a 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(circle at 14% 18%, rgba(16, 185, 129, 0.28) 0%, transparent 55%)',
        'radial-gradient(circle at 86% 84%, rgba(217, 70, 239, 0.24) 0%, transparent 58%)',
        'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(255, 255, 255, 0.35) 0%, transparent 75%)',
      ],
      dark: [
        'radial-gradient(circle at 14% 18%, rgba(34, 255, 136, 0.24) 0%, transparent 56%)',
        'radial-gradient(circle at 86% 84%, rgba(255, 42, 212, 0.26) 0%, transparent 58%)',
        'radial-gradient(ellipse 65% 42% at 50% 50%, rgba(0, 229, 163, 0.08) 0%, transparent 75%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 56%, rgba(4, 120, 87, 0.16) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 45%, rgba(1, 5, 4, 0.76) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.05,
      opacityDark: 0.085,
      blendMode: 'overlay',
      baseFrequency: 1.15,
    },
    particleDensity: {
      count: 96,
      secondaryCount: 16,
      glowIntensity: 1.0,
    },
    animationSpeed: {
      canvasSpeed: 1.25,
      gradientDurationSec: 11,
      gridDurationSec: 4.5,
      photoBreathScale: 1.04,
      photoDriftPx: 10,
    },
    gridOverlay: {
      enabled: true,
      cellSizePx: 36,
      opacityLight: 0.35,
      opacityDark: 0.42,
      colorLight: 'rgba(4, 120, 87, 0.08)',
      colorDark: 'rgba(34, 255, 136, 0.09)',
    },
  },
  'aurora-borealis': {
    aesthetic: 'polar-aurora-curtains',
    baseGradient: {
      light: 'linear-gradient(180deg, #b8e1f0 0%, #d4efed 52%, #e8e2f8 100%)',
      dark: 'linear-gradient(180deg, #030914 0%, #071829 52%, #0c1324 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 78% 46% at 32% 24%, rgba(20, 184, 166, 0.24) 0%, transparent 70%)',
        'radial-gradient(ellipse 72% 48% at 72% 30%, rgba(139, 92, 246, 0.20) 0%, transparent 72%)',
      ],
      dark: [
        'radial-gradient(ellipse 80% 48% at 30% 24%, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.12) 48%, transparent 74%)',
        'radial-gradient(ellipse 75% 46% at 74% 28%, rgba(139, 92, 246, 0.22) 0%, transparent 74%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 56%, rgba(13, 148, 136, 0.16) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 46%, rgba(2, 6, 16, 0.65) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.035,
      opacityDark: 0.06,
      blendMode: 'soft-light',
      baseFrequency: 0.8,
    },
    particleDensity: {
      count: 70,
      secondaryCount: 3,
      glowIntensity: 0.9,
    },
    animationSpeed: {
      canvasSpeed: 1.1,
      gradientDurationSec: 14,
      gridDurationSec: 8,
      photoBreathScale: 1.05,
      photoDriftPx: 12,
    },
  },
  'oceanic-horizon': {
    aesthetic: 'pelagic-wave-caustics',
    baseGradient: {
      light: 'linear-gradient(180deg, #b8ddf4 0%, #e0f2fe 48%, #d7eaf8 100%)',
      dark: 'linear-gradient(180deg, #040d1a 0%, #092038 52%, #071322 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 72% 45% at 50% 34%, rgba(255, 255, 255, 0.72) 0%, rgba(125, 211, 252, 0.24) 52%, transparent 78%)',
        'radial-gradient(ellipse 85% 38% at 50% 88%, rgba(2, 132, 199, 0.22) 0%, transparent 74%)',
      ],
      dark: [
        'radial-gradient(ellipse 70% 44% at 50% 34%, rgba(56, 189, 248, 0.26) 0%, rgba(14, 165, 233, 0.10) 52%, transparent 78%)',
        'radial-gradient(ellipse 88% 40% at 50% 90%, rgba(30, 58, 138, 0.28) 0%, transparent 75%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 58%, rgba(3, 105, 161, 0.18) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 48%, rgba(2, 8, 18, 0.62) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.03,
      opacityDark: 0.05,
      blendMode: 'soft-light',
      baseFrequency: 0.75,
    },
    particleDensity: {
      count: 20,
      secondaryCount: 4,
      glowIntensity: 0.82,
    },
    animationSpeed: {
      canvasSpeed: 1.15,
      gradientDurationSec: 14,
      gridDurationSec: 8,
      photoBreathScale: 1.05,
      photoDriftPx: 12,
    },
  },
  'solar-meadow': {
    aesthetic: 'golden-hour-volumetric-rays',
    baseGradient: {
      light: 'linear-gradient(175deg, #dbeafe 0%, #f7efe2 48%, #f3dfbf 100%)',
      dark: 'linear-gradient(175deg, #0d111d 0%, #1f192c 48%, #2c1d18 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(ellipse 68% 52% at 56% 32%, rgba(254, 240, 138, 0.65) 0%, rgba(253, 186, 116, 0.30) 48%, transparent 76%)',
        'radial-gradient(ellipse 75% 44% at 24% 82%, rgba(245, 158, 11, 0.18) 0%, transparent 74%)',
      ],
      dark: [
        'radial-gradient(ellipse 66% 50% at 56% 32%, rgba(245, 158, 11, 0.28) 0%, rgba(244, 63, 94, 0.14) 50%, transparent 76%)',
        'radial-gradient(ellipse 75% 46% at 22% 84%, rgba(180, 83, 9, 0.20) 0%, transparent 75%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 56%, rgba(217, 119, 6, 0.16) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 46%, rgba(14, 9, 14, 0.62) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.04,
      opacityDark: 0.06,
      blendMode: 'soft-light',
      baseFrequency: 0.84,
    },
    particleDensity: {
      count: 54,
      secondaryCount: 7,
      glowIntensity: 0.86,
    },
    animationSpeed: {
      canvasSpeed: 1.05,
      gradientDurationSec: 16,
      gridDurationSec: 8,
      photoBreathScale: 1.06,
      photoDriftPx: 14,
    },
  },
  'cyber-studio': {
    aesthetic: 'neural-architectural-grid',
    baseGradient: {
      light: 'linear-gradient(155deg, #f8fafc 0%, #eff6ff 52%, #f5f3ff 100%)',
      dark: 'linear-gradient(155deg, #080b11 0%, #0d1526 52%, #131129 100%)',
    },
    radialOverlays: {
      light: [
        'radial-gradient(circle at 18% 20%, rgba(6, 182, 212, 0.18) 0%, transparent 55%)',
        'radial-gradient(circle at 84% 82%, rgba(139, 92, 246, 0.16) 0%, transparent 58%)',
      ],
      dark: [
        'radial-gradient(circle at 18% 20%, rgba(34, 211, 238, 0.16) 0%, transparent 56%)',
        'radial-gradient(circle at 84% 82%, rgba(139, 92, 246, 0.18) 0%, transparent 58%)',
      ],
    },
    vignette: {
      light: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 60%, rgba(15, 23, 42, 0.06) 100%)',
      dark: 'radial-gradient(ellipse 92% 88% at 50% 50%, transparent 50%, rgba(3, 6, 14, 0.60) 100%)',
    },
    noiseOverlay: {
      enabled: true,
      opacityLight: 0.025,
      opacityDark: 0.045,
      blendMode: 'overlay',
      baseFrequency: 0.95,
    },
    particleDensity: {
      count: 46,
      secondaryCount: 5,
      glowIntensity: 0.88,
    },
    animationSpeed: {
      canvasSpeed: 1.15,
      gradientDurationSec: 14,
      gridDurationSec: 5.5,
      photoBreathScale: 1.04,
      photoDriftPx: 10,
    },
    gridOverlay: {
      enabled: true,
      cellSizePx: 34,
      opacityLight: 0.9,
      opacityDark: 0.95,
      colorLight: 'rgba(6, 182, 212, 0.06)',
      colorDark: 'rgba(0, 240, 255, 0.10)',
    },
  },
};

export const getThemeBackdropConfig = (liveTheme: LiveThemeId): ThemeBackdropConfig => {
  return THEME_BACKDROP_CONFIGS[liveTheme] || THEME_BACKDROP_CONFIGS['alpine-dunes'];
};

const THEME_STORAGE_KEY = 'supremeai_studio_theme_v3';

interface PersistedThemeConfig {
  themeMode: ThemeMode;
  liveTheme: LiveThemeId;
  liveMotion: boolean;
  overrideReducedMotion: boolean;
  motionSpeed: MotionSpeed;
  surfaceTone: SurfaceTone;
  scrimIntensity: ScrimIntensity;
  themeOptions: ThemeSpecificOptions;
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
  const defaults: PersistedThemeConfig = {
    themeMode: 'system',
    liveTheme: 'alpine-dunes',
    liveMotion: true,
    overrideReducedMotion: true,
    motionSpeed: 'normal',
    surfaceTone: 'adaptive',
    scrimIntensity: 'balanced',
    themeOptions: { ...DEFAULT_THEME_OPTIONS },
  };

  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY) || localStorage.getItem('supremeai_studio_theme_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      const validModes: ThemeMode[] = ['system', 'light', 'dark'];
      const validThemes: LiveThemeId[] = LIVE_THEMES.map((t) => t.id);
      const validSpeeds: MotionSpeed[] = ['calm', 'normal', 'dynamic'];
      const validTones: SurfaceTone[] = ['adaptive', 'monochrome'];
      const validScrims: ScrimIntensity[] = ['subtle', 'balanced', 'focus'];
      return {
        themeMode: validModes.includes(parsed.themeMode) ? parsed.themeMode : 'system',
        liveTheme: validThemes.includes(parsed.liveTheme) ? parsed.liveTheme : 'alpine-dunes',
        liveMotion: typeof parsed.liveMotion === 'boolean' ? parsed.liveMotion : true,
        overrideReducedMotion:
          typeof parsed.overrideReducedMotion === 'boolean' ? parsed.overrideReducedMotion : true,
        motionSpeed: validSpeeds.includes(parsed.motionSpeed) ? parsed.motionSpeed : 'normal',
        surfaceTone: validTones.includes(parsed.surfaceTone) ? parsed.surfaceTone : 'adaptive',
        scrimIntensity: validScrims.includes(parsed.scrimIntensity)
          ? parsed.scrimIntensity
          : 'balanced',
        themeOptions: {
          ...DEFAULT_THEME_OPTIONS,
          ...(parsed.themeOptions && typeof parsed.themeOptions === 'object' ? parsed.themeOptions : {}),
        },
      };
    }
  } catch {
    // Ignore storage read failures
  }

  return defaults;
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

export const getThemeSurfaces = (
  liveTheme: LiveThemeId,
  resolvedScheme: ResolvedColorScheme,
  surfaceTone: SurfaceTone = 'adaptive'
): ThemeSurfaceTokens => {
  if (surfaceTone === 'monochrome') {
    return resolvedScheme === 'dark'
      ? {
          surfaceGlass: 'rgba(15, 20, 34, 0.80)',
          surfaceStrong: 'rgba(17, 22, 34, 0.94)',
          surfaceSidebar: 'rgba(17, 21, 32, 0.82)',
          surfaceInput: 'rgba(23, 27, 38, 0.84)',
          surfaceBorder: 'rgba(51, 65, 85, 0.65)',
          scrimOverlay: 'rgba(8, 11, 17, 0.68)',
          cardShadow: '0 8px 28px -6px rgba(0, 0, 0, 0.45)',
        }
      : {
          surfaceGlass: 'rgba(255, 255, 255, 0.84)',
          surfaceStrong: 'rgba(255, 255, 255, 0.95)',
          surfaceSidebar: 'rgba(255, 255, 255, 0.75)',
          surfaceInput: 'rgba(255, 255, 255, 0.86)',
          surfaceBorder: 'rgba(226, 232, 240, 0.85)',
          scrimOverlay: 'rgba(255, 255, 255, 0.62)',
          cardShadow: '0 8px 28px -6px rgba(15, 23, 42, 0.08)',
        };
  }
  const def = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];
  return def.surfaces[resolvedScheme];
};

export interface DomThemeMotionOptions {
  motionSpeed?: MotionSpeed;
  isAnimating?: boolean;
}

export const applyThemeToDom = (
  resolvedScheme: ResolvedColorScheme,
  themeMode: ThemeMode,
  liveTheme: LiveThemeId,
  animateTransition: boolean = false,
  surfaceTone: SurfaceTone = 'adaptive',
  motionOptions: DomThemeMotionOptions = {}
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

  const motionSpeed: MotionSpeed = motionOptions.motionSpeed || 'normal';
  const isAnimating = motionOptions.isAnimating !== false;
  const backdropConfig = getThemeBackdropConfig(liveTheme);
  const speedRatio =
    (MOTION_SPEED_MULTIPLIER[motionSpeed] || 1) * backdropConfig.animationSpeed.canvasSpeed;

  root.style.colorScheme = resolvedScheme;
  root.dataset.themeMode = themeMode;
  root.dataset.liveTheme = liveTheme;
  root.dataset.surfaceTone = surfaceTone;
  root.dataset.aesthetic = backdropConfig.aesthetic;
  root.dataset.motionSpeed = motionSpeed;
  root.dataset.liveMotion = isAnimating ? 'live' : 'paused';

  const tokens = getThemeTokens(liveTheme, resolvedScheme);
  root.style.setProperty('--theme-accent', tokens.accent);
  root.style.setProperty('--theme-accent-hover', tokens.accentHover);
  root.style.setProperty('--theme-accent-soft', tokens.accentSoft);
  root.style.setProperty('--theme-accent-ring', tokens.accentRing);
  root.style.setProperty('--theme-accent-contrast', tokens.accentContrast);
  root.style.setProperty('--theme-accent-gradient', tokens.accentGradient);
  root.style.setProperty('--theme-accent-secondary', tokens.accentSecondary);

  const surfaces = getThemeSurfaces(liveTheme, resolvedScheme, surfaceTone);
  root.style.setProperty('--theme-surface-glass', surfaces.surfaceGlass);
  root.style.setProperty('--theme-surface-strong', surfaces.surfaceStrong);
  root.style.setProperty('--theme-surface-sidebar', surfaces.surfaceSidebar);
  root.style.setProperty('--theme-surface-input', surfaces.surfaceInput);
  root.style.setProperty('--theme-surface-border', surfaces.surfaceBorder);
  root.style.setProperty('--theme-scrim-overlay', surfaces.scrimOverlay);
  root.style.setProperty('--theme-card-shadow', surfaces.cardShadow);

  // Inject backdrop gradients & animation speeds directly onto :root
  root.style.setProperty('--theme-backdrop-base', backdropConfig.baseGradient[resolvedScheme]);
  root.style.setProperty(
    '--theme-backdrop-radials',
    backdropConfig.radialOverlays[resolvedScheme].join(', ') || 'none'
  );
  root.style.setProperty('--theme-backdrop-vignette', backdropConfig.vignette[resolvedScheme]);
  root.style.setProperty('--theme-motion-speed', speedRatio.toFixed(3));
  root.style.setProperty(
    '--theme-gradient-duration',
    `${(backdropConfig.animationSpeed.gradientDurationSec / speedRatio).toFixed(2)}s`
  );
  root.style.setProperty(
    '--theme-grid-duration',
    `${(backdropConfig.animationSpeed.gridDurationSec / speedRatio).toFixed(2)}s`
  );
  root.style.setProperty(
    '--theme-aurora-duration',
    `${Math.max(4, (backdropConfig.animationSpeed.gradientDurationSec * 0.9) / speedRatio).toFixed(2)}s`
  );
};

interface ThemeStoreState {
  themeMode: ThemeMode;
  osPrefersDark: boolean;
  resolvedScheme: ResolvedColorScheme;
  liveTheme: LiveThemeId;
  liveMotion: boolean;
  overrideReducedMotion: boolean;
  motionSpeed: MotionSpeed;
  surfaceTone: SurfaceTone;
  scrimIntensity: ScrimIntensity;
  themeOptions: ThemeSpecificOptions;
  prefersReducedMotion: boolean;
  lastSyncedAt: number | null;
  accentTokens: ThemeAccentTokens;

  setThemeMode: (mode: ThemeMode) => void;
  cycleThemeMode: () => void;
  setLiveTheme: (theme: LiveThemeId) => void;
  setLiveMotion: (enabled: boolean) => void;
  setOverrideReducedMotion: (override: boolean) => void;
  setMotionSpeed: (speed: MotionSpeed) => void;
  setSurfaceTone: (tone: SurfaceTone) => void;
  setScrimIntensity: (intensity: ScrimIntensity) => void;
  updateThemeOptions: (partial: Partial<ThemeSpecificOptions>) => void;
  setOsPrefersDark: (prefersDark: boolean, animate?: boolean) => void;
  setPrefersReducedMotion: (reduced: boolean) => void;
}

const initialConfig = loadPersistedConfig();
const initialOsDark = getInitialOsDark();
const initialReducedMotion = getInitialReducedMotion();
const initialResolved: ResolvedColorScheme =
  initialConfig.themeMode === 'system'
    ? initialOsDark
      ? 'dark'
      : 'light'
    : initialConfig.themeMode;

applyThemeToDom(
  initialResolved,
  initialConfig.themeMode,
  initialConfig.liveTheme,
  false,
  initialConfig.surfaceTone,
  {
    motionSpeed: initialConfig.motionSpeed,
    isAnimating:
      initialConfig.liveMotion &&
      (!initialReducedMotion || initialConfig.overrideReducedMotion),
  }
);

const persistFromState = (s: ThemeStoreState) => {
  savePersistedConfig({
    themeMode: s.themeMode,
    liveTheme: s.liveTheme,
    liveMotion: s.liveMotion,
    overrideReducedMotion: s.overrideReducedMotion,
    motionSpeed: s.motionSpeed,
    surfaceTone: s.surfaceTone,
    scrimIntensity: s.scrimIntensity,
    themeOptions: s.themeOptions,
  });
};

const computeIsAnimating = (
  liveMotion: boolean,
  prefersReducedMotion: boolean,
  overrideReducedMotion: boolean
) => liveMotion && (!prefersReducedMotion || overrideReducedMotion);

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  themeMode: initialConfig.themeMode,
  osPrefersDark: initialOsDark,
  resolvedScheme: initialResolved,
  liveTheme: initialConfig.liveTheme,
  liveMotion: initialConfig.liveMotion,
  overrideReducedMotion: initialConfig.overrideReducedMotion,
  motionSpeed: initialConfig.motionSpeed,
  surfaceTone: initialConfig.surfaceTone,
  scrimIntensity: initialConfig.scrimIntensity,
  themeOptions: initialConfig.themeOptions,
  prefersReducedMotion: initialReducedMotion,
  lastSyncedAt: Date.now(),
  accentTokens: getThemeTokens(initialConfig.liveTheme, initialResolved),

  setThemeMode: (themeMode) => {
    const state = get();
    const resolvedScheme: ResolvedColorScheme =
      themeMode === 'system' ? (state.osPrefersDark ? 'dark' : 'light') : themeMode;

    applyThemeToDom(resolvedScheme, themeMode, state.liveTheme, true, state.surfaceTone, {
      motionSpeed: state.motionSpeed,
      isAnimating: computeIsAnimating(
        state.liveMotion,
        state.prefersReducedMotion,
        state.overrideReducedMotion
      ),
    });
    const nextState = {
      ...state,
      themeMode,
      resolvedScheme,
      accentTokens: getThemeTokens(state.liveTheme, resolvedScheme),
      lastSyncedAt: Date.now(),
    };
    persistFromState(nextState);
    set(nextState);
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
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      liveTheme,
      true,
      state.surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          state.prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    const nextState = {
      ...state,
      liveTheme,
      accentTokens: getThemeTokens(liveTheme, state.resolvedScheme),
    };
    persistFromState(nextState);
    set(nextState);
  },

  setLiveMotion: (liveMotion) => {
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      state.liveTheme,
      false,
      state.surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          liveMotion,
          state.prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    const nextState = { ...state, liveMotion };
    persistFromState(nextState);
    set({ liveMotion });
  },

  setOverrideReducedMotion: (overrideReducedMotion) => {
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      state.liveTheme,
      false,
      state.surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          state.prefersReducedMotion,
          overrideReducedMotion
        ),
      }
    );
    const nextState = { ...state, overrideReducedMotion };
    persistFromState(nextState);
    set({ overrideReducedMotion });
  },

  setMotionSpeed: (motionSpeed) => {
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      state.liveTheme,
      false,
      state.surfaceTone,
      {
        motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          state.prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    const nextState = { ...state, motionSpeed };
    persistFromState(nextState);
    set({ motionSpeed });
  },

  setSurfaceTone: (surfaceTone) => {
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      state.liveTheme,
      true,
      surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          state.prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    const nextState = { ...state, surfaceTone };
    persistFromState(nextState);
    set({ surfaceTone });
  },

  setScrimIntensity: (scrimIntensity) => {
    const state = get();
    const nextState = { ...state, scrimIntensity };
    persistFromState(nextState);
    set({ scrimIntensity });
  },

  updateThemeOptions: (partial) => {
    const state = get();
    const themeOptions = { ...state.themeOptions, ...partial };
    const nextState = { ...state, themeOptions };
    persistFromState(nextState);
    set({ themeOptions });
  },

  setOsPrefersDark: (osPrefersDark, animate = true) => {
    const state = get();
    const resolvedScheme: ResolvedColorScheme =
      state.themeMode === 'system' ? (osPrefersDark ? 'dark' : 'light') : state.themeMode;

    applyThemeToDom(
      resolvedScheme,
      state.themeMode,
      state.liveTheme,
      animate,
      state.surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          state.prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    set({
      osPrefersDark,
      resolvedScheme,
      accentTokens: getThemeTokens(state.liveTheme, resolvedScheme),
      lastSyncedAt: Date.now(),
    });
  },

  setPrefersReducedMotion: (prefersReducedMotion) => {
    const state = get();
    applyThemeToDom(
      state.resolvedScheme,
      state.themeMode,
      state.liveTheme,
      false,
      state.surfaceTone,
      {
        motionSpeed: state.motionSpeed,
        isAnimating: computeIsAnimating(
          state.liveMotion,
          prefersReducedMotion,
          state.overrideReducedMotion
        ),
      }
    );
    set({ prefersReducedMotion });
  },
}));
