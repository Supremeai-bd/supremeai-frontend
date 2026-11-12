import React, { useState } from 'react';
import { X, Key, Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { ApiKeyItem } from '../../../types';
import { validateApiKeyForm } from '../../../utils/validation';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddApiKey: (newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => void;
}

export const CreateKeyModal: React.FC<CreateKeyModalProps> = ({
  isOpen,
  onClose,
  onAddApiKey,
}) => {
  const [keyName, setKeyName] = useState('');
  const [keyRpm, setKeyRpm] = useState(120);
  const [selectedPermissions, setSelectedPermissions] = useState<
    ('chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke')[]
  >(['chat:write', 'models:read']);
  const [generatedKeySecret, setGeneratedKeySecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleTogglePermission = (
    perm: 'chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke'
  ) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateApiKeyForm({
      name: keyName,
      rpm: keyRpm,
      permissions: selectedPermissions,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});

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

  const handleCopy = () => {
    if (!generatedKeySecret) return;
    navigator.clipboard.writeText(generatedKeySecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    setGeneratedKeySecret(null);
    setKeyName('');
    setFormErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-cyan-500/25 p-6 shadow-2xl relative cyber-hud-glass">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Generate API Access Key
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure scoped permissions and rate limits
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Once generated: Show secret banner */}
        {generatedKeySecret ? (
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-semibold">Copy your secret token now.</p>
                <p className="mt-0.5 opacity-90">
                  For your security, SupremeAI cannot display this token again. Store it securely in your .env or secret manager.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs flex items-center justify-between">
              <span className="text-cyan-600 dark:text-cyan-400 break-all select-all">
                {generatedKeySecret}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-3 shrink-0 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <button
              onClick={handleFinish}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-medium text-xs hover:opacity-90 transition-opacity cursor-pointer"
            >
              Done & Return
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="py-4 space-y-4">
            {/* Key Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Key Identifier / Service Name
              </label>
              <input
                type="text"
                placeholder="e.g. CI/CD Code Auditor Worker"
                value={keyName}
                onChange={(e) => {
                  setKeyName(e.target.value);
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

            {/* Rate Limit Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rate Limit Threshold
                </label>
                <span className="text-xs font-mono text-cyan-500">{keyRpm} req/min</span>
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
                ].map((perm) => (
                  <div
                    key={perm.id}
                    onClick={() => handleTogglePermission(perm.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                      selectedPermissions.includes(perm.id)
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span>{perm.label}</span>
                      {selectedPermissions.includes(perm.id) && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <p className="text-[10px] opacity-75 mt-0.5">{perm.desc}</p>
                  </div>
                ))}
              </div>
              {formErrors.permissions && (
                <p className="mt-1 text-[11px] text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {formErrors.permissions}
                </p>
              )}
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
                GENERATE CREDENTIAL
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
