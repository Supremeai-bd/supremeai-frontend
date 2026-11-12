import React, { useState } from 'react';
import {
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Play,
  Database,
  Filter,
  Eye,
  Trash2,
} from 'lucide-react';
import { TaskQueueJob } from '../../types';

interface AdminTaskQueueViewProps {
  jobs: TaskQueueJob[];
  onRetryJob: (id: string) => void;
  onRetryAllDlq: () => void;
  onClearCompleted: () => void;
}

export const AdminTaskQueueView: React.FC<AdminTaskQueueViewProps> = ({
  jobs,
  onRetryJob,
  onRetryAllDlq,
  onClearCompleted,
}) => {
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [inspectJob, setInspectJob] = useState<TaskQueueJob | null>(null);

  const activeCount = jobs.filter((j) => j.status === 'active').length;
  const waitingCount = jobs.filter((j) => j.status === 'waiting').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const dlqCount = jobs.filter((j) => j.status === 'dlq').length;

  const filteredJobs = jobs.filter((j) => {
    const queueMatch = selectedQueue === 'all' || j.queueName === selectedQueue;
    const statusMatch = selectedStatus === 'all' || j.status === selectedStatus;
    return queueMatch && statusMatch;
  });

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Task Queue & Redis Telemetry
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
              Redis / BullMQ In-Memory Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor real-time task queues, inspect job payloads, manage dead-letter queues (DLQ), and retry failed jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {dlqCount > 0 && (
            <button
              type="button"
              onClick={onRetryAllDlq}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry All DLQ ({dlqCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClearCompleted}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Completed</span>
          </button>
        </div>
      </div>

      {/* Queue Status Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Active Processing</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{activeCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Waiting in Queue</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{waitingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Successfully Completed</div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="text-[11px] text-slate-400 font-medium">Failed Retries</div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">{failedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900/80 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs">
          <div className="text-[11px] text-rose-500 font-medium">Dead-Letter Queue (DLQ)</div>
          <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-1">{dlqCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
          {['all', 'ai-reasoning', 'github-sync', 'code-audit', 'vector-embedding'].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setSelectedQueue(q)}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                selectedQueue === q
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {q === 'all' ? 'All Queues' : q}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
          {['all', 'active', 'completed', 'failed', 'dlq'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedStatus(s)}
              className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                selectedStatus === s
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                <th className="px-4 py-3">Job ID & Queue</th>
                <th className="px-4 py-3">Task Type</th>
                <th className="px-4 py-3">Payload Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attempts</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-bold text-slate-900 dark:text-white">{job.id}</div>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {job.queueName}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-700 dark:text-slate-300">
                    {job.taskType}
                  </td>
                  <td className="px-4 py-3.5 max-w-xs truncate text-slate-600 dark:text-slate-400">
                    {job.payloadSummary}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        job.status === 'completed'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : job.status === 'active'
                          ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 animate-pulse'
                          : job.status === 'dlq'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {job.attempts} / {job.maxAttempts}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                    {job.latencyMs}ms
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectJob(job)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        title="Inspect Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {(job.status === 'failed' || job.status === 'dlq') && (
                        <button
                          type="button"
                          onClick={() => onRetryJob(job.id)}
                          className="p-1 rounded text-blue-600 hover:text-blue-800 cursor-pointer"
                          title="Retry Job"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INSPECT JOB DRAWER / MODAL --- */}
      {inspectJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                Inspect Task Job: {inspectJob.id}
              </h3>
              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold">Queue / Type:</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">{inspectJob.queueName} · {inspectJob.taskType}</p>
              </div>

              <div>
                <span className="text-slate-400 font-semibold">Payload Summary:</span>
                <p className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-[11px] mt-1 text-slate-800 dark:text-slate-200">
                  {inspectJob.payloadSummary}
                </p>
              </div>

              {inspectJob.errorDetails && (
                <div>
                  <span className="text-rose-500 font-semibold">Error / Stack Trace:</span>
                  <p className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl font-mono text-[11px] text-rose-700 dark:text-rose-300 mt-1">
                    {inspectJob.errorDetails}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setInspectJob(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
