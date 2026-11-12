import React from 'react';
import { Laptop, Check } from 'lucide-react';

interface TrustedBrowserCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const TrustedBrowserCheckbox: React.FC<TrustedBrowserCheckboxProps> = ({
  checked,
  onChange,
}) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer flex items-start gap-3 select-none"
    >
      <div
        className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
          checked
            ? 'bg-cyan-500 border-cyan-500 text-slate-950'
            : 'border-slate-400 dark:border-slate-600 bg-transparent'
        }`}
      >
        {checked && <Check className="w-3 h-3 stroke-[3]" />}
      </div>
      <div className="flex-1 text-xs">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Laptop className="w-3.5 h-3.5 text-cyan-500" />
          <span>Trust this device & browser for 7 days</span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
          Skip 2-Step Authentication on this browser until expiration. You can revoke device trust anytime from Settings.
        </p>
      </div>
    </div>
  );
};
