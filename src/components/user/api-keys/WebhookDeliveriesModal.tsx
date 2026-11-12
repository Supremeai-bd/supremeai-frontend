import React, { useState } from 'react';
import { X, Send, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { WebhookDeliveryLog } from '../../../types';
import { INITIAL_WEBHOOK_DELIVERIES } from '../../../data/customerWorkspaceData';

interface WebhookDeliveriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookDeliveriesModal: React.FC<WebhookDeliveriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [deliveries, setDeliveries] = useState<WebhookDeliveryLog[]>(INITIAL_WEBHOOK_DELIVERIES);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRetry = (id: string) => {
    setRetryingId(id);
    setTimeout(() => {
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, statusCode: 200, errorSummary: undefined } : d))
      );
      setRetryingId(null);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-cyan-500/25 p-6 shadow-2xl relative cyber-hud-glass">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-500" />
              Webhook Delivery Logs
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live HTTP payload delivery receipts and retry history
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs Table */}
        <div className="py-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Event</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {deliveries.map((del) => {
                const isSuccess = del.statusCode >= 200 && del.statusCode < 300;
                return (
                  <tr key={del.id} className="hover:bg-cyan-500/[0.02]">
                    <td className="py-3 px-3 font-mono text-cyan-600 dark:text-cyan-400">
                      {del.eventType}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {isSuccess ? (
                        <span className="text-emerald-500 inline-flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          {del.statusCode} OK
                        </span>
                      ) : (
                        <span className="text-rose-500 inline-flex items-center gap-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {del.statusCode} Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                      {del.latencyMs}ms
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {del.timestamp}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!isSuccess && (
                        <button
                          onClick={() => handleRetry(del.id)}
                          disabled={retryingId === del.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-cyan-500 text-slate-600 dark:text-slate-300 hover:text-cyan-400 transition-colors text-[11px] cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${retryingId === del.id ? 'animate-spin' : ''}`} />
                          <span>Retry</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
