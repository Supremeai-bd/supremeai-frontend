import { create } from 'zustand';
import { toast } from './useToastStore';

export type WorkspaceTab = 'sandbox' | 'preview' | 'terminal' | 'browser' | 'code' | 'graph';
export type ViewportDevice = 'desktop' | 'tablet' | 'mobile';

export interface TerminalLine {
  id: string;
  timestamp: string;
  type: 'cmd' | 'stdout' | 'stderr' | 'agent' | 'system';
  text: string;
}

export interface BrowserLink {
  href: string;
  text: string;
}

export interface BrowserAgentEvent {
  id: string;
  timestamp: string;
  action: string;
  target: string;
  status: 'ok' | 'pending' | 'error';
}

const DEFAULT_PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#080b11] text-slate-100 min-h-screen flex items-center justify-center p-6 font-sans antialiased">
  <div class="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-slate-900/70 backdrop-blur-xl p-6 shadow-[0_0_40px_rgba(0,240,255,0.12)]">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
        <span class="text-xs font-mono uppercase tracking-wider text-cyan-400">Live Preview Sandbox</span>
      </div>
      <span class="text-[11px] font-mono text-slate-400">v2.4</span>
    </div>
    <h1 class="text-xl font-bold tracking-tight text-white mb-2">
      SupremeAI Interactive Canvas
    </h1>
    <p class="text-xs text-slate-400 leading-relaxed mb-5">
      Ask SupremeAI to build any UI component, landing page, dashboard, or Mermaid diagram in the chat — then click <strong class="text-cyan-400">Preview</strong> on any code block to render it live here.
    </p>
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
        <div class="text-[10px] font-mono text-slate-400">RUNTIME</div>
        <div class="text-sm font-semibold text-emerald-400 mt-0.5">React + Tailwind</div>
      </div>
      <div class="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
        <div class="text-[10px] font-mono text-slate-400">ISOLATION</div>
        <div class="text-sm font-semibold text-cyan-400 mt-0.5">Sandboxed Iframe</div>
      </div>
    </div>
    <button
      onclick="const el = document.getElementById('counter'); el.textContent = Number(el.textContent) + 1;"
      class="w-full py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
    >
      <span>Test Interactive State</span>
      <span id="counter" class="px-1.5 py-0.5 rounded bg-slate-950/20 font-mono">0</span>
    </button>
  </div>
