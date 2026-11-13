import React, { useState } from 'react';
import { Key, Radio, Shield } from 'lucide-react';
import { ApiKeyItem, WebhookItem } from '../../types';
import { ApiKeysTable } from './api-keys/ApiKeysTable';
import { CreateKeyModal } from './api-keys/CreateKeyModal';
import { WebhooksTable } from './api-keys/WebhooksTable';
import { CreateWebhookModal } from './api-keys/CreateWebhookModal';
import { WebhookDeliveriesModal } from './api-keys/WebhookDeliveriesModal';

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
  const [activeSubTab, setActiveSubTab] = useState<'keys' | 'webhooks'>('keys');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [isDeliveriesModalOpen, setIsDeliveriesModalOpen] = useState(false);

  const activeKeysCount = apiKeys.filter((k) => k.status === 'active').length;
  const activeWebhooksCount = webhooks.filter((w) => w.active).length;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 workspace-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-500 mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>DEVELOPER INGRESS & INTEGRATION</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            API Keys & Webhooks
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage programmatic credentials, HMAC secrets, and automated event webhooks.
          </p>
        </div>

        {/* Sub-tab segmented filter */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('keys')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'keys'
                ? 'bg-white dark:bg-slate-800 text-cyan-500 dark:text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {activeKeysCount}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('webhooks')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'webhooks'
                ? 'bg-white dark:bg-slate-800 text-cyan-500 dark:text-cyan-400 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Webhooks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700">
              {activeWebhooksCount}
            </span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      {activeSubTab === 'keys' ? (
        <ApiKeysTable
          apiKeys={apiKeys}
          onRevokeApiKey={onRevokeApiKey}
          onOpenCreateModal={() => setIsKeyModalOpen(true)}
        />
      ) : (
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
        onClose={() => setIsKeyModalOpen(false)}
        onAddApiKey={onAddApiKey}
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
