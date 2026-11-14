import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  PanelRight,
  Download,
  Trash2,
  Share2,
  GitFork,
  AlertTriangle,
  X,
  Lock,
  UserCheck,
  ShieldCheck,
  Megaphone,
  ArrowLeft,
  Home,
  Pin,
  LogIn,
} from 'lucide-react';
import { WorkspaceTipBar, WorkspaceMicroSurvey } from './components/chat/WorkspaceTipsAndSurvey';
import { shareService } from './services/shareService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatThread } from './components/ChatThread';
import { ChatEmptyState } from './components/chat/ChatEmptyState';
import { ChatHistoryView } from './components/chat/ChatHistoryView';
import { LiveVoicePanel } from './components/chat/LiveVoicePanel';
import { ChatInput } from './components/ChatInput';
import { useLiveVoiceSession } from './hooks/useLiveVoiceSession';
import { RoleModal } from './components/RoleModal';
import { RoleLab } from './components/RoleLab';
import { ModelMatrix } from './components/ModelMatrix';
import { RepoHub } from './components/RepoHub';
import { UserProjectsView } from './components/user/UserProjectsView';
import { UserPluginsView } from './components/user/UserPluginsView';
import { UserSettingsView, SettingsSubTab } from './components/user/UserSettingsView';
import { UserApiKeysView } from './components/user/UserApiKeysView';
import { UserKnowledgeBaseView } from './components/user/UserKnowledgeBaseView';
import { UserTeamView } from './components/user/UserTeamView';
import { UserPlanUsageView } from './components/user/UserPlanUsageView';
import { AdminOverviewView } from './components/admin/AdminOverviewView';
import { AdminCustomersView } from './components/admin/AdminCustomersView';
import { AdminMcpTowerView } from './components/admin/AdminMcpTowerView';
import { AdminAgentSwarmView } from './components/admin/AdminAgentSwarmView';
import { AdminTaskQueueView } from './components/admin/AdminTaskQueueView';
import { AdminSchemaParityView } from './components/admin/AdminSchemaParityView';
import { AdminLlmGatewayView } from './components/admin/AdminLlmGatewayView';
import { AdminSecurityView } from './components/admin/AdminSecurityView';
import { AdminSystemAuditView } from './components/admin/AdminSystemAuditView';
import { AdminFeatureFlagsView } from './components/admin/AdminFeatureFlagsView';
import { AdminProviderKeysView } from './components/admin/AdminProviderKeysView';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { AdminTwoFactorModal } from './components/admin/AdminTwoFactorModal';
import { HitlApprovalModal } from './components/admin/HitlApprovalModal';
import { ControlCenterSafetyGateModal } from './components/admin/ControlCenterSafetyGateModal';
import { ControlCenterHitlPoliciesView } from './components/admin/ControlCenterHitlPoliciesView';
import { ControlCenterReleaseGateView } from './components/admin/ControlCenterReleaseGateView';
import { ControlCenterAgentBridgeView } from './components/admin/ControlCenterAgentBridgeView';
import { ControlCenterMemoryGraphView } from './components/admin/ControlCenterMemoryGraphView';
import { ControlCenterComputeFleetView } from './components/admin/ControlCenterComputeFleetView';
import { ControlCenterFinOpsOmnichannelView } from './components/admin/ControlCenterFinOpsOmnichannelView';
import { ControlCenterHealthMonitorView } from './components/admin/ControlCenterHealthMonitorView';
import { useHitlApproval } from './hooks/useHitlApproval';
import { PromptLibraryModal } from './components/user/PromptLibraryModal';
import { AuthPage } from './components/auth/AuthPage';
import { UsageView } from './components/UsageView';
import { ToastContainer } from './components/common/ToastContainer';
// AUDIT FIX (2026-11-13, N3): `toast` was used at App.tsx share-link button
// but never imported — tsc --noEmit failed with 2x TS2304. The convenience
// helper is exported by the toast store.
import { toast } from './stores/useToastStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WorkspaceDock } from './components/workspace/WorkspaceDock';

import { useAuthStore } from './stores/useAuthStore';
import { useChatStore } from './stores/useChatStore';
import { useAdminStore } from './stores/useAdminStore';
import { useCustomerStore } from './stores/useCustomerStore';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { useThemeStore } from './stores/useThemeStore';
import { usePlatformStore } from './stores/usePlatformStore';
import { useControlCenterStore } from './stores/useControlCenterStore';
import { useTabRouter } from './hooks/useTabRouter';
import { useMcpTelemetry } from './hooks/useMcpTelemetry';
import { useOsThemeSync } from './hooks/useOsThemeSync';
import { LiveScreenBackdrop } from './components/theme/LiveScreenBackdrop';
import { UserProject, ChatAttachment } from './types';
import { useI18n } from './utils/i18n';

const ADMIN_ONLY_TABS = new Set([
  'admin-overview',
  'hitl-policies',
  'release-gate',
  'external-agents',
  'memory-graph',
  'compute-fleet',
  'finops-omnichannel',
  'health-monitor',
  'mcp-tower',
  'agent-swarm',
  'task-queue',
  'schema-parity',
  'llm-gateway',
  'feature-flags',
  'provider-keys',
  'security',
  'system-audit',
  'customers',
  'models',
  'roles',
  'repos',
]);

const DEV_ONLY_TABS = new Set([
  'user-projects',
  'user-api-keys',
  'user-plugins',
]);

