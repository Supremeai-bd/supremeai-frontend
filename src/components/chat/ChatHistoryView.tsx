import React, { useMemo, useRef, useState } from 'react';
import {
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  GitFork,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { ChatSession } from '../../types';

interface ChatHistoryViewProps {
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onTogglePinSession?: (id: string) => void;
  onBranchSession?: (id: string) => void;
  onNewSession: () => void;
  onOpenChat: () => void;
  developerMode?: boolean;
}

type HistoryFilter = 'all' | 'pinned' | 'with-messages';

const formatRelativeTime = (ts: number): string => {
  const diffMs = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const ChatHistoryView: React.FC<ChatHistoryViewProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onTogglePinSession,
  onBranchSession,
  onNewSession,
  onOpenChat,
  developerMode = false,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeQuery = (appliedQuery || searchInput).trim().toLowerCase();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedQuery(searchInput.trim());
    inputRef.current?.focus();
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedQuery('');
    inputRef.current?.focus();
  };

  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => {
      if (Boolean(a.isPinned) !== Boolean(b.isPinned)) {
        return a.isPinned ? -1 : 1;
      }
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });

    return sorted.filter((session) => {
      if (filter === 'pinned' && !session.isPinned) return false;
      if (filter === 'with-messages' && (session.messages?.length || 0) === 0) return false;

      if (!activeQuery) return true;
      if (session.title.toLowerCase().includes(activeQuery)) return true;
      return (session.messages || []).some((msg) =>
        msg.content.toLowerCase().includes(activeQuery)
      );
    });
  }, [sessions, filter, activeQuery]);

  const getPreviewSnippet = (session: ChatSession): { text: string; isMatch: boolean } => {
    const msgs = session.messages || [];
    if (activeQuery) {
      const matched = msgs.find((m) => m.content.toLowerCase().includes(activeQuery));
      if (matched) {
        const idx = matched.content.toLowerCase().indexOf(activeQuery);
        const start = Math.max(0, idx - 45);
        const end = Math.min(matched.content.length, idx + activeQuery.length + 95);
        const slice = matched.content.slice(start, end).replace(/\s+/g, ' ').trim();
        return {
          text: `${start > 0 ? '...' : ''}${slice}${end < matched.content.length ? '...' : ''}`,
          isMatch: true,
        };
      }
    }
    const lastMsg = msgs[msgs.length - 1];
    if (!lastMsg) {
      return { text: 'Empty conversation · Ready for your first prompt', isMatch: false };
    }
    const clean = lastMsg.content.replace(/\s+/g, ' ').trim();
    return {
      text: clean.length > 140 ? `${clean.slice(0, 140)}...` : clean,
      isMatch: false,
    };
  };

  const saveEdit = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editingTitle.trim()) {
      onRenameSession(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6">
      <div className="workspace-container space-y-5">
        {/* Header & Primary Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              All Conversations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Search across titles, prompts, and assistant responses ({sessions.length} total)
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewSession();
              onOpenChat();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                autoFocus
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (!e.target.value.trim()) setAppliedQuery('');
                }}
                placeholder="Search conversation titles, code snippets, or messages..."
                className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-accent)] focus:ring-2 focus:ring-[var(--theme-accent-soft)] transition-all"
              />
              {(searchInput || appliedQuery) && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800">
              {(
                [
                  { id: 'all', label: `All (${sessions.length})` },
                  { id: 'pinned', label: `Pinned (${sessions.filter((s) => s.isPinned).length})` },
                  {
                    id: 'with-messages',
                    label: `With Messages (${sessions.filter((s) => (s.messages?.length || 0) > 0).length})`,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              Showing {filteredSessions.length} of {sessions.length}
            </div>
          </div>
        </div>

        {/* Conversation List */}
        {filteredSessions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white/75 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {activeQuery ? 'No matching conversations found' : 'No conversations in this view'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {activeQuery
                  ? `Nothing matched "${activeQuery}". Try a different keyword or clear the search filter.`
                  : 'Start a fresh chat thread to begin building your conversation history.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {activeQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Clear Search
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                  onOpenChat();
                }}
                className="px-3.5 py-2 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer"
              >
                Start New Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredSessions.map((session) => {
              const isCurrent = session.id === activeSessionId;
              const preview = getPreviewSnippet(session);
              const msgCount = session.messages?.length || 0;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    if (editingId === session.id) return;
                    onSelectSession(session.id);
                    onOpenChat();
                  }}
                  className={`group p-4 rounded-2xl border backdrop-blur-xl transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-white/90 dark:bg-slate-900/90 border-[var(--theme-accent)] shadow-sm'
                      : 'bg-white/75 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white/90 dark:hover:bg-slate-900/85'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {session.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      )}

                      {editingId === session.id ? (
                        <form
                          onSubmit={(e) => saveEdit(session.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 flex-1 max-w-md"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={() => saveEdit(session.id)}
                            className="flex-1 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[var(--theme-accent)]"
                          />
                          <button
                            type="submit"
                            aria-label="Save title"
                            className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-lg cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      ) : (
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {session.title}
                        </h3>
                      )}

                      {isCurrent && (
                        <span className="text-[11px] font-medium theme-accent-text shrink-0">
                          · Active
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        preview.isMatch
                          ? 'text-slate-700 dark:text-slate-200 font-medium'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {preview.text}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                      <span className="font-mono tabular-nums">{msgCount} message{msgCount === 1 ? '' : 's'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{session.model}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(session.updatedAt || session.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div
                    className="flex items-center gap-1 shrink-0 self-end sm:self-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {onTogglePinSession && (
                      <button
                        type="button"
                        onClick={() => onTogglePinSession(session.id)}
                        title={session.isPinned ? 'Unpin conversation' : 'Pin conversation'}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          session.isPinned
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(session.id);
                        setEditingTitle(session.title);
                      }}
                      title="Rename conversation"
                      className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {developerMode && onBranchSession && (
                      <button
                        type="button"
                        onClick={() => {
                          onBranchSession(session.id);
                          onOpenChat();
                        }}
                        title="Branch conversation"
                        className="p-2 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                      >
                        <GitFork className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteSession(session.id)}
                      title="Delete conversation"
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(session.id);
                        onOpenChat();
                      }}
                      className="ml-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
