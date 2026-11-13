import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
} from 'lucide-react';
import { ProviderKeyItem } from '../../types';
import { INITIAL_PROVIDER_KEYS } from '../../data/adminExpansionData';
import { adminService } from '../../services/adminService';
import { useAdminStore } from '../../stores/useAdminStore';

export const AdminProviderKeysView: React.FC = () => {
  const [providers, setProviders] = useState<ProviderKeyItem[]>(INITIAL_PROVIDER_KEYS);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const fetchAuditRecords = useAdminStore((s) => s.fetchAuditRecords);

  useEffect(() => {
    adminService
      .fetchProviders()
      .then((list) => {
        if (list && list.length > 0) setProviders(list);
      })
      .catch(() => {});
  }, []);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await adminService.probeProvider(id);
      if (res.providers && res.providers.length > 0) {
        setProviders(res.providers);
      }
      setTestResult({
        id,
        success: res.success,
        message: res.message,
      });
      fetchAuditRecords();
    } catch (err: unknown) {
      setTestResult({
        id,
        success: false,
        message: err instanceof Error ? err.message : 'Upstream provider probe failed.',
      });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const handlePriorityChange = async (id: string, direction: 'up' | 'down') => {
    try {
      const updated = await adminService.updateProviderPriority(id, direction);
      if (updated && updated.length > 0) {
        setProviders(updated);
        fetchAuditRecords();
      }
    } catch {}
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-purple-500 mb-1">
            Server Environment Ingress · Failover Chain
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upstream LLM Provider Health & Failover
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Inspect server-configured provider status, run live connectivity probes, and adjust failover routing priority.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-500">
          <ShieldCheck className="w-4 h-4" />
          <span>Multi-Region Failover Armed</span>
        </div>
      </div>

      {testResult && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Provider Mesh List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {providers.map((p, idx) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-cyan-500">
                    #{p.priority}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {p.displayName}
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  ID: {p.id} · Rate Cap: {p.rateLimitTpm}
                </div>
              </div>

              <span
                className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${
                  p.status === 'healthy'
                    ? 'text-emerald-500'
                    : p.status === 'degraded'
                    ? 'text-rose-500'
                    : 'text-amber-500'
                }`}
              >
                {p.status}
              </span>
            </div>

            {/* Server Environment Binding Status (No raw API key inputs) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Server Environment Binding</span>
                <span className="font-mono text-[10px] text-slate-500">Managed by Host Env</span>
              </div>
              <div className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all">
                {p.maskedKey}
              </div>
            </div>

            {/* Health & Telemetry Strip + Priority Reordering */}
            <div className="flex items-center justify-between text-xs pt-1 gap-2">
              <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 text-[11px] font-mono tabular-nums min-w-0 truncate">
                <span className="flex items-center gap-1 shrink-0">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {p.latencyMs}ms
                </span>
                <span>·</span>
                <span className="truncate">{p.lastChecked}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handlePriorityChange(p.id, 'up')}
                  title="Increase failover priority"
                  aria-label="Move priority up"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={idx === providers.length - 1}
                  onClick={() => handlePriorityChange(p.id, 'down')}
                  title="Decrease failover priority"
                  aria-label="Move priority down"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={testingId === p.id}
                  onClick={() => handleTestConnection(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{testingId === p.id ? 'Probing...' : 'Test Probe'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
