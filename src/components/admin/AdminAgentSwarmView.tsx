import React, { useState } from 'react';
import {
  Bot,
  Play,
  Pause,
  RotateCw,
  Sliders,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  Cpu,
  Layers,
} from 'lucide-react';
import { SwarmWorker } from '../../types';

interface AdminAgentSwarmViewProps {
  workers: SwarmWorker[];
  onToggleWorkerStatus: (id: string) => void;
  onScaleConcurrency: (workerId: string, delta: number) => void;
}

export const AdminAgentSwarmView: React.FC<AdminAgentSwarmViewProps> = ({
  workers,
  onToggleWorkerStatus,
  onScaleConcurrency,
}) => {
  const [selectedWorker, setSelectedWorker] = useState<SwarmWorker>(workers[0]);
  const [isSwarmRunning, setIsSwarmRunning] = useState<boolean>(true);

  const totalProcessed = workers.reduce((acc, w) => acc + w.processedCount, 0);
  const activeCount = workers.filter((w) => w.status === 'active').length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Autonomous Agent Swarm Control
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">
              continuous_agent_loop.py
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Orchestrate background autonomous agents: solver daemon, AST code verifier, ecosystem scout, and adversarial prompt test suites.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSwarmRunning(!isSwarmRunning)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer ${
              isSwarmRunning
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {isSwarmRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Global Swarm</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Global Swarm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Active Swarm Daemons</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {activeCount} / {workers.length} Online
          </div>
          <div className="text-[10px] text-emerald-500 font-medium mt-1">
            ● {isSwarmRunning ? 'Loop Active' : 'Swarm Paused'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Total Issues & PRs Handled</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {totalProcessed.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Over past 24 hours</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Mean Verification Rate</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">99.1%</div>
          <div className="text-[10px] text-emerald-500 mt-1">0 fatal regressions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Aggregated Compute Load</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">53.4% CPU</div>
          <div className="text-[10px] text-slate-400 mt-1">1,357 MB allocated</div>
        </div>
      </div>

      {/* Workers Grid & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workers List (2 cols) */}
        <div className="lg:col-span-2 space-y-3.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-600" />
            Specialized Daemon Pool
          </h2>

          <div className="space-y-3">
            {workers.map((worker) => {
              const isSelected = selectedWorker.id === worker.id;
              const isActive = worker.status === 'active';

              return (
                <div
                  key={worker.id}
                  onClick={() => setSelectedWorker(worker)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-3 ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/20 ring-1 ring-purple-500/20'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {worker.name}
                          </h3>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {worker.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">Uptime: {worker.uptime}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {worker.status.toUpperCase()}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWorkerStatus(worker.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        {isActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Active In-Flight Task
                    </div>
                    <div className="text-slate-800 dark:text-slate-200 font-mono text-[11px] truncate">
                      {worker.currentTask}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono text-[11px] pt-1">
                    <span>Target: {worker.currentIssueOrPr}</span>
                    <span>Success: {worker.successRate}% ({worker.processedCount} done)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Worker Telemetry & Logs Drawer (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-md space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold font-mono text-purple-300 uppercase tracking-wider">
                Telemetry: {selectedWorker.name}
              </h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">CPU Utilization</div>
              <div className="text-base font-bold text-white mt-0.5">{selectedWorker.cpuPercent}%</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">Memory Heap</div>
              <div className="text-base font-bold text-white mt-0.5">{selectedWorker.memoryMb} MB</div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              Recent Execution Stream
            </span>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2 max-h-64 overflow-y-auto leading-relaxed">
              {selectedWorker.logs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-purple-400 select-none">&gt;</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Daemon ID: {selectedWorker.id}</span>
            <button
              type="button"
              onClick={() => alert(`Flushed log buffer for ${selectedWorker.name}`)}
              className="text-purple-400 hover:underline cursor-pointer"
            >
              Clear Buffer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
