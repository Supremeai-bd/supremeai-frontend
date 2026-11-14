import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ArrowDown, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessage, RolePersona, ModelDetail } from '../types';
import { ChatSearchBar } from './chat/ChatSearchBar';
import { ChatEmptyState } from './chat/ChatEmptyState';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';

interface ChatThreadProps {
  messages: ChatMessage[];
  activeRole: RolePersona;
  activeModel: ModelDetail;
  isStreaming: boolean;
  streamingContent: string;
  onSendPrompt: (promptText: string) => void;
  error: string | null;
  userName?: string;
  developerMode?: boolean;
}

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  activeRole,
  activeModel,
  isStreaming,
  streamingContent,
  onSendPrompt,
  error,
  userName,
  developerMode = false,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');

  // Auto-scroll internal message container only (never scroll ancestor/window/iframe)
  useEffect(() => {
    const el = containerRef.current;
    if (!searchQuery.trim() && el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, streamingContent, searchQuery]);

  // Scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 160);
  };

  const scrollToBottom = () => {
    const el = containerRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  };

  // Event delegation for code block copy, sandbox run, preview, and workspace dock buttons inside markdown
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const runBtn = (e.target as HTMLElement).closest('.run-code-btn') as HTMLButtonElement | null;
    if (runBtn) {
      const encodedCode = runBtn.getAttribute('data-code');
      const lang = runBtn.getAttribute('data-lang') || 'javascript';
      if (encodedCode) {
        useWorkspaceStore
          .getState()
          .loadCodeIntoWorkspace(decodeURIComponent(encodedCode), lang, 'sandbox', true);
      }
      return;
    }

    const previewBtn = (e.target as HTMLElement).closest('.preview-code-btn') as HTMLButtonElement | null;
    if (previewBtn) {
      const encodedCode = previewBtn.getAttribute('data-code');
      const lang = previewBtn.getAttribute('data-lang') || 'html';
      if (encodedCode) {
        useWorkspaceStore.getState().loadCodeIntoWorkspace(decodeURIComponent(encodedCode), lang, 'preview');
      }
      return;
    }

    const editBtn = (e.target as HTMLElement).closest('.edit-code-btn') as HTMLButtonElement | null;
    if (editBtn) {
      const encodedCode = editBtn.getAttribute('data-code');
      const lang = editBtn.getAttribute('data-lang') || 'html';
      if (encodedCode) {
        useWorkspaceStore.getState().loadCodeIntoWorkspace(decodeURIComponent(encodedCode), lang, 'code');
      }
      return;
    }

    const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLButtonElement | null;
    if (!target) return;

    const encodedCode = target.getAttribute('data-code');
    if (!encodedCode) return;

    const rawCode = decodeURIComponent(encodedCode);
    navigator.clipboard.writeText(rawCode);

    const spanText = target.querySelector('span');
    if (spanText) {
      const originalText = spanText.textContent;
      spanText.textContent = 'Copied!';
      target.classList.add('text-emerald-400');
      setTimeout(() => {
        spanText.textContent = originalText;
        target.classList.remove('text-emerald-400');
      }, 2000);
    }
  }, []);

  // Filter messages by search term and role
  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const matchesRole = roleFilter === 'all' || m.role === roleFilter;
      const matchesSearch =
        !searchQuery.trim() || m.content.toLowerCase().includes(searchQuery.toLowerCase().trim());
      return matchesRole && matchesSearch;
    });
  }, [messages, searchQuery, roleFilter]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Search Bar (Only shown when there are messages in the thread) */}
      {!isEmpty && (
        <ChatSearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          totalMatches={filteredMessages.length}
          totalMessages={messages.length}
          onClear={() => setSearchQuery('')}
          inputRef={searchInputRef}
        />
      )}

      {/* Main Messages Viewport */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onClick={handleContainerClick}
        className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4"
      >
        {isEmpty ? (
          <ChatEmptyState
            activeRole={activeRole}
            activeModel={activeModel}
            userName={userName}
            developerMode={developerMode}
          />
        ) : (
          <div className="workspace-chat-container space-y-4">
            {filteredMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                message={msg}
                activeRole={activeRole}
                activeModel={activeModel}
                searchQuery={searchQuery}
                developerMode={developerMode}
              />
            ))}

            {/* Live Streaming Assistant Output */}
            {isStreaming && (
              <div className="flex items-start gap-3.5 py-4 px-4 rounded-2xl bg-white/80 dark:bg-[#0f1422]/80 max-w-[92%] border border-cyan-500/25 cyber-hud-glass animate-pulse">
                <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {activeRole.name}
                    </span>
                    <span className={developerMode ? 'text-[10px] font-mono text-cyan-500' : 'text-[10px] text-cyan-600 dark:text-cyan-400 font-medium'}>
                      {developerMode ? `Generating (${activeModel.id})...` : `${activeModel.name} · Generating...`}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                    {streamingContent}
                    <span className="cyber-cursor" />
                  </p>
                </div>
              </div>
            )}

            {/* Inference Error Notification */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-3 animate-shake">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold">Model Inference Notice</p>
                  <p className="mt-0.5 opacity-90">{error}</p>
                </div>
              </div>
            )}

            <div ref={scrollEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-6 p-2 rounded-full bg-slate-900 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-lg hover:scale-105 transition-all cursor-pointer z-20"
          title="Scroll to latest message"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
