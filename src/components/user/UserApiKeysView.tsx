import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Radio,
  Shield,
  Cpu,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  ApiKeyItem,
  WebhookItem,
  GatewayProviderLatency,
  AiProviderId,
} from '../../types';
import { AI_PROVIDER_DEFINITIONS } from '../../constants/aiProviders';
import { apiKeyService } from '../../services/apiKeyService';
import { ApiKeysTable } from './api-keys/ApiKeysTable';
import { CreateKeyModal } from './api-keys/CreateKeyModal';
import { WebhooksTable } from './api-keys/WebhooksTable';
import { CreateWebhookModal } from './api-keys/CreateWebhookModal';
import { WebhookDeliveriesModal } from './api-keys/WebhookDeliveriesModal';

interface UserApiKeysViewProps {
  apiKeys: ApiKeyItem[];
  onAddApiKey: (
    newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'> & { rawSecret?: string }
  ) => void;
  onUpdateApiKey?: (
    id: string,
    updates: Partial<ApiKeyItem> & { rawSecret?: string }
  ) => void;
  onRevokeApiKey: (id: string) => void;
  onDeleteApiKey?: (id: string) => void;
  onProbeApiKey?: (id: string) => Promise<void> | void;
  webhooks: WebhookItem[];
  onAddWebhook: (newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>) => void;
  onDeleteWebhook: (id: string) => void;
  onTestWebhook: (id: string) => void;
}

