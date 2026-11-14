import React, { useEffect, useState } from 'react';
import {
  GitCommit,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Rocket,
  Server,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'provenance' | 'preflight' | 'pipelines';

export const ControlCenterReleaseGateView: React.FC = () => {
  const {
    latestGithubCommit,
    releases,
    pipelines,
    isLoadingReleases,
    loadReleaseGate,
    requestGuardedAction,
  } = useControlCenterStore();

  const [subTab, setSubTab] = useState<SubTab>('provenance');
  const [rollbackSha, setRollbackSha] = useState('8c1d0e4');

  useEffect(() => {
    loadReleaseGate();
  }, [loadReleaseGate]);

  const handleReleaseAction = (action: 'restart' | 'redeploy' | 'rollback', service: string) => {
    requestGuardedAction({
      title: `ReleaseGate Action: ${action.toUpperCase()} (${service})`,
      description: `Dispatch ${action} through system_execute safety gate for ${service}. Requires approval token and idempotency key in HITL mode.`,
      impactSummary:
        action === 'rollback'
          ? `service=${service} · rollbackTargetCommit=${rollbackSha}`
          : `service=${service} · action=${action} · selective CI verification`,
      riskLevel: action === 'rollback' ? 'critical' : 'high',
      onExecute: async (gate) => {
        const res = await controlCenterService.executeReleaseAction(
          action,
          service,
          action === 'rollback' ? rollbackSha : undefined,
          gate
        );
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message);
        } else {
          toast.success('Release Action Executed', res.message);
          await loadReleaseGate();
        }
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Release Gate, Render Preflight & CI/CD
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            GitHub commit SHA provenance vs. Render deployments, build-minute guards, Harness pipelines, and safe rollbacks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadReleaseGate()}
          disabled={isLoadingReleases}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingReleases ? 'animate-spin' : ''}`} />
          <span>Verify Release SHA</span>
        </button>
      </div>

      <ControlCenterSafetyBar
        provenance={latestGithubCommit?.provenance || 'local-snapshot'}
        subtitle={
          latestGithubCommit
            ? `HEAD ${latestGithubCommit.sha} · "${latestGithubCommit.message.slice(0, 60)}"`
            : 'Comparing Supremeai-bd/supremeai main commit'
        }
      />

      <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'provenance' as SubTab, label: 'Commit Provenance', icon: GitCommit },
          { id: 'preflight' as SubTab, label: 'Render Preflight & Guard', icon: Server },
          { id: 'pipelines' as SubTab, label: 'Harness CI Pipelines', icon: Rocket },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
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

      {subTab === 'provenance' && (
        <div className="space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Render Service</th>
                  <th className="px-4 py-3 font-medium">GitHub SHA</th>
                  <th className="px-4 py-3 font-medium">Deployed SHA</th>
                  <th className="px-4 py-3 font-medium">Parity Status</th>
                  <th className="px-4 py-3 text-right font-medium">Guarded Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {releases.map((rel) => (
                  <tr key={rel.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-900 dark:text-white">{rel.serviceName}</div>
                      <div className="text-[11px] font-mono text-slate-500">{rel.runtime}</div>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums">{rel.githubSha}</td>
                    <td className="px-4 py-2.5 font-mono tabular-nums">{rel.deployedSha}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          rel.shaMatch
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {rel.shaMatch ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {rel.shaMatch ? 'SHA Matched' : 'Drift Detected'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleReleaseAction('restart', rel.serviceName)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                      >
                        Restart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReleaseAction('redeploy', rel.serviceName)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium cursor-pointer"
                      >
                        Redeploy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Safe Rollback Target (system_execute Gate)
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Requires explicit target commit SHA, dry-run validation, and HITL approval token.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rollbackSha}
                onChange={(e) => setRollbackSha(e.target.value)}
                placeholder="Commit SHA"
                className="w-32 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => handleReleaseAction('rollback', 'supremeai-api')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rollback API</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {subTab === 'preflight' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Health Probe Path</th>
                <th className="px-4 py-3 font-medium text-right">Build Minutes Used</th>
                <th className="px-4 py-3 font-medium text-right">Monthly Limit</th>
                <th className="px-4 py-3 font-medium text-right">Preflight Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {releases.map((rel) => (
                <tr key={rel.id} className="h-11">
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">{rel.serviceName}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{rel.healthCheckPath}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{rel.buildMinutesUsed}m</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{rel.buildMinutesLimit}m</td>
                  <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    autoDeploy: false · Guarded
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'pipelines' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Harness Pipeline</th>
                <th className="px-4 py-3 font-medium">Environment</th>
                <th className="px-4 py-3 font-medium">SHA</th>
                <th className="px-4 py-3 font-medium text-right">Duration</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {pipelines.map((p) => (
                <tr key={p.id} className="h-11">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900 dark:text-white">{p.pipelineName}</div>
                    <div className="text-[11px] text-slate-500">{p.triggeredBy} · {p.startedAt}</div>
                  </td>
                  <td className="px-4 py-2.5">{p.environment}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums">{p.commitSha}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{p.durationSec}s</td>
                  <td className="px-4 py-2.5 text-right font-medium capitalize">
                    <span
                      className={
                        p.status === 'succeeded'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : p.status === 'waiting-approval'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
