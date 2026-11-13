import React, { useState } from 'react';
import { Sliders, Shield, Cpu, Zap, Eye, Lock, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';
import { FeatureFlagItem } from '../../types';
import { INITIAL_FEATURE_FLAGS } from '../../data/adminExpansionData';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAdminStore } from '../../stores/useAdminStore';

export const AdminFeatureFlagsView: React.FC = () => {
  const { config, toggleFeatureFlag } = usePlatformStore();
  const fetchAuditRecords = useAdminStore((s) => s.fetchAuditRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const flags: FeatureFlagItem[] = INITIAL_FEATURE_FLAGS.map((item) => ({
    ...item,
    enabled:
      typeof config.featureFlags[item.key] === 'boolean'
        ? config.featureFlags[item.key]
        : item.enabled,
  }));

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    const nextEnabled = !currentEnabled;
    await toggleFeatureFlag(key, nextEnabled);
    await fetchAuditRecords();
    const flag = flags.find((f) => f.key === key);
    setToastMessage(
      `Feature Flag "${flag?.name || key}" has been ${nextEnabled ? 'ENABLED' : 'DISABLED'} server-wide.`
    );
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredFlags = flags.filter((f) => {
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (category: FeatureFlagItem['category']) => {
    switch (category) {
      case 'models':
        return <Cpu className="w-4 h-4 text-purple-500" />;
      case 'multimodal':
        return <Eye className="w-4 h-4 text-cyan-500" />;
      case 'agents':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'security':
        return <Lock className="w-4 h-4 text-rose-500" />;
      case 'infra':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-500 mb-1">
            Platform Config · Server Enforced
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dynamic Platform Feature Flags
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Toggle multimodal uploads, RAG grounding, swarm orchestration, and emergency maintenance across all workspaces.
          </p>
        </div>

        <div className="text-xs font-mono text-emerald-500">
          Live Server Sync Active
        </div>
      </div>

      {toastMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg text-xs">
          {['all', 'models', 'multimodal', 'agents', 'security', 'infra'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter feature keys..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Flags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFlags.map((flag) => (
          <div
            key={flag.key}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
              flag.enabled
                ? 'bg-white dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800'
                : 'bg-slate-50/70 dark:bg-slate-950/60 border-slate-200/60 dark:border-slate-800/60 opacity-85'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(flag.category)}
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {flag.name}
                  </h3>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  key: {flag.key} · {flag.category}
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={flag.enabled}
                onClick={() => handleToggle(flag.key, flag.enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  flag.enabled
                    ? 'bg-cyan-500 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    flag.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {flag.description}
            </p>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">
                Status:{' '}
                <strong className={flag.enabled ? 'text-emerald-500' : 'text-slate-500'}>
                  {flag.enabled ? 'ACTIVE' : 'DISABLED'}
                </strong>
              </span>
              <span className="text-slate-400">Enforced on server</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
