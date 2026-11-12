import React from 'react';
import { Fingerprint, Check, RefreshCw } from 'lucide-react';

interface BiometricScanPanelProps {
  onScan: () => void;
  isScanning: boolean;
}

export const BiometricScanPanel: React.FC<BiometricScanPanelProps> = ({
  onScan,
  isScanning,
}) => {
  return (
    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
      {/* Fingerprint Scanner Ring */}
      <div
        onClick={!isScanning ? onScan : undefined}
        className={`relative w-28 h-28 rounded-3xl border-2 flex items-center justify-center cursor-pointer transition-all ${
          isScanning
            ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,240,255,0.35)] scale-105'
            : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/70 bg-slate-50 dark:bg-slate-900/60'
        }`}
      >
        <Fingerprint
          className={`w-14 h-14 transition-colors ${
            isScanning
              ? 'text-cyan-400 animate-pulse'
              : 'text-slate-400 dark:text-slate-500 group-hover:text-cyan-400'
          }`}
        />

        {isScanning && (
          <div className="absolute inset-x-2 top-0 h-1 bg-cyan-400 rounded-full shadow-[0_0_12px_#00f0ff] animate-bounce" />
        )}
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {isScanning ? 'Scanning TouchID / YubiKey FIDO2...' : 'Click sensor to simulate Biometric Scan'}
        </p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
          Hardware cryptographic attestation using WebAuthn standard public key cryptography.
        </p>
      </div>

      <button
        type="button"
        onClick={onScan}
        disabled={isScanning}
        className="px-4 py-2 rounded-xl text-xs font-mono font-medium bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5"
      >
        {isScanning ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Scanning Biometric Key...</span>
          </>
        ) : (
          <span>Trigger Device TouchID</span>
        )}
      </button>
    </div>
  );
};
