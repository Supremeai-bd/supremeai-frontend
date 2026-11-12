import React, { useState } from 'react';
import { Sun, Moon, PanelLeft, ExternalLink, ShieldCheck, User, LogOut, ChevronDown, Laptop, Sparkles } from 'lucide-react';
import { ModelDetail, UserRole, AuthUser } from '../types';

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
  mcpAlertCount?: number;
  authUser?: AuthUser | null;
  onSignOut?: () => void;
  trustedUntil?: number | null;
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
  mcpAlertCount = 0,
  authUser,
  onSignOut,
  trustedUntil,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
              onClick={() => onSelectTab('mcp-tower')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg flex items-center gap-1.5 ${
                activeTab === 'mcp-tower'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>MCP Tower</span>
              {mcpAlertCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {mcpAlertCount}
                </span>
              )}
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

      {/* Zone 3: Role Switcher + Model + Theme + Profile / Sign Out */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Role Switcher Pill: ONLY shown if Admin User ID is matched or already in admin mode */}
        {(currentRole === 'admin' || authUser?.isAdminEligible) && (
          <button
            type="button"
            onClick={onToggleRole}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
              currentRole === 'admin'
                ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100'
                : 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100'
            }`}
          >
            {currentRole === 'admin' ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Studio</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
                <span>Switch to Admin</span>
              </>
            )}
          </button>
        )}

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

        {/* User Account & Sign Out Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[11px] font-bold">
              {authUser?.avatar || authUser?.name?.charAt(0) || 'U'}
            </div>
            <span className="hidden md:inline-block text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
              {authUser?.name?.split(' ')[0] || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isProfileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsProfileOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#111622] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-40 p-3 space-y-2.5 animate-in fade-in text-xs">
                {/* User info */}
                <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {authUser?.name || 'SupremeAI User'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {authUser?.email || 'user@supremeai.bd'}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {authUser?.plan || 'Pro'} Plan
                    </span>
                    {authUser?.isAdminEligible && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                        Admin Eligible
                      </span>
                    )}
                  </div>
                </div>

                {/* 7-day browser status */}
                {trustedUntil && trustedUntil > Date.now() && (
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-400 flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 shrink-0" />
                    <span>7-Day Trusted Device Verified</span>
                  </div>
                )}

                {/* Navigation items */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('user-settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Account & Security Settings
                  </button>
                  {authUser?.isAdminEligible && currentRole === 'user' && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleRole();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Switch to Admin Studio</span>
                    </button>
                  )}
                </div>

                {/* Sign Out Action */}
                {onSignOut && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
