import React from 'react';
import { Sun, Moon, PanelLeft, ExternalLink, ShieldCheck, User } from 'lucide-react';
import { ModelDetail, UserRole } from '../types';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onNewSession: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeModel: ModelDetail;
  currentRole: UserRole;
  onToggleRole: () => void;
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
  currentRole,
  onToggleRole,
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

      {/* Zone 2: Navigation Links depending on Current Role */}
      <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
        {currentRole === 'admin' ? (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'chat'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Studio Chat
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
              onClick={() => onSelectTab('customers')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'customers'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Customers
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('usage')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'usage'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Usage
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
              Ecosystem Repos
            </button>
          </>
        ) : (
          <>
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
              onClick={() => onSelectTab('user-projects')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'user-projects'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Projects
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('user-plugins')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'user-plugins'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Plugins & Tools
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('usage')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'usage'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Usage
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('user-settings')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'user-settings'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Settings
            </button>
          </>
        )}
      </nav>

      {/* Zone 3: Role Switcher + Model + Theme */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Role Switcher Pill */}
        <button
          type="button"
          onClick={onToggleRole}
          className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            currentRole === 'admin'
              ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100'
          }`}
        >
          {currentRole === 'admin' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              <span>User Mode</span>
            </>
          )}
        </button>

        {/* Model Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="font-mono text-[10px]">{activeModel.name.replace('Gemini ', '')}</span>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          aria-label={darkMode ? 'Switch to light theme' : 'Switch to dark theme'}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
