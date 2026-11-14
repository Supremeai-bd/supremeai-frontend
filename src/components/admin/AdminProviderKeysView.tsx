import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Lock,
  Search,
  X,
  Eye,
  EyeOff,
  Gauge,
} from 'lucide-react';
import { ProviderKeyItem, InfisicalVaultKeyLatency } from '../../types';
import { INITIAL_PROVIDER_KEYS } from '../../data/adminExpansionData';
import { AI_PROVIDER_DEFINITIONS } from '../../constants/aiProviders';
import { adminService } from '../../services/adminService';
import { useAdminStore } from '../../stores/useAdminStore';

type AdminSubTab = 'providers' | 'infisical';

interface ProviderModalForm {
  provider: string;
  displayName: string;
  rawKey: string;
  rateLimitTpm: string;
  infisicalPath: string;
  infisicalEnv: 'prod' | 'staging' | 'dev';
  region: string;
  priority: number;
}

export const AdminProviderKeysView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AdminSubTab>('providers');
  const [providers, setProviders] = useState<ProviderKeyItem[]>(INITIAL_PROVIDER_KEYS);
  const [vaultKeys, setVaultKeys] = useState<InfisicalVaultKeyLatency[]>([]);
  const [vaultMeta, setVaultMeta] = useState<{
    vaultEngine: string;
    mode: string;
    avgVaultLatencyMs: number;
    lastSyncedAt: string;
  }>({
    vaultEngine: 'Infisical Secrets Vault',
    mode: 'infisical-vault-mesh',
    avgVaultLatencyMs: 0,
    lastSyncedAt: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingVault, setIsSyncingVault] = useState(false);
  const [isProbingAll, setIsProbingAll] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [envFilter, setEnvFilter] = useState<'all' | 'prod' | 'staging' | 'dev'>('all');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderKeyItem | null>(null);
  const [showRawKey, setShowRawKey] = useState(false);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProviderModalForm>({
    provider: 'openai',
    displayName: '',
    rawKey: '',
    rateLimitTpm: '2,000,000 TPM',
    infisicalPath: '/ai-providers/OPENAI_API_KEY',
    infisicalEnv: 'prod',
    region: 'global-edge',
    priority: 1,
  });

  const fetchAuditRecords = useAdminStore((s) => s.fetchAuditRecords);

  const showBanner = useCallback((success: boolean, message: string) => {
    setFeedbackBanner({ success, message });
    setTimeout(() => {
      setFeedbackBanner((curr) => (curr?.message === message ? null : curr));
    }, 5000);
  }, []);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [provList, vaultRes] = await Promise.all([
        adminService.fetchProviders(),
        adminService.fetchInfisicalVaultKeys().catch(() => null),
      ]);
      if (provList && provList.length > 0) {
        setProviders(provList);
      }
      if (vaultRes) {
        setVaultKeys(vaultRes.keys || []);
        setVaultMeta({
          vaultEngine: vaultRes.vaultEngine || 'Infisical Secrets Vault',
          mode: vaultRes.mode || 'infisical-vault-mesh',
          avgVaultLatencyMs: vaultRes.avgVaultLatencyMs || 0,
          lastSyncedAt: vaultRes.lastSyncedAt || new Date().toISOString(),
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await adminService.probeProvider(id);
      if (res.providers && res.providers.length > 0) {
        setProviders(res.providers);
      }
      if (res.vaultKeys && res.vaultKeys.length > 0) {
        setVaultKeys(res.vaultKeys);
        const avg = Math.round(
          res.vaultKeys.reduce((sum, k) => sum + k.avgLatencyMs, 0) / res.vaultKeys.length
        );
        setVaultMeta((prev) => ({
          ...prev,
          avgVaultLatencyMs: avg,
          lastSyncedAt: new Date().toISOString(),
        }));
      } else {
        await loadAllData();
      }
      showBanner(res.success, res.message);
      fetchAuditRecords();
    } catch (err: unknown) {
      showBanner(
        false,
        err instanceof Error ? err.message : 'Upstream provider probe failed.'
      );
    } finally {
      setTestingId(null);
    }
  };

  const handleProbeAll = async () => {
    setIsProbingAll(true);
    try {
      const res = await adminService.probeAllProviders();
      if (res.providers) setProviders(res.providers);
      if (res.vaultKeys) {
        setVaultKeys(res.vaultKeys);
        const avg = res.vaultKeys.length
          ? Math.round(
              res.vaultKeys.reduce((sum, k) => sum + k.avgLatencyMs, 0) / res.vaultKeys.length
            )
          : 0;
        setVaultMeta((prev) => ({
          ...prev,
          avgVaultLatencyMs: avg,
          lastSyncedAt: new Date().toISOString(),
        }));
      }
      showBanner(res.success, res.message);
      fetchAuditRecords();
    } catch (err: unknown) {
      showBanner(
        false,
        err instanceof Error ? err.message : 'Cluster-wide provider latency probe failed.'
      );
    } finally {
      setIsProbingAll(false);
    }
  };

  const handleSyncInfisical = async () => {
    setIsSyncingVault(true);
    try {
      const res = await adminService.syncInfisicalVault();
      if (res.keys) {
        setVaultKeys(res.keys);
        const avg = res.keys.length
          ? Math.round(res.keys.reduce((sum, k) => sum + k.avgLatencyMs, 0) / res.keys.length)
          : 0;
        setVaultMeta((prev) => ({
          ...prev,
          avgVaultLatencyMs: avg,
          lastSyncedAt: res.syncedAt || new Date().toISOString(),
        }));
      }
      showBanner(res.success, res.message);
      fetchAuditRecords();
    } catch (err: unknown) {
      showBanner(
        false,
        err instanceof Error ? err.message : 'Infisical Vault synchronization failed.'
      );
    } finally {
      setIsSyncingVault(false);
    }
  };

  const handlePriorityChange = async (id: string, direction: 'up' | 'down') => {
    try {
      const updated = await adminService.updateProviderPriority(id, direction);
      if (updated && updated.length > 0) {
        setProviders(updated);
        fetchAuditRecords();
      }
    } catch {}
  };

  const handleDeleteProvider = async (id: string) => {
    try {
      const res = await adminService.deleteProviderKey(id);
      if (res.providers) setProviders(res.providers);
      setConfirmDeleteId(null);
      await loadAllData();
      showBanner(true, 'Provider key removed from failover chain and Infisical Vault.');
      fetchAuditRecords();
    } catch (err: unknown) {
      showBanner(
        false,
        err instanceof Error ? err.message : 'Failed to remove provider key.'
      );
    }
  };

  const openAddModal = () => {
    setEditingProvider(null);
    setModalError(null);
    setShowRawKey(false);
    setFormState({
      provider: 'openai',
      displayName: '',
      rawKey: '',
      rateLimitTpm: '2,000,000 TPM',
      infisicalPath: '/ai-providers/OPENAI_API_KEY',
      infisicalEnv: 'prod',
      region: 'global-edge',
      priority: providers.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: ProviderKeyItem) => {
    setEditingProvider(p);
    setModalError(null);
    setShowRawKey(false);
    setFormState({
      provider: p.provider || 'openai',
      displayName: p.displayName,
      rawKey: '',
      rateLimitTpm: p.rateLimitTpm || '2,000,000 TPM',
      infisicalPath: p.infisicalPath || `/ai-providers/${p.provider.toUpperCase()}_API_KEY`,
      infisicalEnv: p.infisicalEnv || 'prod',
      region: p.region || 'global-edge',
      priority: p.priority,
    });
    setIsModalOpen(true);
  };

  const handleProviderSelectInModal = (providerId: string) => {
    const def = AI_PROVIDER_DEFINITIONS.find((d) => d.id === providerId);
    setFormState((prev) => ({
      ...prev,
      provider: providerId,
      infisicalPath: def?.defaultPath || `/ai-providers/${providerId.toUpperCase()}_API_KEY`,
      displayName: editingProvider ? prev.displayName : prev.displayName || def?.label || '',
    }));
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formState.displayName.trim()) {
      setModalError('Provider display name is required.');
      return;
    }
    if (!editingProvider && formState.rawKey.trim().length < 6) {
      setModalError('API key secret must be at least 6 characters.');
      return;
    }
    if (editingProvider && formState.rawKey.trim() && formState.rawKey.trim().length < 6) {
      setModalError('New rotated API key secret must be at least 6 characters.');
      return;
    }

    setIsSubmittingModal(true);
    try {
      if (editingProvider) {
        const res = await adminService.updateProviderKey(editingProvider.id, {
          provider: formState.provider,
          displayName: formState.displayName.trim(),
          rawKey: formState.rawKey.trim() || undefined,
          rateLimitTpm: formState.rateLimitTpm.trim(),
          infisicalPath: formState.infisicalPath.trim(),
          infisicalEnv: formState.infisicalEnv,
          region: formState.region.trim(),
          priority: Number(formState.priority) || editingProvider.priority,
        });
        if (res.providers) setProviders(res.providers);
        showBanner(true, `Updated ${formState.displayName.trim()} configuration.`);
      } else {
        const res = await adminService.addProviderKey({
          provider: formState.provider,
          displayName: formState.displayName.trim(),
          rawKey: formState.rawKey.trim(),
          rateLimitTpm: formState.rateLimitTpm.trim(),
          infisicalPath: formState.infisicalPath.trim(),
          infisicalEnv: formState.infisicalEnv,
          region: formState.region.trim(),
          priority: Number(formState.priority) || providers.length + 1,
        });
        if (res.providers) setProviders(res.providers);
        showBanner(true, `Added ${formState.displayName.trim()} to Infisical Vault & Failover Chain.`);
      }

      setIsModalOpen(false);
      setEditingProvider(null);
      await loadAllData();
      fetchAuditRecords();
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Unable to save provider configuration.');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const filteredProviders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return providers.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.displayName.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        (p.infisicalPath || '').toLowerCase().includes(q)
      );
    });
  }, [providers, searchQuery, statusFilter]);

  const filteredVaultKeys = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vaultKeys.filter((k) => {
      if (envFilter !== 'all' && k.environment !== envFilter) return false;
      if (!q) return true;
      return (
        k.secretName.toLowerCase().includes(q) ||
        k.infisicalPath.toLowerCase().includes(q) ||
        k.providerDisplayName.toLowerCase().includes(q)
      );
    });
  }, [vaultKeys, searchQuery, envFilter]);

  const healthyProvidersCount = providers.filter((p) => p.status === 'healthy').length;
  const computedAvgLatency = useMemo(() => {
    if (vaultMeta.avgVaultLatencyMs > 0) return vaultMeta.avgVaultLatencyMs;
    if (providers.length === 0) return 0;
    return Math.round(
      providers.reduce((sum, p) => sum + (p.avgLatencyMs ?? p.latencyMs), 0) / providers.length
    );
  }, [vaultMeta.avgVaultLatencyMs, providers]);

  const renderStatus = (status: string) => {
    if (status === 'healthy') {
      return (
        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Healthy</span>
        </span>
      );
    }
    if (status === 'degraded') {
      return (
        <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-mono text-[11px] font-medium">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Degraded</span>
        </span>
      );
    }
    if (status === 'unhealthy') {
      return (
        <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-mono text-[11px] font-medium">
          <XCircle className="w-3.5 h-3.5" />
          <span>Unhealthy</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-medium">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Untested</span>
      </span>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-7 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>INFISICAL SECRETS VAULT · MULTI-PROVIDER FAILOVER</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Provider API Keys & Infisical Vault Latency
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Add, edit, probe, prioritize, and remove upstream AI provider keys with live latency metrics across every Infisical Vault secret.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSyncInfisical}
            disabled={isSyncingVault}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVault ? 'animate-spin text-purple-500' : ''}`} />
            <span>{isSyncingVault ? 'Syncing Vault...' : 'Sync Infisical Vault'}</span>
          </button>

          <button
            type="button"
            onClick={handleProbeAll}
            disabled={isProbingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Gauge className={`w-3.5 h-3.5 ${isProbingAll ? 'animate-spin text-cyan-500' : 'text-cyan-500'}`} />
            <span>{isProbingAll ? 'Benchmarking...' : 'Probe All Keys'}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Provider Key</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Provider Keys
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {providers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Failover chain active
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Healthy Routes
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {healthyProvidersCount} / {providers.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {providers.length - healthyProvidersCount === 0
              ? 'All upstream routes nominal'
              : `${providers.length - healthyProvidersCount} requiring attention`}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Avg Vault Key Latency
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-600 dark:text-cyan-400 mt-1">
            {computedAvgLatency} ms
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono tabular-nums">
            Across {vaultKeys.length || providers.length} vault secrets
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Vault Engine
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="truncate">{vaultMeta.vaultEngine}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1.5 truncate">
            {vaultMeta.lastSyncedAt
              ? `Synced ${new Date(vaultMeta.lastSyncedAt).toLocaleTimeString()}`
              : 'Synced at boot'}
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`flex items-center justify-between gap-2 p-3.5 rounded-xl text-xs border ${
            feedbackBanner.success
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs + Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('providers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'providers'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-purple-500" />
            <span>Provider Keys & Health</span>
            <span className="text-[11px] tabular-nums text-slate-400">{providers.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('infisical')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeSubTab === 'infisical'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-cyan-500" />
            <span>Infisical Vault Latency</span>
            <span className="text-[11px] tabular-nums text-slate-400">
              {vaultKeys.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeSubTab === 'providers'
                  ? 'Filter providers or vault path...'
                  : 'Search vault secrets...'
              }
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 outline-none text-slate-900 dark:text-white w-56"
            />
          </div>

          {activeSubTab === 'providers' ? (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Statuses</option>
              <option value="healthy">Healthy</option>
              <option value="degraded">Degraded</option>
              <option value="unhealthy">Unhealthy</option>
              <option value="untested">Untested</option>
            </select>
          ) : (
            <select
              value={envFilter}
              onChange={(e) =>
                setEnvFilter(e.target.value as 'all' | 'prod' | 'staging' | 'dev')
              }
              className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Environments</option>
              <option value="prod">prod</option>
              <option value="staging">staging</option>
              <option value="dev">dev</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: Provider Keys & Health with Add / Edit / Remove / Priority / Probe */}
      {activeSubTab === 'providers' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Failover</th>
                  <th className="py-3 px-4">AI Provider</th>
                  <th className="py-3 px-4">Infisical Secret Path</th>
                  <th className="py-3 px-4">Masked Key</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Latency (Current / Avg)</th>
                  <th className="py-3 px-4">Rate Cap</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                {filteredProviders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 text-xs">
                      No provider API keys match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredProviders.map((p, idx) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold tabular-nums text-cyan-600 dark:text-cyan-400 w-6">
                            #{p.priority}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handlePriorityChange(p.id, 'up')}
                              title="Increase priority"
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredProviders.length - 1}
                              onClick={() => handlePriorityChange(p.id, 'down')}
                              title="Decrease priority"
                              className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.displayName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {p.provider} · {p.region || 'global-edge'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-700 dark:text-slate-300">
                          {p.infisicalPath || `/ai-providers/${p.provider.toUpperCase()}_API_KEY`}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          env: {p.infisicalEnv || 'prod'} · v{p.vaultVersion || 1}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {p.maskedKey}
                      </td>

                      <td className="py-3.5 px-4">
                        <div>{renderStatus(p.status)}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {p.lastChecked}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white">
                          {p.latencyMs} ms{' '}
                          <span className="text-slate-400 font-normal">
                            / avg {p.avgLatencyMs ?? p.latencyMs} ms
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          p95 {p.p95LatencyMs ?? Math.round(p.latencyMs * 1.45)} ms
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {p.rateLimitTpm}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            disabled={testingId === p.id}
                            onClick={() => handleTestConnection(p.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium cursor-pointer disabled:opacity-50"
                            title="Probe provider latency & health"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${
                                testingId === p.id ? 'animate-spin text-cyan-500' : ''
                              }`}
                            />
                            <span>Probe</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium cursor-pointer"
                            title="Edit provider key & Infisical path"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {confirmDeleteId === p.id ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleDeleteProvider(p.id)}
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
                              onClick={() => setConfirmDeleteId(p.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-[11px] font-medium cursor-pointer"
                              title="Remove provider key"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: All API Keys Latency from Infisical Vault */}
      {activeSubTab === 'infisical' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/40">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
              Infisical Secrets Vault — Live API Key Latency Inventory ({filteredVaultKeys.length} keys)
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              Mode: {vaultMeta.mode}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Secret Name</th>
                  <th className="py-3 px-4">Infisical Vault Path</th>
                  <th className="py-3 px-4">Env / Ver</th>
                  <th className="py-3 px-4">AI Provider</th>
                  <th className="py-3 px-4">Health</th>
                  <th className="py-3 px-4">Current Latency</th>
                  <th className="py-3 px-4">Avg Latency</th>
                  <th className="py-3 px-4">P95 Latency</th>
                  <th className="py-3 px-4">Last Probed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80">
                {isLoading && filteredVaultKeys.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 text-xs font-mono">
                      Loading Infisical Vault secret latency metrics...
                    </td>
                  </tr>
                ) : filteredVaultKeys.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-500 text-xs">
                      No Infisical Vault API keys match the selected environment or query.
                    </td>
                  </tr>
                ) : (
                  filteredVaultKeys.map((vk) => {
                    const avgColor =
                      vk.avgLatencyMs <= 60
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : vk.avgLatencyMs <= 200
                        ? 'text-slate-900 dark:text-white'
                        : 'text-amber-600 dark:text-amber-400';

                    return (
                      <tr
                        key={vk.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-semibold text-slate-900 dark:text-white">
                            {vk.secretName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {vk.maskedKey}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {vk.infisicalPath}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] tabular-nums">
                          <span
                            className={`font-semibold ${
                              vk.environment === 'prod'
                                ? 'text-purple-600 dark:text-purple-400'
                                : vk.environment === 'staging'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {vk.environment}
                          </span>
                          <span className="text-slate-400 ml-1.5">v{vk.version}</span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-medium">
                          {vk.providerDisplayName}
                        </td>

                        <td className="py-3.5 px-4">{renderStatus(vk.status)}</td>

                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                          {vk.latencyMs} ms
                        </td>

                        <td className={`py-3.5 px-4 font-mono font-semibold tabular-nums ${avgColor}`}>
                          {vk.avgLatencyMs} ms
                        </td>

                        <td className="py-3.5 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400">
                          {vk.p95LatencyMs} ms
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {vk.lastChecked}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Provider Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingProvider ? 'Edit Provider Key & Infisical Binding' : 'Add AI Provider Key'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {editingProvider
                    ? 'Modify failover metadata, Infisical secret path, or rotate API secret.'
                    : 'Register a new AI provider credential synced with Infisical Vault.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    AI Provider
                  </label>
                  <select
                    value={formState.provider}
                    onChange={(e) => handleProviderSelectInModal(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  >
                    {AI_PROVIDER_DEFINITIONS.map((def) => (
                      <option key={def.id} value={def.id}>
                        {def.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Infisical Environment
                  </label>
                  <select
                    value={formState.infisicalEnv}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        infisicalEnv: e.target.value as 'prod' | 'staging' | 'dev',
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  >
                    <option value="prod">prod</option>
                    <option value="staging">staging</option>
                    <option value="dev">dev</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formState.displayName}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, displayName: e.target.value }))
                  }
                  placeholder="e.g. OpenAI GPT-4o Primary US-East"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {editingProvider ? 'Rotate API Secret (Optional)' : 'API Key Secret'}
                  </label>
                  {editingProvider && (
                    <span className="text-[11px] font-mono text-slate-400">
                      Leave blank to keep existing vault secret
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showRawKey ? 'text' : 'password'}
                    value={formState.rawKey}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, rawKey: e.target.value }))
                    }
                    placeholder="sk-..."
                    className="w-full pl-3 pr-9 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRawKey((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showRawKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Infisical Vault Secret Path
                </label>
                <input
                  type="text"
                  value={formState.infisicalPath}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, infisicalPath: e.target.value }))
                  }
                  placeholder="/ai-providers/OPENAI_API_KEY"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rate Limit (TPM)
                  </label>
                  <input
                    type="text"
                    value={formState.rateLimitTpm}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, rateLimitTpm: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    value={formState.region}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, region: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={formState.priority}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, priority: Number(e.target.value) || 1 }))
                    }
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingModal}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingModal
                    ? 'Saving...'
                    : editingProvider
                    ? 'Save Changes'
                    : 'Add Provider Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
