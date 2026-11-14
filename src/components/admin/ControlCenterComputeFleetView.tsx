import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Globe,
  Terminal,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'kaggle' | 'devtools' | 'crawlers';

export const ControlCenterComputeFleetView: React.FC = () => {
  const {
    kaggleRuns,
    devToolsAudits,
    crawlerJobs,
    isLoadingCompute,
    loadComputeAndBrowser,
    runDevToolsAudit,
    requestGuardedAction,
  } = useControlCenterStore();

  const [subTab, setSubTab] = useState<SubTab>('kaggle');
  const [auditUrl, setAuditUrl] = useState('https://supremeai-api-ulw0.onrender.com/healthz');
  const [kernelTitle, setKernelTitle] = useState('supremeai-eval-benchmark-v5');
  const [accelerator, setAccelerator] = useState<'T4x2' | 'P100' | 'TPU-v3-8'>('T4x2');

  useEffect(() => {
    loadComputeAndBrowser();
  }, [loadComputeAndBrowser]);

  const handleDispatchKernel = (e: React.FormEvent) => {
    e.preventDefault();
    const title = kernelTitle.trim() || 'studio-eval-kernel';
    requestGuardedAction({
      title: `Dispatch Kaggle Kernel: ${title}`,
      description: `Submit GPU training/evaluation kernel to Kaggle compute queue (${accelerator}).`,
      impactSummary: `Kernel: ${title}\nAccelerator: ${accelerator}\nEstimated runtime ceiling: 15m`,
      riskLevel: 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.dispatchKaggleKernel(title, accelerator, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Kaggle dispatch validated.');
        } else {
          await loadComputeAndBrowser();
          toast.success('Kernel Dispatched', `${title} queued on ${accelerator}.`);
        }
      },
    });
  };

  const handleRunCdpAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditUrl.trim()) return;
    await runDevToolsAudit(auditUrl.trim());
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Compute Fleet, Headless Browser & Crawlers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Kaggle GPU kernel dispatch, Chrome CDP DevTools Core Web Vitals audits, and MicroVM/Firecrawl scrapers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadComputeAndBrowser()}
          disabled={isLoadingCompute}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCompute ? 'animate-spin' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      <ControlCenterSafetyBar
        provenance={devToolsAudits[0]?.provenance || 'local-snapshot'}
        subtitle={`${kaggleRuns.length} Kaggle jobs · ${devToolsAudits.length} CDP audits · ${crawlerJobs.length} crawler tasks`}
      />

      <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'kaggle' as SubTab, label: 'Kaggle GPU Kernels', icon: Cpu },
          { id: 'devtools' as SubTab, label: 'CDP DevTools Audit', icon: Globe },
          { id: 'crawlers' as SubTab, label: 'Crawlers & MicroVM', icon: Terminal },
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

      {subTab === 'kaggle' && (
        <div className="space-y-4">
          <form
            onSubmit={handleDispatchKernel}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3"
          >
            <input
              type="text"
              value={kernelTitle}
              onChange={(e) => setKernelTitle(e.target.value)}
              placeholder="Kaggle kernel slug..."
              className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <select
              value={accelerator}
              onChange={(e) => setAccelerator(e.target.value as 'T4x2' | 'P100' | 'TPU-v3-8')}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
            >
              <option value="T4x2">GPU T4 x2 (16GB VRAM)</option>
              <option value="P100">GPU P100 (16GB HBM2)</option>
              <option value="TPU-v3-8">TPU v3-8 Pod</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Dispatch Kernel</span>
            </button>
          </form>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Kernel Title</th>
                  <th className="px-4 py-3 font-medium">Accelerator</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Submitted By</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {kaggleRuns.map((run) => (
                  <tr key={run.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900 dark:text-white">
                      {run.title}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                      {run.accelerator}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                      {run.durationSec}s
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {run.submittedBy} · {run.submittedAt}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium capitalize">
                      <span
                        className={
                          run.status === 'completed'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : run.status === 'failed'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }
                      >
                        {run.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'devtools' && (
        <div className="space-y-4">
          <form
            onSubmit={handleRunCdpAudit}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center gap-3"
          >
            <input
              type="url"
              value={auditUrl}
              onChange={(e) => setAuditUrl(e.target.value)}
              placeholder="Target URL for Chrome CDP sweep..."
              className="flex-1 min-w-[260px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isLoadingCompute}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isLoadingCompute ? 'Auditing...' : 'Run Headless CDP Audit'}</span>
            </button>
          </form>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3 font-medium">Target URL</th>
                  <th className="px-4 py-3 font-medium">LCP / FCP</th>
                  <th className="px-4 py-3 font-medium">CLS</th>
                  <th className="px-4 py-3 font-medium">Console / Net Errors</th>
                  <th className="px-4 py-3 text-right font-medium">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {devToolsAudits.map((rep) => (
                  <tr key={rep.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">
                      {rep.url}
                      <span className="ml-2 text-[11px] text-slate-400">· {rep.auditedAt}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {rep.lcpMs}ms / {rep.fcpMs}ms
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                      {rep.cls.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                      {rep.consoleErrors} console · {rep.networkFailures} network
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          rep.verdict === 'healthy'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {rep.verdict === 'healthy' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        {rep.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'crawlers' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Engine</th>
                <th className="px-4 py-3 font-medium">Pages</th>
                <th className="px-4 py-3 font-medium">Latency</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {crawlerJobs.map((job) => (
                <tr key={job.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-slate-900 dark:text-white">
                    {job.targetUrl}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                    {job.engine}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                    {job.pagesCrawled}
                  </td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                    {job.latencyMs}ms · {job.ranAt}
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium capitalize text-emerald-600 dark:text-emerald-400">
                    {job.status}
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
