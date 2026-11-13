import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  PanelRight,
  BookOpen,
  Sliders,
  Download,
  Trash2,
  Database,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatThread } from './components/ChatThread';
import { ChatEmptyState } from './components/chat/ChatEmptyState';
import { ChatInput } from './components/ChatInput';
import { RoleModal } from './components/RoleModal';
import { RoleLab } from './components/RoleLab';
import { ModelMatrix } from './components/ModelMatrix';
import { RepoHub } from './components/RepoHub';
import { UserProjectsView } from './components/user/UserProjectsView';
import { UserPluginsView } from './components/user/UserPluginsView';
import { UserSettingsView } from './components/user/UserSettingsView';
import { UserApiKeysView } from './components/user/UserApiKeysView';
import { UserKnowledgeBaseView } from './components/user/UserKnowledgeBaseView';
import { UserTeamView } from './components/user/UserTeamView';
import { UserBillingView } from './components/user/UserBillingView';
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
import { useHitlApproval } from './hooks/useHitlApproval';
import { PromptLibraryModal } from './components/user/PromptLibraryModal';
import { AuthPage } from './components/auth/AuthPage';
import { UsageView } from './components/UsageView';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { WorkspaceDock } from './components/workspace/WorkspaceDock';

import { useAuthStore } from './stores/useAuthStore';
import { useChatStore } from './stores/useChatStore';
import { useAdminStore } from './stores/useAdminStore';
import { useCustomerStore } from './stores/useCustomerStore';
import { useWorkspaceStore } from './stores/useWorkspaceStore';
import { useTabRouter } from './hooks/useTabRouter';
import { useMcpTelemetry } from './hooks/useMcpTelemetry';
import { UserProject, ChatAttachment } from './types';

const THEME_KEY = 'supremeai_studio_theme';