</body>
</html>`;

interface WorkspaceState {
  isDockOpen: boolean;
  dockWidthPercent: number;
  activeDockTab: WorkspaceTab;

  // Preview & Code Editor
  previewCode: string;
  previewLang: string;
  previewTitle: string;
  viewportDevice: ViewportDevice;
  previewDarkMode: boolean;
  previewRefreshKey: number;
  sandboxAutoRunNonce: number;

  // Terminal
  terminalLines: TerminalLine[];
  isExecutingCmd: boolean;
  isAgentStreamEnabled: boolean;
  commandHistory: string[];

  // Virtual Browser
  browserUrl: string;
  browserTitle: string;
  browserStatus: 'idle' | 'loading' | 'loaded' | 'error';
  browserHtml: string;
  browserError: string | null;
  browserLatencyMs: number | null;
  browserStatusCode: number | null;
  browserLinks: BrowserLink[];
  browserTextPreview: string;
  browserHistoryStack: string[];
  browserHistoryIndex: number;
  browserAgentLogs: BrowserAgentEvent[];

  // Actions
  setDockOpen: (open: boolean) => void;
  toggleDock: () => void;
  setDockWidthPercent: (pct: number) => void;
  setActiveDockTab: (tab: WorkspaceTab) => void;

  // Preview & Code Actions
  loadCodeIntoWorkspace: (code: string, lang?: string, openTab?: WorkspaceTab, autoRun?: boolean) => void;
  updatePreviewCode: (code: string) => void;
  setViewportDevice: (device: ViewportDevice) => void;
  togglePreviewDarkMode: () => void;
  reloadPreview: () => void;
  triggerSandboxRun: () => void;

  // Terminal Actions
  appendTerminalLine: (line: Omit<TerminalLine, 'id' | 'timestamp'>) => void;
  clearTerminal: () => void;
  toggleAgentStream: () => void;
  executeTerminalCommand: (cmd: string) => Promise<void>;

  // Browser Actions
  navigateBrowser: (url: string, pushHistory?: boolean) => Promise<void>;
  browserBack: () => void;
  browserForward: () => void;
  refreshBrowser: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  isDockOpen: false,
  dockWidthPercent: 52,
  activeDockTab: 'preview',

  previewCode: DEFAULT_PREVIEW_HTML,
  previewLang: 'html',
  previewTitle: 'Interactive Sandbox',
  viewportDevice: 'desktop',
  previewDarkMode: true,
  previewRefreshKey: 1,
  sandboxAutoRunNonce: 0,

  terminalLines: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'SupremeAI Studio Shell v2.4 initialized · Workspace sandbox ready.',
    },
    {
      id: 'init-2',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
      text: 'Type "help" for available commands (ls, cat, git status, mcp status, health).',
    },
  ],
  isExecutingCmd: false,
  isAgentStreamEnabled: true,
  commandHistory: [],

  browserUrl: 'http://localhost:3000/api/health',
  browserTitle: 'SupremeAI Studio Web Agent',
  browserStatus: 'idle',
  browserHtml: '',
  browserError: null,
  browserLatencyMs: null,
  browserStatusCode: null,
  browserLinks: [],
  browserTextPreview: '',
  browserHistoryStack: [],
  browserHistoryIndex: -1,
  browserAgentLogs: [
    {
      id: 'ba-init',
      timestamp: new Date().toLocaleTimeString(),
      action: 'INIT',
      target: 'Web Agent Sandbox Engine Ready',
      status: 'ok',
    },
  ],

  setDockOpen: (open) => set({ isDockOpen: open }),
  toggleDock: () => set((s) => ({ isDockOpen: !s.isDockOpen })),
  setDockWidthPercent: (pct) => set({ dockWidthPercent: Math.max(32, Math.min(72, pct)) }),
  setActiveDockTab: (tab) => set({ activeDockTab: tab }),

  loadCodeIntoWorkspace: (code, lang = 'html', openTab = 'preview', autoRun = false) => {
    const cleanLang = (lang || 'html').toLowerCase().trim();
    set((s) => ({
      previewCode: code,
      previewLang: cleanLang,
      previewTitle: `${cleanLang.toUpperCase()} Buffer`,
      activeDockTab: openTab,
      isDockOpen: true,
      previewRefreshKey: s.previewRefreshKey + 1,
      sandboxAutoRunNonce:
        autoRun || openTab === 'sandbox' ? s.sandboxAutoRunNonce + 1 : s.sandboxAutoRunNonce,
    }));
    toast.info('Loaded in Workspace', `Opened ${cleanLang.toUpperCase()} snippet in ${openTab} tab.`);
  },

  updatePreviewCode: (code) =>
    set((s) => ({
      previewCode: code,
      previewRefreshKey: s.previewRefreshKey + 1,
    })),

  setViewportDevice: (device) => set({ viewportDevice: device }),
  togglePreviewDarkMode: () => set((s) => ({ previewDarkMode: !s.previewDarkMode })),
  reloadPreview: () => set((s) => ({ previewRefreshKey: s.previewRefreshKey + 1 })),
  triggerSandboxRun: () => set((s) => ({ sandboxAutoRunNonce: s.sandboxAutoRunNonce + 1 })),

  appendTerminalLine: (line) =>
    set((s) => ({
      terminalLines: [
        ...s.terminalLines.slice(-250),
        {
          ...line,
          id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    })),

  clearTerminal: () =>
    set({
      terminalLines: [
        {
          id: `term-clr-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system',
          text: 'Terminal buffer cleared.',
        },
      ],
    }),

  toggleAgentStream: () =>
    set((s) => ({ isAgentStreamEnabled: !s.isAgentStreamEnabled })),

  executeTerminalCommand: async (rawCmd) => {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    const { appendTerminalLine, clearTerminal, commandHistory } = get();

    if (trimmed.toLowerCase() === 'clear') {
      clearTerminal();
      set({ commandHistory: [trimmed, ...commandHistory.slice(0, 30)] });
      return;
    }

    appendTerminalLine({ type: 'cmd', text: `supremeai@studio:~$ ${trimmed}` });
    set({
      isExecutingCmd: true,
      commandHistory: [trimmed, ...commandHistory.slice(0, 30)],
    });

    try {
      const res = await fetch('/api/workspace/terminal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed }),
      });

      const data = await res.json();
      if (data.stdout) {
        appendTerminalLine({ type: 'stdout', text: data.stdout });
      }
      if (data.stderr) {
        appendTerminalLine({ type: 'stderr', text: data.stderr });
      }
      if (data.error) {
        appendTerminalLine({ type: 'stderr', text: data.error });
      }
    } catch (err: unknown) {
      appendTerminalLine({
        type: 'stderr',
        text: err instanceof Error ? err.message : 'Failed to execute terminal command.',
      });
    } finally {
      set({ isExecutingCmd: false });
    }
  },

  navigateBrowser: async (rawUrl, pushHistory = true) => {
    const cleanUrl = rawUrl.trim();
    if (!cleanUrl) return;
    const formattedUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
      ? cleanUrl
      : `https://${cleanUrl}`;

    const navLog: BrowserAgentEvent = {
      id: `ba-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      action: 'NAVIGATE',
      target: formattedUrl,
      status: 'pending',
    };

    set((s) => ({
      browserUrl: formattedUrl,
      browserStatus: 'loading',
      browserError: null,
      browserAgentLogs: [navLog, ...s.browserAgentLogs.slice(0, 19)],
    }));

    try {
      const res = await fetch(`/api/workspace/browser-proxy?url=${encodeURIComponent(formattedUrl)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      set((s) => {
        const nextStack = pushHistory
          ? [...s.browserHistoryStack.slice(0, s.browserHistoryIndex + 1), data.url]
          : s.browserHistoryStack;
        const nextIndex = pushHistory ? nextStack.length - 1 : s.browserHistoryIndex;

        return {
          browserUrl: data.url,
          browserTitle: data.title || data.url,
          browserStatus: 'loaded',
          browserHtml: data.html || '',
          browserLatencyMs: data.latencyMs ?? null,
          browserStatusCode: data.statusCode ?? 200,
          browserLinks: data.extractedLinks || [],
          browserTextPreview: data.textPreview || '',
          browserHistoryStack: nextStack,
          browserHistoryIndex: nextIndex,
          browserAgentLogs: [
            {
              id: `ba-ok-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              action: `DOM_SYNC (${data.statusCode})`,
              target: `${(data.extractedLinks || []).length} links extracted in ${data.latencyMs}ms`,
              status: 'ok',
            },
            ...s.browserAgentLogs.slice(0, 19),
          ],
        };
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to load URL';
      set((s) => ({
        browserStatus: 'error',
        browserError: errMsg,
        browserAgentLogs: [
          {
            id: `ba-err-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString(),
            action: 'ERROR',
            target: errMsg,
            status: 'error',
          },
          ...s.browserAgentLogs.slice(0, 19),
        ],
      }));
    }
  },

  browserBack: () => {
    const { browserHistoryStack, browserHistoryIndex, navigateBrowser } = get();
    if (browserHistoryIndex > 0) {
      const prevUrl = browserHistoryStack[browserHistoryIndex - 1];
      set({ browserHistoryIndex: browserHistoryIndex - 1 });
      navigateBrowser(prevUrl, false);
    }
  },

  browserForward: () => {
    const { browserHistoryStack, browserHistoryIndex, navigateBrowser } = get();
    if (browserHistoryIndex < browserHistoryStack.length - 1) {
      const nextUrl = browserHistoryStack[browserHistoryIndex + 1];
      set({ browserHistoryIndex: browserHistoryIndex + 1 });
      navigateBrowser(nextUrl, false);
    }
  },

  refreshBrowser: () => {
    const { browserUrl, navigateBrowser } = get();
    navigateBrowser(browserUrl, false);
  },
}));
