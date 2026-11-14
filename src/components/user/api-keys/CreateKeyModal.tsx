import React, { useState, useEffect } from 'react';
import { X, Key, Copy, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ApiKeyItem, AiProviderId } from '../../../types';
import { AI_PROVIDER_DEFINITIONS } from '../../../constants/aiProviders';
import { validateApiKeyForm } from '../../../utils/validation';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApiKey: (
    newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'> & { rawSecret?: string }
  ) => void;
  onUpdateApiKey?: (
    id: string,
    updates: Partial<ApiKeyItem> & { rawSecret?: string }
  ) => void;
  editingKey?: ApiKeyItem | null;
  defaultProvider?: AiProviderId | string;
}

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onAddApiKey,
  onUpdateApiKey,
  editingKey = null,
  defaultProvider = 'supremeai',
}) => {
  const isEditing = Boolean(editingKey);
  const [provider, setProvider] = useState<string>(defaultProvider || 'supremeai');
  const [keyName, setKeyName] = useState('');
  const [rawSecretInput, setRawSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [keyRpm, setKeyRpm] = useState(120);
  const [selectedPermissions, setSelectedPermissions] = useState<
    ('chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke')[]
  >(['chat:write', 'models:read']);
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;
    setGeneratedKeySecret(null);
    setFormErrors({});
    setShowSecret(false);

    if (editingKey) {
      setProvider(editingKey.provider || 'supremeai');
      setKeyName(editingKey.name);
      setRawSecretInput('');
      setKeyRpm(editingKey.rateLimitRpm || 120);
      setSelectedPermissions(
        editingKey.permissions?.length ? editingKey.permissions : ['chat:write', 'models:read']
      );
    } else {
      setProvider(defaultProvider || 'supremeai');
      setKeyName('');
      setRawSecretInput('');
      setKeyRpm(120);
      setSelectedPermissions(['chat:write', 'models:read']);
    }
  }, [isOpen, editingKey, defaultProvider]);

  if (!isOpen) return null;

  const selectedProviderMeta =
    AI_PROVIDER_DEFINITIONS.find((p) => p.id === provider) || AI_PROVIDER_DEFINITIONS[0];

  const handleTogglePermission = (
    perm: 'chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke'
  ) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateApiKeyForm({
      name: keyName,
      rpm: keyRpm,
      permissions: selectedPermissions,
    });

    const trimmedSecret = rawSecretInput.trim();
    if (trimmedSecret && trimmedSecret.length < 8) {
      validation.errors.secret = 'Provided API secret must be at least 8 characters.';
      validation.isValid = false;
    }

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});

    if (isEditing && editingKey && onUpdateApiKey) {
      onUpdateApiKey(editingKey.id, {
        name: keyName.trim(),
        provider,
        rateLimitRpm: keyRpm,
        permissions: selectedPermissions,
        ...(trimmedSecret ? { rawSecret: trimmedSecret } : {}),
      });
      onClose();
      return;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10);
    const fullSecret =
      trimmedSecret ||
      `sk-${provider === 'supremeai' ? 'supreme' : provider.slice(0, 4)}-live-${randomSuffix}${Math.random().toString(36).substring(2, 14)}`;
    const prefix = fullSecret.substring(0, Math.min(14, fullSecret.length));
    const masked =
      fullSecret.length > 10
        ? `${fullSecret.slice(0, 10)}••••••••••••••••${fullSecret.slice(-4)}`
        : '••••••••••••';

    onAddApiKey({
      name: keyName.trim(),
      provider,
      keyPrefix: prefix,
      secretMasked: masked,
      rateLimitRpm: keyRpm,
      status: 'active',
      healthStatus: 'healthy',
      lastChecked: 'Just now',
      permissions: selectedPermissions,
      rawSecret: fullSecret,
    });

    if (trimmedSecret) {
      onClose();
    } else {
      setGeneratedKeySecret(fullSecret);
    }
  };

  const handleCopy = () => {
    if (!generatedKeySecret) return;
    navigator.clipboard.writeText(generatedKeySecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setGeneratedKeySecret(null);
    setKeyName('');
    setRawSecretInput('');
    setFormErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Provider API Key' : 'Add Provider API Key'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing
                  ? 'Update AI provider binding, rate limits, permissions, or rotate secret'
                  : 'Bind an upstream AI provider credential or generate a gateway key'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFinish}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Once auto-generated: Show secret banner */}
        {generatedKeySecret ? (
          <div className="py-5 space-y-4">
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">Copy your secret token now.</p>
                <p className="mt-0.5 opacity-90">
                  For your security, SupremeAI only displays auto-generated tokens once. Store it securely in your environment or secret manager.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs flex items-center justify-between gap-2">
              <span className="text-cyan-700 dark:text-cyan-400 break-all select-all">
                {generatedKeySecret}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-sans font-medium flex items-center gap-1.5 transition-opacity hover:opacity-90 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="pt-4 space-y-4">
            {/* AI Provider Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white outline-none transition-colors"
              >
                {AI_PROVIDER_DEFINITIONS.map((prov) => (
                  <option key={prov.id} value={prov.id}>
                    {prov.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Key Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Key Identifier / Label
              </label>
              <input
                type="text"
                placeholder={`e.g. ${selectedProviderMeta.shortLabel} Production Worker`}
                value={keyName}
                onChange={(e) => {
                  setKeyName(e.target.value);
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border ${
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

            {/* Optional Provider Secret / Rotation */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isEditing ? 'Rotate API Key Secret (Optional)' : 'Provider API Key Secret (Optional)'}
                </label>
                <span className="text-[11px] font-mono text-slate-400">
                  {isEditing ? 'Leave blank to keep existing' : 'Leave blank to auto-generate'}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={selectedProviderMeta.keyHint}
                  value={rawSecretInput}
                  onChange={(e) => {
                    setRawSecretInput(e.target.value);
                    if (formErrors.secret) setFormErrors((prev) => ({ ...prev, secret: '' }));
                  }}
                  className={`w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border ${
                    formErrors.secret
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-200 dark:border-slate-800 focus:border-cyan-500'
                  } text-slate-900 dark:text-white outline-none transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((prev) => !prev)}
                  aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {formErrors.secret && (
                <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.secret}
                </p>
              )}
            </div>

            {/* Rate Limit Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rate Limit Threshold
                </label>
                <span className="text-xs font-mono tabular-nums text-cyan-600 dark:text-cyan-400">
                  {keyRpm} req/min
                </span>
              </div>
              <input
                type="range"
                min="30"
                max="600"
                step="30"
                value={keyRpm}
                onChange={(e) => setKeyRpm(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Scoped Permissions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Scoped Permissions
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'chat:write' as const, label: 'Chat & Generation', desc: 'Execute prompts & inference' },
                  { id: 'models:read' as const, label: 'Model Metadata', desc: 'Read models & parameters' },
                  { id: 'knowledge:read' as const, label: 'RAG Grounding', desc: 'Retrieve indexed documents' },
                  { id: 'agents:invoke' as const, label: 'Agent Invocation', desc: 'Trigger MCP autonomous swarm' },
                ].map((perm) => {
                  const active = selectedPermissions.includes(perm.id);
                  return (
                    <button
                      type="button"
                      key={perm.id}
                      onClick={() => handleTogglePermission(perm.id)}
                      className={`p-2.5 text-left rounded-lg border cursor-pointer transition-colors ${
                        active
                          ? 'border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{perm.label}</span>
                        {active && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                      </div>
                      <p className="text-[10px] opacity-75 mt-0.5">{perm.desc}</p>
                    </button>
                  );
                })}
              </div>
              {formErrors.permissions && (
                <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.permissions}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer"
              >
                {isEditing ? 'Save Changes' : 'Add Credential'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
