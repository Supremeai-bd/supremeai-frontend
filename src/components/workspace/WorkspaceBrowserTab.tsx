import React, { useState, useEffect } from 'react';
import {
  Globe,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Lock,
  Bot,
  ExternalLink,
  AlertCircle,
  Link2,
  Eye,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export const WorkspaceBrowserTab: React.FC = () => {
  const {
    browserUrl,
    browserTitle,
    browserStatus,
    browserHtml,
    browserError,
    browserLatencyMs,
    browserStatusCode,
    browserLinks,
    browserTextPreview,
    browserHistoryStack,
    browserHistoryIndex,
    browserAgentLogs,
    navigateBrowser,
    browserBack,
    browserForward,
    refreshBrowser,
  } = useWorkspaceStore();

  const [urlInput, setUrlInput] = useState(browserUrl);
  const [viewMode, setViewMode] = useState<'rendered' | 'agent-dom'>('rendered');

  useEffect(() => {
    setUrlInput(browserUrl);
  }, [browserUrl]);

  // Auto-load initial local studio health page if idle when tab is opened
  useEffect(() => {
    if (browserStatus === 'idle' && !browserHtml) {
      navigateBrowser('http://localhost:3000/api/health');
    }
  }, [browserStatus, browserHtml, navigateBrowser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    navigateBrowser(urlInput);
  };

  const canGoBack = browserHistoryIndex > 0;
  const canGoForward = browserHistoryIndex < browserHistoryStack.length - 1;

  const BOOKMARKS = [
    { label: 'Studio Health API', url: 'http://localhost:3000/api/health' },
    { label: 'MCP Cluster JSON', url: 'http://localhost:3000/api/mcp-tower/services' },
    { label: 'Example.com', url: 'https://example.com' },
    { label: 'Wikipedia AI', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-[#070a12]">
      {/* Browser Address & Controls Bar */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/90 bg-white/90 dark:bg-[#0b101b] space-y-2">
        <div className="flex items-center gap-2">
          {/* History Controls */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={browserBack}
              disabled={!canGoBack}
              title="Back"
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={browserForward}
              disabled={!canGoForward}
              title="Forward"
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={refreshBrowser}
              title="Reload Page"
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${browserStatus === 'loading' ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* URL Form */}
          <form onSubmit={handleSubmit} className="flex-1 flex items-center relative">
            <Lock className="w-3 h-3 text-emerald-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter URL for Web Agent proxy (e.g. https://example.com)..."
              className="w-full pl-8 pr-20 py-1.5 text-xs font-mono rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 focus:border-cyan-500 text-slate-800 dark:text-slate-100 outline-none"
            />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[10px] font-semibold transition-colors cursor-pointer"
            >
              GO
            </button>
          </form>

          {/* View Mode Toggle: Visual vs Web Agent DOM */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'rendered'
                  ? 'bg-white dark:bg-slate-800 text-cyan-500 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agent-dom')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'agent-dom'
                  ? 'bg-white dark:bg-slate-800 text-cyan-500 font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-3 h-3" />
              <span className="hidden sm:inline">Agent DOM</span>
            </button>
          </div>
        </div>

        {/* Bookmarks & Status Strip */}
        <div className="flex items-center justify-between gap-2 text-[11px] overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {BOOKMARKS.map((bm) => (
              <button
                key={bm.url}
                type="button"
                onClick={() => navigateBrowser(bm.url)}
                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 hover:bg-cyan-500/10 border border-slate-200/70 dark:border-slate-800 hover:border-cyan-500/40 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors whitespace-nowrap cursor-pointer"
              >
                {bm.label}
              </button>
            ))}
          </div>

          {browserStatus === 'loaded' && (
            <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 shrink-0">
              <span className="text-emerald-400">{browserStatusCode || 200} OK</span>
              <span>·</span>
              <span>{browserLatencyMs}ms</span>
              <span>·</span>
              <span className="truncate max-w-[140px]" title={browserTitle}>
                {browserTitle}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Browser Viewport */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        {browserStatus === 'error' ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              Navigation Error
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md font-mono">
              {browserError}
            </p>
            <button
              type="button"
              onClick={refreshBrowser}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-semibold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : viewMode === 'rendered' ? (
          <div className="flex-1 relative bg-white dark:bg-[#090d16]">
            {browserStatus === 'loading' && (
              <div className="absolute inset-x-0 top-0 h-0.5 bg-cyan-500/30 overflow-hidden z-10">
                <div className="h-full w-1/3 bg-cyan-400 animate-pulse" />
              </div>
            )}
            {browserHtml ? (
              <iframe
                title="SupremeAI Virtual Browser"
                srcDoc={browserHtml}
                sandbox="allow-scripts allow-forms"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-slate-400 text-xs space-y-2">
                <Globe className="w-8 h-8 text-cyan-500/60" />
                <span>Initializing SupremeAI Virtual Browser...</span>
              </div>
            )}
          </div>
        ) : (
          /* Web Agent DOM & Link Extractor View */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  Extracted Text Context
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {browserLinks.length} links detected
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
                {browserTextPreview || 'No readable text extracted yet.'}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="text-xs font-mono text-cyan-400 uppercase font-semibold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5" />
                <span>Interactive Hyperlinks ({browserLinks.length})</span>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {browserLinks.map((lnk, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {lnk.text}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate">
                        {lnk.href}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('rendered');
                        navigateBrowser(lnk.href);
                      }}
                      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-mono text-[10px] cursor-pointer"
                    >
                      <span>Navigate</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {browserLinks.length === 0 && (
                  <p className="text-xs text-slate-400 py-2">No hyperlinks found on current document.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Web Agent Telemetry Strip */}
        <div className="px-3 py-1.5 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#090d16] flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-cyan-400 font-semibold">AGENT TRACE:</span>
            <span className="truncate">
              {browserAgentLogs[0]
                ? `${browserAgentLogs[0].action} → ${browserAgentLogs[0].target}`
                : 'Idle'}
            </span>
          </div>
          <span className="shrink-0 text-slate-500">Sandbox Proxy Active</span>
        </div>
      </div>
    </div>
  );
};
