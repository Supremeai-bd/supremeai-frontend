import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Lock, User, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { AuthUser } from '../../types';
import { LiveScreenBackdrop } from '../theme/LiveScreenBackdrop';
import { ThemeControlPopover } from '../theme/ThemeControlPopover';
import { usePlatformStore } from '../../stores/usePlatformStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { useCustomerStore } from '../../stores/useCustomerStore';
import { env } from '../../config/env';

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser, token: string) => void;
  darkMode?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('njelmedia@gmail.com');
  const [password, setPassword] = useState('admin123');
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<'Free' | 'Pro' | 'Enterprise'>('Pro');
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const config = usePlatformStore((s) => s.config);
  const fetchConfig = usePlatformStore((s) => s.fetchConfig);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload =
      mode === 'login'
        ? { email, password }
        : {
            name,
            email,
            password,
            plan,
            isDeveloperEligible: false,
            workspaceFocus: 'everyday',
          };

    try {
      const res = await fetch(`${env.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Authentication failed. Please check your credentials.');
      }

      if (data.token) {
        localStorage.setItem('supremeai_access_token', data.token);
      }
      if (data.user) {
        localStorage.setItem('supremeai_auth_user', JSON.stringify(data.user));
        const role = data.user.isAdminEligible && data.user.role === 'admin' ? 'admin' : 'user';
        localStorage.setItem('supremeai_studio_user_role', role);
        useAuthStore.setState({ authUser: data.user, currentRole: role });
        useCustomerStore.getState().updateSettings({
          name: data.user.name,
          email: data.user.email,
          plan: data.user.plan,
          developerMode: false,
        });
      }

      onLoginSuccess(data.user, data.token);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const pickDemoAccount = (demoEmail: string, demoPass: string, demoName: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPass);
    setName(demoName);
    setErrorMessage(null);
  };

  const signupPaused = mode === 'signup' && !config.allowNewSignups;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      <LiveScreenBackdrop isEmpty isChatView />

      <div className="fixed top-4 right-4 z-30">
        <ThemeControlPopover />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 dark:text-cyan-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>SupremeAI Studio</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
              <path
                d="M12 2C12 7.52285 16.4772 12 22 12C16.4772 12 12 16.4772 12 22C12 16.4772 7.52285 12 2 12C7.52285 12 12 7.52285 12 2Z"
                fill="url(#gemini-logo-gradient)"
              />
              <defs>
                <linearGradient id="gemini-logo-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" />
                  <stop offset="0.5" stopColor="#8B5CF6" />
                  <stop offset="1" stopColor="#EC4899" />
                </linearGradient>
              </defs>
            </svg>
            SupremeAI Workspace
          </h1>

          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {mode === 'login'
              ? 'Sign in to access your workspace, chats, and Gemini reasoning models.'
              : 'Create your account to get started with SupremeAI Studio.'}
          </p>
        </div>

        <div className="rounded-3xl bg-white/85 dark:bg-[#111622]/85 backdrop-blur-2xl border border-white/60 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
          {config.maintenanceMode && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs">
              Scheduled maintenance is currently active. Only administrator accounts can access the workspace.
            </div>
          )}

          <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {signupPaused && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>New workspace signups are currently paused by the administrator.</span>
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Plan Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Free', 'Pro', 'Enterprise'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setPlan(tier)}
                        className={`p-2 rounded-xl text-center border text-xs font-medium transition-all cursor-pointer ${
                          plan === tier
                            ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-500 dark:text-cyan-400'
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Every account starts in clean Standard Mode — you can unlock Developer Tools anytime from Settings.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-0"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || signupPaused}
              className="w-full py-2.5 rounded-xl theme-btn-primary text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Studio' : 'Create Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              <span>Quick Test Accounts</span>
              <span className="text-cyan-500 lowercase font-mono">1-click demo</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => pickDemoAccount('njelmedia@gmail.com', 'admin123', 'Ziaul Haq (Admin)')}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 text-left transition-colors cursor-pointer group"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-cyan-400">
                    Super Admin (njelmedia@gmail.com)
                  </div>
                  <div className="text-[10px] text-slate-400">Full Central Control & Admin Studio</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => pickDemoAccount('sarah.chen@fintech.io', 'password123', 'Sarah Chen')}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-400">
                    Pro Developer (sarah.chen@fintech.io)
                  </div>
                  <div className="text-[10px] text-slate-400">Pro Plan · Developer-Eligible Workspace</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Select</span>
              </button>

              <button
                type="button"
                onClick={() => pickDemoAccount('alex.j@partner.io', 'password123', 'Alex Johnson')}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left transition-colors cursor-pointer group"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-purple-400">
                    Everyday User (alex.j@partner.io)
                  </div>
                  <div className="text-[10px] text-slate-400">Free Tier · Non-Developer Standard Mode</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Select</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>SupremeAI Zero-Trust Vault • TOTP & WebAuthn Biometric 2FA Enabled</span>
        </div>
      </div>
    </div>
  );
};
