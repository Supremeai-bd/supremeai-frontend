import React, { useState, useMemo } from 'react';
import {
  Server,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Terminal,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  ArrowUpDown,
  Radio,
} from 'lucide-react';
import { McpTowerService, McpServiceLog } from '../../types';

interface AdminMcpTowerViewProps {
  services: McpTowerService[];
  onRebootService: (serviceId: string) => Promise<void> | void;
  onRebootAll: () => Promise<void> | void;
  onProbeCluster: () => Promise<void> | void;
  isProbing?: boolean;
}

export const AdminMcpTowerView: React.FC<AdminMcpTowerViewProps> = ({
  services,
  onRebootService,
  onRebootAll,
  onProbeCluster,
  isProbing = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'ai' | 'integration' | 'telemetry'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues' | 'healthy'>('all');
  
  // Selected Service for Error Log Modal
  const [selectedServiceForLogs, setSelectedServiceForLogs] = useState<McpTowerService | null>(null);
  const [logLevelFilter, setLogLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  // Sync selected service if services array updates
  const activeSelectedService = useMemo(() => {
    if (!selectedServiceForLogs) return null;
    return services.find((s) => s.id === selectedServiceForLogs.id) || selectedServiceForLogs;
  }, [selectedServiceForLogs, services]);

  // Aggregate Metrics
  const total = services.length;
  const healthyCount = services.filter((s) => s.status === 'healthy').length;
  const degradedCount = services.filter((s) => s.status === 'degraded').length;
  const unhealthyCount = services.filter((s) => s.status === 'unhealthy').length;
  const issuesCount = degradedCount + unhealthyCount;
  const healthScore = total > 0 ? Math.round((healthyCount / total) * 100) : 100;
  
  const avgLatency = total > 0 ? Math.round(services.reduce((acc, s) => acc + s.latencyMs, 0) / total) : 0;
  const totalMemory = services.reduce((acc, s) => acc + s.memoryMb, 0);
  const totalErrors = services.reduce((acc, s) => acc + s.errorCount, 0);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.port).includes(searchTerm) ||
        s.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'issues'
          ? s.status === 'unhealthy' || s.status === 'degraded'
          : s.status === 'healthy';

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [services, searchTerm, categoryFilter, statusFilter]);

  const handleTriggerReboot = async (serviceId: string) => {
    setRebootingId(serviceId);
    try {
      await onRebootService(serviceId);
    } finally {
      setTimeout(() => setRebootingId(null), 800);
    }
  };

  const handleCopyStackTrace = (text: string, logId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLogId(logId);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#131314]">
      {/* Top Banner & Control Header */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1a1a1c] shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-sans">
                    MCP Tower Infrastructure Mesh
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      issuesCount > 0
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    }`}
                  >
                    {issuesCount > 0 ? `${issuesCount} Issue${issuesCount > 1 ? 's' : ''} Detected` : 'All Systems Operational'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time microservice orchestration, port telemetry, AST workers, and daemon reboot controls for{' '}
                  <span className="font-mono text-slate-700 dark:text-slate-300">Supremeai-bd/supremeai</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Cluster Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={onProbeCluster}
              disabled={isProbing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer shadow-xs disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProbing ? 'animate-spin text-blue-500' : ''}`} />
              <span>{isProbing ? 'Probing Mesh...' : 'Probe Cluster Health'}</span>
            </button>

            {issuesCount > 0 && (
              <button
                type="button"
                onClick={onRebootAll}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all cursor-pointer active:scale-98 animate-pulse hover:animate-none"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Reboot All Unhealthy Services ({issuesCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
          {/* Health Score */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Cluster Health</span>
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-slate-900 dark:text-slate-100 tabular-nums">
              {healthScore}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {healthyCount} of {total} operational
            </div>
          </div>

          {/* Healthy */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Healthy</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-emerald-600 dark:text-emerald-400 tabular-nums">
              {healthyCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Standard latency pool</div>
          </div>

          {/* Degraded */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Degraded</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-amber-600 dark:text-amber-400 tabular-nums">
              {degradedCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Pool backpressure</div>
          </div>

          {/* Unhealthy / Down */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Unhealthy / Down</span>
              <XCircle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-rose-600 dark:text-rose-400 tabular-nums">
              {unhealthyCount}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Requires immediate reboot</div>
          </div>

          {/* Avg Latency */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Avg Mesh Latency</span>
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-slate-900 dark:text-slate-100 tabular-nums">
              {avgLatency} <span className="text-xs font-normal text-slate-500">ms</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inter-service ping</div>
          </div>

          {/* Memory Consumption */}
          <div className="p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] font-medium">
              <span>Cluster Memory</span>
              <HardDrive className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono tracking-tight mt-1 text-slate-900 dark:text-slate-100 tabular-nums">
              {(totalMemory / 1024).toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">GB</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{totalErrors} alert traces</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search service, port (:9001), endpoint..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All ({services.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('issues')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                statusFilter === 'issues'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-700'
              }`}
            >
              <span>Issues</span>
              {issuesCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-white text-rose-600 text-[10px] font-bold flex items-center justify-center">
                  {issuesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('healthy')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                statusFilter === 'healthy'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Healthy ({healthyCount})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs text-slate-600 dark:text-slate-400">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Category:
          </span>
          {(['all', 'core', 'ai', 'integration', 'telemetry'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors capitalize ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat === 'ai' ? 'AI / MCP' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table Matrix */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-[#1a1a1c] overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Service & Port</th>
                <th className="py-3 px-4">Status & Health</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">CPU & Memory</th>
                <th className="py-3 px-4">Uptime</th>
                <th className="py-3 px-4">Last Check</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredServices.map((service) => {
                const isRebooting = service.status === 'rebooting' || rebootingId === service.id;
                const isUnhealthy = service.status === 'unhealthy';
                const isDegraded = service.status === 'degraded';

                return (
                  <tr
                    key={service.id}
                    className={`transition-colors hover:bg-slate-50/90 dark:hover:bg-slate-800/40 ${
                      isUnhealthy
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : isDegraded
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : ''
                    }`}
                  >
                    {/* Service Name & Category */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            isUnhealthy
                              ? 'bg-rose-500 animate-ping'
                              : isDegraded
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{service.displayName}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              :{service.port}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{service.name}</span>
                            <span>·</span>
                            <span className="uppercase text-[10px] font-sans text-slate-400 font-medium">
                              {service.version}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isRebooting ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                          <span>Rebooting...</span>
                        </div>
                      ) : isUnhealthy ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Unhealthy (OOM)</span>
                        </div>
                      ) : isDegraded ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span>Degraded</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Healthy</span>
                        </div>
                      )}
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold tabular-nums ${
                            service.latencyMs > 1000
                              ? 'text-rose-600 dark:text-rose-400'
                              : service.latencyMs > 150
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {service.latencyMs} ms
                        </span>
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              service.latencyMs > 1000
                                ? 'bg-rose-500'
                                : service.latencyMs > 150
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(10, service.latencyMs / 40))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* CPU & Memory */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 w-7">CPU</span>
                          <span
                            className={`font-mono font-medium tabular-nums ${
                              service.cpuPercent > 80
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {service.cpuPercent}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 w-7">RAM</span>
                          <span
                            className={`font-mono font-medium tabular-nums ${
                              service.memoryMb > 1500
                                ? 'text-rose-600 dark:text-rose-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {service.memoryMb} MB
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Uptime */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300">
                      {service.uptime}
                    </td>

                    {/* Last Check */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {service.lastChecked}
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Error Logs Button */}
                        <button
                          type="button"
                          onClick={() => setSelectedServiceForLogs(service)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            service.errorCount > 0
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                          }`}
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Logs</span>
                          {service.errorCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                              {service.errorCount}
                            </span>
                          )}
                        </button>

                        {/* Reboot Service Button */}
                        <button
                          type="button"
                          onClick={() => handleTriggerReboot(service.id)}
                          disabled={isRebooting}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-60 ${
                            isUnhealthy
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : isDegraded
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin' : ''}`} />
                          <span>{isRebooting ? 'Rebooting...' : 'Reboot'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredServices.length === 0 && (
            <div className="py-12 text-center text-slate-500">
              <Server className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
              <p className="text-sm font-medium">No microservices found matching your filter</p>
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-2 text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Log & Diagnostic Drawer / Modal */}
      {activeSelectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white ${
                    activeSelectedService.status === 'unhealthy'
                      ? 'bg-rose-600'
                      : activeSelectedService.status === 'degraded'
                      ? 'bg-amber-600'
                      : 'bg-blue-600'
                  }`}
                >
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {activeSelectedService.displayName}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      port :{activeSelectedService.port}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {activeSelectedService.name} · Endpoint: {activeSelectedService.endpoint}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedServiceForLogs(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subheader & Actions */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
              {/* Log Level Filters */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
                {(['ALL', 'ERROR', 'WARN', 'INFO'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLogLevelFilter(lvl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                      logLevelFilter === lvl
                        ? lvl === 'ERROR'
                          ? 'bg-rose-600 text-white'
                          : lvl === 'WARN'
                          ? 'bg-amber-600 text-white'
                          : lvl === 'INFO'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Reboot directly from Modal */}
              <button
                type="button"
                onClick={() => handleTriggerReboot(activeSelectedService.id)}
                disabled={activeSelectedService.status === 'rebooting' || rebootingId === activeSelectedService.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    activeSelectedService.status === 'rebooting' || rebootingId === activeSelectedService.id
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                <span>
                  {activeSelectedService.status === 'rebooting' || rebootingId === activeSelectedService.id
                    ? 'Rebooting Daemon...'
                    : 'Reboot & Clear Errors'}
                </span>
              </button>
            </div>

            {/* Log List View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs bg-slate-950 text-slate-200">
              {activeSelectedService.logs
                .filter((log) => logLevelFilter === 'ALL' || log.level === logLevelFilter)
                .map((log) => {
                  const isError = log.level === 'ERROR';
                  const isWarn = log.level === 'WARN';

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-lg border transition-colors ${
                        isError
                          ? 'bg-rose-950/40 border-rose-900/60 text-rose-200'
                          : isWarn
                          ? 'bg-amber-950/40 border-amber-900/60 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                              isError
                                ? 'bg-rose-600 text-white'
                                : isWarn
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {log.level}
                          </span>
                          <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                        </div>

                        {log.stackTrace && (
                          <button
                            type="button"
                            onClick={() => handleCopyStackTrace(log.stackTrace!, log.id)}
                            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800"
                          >
                            {copiedLogId === log.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Trace</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="font-medium text-[12px]">{log.message}</div>

                      {log.details && (
                        <div className="mt-1 text-slate-400 text-[11px]">{log.details}</div>
                      )}

                      {log.stackTrace && (
                        <div className="mt-3 p-3 rounded bg-black/70 border border-rose-900/50 text-[11px] text-rose-300/90 overflow-x-auto whitespace-pre">
                          {log.stackTrace}
                        </div>
                      )}
                    </div>
                  );
                })}

              {activeSelectedService.logs.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                  <p>No log events recorded for this service.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div>
                Daemon PID: <span className="font-mono text-slate-700 dark:text-slate-300">#49120</span> ·
                Container: <span className="font-mono text-slate-700 dark:text-slate-300">mcp-tower-worker-01</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServiceForLogs(null)}
                className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
