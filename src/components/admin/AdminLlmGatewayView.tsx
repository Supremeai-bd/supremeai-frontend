import React, { useState } from 'react';
import {
  Route,
  Zap,
  TrendingUp,
  DollarSign,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LlmGatewayRoute } from '../../types';

interface AdminLlmGatewayViewProps {
  routes: LlmGatewayRoute[];
  onToggleFailover: (routeId: string) => void;
  onUpdatePrice: (routeId: string, newPrice: number) => void;
}

export const AdminLlmGatewayView: React.FC<AdminLlmGatewayViewProps> = ({
  routes,
  onToggleFailover,
  onUpdatePrice,
}) => {
  const [selectedRoute, setSelectedRoute] = useState<LlmGatewayRoute>(routes[0]);

  const totalRpm = routes.reduce((acc, r) => acc + r.requestsPerMin, 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              LLM Gateway & Cost Guard
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              Intelligent Model Router
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic provider routing (Vertex AI vs AI Studio Direct), automated 503 load fallbacks, token pricing margins, and error rate circuit breakers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
            Current Gateway Traffic: {totalRpm} RPM
          </span>
        </div>
      </div>

      {/* Gateway Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Gateway Health Score</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">99.98%</div>
          <div className="text-[10px] text-slate-400 mt-1">Global 4-Region Cluster</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Avg Gateway Latency</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">28 ms</div>
          <div className="text-[10px] text-emerald-500 mt-1">Brokered via Node 22</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Auto-Failover Circuit</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">Arm & Ready</div>
          <div className="text-[10px] text-slate-400 mt-1">503 / High Demand Guard</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Blended Gross Margin</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">64.2%</div>
          <div className="text-[10px] text-purple-500 mt-1">Token Wholesale vs Retail</div>
        </div>
      </div>

      {/* Model Routes List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Route className="w-4 h-4 text-blue-600" />
          Active Model Routing Policies
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routes.map((route) => {
            const margin = Math.round(
              ((route.customerPricePer1M - (route.costPer1MIn + route.costPer1MOut) / 2) /
                route.customerPricePer1M) *
                100
            );

            return (
              <div
                key={route.id}
                className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      {route.displayName}
                    </h3>
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 mt-1">
                      <span>ID: {route.modelId}</span>
                      <span>·</span>
                      <span>{route.requestsPerMin} req/min</span>
                    </div>
                  </div>

                  {/* Failover switch */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">Auto-Failover</span>
                    <button
                      type="button"
                      onClick={() => onToggleFailover(route.id)}
                      className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {route.autoFailoverActive ? (
                        <ToggleRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Routing Pathway */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Primary Endpoint:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {route.primaryProvider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Backup Failover:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {route.fallbackProvider}
                    </span>
                  </div>
                </div>

                {/* Cost Guard & Margins */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-[10px] text-slate-400">In/Out Cost</div>
                    <div className="font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      ${route.costPer1MIn}/${route.costPer1MOut}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-[10px] text-slate-400">Retail Rate</div>
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      ${route.customerPricePer1M.toFixed(2)}/1M
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                    <div className="text-[10px] text-slate-400">Gross Margin</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{margin}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
