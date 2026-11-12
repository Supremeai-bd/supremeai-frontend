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
} from 'lucide-react';
import { ChatSession, RolePersona, UserRole } from '../types';

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
    <aside className="w-64 border-r border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#131314] flex flex-col shrink-0 transition-all text-slate-800 dark:text-slate-200 h-[calc(100vh-3.5rem)] select-none">
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
      <div className="px-2 space-y-0.5 text-xs text-slate-600 dark:text-slate-400">
        {currentRole === 'admin' ? (
          <>
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
              <span>Customise (Roles & Gems)</span>
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
          </>
        ) : (
          <>
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
              <span>Chat</span>
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
                {activePluginsCount} active
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
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
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

      {/* User Profile Footer with Quick Role Switcher */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/40">
        <div className="flex items-center justify-between">
          <div
            onClick={() => onSelectTab('user-settings')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center text-xs font-semibold shrink-0">
              Z
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                ziaul haq
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                {currentRole === 'admin' ? 'Admin' : 'Pro'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleRole}
            title={currentRole === 'admin' ? 'Switch to User View' : 'Switch to Admin Studio'}
            aria-label="Switch workspace role"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[10px]"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
