import React, { useState } from 'react';
import {
  User,
  Shield,
  Zap,
  Mail,
  Bell,
  Cpu,
  Github,
  Check,
  Save,
  Gauge,
  Sparkles,
  ArrowRight,
  Laptop,
  LogOut,
  KeyRound,
  ShieldAlert,
  PanelLeft,
  LayoutGrid,
} from 'lucide-react';
import { UserAccountSettings, UserRole } from '../../types';
import { GEMINI_MODELS } from '../../data/models';

interface UserSettingsViewProps {
  settings: UserAccountSettings;
  onUpdateSettings: (newSettings: Partial<UserAccountSettings>) => void;
  onSwitchRole: (newRole: UserRole) => void;
  currentRole: UserRole;
  isAdminEligible?: boolean;
  trustedUntil?: number | null;
  onRevokeTrustedBrowser?: () => void;
  onSignOut?: () => void;
}

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSwitchRole,
  currentRole,
  isAdminEligible = false,
  trustedUntil = null,
  onRevokeTrustedBrowser,
  onSignOut,
}) => {
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);
  const [autoCodeReview, setAutoCodeReview] = useState(settings.autoCodeReview);
  const [streamResponses, setStreamResponses] = useState(settings.streamResponses);
  const [defaultModel, setDefaultModel] = useState(settings.defaultModel);
  const [layoutMode, setLayoutMode] = useState<'sidebar-focus' | 'classic'>(
    settings.layoutMode || 'sidebar-focus'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name,
      email,
      emailNotifications,
      autoCodeReview,
      streamResponses,
      defaultModel,
      layoutMode,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const usagePercent = Math.min(
    100,
    Math.round((settings.monthlyTokensUsed / settings.monthlyTokensLimit) * 100)
  );

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 max-w-4xl mx-auto space-y-8 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Account & Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal profile, role permissions, token usage quota, and developer preferences.
        </p>
      </div>

      {/* Role Workspace Switcher Card - Only visible when Admin User ID is matched */}
      {(isAdminEligible || currentRole === 'admin') && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-900/90 border border-blue-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Active Workspace
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700">
                {currentRole === 'admin' ? 'Admin / Developer Studio' : 'Normal User Mode'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Admin Eligible
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {currentRole === 'admin'
                ? 'You are in the Admin Studio with full access to Model Matrix, Swarm, and Ecosystem Repos.'
                : 'You are in Normal User mode with streamlined chat, personal GitHub projects, and plugins.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSwitchRole(currentRole === 'admin' ? 'user' : 'admin')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
          >
            <span>
              {currentRole === 'admin' ? 'Switch to User View' : 'Switch to Admin Studio'}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* User Profile Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <span>Profile Information</span>
        </h2>

        <div className="flex items-center gap-4 pt-1">
          <div className="w-14 h-14 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-lg font-bold flex items-center justify-center shrink-0 shadow-xs">
            Z
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{settings.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                {settings.plan} Member
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {settings.email}
            </p>
          </div>
        </div>
      </div>

      {/* Token Usage & Quota Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Gauge className="w-4 h-4 text-slate-500" />
            <span>Monthly Token Quota (Gemini API)</span>
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {settings.monthlyTokensUsed.toLocaleString()} / {settings.monthlyTokensLimit.toLocaleString()} tokens
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{usagePercent}% utilized for the current cycle</span>
          <span>Resets on Dec 1, 2026</span>
        </div>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSave}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs"
      >
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-slate-500" />
          <span>Preferences & Defaults</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Default Gemini Model
          </label>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {GEMINI_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.tagline})
              </option>
            ))}
          </select>
        </div>

        {/* Workspace Layout Mode Segmented Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Workspace Navigation Layout
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setLayoutMode('sidebar-focus');
                onUpdateSettings({ layoutMode: 'sidebar-focus' });
              }}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                layoutMode === 'sidebar-focus'
                  ? 'border-cyan-500/60 bg-cyan-500/10 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <PanelLeft className={`w-4 h-4 mt-0.5 shrink-0 ${layoutMode === 'sidebar-focus' ? 'text-cyan-500' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-semibold">Sidebar Focus (Gemini)</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Full-height canvas without duplicate top navbar.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setLayoutMode('classic');
                onUpdateSettings({ layoutMode: 'classic' });
              }}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                layoutMode === 'classic'
                  ? 'border-cyan-500/60 bg-cyan-500/10 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <LayoutGrid className={`w-4 h-4 mt-0.5 shrink-0 ${layoutMode === 'classic' ? 'text-cyan-500' : 'text-slate-400'}`} />
              <div>
                <div className="text-xs font-semibold">Top Navigation (Classic)</div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  Traditional top header bar with quick tabs and profile menu.
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                Stream Responses (SSE)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Receive Gemini tokens incrementally in real time.
              </span>
            </div>
            <input
              type="checkbox"
              checked={streamResponses}
              onChange={(e) => setStreamResponses(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                Automatic Pull Request Review
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Trigger automated AI code audits when branches are pushed.
              </span>
            </div>
            <input
              type="checkbox"
              checked={autoCodeReview}
              onChange={(e) => setAutoCodeReview(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                Email Notifications & Digest
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Receive weekly summary of connected project issues and AI suggestions.
              </span>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          {savedSuccess ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              Settings saved successfully!
            </span>
          ) : (
            <span className="text-xs text-slate-400">All preferences stored locally.</span>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Security & 2-Step Authentication & Trusted Browser Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-cyan-500" />
          <span>Security, 2-Step Verification & Trusted Devices</span>
        </h2>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                Two-Factor Authentication (TOTP / Biometric)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Enforces secondary 6-digit TOTP token or hardware fingerprint touch when activating Admin Studio.
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              ACTIVE (ENFORCED)
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Laptop className="w-4 h-4 text-cyan-500" />
                <span>7-Day Trusted Browser Policy</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {trustedUntil && trustedUntil > Date.now() ? (
                  <>
                    This browser is currently trusted until{' '}
                    <strong className="text-cyan-500 dark:text-cyan-400 font-mono">
                      {new Date(trustedUntil).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>{' '}
                    ({Math.max(1, Math.ceil((trustedUntil - Date.now()) / (24 * 60 * 60 * 1000)))} days remaining).
                  </>
                ) : (
                  'No active 7-day browser trust token on this device. 2FA will be prompted on next Admin switch.'
                )}
              </span>
            </div>

            {trustedUntil && trustedUntil > Date.now() && onRevokeTrustedBrowser && (
              <button
                type="button"
                onClick={onRevokeTrustedBrowser}
                className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto"
              >
                Revoke Trusted Browser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Account Session Sign Out Card */}
      <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Active Session Management</span>
          </h3>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
            Signing out will clear your session token and lock the workspace. You will need to log back in.
          </p>
        </div>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out of SupremeAI</span>
          </button>
        )}
      </div>
    </div>
  );
};
