import React, { useState } from 'react';
import { ArrowRight, Gauge, Lock } from 'lucide-react';
import { GEMINI_MODELS } from '../data/models';
import { ModelDetail, PlanTier } from '../types';
import { usePlatformStore } from '../stores/usePlatformStore';
import { useAuthStore } from '../stores/useAuthStore';
import { env } from '../config/env';

interface ModelMatrixProps {
  activeModel: ModelDetail;
  onSelectModel: (model: ModelDetail) => void;
  onNavigateToChat: () => void;
}

const TIER_RANK: Record<PlanTier, number> = {
  Free: 0,
  Pro: 1,
  Enterprise: 2,
};

export const ModelMatrix: React.FC<ModelMatrixProps> = ({
  activeModel,
  onSelectModel,
  onNavigateToChat,
}) => {
  const [latencyResults, setLatencyResults] = useState<Record<string, { ms: number; status: 'ok' | 'error' }>>({});
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const modelPolicies = usePlatformStore((s) => s.config.modelPolicies);
  const currentRole = useAuthStore((s) => s.currentRole);
  const authUser = useAuthStore((s) => s.authUser);
  const userTier: PlanTier = authUser?.plan || 'Pro';

  const testModelLatency = async (modelId: string) => {
    setTestingModelId(modelId);
    const start = performance.now();

    try {
      const response = await fetch(`${env.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelId,
          messages: [{ role: 'user', content: 'Ping. Answer with single word: OK' }],
          stream: false,
          userContext: {
            email: authUser?.email,
            role: currentRole,
            tier: userTier,
          },
        }),
      });

      const end = performance.now();
      const duration = Math.round(end - start);

      setLatencyResults((prev) => ({
        ...prev,
        [modelId]: { ms: duration, status: response.ok ? 'ok' : 'error' },
      }));
    } catch {
      setLatencyResults((prev) => ({
        ...prev,
        [modelId]: { ms: 0, status: 'error' },
      }));
    } finally {
      setTestingModelId(null);
    }
  };

  const handleApplyAndChat = (model: ModelDetail) => {
    onSelectModel(model);
    onNavigateToChat();
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Gemini Intelligence Matrix
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
          Specification, governance status, reasoning capabilities, and throughput benchmarks across Gemini foundation models deployed in SupremeAI Studio.
        </p>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {GEMINI_MODELS.map((model) => {
          const isActive = model.id === activeModel.id;
          const pingData = latencyResults[model.id];
          const isPinging = testingModelId === model.id;
          const policy = modelPolicies[model.id] || { enabled: true, minTier: 'Free' };
          const isBlocked =
            currentRole !== 'admin' &&
            (!policy.enabled || TIER_RANK[userTier] < TIER_RANK[policy.minTier]);

          return (
            <div
              key={model.id}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-800/90 border-slate-900 dark:border-white shadow-sm ring-1 ring-slate-900 dark:ring-white'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {model.alias}
                  </span>
                  {!policy.enabled ? (
                    <span className="text-[10px] font-mono font-semibold text-rose-500">
                      Disabled
                    </span>
                  ) : isActive ? (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">
                      {policy.minTier}+
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isBlocked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  <span>{model.name}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {model.tagline}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Context Window</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {model.contextTokens}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Reasoning Depth</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {model.reasoningCapability}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min Plan Tier</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {policy.minTier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Roundtrip Latency</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {pingData ? (
                        pingData.status === 'ok' ? (
                          `${pingData.ms}ms`
                        ) : (
                          <span className="text-rose-500">Error</span>
                        )
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-2">
                <button
                  type="button"
                  onClick={() => testModelLatency(model.id)}
                  disabled={isPinging}
                  className="w-full py-1.5 px-3 rounded-md text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isPinging ? 'Pinging...' : 'Benchmark Ping'}</span>
                </button>

                <button
                  type="button"
                  disabled={isBlocked}
                  onClick={() => handleApplyAndChat(model)}
                  className={`w-full py-1.5 px-3 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    isBlocked
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      : isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 cursor-pointer'
                      : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 cursor-pointer'
                  }`}
                >
                  <span>
                    {isBlocked
                      ? !policy.enabled
                        ? 'Disabled by Admin'
                        : `Requires ${policy.minTier}`
                      : isActive
                      ? 'Chat with Model'
                      : 'Select & Chat'}
                  </span>
                  {!isBlocked && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Domain Architectural Table */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Task Alignment & Architecture Matrix
          </h2>
          <span className="text-xs text-slate-400">SupremeAI Model Standard v2.4</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3.5">Model Name</th>
                <th className="p-3.5">Target Workload</th>
                <th className="p-3.5">Inference Profile</th>
                <th className="p-3.5">Recommended Supreme Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-sans">
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                  gemini-3.8-flash
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                  General tasks, summarization, proofreading, code assistance
                </td>
                <td className="p-3.5 text-slate-500">Fast streaming, 1M context, high concurrency</td>
                <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                  Supreme Generalist
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                  gemini-3.1-flash-lite
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                  Tasks that should happen fast: regex, shell commands, syntax conversion
                </td>
                <td className="p-3.5 text-slate-500">Sub-second latency, lightweight compute</td>
                <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                  Fast Code Synthesizer
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                  gemini-4-carbon
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                  Deep reasoning tasks, root-cause architecture analysis, security invariants
                </td>
                <td className="p-3.5 text-slate-500">Deep chain-of-thought, extended validation</td>
                <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                  Systems Architect / Security Auditor
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                  gemini-4-argon
                </td>
                <td className="p-3.5 text-slate-600 dark:text-slate-300">
                  Particularly complex interactive tasks, heavy full-stack refactoring
                </td>
                <td className="p-3.5 text-slate-500">Multi-turn tool-calling, agentic orchestration</td>
                <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                  Full-Stack Specialist
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
