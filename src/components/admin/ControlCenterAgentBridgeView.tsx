import React, { useEffect, useState } from 'react';
import {
  Bot,
  GitPullRequest,
  RefreshCw,
  CheckCircle2,
  Clock,
  Activity,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'agents' | 'bridge' | 'healer';

export const ControlCenterAgentBridgeView: React.FC = () => {
  const {
    externalAgents,
    bridgeWorkOrders,
    bridgeProvenance,
    healerIncidents,
    isLoadingBridge,
    loadExternalAgentsAndBridge,
    loadHitlAndPolicies,
    requestGuardedAction,
  } = useControlCenterStore();

  const [subTab, setSubTab] = useState<SubTab>('bridge');

  useEffect(() => {
    loadExternalAgentsAndBridge();
    loadHitlAndPolicies();
  }, [loadExternalAgentsAndBridge, loadHitlAndPolicies]);

  const handleBridgeAction = (issueNumber: number, action: 'claim' | 'renew' | 'release') => {
    requestGuardedAction({
      title: `Bridge Work Order #${issueNumber}: ${action.toUpperCase()}`,
      description: `Execute S0.1 atomic lease transition (${action}) on Supremeai-bd/supremeai-open.`,
      impactSummary: `issueNumber=${issueNumber} · action=${action}`,
      riskLevel: 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.bridgeWorkAction(issueNumber, action, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Lease transition verified.');
        } else {
          await loadExternalAgentsAndBridge();
          toast.success('Bridge Lease Updated', `Issue #${issueNumber} (${action}) completed.`);
        }
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            External Agents, Bridge Work & Auto-Healer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Federated agent leases (manus_niloyjoy7), open Bridge Work Orders, heartbeats, and self-healing circuit states.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadExternalAgentsAndBridge()}
          disabled={isLoadingBridge}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBridge ? 'animate-spin' : ''}`} />
          <span>Sync Bridge Queue</span>
        </button>
      </div>

      <ControlCenterSafetyBar
        provenance={bridgeProvenance}
        subtitle={`${externalAgents.length} federated agents · ${bridgeWorkOrders.length} work orders`}
      />

      <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'bridge' as SubTab, label: 'Bridge Work Orders', icon: GitPullRequest },
          { id: 'agents' as SubTab, label: 'External Agent Registry', icon: Bot },
          { id: 'healer' as SubTab, label: 'Auto-Healer & Circuits', icon: Activity },
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

      {subTab === 'bridge' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
          {bridgeWorkOrders.map((order) => (
            <div key={order.issueNumber} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    #{order.issueNumber}
                  </span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{order.title}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Status: {order.status}</span>
                  {order.claimedBy && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Holder: {order.claimedBy}</span>
                    </>
                  )}
                  {typeof order.leaseExpiresInMin === 'number' && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Lease {order.leaseExpiresInMin}m left
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{order.labels.join(' / ')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {order.status === 'unclaimed' && (
                  <button
                    type="button"
                    onClick={() => handleBridgeAction(order.issueNumber, 'claim')}
                    className="px-3 py-1.5 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Claim Work Order
                  </button>
                )}
                {order.status === 'claimed' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleBridgeAction(order.issueNumber, 'renew')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Renew +30m
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBridgeAction(order.issueNumber, 'release')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Release Lease
                    </button>
                  </>
                )}
                {order.status === 'submitted' && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Patch Submitted
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'agents' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Agent Identity</th>
                <th className="px-4 py-3 font-medium">MCP Endpoint</th>
                <th className="px-4 py-3 font-medium">Trust Scope</th>
                <th className="px-4 py-3 font-medium text-right">Leases</th>
                <th className="px-4 py-3 font-medium text-right">Heartbeat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {externalAgents.map((agent) => (
                <tr key={agent.id} className="h-11">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900 dark:text-white">{agent.displayName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{agent.agentKey}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{agent.endpointPath}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {agent.trustScope}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">{agent.activeLeases}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-emerald-600 dark:text-emerald-400">
                    {agent.status} · {agent.heartbeatAgo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'healer' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Fingerprint</th>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Remediation Applied</th>
                <th className="px-4 py-3 font-medium">Circuit</th>
                <th className="px-4 py-3 font-medium text-right">Occurred</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {healerIncidents.map((inc) => (
                <tr key={inc.id} className="h-11">
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">{inc.fingerprint}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{inc.component}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{inc.actionTaken}</td>
                  <td className="px-4 py-2.5 font-medium capitalize text-amber-600 dark:text-amber-400">
                    {inc.circuitState}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-slate-500">{inc.occurredAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
