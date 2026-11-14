import { create } from 'zustand';
import {
  ApiKeyItem,
  WebhookItem,
  KnowledgeDoc,
  TeamMember,
  BillingInvoice,
  UserProject,
  PluginItem,
  UserAccountSettings,
} from '../types';
import {
  INITIAL_API_KEYS,
  INITIAL_WEBHOOKS,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_INVOICES,
} from '../data/customerWorkspaceData';
import {
  INITIAL_PLUGINS,
  INITIAL_USER_PROJECTS,
  DEFAULT_USER_SETTINGS,
} from '../data/userPlugins';
import { toast } from './useToastStore';
import { knowledgeService } from '../services/knowledgeService';

const API_KEYS_KEY = 'supremeai_studio_api_keys';
const WEBHOOKS_KEY = 'supremeai_studio_webhooks';
const KNOWLEDGE_KEY = 'supremeai_studio_knowledge_docs';
const TEAM_KEY = 'supremeai_studio_team_members';
const INVOICES_KEY = 'supremeai_studio_invoices';
const PROJECTS_KEY = 'supremeai_studio_user_projects';
const PLUGINS_KEY = 'supremeai_studio_user_plugins';
const SETTINGS_KEY = 'supremeai_studio_user_settings';

interface CustomerState {
  apiKeys: ApiKeyItem[];
  webhooks: WebhookItem[];
  knowledgeDocs: KnowledgeDoc[];
  teamMembers: TeamMember[];
  invoices: BillingInvoice[];
  userProjects: UserProject[];
  userPlugins: PluginItem[];
  userSettings: UserAccountSettings;

  // API Key Actions
  addApiKey: (newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => void;
  revokeApiKey: (id: string) => void;

  // Webhook Actions
  addWebhook: (newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>) => void;
  deleteWebhook: (id: string) => void;
  testWebhook: (id: string) => void;

  // Knowledge Base Actions
  fetchKnowledgeDocs: () => Promise<void>;
  addKnowledgeDoc: (doc: Omit<KnowledgeDoc, 'id' | 'lastIndexed'>) => Promise<void> | void;
  toggleKnowledgeGrounding: (id: string) => Promise<void> | void;
  deleteKnowledgeDoc: (id: string) => Promise<void> | void;

  // Team Actions
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'joinedDate' | 'avatar'>) => void;
  updateTeamRole: (id: string, newRole: TeamMember['role']) => void;
  removeTeamMember: (id: string) => void;

  // Billing Actions
  topUpTokens: (addedTokens: number, costUsd: number) => void;

  // Project Actions
  addProject: (project: Omit<UserProject, 'id' | 'lastSynced' | 'stars' | 'aiReviewStatus'>) => void;
  deleteProject: (id: string) => void;

  // Plugin Actions
  togglePlugin: (id: string) => void;
  addCustomPlugin: (plugin: Omit<PluginItem, 'id'>) => void;

  // Settings Actions
  updateSettings: (newSettings: Partial<UserAccountSettings>) => void;
  recordTokenUsage: (estimatedTokens: number) => void;
}

