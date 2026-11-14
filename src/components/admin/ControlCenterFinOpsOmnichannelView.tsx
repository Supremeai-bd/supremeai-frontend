import React, { useEffect, useState } from 'react';
import {
  Send,
  DollarSign,
  Clock,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useControlCenterStore } from '../../stores/useControlCenterStore';
import { controlCenterService } from '../../services/controlCenterService';
import { toast } from '../../stores/useToastStore';
import { ControlCenterSafetyBar } from './ControlCenterSafetyGateModal';

type SubTab = 'telegram' | 'finops' | 'cron';

export const ControlCenterFinOpsOmnichannelView: React.FC = () => {
  const {
    finOpsMesh,
    telegramLogs,
    cronTasks,
    isLoadingFinOps,
    loadFinOpsAndOmnichannel,
    requestGuardedAction,
  } = useControlCenterStore();

  const [subTab, setSubTab] = useState<SubTab>('telegram');
  const [telegramInput, setTelegramInput] = useState('');

  useEffect(() => {
    loadFinOpsAndOmnichannel();
  }, [loadFinOpsAndOmnichannel]);

  const sendTelegramCommand = (payload: string) => {
    const trimmed = payload.trim();
    if (!trimmed) return;
    requestGuardedAction({
      title: 'Dispatch Telegram Ops Command',
      description: 'Send command or operational broadcast via MCP Telegram notification relay.',
      impactSummary: `Payload: ${trimmed}\nTarget: Ops Command Channel`,
      riskLevel: trimmed === '/stop' ? 'critical' : 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.dispatchTelegram(trimmed, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Telegram dispatch validated.');
        } else {
          setTelegramInput('');
          await loadFinOpsAndOmnichannel();
          toast.success('Telegram Dispatched', `"${trimmed}" relayed to Ops Channel.`);
        }
      },
    });
  };

  const triggerCron = (id: string, name: string, schedule: string) => {
    requestGuardedAction({
      title: `Trigger Scheduled Task: ${name}`,
      description: 'Run cron maintenance sweep immediately outside its regular cadence.',
      impactSummary: `Task ID: ${id}\nCron: ${schedule}`,
      riskLevel: 'medium',
      onExecute: async (gate) => {
        const res = await controlCenterService.triggerCronTask(id, gate);
        if (res.dryRun) {
          toast.info('Dry-Run Preview', res.message || 'Cron trigger validated.');
        } else {
          await loadFinOpsAndOmnichannel();
          toast.success('Sweep Executed', `${name} completed.`);
        }
      },
    });
  };

  const totalSpend = finOpsMesh.reduce((sum, s) => sum + s.currentSpendUsd, 0);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 max-w-7xl mx-auto space-y-5 text-slate-800 dark:text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            FinOps Mesh, Telegram Ops & Cron Scheduler
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Zero-cost infrastructure spend guard, bidirectional Telegram command console, and keepwarm/parity/GC crons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadFinOpsAndOmnichannel()}
          disabled={isLoadingFinOps}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFinOps ? 'animate-spin' : ''}`} />
          <span>Refresh FinOps</span>
        </button>
      </div>

      <ControlCenterSafetyBar
        provenance="live-gateway"
        subtitle={`Monthly infra spend $${totalSpend.toFixed(2)} · ${cronTasks.length} scheduled jobs · ${telegramLogs.length} recent dispatches`}
      />

      <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {[
          { id: 'telegram' as SubTab, label: 'Telegram Console', icon: Send },
          { id: 'finops' as SubTab, label: 'Cost Guard & Mesh', icon: DollarSign },
          { id: 'cron' as SubTab, label: 'Cron Scheduler', icon: Clock },
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

      {subTab === 'telegram' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                Quick Commands:
              </span>
              {['/status', '/runway', '/stop'].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => sendTelegramCommand(cmd)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium whitespace-nowrap shrink-0 cursor-pointer ${
                    cmd === '/stop'
                      ? 'border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cmd}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTelegramCommand(telegramInput);
              }}
              className="flex flex-wrap items-center gap-3"
            >
              <input
                type="text"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                placeholder="Send custom Telegram command or founder alert..."
                className="flex-1 min-w-[240px] px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!telegramInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg theme-btn-primary text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch</span>
              </button>
            </form>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
            {telegramLogs.map((log) => (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {log.chatTarget}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-500">{log.direction}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="font-mono text-slate-700 dark:text-slate-300 break-words">
                    {log.commandOrMessage}
                  </div>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap shrink-0">
                  {log.delivered ? 'Delivered' : 'Queued'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'finops' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Mesh Integration</th>
                <th className="px-4 py-3 font-medium">Provider</th>
                <th className="px-4 py-3 font-medium">Spend / Ceiling</th>
                <th className="px-4 py-3 font-medium">Detail</th>
                <th className="px-4 py-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {finOpsMesh.map((svc) => (
                <tr key={svc.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                    {svc.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{svc.provider}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    ${svc.currentSpendUsd.toFixed(2)} / ${svc.monthlyBudgetUsd.toFixed(0)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400">{svc.detail}</td>
                  <td className="px-4 py-2.5 text-right font-medium capitalize">
                    <span
                      className={
                        svc.status === 'nominal'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : svc.status === 'degraded'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {svc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'cron' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="px-4 py-3 font-medium">Scheduled Job</th>
                <th className="px-4 py-3 font-medium">Cron Expression</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Last Run / Next</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {cronTasks.map((task) => (
                <tr key={task.id} className="h-11 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                    {task.name}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-300">
                    {task.schedule}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{task.category}</td>
                  <td className="px-4 py-2.5 font-mono tabular-nums text-slate-500">
                    {task.lastRunAt} · Next {task.nextRunIn}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        task.lastStatus === 'ok'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {task.lastStatus === 'ok' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      )}
                      {task.lastStatus === 'ok' ? 'Nominal' : 'Attention'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => triggerCron(task.id, task.name, task.schedule)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Play className="w-3 h-3" />
                      <span>Run Sweep</span>
                    </button>
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
