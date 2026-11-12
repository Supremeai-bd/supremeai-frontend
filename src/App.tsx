import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { RoleModal } from './components/RoleModal';
import { RoleLab } from './components/RoleLab';
import { ModelMatrix } from './components/ModelMatrix';
import { RepoHub } from './components/RepoHub';
import { UserProjectsView } from './components/user/UserProjectsView';
import { UserPluginsView } from './components/user/UserPluginsView';
import { UserSettingsView } from './components/user/UserSettingsView';
import { AdminCustomersView } from './components/admin/AdminCustomersView';

import {
  ChatSession,
  ChatMessage,
  RolePersona,
  ModelDetail,
  UserRole,
  UserProject,
  PluginItem,
  UserAccountSettings,
  CustomerRecord,
} from './types';
import { SYSTEM_ROLES } from './data/roles';
import { GEMINI_MODELS } from './data/models';
import {
  INITIAL_PLUGINS,
  INITIAL_USER_PROJECTS,
  DEFAULT_USER_SETTINGS,
} from './data/userPlugins';
import { INITIAL_CUSTOMERS } from './data/customerData';

const STORAGE_KEY = 'supremeai_studio_sessions_v1';
const THEME_KEY = 'supremeai_studio_theme';
const ROLE_KEY = 'supremeai_studio_user_role';
const PROJECTS_KEY = 'supremeai_studio_user_projects';
const PLUGINS_KEY = 'supremeai_studio_user_plugins';
const SETTINGS_KEY = 'supremeai_studio_user_settings';
const CUSTOMERS_KEY = 'supremeai_studio_customers';

