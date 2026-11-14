import React, { useEffect, useState } from 'react';
import {
  Brain,
  Database,
  GitFork,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'memory' | 'qdrant' | 'ast';

export const ControlCenterMemoryGraphView: React.FC = () => {
  const {
    memoryEntries,
    memoryProvenance,
    qdrantCollections,
    astMatches,
    isLoadingMemory,
    loadMemoryAndGraph,
    learnMemory,
    queryAstGraph,
    requestGuardedAction,
  } = useControlCenterStore();
  const authUser = useAuthStore((s) => s.authUser);

  const [subTab, setSubTab] = useState<SubTab>('memory');
  const [tierFilter, setTierFilter] = useState<'all' | 'episodic' | 'semantic' | 'procedural'>('all');
  const [newTier, setNewTier] = useState<'episodic' | 'semantic' | 'procedural'>('semantic');
  const [newFact, setNewFact] = useState('');
  const [verifyAsTrusted, setVerifyAsTrusted] = useState(true);
  const [astQuery, setAstQuery] = useState('');
  const [isQueryingAst, setIsQueryingAst] = useState(false);

  useEffect(() => {
    loadMemoryAndGraph();
  }, [loadMemoryAndGraph]);

  const filteredEntries = memoryEntries.filter((m) =>
    tierFilter === 'all' ? true : m.tier === tierFilter
  );

  const quarantinedCount = memoryEntries.filter((m) => m.status === 'quarantined').length;

  const handleRecordFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    await learnMemory(
      newTier,
      newFact.trim(),
      verifyAsTrusted ? authUser?.email || 'admin@supremeai.bd' : undefined
    );
    setNewFact('');
  };

  const handlePromoteStatus = (id: string, status: 'candidate' | 'trusted' | 'quarantined', fact: string) => {
    requestGuardedAction({
      title: `Memory Governance: Mark ${status}`,
      description: `Transition memory record "${id}" to "${status}" across the active cognitive graph.`,
      impactSummary: fact,
      riskLevel: status === 'quarantined' ? 'high' : 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.promoteMemoryEntry(id, status, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || `Validated memory transition -> ${status}.`);
        } else {
          await loadMemoryAndGraph();
          toast.success('Memory Updated', `${id} marked ${status}.`);
        }
      },
    });
  };

  const handleQuarantineWipe = () => {
    requestGuardedAction({
      title: 'GDPR Quarantine Memory Wipe',
      description: `Permanently purge ${quarantinedCount} quarantined memory record(s) and stale embeddings.`,
      impactSummary: `DELETE memory_entries WHERE status = 'quarantined' (${quarantinedCount} record(s))`,
      riskLevel: 'critical',
      onExecute: async (gate) => {
        const res = await controlCenterService.wipeQuarantinedMemory(gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Validated quarantine wipe.');
        } else {
          await loadMemoryAndGraph();
          toast.success('Quarantine Purged', `Removed ${res.removed ?? 0} quarantined record(s).`);
        }
      },
    });
  };

  const handleSearchAst = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsQueryingAst(true);
    try {
      await queryAstGraph(astQuery);
    } finally {
      setIsQueryingAst(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Memory Governance, Vector DB & AST Graph
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            3-tier episodic/semantic/procedural memory curation, Qdrant cluster telemetry, and Supremeai-bd/supremeai AST explorer.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadMemoryAndGraph()}
            disabled={isLoadingMemory}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMemory ? 'animate-spin' : ''}`} />
            <span>Sync Memory</span>
          </button>

          {quarantinedCount > 0 && (
            <button
              type="button"
              onClick={handleQuarantineWipe}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Quarantined ({quarantinedCount})</span>
            </button>
          )}
        </div>
      </div>

      <ControlCenterSafetyBar
        provenance={memoryProvenance}
        subtitle={`${memoryEntries.length} governed records · ${qdrantCollections.length} Qdrant collections · ${astMatches.length} AST symbols`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'memory' as SubTab, label: '3-Tier Memory', icon: Brain },
            { id: 'qdrant' as SubTab, label: 'Qdrant Vector DB', icon: Database },
            { id: 'ast' as SubTab, label: 'Codebase AST Graph', icon: GitFork },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {subTab === 'memory' && (
          <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {(['all', 'episodic', 'semantic', 'procedural'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setTierFilter(tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                  tierFilter === tier
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        )}
      </div>

      {subTab === 'memory' && (
        <div className="space-y-4">
          {/* Record Verified Fact Form */}
          <form
            onSubmit={handleRecordFact}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center gap-3"
          >
            <select
              value={newTier}
              onChange={(e) => setNewTier(e.target.value as 'episodic' | 'semantic' | 'procedural')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-medium"
            >
              <option value="semantic">Semantic Fact</option>
              <option value="procedural">Procedural Invariant</option>
              <option value="episodic">Episodic Trace</option>
            </select>
            <input
              type="text"
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="Record operator knowledge fact or operational constraint..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500"
            />
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={verifyAsTrusted}
                onChange={(e) => setVerifyAsTrusted(e.target.checked)}
              />
              <span>Mark Trusted</span>
            </label>
            <button
              type="submit"
              disabled={!newFact.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Commit Fact</span>
            </button>
          </form>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {isLoadingMemory && memoryEntries.length === 0 ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No memory records match the selected tier filter.
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-mono font-semibold text-slate-900 dark:text-white uppercase">
                        {entry.tier}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          entry.status === 'trusted'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : entry.status === 'quarantined'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {entry.status === 'trusted' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                        Status: {entry.status}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        Source: {entry.source} · {entry.createdAt}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                      {entry.fact}
                    </p>
                    {entry.verifiedBy && (
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        Verified by: {entry.verifiedBy}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {entry.status !== 'trusted' && (
                      <button
                        type="button"
                        onClick={() => handlePromoteStatus(entry.id, 'trusted', entry.fact)}
                        className="px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Promote Trusted
                      </button>
                    )}
                    {entry.status !== 'quarantined' && (
                      <button
                        type="button"
                        onClick={() => handlePromoteStatus(entry.id, 'quarantined', entry.fact)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Quarantine
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === 'qdrant' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Collection Name</th>
                <th className="px-4 py-3 font-medium">Vectors Count</th>
                <th className="px-4 py-3 font-medium">Dimensions</th>
                <th className="px-4 py-3 font-medium">Distance Metric</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {qdrantCollections.map((col) => (
                <tr key={col.name} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                    {col.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {col.vectorsCount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                    {col.dimensions}d
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{col.distance}</td>
                  <td className="px-4 py-2.5 text-right font-medium">
                    <span
                      className={
                        col.status === 'green'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {col.status === 'green' ? 'Green · Indexed' : 'Yellow · Optimizing'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'ast' && (
        <div className="space-y-4">
          <form
            onSubmit={handleSearchAst}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3"
          >
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={astQuery}
                onChange={(e) => setAstQuery(e.target.value)}
                placeholder="Query AST graph symbols (e.g. control_plane, AutoHealer, validate_mcp_allowlist)..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isQueryingAst}
              className="px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isQueryingAst ? 'Querying Graph...' : 'Run AST Query'}
            </button>
          </form>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Symbol</th>
                  <th className="px-4 py-3 font-medium">Module Path</th>
                  <th className="px-4 py-3 font-medium">Kind</th>
                  <th className="px-4 py-3 font-medium">Edges</th>
                  <th className="px-4 py-3 font-medium">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {astMatches.map((node) => (
                  <tr key={node.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                      {node.symbol}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500">{node.modulePath}</td>
                    <td className="px-4 py-2.5 capitalize text-slate-700 dark:text-slate-300">{node.kind}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {node.connections}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{node.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
