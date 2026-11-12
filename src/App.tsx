import React, { useState, useEffect } from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';
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
  const { isDockOpen, toggleDock } = useWorkspaceStore();
  const layoutMode = userSettings.layoutMode || 'sidebar-focus';

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

  // Auto-save timestamp tracking
  const [lastAutoSaveTime] = useState<number>(Date.now());
  const lastAutoSavedText = `Auto-saved at ${new Date(lastAutoSaveTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;

  // Project Quick Action Handlers
  const handleChatWithProject = (project: UserProject) => {
    createNewSession();
    setActiveTab('chat');
    sendMessage(
      `Please inspect my connected GitHub repository: "${project.name}" (${project.repoUrl}, branch: ${project.branch}). Description: ${project.description}. Give me a quick architecture summary and recommended next steps.`,
      undefined,
      knowledgeDocs
    );
  };

  const handleTriggerCodeReview = (project: UserProject) => {
    createNewSession();
    setActiveTab('chat');
    sendMessage(
      `Perform a comprehensive AI Code Review for the repository "${project.name}" (${project.repoUrl}). Check for security vulnerabilities, TypeScript strictness, and clean architecture.`,
      undefined,
      knowledgeDocs
    );
  };

  const handleSendMessageWrapper = async (text: string, attachment?: ChatAttachment) => {
    const estimatedTokens = Math.ceil(text.length / 4) + (attachment ? 258 : 0);
    recordTokenUsage(estimatedTokens);
    await sendMessage(text, attachment, knowledgeDocs);
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
        className={`flex flex-col h-screen bg-[#f8fafc] dark:bg-[#080b11] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors relative ${
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
        <div className="flex-1 flex overflow-hidden relative z-10">
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

          {/* 1. Chat Workspace + Collapsible Resizable Split Dock (Preview / Terminal / Browser / Code) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex overflow-hidden relative">
              <main className="flex-1 min-w-0 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(219,234,254,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(30,58,138,0.2),rgba(19,19,20,0))]">
                {/* Floating 1-click Right Workspace Dock Toggle in Sidebar Focus Mode */}
                {layoutMode === 'sidebar-focus' && (
                  <div className="absolute top-3.5 right-4 z-20 flex items-center gap-2 pointer-events-none">
                    <button
                      type="button"
                      onClick={toggleDock}
                      aria-label={isDockOpen ? 'Close workspace dock' : 'Open workspace dock'}
                      className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-md border transition-all cursor-pointer shadow-xs ${
                        isDockOpen
                          ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-300'
                          : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <PanelRight className="w-3.5 h-3.5" />
                      <span>{isDockOpen ? 'Close Dock' : 'Workspace'}</span>
                    </button>
                  </div>
                )}

                {isChatEmpty ? (
                  <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 pb-8 pt-12">
                    <ChatEmptyState
                      activeRole={activeRole}
                      activeModel={activeModel}
                      userName={authUser?.name}
                    />
                    <div className="w-full max-w-4xl mt-2">
                      <ChatInput
                        onSendMessage={handleSendMessageWrapper}
                        onStopStreaming={stopStreaming}
                        onClearThread={clearCurrentThread}
                        onExportThread={exportThread}
                        isStreaming={isStreaming}
                        activeModel={activeModel}
                        onSelectModel={selectModel}
                        activeRole={activeRole}
                        onOpenRoleModal={() => setIsRoleModalOpen(true)}
                        hasMessages={false}
                        lastAutoSavedText={lastAutoSavedText}
                        isAutoSaving={false}
                        onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
                        activeGroundingDocsCount={knowledgeDocs.filter((d) => d.isGroundingActive).length}
                      />
                    </div>
                  </div>
                ) : (
                  <>
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
                      onClearThread={clearCurrentThread}
                      onExportThread={exportThread}
                      isStreaming={isStreaming}
                      activeModel={activeModel}
                      onSelectModel={selectModel}
                      activeRole={activeRole}
                      onOpenRoleModal={() => setIsRoleModalOpen(true)}
                      hasMessages={(currentSession?.messages?.length || 0) > 0}
                      lastAutoSavedText={lastAutoSavedText}
                      isAutoSaving={false}
                      onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
                      activeGroundingDocsCount={knowledgeDocs.filter((d) => d.isGroundingActive).length}
                    />
                  </>
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
