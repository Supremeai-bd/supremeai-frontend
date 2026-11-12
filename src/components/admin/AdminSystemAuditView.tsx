import React, { useState } from 'react';
import {
  FileCheck2,
  GitBranch,
  GitCommit,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  Clock,
  User,
  Search,
} from 'lucide-react';
import { SystemAuditRecord } from '../../types';

interface AdminSystemAuditViewProps {
  auditRecords: SystemAuditRecord[];
}

export const AdminSystemAuditView: React.FC<AdminSystemAuditViewProps> = ({
  auditRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = auditRecords.filter((rec) => {
    const q = searchTerm.toLowerCase();
    return (
      rec.actor.toLowerCase().includes(q) ||
      rec.action.toLowerCase().includes(q) ||
      rec.resource.toLowerCase().includes(q) ||
      rec.details.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Audit & Release Verification
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              Immutable Audit Log
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track administrative actions, verify GitHub release parity, and monitor CI/CD pipeline health across SupremeAI repositories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Supremeai-bd"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            <span>GitHub Organization</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* GitHub Release & CI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supremeai Repo */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Supremeai-bd / supremeai</h3>
                <p className="text-[11px] text-slate-400">Primary Core Daemon & MCP Gateway Engine</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              CI Passing (v2.4.1)
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Latest Commit:</span>
              <span className="text-slate-800 dark:text-slate-200">#42a18b: chore(deps): bump @google/genai</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Release Artifact:</span>
              <span className="text-slate-800 dark:text-slate-200">docker.pkg.github.com/supremeai:v2.4.1</span>
            </div>
          </div>
        </div>

        {/* Supremeai-studio Repo */}
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400">
                <GitCommit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Supremeai-bd / supremeai-studio</h3>
                <p className="text-[11px] text-slate-400">Developer Studio & Unified Workspace Frontend</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              CI Passing (v1.8.4)
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Active Build:</span>
              <span className="text-slate-800 dark:text-slate-200">Vite 8 + React 19 + Node 22</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Live Health:</span>
              <span className="text-emerald-500 font-semibold">100% Operational (Port 3000)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Audit Trail */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-blue-600" />
            Administrative Action Audit Trail
          </h2>

          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target Resource</th>
                  <th className="px-4 py-3">Event Details</th>
                  <th className="px-4 py-3">IP Origin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {rec.timestamp}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      {rec.actor}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {rec.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-white">
                      {rec.resource}
                    </td>
                    <td className="px-4 py-3.5 max-w-sm truncate text-slate-600 dark:text-slate-400">
                      {rec.details}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                      {rec.ipAddress}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
