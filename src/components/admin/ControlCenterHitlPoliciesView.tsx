import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  GitBranch,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sliders,
  UserCheck,
  Plus,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'hitl' | 'dag' | 'policies' | 'takeover';

export const ControlCenterHitlPoliciesView: React.FC = () => {
  const {
    hitlTickets,
    remediationPlans,
    executionPolicies,
    takeoverSessions,
    isLoadingHitl,
    loadHitlAndPolicies,
    generateDagPlan,
    toggleTakeover,
    requestGuardedAction,
  } = useControlCenterStore();
  const authUser = useAuthStore((s) => s.authUser);

  const [subTab, setSubTab] = useState<SubTab>('hitl');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [newPlanLayer, setNewPlanLayer] = useState('SCHEMA_PARITY_BREACH');

  useEffect(() => {
    loadHitlAndPolicies();
  }, [loadHitlAndPolicies]);

  const filteredTickets = hitlTickets.filter((t) => {
    const matchText =
      t.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchText) return false;
    if (statusFilter === 'pending') return t.status === 'pending';
    if (statusFilter === 'resolved') return t.status !== 'pending';
    return true;
  });

  const handleResolveTicket = (id: string, decision: 'approved' | 'rejected') => {
    const ticket = hitlTickets.find((t) => t.id === id);
    if (!ticket) return;
    requestGuardedAction({
      title: `${decision === 'approved' ? 'Approve' : 'Reject'} HITL Action: ${ticket.actionType}`,
      description: `Target service "${ticket.service}" requested by ${ticket.requestedBy}. ${ticket.blastRadius}`,
      impactSummary: ticket.dryRunDiff,
      riskLevel: ticket.riskLevel,
      onExecute: async (gate) => {
        const res = await controlCenterService.resolveHitlTicket(id, decision, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Validated HITL transition.');
        } else {
          await loadHitlAndPolicies();
          toast.success(`Ticket ${decision}`, `${ticket.id} marked ${decision}.`);
        }
      },
    });
  };

  const handleTogglePolicy = (id: string, name: string) => {
    requestGuardedAction({
      title: `Modify Execution Policy: ${name}`,
      description: 'Cycle enforcement posture across Enforce, Audit-Only, and Disabled.',
      impactSummary: `Policy ID: ${id}`,
      riskLevel: 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.togglePolicyRule(id, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Policy dry-run succeeded.');
        } else {
          await loadHitlAndPolicies();
          toast.success('Policy Updated', `${name} enforcement updated.`);
        }
      },
    });
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            HITL Approvals, Remediation & Policies
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Human-in-the-loop inbox, topological DAG remediation plans, MCP allowlist rules, and live session takeover.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadHitlAndPolicies()}
          disabled={isLoadingHitl}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHitl ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      <ControlCenterSafetyBar
        provenance="live-gateway"
        subtitle={`${hitlTickets.filter((t) => t.status === 'pending').length} pending HITL approvals · ${executionPolicies.length} policies`}
      />

      {/* Segmented Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'hitl' as SubTab, label: 'HITL Queue', icon: ShieldCheck },
            { id: 'dag' as SubTab, label: 'DAG Planner', icon: GitBranch },
            { id: 'policies' as SubTab, label: 'Execution Policies', icon: Sliders },
            { id: 'takeover' as SubTab, label: 'Session Takeover', icon: UserCheck },
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

        {subTab === 'hitl' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter service or reason..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              {(['all', 'pending', 'resolved'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium capitalize whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === f
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {subTab === 'hitl' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
          {isLoadingHitl && hitlTickets.length === 0 ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                No matching HITL approval tickets
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All guarded operations in this filter have been reviewed or cleared.
              </p>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div key={ticket.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {ticket.service} · {ticket.actionType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={`font-medium inline-flex items-center gap-1 ${
                        ticket.riskLevel === 'critical'
                          ? 'text-rose-600 dark:text-rose-400'
                          : ticket.riskLevel === 'high'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Risk: {ticket.riskLevel}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {ticket.requestedBy} · {ticket.createdAt}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{ticket.reason}</p>
                  <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    {ticket.dryRunDiff}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ticket.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(ticket.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveTicket(ticket.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-medium inline-flex items-center gap-1 ${
                        ticket.status === 'approved'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {ticket.status === 'approved' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      Status: {ticket.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {subTab === 'dag' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <select
                value={newPlanLayer}
                onChange={(e) => setNewPlanLayer(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
              >
                <option value="SCHEMA_PARITY_BREACH">SCHEMA_PARITY_BREACH</option>
                <option value="RELEASE_COMMIT_MISMATCH">RELEASE_COMMIT_MISMATCH</option>
                <option value="UPSTREAM_DEPENDENCY_FAILURE">UPSTREAM_DEPENDENCY_FAILURE</option>
                <option value="HIGH_P95_LATENCY_SPIKE">HIGH_P95_LATENCY_SPIKE</option>
              </select>
              <button
                type="button"
                onClick={() => generateDagPlan('api', newPlanLayer, authUser?.email)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Synthesize DAG Waves</span>
              </button>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Topological acyclic wave planner via system_plan
            </span>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {remediationPlans.map((plan) => (
              <div key={plan.planId} className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {plan.failureLayer} · <span className="font-mono">{plan.planId}</span>
                  </div>
                  <div className="font-mono text-slate-500 dark:text-slate-400">
                    DAG Valid: {plan.dagValid ? 'Yes' : 'No'} · Created {plan.createdAt}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{plan.goal}</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                        <th className="py-2 pr-3 font-medium">Wave</th>
                        <th className="py-2 pr-3 font-medium">Step</th>
                        <th className="py-2 pr-3 font-medium">Tool</th>
                        <th className="py-2 pr-3 font-medium">Gate</th>
                        <th className="py-2 text-right font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                      {plan.steps.map((step) => (
                        <tr key={step.id} className="h-10">
                          <td className="pr-3 font-mono tabular-nums">Wave {step.wave}</td>
                          <td className="pr-3 text-slate-900 dark:text-slate-100">{step.title}</td>
                          <td className="pr-3 font-mono text-slate-500">{step.tool}</td>
                          <td className="pr-3 text-slate-500">
                            {step.approvalRequired ? 'HITL Token' : 'Auto'}
                          </td>
                          <td className="text-right font-medium capitalize text-slate-700 dark:text-slate-200">
                            {step.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'policies' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Policy Rule</th>
                <th className="px-4 py-3 font-medium">Scope</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {executionPolicies.map((rule) => (
                <tr key={rule.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-900 dark:text-white">{rule.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{rule.description}</div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">{rule.scope}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{rule.target}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`font-medium ${
                        rule.mode === 'enforce'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : rule.mode === 'audit-only'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {rule.mode}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleTogglePolicy(rule.id, rule.name)}
                      className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      Cycle Mode
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'takeover' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
          {takeoverSessions.map((sess) => (
            <div key={sess.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{sess.customerEmail}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{sess.agentId}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={`font-medium ${
                      sess.status === 'human-takeover'
                        ? 'text-amber-600 dark:text-amber-400'
                        : sess.status === 'escalated'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {sess.status}
                  </span>
                </div>
                <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{sess.topic}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {sess.lastMessagePreview} · Started {sess.startedAt}
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleTakeover(sess.id, authUser?.email)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  sess.status === 'human-takeover'
                    ? 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    : 'theme-btn-primary'
                }`}
              >
                {sess.status === 'human-takeover' ? 'Return to Autonomous Agent' : 'Assume Human Control'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
