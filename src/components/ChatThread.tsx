import React, { useEffect, useRef, useState } from 'react';
import { Copy, Check, Sparkles, User, AlertCircle, ArrowDown } from 'lucide-react';
import { marked } from 'marked';
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
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  useEffect(() => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 160;
    setShowScrollBottom(isFarFromBottom);
  };

  const scrollToBottom = () => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMarkdown = (content: string) => {
    try {
      const html = marked.parse(content, { breaks: true, gfm: true });
      return { __html: html as string };
    } catch {
      return { __html: content };
    }
  };

  const displayMessages = messages.filter((m) => m.role !== 'system');

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 md:px-8 py-6 relative space-y-6"
    >
      {/* Empty State: Pure Google Gemini Web Interface Layout */}
      {displayMessages.length === 0 && !isStreaming && (
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

          {/* Quick starter suggestions list (matching Gemini layout in screenshot) */}
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

      {/* Render Message Thread */}
      {displayMessages.map((msg, idx) => {
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
              className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%] ${
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
                        <span className="text-[10px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Message Body */}
              {isUser ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-slate-900 dark:prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-xl prose-pre:p-3.5 prose-code:font-mono prose-code:text-xs text-slate-800 dark:text-slate-200 space-y-2 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_pre]:overflow-x-auto [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                  dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                />
              )}

              {/* Timestamp */}
              <div
                className={`mt-1.5 text-[10px] tabular-nums ${
                  isUser
                    ? 'text-slate-400 dark:text-slate-500 text-right'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
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
              <span className="text-blue-500 animate-pulse">Thinking...</span>
            </div>
            {streamingContent ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-3.5 [&_pre]:rounded-xl"
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
