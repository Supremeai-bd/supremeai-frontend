import React, { useState } from 'react';
import { X, Radio, AlertCircle, Shield } from 'lucide-react';
import { WebhookItem } from '../../../types';
import { validateWebhookForm } from '../../../utils/validation';

interface CreateWebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWebhook: (newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>) => void;
}

export const CreateWebhookModal: React.FC<CreateWebhookModalProps> = ({
  isOpen,
  onClose,
  onAddWebhook,
}) => {
  const [webhookName, setWebhookName] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'chat.completed',
    'agent.finished',
  ]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleToggleEvent = (eventName: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventName) ? prev.filter((e) => e !== eventName) : [...prev, eventName]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateWebhookForm({
      name: webhookName,
      url: webhookUrl,
      events: selectedEvents,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});

    const signingSecret = `whsec_${Math.random().toString(36).substring(2, 14)}`;

    onAddWebhook({
      name: webhookName.trim(),
      url: webhookUrl.trim(),
      events: selectedEvents,
      secret: signingSecret,
      active: true,
    });

    setWebhookName('');
    setWebhookUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-cyan-500/25 p-6 shadow-2xl relative cyber-hud-glass">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Register Webhook Endpoint
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive real-time event dispatches securely signed with HMAC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Endpoint Friendly Name
            </label>
            <input
              type="text"
              placeholder="e.g. Production Webhook Ingress"
              value={webhookName}
              onChange={(e) => {
                setWebhookName(e.target.value);
                if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
              }}
              className={`w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                formErrors.name
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-cyan-500'
              } text-slate-900 dark:text-white outline-none transition-colors`}
            />
            {formErrors.name && (
              <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.name}
              </p>
            )}
          </div>

          {/* URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination URL (HTTPS Recommended)
            </label>
            <input
              type="text"
              placeholder="https://api.mycompany.com/supremeai/events"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                if (formErrors.url) setFormErrors((prev) => ({ ...prev, url: '' }));
              }}
              className={`w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-900 border ${
                formErrors.url
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:border-cyan-500'
              } text-slate-900 dark:text-white outline-none transition-colors`}
            />
            {formErrors.url && (
              <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.url}
              </p>
            )}
          </div>

          {/* Event Triggers */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subscribe to Event Triggers
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'chat.completed', label: 'Chat Completed', desc: 'When model inference finishes' },
                { id: 'code_review.finished', label: 'Code Review Done', desc: 'GitHub review synthesis' },
                { id: 'agent.finished', label: 'Agent Finished', desc: 'Autonomous task conclusion' },
                { id: 'quota.warning', label: 'Quota Warning', desc: 'Approaching token thresholds' },
              ].map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => handleToggleEvent(evt.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                    selectedEvents.includes(evt.id)
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="font-medium">{evt.label}</div>
                  <p className="text-[10px] opacity-75 mt-0.5">{evt.desc}</p>
                </div>
              ))}
            </div>
            {formErrors.events && (
              <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {formErrors.events}
              </p>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-slate-600 dark:text-slate-400 text-[11px] flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-500 shrink-0" />
            <span>Pay-loads will include an <code>X-Supreme-Signature-256</code> header for verification.</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono transition-colors cursor-pointer"
            >
              REGISTER ENDPOINT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
