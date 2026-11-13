import { create } from 'zustand';
import { ChatSession, ChatMessage, RolePersona, ModelDetail, ChatAttachment, KnowledgeDoc } from '../types';
import { SYSTEM_ROLES } from '../data/roles';
import { SUPREMEAI_MODELS } from '../data/models';
import { chatService } from '../services/chatService';
import { conversationService } from '../services/conversationService';
import { researchService } from '../services/researchService';
import { useAuthStore } from './useAuthStore';
import { useCustomerStore } from './useCustomerStore';
import { toast } from './useToastStore';

const STORAGE_KEY = 'supremeai_studio_sessions_v1';

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  activeModel: ModelDetail;
  activeRole: RolePersona;
  customInstruction: string;
  isStreaming: boolean;
  streamingContent: string;
  inferenceError: string | null;
  isPromptModalOpen: boolean;
  isRoleModalOpen: boolean;

  // Session Management Actions
  selectSession: (id: string) => Promise<void> | void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  togglePinSession: (id: string) => void;
  createNewSession: () => void;
  branchSession: (sourceSessionId?: string, upToMessageId?: string) => string;
  clearCurrentThread: () => void;
  exportThread: (format: 'markdown' | 'text' | 'json') => void;
  syncRemoteSessions: () => Promise<void>;

  // Model & Role Actions
  selectModel: (model: ModelDetail) => void;
  selectRole: (role: RolePersona, customPrompt?: string) => void;
  setCustomInstruction: (instruction: string) => void;
  setIsPromptModalOpen: (open: boolean) => void;
  setIsRoleModalOpen: (open: boolean) => void;

  // Inference Actions
  sendMessage: (text: string, attachment?: ChatAttachment, groundingDocs?: KnowledgeDoc[], deepResearch?: boolean) => Promise<void>;
  appendVoiceTurn: (userText: string, assistantText: string, voiceName?: string) => void;
  stopStreaming: () => void;
}