const SUBVIEW_TITLES: Record<string, string> = {
  'chat-history': 'All Conversations',
  'user-projects': 'My Projects',
  'user-api-keys': 'API Keys & Providers',
  'user-knowledge': 'Knowledge Base',
  'user-team': 'Team & Members',
  'user-billing': 'Plan & Usage',
  usage: 'Usage Analytics',
  'user-plugins': 'Plugins & Tools',
  'user-settings': 'Account & Workspace Settings',
  'admin-overview': 'Central Control Center',
  'hitl-policies': 'HITL Approvals & Policies',
  'release-gate': 'Release Gate & Render Deploy',
  'external-agents': 'External Agents & Bridge',
  'memory-graph': 'Memory, Qdrant & AST Graph',
  'compute-fleet': 'Kaggle GPU & CDP Browser Audit',
  'finops-omnichannel': 'FinOps Mesh, Telegram & Cron',
  'health-monitor': 'MCP Resource & Latency Monitor',
  'agent-swarm': 'Autonomous Agent Swarm',
  'task-queue': 'Distributed Task Queue',
  'schema-parity': 'Schema Parity Matrix',
  'llm-gateway': 'LLM Gateway & Pricing',
  'feature-flags': 'Feature Flags',
  'provider-keys': 'Provider API Keys & Infisical Vault',
  security: 'Security & Firewall',
  'system-audit': 'System Audit Log',
  customers: 'Customer Directory',
  'mcp-tower': 'MCP Service Tower',
  roles: 'Roles & Gems Lab',
  models: 'Model Matrix',
  repos: 'Ecosystem Repos',
};

