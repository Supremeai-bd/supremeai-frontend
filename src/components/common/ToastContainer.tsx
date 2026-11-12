import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, ToastItem, ToastType } from '../../stores/useToastStore';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const getToastIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-cyan-400 shrink-0" />;
    }
  };

  const getToastStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30 bg-[#0d1614] text-emerald-100 shadow-emerald-950/40';
      case 'error':
        return 'border-rose-500/30 bg-[#1a0f12] text-rose-100 shadow-rose-950/40';
      case 'warning':
        return 'border-amber-500/30 bg-[#19150d] text-amber-100 shadow-amber-950/40';
      case 'info':
        return 'border-cyan-500/30 bg-[#0c151e] text-cyan-100 shadow-cyan-950/40';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t: ToastItem) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md text-xs animate-in slide-in-from-bottom-2 duration-200 transition-all ${getToastStyle(
            t.type
          )}`}
        >
          <div className="mt-0.5">{getToastIcon(t.type)}</div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="font-semibold text-white tracking-tight">{t.title}</h4>
            {t.message && (
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed break-words">
                {t.message}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
