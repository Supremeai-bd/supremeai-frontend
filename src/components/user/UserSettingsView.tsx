import React, { useEffect, useRef, useState } from 'react';
import {
  User,
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
  Sun,
  Moon,
  Monitor,
  Palette,
  Play,
  Pause,
  Columns3,
  Maximize2,
  Minimize2,
  Terminal,
  MessageSquareCode,
  Code2,
  Database,
  Lightbulb,
  MessageSquarePlus,
  AudioLines,
  SlidersHorizontal,
  Upload,
  Trash2,
  Volume2,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { UserAccountSettings, UserRole, WorkspaceContentLayout } from '../../types';
import { SUPREMEAI_MODELS } from '../../data/models';
import {
  useThemeStore,
  LIVE_THEMES,
  ThemeMode,
  LiveThemeId,
  SurfaceTone,
  MotionSpeed,
  ScrimIntensity,
} from '../../stores/useThemeStore';
import { useChatStore } from '../../stores/useChatStore';
import { toast } from '../../stores/useToastStore';
import { LIVE_VOICE_OPTIONS, LiveVoiceName } from '../../hooks/useLiveVoiceSession';
import { LiveVoiceAvatarCanvas } from '../chat/LiveVoiceAvatarCanvas';
import {
  AVATAR_PRESETS,
  AvatarPreference,
  loadAvatarPreference,
  saveAvatarPreference,
  resolveAvatarSource,
  processCustomFaceUpload,
  loadVoicePreference,
  saveVoicePreference,
  VOICE_AVATAR_SYNC_EVENT,
} from '../../utils/hologramAvatar';

export type SettingsSubTab = 'general' | 'appearance' | 'voice-avatar' | 'account';

interface UserSettingsViewProps {
  settings: UserAccountSettings;
  onUpdateSettings: (newSettings: Partial<UserAccountSettings>) => void;
  onSwitchRole: (newRole: UserRole) => void;
  currentRole: UserRole;
  isAdminEligible?: boolean;
  isDeveloperEligible?: boolean;
  effectiveDeveloperMode?: boolean;
  onToggleDeveloperMode?: () => void;
  onToggleDeveloperEligibility?: (eligible: boolean) => void;
  trustedUntil?: number | null;
  onRevokeTrustedBrowser?: () => void;
  onSignOut?: () => void;
  onOpenFeedbackSurvey?: () => void;
  onOpenKnowledgeBase?: () => void;
  initialSubTab?: SettingsSubTab;
  subTabRequestKey?: number;
  onOpenLiveVoice?: () => void;
}

const SETTINGS_TABS: Array<{
  id: SettingsSubTab;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'general', label: 'General', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-3.5 h-3.5" /> },
  { id: 'voice-avatar', label: 'Voice & Avatar', icon: <AudioLines className="w-3.5 h-3.5" /> },
  { id: 'account', label: 'Account & Security', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
];

export const UserSettingsView: React.FC<UserSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onSwitchRole,
  currentRole,
  isAdminEligible = false,
  isDeveloperEligible = false,
  effectiveDeveloperMode,
  onToggleDeveloperMode,
  onToggleDeveloperEligibility,
  trustedUntil = null,
  onRevokeTrustedBrowser,
  onSignOut,
  onOpenFeedbackSurvey,
  onOpenKnowledgeBase,
  initialSubTab = 'general',
  subTabRequestKey = 0,
  onOpenLiveVoice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(initialSubTab);

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab, subTabRequestKey]);

  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [emailNotifications, setEmailNotifications] = useState(settings.emailNotifications);
  const [autoCodeReview, setAutoCodeReview] = useState(settings.autoCodeReview);
  const [streamResponses, setStreamResponses] = useState(settings.streamResponses);
  const [enableKnowledgeGrounding, setEnableKnowledgeGrounding] = useState(
    Boolean(settings.enableKnowledgeGrounding)
  );
  const [showWorkspaceTips, setShowWorkspaceTips] = useState(
    settings.showWorkspaceTips !== false
  );
  const [defaultModel, setDefaultModel] = useState(settings.defaultModel);
  const [customInstructions, setCustomInstructions] = useState(settings.customInstructions || '');
  const [layoutMode, setLayoutMode] = useState<'sidebar-focus' | 'classic'>(
    settings.layoutMode || 'sidebar-focus'
  );
  const [contentLayout, setContentLayout] = useState<WorkspaceContentLayout>(
    settings.contentLayout || 'fluid'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Voice & 3D Hologram Avatar state (synced live with LiveVoicePanel)
  const [avatarPref, setAvatarPref] = useState<AvatarPreference>(() => loadAvatarPreference());
  const [voiceName, setVoiceName] = useState<LiveVoiceName>(() => loadVoicePreference());
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [isPreviewPulsing, setIsPreviewPulsing] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const previewLevelsRef = useRef({ input: 0, output: 0 });
  const pulseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const handleSync = () => {
      setAvatarPref(loadAvatarPreference());
      setVoiceName(loadVoicePreference());
    };
    window.addEventListener(VOICE_AVATAR_SYNC_EVENT, handleSync);
    return () => {
      window.removeEventListener(VOICE_AVATAR_SYNC_EVENT, handleSync);
      if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    };
  }, []);

  const devModeActive =
    effectiveDeveloperMode !== undefined
      ? effectiveDeveloperMode
      : Boolean(settings.developerMode && (isDeveloperEligible || currentRole === 'admin'));

  const setChatCustomInstruction = useChatStore((s) => s.setCustomInstruction);
  const setIsRoleModalOpen = useChatStore((s) => s.setIsRoleModalOpen);
  const activeRole = useChatStore((s) => s.activeRole);

  const themeMode = useThemeStore((s) => s.themeMode);
  const osPrefersDark = useThemeStore((s) => s.osPrefersDark);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const liveTheme = useThemeStore((s) => s.liveTheme);
  const liveMotion = useThemeStore((s) => s.liveMotion);
  const overrideReducedMotion = useThemeStore((s) => s.overrideReducedMotion);
  const prefersReducedMotion = useThemeStore((s) => s.prefersReducedMotion);
  const motionSpeed = useThemeStore((s) => s.motionSpeed);
  const surfaceTone = useThemeStore((s) => s.surfaceTone);
  const scrimIntensity = useThemeStore((s) => s.scrimIntensity);
  const themeOptions = useThemeStore((s) => s.themeOptions);
  const setThemeMode = useThemeStore((s) => s.setThemeMode);
  const setLiveTheme = useThemeStore((s) => s.setLiveTheme);
  const setLiveMotion = useThemeStore((s) => s.setLiveMotion);
  const setOverrideReducedMotion = useThemeStore((s) => s.setOverrideReducedMotion);
  const setMotionSpeed = useThemeStore((s) => s.setMotionSpeed);
  const setSurfaceTone = useThemeStore((s) => s.setSurfaceTone);
  const setScrimIntensity = useThemeStore((s) => s.setScrimIntensity);
  const updateThemeOptions = useThemeStore((s) => s.updateThemeOptions);

  const isAnimating = liveMotion && (!prefersReducedMotion || overrideReducedMotion);
  const activeThemeMeta = LIVE_THEMES.find((t) => t.id === liveTheme) || LIVE_THEMES[0];
  const activeAvatarSource = resolveAvatarSource(avatarPref);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      name,
      email,
      emailNotifications,
      autoCodeReview,
      streamResponses,
      enableKnowledgeGrounding,
      showWorkspaceTips,
      defaultModel,
      layoutMode,
      contentLayout,
      customInstructions,
    });
    setChatCustomInstruction(customInstructions);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const triggerPreviewPulse = () => {
    if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
    setIsPreviewPulsing(true);
    const start = performance.now();
    const duration = 2600;
    pulseTimerRef.current = setInterval(() => {
      const elapsedSec = (performance.now() - start) / 1000;
      if (elapsedSec * 1000 >= duration) {
        if (pulseTimerRef.current) clearInterval(pulseTimerRef.current);
        pulseTimerRef.current = null;
        previewLevelsRef.current.output = 0;
        setIsPreviewPulsing(false);
        return;
      }
      // Natural varying speech amplitude curve so lips, jaw, teeth & brows animate realistically
      const phrase =
        0.48 +
        0.28 * Math.sin(elapsedSec * 11.2) +
        0.18 * Math.cos(elapsedSec * 19.5) +
        0.1 * Math.sin(elapsedSec * 5.0);
      previewLevelsRef.current.output = Math.max(0.18, Math.min(0.95, phrase));
    }, 40);
  };

  const handleSelectPresetAvatar = (presetId: 'female' | 'male') => {
    const next: AvatarPreference = {
      ...avatarPref,
      preset: presetId,
    };
    setAvatarPref(next);
    setAvatarError(null);
    saveAvatarPreference(next);
  };

  const handleSelectCustomAvatar = () => {
    if (!avatarPref.customImageDataUrl) {
      avatarFileInputRef.current?.click();
      return;
    }
    const next: AvatarPreference = {
      ...avatarPref,
      preset: 'custom',
    };
    setAvatarPref(next);
    setAvatarError(null);
    saveAvatarPreference(next);
  };

  const handleAvatarUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsProcessingAvatar(true);
    setAvatarError(null);
    try {
      const { dataUrl, traits } = await processCustomFaceUpload(file);
      const next: AvatarPreference = {
        preset: 'custom',
        customImageDataUrl: dataUrl,
        customImageName: file.name,
        customTraits: traits,
      };
      setAvatarPref(next);
      saveAvatarPreference(next);
      triggerPreviewPulse();
      toast.success(
        'Face Verified & Matched',
        'Detected your face, extracted skin & hair tones, and mapped it onto your 3D avatar.'
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No human face could be detected. Please upload a clear portrait.';
      setAvatarError(msg);
      toast.error('Face Not Detected', msg);
    } finally {
      setIsProcessingAvatar(false);
    }
  };

  const handleClearCustomAvatar = () => {
    const next: AvatarPreference = {
      preset: avatarPref.preset === 'male' ? 'male' : 'female',
      customImageDataUrl: null,
      customImageName: undefined,
    };
    setAvatarPref(next);
    setAvatarError(null);
    saveAvatarPreference(next);
    toast.info('Custom Photo Removed', 'Switched back to preset 3D hologram avatar.');
  };

  const handleSelectVoice = (voice: LiveVoiceName) => {
    setVoiceName(voice);
    saveVoicePreference(voice);
    triggerPreviewPulse();
  };

  const usagePercent = Math.min(
    100,
    Math.round((settings.monthlyTokensUsed / Math.max(1, settings.monthlyTokensLimit)) * 100)
  );
  const userInitial = (settings.name || name || 'U').trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 workspace-container space-y-6 text-slate-800 dark:text-slate-200">
      {/* Header & Clean Sub-Tab Navigation */}
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-4 space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Account & Workspace Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {devModeActive
              ? 'Manage your profile, appearance, 3D voice avatar, and developer preferences.'
              : 'Manage your profile, appearance, 3D voice avatar, and security settings.'}
          </p>
        </div>

        <nav
          aria-label="Settings sections"
          className="flex items-center gap-1.5 overflow-x-auto pb-1 -mb-1"
        >
          {SETTINGS_TABS.map((tab) => {
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  active
                    ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <span className={active ? 'theme-accent-text' : 'text-slate-400'}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ============================================================
          SUB-TAB 1: GENERAL
      ============================================================ */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          {/* Workspace Mode & Developer Access Card */}
          {currentRole === 'user' && (isDeveloperEligible ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-50/80 to-slate-50/80 dark:from-slate-900 dark:to-slate-900/90 border border-cyan-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span className="font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                    Workspace Experience
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {devModeActive ? 'Developer Studio' : 'Standard Workspace'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {devModeActive
                    ? 'Developer tools are active: API Keys, Knowledge & RAG, Repositories, Plugins, and the split Workspace Dock.'
                    : 'Streamlined workspace active for writing, research, and chat without technical clutter.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {onToggleDeveloperEligibility && (
                  <button
                    type="button"
                    onClick={() => onToggleDeveloperEligibility(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    Hide Developer Tools
                  </button>
                )}
                {onToggleDeveloperMode && (
                  <button
                    type="button"
                    onClick={onToggleDeveloperMode}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                  >
                    <span>{devModeActive ? 'Switch to Standard Mode' : 'Switch to Developer Mode'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            onToggleDeveloperEligibility && (
              <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <Terminal className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-white">
                      Need API keys, repositories, or code tools?
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Your account is currently in clean Standard Mode. Enable developer access anytime to unlock the Standard / Developer switch.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleDeveloperEligibility(true)}
                  className="px-3.5 py-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-cyan-500 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Enable Developer Access
                </button>
              </div>
            )
          ))}

          {/* Role Workspace Switcher Card - Only visible when Admin User ID is matched */}
          {(isAdminEligible || currentRole === 'admin') && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-900 dark:to-slate-900/90 border border-blue-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Active Workspace
                  </span>
                  <span aria-hidden="true" className="text-slate-400">·</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentRole === 'admin' ? 'Admin Studio' : 'Customer Workspace'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {currentRole === 'admin'
                    ? 'You are in Admin Studio with central control over platform policies, models, customers, and telemetry.'
                    : 'You are in Customer mode with streamlined chat, billing, and personal workspace preferences.'}
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

          {/* Profile + Usage Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                <span>Profile Information</span>
              </h2>

              <div className="flex items-center gap-4 pt-1">
                <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-base font-bold flex items-center justify-center shrink-0 shadow-xs">
                  {userInitial}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="truncate">{settings.name}</span>
                    <span aria-hidden="true" className="text-slate-400">·</span>
                    <span className="text-xs font-medium theme-accent-text shrink-0">
                      {settings.plan} Plan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                    {settings.email}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-500" />
                  <span>{devModeActive ? 'Monthly Token Quota' : 'Monthly Usage Allowance'}</span>
                </h2>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {settings.monthlyTokensUsed.toLocaleString()} / {settings.monthlyTokensLimit.toLocaleString()} {devModeActive ? 'tokens' : 'credits'}
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>{usagePercent}% utilized</span>
                <span>Resets monthly</span>
              </div>
            </div>
          </div>

          {/* Preferences, Custom Instructions & Workspace Form */}
          <form
            onSubmit={handleSave}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Preferences, AI Persona & Workspace Mode</span>
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
                Default SupremeAI Model
              </label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {SUPREMEAI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.tagline})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Instructions & Persona Section */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/70 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MessageSquareCode className="w-3.5 h-3.5 theme-accent-text" />
                    <span>Custom Instructions & AI Persona</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Active Persona: <span className="font-medium text-slate-700 dark:text-slate-200">{activeRole.name}</span>. Override or customize how SupremeAI responds across your chats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Switch Persona
                </button>
              </div>

              <textarea
                rows={3}
                value={customInstructions}
                onChange={(e) => {
                  setCustomInstructions(e.target.value);
                  setChatCustomInstruction(e.target.value);
                }}
                placeholder={
                  devModeActive
                    ? 'Example: Always answer concisely with bullet points. Prefer TypeScript examples over JavaScript.'
                    : 'Example: Always keep answers brief with clear bullet points and simple language.'
                }
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[var(--theme-accent)]"
              />
            </div>

            {devModeActive && (
              <>
                {/* Workspace Content Width Layout Switcher (Compact / Fluid / Maximized) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Workspace Layout
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {contentLayout === 'compact'
                        ? '800px focused column'
                        : contentLayout === 'fluid'
                        ? '1088px balanced width'
                        : '100% full-bleed canvas'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {(
                      [
                        {
                          id: 'compact' as WorkspaceContentLayout,
                          title: 'Compact',
                          desc: 'Narrow reading column for distraction-free focus (~800px).',
                          icon: <Minimize2 className="w-4 h-4" />,
                        },
                        {
                          id: 'fluid' as WorkspaceContentLayout,
                          title: 'Fluid',
                          desc: 'Balanced adaptive container across chats and views (~1088px).',
                          icon: <Columns3 className="w-4 h-4" />,
                        },
                        {
                          id: 'maximized' as WorkspaceContentLayout,
                          title: 'Maximized',
                          desc: 'Edge-to-edge full workspace width for wide monitors (100%).',
                          icon: <Maximize2 className="w-4 h-4" />,
                        },
                      ]
                    ).map((opt) => {
                      const active = contentLayout === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setContentLayout(opt.id);
                            onUpdateSettings({ contentLayout: opt.id });
                          }}
                          className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            active
                              ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className={`mt-0.5 shrink-0 ${active ? 'theme-accent-text' : 'text-slate-400'}`}>
                            {opt.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold">{opt.title}</div>
                            <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Workspace Navigation Layout Mode Segmented Selector */}
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
                          ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <PanelLeft className={`w-4 h-4 mt-0.5 shrink-0 ${layoutMode === 'sidebar-focus' ? 'theme-accent-text' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">Sidebar Focus (Modern)</div>
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
                          ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <LayoutGrid className={`w-4 h-4 mt-0.5 shrink-0 ${layoutMode === 'classic' ? 'theme-accent-text' : 'text-slate-400'}`} />
                      <div>
                        <div className="text-xs font-semibold">Top Navigation (Classic)</div>
                        <div className="text-[11px] opacity-80 mt-0.5">
                          Traditional top header bar with quick tabs and profile menu.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                    {devModeActive ? 'Stream Responses (SSE)' : 'Real-time Typing Responses'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    {devModeActive
                      ? 'Receive SupremeAI tokens incrementally in real time.'
                      : 'Receive responses word-by-word as they are generated.'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={streamResponses}
                  onChange={(e) => setStreamResponses(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </label>

              {devModeActive && (
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
              )}

              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Knowledge Base Grounding (RAG) in Chat</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Show document grounding controls in the chat bar and answer from your uploaded Knowledge Base files.
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {enableKnowledgeGrounding && onOpenKnowledgeBase && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenKnowledgeBase();
                      }}
                      className="text-[11px] font-medium theme-accent-text hover:underline cursor-pointer whitespace-nowrap"
                    >
                      Manage Docs
                    </button>
                  )}
                  <input
                    type="checkbox"
                    checked={enableKnowledgeGrounding}
                    onChange={(e) => {
                      const next = e.target.checked;
                      setEnableKnowledgeGrounding(next);
                      onUpdateSettings({ enableKnowledgeGrounding: next });
                    }}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </label>

              <label className="flex items-center justify-between gap-4 cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Workspace Discovery Tips</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    Show helpful rotating tips in Chat for shortcuts, research tools, and developer options.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showWorkspaceTips}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setShowWorkspaceTips(next);
                    onUpdateSettings({ showWorkspaceTips: next });
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block">
                    Email Notifications & Digest
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                    Receive weekly summary of workspace activity and updates.
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
                <span className="text-xs text-slate-400">Preferences saved locally and applied live.</span>
              )}

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full theme-btn-primary text-xs font-medium cursor-pointer whitespace-nowrap shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================
          SUB-TAB 2: APPEARANCE & LIVE BACKDROPS
      ============================================================ */}
      {activeSubTab === 'appearance' && (
        <div className="p-5 rounded-2xl theme-surface-glass border space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-4 h-4 theme-accent-text" />
                <span>Appearance, OS Sync & Live Screens</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time animated screens, theme-tinted glass surfaces, and per-theme atmospheric controls.
              </p>
            </div>

            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
              OS Preference:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {osPrefersDark ? 'Dark' : 'Light'}
              </span>
              {themeMode === 'system' && (
                <span className="theme-accent-text"> · Syncing live</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color Scheme Synchronization
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(
                [
                  {
                    id: 'system' as ThemeMode,
                    title: 'Auto (OS Sync)',
                    desc: `Matches system setting (currently ${osPrefersDark ? 'Dark' : 'Light'})`,
                    icon: <Monitor className="w-4 h-4" />,
                  },
                  {
                    id: 'light' as ThemeMode,
                    title: 'Light',
                    desc: 'Always use bright daylight surfaces',
                    icon: <Sun className="w-4 h-4" />,
                  },
                  {
                    id: 'dark' as ThemeMode,
                    title: 'Dark',
                    desc: 'Always use deep low-glare surfaces',
                    icon: <Moon className="w-4 h-4" />,
                  },
                ]
              ).map((modeOpt) => {
                const active = themeMode === modeOpt.id;
                return (
                  <button
                    key={modeOpt.id}
                    type="button"
                    onClick={() => setThemeMode(modeOpt.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${active ? 'theme-accent-text' : 'text-slate-400'}`}>
                      {modeOpt.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold">{modeOpt.title}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{modeOpt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surface Style, Motion Speed & Backdrop Visibility */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                UI Surface Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'adaptive' as SurfaceTone, label: 'Tinted Glass' },
                    { id: 'monochrome' as SurfaceTone, label: 'Classic B&W' },
                  ]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSurfaceTone(opt.id)}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${
                      surfaceTone === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Animation Speed
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['calm', 'normal', 'dynamic'] as MotionSpeed[]).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => setMotionSpeed(sp)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-medium capitalize cursor-pointer transition-all ${
                      motionSpeed === sp
                        ? 'theme-accent-active'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sp}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Backdrop Clarity
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'subtle' as ScrimIntensity, label: 'Vibrant' },
                    { id: 'balanced' as ScrimIntensity, label: 'Balanced' },
                    { id: 'focus' as ScrimIntensity, label: 'Focus' },
                  ]
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setScrimIntensity(sc.id)}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-medium cursor-pointer transition-all ${
                      scrimIntensity === sc.id
                        ? 'theme-accent-active'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Live Animated Backdrop ({LIVE_THEMES.length} Themes)
              </label>
              <div className="flex items-center gap-2">
                {prefersReducedMotion && (
                  <button
                    type="button"
                    onClick={() => setOverrideReducedMotion(!overrideReducedMotion)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      overrideReducedMotion
                        ? 'theme-accent-active'
                        : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {overrideReducedMotion ? 'OS Reduced Motion: Bypassed' : 'OS Reduced Motion Active (Click to Override)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLiveMotion(!liveMotion)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer ${
                    isAnimating
                      ? 'theme-accent-active'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isAnimating ? (
                    <>
                      <Pause className="w-3 h-3" />
                      <span>Live Animation On</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Static Screen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LIVE_THEMES.map((theme) => {
                const isSelected = liveTheme === theme.id;
                const previewBg =
                  resolvedScheme === 'dark'
                    ? theme.darkPreviewGradient
                    : theme.lightPreviewGradient;
                const schemeMismatch =
                  (theme.recommendedScheme === 'dark' && resolvedScheme === 'light') ||
                  (theme.recommendedScheme === 'light' && resolvedScheme === 'dark');

                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setLiveTheme(theme.id as LiveThemeId)}
                    className={`group rounded-xl border overflow-hidden text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'theme-accent-active ring-2 ring-[var(--theme-accent-ring)]'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/70 dark:bg-slate-800/50'
                    }`}
                  >
                    <div
                      className={`h-24 w-full relative overflow-hidden ${
                        !theme.previewImage && isAnimating ? 'theme-preview-animated' : ''
                      }`}
                      style={{ background: previewBg }}
                    >
                      {theme.previewImage && (
                        <img
                          src={theme.previewImage}
                          alt={theme.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={{
                            filter: theme.isNocturnalPhoto
                              ? resolvedScheme === 'dark'
                                ? 'brightness(0.86) contrast(1.06)'
                                : 'brightness(1.16) contrast(0.95) saturate(0.90)'
                              : resolvedScheme === 'dark'
                              ? 'brightness(0.54) contrast(1.12) saturate(0.88)'
                              : 'none',
                          }}
                        />
                      )}
                      <div className="absolute inset-x-4 top-5 h-3.5 rounded-full bg-white/80 dark:bg-slate-900/75 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xs" />
                      {theme.schemeBadge && (
                        <span
                          className={`absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded text-[9px] font-medium backdrop-blur-md ${
                            schemeMismatch
                              ? 'bg-amber-500/85 text-slate-950'
                              : 'bg-slate-950/60 text-white'
                          }`}
                        >
                          {schemeMismatch
                            ? theme.recommendedScheme === 'dark'
                              ? 'Best in Dark Mode'
                              : 'Best in Light Mode'
                            : theme.schemeBadge}
                        </span>
                      )}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full theme-btn-primary flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-1">
                        <span>{theme.name}</span>
                        <span className="text-[10px] font-normal theme-accent-text truncate">
                          {theme.animationLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {theme.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Theme Custom Controls */}
          <div className="p-4 rounded-xl bg-slate-50/75 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 theme-accent-text" />
                <span>{activeThemeMeta.name} — Theme-Specific Options</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {activeThemeMeta.animationLabel}
              </span>
            </div>

            {liveTheme === 'alpine-dunes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Time of Day Grading</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['daylight', 'moonlit'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateThemeOptions({ alpineTime: opt })}
                        className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                          (themeOptions.alpineTime || 'daylight') === opt
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt === 'daylight' ? 'Sunlit Snow' : 'Moonlit Night'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Drifting Snow Intensity</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['gentle', 'brisk', 'off'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateThemeOptions({ snowIntensity: opt })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                          (themeOptions.snowIntensity || 'gentle') === opt
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {liveTheme === 'misty-fjords' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Lake Water Ripple</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['calm', 'lively', 'off'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateThemeOptions({ waterRipple: opt })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                          (themeOptions.waterRipple || 'lively') === opt
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Valley Fog Density</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['light', 'lively', 'dense'] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateThemeOptions({ mistDensity: opt })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                          (themeOptions.mistDensity || 'lively') === opt
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {liveTheme === 'emerald-highlands' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'fireflies', label: 'Forest Fireflies' },
                    { id: 'rain', label: 'Gentle Rain' },
                    { id: 'mist', label: 'Valley Mist Only' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ forestEffect: opt.id })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      (themeOptions.forestEffect || 'fireflies') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'amber-canyon' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'heat-dust', label: 'Golden Dust Motes' },
                    { id: 'sunbeams', label: 'Canyon Sunbeams' },
                    { id: 'mist', label: 'Desert Haze Only' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ canyonEffect: opt.id })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      (themeOptions.canyonEffect || 'heat-dust') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'midnight-peaks' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'shooting-stars', label: 'Shooting Stars' },
                    { id: 'polar-glow', label: 'Polar Night Glow' },
                    { id: 'starfield', label: 'Calm Starfield' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ midnightSky: opt.id })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      (themeOptions.midnightSky || 'shooting-stars') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'nebula' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'warp-stars', label: '3D Warp Starfield' },
                    { id: 'constellation', label: 'Constellation Web' },
                    { id: 'drift', label: 'Slow Cosmic Drift' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ nebulaEffect: opt.id })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      (themeOptions.nebulaEffect || 'warp-stars') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'cyberpunk' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Neon Palette</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: 'neon-emerald', label: 'Green' },
                        { id: 'cyber-cyan', label: 'Cyan' },
                        { id: 'synth-amber', label: 'Amber' },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateThemeOptions({ cyberPalette: opt.id })}
                        className={`py-1.5 px-1.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                          (themeOptions.cyberPalette || 'neon-emerald') === opt.id
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">Rain Density</div>
                  <div className="grid grid-cols-3 gap-1">
                    {(['sparse', 'normal', 'overdrive'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateThemeOptions({ cyberDensity: d })}
                        className={`py-1.5 px-1.5 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                          (themeOptions.cyberDensity || 'normal') === d
                            ? 'theme-accent-active'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 mb-1">CRT Scanlines</div>
                  <button
                    type="button"
                    onClick={() =>
                      updateThemeOptions({ cyberScanlines: themeOptions.cyberScanlines === false })
                    }
                    className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      themeOptions.cyberScanlines !== false
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500'
                    }`}
                  >
                    {themeOptions.cyberScanlines !== false ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            )}

            {liveTheme === 'aurora-borealis' && (
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'polar-emerald', label: 'Polar Green & Cyan' },
                    { id: 'cosmic-violet', label: 'Cosmic Violet' },
                    { id: 'solar-crimson', label: 'Solar Storm Crimson' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => updateThemeOptions({ auroraPalette: opt.id })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
                      (themeOptions.auroraPalette || 'polar-emerald') === opt.id
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'oceanic-horizon' && (
              <div className="grid grid-cols-3 gap-2">
                {(['calm', 'rolling', 'choppy'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateThemeOptions({ oceanWaveEnergy: opt })}
                    className={`py-1.5 px-2.5 rounded-lg border text-[11px] font-medium capitalize cursor-pointer ${
                      (themeOptions.oceanWaveEnergy || 'rolling') === opt
                        ? 'theme-accent-active'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {opt} Waves
                  </button>
                ))}
              </div>
            )}

            {liveTheme === 'solar-meadow' && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Volumetric Sweeping Horizon Sunbeams
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateThemeOptions({ dawnSunbeams: themeOptions.dawnSunbeams === false })
                  }
                  className={`py-1.5 px-3 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    themeOptions.dawnSunbeams !== false
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {themeOptions.dawnSunbeams !== false ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            )}

            {liveTheme === 'cyber-studio' && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Autonomous Neural Constellation Mesh & Data Pulses
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateThemeOptions({ neuralMesh: themeOptions.neuralMesh === false })
                  }
                  className={`py-1.5 px-3 rounded-lg border text-[11px] font-medium cursor-pointer ${
                    themeOptions.neuralMesh !== false
                      ? 'theme-accent-active'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  {themeOptions.neuralMesh !== false ? 'Active' : 'Grid Only'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SUB-TAB 3: VOICE & 3D HOLOGRAM AVATAR
      ============================================================ */}
      {activeSubTab === 'voice-avatar' && (
        <div className="space-y-6">
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleAvatarUploadChange}
            className="hidden"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Live Transparent 3D Hologram Preview Stage */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-transparent flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                    Live 3D Avatar Preview
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Move cursor for eye gaze · Drag to rotate · Click to smile
                  </p>
                </div>
                <button
                  type="button"
                  onClick={triggerPreviewPulse}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Volume2 className="w-3 h-3 theme-accent-text" />
                  <span>{isPreviewPulsing ? 'Speaking...' : 'Test Voice & Lips'}</span>
                </button>
              </div>

              {/* Clean WebGL stage — no backdrop-filter over canvas */}
              <div className="relative h-72 w-full bg-transparent">
                <LiveVoiceAvatarCanvas
                  status={isPreviewPulsing ? 'speaking' : 'idle'}
                  voiceName={voiceName}
                  levelsRef={previewLevelsRef}
                  avatarSrc={activeAvatarSource.src}
                  isPrestyledHologram={activeAvatarSource.isPrestyledHologram}
                  avatarPreset={avatarPref.preset}
                  customTraits={avatarPref.customTraits}
                  isDark={resolvedScheme === 'dark'}
                />
              </div>

              {onOpenLiveVoice && (
                <div className="px-4 py-3 border-t border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Active Voice: <strong className="text-slate-800 dark:text-slate-200">{voiceName}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenLiveVoice}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full theme-btn-primary text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <AudioLines className="w-3.5 h-3.5" />
                    <span>Launch Voice Companion</span>
                  </button>
                </div>
              )}
            </div>

            {/* Avatar Presets & Custom Upload + Voice Persona Picker */}
            <div className="lg:col-span-7 space-y-5">
              {/* Hologram Avatar Selection */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 theme-accent-text" />
                      <span>3D Hologram Avatar</span>
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Choose a preset 3D portrait or upload any photo to convert it into a translucent hologram.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = avatarPref.preset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPresetAvatar(preset.id)}
                        className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer flex flex-col gap-2 ${
                          isSelected
                            ? 'theme-accent-active ring-2 ring-[var(--theme-accent-ring)]'
                            : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-950">
                          <img
                            src={preset.imageSrc}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top"
                          />
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full theme-btn-primary flex items-center justify-center shadow-sm">
                              <Check className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-900 dark:text-white">
                            {preset.label}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {preset.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Photo-to-Hologram Card */}
                  <div
                    className={`rounded-xl border p-2.5 text-left transition-all flex flex-col gap-2 ${
                      avatarPref.preset === 'custom'
                        ? 'theme-accent-active ring-2 ring-[var(--theme-accent-ring)]'
                        : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={handleSelectCustomAvatar}
                      className="relative h-28 w-full rounded-lg overflow-hidden bg-slate-900/90 border border-dashed border-slate-700 flex items-center justify-center cursor-pointer group"
                    >
                      {avatarPref.customImageDataUrl ? (
                        <img
                          src={avatarPref.customImageDataUrl}
                          alt="Custom avatar preview"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-top"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-slate-400 group-hover:text-cyan-400 transition-colors px-2 text-center">
                          {isProcessingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          <span className="text-[11px] font-medium">Upload Portrait</span>
                        </div>
                      )}
                      {avatarPref.preset === 'custom' && avatarPref.customImageDataUrl && (
                        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full theme-btn-primary flex items-center justify-center shadow-sm">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>

                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          Face-Matched 3D
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {isProcessingAvatar
                            ? 'Scanning for face...'
                            : avatarPref.customImageName || 'Requires clear human face'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-auto pt-1">
                      <button
                        type="button"
                        disabled={isProcessingAvatar}
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] cursor-pointer whitespace-nowrap disabled:opacity-60"
                      >
                        {isProcessingAvatar ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Upload className="w-3 h-3" />
                        )}
                        <span>
                          {isProcessingAvatar
                            ? 'Verifying...'
                            : avatarPref.customImageDataUrl
                            ? 'Change'
                            : 'Upload'}
                        </span>
                      </button>
                      {avatarPref.customImageDataUrl && (
                        <button
                          type="button"
                          onClick={handleClearCustomAvatar}
                          aria-label="Remove custom avatar"
                          title="Remove custom avatar"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:border-rose-300 cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {avatarError && (
                  <div
                    role="alert"
                    data-testid="avatar-upload-error"
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{avatarError}</span>
                  </div>
                )}
              </div>

              {/* Voice Persona Settings */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 theme-accent-text" />
                    <span>Voice Persona</span>
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select the neural voice profile used during live 3D hologram conversations.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {LIVE_VOICE_OPTIONS.map((opt) => {
                    const active = voiceName === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectVoice(opt.id)}
                        className={`flex items-start justify-between gap-2 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'theme-accent-active text-slate-900 dark:text-white shadow-xs'
                            : 'border-slate-200/80 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold">{opt.label}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">{opt.tone}</div>
                        </div>
                        {active && (
                          <Check className="w-3.5 h-3.5 theme-accent-text shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SUB-TAB 4: ACCOUNT, SECURITY & FEEDBACK
      ============================================================ */}
      {activeSubTab === 'account' && (
        <div className="space-y-6">
          {/* Security & 2-Step Authentication & Trusted Browser Card (Admin-Eligible only) */}
          {(isAdminEligible || currentRole === 'admin') && (
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
                      Enforces secondary verification when activating Admin Studio.
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    ENFORCED
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
                          Trusted until{' '}
                          <strong className="text-cyan-500 dark:text-cyan-400 font-mono">
                            {new Date(trustedUntil).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </strong>{' '}
                          ({Math.max(1, Math.ceil((trustedUntil - Date.now()) / (24 * 60 * 60 * 1000)))} days left).
                        </>
                      ) : (
                        'No active 7-day browser trust token on this device.'
                      )}
                    </span>
                  </div>

                  {trustedUntil && trustedUntil > Date.now() && onRevokeTrustedBrowser && (
                    <button
                      type="button"
                      onClick={onRevokeTrustedBrowser}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto whitespace-nowrap"
                    >
                      Revoke Trusted Browser
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Product Feedback & Suggestions Card */}
          {onOpenFeedbackSurvey && (
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MessageSquarePlus className="w-4 h-4 theme-accent-text" />
                  <span>Product Feedback & Feature Suggestions</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Tell us what feels great or suggest features you want added to SupremeAI Studio.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenFeedbackSurvey}
                className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-[var(--theme-accent)] text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                Share Feedback
              </button>
            </div>
          )}

          {/* Account Session Sign Out Card */}
          <div className="p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div>
              <h3 className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Active Session Management</span>
              </h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                Signing out will clear your session token and lock the workspace.
              </p>
            </div>

            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of SupremeAI</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