export default function App() {
  useOsThemeSync();

  const { activeTab, setActiveTab } = useTabRouter('chat');

  const {
    authUser,
    impersonatedCustomer,
    currentRole,
    trustedBrowserUntil,
    isTwoFactorModalOpen,
    isAdminAuthModalOpen,
    setIsTwoFactorModalOpen,
    setIsAdminAuthModalOpen,
    handleToggleRole,
    setDeveloperEligibility,
    logout,
    revokeTrustedBrowser,
    impersonateCustomer,
    exitImpersonation,
  } = useAuthStore();

  const {
    sessions,
    activeSessionId,
    activeModel,
    activeRole,
    customInstruction,
    isStreaming,
    streamingContent,
    inferenceError,
    generatingTitleIds,
    isPromptModalOpen,
    isRoleModalOpen,
    selectSession,
    deleteSession,
    renameSession,
    togglePinSession,
    createNewSession,
    branchSession,
    clearCurrentThread,
    exportThread,
    selectModel,
    selectRole,
    setCustomInstruction,
    setIsPromptModalOpen,
    setIsRoleModalOpen,
    sendMessage,
    appendVoiceTurn,
    stopStreaming,
  } = useChatStore();

  const {
    mcpServices,
    isProbingCluster,
    swarmWorkers,
    queueJobs,
    schemaTables,
    gatewayRoutes,
    securityEvents,
    blockedIps,
    auditRecords,
    customers,
    fetchMcpServices,
    fetchAdminSync,
    rebootService,
    rebootAllServices,
    probeCluster,
    getMcpAlertCount,
    toggleSwarmWorker,
    scaleWorker,
    retryQueueJob,
    retryAllDlq,
    clearCompletedJobs,
    runParitySync,
    toggleFailover,
    updateGatewayPrice,
    addBlockedIp,
    removeBlockedIp,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useAdminStore();

  const {
    apiKeys,
    webhooks,
    knowledgeDocs,
    teamMembers,
    invoices,
    userProjects,
    userPlugins,
    userSettings,
    addApiKey,
    updateApiKey,
    revokeApiKey,
    deleteApiKey,
    probeApiKey,
    addWebhook,
    deleteWebhook,
    testWebhook,
    addKnowledgeDoc,
    toggleKnowledgeGrounding,
    deleteKnowledgeDoc,
    inviteTeamMember,
    updateTeamRole,
    removeTeamMember,
    topUpTokens,
    addProject,
    deleteProject,
    togglePlugin,
    addCustomPlugin,
    updateSettings,
    recordTokenUsage,
  } = useCustomerStore();

  const {
    config: platformConfig,
    dismissedBannerMessage,
    fetchConfig,
    dismissBanner,
  } = usePlatformStore();

  const healthAlertCount = useControlCenterStore((s) => s.healthSnapshot?.alerts?.length ?? 0);

  const { lang: appLanguage, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 900 : true
  );
  const [isDeepResearchActive, setIsDeepResearchActive] = useState<boolean>(false);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState<boolean>(false);
  const liveVoiceSystemInstruction =
    customInstruction.trim() ||
    userSettings.customInstructions?.trim() ||
    activeRole.systemInstruction;
  const liveVoice = useLiveVoiceSession({
    systemInstruction: liveVoiceSystemInstruction,
    language: appLanguage,
    onTurnCommitted: appendVoiceTurn,
  });

  useEffect(() => {
    if (isLiveVoiceOpen) {
      liveVoice.connect();
    } else {
      liveVoice.disconnect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveVoiceOpen, appLanguage]);
  const [authModal, setAuthModal] = useState<{ open: boolean; reason?: string }>({ open: false });
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  const [settingsSubTabKey, setSettingsSubTabKey] = useState<number>(0);
  const [isSurveyForceOpen, setIsSurveyForceOpen] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [dangerConfirm, setDangerConfirm] = useState<{
    action: string;
    title: string;
    description: string;
  } | null>(null);
  const [isDangerRunning, setIsDangerRunning] = useState(false);

  const { isDockOpen, toggleDock, setDockOpen } = useWorkspaceStore();
  const isGuest = !authUser;
  const effectiveRole = isGuest ? 'user' : currentRole;
  const layoutMode = isGuest ? 'sidebar-focus' : userSettings.layoutMode || 'sidebar-focus';
  const isDeveloperEligible =
    !isGuest && Boolean(authUser?.isDeveloperEligible || effectiveRole === 'admin');
  const developerMode = isDeveloperEligible && Boolean(userSettings.developerMode);
  const enableKnowledgeGrounding = !isGuest && Boolean(userSettings.enableKnowledgeGrounding);
  const showWorkspaceTips = !isGuest && userSettings.showWorkspaceTips !== false;

  const openAuthModal = (reason?: string) => {
    setAuthModal({ open: true, reason });
  };

  const handleSignOut = () => {
    logout();
    setDockOpen(false);
    setActiveTab('chat', true);
    setAuthModal({ open: true });
  };

  const {
    activeRequest: hitlActiveRequest,
    isProcessing: isHitlProcessing,
    approve: approveHitl,
    reject: rejectHitl,
    dismiss: dismissHitl,
  } = useHitlApproval();

  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const cycleThemeMode = useThemeStore((s) => s.cycleThemeMode);
  const darkMode = resolvedScheme === 'dark';
  const toggleDarkMode = () => cycleThemeMode();

  const contentLayout = userSettings.contentLayout || 'fluid';
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.workspaceLayout = contentLayout;
      document.documentElement.lang = appLanguage;
    }
  }, [contentLayout, appLanguage]);

  // Sync saved custom instructions into chat store on mount
  useEffect(() => {
    if (userSettings.customInstructions && !customInstruction) {
      setCustomInstruction(userSettings.customInstructions);
    }
  }, [userSettings.customInstructions, customInstruction, setCustomInstruction]);

  // Fetch global platform governance config and MCP telemetry
  useEffect(() => {
    fetchConfig();
    fetchMcpServices();
  }, [fetchConfig, fetchMcpServices]);

  // Sync central admin records whenever admin workspace is active
  useEffect(() => {
    if (currentRole === 'admin') {
      fetchAdminSync();
    }
  }, [currentRole, fetchAdminSync]);

  // Smooth tab routing guard: keep default landing page as 'chat' for all roles;
  // only downgrade away from admin-only tabs when leaving admin role.
  const prevRoleRef = useRef(effectiveRole);
  useEffect(() => {
    if (prevRoleRef.current !== effectiveRole) {
      if (effectiveRole !== 'admin' && ADMIN_ONLY_TABS.has(activeTab)) {
        setActiveTab('chat');
      }
      prevRoleRef.current = effectiveRole;
    }
  }, [effectiveRole, activeTab, setActiveTab]);

  // Route & dock safety guard for Guest, Standard, and Developer workspaces
  useEffect(() => {
    if (isGuest) {
      if (isDockOpen) setDockOpen(false);
      if (activeTab !== 'chat') {
        const label = SUBVIEW_TITLES[activeTab] || 'Workspace Features';
        setActiveTab('chat', true);
        setAuthModal({ open: true, reason: label });
      }
      return;
    }
    if (effectiveRole !== 'admin') {
      if (!developerMode && isDockOpen) {
        setDockOpen(false);
      }
      if (
        (!developerMode && DEV_ONLY_TABS.has(activeTab)) ||
        (activeTab === 'user-knowledge' && !enableKnowledgeGrounding)
      ) {
        setActiveTab('chat');
      }
    }
  }, [
    isGuest,
    effectiveRole,
    developerMode,
    enableKnowledgeGrounding,
    isDockOpen,
    setDockOpen,
    activeTab,
    setActiveTab,
  ]);

  const handleSelectTab = (tab: any) => {
    if (isGuest && tab !== 'chat') {
      openAuthModal(SUBVIEW_TITLES[tab] || 'Settings & Workspace Features');
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
      return;
    }
    setActiveTab(tab);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleToggleDeveloperMode = () => {
    if (!isDeveloperEligible) return;
    const next = !developerMode;
    updateSettings({ developerMode: next });
    if (!next) {
      setDockOpen(false);
      if (DEV_ONLY_TABS.has(activeTab)) {
        setActiveTab('chat');
      }
    }
    toast.info(
      next ? 'Developer Mode Enabled' : 'Standard Workspace Active',
      next
        ? 'API keys, repositories, knowledge base, and Workspace Dock are now unlocked.'
        : 'Clean Standard Mode active for everyday work.'
    );
  };

  useMcpTelemetry(currentRole === 'admin');

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const prevSessionMsgRef = useRef<{ sessionId: string; count: number }>({
    sessionId: currentSession?.id || '',
    count: currentSession?.messages?.length || 0,
  });
  const wasStreamingRef = useRef<boolean>(isStreaming);

  useEffect(() => {
    const sid = currentSession?.id || '';
    const count = currentSession?.messages?.length || 0;
    const prev = prevSessionMsgRef.current;

    const messageAddedInSameSession = sid === prev.sessionId && count > prev.count;
    const streamingJustStarted = !wasStreamingRef.current && isStreaming;

    if (messageAddedInSameSession || streamingJustStarted) {
      setSidebarOpen(false);
    }

    prevSessionMsgRef.current = { sessionId: sid, count };
    wasStreamingRef.current = isStreaming;
  }, [currentSession?.id, currentSession?.messages?.length, isStreaming]);

  const wasDockOpenRef = useRef<boolean>(isDockOpen);
  useEffect(() => {
    if (!wasDockOpenRef.current && isDockOpen && window.innerWidth < 1200) {
      setSidebarOpen(false);
    }
    wasDockOpenRef.current = isDockOpen;
  }, [isDockOpen]);

  const handleChatWithProject = (project: UserProject) => {
    createNewSession();
    setActiveTab('chat');
    setSidebarOpen(false);
    sendMessage(
      `Please inspect my connected GitHub repository: "${project.name}" (${project.repoUrl}, branch: ${project.branch}). Description: ${project.description}. Give me a quick architecture summary and recommended next steps.`,
      undefined,
      knowledgeDocs
    );
  };

  const handleTriggerCodeReview = (project: UserProject) => {
    createNewSession();
    setActiveTab('chat');
    setSidebarOpen(false);
    sendMessage(
      `Perform a comprehensive AI Code Review for the repository "${project.name}" (${project.repoUrl}). Check for security vulnerabilities, TypeScript strictness, and clean architecture.`,
      undefined,
      knowledgeDocs
    );
  };

  const handleSendMessageWrapper = async (text: string, attachment?: ChatAttachment) => {
    setSidebarOpen(false);
    const trimmed = text.trim();
    const estimatedTokens = Math.ceil(trimmed.length / 4) + (attachment ? 258 : 0);
    recordTokenUsage(estimatedTokens);

    // When Voice Mode is active, both voice and text inputs trigger spoken voice responses
    if (isLiveVoiceOpen && !attachment && trimmed) {
      appendVoiceTurn(trimmed, '');
      const routed = liveVoice.sendTextPrompt(trimmed, { recordUserTranscript: false });
      if (routed) {
        return;
      }
      // Fallback: generate via standard chat model and speak the response aloud via TTS
      const activeDocs = enableKnowledgeGrounding ? knowledgeDocs : [];
      await sendMessage(trimmed, undefined, activeDocs, isDeepResearchActive);
      const updatedSession = useChatStore
        .getState()
        .sessions.find((s) => s.id === activeSessionId);
      const lastMsg = updatedSession?.messages?.[updatedSession.messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        liveVoice.speakFallbackText(lastMsg.content);
      }
      return;
    }

    const activeDocs = enableKnowledgeGrounding ? knowledgeDocs : [];
    await sendMessage(text, attachment, activeDocs, isDeepResearchActive);
    if (isLiveVoiceOpen) {
      const updatedSession = useChatStore
        .getState()
        .sessions.find((s) => s.id === activeSessionId);
      const lastMsg = updatedSession?.messages?.[updatedSession.messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content) {
        liveVoice.speakFallbackText(lastMsg.content);
      }
    }
  };

  const lastAssistantResponseText = (() => {
    const msgs = currentSession?.messages || [];
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'assistant' && msgs[i].content.trim()) {
        return msgs[i].content;
      }
    }
    return liveVoice.lastSpokenText || '';
  })();

  const handleReadAgainVoice = () => {
    if (!lastAssistantResponseText) return;
    void liveVoice.speakFallbackText(lastAssistantResponseText);
  };

  const handleExecuteDangerAction = async () => {
    if (!dangerConfirm) return;
    setIsDangerRunning(true);
    try {
      if (dangerConfirm.action === 'reboot-all') {
        await rebootAllServices();
      } else if (dangerConfirm.action === 'flush-dlq') {
        retryAllDlq();
      }
      setDangerConfirm(null);
    } finally {
      setIsDangerRunning(false);
    }
  };

  const mcpAlertCount = getMcpAlertCount();
  const activePluginsCount = userPlugins.filter((p) => p.isEnabled).length;
  const isChatEmpty = (currentSession?.messages?.length || 0) === 0 && !isStreaming;
  const totalUserMessages = sessions.reduce(
    (sum, s) => sum + (s.messages?.filter((m) => m.role === 'user').length || 0),
    0
  );
  const showAnnouncement =
    platformConfig.announcementBanner.active &&
    platformConfig.announcementBanner.message.trim().length > 0 &&
    dismissedBannerMessage !== platformConfig.announcementBanner.message;
  const isMaintenanceBlocked = platformConfig.maintenanceMode && effectiveRole !== 'admin';

  const bannerToneClasses =
    platformConfig.announcementBanner.level === 'critical'
      ? 'bg-rose-600 text-white border-rose-700'
      : platformConfig.announcementBanner.level === 'warning'
      ? 'bg-amber-500 text-slate-950 border-amber-600'
      : 'bg-blue-600 text-white border-blue-700';

  return (
    <ErrorBoundary>
      <div
        className={`theme-crossfade flex flex-col h-full w-full text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden relative ${
          currentRole === 'admin' ? 'cyber-scanline' : ''
        }`}
      >
        {/* Dynamic Live Screen Backdrop */}
        <LiveScreenBackdrop isEmpty={isChatEmpty} isChatView={activeTab === 'chat'} />

        {/* Admin Impersonation Bar */}
        {impersonatedCustomer && (
          <div className="relative z-30 px-4 py-1.5 bg-purple-600 text-white text-xs flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                Viewing workspace as <strong>{impersonatedCustomer.name}</strong> ({impersonatedCustomer.tier} · {impersonatedCustomer.email})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                exitImpersonation();
                setActiveTab('admin-overview');
              }}
              className="px-2.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white font-semibold cursor-pointer shrink-0 whitespace-nowrap"
            >
              Exit Impersonation
            </button>
          </div>
        )}

        {/* Global System Announcement Banner */}
        {showAnnouncement && (
          <div className={`relative z-30 px-4 py-1.5 text-xs border-b flex items-center justify-between gap-3 shrink-0 ${bannerToneClasses}`}>
            <div className="flex items-center gap-2 min-w-0">
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">{platformConfig.announcementBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => dismissBanner(platformConfig.announcementBanner.message)}
              aria-label="Dismiss announcement"
              className="p-0.5 rounded hover:bg-black/15 cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top Bar Navigation (Classic layout mode) */}
        {layoutMode === 'classic' && (
          <div className="relative z-10">
            <Navbar
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              onNewSession={createNewSession}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              activeModel={activeModel}
              currentRole={effectiveRole}
              onToggleRole={() => handleToggleRole()}
              mcpAlertCount={mcpAlertCount}
              authUser={authUser}
              onSignOut={handleSignOut}
              trustedUntil={trustedBrowserUntil}
              isDeveloperEligible={isDeveloperEligible}
              developerMode={developerMode}
              onToggleDeveloperMode={handleToggleDeveloperMode}
              isGuest={isGuest}
              onRequestAuth={openAuthModal}
            />
          </div>
        )}

        {/* Main Viewport Container */}
        <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative z-10">
          {/* Maintenance Lock Overlay for non-admin workspaces */}
          {isMaintenanceBlocked && (
            <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6">
              <div className="max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 text-center space-y-4 shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto">
                  <Lock className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Scheduled Maintenance Active
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {platformConfig.maintenanceMessage}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {(authUser?.isAdminEligible || impersonatedCustomer) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (impersonatedCustomer) {
                          exitImpersonation();
                          setActiveTab('admin-overview');
                        } else {
                          handleToggleRole('admin');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Return to Admin Console</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (isGuest ? openAuthModal('Account Access') : handleSignOut())}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    {isGuest ? 'Sign In' : 'Sign Out'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Studio Sidebar */}
          <Sidebar
            sessions={sessions}
            activeSessionId={currentSession?.id || ''}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onTogglePinSession={togglePinSession}
            onNewSession={createNewSession}
            activeRole={activeRole}
            onOpenRoleModal={() =>
              isGuest
                ? openAuthModal('Role & Model Customization')
                : setIsRoleModalOpen(true)
            }
            isOpen={sidebarOpen}
            onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
            onSelectTab={handleSelectTab}
            activeTab={activeTab}
            currentRole={effectiveRole}
            onToggleRole={() => handleToggleRole()}
            projectsCount={userProjects.length}
            activePluginsCount={activePluginsCount}
            customersCount={customers.length}
            mcpAlertCount={mcpAlertCount}
            mcpTotalCount={mcpServices.length}
            healthAlertCount={healthAlertCount || mcpAlertCount}
            authUser={authUser}
            onSignOut={handleSignOut}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            layoutMode={layoutMode}
            developerMode={developerMode}
            isDeveloperEligible={isDeveloperEligible}
            enableKnowledgeGrounding={enableKnowledgeGrounding}
            onToggleDeveloperMode={handleToggleDeveloperMode}
            tokensUsed={userSettings.monthlyTokensUsed}
            tokensLimit={userSettings.monthlyTokensLimit}
            isGuest={isGuest}
            onRequestAuth={openAuthModal}
            generatingTitleIds={generatingTitleIds}
          />

          {/* Floating Sidebar Expand Button for Chat in Sidebar Focus Mode */}
          {activeTab === 'chat' && layoutMode === 'sidebar-focus' && !sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="absolute top-3.5 left-3.5 z-30 p-2 rounded-xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-colors cursor-pointer"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          {/* 1. Chat Workspace */}
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative">
              <main className="@container/chat flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden relative bg-transparent">
                {/* Streamlined Top-Right Chat Controls */}
                <div
                  className={`relative z-20 px-3 sm:px-4 pt-3 flex items-center justify-end gap-1.5 flex-wrap pointer-events-none shrink-0 ${
                    layoutMode === 'sidebar-focus' && !sidebarOpen ? 'pl-14' : ''
                  }`}
                >
                  <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end">
                    {isGuest && (
                      <button
                        type="button"
                        onClick={() => openAuthModal('Settings & Full Workspace')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold theme-btn-primary cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{t.signInSignUp}</span>
                      </button>
                    )}

                    {(currentSession?.messages?.length || 0) > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (isGuest) {
                              openAuthModal('Pinned Conversations');
                              return;
                            }
                            if (currentSession?.id) {
                              togglePinSession(currentSession.id);
                            }
                          }}
                          title={currentSession?.isPinned ? 'Unpin from Sidebar' : 'Pin chat to Sidebar'}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium backdrop-blur-md border transition-colors cursor-pointer shadow-xs ${
                            currentSession?.isPinned
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400'
                              : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                          <span className="hidden md:inline">{currentSession?.isPinned ? t.pinned : t.pin}</span>
                        </button>

                        {developerMode && (
                          <button
                            type="button"
                            onClick={() => {
                              if (currentSession?.id) {
                                branchSession(currentSession.id);
                              }
                            }}
                            title="Branch into new conversation"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer shadow-xs"
                          >
                            <GitFork className="w-3 h-3" />
                            <span className="hidden md:inline">{t.branch}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={async () => {
                            if (isGuest) {
                              openAuthModal('Sharing Conversations');
                              return;
                            }
                            if (currentSession?.id) {
                              try {
                                const res = await shareService.generateShareLink(currentSession.id);
                                await navigator.clipboard.writeText(res.share_url);
                                toast.success('Share Link Copied', res.share_url);
                              } catch {
                                toast.error('Share Failed', 'Could not generate share link');
                              }
                            }
                          }}
                          title="Generate public share link"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer shadow-xs"
                        >
                          <Share2 className="w-3 h-3" />
                          <span className="hidden md:inline">{t.share}</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowExportMenu((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden md:inline">{t.exportBtn}</span>
                          </button>

                          {showExportMenu && (
                            <>
                              <div
                                className="fixed inset-0 z-30"
                                onClick={() => setShowExportMenu(false)}
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 p-1 text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportThread('markdown');
                                    setShowExportMenu(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  Markdown (.md)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    exportThread('text');
                                    setShowExportMenu(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  Plain Text (.txt)
                                </button>
                                {developerMode && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      exportThread('json');
                                      setShowExportMenu(false);
                                    }}
                                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    JSON (.json)
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={clearCurrentThread}
                          title="Clear Thread"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-500 transition-colors cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span className="hidden md:inline">{t.clear}</span>
                        </button>
                      </>
                    )}

                    {layoutMode === 'sidebar-focus' && (developerMode || currentRole === 'admin') && (
                      <button
                        type="button"
                        onClick={toggleDock}
                        aria-label={isDockOpen ? 'Close workspace dock' : 'Open workspace dock'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
                          isDockOpen
                            ? 'theme-accent-active'
                            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <PanelRight className="w-3.5 h-3.5" />
                        <span>{isDockOpen ? t.closeDock : t.workspaceDock}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isChatEmpty ? (
                  <div className="relative z-10 flex-1 min-h-0 overflow-y-auto chat-scroll-clean px-4 py-6 flex flex-col">
                    <div className="my-auto w-full flex flex-col items-center">
                      <ChatEmptyState
                        activeRole={activeRole}
                        activeModel={activeModel}
                        userName={authUser?.name || (isGuest ? 'Guest' : undefined)}
                        developerMode={developerMode}
                      />
                      <div className="workspace-input-container mt-2">
                        <ChatInput
                          onSendMessage={handleSendMessageWrapper}
                          onStopStreaming={stopStreaming}
                          isStreaming={isStreaming}
                          activeModel={activeModel}
                          onSelectModel={selectModel}
                          onOpenPromptLibrary={() =>
                            isGuest
                              ? openAuthModal('Prompt Library')
                              : setIsPromptModalOpen(true)
                          }
                          isGroundingActive={knowledgeDocs.some((d) => d.isGroundingActive)}
                          onToggleGrounding={() => {
                            if (isGuest) {
                              openAuthModal('Knowledge Base & RAG Grounding');
                              return;
                            }
                            if (knowledgeDocs.length > 0) {
                              toggleKnowledgeGrounding(knowledgeDocs[0].id);
                            } else {
                              handleSelectTab('user-knowledge');
                            }
                          }}
                          isDeepResearchActive={isDeepResearchActive}
                          onToggleDeepResearch={() =>
                            isGuest
                              ? openAuthModal('Deep Research')
                              : setIsDeepResearchActive((v) => !v)
                          }
                          developerMode={developerMode}
                          enableKnowledgeGrounding={enableKnowledgeGrounding}
                          onOpenLiveVoice={() => setIsLiveVoiceOpen((v) => !v)}
                          isLiveVoiceOpen={isLiveVoiceOpen}
                          voiceStatus={liveVoice.status}
                          canReadAgain={Boolean(lastAssistantResponseText)}
                          onReadAgain={handleReadAgainVoice}
                        />
                      </div>
                      <WorkspaceTipBar
                        visible={showWorkspaceTips && effectiveRole === 'user'}
                        onAction={(actionType) => {
                          if (actionType === 'open-settings') {
                            handleSelectTab('user-settings');
                          } else if (actionType === 'open-knowledge') {
                            handleSelectTab('user-knowledge');
                          } else if (actionType === 'open-recipes') {
                            setIsPromptModalOpen(true);
                          } else if (actionType === 'toggle-research') {
                            setIsDeepResearchActive((v) => !v);
                          }
                        }}
                        onMuteTips={() => {
                          updateSettings({ showWorkspaceTips: false });
                          toast.info('Tips Hidden', 'Re-enable Workspace Discovery Tips anytime in Settings.');
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ChatThread
                      messages={currentSession?.messages || []}
                      activeRole={activeRole}
                      activeModel={activeModel}
                      isStreaming={isStreaming}
                      streamingContent={streamingContent}
                      onSendPrompt={handleSendMessageWrapper}
                      error={inferenceError}
                      userName={authUser?.name || (isGuest ? 'Guest' : undefined)}
                      developerMode={developerMode}
                      onSpeakText={(txt) => liveVoice.speakFallbackText(txt)}
                    />

                    <ChatInput
                      onSendMessage={handleSendMessageWrapper}
                      onStopStreaming={stopStreaming}
                      isStreaming={isStreaming}
                      activeModel={activeModel}
                      onSelectModel={selectModel}
                      onOpenPromptLibrary={() =>
                        isGuest
                          ? openAuthModal('Prompt Library')
                          : setIsPromptModalOpen(true)
                      }
                      isGroundingActive={knowledgeDocs.some((d) => d.isGroundingActive)}
                      onToggleGrounding={() => {
                        if (isGuest) {
                          openAuthModal('Knowledge Base & RAG Grounding');
                          return;
                        }
                        if (knowledgeDocs.length > 0) {
                          toggleKnowledgeGrounding(knowledgeDocs[0].id);
                        } else {
                          handleSelectTab('user-knowledge');
                        }
                      }}
                      isDeepResearchActive={isDeepResearchActive}
                      onToggleDeepResearch={() =>
                        isGuest
                          ? openAuthModal('Deep Research')
                          : setIsDeepResearchActive((v) => !v)
                      }
                      developerMode={developerMode}
                      enableKnowledgeGrounding={enableKnowledgeGrounding}
                      onOpenLiveVoice={() => setIsLiveVoiceOpen((v) => !v)}
                      isLiveVoiceOpen={isLiveVoiceOpen}
                      voiceStatus={liveVoice.status}
                      canReadAgain={Boolean(lastAssistantResponseText)}
                      onReadAgain={handleReadAgainVoice}
                    />
                  </div>
                )}
              </main>

              <LiveVoicePanel
                isOpen={isLiveVoiceOpen}
                status={liveVoice.status}
                voiceName={liveVoice.voiceName}
                liveModelText={liveVoice.liveModelText}
                levelsRef={liveVoice.levelsRef}
                canReadAgain={Boolean(lastAssistantResponseText)}
                onReadAgain={handleReadAgainVoice}
              />

              {(developerMode || effectiveRole === 'admin') && (
                <WorkspaceDock developerMode={developerMode} />
              )}
            </div>
          )}

          {/* Unified Sub-View Shell with Back / Home / Close Bar & Responsive Containment */}
          {activeTab !== 'chat' && (
            <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bg-transparent">
              <div className="shrink-0 px-3 sm:px-6 py-2.5 border-b theme-surface-glass flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {!sidebarOpen && (
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(true)}
                      aria-label="Open sidebar"
                      title="Open sidebar"
                      className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer shrink-0"
                    >
                      <PanelLeft className="w-4 h-4" />
                    </button>
                  )}

                  {effectiveRole === 'admin' && activeTab !== 'admin-overview' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('admin-overview')}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{t.overview}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-900/80 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {effectiveRole === 'admin' ? (
                      <Home className="w-3.5 h-3.5 theme-accent-text" />
                    ) : (
                      <ArrowLeft className="w-3.5 h-3.5 theme-accent-text" />
                    )}
                    <span>{effectiveRole === 'admin' ? t.chatHome : t.backToChat}</span>
                  </button>

                  <span aria-hidden="true" className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
                  <span className="hidden sm:inline text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {(() => {
                      const localizedMap: Record<string, string> = {
                        'chat-history': t.subviewChatHistory,
                        'user-projects': t.subviewProjects,
                        'user-api-keys': t.subviewApiKeys,
                        'user-knowledge': t.subviewKnowledge,
                        'user-team': t.subviewTeam,
                        'user-billing': t.subviewBilling,
                        usage: t.subviewUsage,
                        'user-plugins': t.subviewPlugins,
                        'user-settings': t.subviewSettings,
                      };
                      return localizedMap[activeTab] || SUBVIEW_TITLES[activeTab] || 'Workspace';
                    })()}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('chat')}
                    aria-label="Close and return to chat"
                    title="Close and return to Chat"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.close}</span>
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">

          {/* All Conversations / Chat History View */}
          {activeTab === 'chat-history' && (
            <ChatHistoryView
              sessions={sessions}
              activeSessionId={currentSession?.id || ''}
              onSelectSession={selectSession}
              onDeleteSession={deleteSession}
              onRenameSession={renameSession}
              onTogglePinSession={togglePinSession}
              onBranchSession={branchSession}
              onNewSession={createNewSession}
              onOpenChat={() => setActiveTab('chat')}
              developerMode={developerMode}
            />
          )}

          {/* 2. Customer Workspace Views */}
          {activeTab === 'user-projects' && (
            <UserProjectsView
              projects={userProjects}
              onAddProject={addProject}
              onDeleteProject={deleteProject}
              onChatWithProject={handleChatWithProject}
              onTriggerCodeReview={handleTriggerCodeReview}
            />
          )}

          {activeTab === 'user-api-keys' && (
            <UserApiKeysView
              apiKeys={apiKeys}
              onAddApiKey={addApiKey}
              onUpdateApiKey={updateApiKey}
              onRevokeApiKey={revokeApiKey}
              onDeleteApiKey={deleteApiKey}
              onProbeApiKey={probeApiKey}
              webhooks={webhooks}
              onAddWebhook={addWebhook}
              onDeleteWebhook={deleteWebhook}
              onTestWebhook={testWebhook}
            />
          )}

          {activeTab === 'user-knowledge' && (
            <UserKnowledgeBaseView
              documents={knowledgeDocs}
              onAddDocument={addKnowledgeDoc}
              onToggleGrounding={toggleKnowledgeGrounding}
              onDeleteDocument={deleteKnowledgeDoc}
            />
          )}

          {activeTab === 'user-team' && (
            <UserTeamView
              members={teamMembers}
              onInviteMember={inviteTeamMember}
              onUpdateRole={updateTeamRole}
              onRemoveMember={removeTeamMember}
              developerMode={developerMode}
            />
          )}

          {(activeTab === 'user-billing' || (activeTab === 'usage' && effectiveRole !== 'admin')) && (
            <UserPlanUsageView
              planTier={authUser?.plan || userSettings.plan}
              invoices={invoices}
              currentTokensUsed={userSettings.monthlyTokensUsed}
              tokensLimit={userSettings.monthlyTokensLimit}
              sessions={sessions}
              darkMode={darkMode}
              onTopUpTokens={topUpTokens}
              developerMode={developerMode}
            />
          )}

          {activeTab === 'user-plugins' && (
            <UserPluginsView
              plugins={userPlugins}
              onTogglePlugin={togglePlugin}
              onAddCustomPlugin={addCustomPlugin}
            />
          )}

          {activeTab === 'user-settings' && (
            <UserSettingsView
              settings={userSettings}
              onUpdateSettings={updateSettings}
              onSwitchRole={(newRole) => handleToggleRole(newRole)}
              currentRole={currentRole}
              isAdminEligible={authUser?.isAdminEligible}
              isDeveloperEligible={isDeveloperEligible}
              effectiveDeveloperMode={developerMode}
              onToggleDeveloperMode={handleToggleDeveloperMode}
              onToggleDeveloperEligibility={setDeveloperEligibility}
              trustedUntil={trustedBrowserUntil}
              onRevokeTrustedBrowser={revokeTrustedBrowser}
              onSignOut={logout}
              onOpenFeedbackSurvey={() => setIsSurveyForceOpen(true)}
              onOpenKnowledgeBase={() => setActiveTab('user-knowledge')}
              initialSubTab={settingsSubTab}
              subTabRequestKey={settingsSubTabKey}
              onOpenLiveVoice={() => {
                setActiveTab('chat');
                setIsLiveVoiceOpen(true);
              }}
            />
          )}

          {/* 3. Admin Usage Analytics */}
          {activeTab === 'usage' && currentRole === 'admin' && (
            <UsageView sessions={sessions} darkMode={darkMode} />
          )}

          {/* 4. Admin Studio Command Center & Operations */}
          {activeTab === 'admin-overview' && (
            <AdminOverviewView
              customers={customers}
              services={mcpServices}
              workers={swarmWorkers}
              jobs={queueJobs}
              onNavigateTab={setActiveTab}
              onOpenDangerConfirm={(action, title, description) =>
                setDangerConfirm({ action, title, description })
              }
            />
          )}

          {activeTab === 'hitl-policies' && <ControlCenterHitlPoliciesView />}

          {activeTab === 'release-gate' && <ControlCenterReleaseGateView />}

          {activeTab === 'external-agents' && <ControlCenterAgentBridgeView />}

          {activeTab === 'memory-graph' && <ControlCenterMemoryGraphView />}

          {activeTab === 'compute-fleet' && <ControlCenterComputeFleetView />}

          {activeTab === 'finops-omnichannel' && <ControlCenterFinOpsOmnichannelView />}

          {activeTab === 'agent-swarm' && (
            <AdminAgentSwarmView
              workers={swarmWorkers}
              onToggleWorkerStatus={toggleSwarmWorker}
              onScaleConcurrency={scaleWorker}
            />
          )}

          {activeTab === 'task-queue' && (
            <AdminTaskQueueView
              jobs={queueJobs}
              onRetryJob={retryQueueJob}
              onRetryAllDlq={retryAllDlq}
              onClearCompleted={clearCompletedJobs}
            />
          )}

          {activeTab === 'schema-parity' && (
            <AdminSchemaParityView tables={schemaTables} onRunParitySync={runParitySync} />
          )}

          {activeTab === 'llm-gateway' && (
            <AdminLlmGatewayView
              routes={gatewayRoutes}
              onToggleFailover={toggleFailover}
              onUpdatePrice={updateGatewayPrice}
            />
          )}

          {activeTab === 'feature-flags' && <AdminFeatureFlagsView />}

          {activeTab === 'provider-keys' && <AdminProviderKeysView />}

          {activeTab === 'security' && (
            <AdminSecurityView
              securityEvents={securityEvents}
              onAddBlockedIp={addBlockedIp}
              onRemoveBlockedIp={removeBlockedIp}
              blockedIps={blockedIps}
            />
          )}

          {activeTab === 'system-audit' && <AdminSystemAuditView auditRecords={auditRecords} />}

          {activeTab === 'customers' && (
            <AdminCustomersView
              customers={customers}
              onAddCustomer={addCustomer}
              onUpdateCustomer={updateCustomer}
              onDeleteCustomer={deleteCustomer}
              onImpersonateCustomer={(cust) => {
                impersonateCustomer(cust);
                setActiveTab('chat');
              }}
            />
          )}

          {activeTab === 'health-monitor' && <ControlCenterHealthMonitorView />}

          {activeTab === 'mcp-tower' && (
            <AdminMcpTowerView
              services={mcpServices}
              onRebootService={rebootService}
              onRebootAll={rebootAllServices}
              onProbeCluster={probeCluster}
              isProbing={isProbingCluster}
            />
          )}

          {activeTab === 'roles' && (
            <RoleLab
              onSelectRoleForChat={(role, prompt) => {
                selectRole(role, prompt);
                setActiveTab('chat');
              }}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'models' && (
            <ModelMatrix
              activeModel={activeModel}
              onSelectModel={selectModel}
              onNavigateToChat={() => setActiveTab('chat')}
            />
          )}

          {activeTab === 'repos' && <RepoHub />}
              </div>
            </div>
          )}
        </div>

        {/* Danger Zone Confirmation Modal */}
        {dangerConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-rose-200 dark:border-rose-900/60 shadow-xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {dangerConfirm.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDangerConfirm(null)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {dangerConfirm.description}
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDangerConfirm(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDangerRunning}
                  onClick={handleExecuteDangerAction}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isDangerRunning ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals & Dialogs */}
        <RoleModal
          isOpen={isRoleModalOpen}
          onClose={() => setIsRoleModalOpen(false)}
          activeRole={activeRole}
          customInstruction={customInstruction}
          onSaveRole={(role, prompt) => selectRole(role, prompt)}
          activeModel={activeModel}
          onSelectModel={selectModel}
        />

        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={() => {
            setIsAdminAuthModalOpen(false);
            handleToggleRole('admin');
            setActiveTab('admin-overview');
          }}
        />

        <AdminTwoFactorModal
          isOpen={isTwoFactorModalOpen}
          onClose={() => setIsTwoFactorModalOpen(false)}
          onSuccess={(newTrustedUntil) => {
            if (newTrustedUntil) {
              localStorage.setItem('supremeai_trusted_browser_until', String(newTrustedUntil));
              useAuthStore.setState({ trustedBrowserUntil: newTrustedUntil });
            }
            setIsTwoFactorModalOpen(false);
            useAuthStore.setState({ currentRole: 'admin' });
            localStorage.setItem('supremeai_studio_user_role', 'admin');
            setActiveTab('admin-overview');
          }}
          userEmail={authUser?.email || 'admin@supremeai.bd'}
        />

        <HitlApprovalModal
          isOpen={Boolean(hitlActiveRequest)}
          request={hitlActiveRequest}
          onApprove={async (id) => {
            await approveHitl(id);
          }}
          onReject={async (id, reason) => {
            await rejectHitl(id, reason);
          }}
          onClose={dismissHitl}
          isProcessing={isHitlProcessing}
        />

        <ControlCenterSafetyGateModal />

        <PromptLibraryModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onSelectTemplate={(text) => handleSendMessageWrapper(text)}
          developerMode={developerMode}
        />

        {!isGuest && (
          <WorkspaceMicroSurvey
            totalUserMessages={totalUserMessages}
            userEmail={authUser?.email}
            developerMode={developerMode}
            forceOpen={isSurveyForceOpen}
            onCloseForceOpen={() => setIsSurveyForceOpen(false)}
          />
        )}

        {isGuest && authModal.open && (
          <AuthPage
            isModal
            authReason={authModal.reason}
            onClose={() => setAuthModal({ open: false })}
            onLoginSuccess={() => {
              setAuthModal({ open: false });
              setActiveTab('chat');
            }}
            darkMode={darkMode}
          />
        )}

        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
