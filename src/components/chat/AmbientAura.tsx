import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface AmbientAuraProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isInteractive?: boolean;
}

/**
 * AmbientAura
 * A futuristic, living neural web and glowing orb component.
 * Renders layered cyber-aurora halos, rotating constellation geometry,
 * and responsive spring physics tracking mouse movement and typing pulses.
 */
export const AmbientAura: React.FC<AmbientAuraProps> = ({
  size = 'md',
  className = '',
  isInteractive = true,
}) => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isKeyPulse, setIsKeyPulse] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Gentle mouse parallax tracking
  useEffect(() => {
    if (!isInteractive) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 36;
      const ny = (e.clientY / window.innerHeight - 0.5) * 36;
      setMouseOffset({ x: nx, y: ny });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isInteractive]);

  // Keyboard typing resonance effect
  useEffect(() => {
    if (!isInteractive) return;

    let timer: ReturnType<typeof setTimeout>;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional hotkeys
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        setIsKeyPulse(true);
        clearTimeout(timer);
        timer = setTimeout(() => setIsKeyPulse(false), 380);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isInteractive]);

  // Size mappings
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-56 h-56',
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center select-none ${sizeClasses} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Deep Background Plasma Glow (Layer 1: Cyan/Blue) */}
      <motion.div
        animate={{
          x: mouseOffset.x * 0.8,
          y: mouseOffset.y * 0.8,
          scale: isKeyPulse ? 1.25 : isHovered ? 1.15 : [1, 1.08, 1],
          opacity: isKeyPulse ? 0.75 : [0.35, 0.55, 0.35],
        }}
        transition={{
          x: { type: 'spring', stiffness: 50, damping: 20 },
          y: { type: 'spring', stiffness: 50, damping: 20 },
          scale: isKeyPulse ? { duration: 0.2 } : { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          opacity: isKeyPulse ? { duration: 0.2 } : { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/40 via-blue-600/30 to-indigo-600/40 blur-3xl"
      />

      {/* 2. Secondary Floating Energy Blob (Layer 2: Violet/Magenta counter-drift) */}
      <motion.div
        animate={{
          x: -mouseOffset.x * 0.6,
          y: -mouseOffset.y * 0.6,
          scale: isKeyPulse ? 1.2 : [1.05, 0.95, 1.05],
          rotate: [0, 180, 360],
        }}
        transition={{
          x: { type: 'spring', stiffness: 45, damping: 22 },
          y: { type: 'spring', stiffness: 45, damping: 22 },
          scale: { duration: 9, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
        }}
        className="absolute inset-2 rounded-full bg-gradient-to-bl from-purple-500/30 via-pink-500/20 to-cyan-400/30 blur-2xl opacity-60"
      />

      {/* 3. Neural Constellation Web (Geometric Rotating SVG) */}
      <motion.svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full pointer-events-none"
        animate={{
          rotate: 360,
          x: mouseOffset.x * 0.3,
          y: mouseOffset.y * 0.3,
        }}
        transition={{
          rotate: { duration: 32, repeat: Infinity, ease: 'linear' },
          x: { type: 'spring', stiffness: 70, damping: 24 },
          y: { type: 'spring', stiffness: 70, damping: 24 },
        }}
      >
        <defs>
          <linearGradient id="neural-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Orbiting dashed guidance tracks */}
        <circle
          cx="100"
          cy="100"
          r="84"
          fill="none"
          stroke="url(#neural-line-grad)"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-60"
        />
        <circle
          cx="100"
          cy="100"
          r="62"
          fill="none"
          stroke="rgba(0, 240, 255, 0.15)"
          strokeWidth="1"
        />

        {/* Neural Network Interconnecting Strands */}
        <line x1="40" y1="70" x2="100" y2="35" stroke="url(#neural-line-grad)" strokeWidth="1" />
        <line x1="100" y1="35" x2="160" y2="70" stroke="url(#neural-line-grad)" strokeWidth="1" />
        <line x1="160" y1="70" x2="145" y2="145" stroke="url(#neural-line-grad)" strokeWidth="1" />
        <line x1="145" y1="145" x2="55" y2="145" stroke="url(#neural-line-grad)" strokeWidth="1" />
        <line x1="55" y1="145" x2="40" y2="70" stroke="url(#neural-line-grad)" strokeWidth="1" />
        <line x1="100" y1="35" x2="100" y2="100" stroke="url(#neural-line-grad)" strokeWidth="0.8" strokeDasharray="2 3" />
        <line x1="40" y1="70" x2="100" y2="100" stroke="url(#neural-line-grad)" strokeWidth="0.8" strokeDasharray="2 3" />
        <line x1="160" y1="70" x2="100" y2="100" stroke="url(#neural-line-grad)" strokeWidth="0.8" strokeDasharray="2 3" />

        {/* Synaptic Node Particles */}
        <circle cx="40" cy="70" r="3" fill="#00f0ff" className="animate-pulse" />
        <circle cx="100" cy="35" r="3.5" fill="#a78bfa" />
        <circle cx="160" cy="70" r="3" fill="#38bdf8" />
        <circle cx="145" cy="145" r="2.5" fill="#818cf8" />
        <circle cx="55" cy="145" r="3" fill="#34d399" />
      </motion.svg>

      {/* 4. Counter-Rotating Synaptic Orbit (Reverse angle for depth) */}
      <motion.div
        animate={{
          rotate: -360,
          scale: isKeyPulse ? 1.12 : isHovered ? 1.06 : 1,
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { type: 'spring', stiffness: 180, damping: 16 },
        }}
        className="absolute inset-4 rounded-full border border-cyan-400/20 dark:border-cyan-400/30 border-t-cyan-400/70 border-r-transparent pointer-events-none"
      />

      {/* 5. Central Frosted Core Node with SupremeAI/Gemini Star */}
      <motion.div
        animate={{
          scale: isKeyPulse ? 1.18 : isHovered ? 1.1 : [1, 1.04, 1],
          boxShadow: isKeyPulse
            ? '0 0 40px rgba(0,240,255,0.6)'
            : isHovered
            ? '0 0 32px rgba(0,240,255,0.45)'
            : '0 0 24px rgba(0,240,255,0.22)',
        }}
        transition={{
          scale: isKeyPulse ? { duration: 0.18 } : { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          boxShadow: { duration: 0.25 },
        }}
        className="relative w-14 h-14 rounded-2xl bg-white/85 dark:bg-[#0c101d]/90 backdrop-blur-2xl border border-cyan-500/40 flex items-center justify-center shadow-lg transition-colors cursor-pointer"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
          <path
            d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
            fill="url(#ambient-core-grad)"
          />
          <defs>
            <linearGradient id="ambient-core-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#00f0ff" />
              <stop offset="0.5" stopColor="#3b82f6" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>

        {/* Small live pulsing status spark */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900 animate-ping opacity-75" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-slate-900" />
      </motion.div>
    </div>
  );
};

