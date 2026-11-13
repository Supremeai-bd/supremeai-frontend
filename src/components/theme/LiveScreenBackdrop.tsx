import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useThemeStore, LIVE_THEMES, LiveThemeId } from '../../stores/useThemeStore';

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

const MOTE_POSITIONS = [
  { top: '48%', left: '18%', size: 4, duration: 11, delay: 0 },
  { top: '62%', left: '32%', size: 3, duration: 14, delay: 1.5 },
  { top: '54%', left: '52%', size: 5, duration: 12, delay: 0.7 },
  { top: '68%', left: '68%', size: 3.5, duration: 15, delay: 2.2 },
  { top: '44%', left: '82%', size: 4, duration: 13, delay: 1.1 },
  { top: '74%', left: '44%', size: 3, duration: 16, delay: 0.4 },
];

const MATRIX_GLYPHS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンABCDEF0123456789#$%';

const MatrixRainCanvas: React.FC<{ isDark: boolean; animate: boolean }> = ({
  isDark,
  animate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const fontSize = 15;
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    let isMagentaCol: boolean[] = [];

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
      speeds = Array.from({ length: columns }, (_, i) => 0.42 + ((i * 13) % 7) * 0.08);
      isMagentaCol = Array.from({ length: columns }, (_, i) => i % 7 === 0);
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
        const magenta = isMagentaCol[i];

        for (let t = 0; t < tailLen; t++) {
          const row = headRow - t;
          if (row < 0) continue;
          const glyph = MATRIX_GLYPHS[(i * 11 + row * 3) % MATRIX_GLYPHS.length];
          const alpha = Math.max(0.08, (1 - t / tailLen) * (isDark ? 0.62 : 0.36));
          if (t === 0) {
            ctx.fillStyle = magenta
              ? isDark
                ? 'rgba(255, 85, 224, 0.9)'
                : 'rgba(192, 38, 211, 0.65)'
              : isDark
              ? 'rgba(134, 255, 190, 0.92)'
              : 'rgba(4, 120, 87, 0.68)';
          } else {
            ctx.fillStyle = magenta
              ? isDark
                ? `rgba(255, 42, 212, ${alpha})`
                : `rgba(192, 38, 211, ${alpha})`
              : isDark
              ? `rgba(34, 255, 136, ${alpha})`
              : `rgba(5, 150, 105, ${alpha})`;
          }
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
      if (time - lastTime >= 42) {
        lastTime = time;
        const width = window.innerWidth;
        const height = window.innerHeight;

        ctx.fillStyle = isDark
          ? 'rgba(3, 8, 7, 0.14)'
          : 'rgba(236, 253, 245, 0.18)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = `600 ${fontSize}px "JetBrains Mono", monospace`;

        for (let i = 0; i < columns; i++) {
          const glyph =
            MATRIX_GLYPHS[Math.floor(Math.random() * MATRIX_GLYPHS.length)];
          const x = i * fontSize;
          const y = Math.floor(drops[i]) * fontSize;
          const magenta = isMagentaCol[i] || Math.random() > 0.94;

          ctx.fillStyle = magenta
            ? isDark
              ? 'rgba(255, 42, 212, 0.88)'
              : 'rgba(192, 38, 211, 0.68)'
            : isDark
            ? 'rgba(34, 255, 136, 0.88)'
            : 'rgba(4, 120, 87, 0.68)';

          if (y > 0 && y < height + fontSize) {
            ctx.fillText(glyph, x, y);
          }

          if (y > height && Math.random() > 0.972) {
            drops[i] = 0;
          } else {
            drops[i] += speeds[i];
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
  }, [isDark, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

/**
 * Real-time scanline water ripple & specular caustic shimmer canvas for Misty Fjords.
 * Renders the lower lake portion of the photograph with progressive sinusoidal wave
 * displacement + gentle light glints at 30fps using a compact offscreen-sized buffer.
 */
const FjordWaterRippleCanvas: React.FC<{
  photoSrc: string;
  isDark: boolean;
  animate: boolean;
}> = ({ photoSrc, isDark, animate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
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

    // Precomputed caustic shimmer bands
    const glints = Array.from({ length: 18 }, (_, i) => ({
      x: ((i * 137) % W),
      y: 16 + ((i * 41) % (H - 32)),
      len: 42 + ((i * 23) % 85),
      speed: (i % 2 === 0 ? 1 : -1) * (10 + (i % 5) * 4),
      phase: i * 0.9,
      thickness: 1.2 + (i % 3) * 0.7,
    }));

    const renderFrame = (tSec: number) => {
      if (!img.complete || img.naturalWidth === 0) return;

      const vw = Math.max(window.innerWidth, 1);
      const vh = Math.max(window.innerHeight, 1);
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const viewAspect = vw / vh;

      // Compute exact object-cover crop rectangle in source image coordinates
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

      // Sample lower 44% (top 56% -> 100%)
      const waterStartSrcY = cropY + cropH * 0.56;
      const waterSrcH = cropH * 0.44;

      ctx.clearRect(0, 0, W, H);

      // Draw horizontal 2px scanline wave strips with perspective-scaled ripple amplitude
      const stripH = 2;
      for (let dy = 0; dy < H; dy += stripH) {
        const ny = dy / H; // 0 at shoreline -> 1 at bottom foreground
        const wavePrimary = Math.sin(ny * 42 - tSec * 2.15) * (0.9 + ny * 6.5);
        const waveSecondary = Math.cos(ny * 23 + tSec * 1.35) * (0.5 + ny * 2.8);
        const dx = wavePrimary + waveSecondary;

        const sy = waterStartSrcY + ny * waterSrcH;
        const sh = Math.max(1, (stripH / H) * waterSrcH);

        ctx.drawImage(
          img,
          cropX,
          sy,
          cropW,
          sh,
          dx - 10,
          dy,
          W + 20,
          stripH + 0.5
        );
      }

      // Overlay soft moving water caustic glints
      ctx.save();
      for (const g of glints) {
        const ny = g.y / H;
        const gx = ((g.x + tSec * g.speed) % (W + g.len * 2)) - g.len;
        const pulse = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(tSec * 1.4 + g.phase));
        const alpha = (isDark ? 0.16 : 0.28) * pulse * (0.4 + ny * 0.6);

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
    const start = performance.now();
    const tick = (now: number) => {
      if (isCancelled) return;
      if (now - lastFrame >= 33) {
        lastFrame = now;
        renderFrame((now - start) / 1000);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      isCancelled = true;
      img.removeEventListener('load', onLoad);
      window.cancelAnimationFrame(rafId);
    };
  }, [photoSrc, isDark, animate]);

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
    yMax: 0.60,
    speedScale: 1.0,
    opacityLight: 0.52,
    opacityDark: 0.30,
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
    yMax: 0.70,
    speedScale: 0.9,
    opacityLight: 0.50,
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
    yMin: 0.50,
    yMax: 0.80,
    speedScale: 0.85,
    opacityLight: 0.44,
    opacityDark: 0.34,
    rgbLight: '241, 245, 249',
    rgbDark: '165, 180, 252',
    count: 14,
  },
};

/**
 * Lightweight GPU-friendly procedural mist & drifting fog canvas.
 * Draws layered soft cloud wisps gliding continuously across mountains & valleys.
 */
const AtmosphericMistCanvas: React.FC<{
  themeId: LiveThemeId;
  isDark: boolean;
  animate: boolean;
}> = ({ themeId, isDark, animate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const preset = MIST_PRESETS[themeId];

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

    const puffs = Array.from({ length: preset.count }, (_, i) => {
      const layer = i % 3; // 0: far slow, 1: mid, 2: near faster
      const yFrac = preset.yMin + ((i * 0.29) % 1) * (preset.yMax - preset.yMin);
      return {
        baseX: (i / preset.count) * (W + 280) - 140,
        baseY: yFrac * H,
        rx: (110 + ((i * 37) % 110)) * (layer === 2 ? 1.15 : 0.9),
        ry: 16 + ((i * 13) % 24),
        speed: (14 + layer * 9 + (i % 4) * 3) * preset.speedScale * (i % 5 === 0 ? -0.65 : 1),
        bobAmp: 4 + (i % 4) * 2,
        phase: i * 1.17,
        alphaMul: 0.55 + ((i * 19) % 45) / 100,
      };
    });

    const drawMist = (tSec: number) => {
      ctx.clearRect(0, 0, W, H);
      const rgb = isDark ? preset.rgbDark : preset.rgbLight;
      const baseAlpha = isDark ? preset.opacityDark : preset.opacityLight;

      for (const p of puffs) {
        const span = W + p.rx * 2.4;
        const rawX = p.baseX + tSec * p.speed;
        const wrappedX = ((((rawX + p.rx * 1.2) % span) + span) % span) - p.rx * 1.2;
        const cy = p.baseY + Math.sin(tSec * 0.45 + p.phase) * p.bobAmp;
        const alpha = baseAlpha * p.alphaMul * (0.78 + 0.22 * Math.sin(tSec * 0.6 + p.phase));

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
    const start = performance.now();
    const tick = (now: number) => {
      if (now - lastFrame >= 33) {
        lastFrame = now;
        drawMist((now - start) / 1000);
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [preset, isDark, animate]);

  if (!preset) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

export const LiveScreenBackdrop: React.FC<LiveScreenBackdropProps> = ({
  isEmpty = true,
  isChatView = true,
}) => {
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveMotion = useThemeStore((s) => s.liveMotion);
  const prefersReducedMotion = useThemeStore((s) => s.prefersReducedMotion);

  const shouldAnimate = liveMotion && !prefersReducedMotion;
  const isDark = resolvedScheme === 'dark';

  const [mouse, setMouse] = useState({ nx: 0.5, ny: 0.5 });
  const [keyPulse, setKeyPulse] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const activeThemeDef = LIVE_THEMES.find((t) => t.id === liveTheme);
  const photoSrc = activeThemeDef?.previewImage;
  const isNocturnalPhoto = Boolean(activeThemeDef?.isNocturnalPhoto);

  useEffect(() => {
    setImgFailed(false);
  }, [liveTheme]);

  useEffect(() => {
    if (!shouldAnimate) return;
    const onMove = (e: MouseEvent) => {
      setMouse({
        nx: e.clientX / Math.max(window.innerWidth, 1),
        ny: e.clientY / Math.max(window.innerHeight, 1),
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [shouldAnimate]);

  useEffect(() => {
    if (!shouldAnimate || liveTheme !== 'cyber-studio') return;
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        setKeyPulse((p) => p + 1);
        clearTimeout(timer);
        timer = setTimeout(() => setKeyPulse(0), 320);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [shouldAnimate, liveTheme]);

  const px = shouldAnimate ? (mouse.nx - 0.5) * -18 : 0;
  const py = shouldAnimate ? (mouse.ny - 0.5) * -12 : 0;

  // Determine contrast scrim opacity based on whether chat is empty or actively displaying prose/dashboards
  const needsContentScrim = !isChatView || !isEmpty;

  const photoFilter = isNocturnalPhoto
    ? isDark
      ? 'brightness(0.84) contrast(1.08) saturate(1.02)'
      : 'brightness(1.22) contrast(0.95) saturate(0.86)'
    : isDark
    ? 'brightness(0.46) contrast(1.16) saturate(0.84)'
    : 'brightness(1) contrast(1.02) saturate(1.03)';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0 transition-colors duration-700"
    >
      {/* 1. PHOTOGRAPHIC LIVE SCREENS (Alpine Dunes, Misty Fjords, Emerald Highlands, Amber Canyon, Midnight Peaks) */}
      {photoSrc && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? activeThemeDef?.darkPreviewGradient
              : activeThemeDef?.lightPreviewGradient,
          }}
        >
          {!imgFailed && (
            <motion.div
              key={liveTheme}
              initial={{ opacity: 0.6 }}
              animate={
                shouldAnimate
                  ? {
                      opacity: 1,
                      x: px,
                      y: py,
                      scale: [1.03, 1.055, 1.03],
                    }
                  : { opacity: 1, x: 0, y: 0, scale: 1.01 }
              }
              transition={
                shouldAnimate
                  ? {
                      opacity: { duration: 0.5 },
                      x: { type: 'spring', stiffness: 35, damping: 24 },
                      y: { type: 'spring', stiffness: 35, damping: 24 },
                      scale: { duration: 22, repeat: Infinity, ease: 'easeInOut' },
                    }
                  : { duration: 0.4 }
              }
              className="absolute inset-[-2%] will-change-transform"
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
            </motion.div>
          )}

          {/* Soft daylight mist veil for nocturnal mountain photography when Light mode is active */}
          {isNocturnalPhoto && !isDark && (
            <div
              className="absolute inset-0 transition-opacity duration-700"
              style={{
                background:
                  'linear-gradient(180deg, rgba(241, 245, 249, 0.44) 0%, rgba(248, 250, 252, 0.22) 55%, rgba(241, 245, 249, 0.38) 100%)',
              }}
            />
          )}

          {/* Real-Time Scanline Water Ripples & Shimmer for Misty Fjords (lower 44% lake surface) */}
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
              />
            </div>
          )}

          {/* Live Procedural Drifting Mist & Valley Fog Canvas */}
          <AtmosphericMistCanvas
            themeId={liveTheme}
            isDark={isDark}
            animate={shouldAnimate}
          />

          {/* Nocturnal moonlit veil & stars when OS switches to Dark */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 ${
              isDark ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: isNocturnalPhoto
                ? 'radial-gradient(circle at 75% 18%, rgba(129, 140, 248, 0.16), transparent 45%), linear-gradient(180deg, rgba(5, 8, 20, 0.32) 0%, rgba(15, 23, 42, 0.16) 55%, rgba(5, 8, 20, 0.44) 100%)'
                : 'radial-gradient(circle at 75% 18%, rgba(147, 197, 253, 0.16), transparent 45%), linear-gradient(180deg, rgba(6, 13, 28, 0.52) 0%, rgba(12, 23, 44, 0.24) 55%, rgba(8, 13, 24, 0.50) 100%)',
            }}
          >
            {STAR_POSITIONS.map((star, idx) => (
              <motion.span
                key={idx}
                animate={
                  shouldAnimate
                    ? { opacity: [0.25, 0.85, 0.25], scale: [1, 1.25, 1] }
                    : { opacity: 0.5 }
                }
                transition={{
                  duration: 4 + (idx % 3),
                  delay: star.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-full bg-blue-100"
                style={{
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  boxShadow: '0 0 8px rgba(191, 219, 254, 0.8)',
                }}
              />
            ))}
          </div>

          {/* Subtle floating atmospheric motes */}
          {shouldAnimate &&
            MOTE_POSITIONS.map((mote, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [-10, 14, -10],
                  x: [-8, 10, -8],
                  opacity: isDark ? [0.12, 0.35, 0.12] : [0.2, 0.55, 0.2],
                }}
                transition={{
                  duration: mote.duration,
                  delay: mote.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-full blur-[0.5px]"
                style={{
                  top: mote.top,
                  left: mote.left,
                  width: mote.size,
                  height: mote.size,
                  backgroundColor: isDark ? 'rgba(186, 230, 253, 0.7)' : 'rgba(255, 251, 235, 0.85)',
                }}
              />
            ))}
        </div>
      )}

      {/* 2. AURORA BOREALIS (Living Polar Curtains) */}
      {liveTheme === 'aurora-borealis' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #030914 0%, #071829 45%, #0c1324 100%)'
              : 'linear-gradient(180deg, #c7e6f5 0%, #def2f1 50%, #ede9fe 100%)',
          }}
        >
          {/* Undulating Aurora Ribbon 1 */}
          <motion.div
            animate={
              shouldAnimate
                ? {
                    x: [px * 1.4 - 40, px * 1.4 + 40, px * 1.4 - 40],
                    y: [py * 1.2 - 15, py * 1.2 + 20, py * 1.2 - 15],
                    scale: [1, 1.08, 1],
                  }
                : {}
            }
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -left-1/4 w-[150%] h-[65%] rounded-[100%] blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 60% 45% at 45% 50%, rgba(16, 185, 129, 0.34), rgba(6, 182, 212, 0.22) 45%, transparent 75%)'
                : 'radial-gradient(ellipse 60% 45% at 45% 50%, rgba(20, 184, 166, 0.24), rgba(56, 189, 248, 0.18) 45%, transparent 75%)',
            }}
          />

          {/* Undulating Aurora Ribbon 2 */}
          <motion.div
            animate={
              shouldAnimate
                ? {
                    x: [-px * 1.1 + 35, -px * 1.1 - 35, -px * 1.1 + 35],
                    y: [-py + 12, -py - 18, -py + 12],
                    scale: [1.04, 0.96, 1.04],
                  }
                : {}
            }
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[12%] -right-1/4 w-[140%] h-[60%] rounded-[100%] blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 55% 45% at 60% 50%, rgba(139, 92, 246, 0.30), rgba(59, 130, 246, 0.20) 50%, transparent 78%)'
                : 'radial-gradient(ellipse 55% 45% at 60% 50%, rgba(139, 92, 246, 0.18), rgba(14, 165, 233, 0.16) 50%, transparent 78%)',
            }}
          />

          {/* Arctic Valley Mist */}
          <motion.div
            animate={
              shouldAnimate
                ? { x: ['-9%', '9%', '-9%'], opacity: isDark ? [0.22, 0.42, 0.22] : [0.28, 0.5, 0.28] }
                : { opacity: 0.22 }
            }
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-[-10%] bottom-[16%] h-36 blur-2xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(94, 234, 212, 0.22), transparent 75%)'
                : 'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(255, 255, 255, 0.6), transparent 75%)',
            }}
          />

          {/* Crisp Arctic Horizon Silhouette */}
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-[36%]"
          >
            <path
              d="M0,224L120,192C240,160,480,96,720,117.3C960,139,1200,245,1320,277.3L1440,309L1440,320L0,320Z"
              fill={isDark ? 'rgba(9, 16, 30, 0.85)' : 'rgba(255, 255, 255, 0.55)'}
            />
            <path
              d="M0,256L180,213.3C360,171,720,85,1080,128C1260,149.3,1350,203,1440,235L1440,320L0,320Z"
              fill={isDark ? 'rgba(5, 10, 20, 0.95)' : 'rgba(241, 245, 249, 0.8)'}
            />
          </svg>

          {isDark &&
            STAR_POSITIONS.map((star, idx) => (
              <motion.span
                key={idx}
                animate={shouldAnimate ? { opacity: [0.2, 0.9, 0.2] } : { opacity: 0.45 }}
                transition={{ duration: 3.5 + (idx % 3), delay: star.delay, repeat: Infinity }}
                className="absolute rounded-full bg-teal-100"
                style={{ top: star.top, left: star.left, width: star.size, height: star.size }}
              />
            ))}
        </div>
      )}

      {/* 3. PACIFIC HORIZON (Living Ocean Swells + Specular Shimmer) */}
      {liveTheme === 'oceanic-horizon' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, #040d1a 0%, #092038 52%, #071322 100%)'
              : 'linear-gradient(180deg, #b8ddf4 0%, #e0f2fe 48%, #e2e8f0 100%)',
          }}
        >
          {/* Horizon Solar / Lunar Halo */}
          <motion.div
            animate={shouldAnimate ? { scale: [1, 1.07, 1], x: px * 0.8 } : {}}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[34rem] h-[16rem] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(56, 189, 248, 0.25), rgba(14, 165, 233, 0.08) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(186, 230, 253, 0.4) 60%, transparent 80%)',
            }}
          />

          {/* Coastal Sea Mist */}
          <motion.div
            animate={
              shouldAnimate
                ? { x: ['-8%', '8%', '-8%'], opacity: isDark ? [0.18, 0.34, 0.18] : [0.28, 0.5, 0.28] }
                : { opacity: 0.22 }
            }
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-[-10%] top-[44%] h-28 blur-2xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(125, 211, 252, 0.22), transparent 76%)'
                : 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255, 255, 255, 0.65), transparent 76%)',
            }}
          />

          {/* Living Layered Wave Horizons */}
          <svg
            viewBox="0 0 1440 420"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-[52%]"
          >
            <motion.path
              animate={
                shouldAnimate
                  ? {
                      d: [
                        'M0,120 C320,75 620,165 960,115 C1180,82 1320,110 1440,125 L1440,420 L0,420 Z',
                        'M0,135 C340,165 660,80 980,130 C1200,160 1340,95 1440,115 L1440,420 L0,420 Z',
                        'M0,120 C320,75 620,165 960,115 C1180,82 1320,110 1440,125 L1440,420 L0,420 Z',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
              d="M0,120 C320,75 620,165 960,115 C1180,82 1320,110 1440,125 L1440,420 L0,420 Z"
              fill={isDark ? 'rgba(14, 116, 144, 0.24)' : 'rgba(125, 211, 252, 0.35)'}
            />
            <motion.path
              animate={
                shouldAnimate
                  ? {
                      d: [
                        'M0,190 C360,230 720,145 1080,195 C1260,220 1360,185 1440,175 L1440,420 L0,420 Z',
                        'M0,175 C360,145 720,235 1080,180 C1260,155 1360,205 1440,195 L1440,420 L0,420 Z',
                        'M0,190 C360,230 720,145 1080,195 C1260,220 1360,185 1440,175 L1440,420 L0,420 Z',
                      ],
                    }
                  : {}
              }
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
              d="M0,190 C360,230 720,145 1080,195 C1260,220 1360,185 1440,175 L1440,420 L0,420 Z"
              fill={isDark ? 'rgba(15, 23, 42, 0.68)' : 'rgba(241, 245, 249, 0.65)'}
            />
            <path
              d="M0,275 C420,245 860,315 1440,260 L1440,420 L0,420 Z"
              fill={isDark ? 'rgba(8, 13, 24, 0.88)' : 'rgba(248, 250, 252, 0.82)'}
            />
          </svg>

          {/* Ocean Surface Caustic Shimmer Glint */}
          <motion.div
            animate={
              shouldAnimate
                ? { x: ['-10%', '10%', '-10%'], opacity: isDark ? [0.16, 0.34, 0.16] : [0.24, 0.48, 0.24] }
                : { opacity: 0.2 }
            }
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-[-10%] bottom-[12%] h-24 blur-xl will-change-transform"
            style={{
              mixBlendMode: 'soft-light',
              background: isDark
                ? 'radial-gradient(ellipse 46% 50% at 50% 50%, rgba(56, 189, 248, 0.36), transparent 72%)'
                : 'radial-gradient(ellipse 46% 50% at 50% 50%, rgba(255, 255, 255, 0.75), transparent 72%)',
            }}
          />
        </div>
      )}

      {/* 4. GOLDEN DAWN (Warm Horizon Rays, Valley Mist & Light Motes) */}
      {liveTheme === 'solar-meadow' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? 'linear-gradient(175deg, #0d111d 0%, #1f192c 48%, #2c1d18 100%)'
              : 'linear-gradient(175deg, #dbeafe 0%, #f5efe6 46%, #f3e4cd 100%)',
          }}
        >
          {/* Warm Horizon Sun */}
          <motion.div
            animate={
              shouldAnimate
                ? { scale: [1, 1.09, 1], x: px * 0.9, y: py * 0.7 }
                : {}
            }
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[28%] left-[55%] -translate-x-1/2 w-[38rem] h-[22rem] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(245, 158, 11, 0.24), rgba(244, 63, 94, 0.12) 55%, transparent 80%)'
                : 'radial-gradient(circle, rgba(254, 240, 138, 0.75), rgba(253, 186, 116, 0.35) 55%, transparent 80%)',
            }}
          />

          {/* Soft Morning Valley Mist */}
          <motion.div
            animate={
              shouldAnimate
                ? { x: ['-8%', '8%', '-8%'], opacity: isDark ? [0.16, 0.32, 0.16] : [0.3, 0.54, 0.3] }
                : { opacity: 0.22 }
            }
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-x-[-10%] bottom-[18%] h-36 blur-2xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse 62% 55% at 48% 50%, rgba(251, 191, 36, 0.2), transparent 75%)'
                : 'radial-gradient(ellipse 62% 55% at 48% 50%, rgba(255, 251, 235, 0.76), transparent 75%)',
            }}
          />

          {/* Soft Layered Hills */}
          <svg
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
            className="absolute bottom-0 inset-x-0 w-full h-[40%]"
          >
            <path
              d="M0,192C320,128,640,224,960,176C1160,146,1320,165,1440,185L1440,320L0,320Z"
              fill={isDark ? 'rgba(41, 28, 30, 0.7)' : 'rgba(232, 217, 198, 0.72)'}
            />
            <path
              d="M0,245C380,295,820,185,1440,235L1440,320L0,320Z"
              fill={isDark ? 'rgba(18, 15, 22, 0.92)' : 'rgba(248, 244, 238, 0.92)'}
            />
          </svg>

          {shouldAnimate &&
            MOTE_POSITIONS.map((mote, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [0, -18, 0],
                  opacity: [0.15, 0.6, 0.15],
                }}
                transition={{
                  duration: mote.duration,
                  delay: mote.delay,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute rounded-full"
                style={{
                  top: mote.top,
                  left: mote.left,
                  width: mote.size,
                  height: mote.size,
                  backgroundColor: isDark ? 'rgba(251, 191, 36, 0.55)' : 'rgba(217, 119, 6, 0.35)',
                }}
              />
            ))}
        </div>
      )}

      {/* 5. NEBULA (Deep Indigo & Violet Cosmic Backdrop) */}
      {liveTheme === 'nebula' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? 'radial-gradient(ellipse 95% 75% at 50% 35%, #23114f 0%, #12082e 48%, #060314 100%)'
              : 'radial-gradient(ellipse 95% 75% at 50% 35%, #eef2ff 0%, #e0e7ff 46%, #ede9fe 100%)',
          }}
        >
          {/* Primary Deep Violet Nebula Cloud */}
          <motion.div
            animate={
              shouldAnimate
                ? {
                    x: [px * 1.5 - 30, px * 1.5 + 35, px * 1.5 - 30],
                    y: [py * 1.3 - 20, py * 1.3 + 22, py * 1.3 - 20],
                    scale: [1, 1.1, 1],
                  }
                : {}
            }
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-24 -left-24 w-[68vw] h-[68vh] rounded-full blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 45% 45%, rgba(124, 58, 237, 0.42), rgba(79, 70, 229, 0.24) 50%, transparent 78%)'
                : 'radial-gradient(circle at 45% 45%, rgba(129, 140, 248, 0.34), rgba(167, 139, 250, 0.24) 50%, transparent 78%)',
            }}
          />

          {/* Secondary Indigo-Amethyst Cosmic Core */}
          <motion.div
            animate={
              shouldAnimate
                ? {
                    x: [-px * 1.2 + 28, -px * 1.2 - 32, -px * 1.2 + 28],
                    y: [-py * 1.1 + 18, -py * 1.1 - 24, -py * 1.1 + 18],
                    scale: [1.05, 0.95, 1.05],
                  }
                : {}
            }
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-[-12%] right-[-10%] w-[62vw] h-[64vh] rounded-full blur-3xl will-change-transform"
            style={{
              background: isDark
                ? 'radial-gradient(circle at 55% 55%, rgba(168, 85, 247, 0.36), rgba(67, 56, 202, 0.22) 52%, transparent 78%)'
                : 'radial-gradient(circle at 55% 55%, rgba(192, 132, 252, 0.30), rgba(99, 102, 241, 0.18) 52%, transparent 78%)',
            }}
          />

          {/* Subtle Central Celestial Dust Halo */}
          <motion.div
            animate={shouldAnimate ? { opacity: [0.35, 0.65, 0.35], scale: [0.98, 1.04, 0.98] } : {}}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[54rem] h-[24rem] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(ellipse, rgba(139, 92, 246, 0.24), rgba(79, 70, 229, 0.1) 60%, transparent 80%)'
                : 'radial-gradient(ellipse, rgba(255, 255, 255, 0.65), rgba(196, 181, 253, 0.3) 60%, transparent 80%)',
            }}
          />

          {/* Twinkling Deep-Space Starfield */}
          {STAR_POSITIONS.map((star, idx) => (
            <motion.span
              key={idx}
              animate={
                shouldAnimate
                  ? { opacity: [0.25, 0.95, 0.25], scale: [1, 1.3, 1] }
                  : { opacity: isDark ? 0.65 : 0.35 }
              }
              transition={{
                duration: 3.2 + (idx % 4),
                delay: star.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute rounded-full"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                backgroundColor: isDark ? '#e9d5ff' : '#6366f1',
                boxShadow: isDark
                  ? '0 0 10px rgba(192, 132, 252, 0.85)'
                  : '0 0 6px rgba(99, 102, 241, 0.45)',
              }}
            />
          ))}
        </div>
      )}

      {/* 6. CYBERPUNK (Neon Green & Magenta Digital-Matrix Backdrop) */}
      {liveTheme === 'cyberpunk' && (
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            background: isDark
              ? 'linear-gradient(165deg, #020806 0%, #04130d 50%, #1c051a 100%)'
              : 'linear-gradient(165deg, #ecfdf5 0%, #d1fae5 52%, #fae8ff 100%)',
          }}
        >
          {/* Neon Green & Magenta Ambient Glow Corners */}
          <div
            className="absolute -top-28 -left-24 w-[44vw] h-[44vh] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(34, 255, 136, 0.20), transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.22), transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-28 -right-24 w-[48vw] h-[48vh] rounded-full blur-3xl"
            style={{
              background: isDark
                ? 'radial-gradient(circle, rgba(255, 42, 212, 0.22), transparent 70%)'
                : 'radial-gradient(circle, rgba(217, 70, 239, 0.20), transparent 70%)',
            }}
          />

          {/* Digital-Matrix Glyph Rain Canvas */}
          <div
            className={`absolute inset-0 transition-opacity duration-500 ${
              isEmpty && isChatView ? 'opacity-95' : 'opacity-45'
            }`}
          >
            <MatrixRainCanvas isDark={isDark} animate={shouldAnimate} />
          </div>

          {/* Subtle Neon Grid Horizon */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: isDark
                ? 'linear-gradient(to right, rgba(34, 255, 136, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 42, 212, 0.06) 1px, transparent 1px)'
                : 'linear-gradient(to right, rgba(4, 120, 87, 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(192, 38, 211, 0.06) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
        </div>
      )}

      {/* 7. STUDIO NEURAL (Original Cyber-Ground Grid + Neural Wave) */}
      {liveTheme === 'cyber-studio' && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isEmpty && isChatView ? 'opacity-100' : 'opacity-40'
          }`}
        >
          <div className="absolute inset-0 bg-[#f8fafc] dark:bg-[#080b11] transition-colors" />
          <div className="absolute inset-0 cyber-ground-grid" />
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 dark:bg-cyan-500/10 blur-3xl cyber-aurora-cyan" />
          <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-purple-500/15 dark:bg-violet-600/10 blur-3xl cyber-aurora-violet" />

          {isChatView && (
            <svg
              viewBox="0 0 1200 320"
              preserveAspectRatio="none"
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-72 opacity-55 dark:opacity-65"
            >
              <defs>
                <linearGradient id="studio-wave-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
                  <stop offset="30%" stopColor="rgba(6, 182, 212, 0.45)" />
                  <stop offset="70%" stopColor="rgba(139, 92, 246, 0.45)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
                </linearGradient>
              </defs>
              <motion.path
                animate={
                  shouldAnimate
                    ? {
                        d: `M 0 160 Q ${300 + (mouse.nx - 0.5) * 40} ${
                          160 - (keyPulse > 0 ? 52 : 24 + (mouse.ny - 0.5) * 36)
                        }, 600 160 T 1200 160`,
                      }
                    : { d: 'M 0 160 Q 300 136, 600 160 T 1200 160' }
                }
                transition={{ type: 'spring', stiffness: 90, damping: 18 }}
                fill="none"
                stroke="url(#studio-wave-cyan)"
                strokeWidth={keyPulse > 0 ? 2.2 : 1.4}
              />
            </svg>
          )}
        </div>
      )}

      {/* Measured Contrast Scrim when displaying active chat threads or dense dashboard views */}
      {liveTheme !== 'cyber-studio' && (
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            needsContentScrim
              ? 'bg-white/65 dark:bg-[#080b11]/75 backdrop-blur-[3px]'
              : isDark
              ? 'bg-slate-950/15'
              : 'bg-transparent'
          }`}
        />
      )}
    </div>
  );
};
