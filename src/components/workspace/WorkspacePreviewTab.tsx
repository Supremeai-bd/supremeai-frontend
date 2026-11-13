import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, RotateCw, Sun, Moon, Copy, Check, Maximize2 } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

function buildSandboxSrcDoc(code: string, lang: string, darkMode: boolean): string {
  const trimmed = code.trim();
  const normalizedLang = (lang || 'html').toLowerCase();
  const themeClass = darkMode ? 'dark bg-[#080b11] text-slate-100' : 'bg-slate-50 text-slate-900';

  // Full HTML document
  if (/^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    return trimmed;
  }

  // Mermaid Diagram
  if (normalizedLang === 'mermaid') {
    const escaped = trimmed.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    body { margin: 0; padding: 24px; display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: system-ui, sans-serif; background: ${
      darkMode ? '#080b11' : '#f8fafc'
    }; color: ${darkMode ? '#f1f5f9' : '#0f172a'}; }
  </style>
</head>
<body>
  <div class="mermaid">${escaped}</div>
  <script>
    mermaid.initialize({ startOnLoad: true, theme: '${darkMode ? 'dark' : 'default'}' });
  </script>
</body>
</html>`;
  }

  // React / JSX / TSX live runner
  const looksLikeJsx =
    normalizedLang === 'tsx' ||
    normalizedLang === 'jsx' ||
    normalizedLang === 'react' ||
    (/export\s+default\s+function|function\s+[A-Z]|const\s+[A-Z]\w*\s*=/.test(trimmed) &&
      /return\s*\(?\s*</.test(trimmed));

  if (looksLikeJsx) {
    // Strip ES module imports and export keywords so Babel UMD runs smoothly
    const cleanedCode = trimmed
      .replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '')
      .replace(/export\s+default\s+/g, 'const __DefaultExport__ = ')
      .replace(/export\s+(const|function|class)\s+/g, '$1 ');

    return `<!DOCTYPE html>
<html class="${darkMode ? 'dark' : ''}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script>tailwind.config = { darkMode: 'class' };</script>
</head>
<body class="${themeClass} min-h-screen p-6 antialiased">
  <div id="root"></div>
  <div id="error-box" style="display:none;color:#fb7185;background:#1e1b2e;border:1px solid #f43f5e55;padding:14px;border-radius:12px;font-family:monospace;font-size:12px;white-space:pre-wrap;"></div>
  <script type="text/babel" data-presets="react,typescript">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;
    try {
      ${cleanedCode}

      const RootComponent = typeof __DefaultExport__ !== 'undefined'
        ? __DefaultExport__
        : (typeof App !== 'undefined' ? App : null);

      if (RootComponent) {
        ReactDOM.createRoot(document.getElementById('root')).render(<RootComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div class="text-xs font-mono text-cyan-400 p-4 border border-cyan-500/30 rounded-xl">Component compiled cleanly. Export a default React component to mount it visually.</div>';
      }
    } catch (err) {
      const box = document.getElementById('error-box');
      box.style.display = 'block';
      box.textContent = 'Preview Runtime Error:\\n' + err.message;
    }
  </script>
</body>
</html>`;
  }

  // Plain HTML / SVG snippet wrapped with Tailwind CDN
  if (normalizedLang === 'html' || normalizedLang === 'svg' || trimmed.startsWith('<')) {
    return `<!DOCTYPE html>
<html class="${darkMode ? 'dark' : ''}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>tailwind.config = { darkMode: 'class' };</script>
</head>
<body class="${themeClass} min-h-screen p-6 antialiased">
  ${trimmed}
</body>
</html>`;
  }

  // JavaScript / TypeScript console sandbox fallback
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="${themeClass} min-h-screen p-6 font-mono text-xs antialiased">
  <div class="rounded-xl border border-cyan-500/30 bg-slate-900/80 text-slate-100 p-4">
    <div class="text-cyan-400 font-semibold mb-2 uppercase tracking-wider text-[11px]">JS Sandbox Console Output</div>
    <pre id="console-out" class="whitespace-pre-wrap text-emerald-300 leading-relaxed"></pre>
  </div>
  <script>
    const out = document.getElementById('console-out');
    const origLog = console.log;
    console.log = (...args) => {
      out.textContent += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\\n';
      origLog(...args);
    };
    try {
      ${trimmed.replace(/export\s+/g, '')}
      if (!out.textContent) out.textContent = '✓ Script evaluated with 0 errors.';
    } catch (e) {
      out.className = 'whitespace-pre-wrap text-rose-400';
      out.textContent = 'Error: ' + e.message;
    }
  </script>
</body>
</html>`;
}

export const WorkspacePreviewTab: React.FC = () => {
  const {
    previewCode,
    previewLang,
    viewportDevice,
    previewDarkMode,
    previewRefreshKey,
    setViewportDevice,
    togglePreviewDarkMode,
    reloadPreview,
    setActiveDockTab,
  } = useWorkspaceStore();

  const [copied, setCopied] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      setStageSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const srcDoc = useMemo(
    () => buildSandboxSrcDoc(previewCode, previewLang, previewDarkMode),
    [previewCode, previewLang, previewDarkMode]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(previewCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleOpenBlobTab = () => {
    const blob = new Blob([srcDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `supremeai-preview-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const targetWidthPx =
    viewportDevice === 'mobile' ? 375 : viewportDevice === 'tablet' ? 768 : 0;
  const availableWidthPx = Math.max(200, stageSize.width - 24);
  const availableHeightPx = Math.max(220, stageSize.height - 24);
  const previewScale =
    targetWidthPx > 0 && availableWidthPx < targetWidthPx
      ? Math.max(0.32, availableWidthPx / targetWidthPx)
      : 1;
  const scaledPercent = Math.round(previewScale * 100);

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
      {/* Preview Toolbar */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900/50">
        {/* Device Viewport Selector */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setViewportDevice('desktop')}
            title="Desktop Viewport (100%)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewportDevice === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewportDevice('tablet')}
            title="Tablet Viewport (768px)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewportDevice === 'tablet'
                ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewportDevice('mobile')}
            title="Mobile Viewport (375px)"
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewportDevice === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Source & fit indicator */}
        <button
          type="button"
          onClick={() => setActiveDockTab('code')}
          className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer truncate"
        >
          <span className="text-cyan-500 font-semibold uppercase">{previewLang}</span>
          {targetWidthPx > 0 && (
            <span className="ml-1.5 text-slate-400">
              · {targetWidthPx}px{previewScale < 1 ? ` (${scaledPercent}%)` : ''}
            </span>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={togglePreviewDarkMode}
            title="Toggle Sandbox Theme"
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {previewDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={reloadPreview}
            title="Reload Sandbox"
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleOpenBlobTab}
            title="Download Standalone HTML"
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandboxed Iframe Container with Responsive Fit Scaling */}
      <div
        ref={stageRef}
        className="flex-1 min-h-0 min-w-0 overflow-auto bg-slate-200/60 dark:bg-[#05070c] flex justify-center items-start p-2 sm:p-3"
      >
        {targetWidthPx > 0 ? (
          <div
            style={{
              width: `${Math.round(targetWidthPx * previewScale)}px`,
              height: `${availableHeightPx}px`,
            }}
            className="shrink-0 relative overflow-hidden rounded-xl border border-slate-300 dark:border-cyan-500/20 shadow-lg bg-white dark:bg-[#080b11]"
          >
            <div
              style={{
                width: `${targetWidthPx}px`,
                height: `${Math.round(availableHeightPx / previewScale)}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
              <iframe
                key={previewRefreshKey}
                title="SupremeAI Live Preview Sandbox"
                srcDoc={srcDoc}
                sandbox="allow-scripts allow-forms allow-modals"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-xl overflow-hidden border border-slate-300 dark:border-cyan-500/20 shadow-lg bg-white dark:bg-[#080b11]">
            <iframe
              key={previewRefreshKey}
              title="SupremeAI Live Preview Sandbox"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-forms allow-modals"
              className="w-full h-full border-0"
            />
          </div>
        )}
      </div>
    </div>
  );
};