export default function App() {
  // Dual Role State: 'user' (normal user) vs 'admin' (developer studio)
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_KEY);
    return saved === 'admin' ? 'admin' : 'user'; // default to user view
  });

  const handleToggleRole = (forcedRole?: UserRole) => {
    const nextRole = forcedRole || (currentRole === 'admin' ? 'user' : 'admin');
    setCurrentRole(nextRole);
    localStorage.setItem(ROLE_KEY, nextRole);
    setActiveTab('chat');
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Theme State
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

  // Active Role and Model Selection
  const [activeRole, setActiveRole] = useState<RolePersona>(SYSTEM_ROLES[0]);
  const [activeModel, setActiveModel] = useState<ModelDetail>(() => {
    return GEMINI_MODELS.find((m) => m.id === 'gemini-3.8-flash') || GEMINI_MODELS[0];
  });
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // User Projects State
  const [userProjects, setUserProjects] = useState<UserProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USER_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(userProjects));
  }, [userProjects]);

  // User Plugins State
  const [userPlugins, setUserPlugins] = useState<PluginItem[]>(() => {
    try {
      const saved = localStorage.getItem(PLUGINS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PLUGINS;
  });

  useEffect(() => {
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(userPlugins));
  }, [userPlugins]);

  // User Account Settings State
  const [userSettings, setUserSettings] = useState<UserAccountSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
  }, [userSettings]);

  // Customers State (for Admin Workspace)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }, [customers]);

  const handleAddCustomer = (
    newCust: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>
  ) => {
    const customer: CustomerRecord = {
      ...newCust,
      id: `cust_${String(Date.now()).slice(-4)}`,
      joinedDate: new Date().toISOString().slice(0, 10),
      lastActive: 'Just now',
    };
    setUserSettings((prev) => prev); // keep state synchronized
    setCustomers([customer, ...customers]);
  };

  const handleUpdateCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Sessions and Chat History
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved sessions:', e);
    }

    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'SupremeAI Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      roleId: SYSTEM_ROLES[0].id,
      messages: [],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '');

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Create New Session
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeModel.id,
      roleId: activeRole.id,
      customSystemInstruction: customInstruction || undefined,
      messages: [],
    };

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
    setInferenceError(null);
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const fallback: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: activeModel.id,
        roleId: activeRole.id,
        messages: [],
      };
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear Current Thread
  const handleClearThread = () => {
    if (!currentSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [], updatedAt: Date.now() } : s))
    );
    setStreamingContent('');
    setInferenceError(null);
  };

  // Export Thread
  const handleExportThread = (format: 'markdown' | 'json') => {
    if (!currentSession) return;

    let blob: Blob;
    let filename: string;

    if (format === 'markdown') {
      let md = `# ${currentSession.title}\n`;
      md += `*Exported from SupremeAI Studio · Model: ${currentSession.model} · Date: ${new Date().toLocaleString()}*\n\n---\n\n`;

      currentSession.messages.forEach((msg) => {
        const sender = msg.role === 'user' ? '### User' : `### Assistant (${msg.roleName || 'SupremeAI'})`;
        md += `${sender}\n\n${msg.content}\n\n---\n\n`;
      });

      blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      filename = `${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.md`;
    } else {
      const json = JSON.stringify(currentSession, null, 2);
      blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      filename = `${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.json`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (streamingContent.trim() && currentSession) {
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: streamingContent,
        timestamp: Date.now(),
        model: activeModel.id,
        roleName: activeRole.name,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }
            : s
        )
      );
      setStreamingContent('');
    }
  };

  // Send Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !currentSession) return;

    setInferenceError(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const isFirstUserMessage = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const sessionTitle = isFirstUserMessage
      ? text.slice(0, 32).trim() + (text.length > 32 ? '...' : '')
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              model: activeModel.id,
              roleId: activeRole.id,
            }
          : s
      )
    );

    // Track token usage
    const estimatedTokens = Math.ceil(text.length / 4);
    setUserSettings((prev) => ({
      ...prev,
      monthlyTokensUsed: prev.monthlyTokensUsed + estimatedTokens,
    }));

    setIsStreaming(true);
    setStreamingContent('');
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: activeModel.id,
          systemInstruction: customInstruction || activeRole.systemInstruction,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: userSettings.streamResponses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingContent(accumulatedText);
              }
            } catch {}
          }
        }
      }

      if (accumulatedText.trim()) {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now(),
          model: activeModel.id,
          roleName: activeRole.name,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Aborted intentionally
      } else {
        console.error('Chat error:', err);
        setInferenceError(err instanceof Error ? err.message : 'Inference error');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  // User Project Actions
  const handleAddProject = (
    project: Omit<UserProject, 'id' | 'lastSynced' | 'stars' | 'aiReviewStatus'>
  ) => {
    const newProject: UserProject = {
      ...project,
      id: `proj_${Date.now()}`,
      lastSynced: Date.now(),
      stars: 1,
      aiReviewStatus: 'idle',
    };
    setUserProjects([newProject, ...userProjects]);
  };

  const handleDeleteProject = (id: string) => {
    setUserProjects(userProjects.filter((p) => p.id !== id));
  };

  const handleChatWithProject = (project: UserProject) => {
    handleNewSession();
    handleSendMessage(
      `Please inspect my connected GitHub repository: "${project.name}" (${project.repoUrl}, branch: ${project.branch}). Description: ${project.description}. Give me a quick architecture summary and recommended next steps.`
    );
  };

  const handleTriggerCodeReview = (project: UserProject) => {
    handleNewSession();
    handleSendMessage(
      `Perform a comprehensive AI Code Review for the repository "${project.name}" (${project.repoUrl}). Check for security vulnerabilities, TypeScript strictness, and clean architecture.`
    );
  };

  // User Plugin Actions
  const handleTogglePlugin = (id: string) => {
    setUserPlugins(
      userPlugins.map((p) => (p.id === id ? { ...p, isEnabled: !p.isEnabled } : p))
    );
  };

  const handleAddCustomPlugin = (plugin: Omit<PluginItem, 'id'>) => {
    const newPlugin: PluginItem = {
      ...plugin,
      id: `plugin_${Date.now()}`,
    };
    setUserPlugins([newPlugin, ...userPlugins]);
  };

  // User Settings Actions
  const handleUpdateSettings = (newSettings: Partial<UserAccountSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Role Modal Handler
  const handleSaveRole = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) setActiveModel(matchedModel);
  };

  const handleSelectRoleFromLab = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) setActiveModel(matchedModel);
  };

  const activePluginsCount = userPlugins.filter((p) => p.isEnabled).length;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors">
      {/* Top Bar Navigation Contract: 3 zones */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewSession={handleNewSession}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeModel={activeModel}
        currentRole={currentRole}
        onToggleRole={() => handleToggleRole()}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gemini-Style Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={currentSession?.id || ''}
          onSelectSession={setActiveSessionId}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onNewSession={handleNewSession}
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
        />

        {/* --- Tab Views --- */}
        {/* 1. Chat Tab (Shared between User and Admin, with role-specific depth) */}
        {activeTab === 'chat' && (
          <main className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(219,234,254,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(30,58,138,0.2),rgba(19,19,20,0))]">
            <ChatThread
              messages={currentSession?.messages || []}
              activeRole={activeRole}
              activeModel={activeModel}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSendPrompt={handleSendMessage}
              error={inferenceError}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onClearThread={handleClearThread}
              onExportThread={handleExportThread}
              isStreaming={isStreaming}
              activeModel={activeModel}
              onSelectModel={setActiveModel}
              activeRole={activeRole}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
              hasMessages={(currentSession?.messages?.length || 0) > 0}
            />
          </main>
        )}

        {/* 2. User Specific Views */}
        {activeTab === 'user-projects' && (
          <UserProjectsView
            projects={userProjects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onChatWithProject={handleChatWithProject}
            onTriggerCodeReview={handleTriggerCodeReview}
          />
        )}

        {activeTab === 'user-plugins' && (
          <UserPluginsView
            plugins={userPlugins}
            onTogglePlugin={handleTogglePlugin}
            onAddCustomPlugin={handleAddCustomPlugin}
          />
        )}

        {activeTab === 'user-settings' && (
          <UserSettingsView
            settings={userSettings}
            onUpdateSettings={handleUpdateSettings}
            onSwitchRole={(newRole) => handleToggleRole(newRole)}
            currentRole={currentRole}
          />
        )}

        {/* 3. Admin Specific Views */}
        {activeTab === 'customers' && (
          <AdminCustomersView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {activeTab === 'roles' && (
          <RoleLab
            onSelectRoleForChat={handleSelectRoleFromLab}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'models' && (
          <ModelMatrix
            activeModel={activeModel}
            onSelectModel={setActiveModel}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'repos' && <RepoHub />}
      </div>

      {/* Role & System Instruction Configuration Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        activeRole={activeRole}
        customInstruction={customInstruction}
        onSaveRole={handleSaveRole}
        activeModel={activeModel}
        onSelectModel={setActiveModel}
      />
    </div>
  );
}
