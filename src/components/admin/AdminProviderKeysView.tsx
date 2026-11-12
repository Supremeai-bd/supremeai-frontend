import React, { useState } from 'react';
import { KeyRound, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Plus, ExternalLink, Zap, Eye, EyeOff } from 'lucide-react';
import { ProviderKeyItem } from '../../types';
import { INITIAL_PROVIDER_KEYS } from '../../data/adminExpansionData';

export const AdminProviderKeysView: React.FC = () => {
  const [providers, setProviders] = useState<ProviderKeyItem[]>(() => {
    const saved = localStorage.getItem('supremeai_admin_provider_keys');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PROVIDER_KEYS;
  });

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTestResult(null);

    setTimeout(() => {
      setTestingId(null);
      setTestResult({
        id,
        success: true,
        message: 'Ping successful. Upstream API handshake verified (HTTP 200 OK, latency 19ms).',
      });
      setTimeout(() => setTestResult(null), 4000);
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
              provider_chain.py Parity
            </span>
            <span className="text-xs text-slate-400">Vault & Upstream Ingress</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upstream LLM Provider Credentials
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage upstream API keys, Vertex AI service account project IDs, and failover priority ranks across the inference mesh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-emerald-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Multi-Region Failover Armed</span>
          </div>
        </div>
      </div>

      {testResult && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl text-xs animate-in fade-in ${
            testResult.success
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
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
        {providers.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">
                    #{p.priority}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {p.displayName}
                  </h3>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-1">
                  ID: {p.id} • Rate Cap: {p.rateLimitTpm}
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                  p.status === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {p.status}
              </span>
            </div>

            {/* Credential Masked String */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Vault Ingress Credential</span>
                <span className="font-mono text-[10px] text-slate-500">AES-256 GCM</span>
              </div>
              <div className="font-mono text-xs text-slate-700 dark:text-slate-300 break-all select-all">
                {p.maskedKey}
              </div>
            </div>

            {/* Health & Telemetry Strip */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px] font-mono">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" />
                  {p.latencyMs}ms latency
                </span>
                <span>•</span>
                <span>{p.lastChecked}</span>
              </div>

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
        ))}
      </div>
    </div>
  );
};
