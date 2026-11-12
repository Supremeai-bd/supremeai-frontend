import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Ban,
  Plus,
  Trash2,
  Lock,
  AlertTriangle,
  Sliders,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { SecurityEventLog } from '../../types';

interface AdminSecurityViewProps {
  securityEvents: SecurityEventLog[];
  onAddBlockedIp: (ip: string, reason: string) => void;
  onRemoveBlockedIp: (ip: string) => void;
  blockedIps: { ip: string; reason: string; date: string }[];
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  securityEvents,
  onAddBlockedIp,
  onRemoveBlockedIp,
  blockedIps,
}) => {
  const [newIp, setNewIp] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  const handleBlockIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    onAddBlockedIp(newIp.trim(), newReason.trim() || 'Manual administrative block');
    setNewIp('');
    setNewReason('');
    setIsBlockModalOpen(false);
  };

  const criticalEvents = securityEvents.filter((e) => e.severity === 'critical' || e.severity === 'high');

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Security, Rate Limiting & Abuse Prevention
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              Zero-Trust Boundary Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit adversarial prompt injection attempts, inspect unauthorized traffic anomalies, manage global IP blacklists, and enforce customer rate limits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsBlockModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Ban className="w-4 h-4" />
          <span>Block Malicious IP</span>
        </button>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Active Security Incidents</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {criticalEvents.length} High/Critical
          </div>
          <div className="text-[10px] text-emerald-500 mt-1">100% Automatically Mitigated</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Prompt Jailbreak Defense</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">Active</div>
          <div className="text-[10px] text-slate-400 mt-1">Boundary regex + AST guard</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Blocked Origins / IPs</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {blockedIps.length} Disallowed
          </div>
          <div className="text-[10px] text-slate-400 mt-1">WAF rule synchronizer OK</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-400 font-medium">Secrets & Key Health</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">All Valid</div>
          <div className="text-[10px] text-slate-400 mt-1">0 expiring within 30 days</div>
        </div>
      </div>

      {/* Security Incident Log Feed */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          Recent Security Ingestion Events
        </h2>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Origin IP / Customer</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Action Taken</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {securityEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ev.severity === 'critical'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            : ev.severity === 'high'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {ev.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                      {ev.category}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[11px] text-slate-900 dark:text-white font-semibold">
                        {ev.sourceIp}
                      </div>
                      <div className="text-[10px] text-slate-400">{ev.customerEmail}</div>
                    </td>
                    <td className="px-4 py-3.5 max-w-sm truncate text-slate-600 dark:text-slate-400">
                      {ev.description}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {ev.blocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          BLOCKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          AUDITED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global IP Blacklist Manager */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Ban className="w-4 h-4 text-slate-500" />
          Active IP Blacklist & Access Firewall
        </h2>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="px-4 py-3">Blocked IP Address</th>
                <th className="px-4 py-3">Block Reason</th>
                <th className="px-4 py-3">Date Applied</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {blockedIps.map((b) => (
                <tr key={b.ip} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-rose-600 dark:text-rose-400">{b.ip}</td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">{b.reason}</td>
                  <td className="px-4 py-3.5 text-slate-400">{b.date}</td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onRemoveBlockedIp(b.ip)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Unblock IP"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD BLOCKED IP MODAL --- */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                Add Malicious IP to Blacklist
              </h3>
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBlockIp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  IPv4 / IPv6 Address or CIDR
                </label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="e.g. 198.51.100.44 or 45.154.0.0/16"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justification / Incident Tag
                </label>
                <input
                  type="text"
                  required
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="e.g. Repeated automated prompt injection bursts"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm IP Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
