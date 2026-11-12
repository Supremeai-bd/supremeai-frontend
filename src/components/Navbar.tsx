import React from 'react';
import { Sun, Moon, PanelLeft, Sparkles, ExternalLink } from 'lucide-react';
import { ModelDetail } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'roles' | 'models' | 'repos';
  onSelectTab: (tab: 'chat' | 'roles' | 'models' | 'repos') => void;
  onNewSession: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeModel: ModelDetail;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onNewSession,
  darkMode,
  onToggleDarkMode,
  sidebarOpen,
  onToggleSidebar,
  activeModel,
}) => {
  return (
    <header className="h-14 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between gap-6 shrink-0 transition-colors z-20">
      {/* Zone 1: Sidebar Toggle + Brand Wordmark with Gemini Star */}
      <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div
          onClick={() => onSelectTab('chat')}
          className="flex items-center gap-2 cursor-pointer group"
        >
          {/* Gemini-style 4-pointed sparkle gradient mark */}
          <div className="relative w-6 h-6 flex items-center justify-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 transition-transform group-hover:scale-105"
            >
              <path
                d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
                fill="url(#gemini-gradient)"
              />
              <defs>
                <linearGradient
                  id="gemini-gradient"
                  x1="2"
                  y1="2"
                  x2="22"
                  y2="22"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#3B82F6" />
                  <stop offset="0.5" stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            SupremeAI Studio
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (Single-Line Text with subtle active indicator) */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
        <button
          type="button"
          onClick={() => onSelectTab('chat')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
            activeTab === 'chat'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('roles')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
            activeTab === 'roles'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Customise Roles
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('models')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
            activeTab === 'models'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Model Matrix
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('repos')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
            activeTab === 'repos'
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          GitHub Repos
        </button>
      </nav>

      {/* Zone 3: Model Pill + Theme + Repository CTA */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="font-mono text-[10px]">{activeModel.name.replace('Gemini ', '')}</span>
        </div>

        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <a
          href="https://github.com/Supremeai-bd/supremeai"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub Repository"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 rounded-full transition-colors whitespace-nowrap shrink-0 border border-slate-200/80 dark:border-slate-700/80"
        >
          <span>GitHub</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </header>
  );
};