export const UserApiKeysView: React.FC<UserApiKeysViewProps> = ({
  apiKeys,
  onAddApiKey,
  onUpdateApiKey,
  onRevokeApiKey,
  onDeleteApiKey,
  onProbeApiKey,
  webhooks,
  onAddWebhook,
  onDeleteWebhook,
  onTestWebhook,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'providers' | 'webhooks'>('keys');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);
  const [modalDefaultProvider, setModalDefaultProvider] = useState<AiProviderId | string>('supremeai');
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);

  const [gatewayLatencies, setGatewayLatencies] = useState<
    Record<string, GatewayProviderLatency>
  >({});
  const [latencyFetchedAt, setLatencyFetchedAt] = useState<string>('');
  const [isRefreshingGateway, setIsRefreshingGateway] = useState(false);
  const [probingKeyId, setProbingKeyId] = useState<string | null>(null);
  const [confirmDeleteKeyId, setConfirmDeleteKeyId] = useState<string | null>(null);

  const loadLatencies = useCallback(async () => {
    setIsRefreshingGateway(true);
    try {
      const res = await apiKeyService.fetchGatewayProviderLatencies();
      setGatewayLatencies(res.providers || {});
      setLatencyFetchedAt(res.fetchedAt || new Date().toISOString());
    } catch {
      // Handled inside ApiKeysTable if gateway is temporarily offline
    } finally {
      setIsRefreshingGateway(false);
    }
  }, []);

  useEffect(() => {
    loadLatencies();
  }, [loadLatencies]);

  const activeKeysCount = apiKeys.filter((k) => k.status === 'active').length;
  const activeWebhooksCount = webhooks.filter((w) => w.active).length;

  const openCreateModal = (providerId: AiProviderId | string = 'supremeai') => {
    setEditingKey(null);
    setModalDefaultProvider(providerId);
    setIsKeyModalOpen(true);
  };

  const openEditModal = (key: ApiKeyItem) => {
    setEditingKey(key);
    setModalDefaultProvider(key.provider || 'supremeai');
    setIsKeyModalOpen(true);
  };

  const handleProbeSingleKey = async (id: string) => {
    if (!onProbeApiKey) return;
    setProbingKeyId(id);
    try {
      await onProbeApiKey(id);
      await loadLatencies();
    } finally {
      setProbingKeyId(null);
    }
  };

  const renderProviderHealth = (status?: string) => {
    if (status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );
    }
    if (status === 'unhealthy') {
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6 workspace-container">
      {/* View Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>MULTI-PROVIDER KEYS · LLM GATEWAY TELEMETRY</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            API Keys & AI Providers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage credentials across AI providers, monitor LLM Gateway response latency, and configure webhooks.
          </p>
        </div>

        {/* Sub-tab segmented control */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start lg:self-auto font-mono text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveSubTab('keys')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'keys'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-cyan-500" />
            <span>API Keys</span>
            <span className="text-[11px] tabular-nums text-slate-400">{activeKeysCount}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('providers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'providers'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-purple-500" />
            <span>AI Providers & Health</span>
            <span className="text-[11px] tabular-nums text-slate-400">
              {AI_PROVIDER_DEFINITIONS.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('webhooks')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeSubTab === 'webhooks'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-500" />
            <span>Webhooks</span>
            <span className="text-[11px] tabular-nums text-slate-400">
              {activeWebhooksCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      {activeSubTab === 'keys' && (
        <ApiKeysTable
          apiKeys={apiKeys}
          onRevokeApiKey={onRevokeApiKey}
          onEditApiKey={openEditModal}
          onDeleteApiKey={onDeleteApiKey}
          onProbeApiKey={onProbeApiKey}
          onOpenCreateModal={() => openCreateModal('supremeai')}
          gatewayLatencies={gatewayLatencies}
          onLatenciesLoaded={(map, ts) => {
            setGatewayLatencies(map);
            setLatencyFetchedAt(ts);
          }}
        />
      )}

      {activeSubTab === 'providers' && (
        <div className="space-y-5">
          {/* Provider Health Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Configured AI Provider Directory & Health Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live health status and average LLM Gateway response latency for each AI provider. Add, edit, or remove bound keys directly.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={loadLatencies}
                disabled={isRefreshingGateway}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isRefreshingGateway ? 'animate-spin text-cyan-500' : ''}`}
                />
                <span>Refresh Gateway</span>
              </button>
              <button
                type="button"
                onClick={() => openCreateModal('google_ai_studio')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Provider Key</span>
              </button>
            </div>
          </div>

          {/* Multi-Provider List Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">AI Provider</th>
                    <th className="py-3 px-4">Gateway Health</th>
                    <th className="py-3 px-4">Avg Latency (LLM Gateway)</th>
                    <th className="py-3 px-4">Success Rate</th>
                    <th className="py-3 px-4">Configured Keys</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                  {AI_PROVIDER_DEFINITIONS.map((prov) => {
                    const metric = gatewayLatencies[prov.id];
                    const boundKeys = apiKeys.filter(
                      (k) => (k.provider || 'supremeai') === prov.id
                    );
                    const primaryKey = boundKeys.find((k) => k.status === 'active') || boundKeys[0];

                    return (
                      <tr
                        key={prov.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {prov.label}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {prov.id} · {prov.keyHint}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {renderProviderHealth(metric?.status || 'healthy')}
                        </td>

                        <td className="py-3.5 px-4 font-mono tabular-nums">
                          {metric ? (
                            <div>
                              <span
                                className={`font-semibold ${
                                  metric.avgLatencyMs <= 60
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : metric.avgLatencyMs <= 200
                                    ? 'text-slate-900 dark:text-slate-100'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {metric.avgLatencyMs} ms
                              </span>
                              <span className="text-[11px] text-slate-400 ml-2">
                                (p95 {metric.p95LatencyMs} ms)
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                          {metric ? `${metric.successRate}%` : '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {boundKeys.length === 0 ? (
                            <span className="text-[11px] text-slate-400 font-mono">
                              No user key bound
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {boundKeys.map((bk) => (
                                <div
                                  key={bk.id}
                                  className="flex items-center gap-2 text-[11px] font-mono"
                                >
                                  <span className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-[180px]">
                                    {bk.name}
                                  </span>
                                  <span className="text-slate-400">({bk.secretMasked})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openCreateModal(prov.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </button>

                            {primaryKey && (
                              <>
                                {onProbeApiKey && primaryKey.status === 'active' && (
                                  <button
                                    type="button"
                                    onClick={() => handleProbeSingleKey(primaryKey.id)}
                                    disabled={probingKeyId === primaryKey.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] cursor-pointer disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      className={`w-3 h-3 ${
                                        probingKeyId === primaryKey.id
                                          ? 'animate-spin text-cyan-500'
                                          : ''
                                      }`}
                                    />
                                    <span>Probe</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openEditModal(primaryKey)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>

                                {onDeleteApiKey && (
                                  confirmDeleteKeyId === primaryKey.id ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onDeleteApiKey(primaryKey.id);
                                        setConfirmDeleteKeyId(null);
                                      }}
                                      className="px-2 py-1 rounded-md bg-rose-600 text-white text-[11px] font-medium cursor-pointer"
                                    >
                                      Confirm Remove
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteKeyId(primaryKey.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Remove</span>
                                    </button>
                                  )
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {latencyFetchedAt && (
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>LLM Gateway Average Response Latency Mesh</span>
                <span className="tabular-nums">
                  Synced {new Date(latencyFetchedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'webhooks' && (
        <WebhooksTable
          webhooks={webhooks}
          onDeleteWebhook={onDeleteWebhook}
          onTestWebhook={onTestWebhook}
          onOpenCreateModal={() => setIsWebhookModalOpen(true)}
          onOpenDeliveriesModal={() => setIsDeliveriesModalOpen(true)}
        />
      )}

      {/* Modals */}
      <CreateKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setIsKeyModalOpen(false);
          setEditingKey(null);
        }}
        onAddApiKey={onAddApiKey}
        onUpdateApiKey={onUpdateApiKey}
        editingKey={editingKey}
        defaultProvider={modalDefaultProvider}
      />

      <CreateWebhookModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        onAddWebhook={onAddWebhook}
      />

      <WebhookDeliveriesModal
        isOpen={isDeliveriesModalOpen}
        onClose={() => setIsDeliveriesModalOpen(false)}
      />
    </div>
  );
};
