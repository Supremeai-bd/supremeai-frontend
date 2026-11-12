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
  User,
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
  Sun,
  Moon,
} from 'lucide-react';
import { ChatSession, RolePersona, UserRole, AuthUser } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onNewSession,
  activeRole,
  onOpenRoleModal,
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
  darkMode,
  onToggleDarkMode,
  layoutMode = 'sidebar-focus',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <aside className="w-64 h-full min-h-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/85 dark:bg-[#131314]/95 backdrop-blur-xl flex flex-col shrink-0 transition-all text-slate-800 dark:text-slate-200 select-none overflow-hidden">
      {/* Top Studio Brand Header when Top Navbar is hidden (Sidebar Focus mode) */}
      {layoutMode === 'sidebar-focus' && (
        <div className="px-3.5 pt-3.5 pb-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onSelectTab('chat')}
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

      {/* Top Action: Gemini-style "+ New chat" pill button */}
      <div className="p-3">
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

      {/* Navigation Menu List according to Active Role */}
      <div className="px-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400 overflow-y-auto max-h-[46vh]">
        {currentRole === 'admin' ? (
          <>
            <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Operations & Swarm
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
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-semibold">
                4 Active
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
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
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
                <Radio className={`w-4 h-4 ${mcpAlertCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                <span>MCP Tower</span>
              </div>
              {mcpAlertCount > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-semibold">
                  {mcpAlertCount} alert{mcpAlertCount > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-semibold">
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
              <span>Provider Keys</span>
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
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
              Workspace & AI
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
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                Grounding
              </span>
            </button>

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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {projectsCount}
              </span>
            </button>

            <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Developer Platform
            </div>

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
              onClick={() => onSelectTab('user-billing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'user-billing'
                  ? 'bg-slate-200/60 dark:bg-slate-800 text-slate-900 dark:text-white font-medium'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-500" />
              <span>Billing & Top-Up</span>
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
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {activePluginsCount}
              </span>
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
          </>
        )}
      </div>

      {/* Divider */}
      <div className="my-2.5 mx-3 border-t border-slate-200/70 dark:border-slate-800/70" />

      {/* Recent Chats Section Header with count */}
      <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        <span>Recent</span>
        <span className="text-[10px] text-slate-400 tabular-nums">{sessions.length}</span>
      </div>

      {/* Threads List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 space-y-0.5">
        {filteredSessions.map((session) => {
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
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? 'bg-blue-500' : 'bg-transparent'
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
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
        })}
      </div>

      {/* User Profile Footer with Quick Role Switcher (Admin-Only) and Sign Out */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div
            onClick={() => onSelectTab('user-settings')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0">
              {authUser?.avatar || authUser?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {authUser?.name || 'User'}
              </div>
              <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                {currentRole === 'admin' ? 'Admin' : (authUser?.plan || 'Pro')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            {onToggleDarkMode && (
              <button
                type="button"
                onClick={onToggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle color theme"
                className="p-1.5 text-slate-400 hover:text-amber-500 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Role switch button: ONLY shown if user is admin-eligible or already in admin mode */}
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
  );
};
