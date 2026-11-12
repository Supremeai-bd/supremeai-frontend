import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Sliders, Shield, Zap, Cpu, Server, CheckCircle2, AlertTriangle, Plus, Search, Filter } from 'lucide-react';
import { FeatureFlagItem } from '../../types';
import { INITIAL_FEATURE_FLAGS } from '../../data/adminExpansionData';

export const AdminFeatureFlagsView: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlagItem[]>(() => {
    const saved = localStorage.getItem('supremeai_admin_feature_flags');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_FEATURE_FLAGS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'models' | 'multimodal' | 'agents' | 'security' | 'infra'>('all');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const toggleFlag = (key: string) => {
    const updated = flags.map((f) => {
      if (f.key === key) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    });
    setFlags(updated);
    localStorage.setItem('supremeai_admin_feature_flags', JSON.stringify(updated));

    // Try posting to backend /api/admin/feature-flags
    fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, enabled: !flags.find((f) => f.key === key)?.enabled }),
    }).catch(() => {});

    setSaveFeedback(`Flag "${key}" state updated successfully`);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const getCategoryIcon = (category: FeatureFlagItem['category']) => {
    switch (category) {
      case 'models':
        return <Cpu className="w-3.5 h-3.5 text-blue-400" />;
      case 'multimodal':
        return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
      case 'agents':
        return <Sliders className="w-3.5 h-3.5 text-purple-400" />;
      case 'security':
        return <Shield className="w-3.5 h-3.5 text-emerald-400" />;
      case 'infra':
        return <Server className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const filteredFlags = flags.filter((f) => {
    const matchesCat = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeCount = flags.filter((f) => f.enabled).length;

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto space-y-6 text-slate-800 dark:text-slate-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              feature_flags.py Parity
            </span>
            <span className="text-xs text-slate-400">Live Gateway Telemetry</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Feature Flags & Rollouts Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic kill switches, canary release controls, and runtime feature gates without redeploying containers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono">
            <span className="text-emerald-500 font-semibold">{activeCount}</span>
            <span className="text-slate-400"> / {flags.length} Flags Enabled</span>
          </div>
        </div>
      </div>

      {saveFeedback && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {(['all', 'models', 'multimodal', 'agents', 'security', 'infra'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flags by key or description..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Flag Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFlags.map((flag) => (
          <div
            key={flag.key}
            className={`p-5 rounded-2xl border transition-all ${
              flag.enabled
                ? 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 shadow-sm'
                : 'bg-slate-50/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800/80 opacity-80'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {getCategoryIcon(flag.category)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{flag.name}</h3>
                  <code className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">{flag.key}</code>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => toggleFlag(flag.key)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  flag.enabled ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    flag.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              {flag.description}
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
              <span className="text-slate-400 capitalize">
                Category: <strong className="text-slate-700 dark:text-slate-300">{flag.category}</strong>
              </span>
              <span
                className={`px-2 py-0.5 rounded font-mono font-medium ${
                  flag.enabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {flag.enabled ? 'ACTIVE' : 'DISABLED'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
