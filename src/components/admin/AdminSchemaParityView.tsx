import React, { useState } from 'react';
import {
  Database,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Shield,
  Layers,
  Table,
  Check,
} from 'lucide-react';
import { SchemaParityTable } from '../../types';

interface AdminSchemaParityViewProps {
  tables: SchemaParityTable[];
  onRunParitySync: () => void;
}

export const AdminSchemaParityView: React.FC<AdminSchemaParityViewProps> = ({
  tables,
  onRunParitySync,
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const driftCount = tables.filter((t) => t.driftDetected).length;

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      onRunParitySync();
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }, 1400);
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Supabase Database & Schema Parity Engine
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
              PostgreSQL 16 / Supabase
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect schema drift, check column parity across Local, Staging, and Production clusters, and ensure Row-Level Security (RLS) enforcement.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          {syncing ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Checking Cluster Parity...</span>
            </>
          ) : syncSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Parity Verified!</span>
            </>
          ) : (
            <>
              <GitCompare className="w-4 h-4" />
              <span>Run Schema Parity Sync</span>
            </>
          )}
        </button>
      </div>

      {/* Cluster Overview Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Tracked Tables</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{tables.length} Core Tables</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl shrink-0 ${
            driftCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
            {driftCount > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Schema Drift Detected</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {driftCount === 0 ? '0 Drift (100% In-Sync)' : `${driftCount} Table(s) Out-of-Parity`}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">Row-Level Security (RLS)</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {tables.filter((t) => t.rlsEnabled).length} / {tables.length} Tables Enforced
            </div>
          </div>
        </div>
      </div>

      {/* Schema Comparison Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="px-4 py-3">Table Name</th>
                <th className="px-4 py-3 text-center">Local Dev</th>
                <th className="px-4 py-3 text-center">Staging</th>
                <th className="px-4 py-3 text-center">Production</th>
                <th className="px-4 py-3">RLS Status</th>
                <th className="px-4 py-3">Last Migration Version</th>
                <th className="px-4 py-3">Parity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tables.map((tbl) => (
                <tr key={tbl.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <Table className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{tbl.tableName}</span>
                    </div>
                    {tbl.driftSummary && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-5.5 font-sans">
                        ⚠️ {tbl.driftSummary}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {tbl.localColumns} cols
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {tbl.stagingColumns} cols
                  </td>
                  <td className="px-4 py-3.5 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    <span className={tbl.prodColumns !== tbl.localColumns ? 'text-amber-600 font-bold' : ''}>
                      {tbl.prodColumns} cols
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tbl.rlsEnabled
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tbl.rlsEnabled ? 'RLS Active' : 'Public'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {tbl.lastMigrated}
                  </td>
                  <td className="px-4 py-3.5">
                    {tbl.driftDetected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        Drift Alert
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        100% In-Sync
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
  );
};
