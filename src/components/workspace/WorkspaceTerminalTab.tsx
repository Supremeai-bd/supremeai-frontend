import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal as TerminalIcon, Trash2, Radio, Play } from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';
import { useRealtimeStream } from '../../hooks/useRealtimeStream';

interface SwarmStreamEvent {
  type: string;
  timestamp: number;
  throughputRps?: number;
  logEvent?: {
    timestamp: string;
    source: string;
    level: string;
    message: string;
  };
}

const PROMPT = '\x1b[1;36msupremeai\x1b[0m\x1b[1;32m@studio\x1b[0m:\x1b[1;34m~\x1b[0m$ ';

export const WorkspaceTerminalTab: React.FC = () => {
  const {
    isAgentStreamEnabled,
    toggleAgentStream,
  } = useWorkspaceStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef<string>('');
  const historyRef = useRef<string[]>([]);
  const historyIdxRef = useRef<number>(-1);
  const isBusyRef = useRef<boolean>(false);

  const writePrompt = useCallback(() => {
    termRef.current?.write(`\r\n${PROMPT}`);
  }, []);

  const runShellCommand = useCallback(
    async (rawCmd: string, echoCommand: boolean = false) => {
      const term = termRef.current;
      const trimmed = rawCmd.trim();
      if (!term) return;

      if (echoCommand) {
        term.write(`\r\n${PROMPT}${trimmed}`);
      }

      if (!trimmed) {
        writePrompt();
        return;
      }

      historyRef.current = [trimmed, ...historyRef.current.slice(0, 40)];
      historyIdxRef.current = -1;

      if (trimmed.toLowerCase() === 'clear') {
        term.clear();
        term.write(PROMPT);
        return;
      }

      isBusyRef.current = true;
      term.write('\r\n');

      try {
        const res = await fetch('/api/workspace/terminal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: trimmed }),
        });
        const data = await res.json();

        if (data.stdout) {
          const formatted = String(data.stdout).replace(/\r?\n/g, '\r\n');
          term.writeln(`\x1b[32m${formatted}\x1b[0m`);
        }
        if (data.stderr) {
          const formatted = String(data.stderr).replace(/\r?\n/g, '\r\n');
          term.writeln(`\x1b[31m${formatted}\x1b[0m`);
        }
        if (data.error) {
          term.writeln(`\x1b[31m${data.error}\x1b[0m`);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terminal execution error';
        term.writeln(`\x1b[31m${msg}\x1b[0m`);
      } finally {
        isBusyRef.current = false;
        term.write(PROMPT);
      }
    },
    [writePrompt]
  );

  // Initialize XTerm.js + FitAddon
  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 12,
      lineHeight: 1.45,
      scrollback: 2000,
      theme: {
        background: '#060910',
        foreground: '#e2e8f0',
        cursor: '#00f0ff',
        cursorAccent: '#060910',
        selectionBackground: 'rgba(0, 240, 255, 0.25)',
        black: '#0f172a',
        red: '#fb7185',
        green: '#34d399',
        yellow: '#fbbf24',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#f8fafc',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    // Welcome banner
    term.writeln('\x1b[1;36m╔══════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;36m║  SupremeAI Studio · XTerm.js Interactive Shell v2.4      ║\x1b[0m');
    term.writeln('\x1b[1;36m╚══════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('\x1b[90mType "help" for commands (ls, cat, git status, mcp status, health).\x1b[0m');
    term.write(PROMPT);

    // Handle keyboard input directly in XTerm
    const disposable = term.onData((data) => {
      if (isBusyRef.current) return;

      // Enter
      if (data === '\r') {
        const cmd = inputBufferRef.current;
        inputBufferRef.current = '';
        runShellCommand(cmd, false);
        return;
      }

      // Ctrl+C
      if (data === '\x03') {
        inputBufferRef.current = '';
        term.write('^C');
        writePrompt();
        return;
      }

      // Ctrl+L
      if (data === '\x0c') {
        term.clear();
        term.write(`${PROMPT}${inputBufferRef.current}`);
        return;
      }

      // Backspace
      if (data === '\x7f' || data === '\b') {
        if (inputBufferRef.current.length > 0) {
          inputBufferRef.current = inputBufferRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Arrow Up (History previous)
      if (data === '\x1b[A') {
        if (historyRef.current.length === 0) return;
        const nextIdx = Math.min(historyIdxRef.current + 1, historyRef.current.length - 1);
        historyIdxRef.current = nextIdx;
        const prevCmd = historyRef.current[nextIdx];
        // Clear current input on screen
        term.write('\b \b'.repeat(inputBufferRef.current.length));
        inputBufferRef.current = prevCmd;
        term.write(prevCmd);
        return;
      }

      // Arrow Down (History next)
      if (data === '\x1b[B') {
        if (historyIdxRef.current <= 0) {
          term.write('\b \b'.repeat(inputBufferRef.current.length));
          historyIdxRef.current = -1;
          inputBufferRef.current = '';
        } else {
          const nextIdx = historyIdxRef.current - 1;
          historyIdxRef.current = nextIdx;
          const nextCmd = historyRef.current[nextIdx];
          term.write('\b \b'.repeat(inputBufferRef.current.length));
          inputBufferRef.current = nextCmd;
          term.write(nextCmd);
        }
        return;
      }

      // Printable ASCII / Unicode
      if (data >= ' ' && data !== '\x7f') {
        inputBufferRef.current += data;
        term.write(data);
      }
    });

    // ResizeObserver for smooth split-dock dragging
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {}
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      disposable.dispose();
      resizeObserver.disconnect();
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
    };
  }, [runShellCommand, writePrompt]);

  // Pipe Live Agent Swarm SSE events right into XTerm
  const handleSwarmMessage = useCallback((payload: SwarmStreamEvent) => {
    const term = termRef.current;
    if (!term || !payload?.logEvent) return;

    const time = payload.logEvent.timestamp;
    const msg = payload.logEvent.message;
    const rps = payload.throughputRps || 120;

    // Clear current line, print agent event cleanly, then restore prompt + typed buffer
    term.write(`\r\x1b[K\x1b[35m[${time} · SWARM]\x1b[0m \x1b[37m${msg} (${rps} req/s)\x1b[0m\r\n`);
    term.write(`${PROMPT}${inputBufferRef.current}`);
  }, []);

  const { status: streamStatus } = useRealtimeStream<SwarmStreamEvent>({
    url: '/api/agent-swarm/stream',
    enabled: isAgentStreamEnabled,
    onMessage: handleSwarmMessage,
  });

  const handleClear = () => {
    const term = termRef.current;
    if (!term) return;
    inputBufferRef.current = '';
    term.clear();
    term.write(PROMPT);
    term.focus();
  };

  const QUICK_CMDS = ['ls -la', 'git status', 'mcp status', 'health', 'cat package.json', 'help'];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden bg-[#060910] text-slate-200 font-mono"
      onClick={() => termRef.current?.focus()}
    >
      {/* XTerm Header Toolbar */}
      <div className="px-3 py-2 border-b border-slate-800/90 flex items-center justify-between gap-2 bg-[#0b101b]">
        <div className="flex items-center gap-2 text-[11px]">
          <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200">XTerm.js · supremeai-bash</span>
          <span className="text-slate-600">·</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleAgentStream();
            }}
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] transition-colors cursor-pointer ${
              isAgentStreamEnabled
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
            title="Toggle Live Agent Swarm SSE Stream"
          >
            <Radio
              className={`w-3 h-3 ${
                isAgentStreamEnabled && streamStatus === 'connected' ? 'animate-pulse text-emerald-400' : ''
              }`}
            />
            <span>Agent SSE: {isAgentStreamEnabled ? streamStatus.toUpperCase() : 'PAUSED'}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleClear();
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-400 hover:text-rose-400 hover:bg-slate-800/70 transition-colors cursor-pointer"
          title="Clear Terminal"
        >
          <Trash2 className="w-3 h-3" />
          <span>Clear</span>
        </button>
      </div>

      {/* Quick Command Bar */}
      <div className="px-3 py-1.5 border-b border-slate-800/60 bg-[#080c15] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase shrink-0 mr-1">Run:</span>
        {QUICK_CMDS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              runShellCommand(q, true);
              termRef.current?.focus();
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-[10px] text-slate-300 hover:text-cyan-300 transition-colors shrink-0 cursor-pointer"
          >
            <Play className="w-2.5 h-2.5 text-cyan-500" />
            <span>{q}</span>
          </button>
        ))}
      </div>

      {/* XTerm.js Mounted Canvas */}
      <div className="flex-1 overflow-hidden p-2 bg-[#060910]">
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
