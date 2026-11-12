import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Shield,
  Radio,
  Send,
  AlertCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ApiKeyItem, WebhookItem, WebhookDeliveryLog } from '../../types';
import { INITIAL_WEBHOOK_DELIVERIES } from '../../data/customerWorkspaceData';

interface UserApiKeysViewProps {
  apiKeys: ApiKeyItem[];
  onAddApiKey: (newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => void;
  onRevokeApiKey: (id: string) => void;
  webhooks: WebhookItem[];
  onAddWebhook: (newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>) => void;
  onDeleteWebhook: (id: string) => void;
  onTestWebhook: (id: string) => void;
}

export const UserApiKeysView: React.FC<UserApiKeysViewProps> = ({
  apiKeys,
  onAddApiKey,
  onRevokeApiKey,
  webhooks,
  onAddWebhook,
  onDeleteWebhook,
  onTestWebhook,
}) => {
  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'webhooks'>('keys');

  // New API Key Modal State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyRpm, setKeyRpm] = useState(120);
  const [selectedPermissions, setSelectedPermissions] = useState<
    ('chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke')[]
  >(['chat:write', 'models:read']);
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null);

  // New Webhook Modal State
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'chat.completed',
    'agent.finished',
  ]);

  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryLog[]>(INITIAL_WEBHOOK_DELIVERIES);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fullSecret = `sk-supreme-live-${randomSuffix}${Math.random().toString(36).substring(2, 18)}`;
    const prefix = fullSecret.substring(0, 18);
    const masked = `${prefix}••••••••••••••••${fullSecret.slice(-4)}`;

    onAddApiKey({
      name: keyName.trim(),
      keyPrefix: prefix,
      secretMasked: masked,
      rateLimitRpm: keyRpm,
      status: 'active',
      permissions: selectedPermissions,
    });

    setGeneratedKeySecret(fullSecret);
  };

  const handleCreateWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookName.trim() || !webhookUrl.trim()) return;

    const signingSecret = `whsec_${Math.random().toString(36).substring(2, 14)}`;

    onAddWebhook({
      name: webhookName.trim(),
      url: webhookUrl.trim(),
      events: selectedEvents,
      secret: signingSecret,
      active: true,
    });

    setIsWebhookModalOpen(false);
    setWebhookName('');
    setWebhookUrl('');
  };

  const togglePermission = (perm: 'chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke') => {
    if (selectedPermissions.includes(perm)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== perm));
    } else {
      setSelectedPermissions([...selectedPermissions, perm]);
    }
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-5xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              API Keys & Webhooks Hub
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              v1 REST & SSE
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Programmatically integrate SupremeAI intelligence, stream Gemini models into custom pipelines, and subscribe to asynchronous event webhooks.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('keys')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'keys'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
            <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600">
              {apiKeys.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('webhooks')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              activeSubTab === 'webhooks'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Webhooks</span>
            <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-600">
              {webhooks.length}
            </span>
          </button>
        </div>
      </div>

      {/* --- TAB 1: API KEYS --- */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Active Secret Keys</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Never share secret keys in client-side code or public repositories.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setGeneratedKeySecret(null);
                setKeyName('');
                setIsKeyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Key</span>
            </button>
          </div>

          {/* Keys Table */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    <th className="px-4 py-3">Key Name</th>
                    <th className="px-4 py-3">Token Prefix / Secret</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Rate Limit</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {apiKeys.map((key) => {
                    const isRevoked = key.status === 'revoked';
                    return (
                      <tr
                        key={key.id}
                        className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isRevoked ? 'opacity-60 bg-slate-50/30 dark:bg-slate-950/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <Key className={`w-3.5 h-3.5 ${isRevoked ? 'text-slate-400' : 'text-blue-500'}`} />
                            <span className="font-semibold text-slate-900 dark:text-white">{key.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 pl-5.5">Created {key.createdAt}</span>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {key.secretMasked}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {key.permissions.map((perm) => (
                              <span
                                key={perm}
                                className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              >
                                {perm}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {key.rateLimitRpm} RPM
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {key.lastUsed}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {isRevoked ? (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900">
                              Revoked
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(key.keyPrefix, key.id)}
                                title="Copy Prefix"
                                className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                {copiedKeyId === key.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => onRevokeApiKey(key.id)}
                                title="Revoke this key"
                                className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Integration Snippet */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono">
                Curl Quickstart · Calling SupremeAI via REST API
              </span>
              <span className="text-[11px] text-emerald-400 font-mono">POST /api/chat</span>
            </div>
            <pre className="p-3 bg-slate-900/90 rounded-xl overflow-x-auto text-[11px] font-mono text-slate-200 leading-relaxed">
{`curl -X POST https://api.supremeai.bd/api/chat \\
  -H "Authorization: Bearer sk-supreme-live-4a8f..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gemini-3.8-flash",
    "messages": [{"role": "user", "content": "Explain SupremeAI distributed agent architecture."}],
    "stream": true
  }'`}
            </pre>
          </div>
        </div>
      )}

      {/* --- TAB 2: WEBHOOKS --- */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Outbound Webhooks</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive instant HTTP POST alerts when autonomous agents finish PR reviews, token usage thresholds hit limits, or background jobs complete.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDeliveriesModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
              >
                <Radio className="w-4 h-4 text-cyan-500" />
                <span>Delivery Logs & Retries</span>
              </button>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Webhook</span>
              </button>
            </div>
          </div>

          {/* Webhooks List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                      <p className="text-[11px] font-mono text-slate-500 truncate max-w-xs">{wh.url}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Subscribed Events</span>
                  <div className="flex flex-wrap gap-1">
                    {wh.events.map((ev) => (
                      <span
                        key={ev}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Last: {wh.lastTriggered}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onTestWebhook(wh.id)}
                      className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send Ping</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWebhook(wh.id)}
                      className="p-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- CREATE KEY MODAL --- */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
            {!generatedKeySecret ? (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    Create Secret API Key
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Key Identifier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. Next.js Production Backend"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rate Limit (Requests Per Minute)
                  </label>
                  <select
                    value={keyRpm}
                    onChange={(e) => setKeyRpm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={60}>60 RPM (Standard Dev)</option>
                    <option value={120}>120 RPM (Standard Team)</option>
                    <option value={300}>300 RPM (High Throughput)</option>
                    <option value={600}>600 RPM (Enterprise Production)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Granular Scope Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(['chat:write', 'models:read', 'knowledge:read', 'agents:invoke'] as const).map(
                      (perm) => (
                        <label
                          key={perm}
                          className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded text-blue-600 focus:ring-0"
                          />
                          <span className="font-mono text-[11px]">{perm}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold">Copy your Secret Key Now</p>
                    <p className="text-[11px] mt-0.5">
                      For security, we will never display this secret token again. Store it in your secure secret manager or environment file.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs break-all flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                  <span>{generatedKeySecret}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedKeySecret, 'modal-key')}
                    className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                  >
                    {copiedKeyId === 'modal-key' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
                >
                  I have saved this key safely
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- CREATE WEBHOOK MODAL --- */}
      {isWebhookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-blue-600" />
                Register Outbound Webhook
              </h3>
              <button
                type="button"
                onClick={() => setIsWebhookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  required
                  value={webhookName}
                  onChange={(e) => setWebhookName(e.target.value)}
                  placeholder="e.g. Production Discord / Slack Alerts"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payload Delivery URL (HTTPS)
                </label>
                <input
                  type="url"
                  required
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.yourdomain.com/webhooks/supremeai"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Event Triggers
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    'chat.completed',
                    'code.analyzed',
                    'agent.finished',
                    'security.alert_detected',
                    'token.threshold_warning',
                  ].map((ev) => (
                    <label
                      key={ev}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(ev)}
                        onChange={() => toggleEvent(ev)}
                        className="rounded text-blue-600 focus:ring-0"
                      />
                      <span className="font-mono text-[11px]">{ev}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWebhookModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer"
                >
                  Register Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* --- WEBHOOK DELIVERY LOGS & RETRY MODAL --- */}
      {isDeliveriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-cyan-500" />
                  Outbound Webhook Delivery History
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit trail of HTTP POST dispatches, response status codes, and retry queue
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliveriesModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {deliveries.map((del) => {
                const isRetrying = retryingId === del.id;
                return (
                  <div
                    key={del.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            del.statusCode === 200
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          HTTP {del.statusCode}
                        </span>
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {del.eventType}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400">{del.timestamp}</span>
                        <span className="text-[11px] font-mono text-slate-400">{del.latencyMs}ms</span>
                        <button
                          type="button"
                          disabled={isRetrying}
                          onClick={() => {
                            setRetryingId(del.id);
                            setTimeout(() => {
                              setDeliveries((prev) =>
                                prev.map((d) =>
                                  d.id === del.id
                                    ? {
                                        ...d,
                                        statusCode: 200,
                                        success: true,
                                        latencyMs: 165,
                                        timestamp: 'Just now (Retried)',
                                      }
                                    : d
                                )
                              );
                              setRetryingId(null);
                            }, 1000);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isRetrying ? 'Retrying...' : 'Retry'}
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-400 overflow-x-auto">
                      <code>{del.payloadJson}</code>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeliveriesModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