export const useChatStore = create<ChatState>((set, get) => {
  let abortController: AbortController | null = null;

  const getInitialSessions = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'SupremeAI Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'supreme-core',
      roleId: SYSTEM_ROLES[0].id,
      messages: [],
    };
    return [initialSession];
  };

  const initialSessions = getInitialSessions();

  return {
    sessions: initialSessions,
    activeSessionId: initialSessions[0]?.id || '',
    activeModel: SUPREMEAI_MODELS.find((m) => m.id === 'supreme-core') || SUPREMEAI_MODELS[0],
    activeRole: SYSTEM_ROLES[0],
    customInstruction: '',
    isStreaming: false,
    streamingContent: '',
    inferenceError: null,
    isPromptModalOpen: false,
    isRoleModalOpen: false,

    selectSession: async (id: string) => {
      set({ activeSessionId: id, inferenceError: null });
      const target = get().sessions.find((s) => s.id === id);
      if (target && target.messages.length === 0) {
        try {
          const remoteMsgs = await conversationService.getMessages(id);
          if (remoteMsgs.length > 0) {
            const updated = get().sessions.map((s) =>
              s.id === id ? { ...s, messages: remoteMsgs } : s
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            set({ sessions: updated });
          }
        } catch {
          // Keep current local session state
        }
      }
    },

    deleteSession: (id: string) => {
      const { sessions, activeSessionId, activeModel, activeRole } = get();
      const filtered = sessions.filter((s) => s.id !== id);

      // Asynchronously delete from remote server persistence
      conversationService.deleteConversation(id).catch(() => {});

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify([fallback]));
        set({ sessions: [fallback], activeSessionId: fallback.id });
        return;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      set({
        sessions: filtered,
        activeSessionId: activeSessionId === id ? filtered[0].id : activeSessionId,
      });
      toast.info('Session Deleted', 'Conversation removed from workspace history.');
    },

    renameSession: (id: string, newTitle: string) => {
      const { sessions } = get();
      const updated = sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ sessions: updated });
    },

    togglePinSession: (id: string) => {
      const { sessions } = get();
      const updated = sessions.map((s) =>
        s.id === id ? { ...s, isPinned: !s.isPinned } : s
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ sessions: updated });
    },

    createNewSession: () => {
      const { sessions, activeModel, activeRole, customInstruction } = get();
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

      const updated = [newSession, ...sessions];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({
        sessions: updated,
        activeSessionId: newSession.id,
        inferenceError: null,
      });
    },

    branchSession: (sourceSessionId?: string, upToMessageId?: string): string => {
      const { sessions, activeSessionId } = get();
      const targetId = sourceSessionId || activeSessionId;
      const source = sessions.find((s) => s.id === targetId) || sessions[0];
      if (!source) return '';

      let inheritedMessages = [...source.messages];
      if (upToMessageId) {
        const idx = source.messages.findIndex((m) => m.id === upToMessageId);
        if (idx !== -1) {
          inheritedMessages = source.messages.slice(0, idx + 1);
        }
      }

      const newBranch: ChatSession = {
        id: `branch_${Date.now()}`,
        title: `${source.title} (Branch)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: source.model,
        roleId: source.roleId,
        customSystemInstruction: source.customSystemInstruction,
        messages: inheritedMessages,
        projectId: source.projectId,
        parentSessionId: source.id,
      };

      const updated = [newBranch, ...sessions];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({
        sessions: updated,
        activeSessionId: newBranch.id,
        inferenceError: null,
      });

      toast.success('Session Branched', `Created new branch "${newBranch.title}".`);
      return newBranch.id;
    },

    clearCurrentThread: () => {
      const { sessions, activeSessionId } = get();
      const updated = sessions.map((s) =>
        s.id === activeSessionId ? { ...s, messages: [], updatedAt: Date.now() } : s
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      set({ sessions: updated, streamingContent: '', inferenceError: null });
      toast.info('Thread Cleared', 'Messages removed from active conversation.');
    },

    exportThread: (format: 'markdown' | 'text' | 'json') => {
      const { sessions, activeSessionId } = get();
      const current = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      if (!current) return;

      let blob: Blob;
      let filename: string;
      const safeTitle = current.title.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (format === 'markdown') {
        let md = `# ${current.title}\n`;
        md += `*Exported from SupremeAI Studio · Model: ${current.model} · Date: ${new Date().toLocaleString()}*\n\n---\n\n`;

        current.messages.forEach((msg) => {
          const sender = msg.role === 'user' ? '### User' : `### Assistant (${msg.roleName || 'SupremeAI'})`;
          md += `${sender}\n\n${msg.content}\n\n---\n\n`;
        });

        blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
        filename = `${safeTitle}_export.md`;
      } else if (format === 'text') {
        let txt = `${current.title}\nExported: ${new Date().toLocaleString()}\n${'='.repeat(48)}\n\n`;
        current.messages.forEach((msg) => {
          const sender = msg.role === 'user' ? 'You' : msg.roleName || 'SupremeAI';
          txt += `${sender}:\n${msg.content}\n\n${'-'.repeat(32)}\n\n`;
        });
        blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        filename = `${safeTitle}_export.txt`;
      } else {
        const json = JSON.stringify(current, null, 2);
        blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        filename = `${safeTitle}_export.json`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Thread Exported', `Downloaded as ${filename}`);
    },

    selectModel: (model: ModelDetail) => {
      set({ activeModel: model });
      toast.info('Model Switched', `Active model set to ${model.name}`);
    },

    selectRole: (role: RolePersona, customPrompt?: string) => {
      const matchedModel = SUPREMEAI_MODELS.find((m) => m.id === role.suggestedModel);
      set((state) => ({
        activeRole: role,
        customInstruction: customPrompt || '',
        activeModel: matchedModel || state.activeModel,
      }));
      toast.info('Role Configured', `Persona set to ${role.name}`);
    },

    setCustomInstruction: (instruction: string) => set({ customInstruction: instruction }),
    setIsPromptModalOpen: (open: boolean) => set({ isPromptModalOpen: open }),
    setIsRoleModalOpen: (open: boolean) => set({ isRoleModalOpen: open }),

    sendMessage: async (text: string, attachment?: ChatAttachment, groundingDocs?: KnowledgeDoc[], deepResearch?: boolean) => {
      const { sessions, activeSessionId, activeModel, activeRole, customInstruction, isStreaming } = get();
      if ((!text.trim() && !attachment) || isStreaming) return;

      const current = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      if (!current) return;

      set({ inferenceError: null });

      const userMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
        attachment,
      };

      const updatedMessages = [...current.messages, userMsg];
      const isFirstUserMessage = current.messages.filter((m) => m.role === 'user').length === 0;
      const sessionTitle = isFirstUserMessage
        ? (text.slice(0, 32).trim() || (attachment ? `Analysis: ${attachment.name}` : 'New Chat')) +
          (text.length > 32 ? '...' : '')
        : current.title;

      const updatedSessions = sessions.map((s) =>
        s.id === current.id
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              model: activeModel.id,
              roleId: activeRole.id,
            }
          : s
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      set({
        sessions: updatedSessions,
        isStreaming: true,
        streamingContent: '',
      });

      // Collect grounding context
      const activeGrounding = (groundingDocs || []).filter((d) => d.isGroundingActive);
      const groundingContext =
        activeGrounding.length > 0
          ? activeGrounding
              .map((d) => `[GROUNDING DOCUMENT: "${d.title}" (Type: ${d.type})]\n${d.contentPreview}`)
              .join('\n\n')
          : undefined;

      if (deepResearch) {
        set({ streamingContent: 'Initializing Deep Research pipeline...\nSynthesizing multi-source empirical intelligence...\n' });
        try {
          const res = await researchService.execute(text);
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `### 🔬 Deep Research Analysis: ${res.report.title}\n\n${res.report.summary}`,
            timestamp: Date.now(),
            model: activeModel.id,
            roleName: 'Deep Researcher',
            researchReport: res.report,
          };

          const finalSessions = get().sessions.map((s) =>
            s.id === current.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : s
          );

          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSessions));
          set({
            sessions: finalSessions,
            isStreaming: false,
            streamingContent: '',
          });

          // Ensure remote conversation exists before syncing exchange
          conversationService
            .createConversation(current.title, current.id, activeModel.id)
            .then(() => {
              conversationService.syncMessage(current.id, 'user', text);
              conversationService.syncMessage(current.id, 'assistant', assistantMsg.content);
            })
            .catch(() => {});
          return;
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Deep research execution failed.';
          set({
            isStreaming: false,
            streamingContent: '',
            inferenceError: errorMsg,
          });
          toast.error('Deep Research Error', errorMsg);
          return;
        }
      }

      const controller = new AbortController();
      abortController = controller;

      const authState = useAuthStore.getState();
      const customerSettings = useCustomerStore.getState().userSettings;
      const effectiveSystemInstruction =
        customInstruction.trim() ||
        customerSettings.customInstructions?.trim() ||
        activeRole.systemInstruction;

      await chatService.streamChat({
        model: activeModel.id,
        messages: updatedMessages,
        sessionId: current.id,
        systemInstruction: effectiveSystemInstruction,
        groundingContext,
        deepResearch,
        userContext: {
          email: authState.authUser?.email || customerSettings.email,
          role: authState.currentRole,
          tier: authState.authUser?.plan || customerSettings.plan,
        },
        signal: controller.signal,
        onChunk: (chunk) => {
          set((state) => ({ streamingContent: state.streamingContent + chunk }));
        },
        onDone: (fullText) => {
          const assistantMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: fullText,
            timestamp: Date.now(),
            model: activeModel.id,
            roleName: activeRole.name,
          };

          const finalSessions = get().sessions.map((s) =>
            s.id === current.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : s
          );

          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSessions));
          set({
            sessions: finalSessions,
            isStreaming: false,
            streamingContent: '',
          });
          abortController = null;

          // Ensure remote conversation exists before syncing exchange
          conversationService
            .createConversation(current.title, current.id, activeModel.id)
            .then(() => {
              conversationService.syncMessage(current.id, 'user', text);
              conversationService.syncMessage(current.id, 'assistant', fullText);
            })
            .catch(() => {});
        },
        onError: (err) => {
          set({
            isStreaming: false,
            streamingContent: '',
            inferenceError: err.message,
          });
          abortController = null;
          toast.error('Inference Error', err.message);
        },
      });
    },

    stopStreaming: () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }

      const { streamingContent, sessions, activeSessionId, activeModel, activeRole } = get();
      if (streamingContent.trim()) {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: streamingContent,
          timestamp: Date.now(),
          model: activeModel.id,
          roleName: activeRole.name,
        };

        const updated = sessions.map((s) =>
          s.id === activeSessionId ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() } : s
        );

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        set({ sessions: updated });
      }

      set({ isStreaming: false, streamingContent: '' });
      toast.info('Generation Stopped', 'Model inference paused by user.');
    },

    appendVoiceTurn: (userText: string, assistantText: string, voiceName?: string) => {
      const cleanUser = userText.trim();
      const cleanAssistant = assistantText.trim();
      if (!cleanUser && !cleanAssistant) return;

      const { sessions, activeSessionId, activeRole } = get();
      const current = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      if (!current) return;

      const newMessages: ChatMessage[] = [];
      const now = Date.now();
      if (cleanUser) {
        newMessages.push({
          id: `voice_u_${now}`,
          role: 'user',
          content: cleanUser,
          timestamp: now,
        });
      }
      if (cleanAssistant) {
        newMessages.push({
          id: `voice_a_${now + 1}`,
          role: 'assistant',
          content: cleanAssistant,
          timestamp: now + 1,
          model: 'gemini-3.8-live',
          roleName: voiceName ? `${activeRole.name} (${voiceName} Voice)` : 'SupremeAI Live',
        });
      }

      const isFirstUserMessage = current.messages.filter((m) => m.role === 'user').length === 0;
      const sessionTitle =
        isFirstUserMessage && cleanUser
          ? cleanUser.slice(0, 32).trim() + (cleanUser.length > 32 ? '...' : '')
          : current.title;

      const updatedSessions = sessions.map((s) =>
        s.id === current.id
          ? {
              ...s,
              title: sessionTitle,
              messages: [...s.messages, ...newMessages],
              updatedAt: now,
            }
          : s
      );

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      set({ sessions: updatedSessions });
    },

    syncRemoteSessions: async () => {
      const token = localStorage.getItem('supremeai_access_token');
      if (!token) return;
      try {
        const remoteList = await conversationService.listConversations();
        if (remoteList && remoteList.length > 0) {
          const localSessions = get().sessions;
          const merged = [...localSessions];
          for (const rem of remoteList) {
            if (!merged.some((s) => s.id === rem.id)) {
              merged.push({
                id: rem.id,
                title: rem.title || 'Conversation',
                createdAt: new Date(rem.created_at).getTime(),
                updatedAt: new Date(rem.updated_at).getTime(),
                model: 'supreme-core',
                roleId: SYSTEM_ROLES[0].id,
                messages: [],
              });
            }
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          set({ sessions: merged });
        }
      } catch (err) {
        console.warn('[SyncRemoteSessions] Remote conversation load failed:', err);
      }
    },
  };
});
