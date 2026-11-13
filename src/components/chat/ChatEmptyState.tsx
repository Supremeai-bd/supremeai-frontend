import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PenLine, Bug, FileText, Layers, Lightbulb, Compass } from 'lucide-react';
import { RolePersona, ModelDetail } from '../../types';
import { useThemeStore } from '../../stores/useThemeStore';

interface ChatEmptyStateProps {
  activeRole: RolePersona;
  activeModel: ModelDetail;
  userName?: string;
  developerMode?: boolean;
  onSelectPrompt?: (prompt: string) => void;
}

const DEV_STARTER_PROMPTS = [
  {
    id: 'draft',
    title: 'Draft & Edit',
    subtitle: 'Write clear specs, emails, or release notes',
    prompt: 'Help me draft a concise, structured technical product update for our engineering team and customers.',
    icon: PenLine,
  },
  {
    id: 'debug',
    title: 'Debug Code',
    subtitle: 'Find root causes and TypeScript fixes',
    prompt: 'Analyze a tricky async race condition in React/TypeScript state management and show me a clean, leak-free fix.',
    icon: Bug,
  },
  {
    id: 'summarize',
    title: 'Summarize Docs',
    subtitle: 'Extract key decisions and action items',
    prompt: 'Summarize complex technical architecture notes into executive bullet points, risks, and next action items.',
    icon: FileText,
  },
  {
    id: 'architect',
    title: 'Architecture Plan',
    subtitle: 'Design scalable APIs and data flows',
    prompt: 'Design a resilient multi-tenant API architecture with rate limiting, caching, and zero-downtime deployment.',
    icon: Layers,
  },
];

const NON_DEV_STARTER_PROMPTS = [
  {
    id: 'draft-everyday',
    title: 'Draft & Edit',
    subtitle: 'Write clear emails, proposals, or articles',
    prompt: 'Help me write a clear, friendly, and persuasive email update for my clients and team.',
    icon: PenLine,
  },
  {
    id: 'summarize-insights',
    title: 'Summarize & Insights',
    subtitle: 'Turn long notes or PDFs into key takeaways',
    prompt: 'Summarize my meeting notes into clear key points, decisions made, and next action steps.',
    icon: FileText,
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm Ideas',
    subtitle: 'Explore fresh angles, plans, or campaigns',
    prompt: 'Help me brainstorm 5 practical campaign ideas and a simple 2-week launch plan for our product.',
    icon: Lightbulb,
  },
  {
    id: 'explain-simply',
    title: 'Explain Simply',
    subtitle: 'Break down complex topics into plain language',
    prompt: 'Explain a complex topic step by step in simple everyday language with relatable examples.',
    icon: Compass,
  },
];

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  activeRole,
  activeModel,
  userName = 'Ziaul',
  developerMode = false,
  onSelectPrompt,
}) => {
  const starterPrompts = developerMode ? DEV_STARTER_PROMPTS : NON_DEV_STARTER_PROMPTS;
  const [isKeyPulse, setIsKeyPulse] = useState(false);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const isScenic = liveTheme !== 'cyber-studio';

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
      className={`relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-4 select-none w-full max-w-3xl mx-auto ${
        isScenic ? 'rounded-3xl' : ''
      }`}
    >
      {/* Core Gemini / SupremeAI Emblem */}
      <motion.div
        animate={{
          scale: isKeyPulse ? 1.14 : [1, 1.04, 1],
        }}
        transition={
          isKeyPulse
            ? { duration: 0.18 }
            : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }
        className="mb-4 w-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-cyan-500/30 flex items-center justify-center shadow-[0_8px_28px_rgba(15,23,42,0.12)] dark:shadow-[0_0_28px_rgba(0,240,255,0.2)]"
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

      {/* Gemini-Style Clean Personal Greeting */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white ${
          isScenic ? 'drop-shadow-[0_1px_12px_rgba(255,255,255,0.65)] dark:drop-shadow-[0_2px_14px_rgba(0,0,0,0.65)]' : ''
        }`}
      >
        Where should we start,{' '}
        <span className="theme-accent-gradient-text">
          {firstName}?
        </span>
      </motion.h1>

      {/* Clean unboxed typographic metadata */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        className={`flex items-center gap-2 text-xs mt-2.5 font-sans ${
          isScenic
            ? 'px-3.5 py-1 rounded-xl bg-white/65 dark:bg-slate-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-xs'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <span>{activeModel.name}</span>
        <span aria-hidden="true">·</span>
        <span>{activeRole.name}</span>
        <span aria-hidden="true">·</span>
        <span className="theme-accent-text font-medium">SupremeAI Studio</span>
      </motion.div>

      {/* 4 Clickable Starter Prompt Cards */}
      {onSelectPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full mt-6 text-left"
        >
          {starterPrompts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectPrompt(item.prompt)}
                className="group p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 hover:border-[var(--theme-accent)] transition-all cursor-pointer text-left flex flex-col justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 theme-accent-text shrink-0" />
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                  {item.subtitle}
                </p>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};
