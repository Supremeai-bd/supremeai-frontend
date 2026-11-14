import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  HardDrive,
  Pause,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';
import type { McpServiceHealthMetric } from '../../types/controlCenter';

export const ControlCenterHealthMonitorView: React.FC = () => {
  const {
    healthSnapshot,
    isLoadingHealth,
    isProbingHealth,
    isDiagnosing,
    loadServiceHealth,
    runServiceHealthProbe,
    saveHealthThresholds,
    applyHealthStreamSnapshot,
    runDeepDiagnose,
  } = useControlCenterStore();
  const authUser = useAuthStore((s) => s.authUser);

  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alerts' | 'healthy'>('all');
  const [selectedService, setSelectedService] = useState<McpServiceHealthMetric | null>(null);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const [cpuWarn, setCpuWarn] = useState(70);
  const [memWarn, setMemWarn] = useState(80);
  const [latencyWarn, setLatencyWarn] = useState(1500);
  const [latencyCrit, setLatencyCrit] = useState(2800);

  // Initial load
  useEffect(() => {
    loadServiceHealth(false);
  }, [loadServiceHealth]);

  // Sync local threshold inputs with server thresholds
  useEffect(() => {
    if (!healthSnapshot?.thresholds) return;
    setCpuWarn(healthSnapshot.thresholds.cpuWarnPct);
    setMemWarn(healthSnapshot.thresholds.memWarnPct);
    setLatencyWarn(healthSnapshot.thresholds.latencyWarnMs);
    setLatencyCrit(healthSnapshot.thresholds.latencyCritMs);
  }, [healthSnapshot?.thresholds]);

  // Live SSE real-time stream
  useEffect(() => {
    if (!streamingEnabled) {
      setStreamConnected(false);
      return;
    }

    const es = new EventSource('/api/admin/control-plane/service-health/stream');
    es.onopen = () => setStreamConnected(true);
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.snapshot) {
          applyHealthStreamSnapshot(payload.snapshot, payload.traffic);
          setStreamConnected(true);
        }
      } catch {
        // ignore malformed frames
      }
    };
    es.onerror = () => {
      setStreamConnected(false);
    };

    return () => {
      es.close();
      setStreamConnected(false);
    };
  }, [streamingEnabled, applyHealthStreamSnapshot]);

  // Sync inspected service row whenever snapshot updates
  const activeSelectedService = useMemo(() => {
    if (!selectedService || !healthSnapshot) return selectedService;
    return healthSnapshot.services.find((s) => s.id === selectedService.id) || selectedService;
  }, [selectedService, healthSnapshot]);

  const filteredServices = useMemo(() => {
    const list = healthSnapshot?.services || [];
    return list.filter((svc) => {
      const matchesSearch =
        !searchTerm.trim() ||
        svc.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        svc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        svc.provider.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'alerts'
          ? svc.status !== 'healthy'
          : svc.status === 'healthy';

      return matchesSearch && matchesStatus;
    });
  }, [healthSnapshot?.services, searchTerm, statusFilter]);

  const renderStatusBadge = (status: McpServiceHealthMetric['status']) => {
    if (status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>Healthy</span>
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Degraded</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status === 'critical' ? 'Critical' : 'Unreachable'}</span>
      </span>
    );
  };

  const host = healthSnapshot?.host;
  const summary = healthSnapshot?.summary;
  const alerts = healthSnapshot?.alerts || [];

  return (
    <div className="flex-1 overflow-y-auto px-6 py-7 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            MCP Resource & Latency Health Monitor
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time CPU, memory, and HTTP round-trip latency across all services registered in MCP Tower and local Studio runtime.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setStreamingEnabled((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
              streamingEnabled
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
            }`}
          >
            {streamingEnabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{streamingEnabled ? (streamConnected ? 'Live Stream Active' : 'Connecting Stream...') : 'Resume Stream'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowThresholdConfig((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Alert Thresholds</span>
          </button>

          <button
            type="button"
            onClick={() => runServiceHealthProbe(authUser?.email)}
            disabled={isProbingHealth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg theme-btn-primary text-xs font-semibold cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isProbingHealth ? 'animate-spin' : ''}`} />
            <span>{isProbingHealth ? 'Probing Live...' : 'Run Live Probe'}</span>
          </button>
        </div>
      </div>

      {/* Provenance & Safety Posture Bar */}
      <ControlCenterSafetyBar
        provenance={healthSnapshot?.provenance || 'local-snapshot'}
        subtitle={
          healthSnapshot
            ? `MCP Tower: ${healthSnapshot.mcpTowerStatus} · ${healthSnapshot.sweepCompletions ?? 0} background sweeps · Last sample ${new Date(healthSnapshot.collectedAt).toLocaleTimeString()}`
            : 'Initializing live probe collector...'
        }
      />

      {/* Configurable Proactive Thresholds Drawer */}
      {showThresholdConfig && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Proactive Alert Thresholds
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Services breaching these measured boundaries immediately surface in the Proactive Alerts feed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowThresholdConfig(false)}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              aria-label="Close threshold configuration"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="block space-y-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">CPU Warning (%)</span>
              <input
                type="number"
                min={10}
                max={99}
                value={cpuWarn}
                onChange={(e) => setCpuWarn(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Memory Warning (%)</span>
              <input
                type="number"
                min={10}
                max={99}
                value={memWarn}
                onChange={(e) => setMemWarn(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Latency Warning (ms)</span>
              <input
                type="number"
                min={50}
                max={10000}
                step={50}
                value={latencyWarn}
                onChange={(e) => setLatencyWarn(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Latency Critical (ms)</span>
              <input
                type="number"
                min={100}
                max={15000}
                step={100}
                value={latencyCrit}
                onChange={(e) => setLatencyCrit(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-white"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                saveHealthThresholds(
                  {
                    cpuWarnPct: cpuWarn,
                    cpuCritPct: Math.min(100, cpuWarn + 18),
                    memWarnPct: memWarn,
                    memCritPct: Math.min(100, memWarn + 10),
                    latencyWarnMs: latencyWarn,
                    latencyCritMs: latencyCrit,
                  },
                  authUser?.email
                );
                setShowThresholdConfig(false);
              }}
              className="px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold cursor-pointer"
            >
              Apply Thresholds
            </button>
          </div>
        </div>
      )}

      {/* Initial Loading Skeleton */}
      {isLoadingHealth && !healthSnapshot ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse p-5"
            />
          ))}
        </div>
      ) : (
        <>
          {/* Top 4 Single-Elevation KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Runtime Host CPU</span>
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {host ? `${host.cpuPercent}%` : '—'}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {host ? `${host.cpuCores} vCPU · 1m load ${host.loadAvg1m}` : 'Measuring CPU load...'}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Host & Process Memory</span>
                <HardDrive className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {host ? `${host.processRssMb} MB` : '—'}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {host
                  ? `Host RAM ${host.systemMemUsedPct}% (${host.totalMemMb - host.freeMemMb}/${host.totalMemMb} MB)`
                  : 'Sampling process RSS...'}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>MCP Cluster Latency</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {summary ? `${summary.avgLatencyMs} ms` : '—'}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {summary ? `P95: ${summary.p95LatencyMs} ms across ${summary.total} services` : 'Collecting probes...'}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Proactive Health Posture</span>
                <ShieldAlert className={`w-4 h-4 ${alerts.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
              </div>
              <div
                className={`text-2xl font-bold font-mono tabular-nums ${
                  (summary?.critical || 0) + (summary?.unreachable || 0) > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : alerts.length > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {summary ? `${summary.healthy} / ${summary.total} Healthy` : '—'}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {alerts.length > 0
                  ? `${alerts.length} active threshold alert${alerts.length > 1 ? 's' : ''}`
                  : '0 threshold breaches detected'}
              </div>
            </div>
          </div>

          {/* Proactive System Health Alerts */}
          {alerts.length > 0 && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Proactive Anomaly & Threshold Alerts ({alerts.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => runDeepDiagnose('mcp-control-plane', 'is_healthy', authUser?.email)}
                  disabled={isDiagnosing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                  <span>Run 5-Layer Deep Diagnose</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {alerts.map((al) => (
                  <div
                    key={al.id}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-semibold uppercase ${
                            al.severity === 'critical'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {al.severity}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {al.displayName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {al.valueLabel} (limit {al.thresholdLabel})
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 truncate">{al.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const match = healthSnapshot?.services.find((s) => s.id === al.serviceId);
                        if (match) setSelectedService(match);
                      }}
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer shrink-0 text-left"
                    >
                      Inspect Evidence
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Real-Time Time-Series Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Cluster Average Latency Trend (ms)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Real measured RTT samples collected across MCP Tower & gateway probes
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {healthSnapshot?.hostHistory.length || 0} samples
                </span>
              </div>

              <div className="h-56 w-full">
                {(healthSnapshot?.hostHistory.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={healthSnapshot?.hostHistory || []}>
                      <defs>
                        <linearGradient id="mcpLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop stopColor="#2563eb" stopOpacity={0.25} />
                          <stop stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="ts" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="ms" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#f8fafc',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="avgLatencyMs"
                        stroke="#2563eb"
                        strokeWidth={2}
                        fill="url(#mcpLatencyGrad)"
                        name="Mean Latency (ms)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Waiting for first live probe sample...
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Host Runtime CPU & Memory Utilization (%)
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Live OS load average, process CPU ticks, and RAM pressure
                  </p>
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {host?.hostname || 'localhost'}
                </span>
              </div>

              <div className="h-56 w-full">
                {(healthSnapshot?.hostHistory.length || 0) > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthSnapshot?.hostHistory || []}>
                      <XAxis dataKey="ts" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontSize: '12px',
                          color: '#f8fafc',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cpuPercent"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                        name="CPU (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="memoryPercent"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={false}
                        name="Memory (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">
                    Waiting for host runtime samples...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Health Matrix Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  MCP Connected Services ({filteredServices.length})
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter service or provider..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none w-56"
                  />
                </div>

                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-0.5 text-xs">
                  {(['all', 'alerts', 'healthy'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`px-2.5 py-1 rounded-md capitalize cursor-pointer transition-colors ${
                        statusFilter === tab
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500 dark:text-slate-400">
                No MCP Tower services match the current search or status filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
                      <th className="py-3 px-4">Service / Provider</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">CPU %</th>
                      <th className="py-3 px-4 text-right">Memory</th>
                      <th className="py-3 px-4 text-right">Latency</th>
                      <th className="py-3 px-4 text-right">P95</th>
                      <th className="py-3 px-4 text-right">Failures</th>
                      <th className="py-3 px-4 text-right">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredServices.map((svc) => {
                      const isLatWarn =
                        svc.latencyMs !== null &&
                        healthSnapshot &&
                        svc.latencyMs >= healthSnapshot.thresholds.latencyWarnMs;
                      const isLatCrit =
                        svc.latencyMs !== null &&
                        healthSnapshot &&
                        svc.latencyMs >= healthSnapshot.thresholds.latencyCritMs;

                      return (
                        <tr
                          key={svc.id}
                          onClick={() => setSelectedService(svc)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {svc.displayName}
                            </div>
                            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              {svc.name} · {svc.provider}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                            {svc.source}
                          </td>
                          <td className="py-3 px-4">{renderStatusBadge(svc.status)}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {svc.cpuPercent !== null ? `${svc.cpuPercent}%` : '— (remote)'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                            {svc.memoryMb !== null
                              ? `${svc.memoryMb} MB (${svc.memoryPercent ?? 0}%)`
                              : '— (remote)'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono tabular-nums font-semibold ${
                              isLatCrit
                                ? 'text-rose-600 dark:text-rose-400'
                                : isLatWarn
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {svc.latencyMs !== null ? `${svc.latencyMs} ms` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {svc.p95LatencyMs !== null ? `${svc.p95LatencyMs} ms` : '—'}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono tabular-nums ${
                              svc.consecutiveFailures > 0
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            {svc.consecutiveFailures}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(svc.checkedAt).toLocaleTimeString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected Service Evidence & History Inspector */}
          {activeSelectedService && (
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {activeSelectedService.displayName}
                    </h3>
                    <span aria-hidden="true">·</span>
                    {renderStatusBadge(activeSelectedService.status)}
                  </div>
                  <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                    {activeSelectedService.id} · Raw state: {activeSelectedService.rawStatus || 'unknown'} · Source:{' '}
                    {activeSelectedService.source}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  aria-label="Close service inspector"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {activeSelectedService.errorMessage && (
                <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs font-mono text-rose-700 dark:text-rose-300 break-words">
                  {activeSelectedService.errorMessage}
                </div>
              )}

              {activeSelectedService.evidenceSummary && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Evidence: <span className="font-mono">{activeSelectedService.evidenceSummary}</span>
                </p>
              )}

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activeSelectedService.history}>
                    <XAxis dataKey="ts" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="ms" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '0.5rem',
                        fontSize: '12px',
                        color: '#f8fafc',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="latencyMs"
                      stroke="#2563eb"
                      strokeWidth={2}
                      name="Latency (ms)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