export const ReactAmbientAura: React.FC<{ isEmpty?: boolean }> = ({ isEmpty = true }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, nx: 0.5, ny: 0.5 });
  const [keyPulse, setKeyPulse] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / Math.max(window.innerWidth, 1);
      const ny = e.clientY / Math.max(window.innerHeight, 1);
      setMousePos({
        x: (nx - 0.5) * 44,
        y: (ny - 0.5) * 44,
        nx,
        ny,
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Enter') {
        setKeyPulse((prev) => prev + 1);
        clearTimeout(timeout);
        timeout = setTimeout(() => setKeyPulse(0), 340);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, []);

  const isTyping = keyPulse > 0;
  const waveAmplitude = isTyping ? 24 : 12 + (mousePos.ny - 0.5) * 18;
  const waveShift = (mousePos.nx - 0.5) * 40;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-500 ${
        isEmpty ? 'opacity-100' : 'opacity-30'
      }`}
    >
      {/* Interactive Mouse & Keystroke Glowing Neural Orb */}
      <motion.div
        animate={{
          x: mousePos.x * 1.1,
          y: mousePos.y * 1.1,
          scale: isTyping ? 1.18 : [1, 1.07, 1],
          opacity: isTyping ? 0.65 : [0.35, 0.5, 0.35],
        }}
        transition={{
          x: { type: 'spring', stiffness: 55, damping: 20 },
          y: { type: 'spring', stiffness: 55, damping: 20 },
          scale: isTyping
            ? { duration: 0.22 }
            : { duration: 7, repeat: Infinity, ease: 'easeInOut' },
          opacity: isTyping
            ? { duration: 0.22 }
            : { duration: 7, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[26rem] h-[26rem] rounded-full bg-gradient-to-tr from-cyan-400/25 via-blue-500/20 to-violet-500/25 blur-3xl"
      />

      {/* Secondary Counter-Orbital Glow */}
      <motion.div
        animate={{
          x: -mousePos.x * 0.7,
          y: -mousePos.y * 0.7,
          scale: isTyping ? 1.12 : 1,
        }}
        transition={{ type: 'spring', stiffness: 45, damping: 22 }}
        className="absolute top-[42%] left-[52%] -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-br from-violet-500/15 via-cyan-400/15 to-emerald-400/10 blur-2xl"
      />

      {/* Interactive SVG Neural Wave */}
      <svg
        viewBox="0 0 1200 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 w-full h-72 opacity-55 dark:opacity-65"
      >
        <defs>
          <linearGradient id="neural-wave-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(6, 182, 212, 0)" />
            <stop offset="30%" stopColor="rgba(6, 182, 212, 0.45)" />
            <stop offset="70%" stopColor="rgba(139, 92, 246, 0.45)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0)" />
          </linearGradient>
          <linearGradient id="neural-wave-blue" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.35)" />
            <stop offset="100%" stopColor="rgba(6, 182, 212, 0)" />
          </linearGradient>
        </defs>

        <motion.path
          animate={{
            d: `M 0 160 Q ${300 + waveShift} ${160 - waveAmplitude * 2.2}, 600 160 T 1200 160`,
            strokeWidth: isTyping ? 2.2 : 1.4,
          }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          fill="none"
          stroke="url(#neural-wave-cyan)"
        />

        <motion.path
          animate={{
            d: `M 0 170 Q ${320 - waveShift} ${170 + waveAmplitude * 1.9}, 600 165 T 1200 155`,
            strokeWidth: isTyping ? 1.8 : 1.1,
          }}
          transition={{ type: 'spring', stiffness: 70, damping: 20 }}
          fill="none"
          stroke="url(#neural-wave-blue)"
        />
      </svg>
    </div>
  );
};

export default function App() {
  // Routing hook via Query Parameter (?tab=...) and Hash (#...)
  const { activeTab, setActiveTab } = useTabRouter('chat');

  // Modular Stores
  const {
    authUser,
    currentRole,
    trustedBrowserUntil,
    isTwoFactorModalOpen,
    isAdminAuthModalOpen,
    setIsTwoFactorModalOpen,
    setIsAdminAuthModalOpen,
    handleToggleRole,
    logout,
    revokeTrustedBrowser,
    impersonateCustomer,
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
    isPromptModalOpen,
    isRoleModalOpen,
    selectSession,
    deleteSession,
    renameSession,
    createNewSession,
    clearCurrentThread,
    exportThread,
    selectModel,
    selectRole,
    setIsPromptModalOpen,
    setIsRoleModalOpen,
    sendMessage,
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
    revokeApiKey,
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

  // Navigation & Layout UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatUtilityMode, setChatUtilityMode] = useState<'chat' | 'task'>('chat');
  const [isDeepResearchActive, setIsDeepResearchActive] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { isDockOpen, toggleDock } = useWorkspaceStore();
  const layoutMode = userSettings.layoutMode || 'sidebar-focus';

  // Human-in-the-Loop Safety Interception
  const {
    activeRequest: hitlActiveRequest,
    isProcessing: isHitlProcessing,
    approve: approveHitl,
    reject: rejectHitl,
    dismiss: dismissHitl,
  } = useHitlApproval();

  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Initial fetch for MCP cluster telemetry
  useEffect(() => {
    fetchMcpServices();
  }, [fetchMcpServices]);

  // Live Server-Sent Events (SSE) telemetry pipeline for Admin Studio
  useMcpTelemetry(currentRole === 'admin');

  // Active session lookup
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Auto-hide left sidebar whenever a user sends a message or streaming starts
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

  // Also collapse left sidebar when opening WorkspaceDock on medium/narrow viewports to prevent crowding
  const wasDockOpenRef = useRef<boolean>(isDockOpen);
  useEffect(() => {
    if (!wasDockOpenRef.current && isDockOpen && window.innerWidth < 1200) {
      setSidebarOpen(false);
    }
    wasDockOpenRef.current = isDockOpen;
  }, [isDockOpen]);

  // Project Quick Action Handlers
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
    const estimatedTokens = Math.ceil(text.length / 4) + (attachment ? 258 : 0);
    recordTokenUsage(estimatedTokens);
    await sendMessage(text, attachment, knowledgeDocs, isDeepResearchActive);
  };

  // If user is unauthenticated, show Authentication page
  if (!authUser) {
    return (
      <ErrorBoundary>
        <AuthPage
          onLoginSuccess={() => {
            setActiveTab('chat');
          }}
          darkMode={darkMode}
        />
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  const mcpAlertCount = getMcpAlertCount();
  const activePluginsCount = userPlugins.filter((p) => p.isEnabled).length;
  const isChatEmpty = (currentSession?.messages?.length || 0) === 0 && !isStreaming;

  return (
    <ErrorBoundary>
      <div
        className={`flex flex-col h-full w-full bg-[#f8fafc] dark:bg-[#080b11] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors relative ${
          currentRole === 'admin' ? 'cyber-scanline' : ''
        }`}
      >
        {/* Cyber-Ground Perspective Digital Neon Grid */}
        <div className="absolute inset-0 cyber-ground-grid pointer-events-none z-0" />

        {/* Ambient Neon Plasma Aurora Glow Blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/15 dark:bg-cyan-500/10 blur-3xl pointer-events-none z-0 cyber-aurora-cyan" />
        <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-purple-500/15 dark:bg-violet-600/10 blur-3xl pointer-events-none z-0 cyber-aurora-violet" />

        {/* Top Bar Navigation (Only shown in Classic Top Navigation layout mode) */}
        {layoutMode === 'classic' && (
          <div className="relative z-10">
            <Navbar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              onNewSession={createNewSession}
              darkMode={darkMode}
              onToggleDarkMode={toggleDarkMode}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              activeModel={activeModel}
              currentRole={currentRole}
              onToggleRole={() => handleToggleRole()}
              mcpAlertCount={mcpAlertCount}
              authUser={authUser}
              onSignOut={logout}
              trustedUntil={trustedBrowserUntil}
            />
          </div>
        )}

        {/* Main Viewport Container */}
        <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative z-10">
          {/* Studio Sidebar */}
          <Sidebar
            sessions={sessions}
            activeSessionId={currentSession?.id || ''}
            onSelectSession={selectSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onNewSession={createNewSession}
            activeRole={activeRole}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
            isOpen={sidebarOpen}
            onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
            onSelectTab={setActiveTab}
            activeTab={activeTab}
            currentRole={currentRole}
            onToggleRole={() => handleToggleRole()}
            projectsCount={userProjects.length}
            activePluginsCount={activePluginsCount}
            customersCount={customers.length}
            mcpAlertCount={mcpAlertCount}
            authUser={authUser}
            onSignOut={logout}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            layoutMode={layoutMode}
          />

          {/* Floating Sidebar Expand Button for Sidebar Focus Mode when Sidebar is collapsed */}
          {layoutMode === 'sidebar-focus' && !sidebarOpen && (
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

          {/* 1. Chat Workspace + Collapsible Resizable Right Split Dock (Preview / Terminal / Browser / Code) */}
          {activeTab === 'chat' && (
            <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden relative">
              <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(219,234,254,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(30,58,138,0.2),rgba(19,19,20,0))]">
                {/* Interactive React Ambient Aura in empty chat area */}
                <ReactAmbientAura isEmpty={isChatEmpty} />

                {/* Right-Aligned Workspace & Chat Utility Controls (Moved from bottom bar to right side) */}
                <div
                  className={`relative z-20 px-3 sm:px-4 pt-3 flex items-center justify-end gap-1.5 flex-wrap pointer-events-none shrink-0 ${
                    layoutMode === 'sidebar-focus' && !sidebarOpen ? 'pl-14' : ''
                  }`}
                >
                  <div className="pointer-events-auto flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Chat | Task mode selector */}
                    <div className="flex items-center p-0.5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-[11px] shadow-xs">
                      <button
                        type="button"
                        onClick={() => setChatUtilityMode('chat')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          chatUtilityMode === 'chat'
                            ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => setChatUtilityMode('task')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                          chatUtilityMode === 'task'
                            ? 'bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Task
                      </button>
                    </div>

                    {/* RAG Active indicator */}
                    {knowledgeDocs.filter((d) => d.isGroundingActive).length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('user-knowledge')}
                        title="Knowledge Base Grounding Active"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-mono font-medium cursor-pointer hover:bg-cyan-500/20 transition-colors"
                      >
                        <Database className="w-3 h-3" />
                        <span>RAG ({knowledgeDocs.filter((d) => d.isGroundingActive).length})</span>
                      </button>
                    )}

                    {/* Recipes button */}
                    <button
                      type="button"
                      onClick={() => setIsPromptModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors cursor-pointer shadow-xs"
                    >
                      <BookOpen className="w-3 h-3 text-cyan-500" />
                      <span className="hidden sm:inline">Recipes</span>
                    </button>

                    {/* Role selector */}
                    <button
                      type="button"
                      onClick={() => setIsRoleModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Sliders className="w-3 h-3" />
                      <span className="hidden md:inline">{activeRole.name}</span>
                    </button>

                    {/* Export & Clear when messages exist */}
                    {(currentSession?.messages?.length || 0) > 0 && (
                      <>
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowExportMenu((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden md:inline">Export</span>
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
                                    exportThread('json');
                                    setShowExportMenu(false);
                                  }}
                                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                  JSON (.json)
                                </button>
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
                          <span className="hidden md:inline">Clear</span>
                        </button>
                      </>
                    )}

                    {/* 1-click Right Workspace Dock Toggle in Sidebar Focus Mode */}
                    {layoutMode === 'sidebar-focus' && (
                      <button
                        type="button"
                        onClick={toggleDock}
                        aria-label={isDockOpen ? 'Close workspace dock' : 'Open workspace dock'}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
                          isDockOpen
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300'
                            : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <PanelRight className="w-3.5 h-3.5" />
                        <span>{isDockOpen ? 'Close Dock' : 'Workspace'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {isChatEmpty ? (
                  <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-4 pb-8">
                    <ChatEmptyState
                      activeRole={activeRole}
                      activeModel={activeModel}
                      userName={authUser?.name}
                    />
                    <div className="w-full max-w-4xl mt-2">
                      <ChatInput
                        onSendMessage={handleSendMessageWrapper}
                        onStopStreaming={stopStreaming}
                        isStreaming={isStreaming}
                        activeModel={activeModel}
                        onSelectModel={selectModel}
                        onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
                        isGroundingActive={knowledgeDocs.some((d) => d.isGroundingActive)}
                        onToggleGrounding={() => {
                          if (knowledgeDocs.length > 0) {
                            toggleKnowledgeGrounding(knowledgeDocs[0].id);
                          } else {
                            setActiveTab('user-knowledge');
                          }
                        }}
                        isDeepResearchActive={isDeepResearchActive}
                        onToggleDeepResearch={() => setIsDeepResearchActive((v) => !v)}
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
                      userName={authUser?.name}
                    />

                    <ChatInput
                      onSendMessage={handleSendMessageWrapper}
                      onStopStreaming={stopStreaming}
                      isStreaming={isStreaming}
                      activeModel={activeModel}
                      onSelectModel={selectModel}
                      onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
                      isGroundingActive={knowledgeDocs.some((d) => d.isGroundingActive)}
                      onToggleGrounding={() => {
                        if (knowledgeDocs.length > 0) {
                          toggleKnowledgeGrounding(knowledgeDocs[0].id);
                        } else {
                          setActiveTab('user-knowledge');
                        }
                      }}
                    />
                  </div>
                )}
              </main>

              <WorkspaceDock />
            </div>
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
              onRevokeApiKey={revokeApiKey}
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
            />
          )}

          {activeTab === 'user-billing' && (
            <UserBillingView
              invoices={invoices}
              currentTokensUsed={userSettings.monthlyTokensUsed}
              tokensLimit={userSettings.monthlyTokensLimit}
              onTopUpTokens={topUpTokens}
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
              trustedUntil={trustedBrowserUntil}
              onRevokeTrustedBrowser={revokeTrustedBrowser}
              onSignOut={logout}
            />
          )}

          {/* 3. Usage Analytics (Recharts Telemetry) */}
          {activeTab === 'usage' && <UsageView sessions={sessions} darkMode={darkMode} />}

          {/* 4. Admin Studio Dashboard Views */}
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
            setActiveTab('chat');
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
            setActiveTab('chat');
          }}
          userEmail={authUser?.email || 'admin@supremeai.bd'}
        />

        {/* Human-in-the-Loop Interception Modal */}
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

        <PromptLibraryModal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          onSelectTemplate={(text) => handleSendMessageWrapper(text)}
        />

        {/* Global Toast Notification System */}
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}
