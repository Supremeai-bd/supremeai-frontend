import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, KeyRound, AlertCircle, X } from 'lucide-react';
import { TotpInputForm } from './two-factor/TotpInputForm';
import { BiometricScanPanel } from './two-factor/BiometricScanPanel';
import { TrustedBrowserCheckbox } from './two-factor/TrustedBrowserCheckbox';

interface AdminTwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trustedUntil: number | null) => void;
  userEmail: string;
}

export const AdminTwoFactorModal: React.FC<AdminTwoFactorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
}) => {
  const [authMethod, setAuthMethod] = useState<'totp' | 'fingerprint'>('totp');
  const [totpDigits, setTotpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [trustBrowser, setTrustBrowser] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isScanningFingerprint, setIsScanningFingerprint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...totpDigits];
    updated[index] = digit;
    setTotpDigits(updated);

    if (digit && index < 5) {
      const nextInput = document.getElementById(`totp-cell-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !totpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`totp-cell-${index - 1}`);
      prevInput?.focus();
    }
  };

  const fillDemoCode = () => {
    setTotpDigits(['8', '4', '9', '2', '0', '1']);
    setError(null);
  };

  const handleVerifyTotp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = totpDigits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits from your Authenticator app.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: fullCode,
          method: 'totp',
          trustFor7Days: trustBrowser,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || '2-Step Verification failed.');
      }

      onSuccess(data.trustedUntil);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleScanFingerprint = async () => {
    setIsScanningFingerprint(true);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 1200));

      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biometricSignature: `fido2_signature_${Date.now()}`,
          method: 'biometric',
          trustFor7Days: trustBrowser,
          userEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.verified) {
        throw new Error(data.error || 'Biometric signature rejected.');
      }

      onSuccess(data.trustedUntil);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Biometric verification failed.');
    } finally {
      setIsScanningFingerprint(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-cyan-500/30 p-6 shadow-2xl relative cyber-hud-glass">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Admin 2-Step Verification
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Identity: <span className="font-mono text-cyan-500">{userEmail}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setAuthMethod('totp')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              authMethod === 'totp'
                ? 'bg-white dark:bg-slate-800 text-cyan-500 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Authenticator</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMethod('fingerprint')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg transition-all cursor-pointer ${
              authMethod === 'fingerprint'
                ? 'bg-white dark:bg-slate-800 text-cyan-500 font-semibold shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Biometric</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Method Panels */}
        <div className="mt-4">
          {authMethod === 'totp' ? (
            <TotpInputForm
              digits={totpDigits}
              onChangeDigit={handleDigitChange}
              onKeyDown={handleKeyDown}
              onFillDemoCode={fillDemoCode}
              onSubmit={handleVerifyTotp}
              isVerifying={isVerifying}
              secondsRemaining={secondsRemaining}
            />
          ) : (
            <BiometricScanPanel
              onScan={handleScanFingerprint}
              isScanning={isScanningFingerprint}
            />
          )}
        </div>

        {/* 7-Day Trusted Browser Checkbox */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <TrustedBrowserCheckbox checked={trustBrowser} onChange={setTrustBrowser} />
        </div>
      </div>
    </div>
  );
};
