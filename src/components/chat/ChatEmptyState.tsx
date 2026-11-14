import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RolePersona, ModelDetail } from '../../types';
import { useThemeStore } from '../../stores/useThemeStore';
import { useI18n } from '../../utils/i18n';

interface ChatEmptyStateProps {
  activeRole: RolePersona;
  activeModel: ModelDetail;
  userName?: string;
  developerMode?: boolean;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  activeRole,
  activeModel,
  userName = 'Ziaul',
}) => {
  const [isKeyPulse, setIsKeyPulse] = useState(false);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const isScenic = liveTheme !== 'cyber-studio';
  const { t } = useI18n();

  const firstName = userName.split(' ')[0].replace(/[^a-zA-Z0-9_-]/g, '') || 'there';

  // React subtly when user types on keyboard
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace') {
        setIsKeyPulse(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setIsKeyPulse(false), 260);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      className={`relative z-10 flex flex-col items-center justify-center text-center px-3 @[480px]/chat:px-6 py-3 @[480px]/chat:py-4 select-none w-full max-w-3xl mx-auto ${
        isScenic ? 'rounded-3xl' : ''
      }`}
    >
      {/* SupremeAI Cognitive Emblem */}
      <motion.div
        animate={{
          scale: isKeyPulse ? 1.14 : [1, 1.04, 1],
        }}
        transition={
          isKeyPulse
            ? { duration: 0.18 }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="mb-3 @[520px]/chat:mb-4 w-9 h-9 @[440px]/chat:w-11 @[440px]/chat:h-11 @[560px]/chat:w-12 @[560px]/chat:h-12 rounded-xl @[520px]/chat:rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-cyan-500/30 flex items-center justify-center shadow-[0_8px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_0_28px_rgba(0,240,255,0.2)]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 @[520px]/chat:w-6 @[520px]/chat:h-6">
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

      {/* SupremeAI Personal Workspace Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`text-xl @[400px]/chat:text-2xl @[540px]/chat:text-3xl @[680px]/chat:text-4xl font-semibold tracking-tight leading-tight text-slate-900 dark:text-white ${
          isScenic ? 'drop-shadow-[0_1px_12px_rgba(255,255,255,0.65)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]' : ''
        }`}
      >
        {t.emptyGreetingPrefix}{' '}
        <span className="theme-accent-gradient-text">
          {firstName}?
        </span>
      </motion.h1>

      {/* Responsive typographic metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-[10px] @[480px]/chat:text-xs mt-2 @[520px]/chat:mt-2.5 font-sans max-w-full ${
          isScenic
            ? 'px-2.5 @[480px]/chat:px-3.5 py-1 rounded-xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-xs'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span>{activeModel.name}</span>
        <span aria-hidden="true">·</span>
        <span>{activeRole.name}</span>
        <span aria-hidden="true">·</span>
        <span className="theme-accent-text font-medium">SupremeAI Studio</span>
      </motion.div>
    </div>
  );
};
