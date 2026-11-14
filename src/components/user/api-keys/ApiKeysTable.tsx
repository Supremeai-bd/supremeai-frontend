import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Copy,
  Check,
  Trash2,
  Pencil,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Ban,
  Gauge,
  Plus,
} from 'lucide-react';
import { ApiKeyItem, GatewayProviderLatency } from '../../../types';
import { apiKeyService } from '../../../services/apiKeyService';
import { getProviderShortLabel } from '../../../constants/aiProviders';

interface ApiKeysTableProps {
  apiKeys: ApiKeyItem[];
  onRevokeApiKey: (id: string) => void;
  onEditApiKey?: (key: ApiKeyItem) => void;
  onDeleteApiKey?: (id: string) => void;
  onProbeApiKey?: (id: string) => Promise<void> | void;
  onOpenCreateModal: () => void;
  gatewayLatencies?: Record<string, GatewayProviderLatency>;
  onLatenciesLoaded?: (
    latencies: Record<string, GatewayProviderLatency>,
    fetchedAt: string
  ) => void;
}

export const ApiKeysTable: React.FC<ApiKeysTableProps> = ({
  apiKeys,
  onRevokeApiKey,
  onEditApiKey,
  onDeleteApiKey,
  onProbeApiKey,
  onOpenCreateModal,
  gatewayLatencies: externalLatencies,
  onLatenciesLoaded,
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [probingKeyId, setProbingKeyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [internalLatencies, setInternalLatencies] = useState<
    Record<string, GatewayProviderLatency>
  >({});
  const [isLoadingLatency, setIsLoadingLatency] = useState<boolean>(false);
  const [latencyError, setLatencyError] = useState<string | null>(null);
  const [latencyFetchedAt, setLatencyFetchedAt] = useState<string | null>(null);

  const latencies = externalLatencies && Object.keys(externalLatencies).length > 0
    ? externalLatencies
    : internalLatencies;

  const loadGatewayLatencies = useCallback(async () => {
    setIsLoadingLatency(true);
    setLatencyError(null);
    try {
      const res = await apiKeyService.fetchGatewayProviderLatencies();
      setInternalLatencies(res.providers || {});
      setLatencyFetchedAt(res.fetchedAt || new Date().toISOString());
      onLatenciesLoaded?.(res.providers || {}, res.fetchedAt || new Date().toISOString());
    } catch (err) {
      setLatencyError(
        err instanceof Error ? err.message : 'Unable to fetch LLM Gateway latency'
      );
    } finally {
      setIsLoadingLatency(false);
    }
  }, [onLatenciesLoaded]);

  useEffect(() => {
    loadGatewayLatencies();
  }, [loadGatewayLatencies]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleProbe = async (id: string) => {
    if (!onProbeApiKey) return;
    setProbingKeyId(id);
    try {
      await onProbeApiKey(id);
      await loadGatewayLatencies();
    } finally {
      setProbingKeyId(null);
    }
  };

  const renderHealthStatus = (key: ApiKeyItem) => {
    if (key.status === 'revoked') {
      return (
        <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Ban className="w-3.5 h-3.5" />
          <span>Revoked</span>
        </span>
      );
    }
    const h = key.healthStatus || 'healthy';
    if (h === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (h === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );
    }
    if (h === 'unhealthy') {
      return (
        <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
          <XCircle className="w-3.5 h-3.5" />
          <span>Unhealthy</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Untested</span>
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-500" />
            Active Multi-Provider API Credentials
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add, edit, probe, or remove provider keys. Average response latency is streamed live from the LLM Gateway.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={loadGatewayLatencies}
            disabled={isLoadingLatency}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLatency ? 'animate-spin text-cyan-500' : ''}`} />
            <span>{isLoadingLatency ? 'Syncing Gateway...' : 'Refresh Latency'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add API Key</span>
          </button>
        </div>
      </div>

      {latencyError && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
          <span>LLM Gateway latency telemetry warning: {latencyError}</span>
          <button
            type="button"
            onClick={loadGatewayLatencies}
            className="font-mono underline cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Keys Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Token Secret Mask</th>
                <th className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Avg Latency (LLM Gateway)</span>
                  </span>
                </th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
              {apiKeys.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs">
                    No API keys configured. Click &ldquo;Add API Key&rdquo; to register a provider credential.
                  </td>
                </tr>
              ) : (
                apiKeys.map((key) => {
                  const isRevoked = key.status === 'revoked';
                  const providerId = key.provider || 'supremeai';
                  const gatewayMetric = latencies[providerId];
                  const avgMs = gatewayMetric?.avgLatencyMs;

                  const latencyColor =
                    avgMs === undefined
                      ? 'text-slate-400'
                      : avgMs <= 60
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : avgMs <= 200
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-amber-600 dark:text-amber-400';

                  return (
                    <tr
                      key={key.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isRevoked ? 'opacity-65 bg-slate-50/40 dark:bg-slate-950/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {key.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          Created {key.createdAt} · Last used {key.lastUsed}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          {getProviderShortLabel(providerId)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                        <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-[11px]">
                          <span>{key.secretMasked}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(key.secretMasked, key.id)}
                            className="text-slate-400 hover:text-cyan-500 transition-colors cursor-pointer"
                            title="Copy masked token"
                            aria-label="Copy masked token"
                          >
                            {copiedKeyId === key.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isLoadingLatency && !gatewayMetric ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            Querying gateway...
                          </span>
                        ) : gatewayMetric ? (
                          <div className="font-mono tabular-nums">
                            <div className={`text-xs font-semibold ${latencyColor}`}>
                              {gatewayMetric.avgLatencyMs} ms
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              p95 {gatewayMetric.p95LatencyMs} ms · {gatewayMetric.successRate}% ok
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-400">
                            Unavailable
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>{renderHealthStatus(key)}</div>
                        {key.lastChecked && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {key.lastChecked}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {key.rateLimitRpm} req/min
                      </td>

                      <td className="py-3.5 px-4">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Revoked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          {!isRevoked && onProbeApiKey && (
                            <button
                              type="button"
                              onClick={() => handleProbe(key.id)}
                              disabled={probingKeyId === key.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                              title="Probe provider health"
                            >
                              <RefreshCw
                                className={`w-3 h-3 ${
                                  probingKeyId === key.id ? 'animate-spin text-cyan-500' : ''
                                }`}
                              />
                              <span>Probe</span>
                            </button>
                          )}

                          {onEditApiKey && (
                            <button
                              type="button"
                              onClick={() => onEditApiKey(key)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Edit API key"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}

                          {!isRevoked && (
                            <button
                              type="button"
                              onClick={() => onRevokeApiKey(key.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-[11px] font-medium transition-colors cursor-pointer"
                              title="Revoke API key"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Revoke</span>
                            </button>
                          )}

                          {onDeleteApiKey && (
                            confirmDeleteId === key.id ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onDeleteApiKey(key.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 rounded-md bg-rose-600 text-white text-[11px] font-medium hover:bg-rose-500 cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-1.5 py-1 rounded-md text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 text-[11px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(key.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-medium transition-colors cursor-pointer"
                                title="Remove API key"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {latencyFetchedAt && (
          <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Source: LLM Gateway Telemetry (/api/llm-gateway/latency)</span>
            <span className="tabular-nums">Updated {new Date(latencyFetchedAt).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};
