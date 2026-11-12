import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { RoleModal } from './components/RoleModal';
import { RoleLab } from './components/RoleLab';
import { ModelMatrix } from './components/ModelMatrix';
import { RepoHub } from './components/RepoHub';

import { ChatSession, ChatMessage, RolePersona, ModelDetail } from './types';
import { SYSTEM_ROLES } from './data/roles';
import { GEMINI_MODELS } from './data/models';

const STORAGE_KEY = 'supremeai_studio_sessions_v1';
const THEME_KEY = 'supremeai_studio_theme';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'chat' | 'roles' | 'models' | 'repos'>('chat');
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

    // Default initial session
    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'SupremeAI Session',
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

  // Synchronize localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Current Active Session
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

  // Export Thread (Markdown or JSON)
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

    // Save partial response if available
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

  // Send Message (Multi-turn chat flow with Gemini server-side streaming)
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !currentSession) return;

    setInferenceError(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    // Update conversation title if first user message
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

    // Start streaming
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
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received from server.');
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
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingContent(accumulatedText);
              }
            } catch (parseErr) {
              // Ignore non-json or split lines
            }
          }
        }
      }

      // Finalize assistant message
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
        // User aborted intentionally
      } else {
        console.error('Chat error:', err);
        const errorMsg =
          err instanceof Error ? err.message : 'Unknown communication error during inference';
        setInferenceError(errorMsg);
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  // Role selection handler
  const handleSaveRole = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');

    // Synchronize suggested model
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) {
      setActiveModel(matchedModel);
    }
  };

  const handleSelectRoleFromLab = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');

    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) {
      setActiveModel(matchedModel);
    }
  };

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
      />

      {/* Main Studio Viewport */}
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
        />

        {/* Tab View Switcher with Gemini ambient radial glow in background */}
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
