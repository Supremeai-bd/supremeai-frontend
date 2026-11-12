import React, { useState } from 'react';
import { Key, Copy, Check, Trash2, Shield, AlertCircle } from 'lucide-react';
import { ApiKeyItem } from '../../../types';

interface ApiKeysTableProps {
  apiKeys: ApiKeyItem[];
  onRevokeApiKey: (id: string) => void;
  onOpenCreateModal: () => void;
}

export const ApiKeysTable: React.FC<ApiKeysTableProps> = ({
  apiKeys,
  onRevokeApiKey,
  onOpenCreateModal,
}) => {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const activeKeys = apiKeys.filter((k) => k.status === 'active');

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl cyber-hud-glass">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-cyan-500" />
            Active API Credentials
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Access SupremeAI models, knowledge base RAG, and agent swarm protocols programmatically.
          </p>
        </div>
        <button
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm transition-all cursor-pointer font-mono"
        >
          <span>+ GENERATE KEY</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-cyan-500/15 overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Key Name</th>
                <th className="py-3 px-4">Token Secret Mask</th>
                <th className="py-3 px-4">Rate Limit</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4">Last Used</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {apiKeys.map((key) => {
                const isRevoked = key.status === 'revoked';
                return (
                  <tr
                    key={key.id}
                    className={`hover:bg-cyan-500/[0.03] transition-colors ${
                      isRevoked ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-200 flex items-center gap-2">
                        <span>{key.name}</span>
                        {key.permissions.includes('agents:invoke') && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            AGENT
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-[11px]">
                        <span>{key.secretMasked}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(key.secretMasked, key.id)}
                          className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                          title="Copy masked token"
                        >
                          {copiedKeyId === key.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {key.rateLimitRpm} req/min
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {key.createdAt}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {key.lastUsed}
                    </td>

                    <td className="py-3 px-4">
                      {isRevoked ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-500 dark:text-rose-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-mono text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!isRevoked && (
                        <button
                          onClick={() => onRevokeApiKey(key.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 text-xs transition-colors cursor-pointer"
                          title="Revoke API key permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
