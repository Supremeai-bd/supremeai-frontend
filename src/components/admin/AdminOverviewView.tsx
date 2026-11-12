import React, { useState } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  DollarSign,
  TrendingUp,
  Cpu,
  Radio,
  Bot,
  AlertTriangle,
  RotateCcw,
  GitCompare,
  Pause,
  Play,
  ArrowUpRight,
  Lock,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CustomerRecord, McpTowerService, SwarmWorker, TaskQueueJob } from '../../types';

interface AdminOverviewViewProps {
  customers: CustomerRecord[];
  services: McpTowerService[];
  workers: SwarmWorker[];
  jobs: TaskQueueJob[];
  onNavigateTab: (tab: string) => void;
  onOpenDangerConfirm: (action: string, title: string, description: string) => void;
}

const LIVE_TRAFFIC_DATA = [
  { time: '06:00', qps: 180, latency: 22, cost: 4.2 },
  { time: '07:00', qps: 240, latency: 24, cost: 6.8 },
  { time: '08:00', qps: 390, latency: 29, cost: 12.1 },
  { time: '09:00', qps: 480, latency: 34, cost: 18.5 },
  { time: '10:00', qps: 420, latency: 28, cost: 24.8 },
  { time: '11:00', qps: 450, latency: 26, cost: 32.4 },
];

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  customers,
  services,
  workers,
  jobs,
  onNavigateTab,
  onOpenDangerConfirm,
}) => {
  const unhealthyServices = services.filter((s) => s.status !== 'healthy');
  const dlqJobs = jobs.filter((j) => j.status === 'dlq' || j.status === 'failed');
  const activeWorkers = workers.filter((w) => w.status === 'active').length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              SupremeAI Admin Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
              Single Point of Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time infrastructure health, gateway throughput, token unit economics, autonomous swarms, and cluster security.
          </p>
        </div>

        {/* Global Cluster Health Indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Cluster Uptime: 99.98%
            </span>
          </div>
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Gateway QPS */}
        <div
          onClick={() => onNavigateTab('llm-gateway')}
          className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-400 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Gateway Traffic</span>
            <Cpu className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">420 QPS</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Latency: 28ms</span>
            <span className="text-emerald-500 font-semibold">0.02% Err</span>
          </div>
        </div>

        {/* Financial Unit Economics */}
        <div
          onClick={() => onNavigateTab('llm-gateway')}
          className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Today's Unit Economics</span>
            <DollarSign className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$148.60</div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Cost: $32.40</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">+78% Margin</span>
          </div>
        </div>

        {/* MCP Tower Services */}
        <div
          onClick={() => onNavigateTab('mcp-tower')}
          className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>MCP Microservices</span>
            <Radio className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {services.length - unhealthyServices.length} / {services.length} Healthy
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>8 Microservices</span>
            {unhealthyServices.length > 0 ? (
              <span className="text-rose-500 font-semibold">{unhealthyServices.length} Degraded</span>
            ) : (
              <span className="text-emerald-500 font-semibold">All OK</span>
            )}
          </div>
        </div>

        {/* Autonomous Swarm Workers */}
        <div
          onClick={() => onNavigateTab('agent-swarm')}
          className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-400 transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Autonomous Swarm</span>
            <Bot className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {activeWorkers} Daemons
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>continuous_loop</span>
            <span className="text-emerald-500 font-semibold">99.1% Pass</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Command Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Real-Time Gateway Traffic & Cost Curve */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Real-Time LLM Gateway QPS & Latency Telemetry
              </h2>
              <p className="text-[11px] text-slate-400">Aggregated requests/sec over the last 6 hours</p>
            </div>
            <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
              Live Stream Broker
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={LIVE_TRAFFIC_DATA}>
                <defs>
                  <linearGradient id="qpsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop stopColor="#10b981" stopOpacity={0.3} />
                    <stop stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Area type="monotone" dataKey="qps" stroke="#3b82f6" strokeWidth={2} fill="url(#qpsGradient)" name="Requests/min" />
                <Area type="monotone" dataKey="latency" stroke="#a855f7" strokeWidth={2} fill="none" name="Latency (ms)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Quick Command Hub */}
        <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Command Actions
              </h3>
              <span className="text-[10px] text-emerald-500 font-mono">Operator: Ziaul</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('mcp-tower')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Radio className="w-4 h-4 text-amber-500" />
                  <span>Inspect MCP Microservices</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('schema-parity')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <GitCompare className="w-4 h-4 text-emerald-500" />
                  <span>Supabase Schema Parity</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('task-queue')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <RotateCcw className="w-4 h-4 text-blue-500" />
                  <span>Task Queue & DLQ ({dlqJobs.length})</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('customers')}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Customers & Impersonation</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Danger Zone Trigger */}
          <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Danger Zone Operations</span>
            </div>
            <p className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
              All destructive operations require explicit two-step confirmation.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onOpenDangerConfirm(
                    'reboot-all',
                    'Reboot All MCP Microservices',
                    'This will terminate and cold-boot all 8 microservices in the MCP Tower. Active user streams may experience a momentary 500ms reconnect.'
                  )
                }
                className="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer"
              >
                Reboot All
              </button>
              <button
                type="button"
                onClick={() =>
                  onOpenDangerConfirm(
                    'flush-dlq',
                    'Flush Dead-Letter Queue',
                    'This will purge and retry all poison pill tasks in the Redis dead-letter queue.'
                  )
                }
                className="flex-1 py-1 px-2 rounded-lg text-[10px] font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-900 transition-colors cursor-pointer"
              >
                Flush DLQ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
