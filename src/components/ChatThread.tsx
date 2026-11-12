import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Copy, Check, Sparkles, AlertCircle, ArrowDown, Search, X, Filter, Paperclip } from 'lucide-react';
import { Marked } from 'marked';
import { ChatMessage, RolePersona, ModelDetail } from '../types';

interface ChatThreadProps {
  messages: ChatMessage[];
  activeRole: RolePersona;
  activeModel: ModelDetail;
  isStreaming: boolean;
  streamingContent: string;
  onSendPrompt: (promptText: string) => void;
  error: string | null;
}

// Escape HTML utility for code blocks
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Configured Marked instance for high-fidelity code blocks, tables, and lists
const markdownProcessor = new Marked({
  gfm: true,
  breaks: true,
});

markdownProcessor.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const cleanLang = (lang || 'code').trim();
      const escapedText = escapeHtml(text);
      const encodedCode = encodeURIComponent(text);

      return `<div class="code-block-wrapper my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md">
        <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono select-none">
          <span class="flex items-center gap-1.5 font-medium text-slate-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span class="uppercase tracking-wider text-[11px]">${cleanLang}</span>
          </span>
          <button type="button" class="copy-code-btn flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[11px] cursor-pointer" data-code="${encodedCode}">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            <span>Copy</span>
          </button>
        </div>
        <pre class="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono text-slate-100 bg-slate-950"><code class="language-${cleanLang}">${escapedText}</code></pre>
      </div>`;
    },
  },
  hooks: {
    postprocess(html: string) {
      // Wrap tables in responsive overflow wrapper
      return html
        .replace(/<table>/g, '<div class="markdown-table-wrapper"><table>')
        .replace(/<\/table>/g, '</table></div>');
    },
  },
});

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  activeRole,
  activeModel,
  isStreaming,
  streamingContent,
  onSendPrompt,
  error,
}) => {
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');
  const [isSearchVisible, setIsSearchVisible] = useState<boolean>(true);

  // Auto-scroll on new message or streaming content
  useEffect(() => {
    // Only auto-scroll if user is not actively searching through historical messages
    if (!searchQuery.trim() && scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, searchQuery]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Copy whole assistant response to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Event delegation for code-block level Copy buttons
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest('.copy-code-btn') as HTMLButtonElement | null;
    if (!target) return;

    e.preventDefault();
    const encoded = target.getAttribute('data-code');
    if (!encoded) return;

    const rawCode = decodeURIComponent(encoded);
    navigator.clipboard.writeText(rawCode).then(() => {
      const span = target.querySelector('span:last-child');
      if (span) {
        const originalText = span.textContent;
        span.textContent = 'Copied!';
        target.classList.add('text-emerald-400');
        setTimeout(() => {
          span.textContent = originalText;
          target.classList.remove('text-emerald-400');
        }, 2000);
      }
    });
  };

  // Keyboard shortcut listener: Cmd/Ctrl+F focuses search, Esc clears search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchVisible(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Markdown rendering helper with error fallback
  const renderMarkdown = useCallback((content: string) => {
    try {
      const html = markdownProcessor.parse(content);
      return { __html: html as string };
    } catch {
      return { __html: escapeHtml(content) };
    }
  }, []);

  // Filter messages based on search query and role filter
  const allDisplayMessages = useMemo(() => {
    return messages.filter((m) => m.role !== 'system');
  }, [messages]);

  const filteredMessages = useMemo(() => {
    let result = allDisplayMessages;

    // Apply role filter
    if (roleFilter !== 'all') {
      result = result.filter((m) => m.role === roleFilter);
    }

    // Apply keyword search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((m) => {
        const contentMatch = m.content.toLowerCase().includes(query);
        const roleMatch = m.roleName?.toLowerCase().includes(query);
        const modelMatch = m.model?.toLowerCase().includes(query);
        return contentMatch || roleMatch || modelMatch;
      });
    }

    return result;
  }, [allDisplayMessages, searchQuery, roleFilter]);

  // Helper to highlight matching text in user messages
  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="search-highlight font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasMessages = allDisplayMessages.length > 0;
  const isSearchActive = searchQuery.trim().length > 0 || roleFilter !== 'all';

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      onClick={handleContainerClick}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-4 relative space-y-4"
    >
      {/* Sticky Search & Filter Bar at top of thread */}
      {hasMessages && (
        <div className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800/80 -mx-4 md:-mx-8 px-4 md:px-8 py-2.5 transition-all shadow-xs">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input Container */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages in session (Ctrl+F)..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query (Esc)"
                  className="absolute right-2.5 p-0.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filters & Match Indicator */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Role filter buttons */}
              <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200/80 dark:border-slate-700/70 text-[11px]">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    roleFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('user')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    roleFilter === 'user'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('assistant')}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                    roleFilter === 'assistant'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  AI
                </button>
              </div>

              {/* Match Counter Badge */}
              <div className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                {isSearchActive ? (
                  <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900/60">
                    {filteredMessages.length} of {allDisplayMessages.length}
                  </span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                    {allDisplayMessages.length} msgs
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State: Pure Google Gemini Web Interface Layout */}
      {!hasMessages && !isStreaming && (
        <div className="max-w-2xl mx-auto my-auto min-h-[480px] flex flex-col justify-center items-center text-center px-4 space-y-8">
          {/* Centered Gemini Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-800 dark:text-slate-100 font-sans">
              Where should we start?
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Powered by Google Gemini · Active Persona: <span className="text-slate-600 dark:text-slate-300 font-semibold">{activeRole.name}</span>
            </p>
          </div>

          {/* Quick starter suggestions list */}
          <div className="w-full max-w-lg space-y-2.5 pt-2 text-left">
            {activeRole.quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSendPrompt(prompt)}
                className="w-full p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-800/90 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 transition-all shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium group-hover:text-slate-900 dark:group-hover:text-white">
                    {prompt}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Zero matches empty state when searching */}
      {hasMessages && filteredMessages.length === 0 && isSearchActive && (
        <div className="max-w-md mx-auto py-16 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            No matching messages found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {searchQuery ? `No messages matched "${searchQuery}"` : 'No messages found with the current role filter.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
            }}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
          >
            Clear Search Filter
          </button>
        </div>
      )}

      {/* Render Message Thread */}
      {filteredMessages.map((msg, idx) => {
        const isUser = msg.role === 'user';
        const isAssistant = msg.role === 'assistant';

        return (
          <div
            key={msg.id || idx}
            className={`max-w-3xl mx-auto flex gap-4 ${
              isUser ? 'justify-end' : 'justify-start'
            }`}
          >
            {/* Assistant avatar: Gemini 4-pointed Star */}
            {isAssistant && (
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                  <path
                    d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
                    fill="url(#msg-gemini-gradient)"
                  />
                  <defs>
                    <linearGradient
                      id="msg-gemini-gradient"
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
            )}

            {/* Message bubble */}
            <div
              className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[88%] sm:max-w-[85%] ${
                isUser
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  : 'bg-transparent text-slate-800 dark:text-slate-200'
              }`}
            >
              {/* Message Header (for Assistant) */}
              {isAssistant && (
                <div className="flex items-center justify-between gap-4 pb-1.5 mb-1.5 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                    <span>{msg.roleName || activeRole.name}</span>
                    <span>·</span>
                    <span className="font-mono text-[10px]">{msg.model || activeModel.id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(msg.content, idx)}
                    aria-label="Copy full response"
                    className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-[10px] text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span className="text-[10px]">Copy response</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message Body */}
              {isUser ? (
                <>
                  {msg.attachment && (
                    <div className="mb-2.5">
                      {msg.attachment.mimeType.startsWith('image/') ? (
                        <div className="overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm max-w-sm">
                          <img
                            src={msg.attachment.data}
                            alt={msg.attachment.name}
                            className="max-h-60 w-auto object-contain bg-black/10 dark:bg-black/40"
                          />
                          <div className="px-2.5 py-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/70 border-t border-slate-200 dark:border-slate-800 truncate">
                            {msg.attachment.name}
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600 text-xs text-slate-800 dark:text-slate-200 font-mono">
                          <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate max-w-[200px]">{msg.attachment.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {renderHighlightedText(msg.content, searchQuery)}
                  </p>
                  {/* User Timestamp */}
                  <div className="mt-1.5 text-[10px] tabular-nums text-slate-400 dark:text-slate-500 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="markdown-body text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                  />
                  {/* AI Response Footer with Copy to Clipboard Button & Timestamp */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.content, idx)}
                      aria-label="Copy entire response to clipboard"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800/90 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>

                    <div className="text-[10px] tabular-nums text-slate-400 dark:text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 flex items-center justify-center shrink-0 text-xs font-semibold shadow-xs">
                Z
              </div>
            )}
          </div>
        );
      })}

      {/* Streaming state with Gemini Shimmer */}
      {isStreaming && (
        <div className="max-w-3xl mx-auto flex gap-4 justify-start">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 animate-spin [animation-duration:3s]">
              <path
                d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
                fill="url(#stream-gemini-gradient)"
              />
              <defs>
                <linearGradient
                  id="stream-gemini-gradient"
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
          <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 pb-1.5 mb-1.5 text-[11px] text-slate-400">
              <span className="font-medium text-slate-600 dark:text-slate-400">{activeRole.name}</span>
              <span>·</span>
              <span className="font-mono text-[10px]">{activeModel.id}</span>
              <span className="text-blue-500 animate-pulse font-medium">Generating...</span>
            </div>
            {streamingContent ? (
              <div
                className="markdown-body text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={renderMarkdown(streamingContent)}
              />
            ) : (
              <div className="flex items-center gap-2 text-slate-400 py-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0.4s]" />
                <span className="text-xs text-slate-400 pl-1">Generating response with {activeModel.name}...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error alert banner */}
      {error && (
        <div className="max-w-3xl mx-auto p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">Inference Error</p>
            <p className="mt-0.5 text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />

      {/* Scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to latest message"
          className="fixed bottom-28 right-8 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-lg border border-slate-200 dark:border-slate-700 hover:scale-105 transition-all z-10 cursor-pointer"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
