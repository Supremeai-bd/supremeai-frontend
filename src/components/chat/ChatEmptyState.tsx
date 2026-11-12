import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RolePersona, ModelDetail } from '../../types';

interface ChatEmptyStateProps {
  activeRole: RolePersona;
  activeModel: ModelDetail;
  userName?: string;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  activeRole,
  activeModel,
  userName = 'Ziaul',
}) => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isKeyPulse, setIsKeyPulse] = useState(false);

  const firstName = userName.split(' ')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'there';

  // React to mouse movement gently for living ambient orb parallax
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 26;
      const ny = (e.clientY / window.innerHeight - 0.5) * 26;
      setMouseOffset({ x: nx, y: ny });
    };
    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // React subtly when user types on keyboard
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace') {
        setIsKeyPulse(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setIsKeyPulse(false), 320);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-8 select-none">
      {/* Interactive React Ambient Neural Orb */}
      <div className="relative w-32 h-32 mb-7 flex items-center justify-center">
        {/* Outer reactive plasma halo */}
        <motion.div
          animate={{
            x: mouseOffset.x * 0.9,
            y: mouseOffset.y * 0.9,
            scale: isKeyPulse ? 1.16 : [1, 1.07, 1],
            opacity: isKeyPulse ? 0.65 : [0.35, 0.52, 0.35],
          }}
          transition={{
            x: { type: 'spring', stiffness: 60, damping: 18 },
            y: { type: 'spring', stiffness: 60, damping: 18 },
            scale: isKeyPulse
              ? { duration: 0.25 }
              : { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            opacity: isKeyPulse
              ? { duration: 0.25 }
              : { duration: 6, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400/35 via-blue-500/25 to-violet-500/35 blur-2xl"
        />

        {/* Rotating orbital ring */}
        <motion.div
          animate={{
            rotate: 360,
            x: mouseOffset.x * 0.35,
            y: mouseOffset.y * 0.35,
          }}
          transition={{
            rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
            x: { type: 'spring', stiffness: 80, damping: 20 },
            y: { type: 'spring', stiffness: 80, damping: 20 },
          }}
          className="absolute inset-3 rounded-full border border-cyan-400/25 dark:border-cyan-400/30 border-dashed"
        />

        {/* Inner counter-rotating neural ring */}
        <motion.div
          animate={{
            rotate: -360,
            scale: isKeyPulse ? 1.08 : 1,
          }}
          transition={{
            rotate: { duration: 15, repeat: Infinity, ease: 'linear' },
            scale: { type: 'spring', stiffness: 200, damping: 15 },
          }}
          className="absolute inset-6 rounded-full border border-violet-400/25 dark:border-violet-400/30"
        />

        {/* Core Gemini / SupremeAI Star */}
        <motion.div
          animate={{
            scale: isKeyPulse ? 1.15 : [1, 1.04, 1],
          }}
          transition={
            isKeyPulse
              ? { duration: 0.2 }
              : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
          }
          className="relative w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center shadow-[0_0_28px_rgba(0,240,255,0.2)]"
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
            <path
              d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
              fill="url(#ambient-star-grad)"
            />
            <defs>
              <linearGradient
                id="ambient-star-grad"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#06B6D4" />
                <stop offset="0.5" stopColor="#3B82F6" />
                <stop offset="1" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      </div>

      {/* Gemini-Style Clean Personal Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white"
      >
        Where should we start,{' '}
        <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 bg-clip-text text-transparent">
          {firstName}?
        </span>
      </motion.h1>

      {/* Clean unboxed typographic metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-3 font-sans"
      >
        <span>{activeModel.name}</span>
        <span aria-hidden="true">·</span>
        <span>{activeRole.name}</span>
        <span aria-hidden="true">·</span>
        <span className="text-cyan-600 dark:text-cyan-400 font-medium">SupremeAI Studio</span>
      </motion.div>
    </div>
  );
};
