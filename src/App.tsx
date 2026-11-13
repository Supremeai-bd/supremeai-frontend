import React, { useState, useEffect, useRef } from 'react';
import {
  PanelLeft,
  PanelRight,
  BookOpen,
  Sliders,
  Download,
  Trash2,
  Database,
  Search,
  Share2,
  GitFork,
} from 'lucide-react';
import { ChatSearchBar } from './components/chat/ChatSearchBar';
import { shareService } from './services/shareService';
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
import { useThemeStore } from './stores/useThemeStore';
import { toast } from './stores/useToastStore';
import { useTabRouter } from './hooks/useTabRouter';
import { useMcpTelemetry } from './hooks/useMcpTelemetry';
import { useOsThemeSync } from './hooks/useOsThemeSync';
import { LiveScreenBackdrop } from './components/theme/LiveScreenBackdrop';
import { ThemeControlPopover } from './components/theme/ThemeControlPopover';
import { UserProject, ChatAttachment } from './types';

export default function App() {
  // Automated OS color-scheme & reduced-motion synchronization
  useOsThemeSync();

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
    branchSession,
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
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatRoleFilter, setChatRoleFilter] = useState<'all' | 'user' | 'assistant'>('all');
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

  // Theme state via centralized useThemeStore + automated OS sync
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const cycleThemeMode = useThemeStore((s) => s.cycleThemeMode);
  const darkMode = resolvedScheme === 'dark';
  const toggleDarkMode = () => cycleThemeMode();

  // Workspace Content Width Layout sync (compact / fluid / maximized)
  const contentLayout = userSettings.contentLayout || 'fluid';
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.workspaceLayout = contentLayout;
    }
  }, [contentLayout]);

  // Initial fetch for MCP cluster telemetry
  useEffect(() => {
    fetchMcpServices();
  }, [fetchMcpServices]);

  // Live Server-Sent Events (SSE) telemetry pipeline for Admin Studio
  useMcpTelemetry(currentRole === 'admin');

  // Active session lookup
  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // In-session search filtering
  const filteredChatMessages = React.useMemo(() => {
    const msgs = currentSession?.messages || [];
    if (!isChatSearchOpen) return msgs;
    return msgs.filter((m) => {
      const matchesRole = chatRoleFilter === 'all' || m.role === chatRoleFilter;
      const matchesText = !chatSearchQuery.trim() || m.content.toLowerCase().includes(chatSearchQuery.toLowerCase());
      return matchesRole && matchesText;
    });
  }, [currentSession?.messages, isChatSearchOpen, chatRoleFilter, chatSearchQuery]);

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
        className={`theme-crossfade flex flex-col h-full w-full text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden relative ${
          currentRole === 'admin' ? 'cyber-scanline' : ''
        }`}
      >
        {/* Dynamic Live Screen Backdrop (automatically follows OS Light/Dark + selected scenic theme) */}
        <LiveScreenBackdrop isEmpty={isChatEmpty} isChatView={activeTab === 'chat'} />

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
              <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden relative bg-transparent">

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

                    {/* In-chat search toggle */}
                    <button
                      type="button"
                      onClick={() => setIsChatSearchOpen((prev) => !prev)}
                      title="Search messages"
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-colors cursor-pointer shadow-xs ${
                        isChatSearchOpen
                          ? 'bg-cyan-500 text-white'
                          : 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Search className="w-3 h-3" />
                      <span className="hidden md:inline">Search</span>
                    </button>

                    {/* Export, Branch, Share & Clear when messages exist */}
                    {(currentSession?.messages?.length || 0) > 0 && (
                      <>
                        {/* Branch conversation button */}
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
                          <span className="hidden md:inline">Branch</span>
                        </button>

                        {/* Share link button */}
                        <button
                          type="button"
                          onClick={async () => {
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
                          <span className="hidden md:inline">Share</span>
                        </button>

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

                    {/* Theme & Live Screen Switcher */}
                    <ThemeControlPopover onOpenSettings={() => setActiveTab('user-settings')} />

                    {/* 1-click Right Workspace Dock Toggle in Sidebar Focus Mode */}
                    {layoutMode === 'sidebar-focus' && (
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
                        <span>{isDockOpen ? 'Close Dock' : 'Workspace'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline In-Conversation Search Bar */}
                {isChatSearchOpen && (
                  <ChatSearchBar
                    searchQuery={chatSearchQuery}
                    onSearchChange={setChatSearchQuery}
                    roleFilter={chatRoleFilter}
                    onRoleFilterChange={setChatRoleFilter}
                    totalMatches={filteredChatMessages.length}
                    totalMessages={currentSession?.messages?.length || 0}
                    onClear={() => setChatSearchQuery('')}
                  />
                )}

                {isChatEmpty ? (
                  <div className="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-4 pb-8">
                    <ChatEmptyState
                      activeRole={activeRole}
                      activeModel={activeModel}
                      userName={authUser?.name}
                    />
                    <div className="workspace-input-container mt-2">
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
                      messages={filteredChatMessages}
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
                      isDeepResearchActive={isDeepResearchActive}
                      onToggleDeepResearch={() => setIsDeepResearchActive((v) => !v)}
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
