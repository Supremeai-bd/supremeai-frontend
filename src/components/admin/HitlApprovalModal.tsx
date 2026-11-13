import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert, Terminal, Clock, X } from 'lucide-react';
import { HitlPendingRecord } from '../../services/hitlService';

interface HitlApprovalModalProps {
  request: HitlPendingRecord | null;
  isOpen: boolean;
  onApprove: (id: string) => Promise<boolean | void>;
  onReject: (id: string, reason: string) => Promise<boolean | void>;
  onClose: () => void;
  isProcessing?: boolean;
}

export const HitlApprovalModal: React.FC<HitlApprovalModalProps> = ({
  request,
  isOpen,
  onApprove,
  onReject,
  onClose,
  isProcessing = false,
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  if (!isOpen || !request) return null;

  const severityBadgeClass = {
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    critical: 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse',
  }[request.severity || 'high'];

  const handleApprove = async () => {
    await onApprove(request.id);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setShowRejectInput(true);
      return;
    }
    await onReject(request.id, rejectReason.trim());
    setRejectReason('');
    setShowRejectInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Human-in-the-Loop Review
              </h3>
              <p className="text-xs text-slate-500">Execution paused pending operator decision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span
              className={`text-xs uppercase font-mono px-2 py-0.5 rounded border font-semibold ${severityBadgeClass}`}
            >
              {request.severity} Risk
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(request.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">
              {request.action_name}
            </h4>
            {request.module && (
              <p className="text-xs text-slate-500 mt-0.5 font-mono">Module: {request.module}</p>
            )}
          </div>

          {request.command && (
            <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 border-b border-slate-800/80 pb-1">
                <Terminal className="w-3.5 h-3.5" />
                <span>Proposed Command Execution</span>
              </div>
              <pre className="py-1 whitespace-pre-wrap">{request.command}</pre>
            </div>
          )}

          {request.context && Object.keys(request.context).length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200/60 dark:border-slate-800 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400">Context Metadata</span>
              <pre className="overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(request.context, null, 2)}
              </pre>
            </div>
          )}

          {showRejectInput && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Reason for Rejection (required)
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Dangerous file path or unauthorized target"
                className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-amber-500"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>{showRejectInput ? 'Confirm Rejection' : 'Reject Action'}</span>
          </button>
          <button
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Dispatching...' : 'Approve & Execute'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