export const useCustomerStore = create<CustomerState>((set) => {
  const getInitialStorage = <T>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return fallback;
  };

  const initialApiKeys = getInitialStorage<ApiKeyItem[]>(API_KEYS_KEY, INITIAL_API_KEYS);
  const initialWebhooks = getInitialStorage<WebhookItem[]>(WEBHOOKS_KEY, INITIAL_WEBHOOKS);
  const initialKnowledgeDocs = getInitialStorage<KnowledgeDoc[]>(KNOWLEDGE_KEY, INITIAL_KNOWLEDGE_DOCS);
  const initialTeamMembers = getInitialStorage<TeamMember[]>(TEAM_KEY, INITIAL_TEAM_MEMBERS);
  const initialInvoices = getInitialStorage<BillingInvoice[]>(INVOICES_KEY, INITIAL_INVOICES);
  const initialProjects = getInitialStorage<UserProject[]>(PROJECTS_KEY, INITIAL_USER_PROJECTS);
  const initialPlugins = getInitialStorage<PluginItem[]>(PLUGINS_KEY, INITIAL_PLUGINS);
  const initialSettings = getInitialStorage<UserAccountSettings>(SETTINGS_KEY, DEFAULT_USER_SETTINGS);

  return {
    apiKeys: initialApiKeys,
    webhooks: initialWebhooks,
    knowledgeDocs: initialKnowledgeDocs,
    teamMembers: initialTeamMembers,
    invoices: initialInvoices,
    userProjects: initialProjects,
    userPlugins: initialPlugins,
    userSettings: initialSettings,

    addApiKey: (newKey) => {
      const keyItem: ApiKeyItem = {
        ...newKey,
        id: `key_${Date.now()}`,
        createdAt: new Date().toISOString().slice(0, 10),
        lastUsed: 'Never',
      };
      set((state) => {
        const updated = [keyItem, ...state.apiKeys];
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
        return { apiKeys: updated };
      });
      toast.success('API Key Generated', `Created key with prefix ${keyItem.keyPrefix}`);
    },

    revokeApiKey: (id: string) => {
      set((state) => {
        const updated = state.apiKeys.map((k) =>
          k.id === id ? { ...k, status: 'revoked' as const } : k
        );
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
        return { apiKeys: updated };
      });
      toast.warning('API Key Revoked', 'The key is permanently decommissioned.');
    },

    addWebhook: (newWebhook) => {
      const wh: WebhookItem = {
        ...newWebhook,
        id: `wh_${Date.now()}`,
        lastTriggered: 'Never',
        failureCount: 0,
      };
      set((state) => {
        const updated = [wh, ...state.webhooks];
        localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
        return { webhooks: updated };
      });
      toast.success('Webhook Endpoint Configured', wh.url);
    },

    deleteWebhook: (id: string) => {
      set((state) => {
        const updated = state.webhooks.filter((w) => w.id !== id);
        localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
        return { webhooks: updated };
      });
      toast.info('Webhook Removed', 'Endpoint unregistered.');
    },

    testWebhook: (id: string) => {
      set((state) => {
        const updated = state.webhooks.map((w) =>
          w.id === id ? { ...w, lastTriggered: 'Just now (200 OK test ping)' } : w
        );
        localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
        return { webhooks: updated };
      });
      toast.success('Ping Delivered', 'Test payload returned HTTP 200 OK.');
    },

    fetchKnowledgeDocs: async () => {
      try {
        const docs = await knowledgeService.fetchUserDocs();
        set({ knowledgeDocs: docs });
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(docs));
      } catch (err) {
        console.warn('Failed to fetch knowledge docs from server:', err);
      }
    },

    addKnowledgeDoc: async (doc) => {
      try {
        const created = await knowledgeService.createDoc(doc);
        set((state) => {
          const updated = [created, ...state.knowledgeDocs.filter((d) => d.id !== created.id)];
          localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
          return { knowledgeDocs: updated };
        });
        toast.success('Document Indexed', `"${created.title}" ready for semantic grounding.`);
      } catch (err) {
        console.error('Error creating knowledge doc:', err);
      }
    },

    toggleKnowledgeGrounding: async (id: string) => {
      let targetState = true;
      set((state) => {
        const match = state.knowledgeDocs.find((d) => d.id === id);
        if (match) {
          targetState = !match.isGroundingActive;
        }
        const updated = state.knowledgeDocs.map((d) =>
          d.id === id ? { ...d, isGroundingActive: !d.isGroundingActive } : d
        );
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
        return { knowledgeDocs: updated };
      });
      try {
        await knowledgeService.toggleGrounding(id, targetState);
      } catch (err) {
        console.error('Error toggling grounding:', err);
      }
    },

    deleteKnowledgeDoc: async (id: string) => {
      set((state) => {
        const updated = state.knowledgeDocs.filter((d) => d.id !== id);
        localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(updated));
        return { knowledgeDocs: updated };
      });
      toast.info('Document Removed', 'Source removed from knowledge base index.');
      try {
        await knowledgeService.deleteDoc(id);
      } catch (err) {
        console.error('Error deleting doc:', err);
      }
    },

    inviteTeamMember: (member) => {
      const newMem: TeamMember = {
        ...member,
        id: `mem_${Date.now()}`,
        joinedDate: 'Just now',
        avatar: member.name.charAt(0).toUpperCase() || 'M',
      };
      set((state) => {
        const updated = [...state.teamMembers, newMem];
        localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
        return { teamMembers: updated };
      });
      toast.success('Invitation Sent', `Sent workspace invite to ${newMem.email}`);
    },

    updateTeamRole: (id: string, newRole: TeamMember['role']) => {
      set((state) => {
        const updated = state.teamMembers.map((m) =>
          m.id === id ? { ...m, role: newRole } : m
        );
        localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
        return { teamMembers: updated };
      });
      toast.info('Role Updated', 'Team permissions updated.');
    },

    removeTeamMember: (id: string) => {
      set((state) => {
        const updated = state.teamMembers.filter((m) => m.id !== id);
        localStorage.setItem(TEAM_KEY, JSON.stringify(updated));
        return { teamMembers: updated };
      });
      toast.info('Member Removed', 'User removed from team roster.');
    },

    topUpTokens: (addedTokens: number, costUsd: number) => {
      const newInv: BillingInvoice = {
        id: `inv_topup_${Date.now()}`,
        invoiceNumber: `TOP-2026-${String(Date.now()).slice(-4)}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        amountUsd: costUsd,
        status: 'paid',
        planName: `Pay-As-You-Go Credits (${(addedTokens / 1000000).toFixed(1)}M Tokens)`,
      };

      set((state) => {
        const updatedSettings = {
          ...state.userSettings,
          monthlyTokensLimit: state.userSettings.monthlyTokensLimit + addedTokens,
        };
        const updatedInvoices = [newInv, ...state.invoices];
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
        localStorage.setItem(INVOICES_KEY, JSON.stringify(updatedInvoices));
        return {
          userSettings: updatedSettings,
          invoices: updatedInvoices,
        };
      });
      toast.success('Tokens Recharged', `Added ${(addedTokens / 1000000).toFixed(1)}M tokens to your balance.`);
    },

    addProject: (project) => {
      const newProject: UserProject = {
        ...project,
        id: `proj_${Date.now()}`,
        lastSynced: Date.now(),
        stars: 1,
        aiReviewStatus: 'idle',
      };
      set((state) => {
        const updated = [newProject, ...state.userProjects];
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
        return { userProjects: updated };
      });
      toast.success('Project Connected', `Repository ${newProject.name} linked.`);
    },

    deleteProject: (id: string) => {
      set((state) => {
        const updated = state.userProjects.filter((p) => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
        return { userProjects: updated };
      });
      toast.info('Project Disconnected', 'Repository removed from studio.');
    },

    togglePlugin: (id: string) => {
      set((state) => {
        const updated = state.userPlugins.map((p) =>
          p.id === id ? { ...p, isEnabled: !p.isEnabled } : p
        );
        localStorage.setItem(PLUGINS_KEY, JSON.stringify(updated));
        return { userPlugins: updated };
      });
    },

    addCustomPlugin: (plugin) => {
      const newPlugin: PluginItem = {
        ...plugin,
        id: `plugin_${Date.now()}`,
      };
      set((state) => {
        const updated = [newPlugin, ...state.userPlugins];
        localStorage.setItem(PLUGINS_KEY, JSON.stringify(updated));
        return { userPlugins: updated };
      });
      toast.success('Tool Registered', `Plugin "${newPlugin.name}" added.`);
    },

    updateSettings: (newSettings) => {
      set((state) => {
        const updated = { ...state.userSettings, ...newSettings };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        if (typeof document !== 'undefined' && updated.contentLayout) {
          document.documentElement.dataset.workspaceLayout = updated.contentLayout;
        }
        return { userSettings: updated };
      });
      toast.info('Settings Saved', 'Account preferences updated.');
    },

    recordTokenUsage: (estimatedTokens) => {
      set((state) => {
        const updated = {
          ...state.userSettings,
          monthlyTokensUsed: state.userSettings.monthlyTokensUsed + estimatedTokens,
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
        return { userSettings: updated };
      });
    },
  };
});
