import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Sliders,
  Cpu,
  FolderGit2,
  Puzzle,
  Settings,
  Trash2,
  Edit2,
  Check,
  ShieldCheck,
  ArrowRightLeft,
  Users,
  Activity,
  Radio,
  Key,
  BookOpen,
  CreditCard,
  Bot,
  Database,
  FileCheck2,
  LogOut,
  PanelLeft,
  Palette,
  Search,
  Pin,
  LayoutDashboard,
} from 'lucide-react';
import { ChatSession, RolePersona, UserRole, AuthUser } from '../types';
import { useThemeStore, LIVE_THEMES } from '../stores/useThemeStore';
import { ThemeControlPopover } from './theme/ThemeControlPopover';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession?: (id: string) => void;
  onNewSession: () => void;
  activeRole: RolePersona;
  onOpenRoleModal: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSelectTab: (tab: any) => void;
  activeTab: string;
  currentRole: UserRole;
  onToggleRole: () => void;
  projectsCount?: number;
  activePluginsCount?: number;
  customersCount?: number;
  mcpAlertCount?: number;
  authUser?: AuthUser | null;
  onSignOut?: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  layoutMode?: 'sidebar-focus' | 'classic';
  developerMode?: boolean;
  isDeveloperEligible?: boolean;
  enableKnowledgeGrounding?: boolean;
  onToggleDeveloperMode?: () => void;
  tokensUsed?: number;
  tokensLimit?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onNewSession,
  isOpen,
  onToggleOpen,
  onSelectTab,
  activeTab,
  currentRole,
  onToggleRole,
  projectsCount = 2,
  activePluginsCount = 4,
  customersCount = 12,
  mcpAlertCount = 0,
  authUser,
  onSignOut,
  layoutMode = 'sidebar-focus',
  developerMode = false,
  isDeveloperEligible = false,
  enableKnowledgeGrounding = false,
  onToggleDeveloperMode,
  tokensUsed = 0,
  tokensLimit = 1000000,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const activeThemeMeta = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pinnedSessions = filteredSessions.filter((s) => s.isPinned);
  const recentSessions = filteredSessions.filter((s) => !s.isPinned);

  const usagePercent = Math.min(100, Math.round((tokensUsed / Math.max(1, tokensLimit)) * 100));

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const saveEditing = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  if (!isOpen) return null;

  const renderSessionRow = (session: ChatSession) => {
    const isActive = session.id === activeSessionId && activeTab === 'chat';

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          onSelectTab('chat');
        }}
        className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
          isActive
            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
          <div
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isActive ? 'bg-blue-500' : session.isPinned ? 'bg-amber-400' : 'bg-transparent'
            }`}
          />

          {editingId === session.id ? (
            <form
              onSubmit={(e) => saveEditing(session.id, e)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex items-center gap-1"
            >
              <input
                type="text"
                autoFocus
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                onBlur={() => saveEditing(session.id)}
                className="w-full px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-600 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Save"
                className="p-0.5 text-slate-600 dark:text-slate-300 hover:text-slate-900"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <span className="truncate text-xs">{session.title}</span>
          )}
        </div>

        {/* Action buttons on hover */}
        {editingId !== session.id && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {onTogglePinSession && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePinSession(session.id);
                }}
                aria-label={session.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                title={session.isPinned ? 'Unpin' : 'Pin'}
                className={`p-1 rounded transition-colors ${
                  session.isPinned
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <Pin className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => startEditing(session, e)}
              aria-label="Rename"
              className="p-1 hover:text-slate-900 dark:hover:text-slate-100 text-slate-400 rounded"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSession(session.id);
              }}
              aria-label="Delete"
              className="p-1 hover:text-rose-600 dark:hover:text-rose-400 text-slate-400 rounded"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile/narrow-preview drawer backdrop */}
      <div
        onClick={onToggleOpen}
        aria-hidden="true"
        className="md:hidden fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-[1px]"
      />
      <aside className="fixed md:static inset-y-0 left-0 z-40 md:z-auto w-64 max-w-[82vw] h-full min-h-0 border-r border-slate-200/70 dark:border-slate-800/70 bg-white/95 md:bg-white/72 dark:bg-[#111520]/95 md:dark:bg-[#111520]/80 backdrop-blur-2xl flex flex-col shrink-0 transition-all text-slate-800 dark:text-slate-200 select-none overflow-hidden shadow-2xl md:shadow-none">
      {/* Top Studio Brand Header when Top Navbar is hidden (Sidebar Focus mode) */}
      {layoutMode === 'sidebar-focus' && (
        <div className="px-3.5 pt-3.5 pb-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectTab(currentRole === 'admin' ? 'admin-overview' : 'chat')}
            className="flex items-center gap-2 cursor-pointer group min-w-0"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105"
            >
              <path
                d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
                fill="url(#sidebar-gemini-gradient)"
              />
              <defs>
                <linearGradient
                  id="sidebar-gemini-gradient"
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
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate">
              SupremeAI Studio
            </span>
          </button>

          <button
            type="button"
            onClick={onToggleOpen}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Action: "+ New chat" */}
      <div className="p-3 pb-2">
        <button
          type="button"
          onClick={() => {
            onNewSession();
            onSelectTab('chat');
          }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-900 dark:text-slate-100 text-xs font-medium transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          <span>New chat</span>
        </button>
      </div>

      {/* Navigation Menu List according to Active Role & Developer Mode */}
      <div className="px-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 overflow-y-auto max-h-[44vh]">
        {currentRole === 'admin' ? (
          <>
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operations & Swarm
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('admin-overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'admin-overview'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-500" />
              <span>Command Center</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Studio Chat</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('agent-swarm')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'agent-swarm'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-purple-500" />
                <span>Agent Swarm</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-purple-600 dark:text-purple-400">
                4 active
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('task-queue')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'task-queue'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-amber-500" />
                <span>Task Queue & Redis</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                BullMQ
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('mcp-tower')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'mcp-tower'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${mcpAlertCount > 0 ? 'text-rose-500' : 'text-slate-500'}`} />
                <span>MCP Tower</span>
              </div>
              {mcpAlertCount > 0 ? (
                <span className="text-[10px] font-mono tabular-nums text-rose-600 dark:text-rose-400 font-semibold">
                  {mcpAlertCount} alert{mcpAlertCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[10px] font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  8/8 OK
                </span>
              )}
            </button>

            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Infrastructure & Routing
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('llm-gateway')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'llm-gateway'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-blue-500" />
              <span>LLM Gateway</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('schema-parity')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'schema-parity'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Schema Parity</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('feature-flags')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'feature-flags'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-cyan-500" />
              <span>Feature Flags</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('provider-keys')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'provider-keys'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Key className="w-4 h-4 text-purple-500" />
              <span>Provider Health</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('security')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Security & Abuse</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('system-audit')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'system-audit'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-indigo-500" />
              <span>System Audit & CI</span>
            </button>

            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Customers & Models
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('customers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Customers</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {customersCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('models')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'models'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>Model Matrix</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('roles')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Roles & Gems Lab</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('repos')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'repos'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-4 h-4 text-slate-500" />
              <span>Ecosystem Repos</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('usage')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'usage'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4 text-slate-500" />
              <span>Usage Analytics</span>
            </button>
          </>
        ) : (
          <>
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Workspace
            </div>

            <button
              type="button"
              onClick={() => onSelectTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Studio Chat</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('user-billing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'user-billing' || activeTab === 'usage'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Plan & Usage</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('user-team')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'user-team'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Team & Members</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('user-settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'user-settings'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Settings</span>
            </button>

            {!developerMode && enableKnowledgeGrounding && (
              <button
                type="button"
                onClick={() => onSelectTab('user-knowledge')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                  activeTab === 'user-knowledge'
                    ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Knowledge Base</span>
                </div>
                <span className="text-[10px] font-mono text-purple-500">RAG</span>
              </button>
            )}

            {developerMode && (
              <>
                <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Developer Tools
                </div>

                {enableKnowledgeGrounding && (
                  <button
                    type="button"
                    onClick={() => onSelectTab('user-knowledge')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      activeTab === 'user-knowledge'
                        ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-purple-500" />
                      <span>Knowledge & RAG</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-500">RAG</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectTab('user-projects')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'user-projects'
                      ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderGit2 className="w-4 h-4 text-slate-500" />
                    <span>My Projects</span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {projectsCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('user-api-keys')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'user-api-keys'
                      ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Key className="w-4 h-4 text-blue-500" />
                  <span>API Keys & Hooks</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('user-plugins')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'user-plugins'
                      ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Puzzle className="w-4 h-4 text-slate-500" />
                    <span>Plugins & Tools</span>
                  </div>
                  <span className="text-[10px] font-mono tabular-nums text-slate-400">
                    {activePluginsCount}
                  </span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <div className="my-2 mx-3 border-t border-slate-200/70 dark:border-slate-800/70" />

      {/* Live Conversation Search Input */}
      <div className="px-3 pb-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-8 pr-2.5 py-1.5 text-[11px] bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-accent)]"
          />
        </div>
      </div>

      {/* Threads List (Pinned + Recent) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-2 pb-2">
        {pinnedSessions.length > 0 && (
          <div className="space-y-0.5">
            <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Pinned</span>
              <span className="font-mono tabular-nums">{pinnedSessions.length}</span>
            </div>
            {pinnedSessions.map(renderSessionRow)}
          </div>
        )}

        <div className="space-y-0.5">
          <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Recent</span>
            <span className="font-mono tabular-nums">{recentSessions.length}</span>
          </div>
          {recentSessions.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-slate-400">
              {searchTerm ? 'No matching chats.' : 'No recent chats.'}
            </div>
          ) : (
            recentSessions.map(renderSessionRow)
          )}
        </div>
      </div>

      {/* User Profile Footer with Credits Mini-Bar, Theme Switcher, Role Switcher, Sign Out */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40 space-y-2">
        {/* Compact Monthly Quota Mini-Bar for Customers */}
        {currentRole === 'user' && (
          <button
            type="button"
            onClick={() => onSelectTab('user-billing')}
            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors cursor-pointer space-y-1"
            title="View Plan & Usage"
          >
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span>Monthly Credits</span>
              <span className="font-mono tabular-nums">{usagePercent}% used</span>
            </div>
            <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent > 85 ? 'bg-amber-500' : 'bg-[var(--theme-accent)]'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </button>
        )}

        {/* Eligibility-Gated Quick Standard <-> Developer Switch (only shown to dev-eligible users) */}
        {currentRole === 'user' && isDeveloperEligible && onToggleDeveloperMode && (
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 text-[11px] font-medium">
            <button
              type="button"
              onClick={() => {
                if (developerMode) onToggleDeveloperMode();
              }}
              className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                !developerMode
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => {
                if (!developerMode) onToggleDeveloperMode();
              }}
              className={`flex-1 py-1 px-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                developerMode
                  ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Developer
            </button>
          </div>
        )}

        {/* Compact Theme & Live Screen Bar directly inside Sidebar */}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => onSelectTab('user-settings')}
            className="flex items-center gap-1.5 min-w-0 text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Open Appearance Settings"
          >
            <Palette className="w-3.5 h-3.5 theme-accent-text shrink-0" />
            <span className="truncate font-medium">{activeThemeMeta.name}</span>
          </button>

          <ThemeControlPopover
            compact
            align="left"
            placement="top"
            triggerLabel="Switch"
            onOpenSettings={() => onSelectTab('user-settings')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div
            onClick={() => onSelectTab('user-settings')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0">
              {authUser?.avatar || authUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-[var(--theme-accent)] transition-colors">
                {authUser?.name || 'User'}
              </div>
              <div className="text-[10px] theme-accent-text font-medium">
                {currentRole === 'admin' ? 'Admin' : (authUser?.plan || 'Pro')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {(currentRole === 'admin' || authUser?.isAdminEligible) && (
              <button
                type="button"
                onClick={onToggleRole}
                title={currentRole === 'admin' ? 'Switch to User View' : 'Switch to Admin Studio'}
                aria-label="Switch workspace role"
                className="p-1.5 text-slate-400 hover:text-cyan-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>
            )}

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title="Sign Out"
                aria-label="Sign out of account"
                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
    </>
  );
};
