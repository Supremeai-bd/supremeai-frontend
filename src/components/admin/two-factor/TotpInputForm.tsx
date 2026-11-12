import React from 'react';
import { KeyRound, Clock, ArrowRight } from 'lucide-react';

interface TotpInputFormProps {
  digits: string[];
  onChangeDigit: (index: number, val: string) => void;
  onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFillDemoCode: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isVerifying: boolean;
  secondsRemaining: number;
}

export const TotpInputForm: React.FC<TotpInputFormProps> = ({
  digits,
  onChangeDigit,
  onKeyDown,
  onFillDemoCode,
  onSubmit,
  isVerifying,
  secondsRemaining,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5 font-medium">
          <KeyRound className="w-3.5 h-3.5 text-cyan-500" />
          Enter 6-Digit Authenticator Code
        </span>
        <span className="flex items-center gap-1 font-mono text-[11px] text-cyan-500">
          <Clock className="w-3 h-3 animate-spin" />
          <span>{secondsRemaining}s</span>
        </span>
      </div>

      {/* 6 Digit Input Cells */}
      <div className="flex justify-between gap-2">
        {digits.map((digit, idx) => (
          <input
            key={idx}
            id={`totp-cell-${idx}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => onChangeDigit(idx, e.target.value)}
            onKeyDown={(e) => onKeyDown(idx, e)}
            autoFocus={idx === 0}
            className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-cyan-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-inner"
          />
        ))}
      </div>

      {/* Demo Quick-Fill Helper */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onFillDemoCode}
          className="text-[11px] font-mono text-cyan-500 hover:text-cyan-400 underline underline-offset-2 cursor-pointer"
        >
          Auto-fill Demo Code (849201)
        </button>
        <span className="text-[11px] text-slate-400">RFC 6238 TOTP</span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isVerifying || digits.join('').length !== 6}
        className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs tracking-wider uppercase font-mono bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isVerifying ? (
          <span>VALIDATING CRYPTOGRAPHIC PROOF...</span>
        ) : (
          <>
            <span>VERIFY & ACCESS ADMIN COMMAND</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
