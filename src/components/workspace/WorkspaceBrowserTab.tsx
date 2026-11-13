import React, { useState, useEffect, useCallback } from 'react';
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
  Camera,
  Play,
  Pause,
  MousePointer,
  HandMetal,
  Type,
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { browserService } from '../../services/browserService';

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
  const [viewMode, setViewMode] = useState<'rendered' | 'agent-dom' | 'screencast'>('rendered');
  
  // Operator Takeover State (Phase 3 - Task C1)
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [screencastFrame, setScreencastFrame] = useState<string | null>(null);
  const [selectorInput, setSelectorInput] = useState('');
  const [valueInput, setValueInput] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);

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

  // Toggle Operator Takeover
  const handleToggleTakeover = async () => {
    if (!isTakeoverActive) {
      setIsTakeoverActive(true);
      await browserService.pauseAutomation();
      if (!sessionId) {
        const sess = await browserService.createSession('Operator Takeover', browserUrl);
        setSessionId(sess.session_id);
      }
    } else {
      setIsTakeoverActive(false);
      await browserService.resumeAutomation();
    }
  };

  // Capture Live Screenshot Frame
  const handleCaptureScreenshot = useCallback(async () => {
    if (!sessionId) return;
    setActionInProgress(true);
    try {
      const res = await browserService.executeAction(sessionId, 'screenshot');
      if (res.screenshot) {
        setScreencastFrame(`data:image/png;base64,${res.screenshot}`);
        setViewMode('screencast');
      }
    } catch {
      // Fallback
    } finally {
      setActionInProgress(false);
    }
  }, [sessionId]);

  // Manual Operator Click Action
  const handleManualClick = async () => {
    if (!sessionId || !selectorInput.trim()) return;
    setActionInProgress(true);
    try {
      await browserService.executeAction(sessionId, 'click', { selector: selectorInput.trim() });
      await handleCaptureScreenshot();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Click action failed';
      alert(`Takeover Click Error: ${msg}`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Manual Operator Fill Action
  const handleManualFill = async () => {
    if (!sessionId || !selectorInput.trim()) return;
    setActionInProgress(true);
    try {
      await browserService.executeAction(sessionId, 'fill', {
        selector: selectorInput.trim(),
        value: valueInput,
      });
      await handleCaptureScreenshot();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Type/Fill action failed';
      alert(`Takeover Fill Error: ${msg}`);
    } finally {
      setActionInProgress(false);
    }
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
      {/* Operator Takeover Control Banner */}
      <div className={`px-3 py-1.5 border-b text-xs flex items-center justify-between gap-3 transition-colors ${
        isTakeoverActive
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          : 'bg-cyan-500/5 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
      }`}>
        <div className="flex items-center gap-2 font-mono">
          {isTakeoverActive ? (
            <>
              <HandMetal className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-amber-400">OPERATOR TAKEOVER ACTIVE</span>
              <span className="text-[10px] text-amber-400/80 hidden sm:inline">(Agent paused · Manual control enabled)</span>
            </>
          ) : (
            <>
              <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Autonomous Browser Stream</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">(L4/L5 Cascade Ready)</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isTakeoverActive && (
            <button
              type="button"
              onClick={handleCaptureScreenshot}
              disabled={actionInProgress}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-mono text-[10px] font-semibold cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-3 h-3" />
              <span>Capture Frame</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleTakeover}
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold transition-all cursor-pointer ${
              isTakeoverActive
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-cyan-400 hover:bg-cyan-500/10 border border-slate-300 dark:border-slate-700'
            }`}
          >
            {isTakeoverActive ? (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Resume Autonomous Mode</span>
              </>
            ) : (
              <>
                <Pause className="w-3 h-3" />
                <span>Operator Takeover</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Manual Action Injection Strip (when Takeover is active) */}
      {isTakeoverActive && (
        <div className="px-3 py-2 bg-amber-500/5 border-b border-amber-500/20 flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <MousePointer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="text"
              value={selectorInput}
              onChange={(e) => setSelectorInput(e.target.value)}
              placeholder="CSS / XPath Selector (e.g. button#submit, //a)..."
              className="w-full px-2 py-1 text-[11px] rounded bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
            <Type className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <input
              type="text"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder="Value to type/fill..."
              className="w-full px-2 py-1 text-[11px] rounded bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-800 dark:text-slate-100 outline-none"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleManualClick}
              disabled={actionInProgress || !selectorInput.trim()}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-[10px] cursor-pointer"
            >
              Click
            </button>
            <button
              type="button"
              onClick={handleManualFill}
              disabled={actionInProgress || !selectorInput.trim()}
              className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-[10px] cursor-pointer"
            >
              Fill
            </button>
          </div>
        </div>
      )}

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

          {/* View Mode Toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'rendered'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span className="hidden sm:inline">Render</span>
            </button>
            {screencastFrame && (
              <button
                type="button"
                onClick={() => setViewMode('screencast')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'screencast'
                    ? 'bg-cyan-500 text-slate-950 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Camera className="w-3 h-3" />
                <span className="hidden sm:inline">Frame</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setViewMode('agent-dom')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'agent-dom'
                  ? 'bg-cyan-500 text-slate-950 font-semibold'
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
        ) : viewMode === 'screencast' && screencastFrame ? (
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
            <img
              src={screencastFrame}
              alt="Playwright Screencast Frame"
              className="max-w-full max-h-full rounded-lg border border-cyan-500/40 shadow-2xl object-contain"
            />
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
          <span className="shrink-0 text-slate-500">
            {isTakeoverActive ? 'Manual Override Active' : 'Autonomous Cascade Engine'}
          </span>
        </div>
      </div>
    </div>
  );
};
