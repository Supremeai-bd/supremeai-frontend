import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Play,
  Eye,
  X,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { useAuthStore } from '../../stores/useAuthStore';
import type { ControlPlaneSafetyMode, DataProvenance } from '../../types/controlCenter';

const PROVENANCE_LABELS: Record<DataProvenance, string> = {
  'live-mcp': 'Live MCP Tower',
  'live-gateway': 'Live Backend Gateway',
  'live-github': 'Live GitHub Main',
  'local-snapshot': 'Resilient Snapshot Fallback',
};

interface ControlCenterSafetyBarProps {
  provenance?: DataProvenance;
  subtitle?: string;
}

export const ControlCenterSafetyBar: React.FC<ControlCenterSafetyBarProps> = ({
  provenance = 'local-snapshot',
  subtitle,
}) => {
  const safetyMode = useControlCenterStore((s) => s.safetyMode);
  const setSafetyMode = useControlCenterStore((s) => s.setSafetyMode);
  const authUser = useAuthStore((s) => s.authUser);

  const modes: { id: ControlPlaneSafetyMode; label: string }[] = [
    { id: 'read-only', label: 'Read-Only' },
    { id: 'dry-run-hitl', label: 'Dry-Run + HITL' },
    { id: 'operator-override', label: 'Fast Override' },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="font-medium text-slate-900 dark:text-slate-100">
          Source: {PROVENANCE_LABELS[provenance]}
        </span>
        {subtitle && (
          <>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 dark:text-slate-400">{subtitle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Safety Mode:
        </span>
        <div
          role="group"
          aria-label="Control Center safety posture"
          className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          {modes.map((m) => {
            const active = safetyMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSafetyMode(m.id, authUser?.email)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? m.id === 'operator-override'
                      ? 'bg-rose-600 text-white'
                      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ControlCenterSafetyGateModal: React.FC = () => {
  const safetyMode = useControlCenterStore((s) => s.safetyMode);
  const setSafetyMode = useControlCenterStore((s) => s.setSafetyMode);
  const pendingGate = useControlCenterStore((s) => s.pendingGate);
  const isExecutingGate = useControlCenterStore((s) => s.isExecutingGate);
  const closeGuardedAction = useControlCenterStore((s) => s.closeGuardedAction);
  const executeGuardedAction = useControlCenterStore((s) => s.executeGuardedAction);
  const authUser = useAuthStore((s) => s.authUser);

  const [approvalToken, setApprovalToken] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState('');

  useEffect(() => {
    if (pendingGate) {
      setApprovalToken('');
      setIdempotencyKey(`idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`);
    }
  }, [pendingGate]);

  if (!pendingGate) return null;

  const isReadOnly = safetyMode === 'read-only';
  const requiresToken = safetyMode === 'dry-run-hitl';
  const canExecuteLive =
    !isReadOnly &&
    (!requiresToken || (approvalToken.trim().length >= 4 && idempotencyKey.trim().length >= 8));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-800 dark:text-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {pendingGate.riskLevel === 'critical' ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {pendingGate.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Risk: {pendingGate.riskLevel.toUpperCase()} · Posture: {safetyMode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeGuardedAction}
            aria-label="Close safety gate"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            {pendingGate.description}
          </p>

          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-all">
            {pendingGate.impactSummary}
          </div>

          {isReadOnly && (
            <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Read-Only mode blocks live state changes. Run Dry-Run or switch posture.</span>
              </div>
              <button
                type="button"
                onClick={() => setSafetyMode('dry-run-hitl', authUser?.email)}
                className="px-2.5 py-1 rounded-md border border-amber-400 dark:border-amber-700 font-medium whitespace-nowrap shrink-0 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Enable HITL Mode
              </button>
            </div>
          )}

          {requiresToken && (
            <div className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700 dark:text-slate-300">
                    HITL Approval Token
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setApprovalToken(`HITL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)
                    }
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Issue Admin Token</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={approvalToken}
                  onChange={(e) => setApprovalToken(e.target.value)}
                  placeholder="Enter approval token (min 4 chars)"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Idempotency Key
                </label>
                <input
                  type="text"
                  value={idempotencyKey}
                  onChange={(e) => setIdempotencyKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-950/50">
          <button
            type="button"
            disabled={isExecutingGate}
            onClick={() =>
              executeGuardedAction({
                dryRun: true,
                actor: authUser?.email || 'admin@supremeai.bd',
              })
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Dry-Run Preview</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeGuardedAction}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canExecuteLive || isExecutingGate}
              onClick={() =>
                executeGuardedAction({
                  dryRun: false,
                  approvalToken: approvalToken.trim() || 'ADMIN_OVERRIDE',
                  idempotencyKey: idempotencyKey.trim() || `idem_${Date.now()}`,
                  actor: authUser?.email || 'admin@supremeai.bd',
                })
              }
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isExecutingGate ? 'Executing...' : 'Execute Live'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
