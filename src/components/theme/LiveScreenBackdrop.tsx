import React, { useEffect, useId, useRef, useState } from 'react';
import {
  useThemeStore,
  LIVE_THEMES,
  LiveThemeId,
  ScrimIntensity,
  MOTION_SPEED_MULTIPLIER,
  getThemeBackdropConfig,
} from '../../stores/useThemeStore';

interface LiveScreenBackdropProps {
  isEmpty?: boolean;
  isChatView?: boolean;
}

const STAR_POSITIONS = [
  { top: '8%', left: '14%', size: 2, delay: 0 },
  { top: '12%', left: '34%', size: 1.5, delay: 1.2 },
  { top: '6%', left: '58%', size: 2.5, delay: 0.6 },
  { top: '16%', left: '76%', size: 1.5, delay: 1.9 },
  { top: '10%', left: '89%', size: 2, delay: 0.4 },
  { top: '22%', left: '22%', size: 1.5, delay: 2.3 },
  { top: '19%', left: '47%', size: 2, delay: 1.5 },
  { top: '25%', left: '66%', size: 1.5, delay: 0.8 },
  { top: '14%', left: '93%', size: 1.5, delay: 2.8 },
  { top: '28%', left: '8%', size: 2, delay: 1.1 },
];

const MATRIX_GLYPHS =
  '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEF0123456789#$%';

const MATRIX_PALETTES = {
  'neon-emerald': {
    darkPrimary: '34, 255, 136',
    darkSecondary: '255, 42, 212',
    lightPrimary: '4, 120, 87',
    lightSecondary: '192, 38, 211',
    darkFade: 'rgba(2, 10, 7, 0.14)',
    lightFade: 'rgba(232, 252, 243, 0.22)',
  },
  'cyber-cyan': {
    darkPrimary: '0, 240, 255',
    darkSecondary: '168, 85, 247',
    lightPrimary: '2, 132, 199',
    lightSecondary: '124, 58, 237',
    darkFade: 'rgba(4, 10, 22, 0.14)',
    lightFade: 'rgba(232, 246, 255, 0.22)',
  },
  'synth-amber': {
    darkPrimary: '251, 191, 36',
    darkSecondary: '244, 63, 94',
    lightPrimary: '194, 65, 12',
    lightSecondary: '225, 29, 72',
    darkFade: 'rgba(18, 7, 10, 0.14)',
    lightFade: 'rgba(255, 245, 235, 0.22)',
  },
} as const;

const MatrixRainCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  palette: keyof typeof MATRIX_PALETTES;
  density: 'sparse' | 'normal' | 'overdrive';
  particleCount?: number;
  glowIntensity?: number;
}> = ({
  isDark,
  animate,
  speedMul,
  palette,
  density,
  particleCount = 96,
  glowIntensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = MATRIX_PALETTES[palette] || MATRIX_PALETTES['neon-emerald'];
    let rafId = 0;
    const densityScale = Math.max(0.75, Math.min(1.3, particleCount / 96));
    const baseSize = density === 'overdrive' ? 13 : density === 'sparse' ? 19 : 15;
    const fontSize = Math.max(11, Math.round(baseSize / densityScale));
    const clampedGlow = Math.max(0.5, Math.min(1.2, glowIntensity));
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let isSecondaryCol: boolean[] = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      columns = Math.max(12, Math.floor(width / fontSize));
      drops = Array.from({ length: columns }, (_, i) => ((i * 7) % 45) - 10);
      speeds = Array.from({ length: columns }, (_, i) => 0.45 + ((i * 13) % 7) * 0.09);
      isSecondaryCol = Array.from({ length: columns }, (_, i) => i % 6 === 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const drawStaticFrame = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

      for (let i = 0; i < columns; i++) {
        const x = i * fontSize;
        const maxRows = Math.floor(height / fontSize);
        const tailLen = 9;
        const headRow = ((i * 5) % Math.max(12, maxRows - 4)) + 4;
        const sec = isSecondaryCol[i];

        for (let t = 0; t < tailLen; t++) {
          const row = headRow - t;
          if (row < 0) continue;
          const glyph = MATRIX_GLYPHS[(i * 11 + row * 3) % MATRIX_GLYPHS.length];
          const alpha = Math.max(0.1, (1 - t / tailLen) * (isDark ? 0.68 : 0.42));
          const rgb = sec
            ? isDark
              ? colors.darkSecondary
              : colors.lightSecondary
            : isDark
            ? colors.darkPrimary
            : colors.lightPrimary;
          ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
          ctx.fillText(glyph, x, row * fontSize);
        }
      }
    };

    if (!animate) {
      drawStaticFrame();
      return () => window.removeEventListener('resize', resize);
    }

    let lastTime = 0;
    const step = (time: number) => {
      const frameInterval = Math.max(16, Math.round(38 / Math.max(0.25, speedMulRef.current)));
      if (time - lastTime >= frameInterval) {
        lastTime = time;
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.fillStyle = isDark ? colors.darkFade : colors.lightFade;
        ctx.fillRect(0, 0, width, height);

        ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

        for (let i = 0; i < columns; i++) {
          const glyph = MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
          const x = i * fontSize;
          const y = Math.floor(drops[i]) * fontSize;
          const sec = isSecondaryCol[i] || Math.random() > 0.93;
          const rgb = sec
            ? isDark
              ? colors.darkSecondary
              : colors.lightSecondary
            : isDark
            ? colors.darkPrimary
            : colors.lightPrimary;

          ctx.fillStyle = `rgba(${rgb}, ${Math.min(0.98, (isDark ? 0.92 : 0.72) * clampedGlow).toFixed(2)})`;

          if (y > 0 && y < height + fontSize) {
            ctx.fillText(glyph, x, y);
          }

          if (y > height && Math.random() > 0.97) {
            drops[i] = 0;
          } else {
            drops[i] += speeds[i] * (density === 'overdrive' ? 1.15 : 0.95);
          }
        }
      }
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, palette, density, particleCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * 3D Flying Starfield, Nebula Clouds & Shooting Stars Canvas for Nebula theme.
 */
const NebulaCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  effect: 'warp-stars' | 'constellation' | 'drift';
  particleCount?: number;
  cloudCount?: number;
  glowIntensity?: number;
}> = ({
  isDark,
  animate,
  speedMul,
  effect,
  particleCount = 165,
  cloudCount = 3,
  glowIntensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const starCount = Math.max(40, particleCount);
    const stars = Array.from({ length: starCount }, (_, i) => ({
      x: (((i * 73) % 1000) / 1000 - 0.5) * 2,
      y: (((i * 137) % 1000) / 1000 - 0.5) * 2,
      z: 0.12 + ((i * 29) % 100) / 100,
      hue: i % 3 === 0 ? '192, 132, 252' : i % 3 === 1 ? '129, 140, 248' : '224, 231, 255',
      size: 0.9 + (i % 4) * 0.55,
      vx: (((i * 19) % 100) / 100 - 0.5) * 0.25,
      vy: (((i * 43) % 100) / 100 - 0.5) * 0.25,
    }));

    const baseClouds = [
      { cx: 0.28, cy: 0.34, r: 0.38, speed: 0.22, rgb: isDark ? '124, 58, 237' : '129, 140, 248' },
      { cx: 0.72, cy: 0.62, r: 0.42, speed: -0.18, rgb: isDark ? '168, 85, 247' : '167, 139, 250' },
      { cx: 0.5, cy: 0.45, r: 0.32, speed: 0.14, rgb: isDark ? '79, 70, 229' : '99, 102, 241' },
    ];
    const clouds = baseClouds.slice(0, Math.max(1, Math.min(baseClouds.length, cloudCount)));

    let shooter = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 };
    let nextShooterAt = 1.6;

    const draw = (simTime: number, scaledDt: number) => {
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.5;
      const cy = H * 0.46;

      // Swirling translucent nebula clouds scaled by theme + user speed
      for (let c = 0; c < clouds.length; c++) {
        const cl = clouds[c];
        const px = W * cl.cx + Math.cos(simTime * cl.speed + c * 2) * (W * 0.09);
        const py = H * cl.cy + Math.sin(simTime * (cl.speed * 1.3) + c) * (H * 0.08);
        const radius = Math.max(W, H) * cl.r;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        const alpha = (isDark ? 0.22 : 0.2) * glowIntensity;
        grad.addColorStop(0, `rgba(${cl.rgb}, ${alpha})`);
        grad.addColorStop(0.5, `rgba(${cl.rgb}, ${(alpha * 0.4).toFixed(2)})`);
        grad.addColorStop(1, `rgba(${cl.rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Projected star coordinates
      const pts: { sx: number; sy: number; alpha: number; r: number; hue: string }[] = [];

      for (const s of stars) {
        if (animate) {
          if (effect === 'warp-stars') {
            s.z -= scaledDt * 0.24;
            if (s.z <= 0.04) s.z = 1.0;
          } else {
            s.x += s.vx * scaledDt * 0.18;
            s.y += s.vy * scaledDt * 0.18;
            if (s.x > 1.1) s.x = -1.1;
            if (s.x < -1.1) s.x = 1.1;
            if (s.y > 1.1) s.y = -1.1;
            if (s.y < -1.1) s.y = 1.1;
          }
        }

        const scale = effect === 'warp-stars' ? 1 / s.z : 1;
        const sx = effect === 'warp-stars' ? cx + s.x * (W * 0.45) * scale : cx + s.x * (W * 0.5);
        const sy = effect === 'warp-stars' ? cy + s.y * (H * 0.45) * scale : cy + s.y * (H * 0.5);
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;

        const depthAlpha = effect === 'warp-stars' ? Math.min(1, (1.05 - s.z) * 1.15) : 0.72;
        const twinkle = 0.7 + 0.3 * Math.sin(simTime * 2.4 + s.x * 12);
        const alpha = depthAlpha * twinkle * (isDark ? 0.95 : 0.65);
        const r = s.size * (effect === 'warp-stars' ? Math.min(2.4, scale * 0.65) : 1);

        pts.push({ sx, sy, alpha, r, hue: isDark ? s.hue : '79, 70, 229' });

        if (effect === 'warp-stars' && animate) {
          const prevScale = 1 / Math.min(1, s.z + 0.045 * speedMulRef.current);
          const px = cx + s.x * (W * 0.45) * prevScale;
          const py = cy + s.y * (H * 0.45) * prevScale;
          ctx.strokeStyle = `rgba(${isDark ? s.hue : '99, 102, 241'}, ${(alpha * 0.55).toFixed(2)})`;
          ctx.lineWidth = r * 0.85;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(sx, sy);
          ctx.stroke();
        }

        ctx.fillStyle = `rgba(${isDark ? s.hue : '79, 70, 229'}, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Constellation links mode
      if (effect === 'constellation') {
        const limit = Math.min(pts.length, 75);
        for (let i = 0; i < limit; i++) {
          for (let j = i + 1; j < limit; j++) {
            const dx = pts[i].sx - pts[j].sx;
            const dy = pts[i].sy - pts[j].sy;
            const d2 = dx * dx + dy * dy;
            if (d2 < 14000) {
              const a = (1 - d2 / 14000) * (isDark ? 0.34 : 0.26);
              ctx.strokeStyle = `rgba(${isDark ? '167, 139, 250' : '99, 102, 241'}, ${a.toFixed(2)})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(pts[i].sx, pts[i].sy);
              ctx.lineTo(pts[j].sx, pts[j].sy);
              ctx.stroke();
            }
          }
        }
      }

      // Occasional cosmic shooting star
      if (animate) {
        if (!shooter.active && simTime >= nextShooterAt) {
          shooter = {
            active: true,
            x: W * (0.2 + Math.random() * 0.6),
            y: H * (0.08 + Math.random() * 0.25),
            vx: (Math.random() > 0.5 ? 1 : -1) * (420 + Math.random() * 220),
            vy: 180 + Math.random() * 140,
            life: 0,
          };
          nextShooterAt = simTime + 3.5 + Math.random() * 3.5;
        }
        if (shooter.active) {
          shooter.x += shooter.vx * scaledDt;
          shooter.y += shooter.vy * scaledDt;
          shooter.life += scaledDt;
          const tailX = shooter.x - shooter.vx * 0.14;
          const tailY = shooter.y - shooter.vy * 0.14;
          const grad = ctx.createLinearGradient(tailX, tailY, shooter.x, shooter.y);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(1, isDark ? 'rgba(233, 213, 255, 0.95)' : 'rgba(99, 102, 241, 0.8)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shooter.x, shooter.y);
          ctx.stroke();
          if (shooter.life > 0.85) shooter.active = false;
        }
      }
    };

    draw(0, 0.016);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const scaledDt = dt * speedMulRef.current;
      simTime += scaledDt;
      draw(simTime, scaledDt);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, effect, particleCount, cloudCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

const AURORA_PALETTES = {
  'polar-emerald': ['16, 185, 129', '6, 182, 212', '139, 92, 246'],
  'cosmic-violet': ['168, 85, 247', '99, 102, 241', '236, 72, 153'],
  'solar-crimson': ['244, 63, 94', '245, 158, 11', '20, 184, 166'],
} as const;

/**
 * Real-time undulating Aurora Borealis vertical light curtains & polar starfield.
 */
const AuroraCurtainCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  palette: keyof typeof AURORA_PALETTES;
  starCount?: number;
  ribbonCount?: number;
  glowIntensity?: number;
}> = ({
  isDark,
  animate,
  speedMul,
  palette,
  starCount = 70,
  ribbonCount = 3,
  glowIntensity = 0.9,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = AURORA_PALETTES[palette] || AURORA_PALETTES['polar-emerald'];
    const stars = Array.from({ length: Math.max(20, starCount) }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 53) % 620) / 1000,
      r: 0.8 + (i % 3) * 0.55,
      phase: i * 0.7,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      // Polar starfield (visible subtly in light mode too!)
      for (const s of stars) {
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.8 + s.phase));
        const alpha = twinkle * (isDark ? 0.85 : 0.38);
        ctx.fillStyle = isDark
          ? `rgba(224, 252, 245, ${alpha.toFixed(2)})`
          : `rgba(15, 118, 110, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sweeping vertical curtain ribbons
      const activeRibbons = Math.max(1, Math.min(5, ribbonCount));
      const stepX = Math.max(10, Math.floor(W / 95));
      for (let r = 0; r < activeRibbons; r++) {
        const rgb = colors[r % colors.length];
        const baseY = H * (0.28 + r * 0.08);
        const curtainH = H * (0.26 + r * 0.05);

        for (let x = 0; x <= W; x += stepX) {
          const nx = x / Math.max(W, 1);
          const wave =
            Math.sin(nx * 5.2 + t * (0.65 + r * 0.18) + r * 1.7) * (H * 0.07) +
            Math.cos(nx * 9.5 - t * 0.45 + r) * (H * 0.035);
          const shimmer =
            0.45 +
            0.55 * (0.5 + 0.5 * Math.sin(nx * 18 + t * 1.4 + r * 2.3));
          const topY = baseY + wave - curtainH * (0.55 + shimmer * 0.45);
          const botY = baseY + wave + curtainH * 0.28;
          const alpha = shimmer * (isDark ? 0.34 : 0.22) * glowIntensity;

          const grad = ctx.createLinearGradient(x, botY, x, topY);
          grad.addColorStop(0, `rgba(${rgb}, 0)`);
          grad.addColorStop(0.25, `rgba(${rgb}, ${alpha.toFixed(3)})`);
          grad.addColorStop(0.6, `rgba(${rgb}, ${(alpha * 0.55).toFixed(3)})`);
          grad.addColorStop(1, `rgba(${rgb}, 0)`);

          ctx.fillStyle = grad;
          ctx.fillRect(x, topY, stepX + 1.5, botY - topY);
        }
      }
    };

    draw(0);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      simTime += dt * speedMulRef.current;
      draw(simTime);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, palette, starCount, ribbonCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Continuous horizontally flowing Ocean Waves + Moonlight/Sunlight water shimmer.
 */
const OceanWavesCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  energy: 'calm' | 'rolling' | 'choppy';
  glintCount?: number;
  glowIntensity?: number;
}> = ({ isDark, animate, speedMul, energy, glintCount = 20, glowIntensity = 0.82 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const ampMul = energy === 'choppy' ? 1.55 : energy === 'calm' ? 0.6 : 1.0;
    const freqMul = energy === 'choppy' ? 1.35 : energy === 'calm' ? 0.8 : 1.0;

    const layers = [
      {
        yFrac: 0.56,
        amp: 14 * ampMul,
        freq: 0.005 * freqMul,
        speed: 0.85,
        fillDark: 'rgba(14, 116, 144, 0.34)',
        fillLight: 'rgba(56, 189, 248, 0.34)',
        crestDark: 'rgba(103, 232, 249, 0.30)',
        crestLight: 'rgba(255, 255, 255, 0.65)',
      },
      {
        yFrac: 0.65,
        amp: 18 * ampMul,
        freq: 0.0062 * freqMul,
        speed: -1.15,
        fillDark: 'rgba(12, 74, 110, 0.54)',
        fillLight: 'rgba(125, 211, 252, 0.45)',
        crestDark: 'rgba(56, 189, 248, 0.35)',
        crestLight: 'rgba(255, 255, 255, 0.72)',
      },
      {
        yFrac: 0.75,
        amp: 22 * ampMul,
        freq: 0.0046 * freqMul,
        speed: 1.45,
        fillDark: 'rgba(15, 39, 68, 0.78)',
        fillLight: 'rgba(186, 230, 253, 0.62)',
        crestDark: 'rgba(34, 211, 238, 0.38)',
        crestLight: 'rgba(255, 255, 255, 0.80)',
      },
      {
        yFrac: 0.86,
        amp: 26 * ampMul,
        freq: 0.0038 * freqMul,
        speed: -1.75,
        fillDark: 'rgba(6, 17, 34, 0.92)',
        fillLight: 'rgba(224, 242, 254, 0.84)',
        crestDark: 'rgba(56, 189, 248, 0.28)',
        crestLight: 'rgba(255, 255, 255, 0.90)',
      },
    ];

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);

      // Horizon glowing sun/moon column reflection
      const glowX = W * 0.5 + Math.sin(t * 0.3) * (W * 0.04);
      const glowY = H * 0.38;
      const orbGrad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, W * 0.28);
      if (isDark) {
        orbGrad.addColorStop(0, 'rgba(103, 232, 249, 0.28)');
        orbGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.10)');
        orbGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
      } else {
        orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        orbGrad.addColorStop(0.5, 'rgba(186, 230, 253, 0.35)');
        orbGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
      }
      ctx.fillStyle = orbGrad;
      ctx.fillRect(0, 0, W, H);

      // Draw each scrolling ocean wave layer
      const stepX = 16;
      for (let li = 0; li < layers.length; li++) {
        const L = layers[li];
        const baseY = H * L.yFrac;

        ctx.beginPath();
        ctx.moveTo(0, H);
        for (let x = 0; x <= W + stepX; x += stepX) {
          const y =
            baseY +
            Math.sin(x * L.freq + t * L.speed + li * 1.4) * L.amp +
            Math.cos(x * L.freq * 1.9 - t * L.speed * 0.7) * (L.amp * 0.4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.closePath();
        ctx.fillStyle = isDark ? L.fillDark : L.fillLight;
        ctx.fill();

        // Crisp shimmering crest line
        ctx.beginPath();
        for (let x = 0; x <= W + stepX; x += stepX) {
          const y =
            baseY +
            Math.sin(x * L.freq + t * L.speed + li * 1.4) * L.amp +
            Math.cos(x * L.freq * 1.9 - t * L.speed * 0.7) * (L.amp * 0.4);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = isDark ? L.crestDark : L.crestLight;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }

      // Shimmering water caustic glints on the lower surface
      const activeGlints = Math.max(8, glintCount);
      for (let i = 0; i < activeGlints; i++) {
        const wy = H * (0.62 + ((i * 19) % 34) / 100);
        const wx = ((W * ((i * 73) % 100)) / 100 + Math.sin(t * 0.9 + i) * 36 + W) % W;
        const len = 28 + (i % 5) * 14;
        const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.3));
        ctx.fillStyle = isDark
          ? `rgba(125, 211, 252, ${(0.28 * pulse * glowIntensity).toFixed(2)})`
          : `rgba(255, 255, 255, ${(0.45 * pulse * glowIntensity).toFixed(2)})`;
        ctx.fillRect(wx, wy, len, 1.8);
      }
    };

    draw(0);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      simTime += dt * speedMulRef.current;
      draw(simTime);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, energy, glintCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Volumetric rotating sunbeams + rising golden motes for Golden Dawn.
 */
const GoldenDawnCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  sunbeams: boolean;
  moteCount?: number;
  rayCount?: number;
  glowIntensity?: number;
}> = ({
  isDark,
  animate,
  speedMul,
  sunbeams,
  moteCount = 54,
  rayCount = 7,
  glowIntensity = 0.86,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: Math.max(16, moteCount) }, (_, i) => ({
      x: ((i * 89) % 1000) / 1000,
      y: ((i * 53) % 1000) / 1000,
      r: 1.4 + (i % 4) * 0.9,
      speedY: 0.025 + (i % 5) * 0.009,
      drift: 0.6 + (i % 3) * 0.4,
      phase: i * 0.9,
    }));

    const draw = (t: number, scaledDt: number) => {
      ctx.clearRect(0, 0, W, H);
      const sunX = W * 0.56 + Math.sin(t * 0.25) * 18;
      const sunY = H * 0.34;

      // Volumetric sweeping sunbeams
      if (sunbeams) {
        const activeRays = Math.max(3, Math.min(12, rayCount));
        for (let i = 0; i < activeRays; i++) {
          const angle =
            -0.3 + i * 0.28 + Math.sin(t * 0.35 + i * 1.1) * 0.08;
          const spread = 0.09 + (i % 2) * 0.04;
          const len = Math.max(W, H) * 1.1;
          const x1 = sunX + Math.cos(angle - spread) * len;
          const y1 = sunY + Math.sin(angle - spread) * len;
          const x2 = sunX + Math.cos(angle + spread) * len;
          const y2 = sunY + Math.sin(angle + spread) * len;
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.9 + i * 1.5);
          const alpha = (isDark ? 0.08 : 0.14) * (0.55 + 0.45 * pulse) * glowIntensity;

          const grad = ctx.createLinearGradient(sunX, sunY, (x1 + x2) / 2, (y1 + y2) / 2);
          grad.addColorStop(
            0,
            isDark ? `rgba(251, 191, 36, ${alpha * 1.4})` : `rgba(254, 240, 138, ${alpha * 1.6})`
          );
          grad.addColorStop(
            0.55,
            isDark ? `rgba(251, 113, 133, ${alpha * 0.45})` : `rgba(253, 186, 116, ${alpha * 0.5})`
          );
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(sunX, sunY);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Rising warm pollen / light motes
      for (const m of motes) {
        if (animate) {
          m.y -= m.speedY * scaledDt;
          if (m.y < -0.05) m.y = 1.05;
        }
        const mx = m.x * W + Math.sin(t * m.drift + m.phase) * 24;
        const my = m.y * H;
        const glow = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + m.phase));
        ctx.fillStyle = isDark
          ? `rgba(251, 191, 36, ${(glow * 0.65).toFixed(2)})`
          : `rgba(217, 119, 6, ${(glow * 0.45).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(mx, my, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw(0, 0.016);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const scaledDt = dt * speedMulRef.current;
      simTime += scaledDt;
      draw(simTime, scaledDt);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, sunbeams, moteCount, rayCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Autonomous Neural Network Constellation with travelling signal pulses for Studio Neural.
 */
const NeuralMeshCanvas: React.FC<{
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  mouseRef: React.MutableRefObject<{ nx: number; ny: number }>;
  keyPulse: number;
  nodeCount?: number;
  glowIntensity?: number;
}> = ({
  isDark,
  animate,
  speedMul,
  mouseRef,
  keyPulse,
  nodeCount = 46,
  glowIntensity = 0.88,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;
  const pulseRef = useRef(keyPulse);
  pulseRef.current = keyPulse;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: Math.max(18, nodeCount) }, (_, i) => ({
      x: ((i * 79) % 1000) / 1000,
      y: ((i * 131) % 1000) / 1000,
      vx: ((((i * 37) % 100) / 100) - 0.5) * 0.036,
      vy: ((((i * 61) % 100) / 100) - 0.5) * 0.036,
      r: 2 + (i % 3) * 0.9,
      isViolet: i % 3 === 0,
    }));

    const draw = (t: number, scaledDt: number) => {
      ctx.clearRect(0, 0, W, H);
      const mx = mouseRef.current.nx * W;
      const my = mouseRef.current.ny * H;
      const boost = pulseRef.current > 0 ? 1.45 : 1;

      if (animate) {
        for (const n of nodes) {
          n.x += n.vx * scaledDt * boost;
          n.y += n.vy * scaledDt * boost;
          if (n.x < 0.02 || n.x > 0.98) n.vx *= -1;
          if (n.y < 0.02 || n.y > 0.98) n.vy *= -1;
        }
      }

      const maxDist = Math.min(210, Math.max(130, W * 0.16));
      const maxDist2 = maxDist * maxDist;

      // Connect nearby nodes + animate travelling signal packets
      for (let i = 0; i < nodes.length; i++) {
        const x1 = nodes[i].x * W;
        const y1 = nodes[i].y * H;

        for (let j = i + 1; j < nodes.length; j++) {
          const x2 = nodes[j].x * W;
          const y2 = nodes[j].y * H;
          const dx = x2 - x1;
          const dy = y2 - y1;
          const d2 = dx * dx + dy * dy;

          if (d2 < maxDist2) {
            const strength = 1 - Math.sqrt(d2) / maxDist;
            const alpha = strength * (isDark ? 0.34 : 0.24);
            ctx.strokeStyle = nodes[i].isViolet
              ? `rgba(139, 92, 246, ${alpha.toFixed(2)})`
              : `rgba(6, 182, 212, ${alpha.toFixed(2)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Travelling synapse pulse along selected edges
            if (animate && (i + j) % 5 === 0) {
              const frac = (t * 0.55 + (i * 0.23 + j * 0.17)) % 1;
              const px = x1 + dx * frac;
              const py = y1 + dy * frac;
              ctx.fillStyle = isDark
                ? `rgba(34, 211, 238, ${(strength * 0.9).toFixed(2)})`
                : `rgba(8, 145, 178, ${(strength * 0.75).toFixed(2)})`;
              ctx.beginPath();
              ctx.arc(px, py, 2.1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Interactive link toward cursor
        const mdx = mx - x1;
        const mdy = my - y1;
        const md2 = mdx * mdx + mdy * mdy;
        if (md2 < maxDist2 * 1.2) {
          const mAlpha = (1 - Math.sqrt(md2) / (maxDist * 1.1)) * (isDark ? 0.42 : 0.3);
          ctx.strokeStyle = `rgba(34, 211, 238, ${mAlpha.toFixed(2)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(mx, my);
          ctx.stroke();
        }
      }

      // Draw glowing neural nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const x = n.x * W;
        const y = n.y * H;
        const pulse = (0.65 + 0.35 * Math.sin(t * 2.2 + i)) * glowIntensity;
        ctx.fillStyle = n.isViolet
          ? isDark
            ? `rgba(167, 139, 250, ${Math.min(0.95, 0.82 * pulse).toFixed(2)})`
            : `rgba(109, 40, 217, ${Math.min(0.85, 0.58 * pulse).toFixed(2)})`
          : isDark
          ? `rgba(34, 211, 238, ${Math.min(0.95, 0.85 * pulse).toFixed(2)})`
          : `rgba(8, 145, 178, ${Math.min(0.85, 0.62 * pulse).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(x, y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    draw(0, 0.016);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const scaledDt = dt * speedMulRef.current;
      simTime += scaledDt;
      draw(simTime, scaledDt);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [isDark, animate, mouseRef, nodeCount, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Atmospheric Particles Canvas for Photo Themes:
 * Snowfall (Alpine Dunes), Fireflies/Rain (Emerald Highlands),
 * Dust/Sunbeams (Amber Canyon), Shooting Stars/Polar Glow (Midnight Peaks).
 */
const PhotoAtmosphereCanvas: React.FC<{
  themeId: LiveThemeId;
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  snowIntensity: 'gentle' | 'brisk' | 'off';
  forestEffect: 'fireflies' | 'rain' | 'mist';
  canyonEffect: 'heat-dust' | 'sunbeams' | 'mist';
  midnightSky: 'shooting-stars' | 'polar-glow' | 'starfield';
  particleCount?: number;
  glowIntensity?: number;
}> = ({
  themeId,
  isDark,
  animate,
  speedMul,
  snowIntensity,
  forestEffect,
  canyonEffect,
  midnightSky,
  particleCount = 65,
  glowIntensity = 0.85,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * dpr);
      canvas.height = Math.floor(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const count =
      themeId === 'alpine-dunes' && snowIntensity === 'brisk'
        ? Math.round(particleCount * 1.65)
        : themeId === 'emerald-highlands' && forestEffect === 'rain'
        ? Math.round(particleCount * 1.65)
        : Math.max(16, particleCount);

    const particles = Array.from({ length: count }, (_, i) => ({
      x: ((i * 97) % 1000) / 1000,
      y: ((i * 59) % 1000) / 1000,
      r: 1.4 + (i % 4) * 0.9,
      speed: 0.1 + ((i * 17) % 10) * 0.028,
      sway: 0.55 + (i % 5) * 0.35,
      phase: i * 0.83,
    }));

    let meteor = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 };
    let nextMeteor = 0.9;

    const draw = (t: number, scaledDt: number) => {
      ctx.clearRect(0, 0, W, H);

      if (themeId === 'alpine-dunes' && snowIntensity !== 'off') {
        const wind = snowIntensity === 'brisk' ? 0.18 : 0.075;
        for (const p of particles) {
          if (animate) {
            p.y += p.speed * scaledDt * (snowIntensity === 'brisk' ? 1.7 : 1.05);
            p.x += wind * scaledDt;
            if (p.y > 1.04) p.y = -0.04;
            if (p.x > 1.04) p.x = -0.04;
          }
          const px = p.x * W + Math.sin(t * p.sway + p.phase) * 16;
          const py = p.y * H;
          ctx.fillStyle = isDark
            ? 'rgba(224, 242, 254, 0.84)'
            : 'rgba(255, 255, 255, 0.92)';
          ctx.beginPath();
          ctx.arc(px, py, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (themeId === 'misty-fjords') {
        // Drifting fjord sea-spray / luminous valley droplets above water & cliffs
        for (const p of particles) {
          if (animate) {
            p.x += p.speed * 0.22 * scaledDt;
            p.y += Math.sin(t * 0.6 + p.phase) * 0.014 * scaledDt;
            if (p.x > 1.05) p.x = -0.05;
          }
          const px = p.x * W;
          const py = (0.18 + p.y * 0.68) * H;
          const pulse = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.9 + p.phase))) * glowIntensity;
          ctx.fillStyle = isDark
            ? `rgba(186, 230, 253, ${Math.min(0.8, pulse * 0.65).toFixed(2)})`
            : `rgba(255, 255, 255, ${Math.min(0.9, pulse * 0.78).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(px, py, p.r * 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (themeId === 'emerald-highlands') {
        if (forestEffect === 'fireflies') {
          for (const p of particles) {
            if (animate) {
              p.y -= p.speed * 0.34 * scaledDt;
              p.x += Math.sin(t * 0.5 + p.phase) * 0.022 * scaledDt;
              if (p.y < -0.05) p.y = 1.05;
              if (p.x > 1.05) p.x = -0.05;
              if (p.x < -0.05) p.x = 1.05;
            }
            const px = p.x * W + Math.cos(t * 0.9 + p.phase) * 22;
            const py = p.y * H;
            const pulse =
              (0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.4 + p.phase))) * glowIntensity;
            const grad = ctx.createRadialGradient(px, py, 0, px, py, p.r * 5.2);
            grad.addColorStop(
              0,
              `rgba(167, 243, 208, ${Math.min(0.95, pulse * 0.92).toFixed(2)})`
            );
            grad.addColorStop(
              0.4,
              `rgba(52, 211, 153, ${Math.min(0.75, pulse * 0.48).toFixed(2)})`
            );
            grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, p.r * 5.2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (forestEffect === 'rain') {
          ctx.strokeStyle = isDark
            ? 'rgba(167, 243, 208, 0.34)'
            : 'rgba(240, 253, 244, 0.48)';
          ctx.lineWidth = 1.1;
          for (const p of particles) {
            if (animate) {
              p.y += p.speed * 5.2 * scaledDt;
              p.x += 0.12 * scaledDt;
              if (p.y > 1.05) p.y = -0.05;
              if (p.x > 1.05) p.x = -0.05;
            }
            const px = p.x * W;
            const py = p.y * H;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + 4, py + 16);
            ctx.stroke();
          }
        }
      } else if (themeId === 'amber-canyon') {
        if (canyonEffect === 'sunbeams') {
          for (let i = 0; i < 4; i++) {
            const x0 = W * (0.2 + i * 0.22) + Math.sin(t * 0.3 + i) * 32;
            const grad = ctx.createLinearGradient(x0, 0, x0 + W * 0.14, H);
            const a = (0.09 + 0.05 * Math.sin(t * 0.8 + i)) * glowIntensity;
            grad.addColorStop(0, `rgba(253, 224, 71, ${a.toFixed(2)})`);
            grad.addColorStop(0.6, `rgba(251, 146, 60, ${(a * 0.45).toFixed(2)})`);
            grad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(x0, 0);
            ctx.lineTo(x0 + 80, 0);
            ctx.lineTo(x0 + W * 0.22, H);
            ctx.lineTo(x0 + W * 0.08, H);
            ctx.closePath();
            ctx.fill();
          }
        }
        if (canyonEffect === 'heat-dust' || canyonEffect === 'sunbeams') {
          for (const p of particles) {
            if (animate) {
              p.x += p.speed * 0.4 * scaledDt;
              p.y -= p.speed * 0.15 * scaledDt;
              if (p.x > 1.05) p.x = -0.05;
              if (p.y < -0.05) p.y = 1.05;
            }
            const px = p.x * W;
            const py = p.y * H + Math.sin(t * p.sway + p.phase) * 12;
            const glow = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.6 + p.phase))) * glowIntensity;
            ctx.fillStyle = isDark
              ? `rgba(253, 186, 116, ${Math.min(0.85, glow * 0.6).toFixed(2)})`
              : `rgba(255, 237, 213, ${Math.min(0.9, glow * 0.75).toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (themeId === 'midnight-peaks') {
        // Slowly drifting + twinkling upper-sky stars
        for (const p of particles) {
          if (p.y > 0.62) continue;
          if (animate) {
            p.x += 0.008 * p.speed * scaledDt * 3;
            if (p.x > 1.02) p.x = -0.02;
          }
          const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * 2.3 + p.phase));
          const alpha = twinkle * (isDark ? 0.92 : 0.48) * glowIntensity;
          ctx.fillStyle = isDark
            ? `rgba(224, 231, 255, ${Math.min(0.98, alpha).toFixed(2)})`
            : `rgba(67, 56, 202, ${Math.min(0.8, alpha).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(p.x * W, p.y * H, p.r * 0.75, 0, Math.PI * 2);
          ctx.fill();
        }

        if (midnightSky === 'polar-glow') {
          const gx = W * 0.5 + Math.sin(t * 0.38) * (W * 0.14);
          const gy = H * 0.22;
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, W * 0.45);
          grad.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.26)' : 'rgba(99, 102, 241, 0.15)');
          grad.addColorStop(0.5, isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(56, 189, 248, 0.09)');
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H * 0.65);
        }

        if (animate && midnightSky === 'shooting-stars') {
          if (!meteor.active && t >= nextMeteor) {
            meteor = {
              active: true,
              x: W * (0.15 + Math.random() * 0.65),
              y: H * (0.06 + Math.random() * 0.2),
              vx: (Math.random() > 0.4 ? 1 : -1) * (480 + Math.random() * 200),
              vy: 170 + Math.random() * 140,
              life: 0,
            };
            nextMeteor = t + 2.2 + Math.random() * 2.8;
          }
          if (meteor.active) {
            meteor.x += meteor.vx * scaledDt;
            meteor.y += meteor.vy * scaledDt;
            meteor.life += scaledDt;
            const tx = meteor.x - meteor.vx * 0.15;
            const ty = meteor.y - meteor.vy * 0.15;
            const grad = ctx.createLinearGradient(tx, ty, meteor.x, meteor.y);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, isDark ? 'rgba(199, 210, 254, 0.95)' : 'rgba(67, 56, 202, 0.78)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(meteor.x, meteor.y);
            ctx.stroke();
            if (meteor.life > 0.85) meteor.active = false;
          }
        }
      }
    };

    draw(0, 0.016);
    if (!animate) return () => window.removeEventListener('resize', resize);

    let rafId = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      const scaledDt = dt * speedMulRef.current;
      simTime += scaledDt;
      draw(simTime, scaledDt);
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(rafId);
    };
  }, [
    themeId,
    isDark,
    animate,
    snowIntensity,
    forestEffect,
    canyonEffect,
    midnightSky,
    particleCount,
    glowIntensity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Real-time scanline water ripple & specular caustic shimmer canvas for Misty Fjords.
 */
const FjordWaterRippleCanvas: React.FC<{
  photoSrc: string;
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  intensity: 'calm' | 'lively' | 'off';
}> = ({ photoSrc, isDark, animate, speedMul, intensity }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    if (intensity === 'off') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let isCancelled = false;
    const img = new Image();
    img.src = photoSrc;

    const W = 720;
    const H = 260;
    canvas.width = W;
    canvas.height = H;

    const ampMul = intensity === 'calm' ? 0.55 : 1.15;

    const glints = Array.from({ length: 18 }, (_, i) => ({
      x: (i * 137) % W,
      y: 16 + ((i * 41) % (H - 32)),
      len: 42 + ((i * 23) % 85),
      speed: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 4),
      phase: i * 0.9,
      thickness: 1.2 + (i % 3) * 0.7,
    }));

    const renderFrame = (t: number) => {
      if (!img.complete || img.naturalWidth === 0) return;

      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const viewAspect = vw / vh;

      let cropW = img.naturalWidth;
      let cropH = img.naturalHeight;
      let cropX = 0;
      let cropY = 0;
      if (viewAspect > imgAspect) {
        cropH = img.naturalWidth / viewAspect;
        cropY = (img.naturalHeight - cropH) * 0.5;
      } else {
        cropW = img.naturalHeight * viewAspect;
        cropX = (img.naturalWidth - cropW) * 0.5;
      }

      const waterStartSrcY = cropY + cropH * 0.56;
      const waterSrcH = cropH * 0.44;

      ctx.clearRect(0, 0, W, H);

      const stripH = 2;
      for (let dy = 0; dy < H; dy += stripH) {
        const ny = dy / H;
        const wavePrimary = Math.sin(ny * 42 - t * 2.2) * (0.9 + ny * 6.5) * ampMul;
        const waveSecondary = Math.cos(ny * 23 + t * 1.4) * (0.5 + ny * 2.8) * ampMul;
        const dx = wavePrimary + waveSecondary;

        const sy = waterStartSrcY + ny * waterSrcH;
        const sh = Math.max(1, (stripH / H) * waterSrcH);

        ctx.drawImage(img, cropX, sy, cropW, sh, dx - 10, dy, W + 20, stripH + 0.5);
      }

      ctx.save();
      for (const g of glints) {
        const ny = g.y / H;
        const gx = ((g.x + t * g.speed) % (W + g.len * 2)) - g.len;
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.5 + g.phase));
        const alpha = (isDark ? 0.18 : 0.3) * pulse * (0.4 + ny * 0.6);

        const grad = ctx.createLinearGradient(gx, g.y, gx + g.len, g.y);
        const color = isDark ? `rgba(125, 211, 252, ${alpha})` : `rgba(255, 255, 255, ${alpha})`;
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(gx, g.y, g.len, g.thickness * (0.7 + ny * 0.8));
      }
      ctx.restore();
    };

    const onLoad = () => {
      if (!isCancelled) renderFrame(0);
    };
    img.addEventListener('load', onLoad);
    if (img.complete) renderFrame(0);

    if (!animate) {
      return () => {
        isCancelled = true;
        img.removeEventListener('load', onLoad);
      };
    }

    let lastFrame = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      if (isCancelled) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      simTime += dt * speedMulRef.current;
      if (now - lastFrame >= 33) {
        lastFrame = now;
        renderFrame(simTime);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      isCancelled = true;
      img.removeEventListener('load', onLoad);
      window.cancelAnimationFrame(rafId);
    };
  }, [photoSrc, isDark, animate, intensity]);

  if (intensity === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full pointer-events-none"
      style={{
        filter: isDark
          ? 'brightness(0.56) contrast(1.14) saturate(0.85)'
          : 'brightness(1.02) contrast(1.03) saturate(1.04)',
      }}
    />
  );
};

interface MistPreset {
  yMin: number;
  yMax: number;
  speedScale: number;
  opacityLight: number;
  opacityDark: number;
  rgbLight: string;
  rgbDark: string;
  count: number;
}

const MIST_PRESETS: Partial<Record<LiveThemeId, MistPreset>> = {
  'misty-fjords': {
    yMin: 0.28,
    yMax: 0.6,
    speedScale: 1.0,
    opacityLight: 0.52,
    opacityDark: 0.3,
    rgbLight: '245, 250, 255',
    rgbDark: '186, 230, 253',
    count: 14,
  },
  'alpine-dunes': {
    yMin: 0.42,
    yMax: 0.82,
    speedScale: 1.15,
    opacityLight: 0.44,
    opacityDark: 0.24,
    rgbLight: '255, 255, 255',
    rgbDark: '191, 219, 254',
    count: 12,
  },
  'emerald-highlands': {
    yMin: 0.34,
    yMax: 0.7,
    speedScale: 0.9,
    opacityLight: 0.5,
    opacityDark: 0.26,
    rgbLight: '240, 253, 248',
    rgbDark: '167, 243, 208',
    count: 14,
  },
  'amber-canyon': {
    yMin: 0.36,
    yMax: 0.72,
    speedScale: 0.95,
    opacityLight: 0.36,
    opacityDark: 0.22,
    rgbLight: '255, 244, 224',
    rgbDark: '251, 146, 60',
    count: 10,
  },
  'midnight-peaks': {
    yMin: 0.5,
    yMax: 0.8,
    speedScale: 0.85,
    opacityLight: 0.44,
    opacityDark: 0.34,
    rgbLight: '241, 245, 249',
    rgbDark: '165, 180, 252',
    count: 14,
  },
};

const AtmosphericMistCanvas: React.FC<{
  themeId: LiveThemeId;
  isDark: boolean;
  animate: boolean;
  speedMul: number;
  densityMul?: number;
  puffCount?: number;
}> = ({ themeId, isDark, animate, speedMul, densityMul = 1, puffCount }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preset = MIST_PRESETS[themeId];
  const speedMulRef = useRef(speedMul);
  speedMulRef.current = speedMul;

  useEffect(() => {
    if (!preset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 640;
    const H = 360;
    canvas.width = W;
    canvas.height = H;

    const activeCount = Math.max(6, puffCount || preset.count);
    const puffs = Array.from({ length: activeCount }, (_, i) => {
      const layer = i % 3;
      const yFrac = preset.yMin + ((i * 0.29) % 1) * (preset.yMax - preset.yMin);
      return {
        baseX: (i / activeCount) * (W + 280) - 140,
        baseY: yFrac * H,
        rx: (110 + ((i * 37) % 110)) * (layer === 2 ? 1.15 : 0.9),
        ry: 16 + ((i * 13) % 24),
        speed:
          (14 + layer * 9 + (i % 4) * 3) *
          preset.speedScale *
          (i % 5 === 0 ? -0.65 : 1),
        bobAmp: 4 + (i % 4) * 2,
        phase: i * 1.17,
        alphaMul: 0.55 + ((i * 19) % 45) / 100,
      };
    });

    const drawMist = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark ? preset.rgbDark : preset.rgbLight;
      const baseAlpha = (isDark ? preset.opacityDark : preset.opacityLight) * densityMul;

      for (const p of puffs) {
        const span = W + p.rx * 2.4;
        const rawX = p.baseX + t * p.speed;
        const wrappedX = ((((rawX + p.rx * 1.2) % span) + span) % span) - p.rx * 1.2;
        const cy = p.baseY + Math.sin(t * 0.45 + p.phase) * p.bobAmp;
        const alpha = Math.min(
          0.9,
          baseAlpha * p.alphaMul * (0.78 + 0.22 * Math.sin(t * 0.6 + p.phase))
        );

        ctx.save();
        ctx.translate(wrappedX, cy);
        ctx.scale(1, p.ry / p.rx);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.rx);
        grad.addColorStop(0, `rgba(${rgb}, ${alpha.toFixed(3)})`);
        grad.addColorStop(0.45, `rgba(${rgb}, ${(alpha * 0.52).toFixed(3)})`);
        grad.addColorStop(1, `rgba(${rgb}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.rx, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    drawMist(0);
    if (!animate) return;

    let rafId = 0;
    let lastFrame = 0;
    let prev = performance.now();
    let simTime = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      simTime += dt * speedMulRef.current;
      if (now - lastFrame >= 33) {
        lastFrame = now;
        drawMist(simTime);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [preset, isDark, animate, densityMul, puffCount]);

  if (!preset) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

const SCRIM_OPACITY_MAP: Record<ScrimIntensity, number> = {
  subtle: 0.42,
  balanced: 0.72,
  focus: 0.94,
};

export const LiveScreenBackdrop: React.FC<LiveScreenBackdropProps> = ({
  isEmpty = true,
  isChatView = true,
}) => {
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveMotion = useThemeStore((s) => s.liveMotion);
  const overrideReducedMotion = useThemeStore((s) => s.overrideReducedMotion);
  const prefersReducedMotion = useThemeStore((s) => s.prefersReducedMotion);
  const motionSpeed = useThemeStore((s) => s.motionSpeed);
  const scrimIntensity = useThemeStore((s) => s.scrimIntensity);
  const themeOptions = useThemeStore((s) => s.themeOptions);

  const shouldAnimate = liveMotion && (!prefersReducedMotion || overrideReducedMotion);
  const isDark = resolvedScheme === 'dark';
  const activeThemeDef = LIVE_THEMES.find((t) => t.id === liveTheme);
  const backdropConfig = getThemeBackdropConfig(liveTheme);
  const schemeKey = isDark ? 'dark' : 'light';
  const speedMul =
    (MOTION_SPEED_MULTIPLIER[motionSpeed] || 1) * backdropConfig.animationSpeed.canvasSpeed;

  const backdropRootRef = useRef<HTMLDivElement | null>(null);
  const mouseRef = useRef({ nx: 0.5, ny: 0.5 });
  const wavePathRef = useRef<SVGPathElement | null>(null);
  const [keyPulse, setKeyPulse] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const rawNoiseId = useId();
  const noiseFilterId = `backdrop-noise-${rawNoiseId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const photoSrc = activeThemeDef?.previewImage;
  const isNocturnalPhoto = Boolean(activeThemeDef?.isNocturnalPhoto);

  useEffect(() => {
    setImgFailed(false);
  }, [liveTheme]);

  useEffect(() => {
    const rootEl = backdropRootRef.current;
    if (!shouldAnimate) {
      if (rootEl) {
        rootEl.style.setProperty('--parallax-x', '0px');
        rootEl.style.setProperty('--parallax-y', '0px');
      }
      return;
    }

    let rafPending = 0;
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = e.clientY / Math.max(window.innerHeight, 1);
      mouseRef.current.nx = nx;
      mouseRef.current.ny = ny;

      if (!rafPending) {
        rafPending = window.requestAnimationFrame(() => {
          rafPending = 0;
          const el = backdropRootRef.current;
          if (el) {
            const px = ((mouseRef.current.nx - 0.5) * -18).toFixed(2);
            const py = ((mouseRef.current.ny - 0.5) * -12).toFixed(2);
            el.style.setProperty('--parallax-x', `${px}px`);
            el.style.setProperty('--parallax-y', `${py}px`);
          }
          if (wavePathRef.current) {
            const qx = 300 + (mouseRef.current.nx - 0.5) * 40;
            const qy = 160 - (24 + (mouseRef.current.ny - 0.5) * 36);
            wavePathRef.current.setAttribute('d', `M 0 160 Q ${qx.toFixed(1)} ${qy.toFixed(1)}, 600 160 T 1200 160`);
          }
        });
      }
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (rafPending) window.cancelAnimationFrame(rafPending);
    };
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate || liveTheme !== 'cyber-studio') return;
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        setKeyPulse((p) => p + 1);
        if (wavePathRef.current) {
          const qx = 300 + (mouseRef.current.nx - 0.5) * 40;
          wavePathRef.current.setAttribute('d', `M 0 160 Q ${qx.toFixed(1)} 108, 600 160 T 1200 160`);
        }
        clearTimeout(timer);
        timer = setTimeout(() => {
          setKeyPulse(0);
          if (wavePathRef.current) {
            const qx = 300 + (mouseRef.current.nx - 0.5) * 40;
            const qy = 160 - (24 + (mouseRef.current.ny - 0.5) * 36);
            wavePathRef.current.setAttribute('d', `M 0 160 Q ${qx.toFixed(1)} ${qy.toFixed(1)}, 600 160 T 1200 160`);
          }
        }, 280);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [shouldAnimate, liveTheme]);

  const needsContentScrim = !isChatView || !isEmpty;

  // Tailored photo filter (supports Alpine moonlit look so snow isn't muddy grey in dark mode!)
  const isAlpineMoonlit =
    liveTheme === 'alpine-dunes' && (themeOptions.alpineTime === 'moonlit' || isDark);

  const photoFilter = isNocturnalPhoto
    ? isDark
      ? 'brightness(0.86) contrast(1.08) saturate(1.04)'
      : 'brightness(1.16) contrast(0.96) saturate(0.90)'
    : isAlpineMoonlit
    ? isDark
      ? 'brightness(0.62) contrast(1.14) saturate(0.92) hue-rotate(10deg)'
      : 'brightness(0.88) contrast(1.08) saturate(0.95) hue-rotate(8deg)'
    : isDark
    ? 'brightness(0.52) contrast(1.14) saturate(0.90)'
    : 'brightness(1) contrast(1.02) saturate(1.04)';

  const mistDensityMul =
    themeOptions.mistDensity === 'dense'
      ? 1.45
      : themeOptions.mistDensity === 'light'
      ? 0.55
      : 1;

  return (
    <div
      ref={backdropRootRef}
      aria-hidden="true"
      data-aesthetic={backdropConfig.aesthetic}
      data-live-theme={liveTheme}
      data-motion-speed={motionSpeed}
      data-live-motion={shouldAnimate ? 'live' : 'paused'}
      style={{
        background: `var(--theme-backdrop-base, ${backdropConfig.baseGradient[schemeKey]})`,
        ['--photo-breath-scale' as string]: String(backdropConfig.animationSpeed.photoBreathScale),
        ['--photo-drift-x' as string]: `${backdropConfig.animationSpeed.photoDriftPx}px`,
        ['--photo-drift-y' as string]: `${Math.round(backdropConfig.animationSpeed.photoDriftPx * 0.72)}px`,
      }}
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0 transition-colors duration-700"
    >
      {/* 1. PHOTOGRAPHIC LIVE SCREENS */}
      {photoSrc && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: `var(--theme-backdrop-base, ${backdropConfig.baseGradient[schemeKey]})`,
          }}
        >
          {!imgFailed && (
            <div
              className="absolute inset-[-3%] will-change-transform transition-transform duration-300 ease-out"
              style={{
                transform: 'translate3d(var(--parallax-x, 0px), var(--parallax-y, 0px), 0)',
              }}
            >
              <div
                key={liveTheme}
                className={`w-full h-full ${shouldAnimate ? 'backdrop-photo-animated' : ''}`}
                style={{
                  transform: shouldAnimate ? undefined : 'scale(1.02)',
                }}
              >
                <img
                  src={photoSrc}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover object-center transition-[filter] duration-700"
                  style={{
                    filter: photoFilter,
                  }}
                />
              </div>
            </div>
          )}

          {/* Moonlit blue tint for Alpine Dunes moonlit mode */}
          {isAlpineMoonlit && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background:
                  'radial-gradient(circle at 75% 18%, rgba(56, 189, 248, 0.16), transparent 50%), linear-gradient(180deg, rgba(15, 23, 42, 0.28) 0%, rgba(15, 23, 42, 0.10) 60%, rgba(15, 23, 42, 0.34) 100%)',
              }}
            />
          )}

          {/* Real-Time Scanline Water Ripples for Misty Fjords */}
          {liveTheme === 'misty-fjords' && !imgFailed && (
            <div
              className="absolute inset-x-0 top-[56%] bottom-0 overflow-hidden"
              style={{
                WebkitMaskImage:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.88) 14%, rgba(0,0,0,1) 100%)',
                maskImage:
                  'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.88) 14%, rgba(0,0,0,1) 100%)',
              }}
            >
              <FjordWaterRippleCanvas
                photoSrc={photoSrc}
                isDark={isDark}
                animate={shouldAnimate}
                speedMul={speedMul}
                intensity={themeOptions.waterRipple || 'lively'}
              />
            </div>
          )}

          {/* Live Procedural Drifting Mist Canvas */}
          <AtmosphericMistCanvas
            themeId={liveTheme}
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            densityMul={mistDensityMul}
            puffCount={backdropConfig.particleDensity.secondaryCount}
          />

          {/* Theme-Specific Photo Atmospheric Particles (Snow, Fireflies, Rain, Dust/Sunbeams, Shooting Stars) */}
          <PhotoAtmosphereCanvas
            themeId={liveTheme}
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            snowIntensity={themeOptions.snowIntensity || 'gentle'}
            forestEffect={themeOptions.forestEffect || 'fireflies'}
            canyonEffect={themeOptions.canyonEffect || 'heat-dust'}
            midnightSky={themeOptions.midnightSky || 'shooting-stars'}
            particleCount={backdropConfig.particleDensity.count}
            glowIntensity={backdropConfig.particleDensity.glowIntensity}
          />

          {/* Static fallback star markers when dark */}
          {isDark && liveTheme !== 'midnight-peaks' && (
            <div className="absolute inset-0">
              {STAR_POSITIONS.map((star, idx) => (
                <span
                  key={idx}
                  className="absolute rounded-full bg-blue-100/70"
                  style={{
                    top: star.top,
                    left: star.left,
                    width: star.size,
                    height: star.size,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. AURORA BOREALIS (Real-Time Undulating Curtain Canvas + Arctic Mountains) */}
      {liveTheme === 'aurora-borealis' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <AuroraCurtainCanvas
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            palette={themeOptions.auroraPalette || 'polar-emerald'}
            starCount={backdropConfig.particleDensity.count}
            ribbonCount={backdropConfig.particleDensity.secondaryCount}
            glowIntensity={backdropConfig.particleDensity.glowIntensity}
          />

          {/* Crisp Arctic Horizon Silhouette */}
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-[34%]"
          >
            <path
              d="M0,224L120,192C240,160,480,96,720,117.3C960,139,1200,245,1320,277.3L1440,309L1440,320L0,320Z"
              fill={isDark ? 'rgba(9, 16, 30, 0.85)' : 'rgba(255, 255, 255, 0.45)'}
            />
            <path
              d="M0,256L180,213.3C360,171,720,85,1080,128C1260,149.3,1350,203,1440,235L1440,320L0,320Z"
              fill={isDark ? 'rgba(5, 10, 20, 0.94)' : 'rgba(235, 247, 245, 0.72)'}
            />
          </svg>
        </div>
      )}

      {/* 3. PACIFIC HORIZON (Continuous Flowing Ocean Waves Canvas) */}
      {liveTheme === 'oceanic-horizon' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <OceanWavesCanvas
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            energy={themeOptions.oceanWaveEnergy || 'rolling'}
            glintCount={backdropConfig.particleDensity.count}
            glowIntensity={backdropConfig.particleDensity.glowIntensity}
          />
        </div>
      )}

      {/* 4. GOLDEN DAWN (Sweeping Sunbeams + Rising Motes Canvas + Hills) */}
      {liveTheme === 'solar-meadow' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <GoldenDawnCanvas
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            sunbeams={themeOptions.dawnSunbeams !== false}
            moteCount={backdropConfig.particleDensity.count}
            rayCount={backdropConfig.particleDensity.secondaryCount}
            glowIntensity={backdropConfig.particleDensity.glowIntensity}
          />

          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-[36%]"
          >
            <path
              d="M0,192C320,128,640,224,960,176C1160,146,1320,165,1440,185L1440,320L0,320Z"
              fill={isDark ? 'rgba(41, 28, 30, 0.72)' : 'rgba(232, 217, 198, 0.65)'}
            />
            <path
              d="M0,245C380,295,820,185,1440,235L1440,320L0,320Z"
              fill={isDark ? 'rgba(18, 15, 22, 0.92)' : 'rgba(248, 242, 232, 0.86)'}
            />
          </svg>
        </div>
      )}

      {/* 5. NEBULA (3D Flying Starfield & Swirling Cosmic Clouds Canvas) */}
      {liveTheme === 'nebula' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <NebulaCanvas
            isDark={isDark}
            animate={shouldAnimate}
            speedMul={speedMul}
            effect={themeOptions.nebulaEffect || 'warp-stars'}
            particleCount={backdropConfig.particleDensity.count}
            cloudCount={backdropConfig.particleDensity.secondaryCount}
            glowIntensity={backdropConfig.particleDensity.glowIntensity}
          />
        </div>
      )}

      {/* 6. CYBERPUNK (Matrix Rain Canvas + Neon Glow + Optional CRT Scanline) */}
      {liveTheme === 'cyberpunk' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <div
            className="absolute -top-28 -left-24 w-[44vw] h-[44vh] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(34, 255, 136, 0.22), transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.20), transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-28 -right-24 w-[48vw] h-[48vh] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(255, 42, 212, 0.24), transparent 70%)'
                : 'radial-gradient(circle, rgba(217, 70, 239, 0.18), transparent 70%)',
            }}
          />

          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              isEmpty && isChatView ? 'opacity-100' : 'opacity-72'
            }`}
          >
            <MatrixRainCanvas
              isDark={isDark}
              animate={shouldAnimate}
              speedMul={speedMul}
              palette={themeOptions.cyberPalette || 'neon-emerald'}
              density={themeOptions.cyberDensity || 'normal'}
              particleCount={backdropConfig.particleDensity.count}
              glowIntensity={backdropConfig.particleDensity.glowIntensity}
            />
          </div>

          {themeOptions.cyberScanlines !== false && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.08) 3px)',
                opacity: isDark ? 0.55 : 0.2,
              }}
            />
          )}
        </div>
      )}

      {/* 7. STUDIO NEURAL (Scrolling Cyber-Grid + Autonomous Neural Mesh Canvas + Reactive Wave) */}
      {liveTheme === 'cyber-studio' && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isEmpty && isChatView ? 'opacity-100' : 'opacity-65'
          }`}
          style={{
            background: backdropConfig.baseGradient[schemeKey],
          }}
        >
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 dark:bg-cyan-500/12 blur-3xl cyber-aurora-cyan" />
          <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-purple-500/15 dark:bg-violet-600/12 blur-3xl cyber-aurora-violet" />

          {themeOptions.neuralMesh !== false && (
            <NeuralMeshCanvas
              isDark={isDark}
              animate={shouldAnimate}
              speedMul={speedMul}
              mouseRef={mouseRef}
              keyPulse={keyPulse}
              nodeCount={backdropConfig.particleDensity.count}
              glowIntensity={backdropConfig.particleDensity.glowIntensity}
            />
          )}

          {isChatView && (
            <svg
              viewBox="0 0 1200 320"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-72 opacity-50 dark:opacity-60"
            >
              <defs>
                <linearGradient id="studio-wave-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                  <stop offset="30%" stopColor="rgba(6, 182, 212, 0.45)" />
                  <stop offset="70%" stopColor="rgba(139, 92, 246, 0.45)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                </linearGradient>
              </defs>
              <path
                ref={wavePathRef}
                d="M 0 160 Q 300 136, 600 160 T 1200 160"
                fill="none"
                stroke="url(#studio-wave-cyan)"
                strokeWidth={keyPulse > 0 ? 2.2 : 1.4}
                className="transition-[stroke-width] duration-200"
              />
            </svg>
          )}
        </div>
      )}

      {/* Per-Theme Architectural Grid Overlay (driven by THEME_BACKDROP_CONFIGS) */}
      {backdropConfig.gridOverlay?.enabled && (
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            shouldAnimate ? 'cyber-ground-grid-animated' : ''
          }`}
          style={{
            opacity: isDark
              ? backdropConfig.gridOverlay.opacityDark
              : backdropConfig.gridOverlay.opacityLight,
            backgroundImage: (() => {
              const lineColor = isDark
                ? backdropConfig.gridOverlay.colorDark
                : backdropConfig.gridOverlay.colorLight;
              return `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`;
            })(),
            backgroundSize: `${backdropConfig.gridOverlay.cellSizePx}px ${backdropConfig.gridOverlay.cellSizePx}px`,
          }}
        />
      )}

      {/* Per-Theme Multi-Point Radial Aesthetic Overlays (Animated at theme speed) */}
      {backdropConfig.radialOverlays[schemeKey].length > 0 && (
        <div
          className={`absolute inset-[-4%] pointer-events-none transition-opacity duration-700 ${
            shouldAnimate ? 'backdrop-radials-animated' : ''
          }`}
          style={{
            backgroundImage: `var(--theme-backdrop-radials, ${backdropConfig.radialOverlays[schemeKey].join(', ')})`,
          }}
        />
      )}

      {/* Per-Theme Procedural Film-Grain / Noise Overlay */}
      {backdropConfig.noiseOverlay.enabled && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            opacity: isDark
              ? backdropConfig.noiseOverlay.opacityDark
              : backdropConfig.noiseOverlay.opacityLight,
            mixBlendMode: backdropConfig.noiseOverlay.blendMode,
          }}
        >
          <filter id={noiseFilterId}>
            <feTurbulence
              type="fractalNoise"
              baseFrequency={backdropConfig.noiseOverlay.baseFrequency}
              numOctaves={2}
              stitchTiles="stitch"
            />
          </filter>
          <rect width="100%" height="100%" filter={`url(#${noiseFilterId})`} />
        </svg>
      )}

      {/* Per-Theme Vignette Depth Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-700"
        style={{
          background: `var(--theme-backdrop-vignette, ${backdropConfig.vignette[schemeKey]})`,
        }}
      />

      {/* Adaptive Theme-Tinted Contrast Scrim (Never hides animations completely) */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={{
          backgroundColor: 'var(--theme-scrim-overlay)',
          opacity: needsContentScrim
            ? SCRIM_OPACITY_MAP[scrimIntensity]
            : isDark
            ? 0.14
            : 0.06,
          backdropFilter: needsContentScrim
            ? scrimIntensity === 'subtle'
              ? 'blur(0px)'
              : 'blur(2px)'
            : 'none',
        }}
      />
    </div>
  );
};
