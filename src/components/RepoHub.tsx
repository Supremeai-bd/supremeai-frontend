import React, { useState } from 'react';
import { GitBranch, ExternalLink, Copy, Check, FolderGit2, Terminal, Code2, Layers, CheckCircle2 } from 'lucide-react';

export const RepoHub: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCommand = (cmd: string, index: number) => {
    navigator.clipboard.writeText(cmd);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Editorial Header */}
      <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          SupremeAI Ecosystem Repositories
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Overview and integration topology between the core SupremeAI engine and the featherweight SupremeAI Studio frontend interface.
        </p>
      </div>

      {/* 2 Linked Repositories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SupremeAI Core */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supremeai-bd/supremeai
                </h3>
                <span className="text-xs text-slate-500">Core AI Engine & Backend Services</span>
              </div>
            </div>
            <a
              href="https://github.com/Supremeai-bd/supremeai"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The foundation repository containing core model orchestration, agent execution loops, and backend pipelines.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Primary Branch</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">main</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>Organization</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Supremeai-bd</span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-xs">
              <span className="truncate text-slate-700 dark:text-slate-300">
                git clone https://github.com/Supremeai-bd/supremeai.git
              </span>
              <button
                type="button"
                onClick={() =>
                  copyCommand('git clone https://github.com/Supremeai-bd/supremeai.git', 1)
                }
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {copiedIndex === 1 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SupremeAI Studio Frontend */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 space-y-4 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Supremeai-bd/supremeai-studio
                </h3>
                <span className="text-xs text-slate-500">Lightest Design Web Application</span>
              </div>
            </div>
            <a
              href="https://github.com/Supremeai-bd/supremeai-studio"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Ultra-lightweight React 19 + Tailwind v4 + Express studio frontend designed with zero clutter, real-time SupremeAI streaming, and role personas.
          </p>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-500">
              <span>Stack</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                React 19 · Vite · Express
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span>AI Integration</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                SupremeAI Gateway Service
              </span>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200/60 dark:border-slate-700/60 font-mono text-xs">
              <span className="truncate text-slate-700 dark:text-slate-300">
                git clone https://github.com/Supremeai-bd/supremeai-studio.git
              </span>
              <button
                type="button"
                onClick={() =>
                  copyCommand('git clone https://github.com/Supremeai-bd/supremeai-studio.git', 2)
                }
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {copiedIndex === 2 ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Topology */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span>SupremeAI Studio Architecture (Clean Featherweight Design)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">1. Client Layer</div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              React 19 SPA with Plus Jakarta Sans typography, Tailwind CSS v4, zero-pill metadata, and SSE stream consumer.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">2. Express Proxy</div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Secure server-side API bridge in server.ts keeping credentials safe and streaming token chunks via Server-Sent Events.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">3. SupremeAI Cognitive Engine</div>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Proprietary cognitive mesh dynamically routing between SupremeAI Core, Reason, Spark, and Deep based on intent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
