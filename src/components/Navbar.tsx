import React, { useState } from 'react';
import { PanelLeft, PanelRight, ShieldCheck, LogOut, ChevronDown, Laptop, Code2 } from 'lucide-react';
import { ModelDetail, UserRole, AuthUser } from '../types';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { useCustomerStore } from '../stores/useCustomerStore';

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
  isDeveloperEligible?: boolean;
  developerMode?: boolean;
  onToggleDeveloperMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  sidebarOpen,
  onToggleSidebar,
  activeModel,
  currentRole,
  onToggleRole,
  mcpAlertCount = 0,
  authUser,
  onSignOut,
  trustedUntil,
  isDeveloperEligible = false,
  developerMode: developerModeProp,
  onToggleDeveloperMode,
}) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isDockOpen, toggleDock, setDockOpen } = useWorkspaceStore();
  const storeDeveloperMode = useCustomerStore((s) => s.userSettings.developerMode);
  const developerMode =
    developerModeProp !== undefined
      ? developerModeProp
      : Boolean(storeDeveloperMode && (isDeveloperEligible || currentRole === 'admin'));

  return (
    <header className="h-14 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between gap-6 shrink-0 transition-colors z-20">
      {/* Zone 1: Sidebar Toggle + Brand Wordmark with SupremeAI Star */}
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
          onClick={() => onSelectTab(currentRole === 'admin' ? 'admin-overview' : 'chat')}
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
                fill="url(#supreme-gradient)"
              />
              <defs>
                <linearGradient
                  id="supreme-gradient"
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

      {/* Zone 2: Navigation Links depending on Current Role & Developer Mode */}
      <nav className="hidden md:flex items-center gap-3 text-xs font-medium text-slate-600 dark:text-slate-300">
        {currentRole === 'admin' ? (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('admin-overview')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'admin-overview'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Command Center
            </button>
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
              onClick={() => onSelectTab('chat-history')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'chat-history'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              History
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
              onClick={() => onSelectTab('models')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'models'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Models
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
              onClick={() => onSelectTab('feature-flags')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'feature-flags'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Flags
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
              onClick={() => onSelectTab('chat-history')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'chat-history'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              History
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('user-billing')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'user-billing' || activeTab === 'usage'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Plan & Usage
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('user-team')}
              className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                activeTab === 'user-team'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Team
            </button>
            {developerMode && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('user-projects')}
                  className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1.5 px-2.5 rounded-lg ${
                    activeTab === 'user-projects'
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Projects
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
                  Plugins
                </button>
              </>
            )}
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

      {/* Zone 3: Mode/Role Switchers + Model + Workspace Dock (if dev/admin) + Theme + Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        {currentRole === 'user' && isDeveloperEligible && onToggleDeveloperMode && (
          <button
            type="button"
            onClick={onToggleDeveloperMode}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              developerMode
                ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{developerMode ? 'Developer Mode' : 'Switch to Developer'}</span>
          </button>
        )}

        {(currentRole === 'admin' || authUser?.isAdminEligible) && (
          <button
            type="button"
            onClick={onToggleRole}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
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

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className={developerMode || currentRole === 'admin' ? 'font-mono text-[10px]' : 'text-[11px]'}>
            {activeModel.name}
          </span>
        </div>

        {(developerMode || currentRole === 'admin') && (
          <button
            type="button"
            onClick={() => {
              if (activeTab !== 'chat') {
                onSelectTab('chat');
                setDockOpen(true);
              } else {
                toggleDock();
              }
            }}
            aria-label="Toggle Split Workspace Dock"
            title="Toggle Split Workspace (Preview, Terminal, Browser)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              isDockOpen && activeTab === 'chat'
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 shadow-xs'
                : 'border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:border-cyan-500/40 hover:text-cyan-500'
            }`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Workspace</span>
          </button>
        )}

        {/* User Account & Sign Out Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-1.5 p-1 pl-1.5 pr-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[11px] font-bold">
              {authUser?.avatar || authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
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
                <div className="pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {authUser?.name || 'SupremeAI User'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">
                    {authUser?.email || 'user@supremeai.bd'}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-[11px] font-medium flex-wrap">
                    <span className="text-blue-600 dark:text-blue-400">
                      {authUser?.plan || 'Pro'} Plan
                    </span>
                    {isDeveloperEligible && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="text-cyan-600 dark:text-cyan-400">
                          {developerMode ? 'Developer Mode' : 'Standard Mode'}
                        </span>
                      </>
                    )}
                    {authUser?.isAdminEligible && (
                      <>
                        <span className="text-slate-400">·</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">
                          Admin Eligible
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {trustedUntil && trustedUntil > Date.now() && (
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-400 flex items-center gap-2">
                    <Laptop className="w-3.5 h-3.5 shrink-0" />
                    <span>7-Day Trusted Device Verified</span>
                  </div>
                )}

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTab('user-settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Account & Preferences
                  </button>
                  {currentRole === 'user' && isDeveloperEligible && onToggleDeveloperMode && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleDeveloperMode();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>{developerMode ? 'Switch to Standard Mode' : 'Switch to Developer Mode'}</span>
                    </button>
                  )}
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
