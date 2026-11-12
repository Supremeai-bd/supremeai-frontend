import React from 'react';
import { Radio, Send, Trash2, Shield, AlertCircle, ExternalLink } from 'lucide-react';
import { WebhookItem } from '../../../types';

interface WebhooksTableProps {
  webhooks: WebhookItem[];
  onDeleteWebhook: (id: string) => void;
  onTestWebhook: (id: string) => void;
  onOpenCreateModal: () => void;
  onOpenDeliveriesModal: () => void;
}

export const WebhooksTable: React.FC<WebhooksTableProps> = ({
  webhooks,
  onDeleteWebhook,
  onTestWebhook,
  onOpenCreateModal,
  onOpenDeliveriesModal,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl cyber-hud-glass">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-500" />
            Webhook Event Subscriptions
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Receive instant HTTP POST callbacks for chat events, code review results, and agent tasks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenDeliveriesModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-cyan-500/50 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <span>Delivery Logs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-sm transition-all cursor-pointer font-mono"
          >
            <span>+ ADD ENDPOINT</span>
          </button>
        </div>
      </div>

      {/* Webhooks Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-cyan-500/15 overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Endpoint Name</th>
                <th className="py-3 px-4">URL</th>
                <th className="py-3 px-4">Subscribed Events</th>
                <th className="py-3 px-4">Last Ping</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {webhooks.map((wh) => (
                <tr key={wh.id} className="hover:bg-cyan-500/[0.03] transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-200">
                    {wh.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 dark:text-cyan-400/90 text-[11px]">
                    <span className="truncate max-w-[240px] inline-block">{wh.url}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((evt) => (
                        <span
                          key={evt}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {evt}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                    {wh.lastTriggered}
                  </td>
                  <td className="py-3 px-4">
                    {wh.active ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onTestWebhook(wh.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                        title="Send ping event"
                      >
                        <Send className="w-3 h-3" />
                        <span>Test Ping</span>
                      </button>
                      <button
                        onClick={() => onDeleteWebhook(wh.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete webhook"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
