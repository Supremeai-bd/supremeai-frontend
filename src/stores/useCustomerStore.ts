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
import { apiKeyService } from '../services/apiKeyService';
import { webhookService } from '../services/webhookService';
import { billingService } from '../services/billingService';
import { projectService } from '../services/projectService';

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
  fetchApiKeys: () => Promise<void>;
  addApiKey: (newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => Promise<void> | void;
  revokeApiKey: (id: string) => Promise<void> | void;

  // Webhook Actions
  fetchWebhooks: () => Promise<void>;
  addWebhook: (newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>) => Promise<void> | void;
  deleteWebhook: (id: string) => Promise<void> | void;
  testWebhook: (id: string) => Promise<void> | void;

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
  fetchInvoices: () => Promise<void>;
  topUpTokens: (addedTokens: number, costUsd: number) => Promise<void> | void;

  // Project Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<UserProject, 'id' | 'lastSynced' | 'stars' | 'aiReviewStatus'>) => Promise<void> | void;
  deleteProject: (id: string) => Promise<void> | void;

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

    fetchApiKeys: async () => {
      try {
        const keys = await apiKeyService.fetchApiKeys();
        set({ apiKeys: keys });
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
      } catch (err) {
        console.warn('Failed to fetch API keys from server:', err);
      }
    },

    addApiKey: async (newKey) => {
      try {
        const keyItem = await apiKeyService.createApiKey(newKey);
        set((state) => {
          const updated = [keyItem, ...state.apiKeys.filter((k) => k.id !== keyItem.id)];
          localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
          return { apiKeys: updated };
        });
        toast.success('API Key Generated', `Created key with prefix ${keyItem.keyPrefix}`);
      } catch (err) {
        console.error('Error generating API key:', err);
      }
    },

    revokeApiKey: async (id: string) => {
      set((state) => {
        const updated = state.apiKeys.map((k) =>
          k.id === id ? { ...k, status: 'revoked' as const } : k
        );
        localStorage.setItem(API_KEYS_KEY, JSON.stringify(updated));
        return { apiKeys: updated };
      });
      toast.warning('API Key Revoked', 'The key is permanently decommissioned.');
      try {
        await apiKeyService.revokeApiKey(id);
      } catch (err) {
        console.error('Error revoking API key on server:', err);
      }
    },

    fetchWebhooks: async () => {
      try {
        const whs = await webhookService.fetchWebhooks();
        set({ webhooks: whs });
        localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(whs));
      } catch (err) {
        console.warn('Failed to fetch webhooks from server:', err);
      }
    },

    addWebhook: async (newWebhook) => {
      try {
        const wh = await webhookService.createWebhook(newWebhook);
        set((state) => {
          const updated = [wh, ...state.webhooks.filter((w) => w.id !== wh.id)];
          localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
          return { webhooks: updated };
        });
        toast.success('Webhook Endpoint Configured', wh.url);
      } catch (err) {
        console.error('Error creating webhook on server:', err);
      }
    },

    deleteWebhook: async (id: string) => {
      set((state) => {
        const updated = state.webhooks.filter((w) => w.id !== id);
        localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
        return { webhooks: updated };
      });
      toast.info('Webhook Removed', 'Endpoint unregistered.');
      try {
        await webhookService.deleteWebhook(id);
      } catch (err) {
        console.error('Error deleting webhook on server:', err);
      }
    },

    testWebhook: async (id: string) => {
      try {
        const res = await webhookService.testWebhook(id);
        const statusText = res.success ? `HTTP ${res.status_code || 200} OK` : (res.error || 'Failed');
        set((state) => {
          const updated = state.webhooks.map((w) =>
            w.id === id ? { ...w, lastTriggered: `Just now (${statusText})` } : w
          );
          localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(updated));
          return { webhooks: updated };
        });
        if (res.success) {
          toast.success('Ping Delivered', 'Test payload returned HTTP 200 OK.');
        } else {
          toast.error('Ping Failed', res.error || 'Endpoint unreachable.');
        }
      } catch (err) {
        console.error('Error testing webhook:', err);
      }
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

    fetchInvoices: async () => {
      try {
        const invs = await billingService.fetchInvoices();
        set({ invoices: invs });
        localStorage.setItem(INVOICES_KEY, JSON.stringify(invs));
      } catch (err) {
        console.warn('Failed to fetch invoices:', err);
      }
    },

    topUpTokens: async (addedTokens: number, costUsd: number) => {
      try {
        const res = await billingService.createTopUp(addedTokens, costUsd);
        const newInv = res.invoice;

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
      } catch (err) {
        console.error('Error recharging tokens:', err);
      }
    },

    fetchProjects: async () => {
      try {
        const projs = await projectService.fetchProjects();
        set({ userProjects: projs });
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projs));
      } catch (err) {
        console.warn('Failed to fetch projects:', err);
      }
    },

    addProject: async (project) => {
      try {
        const newProject = await projectService.createProject(project);
        set((state) => {
          const updated = [newProject, ...state.userProjects.filter((p) => p.id !== newProject.id)];
          localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
          return { userProjects: updated };
        });
        toast.success('Project Connected', `Repository ${newProject.name} linked.`);
      } catch (err) {
        console.error('Error connecting project:', err);
      }
    },

    deleteProject: async (id: string) => {
      set((state) => {
        const updated = state.userProjects.filter((p) => p.id !== id);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
        return { userProjects: updated };
      });
      toast.info('Project Disconnected', 'Repository removed from studio.');
      try {
        await projectService.deleteProject(id);
      } catch (err) {
        console.error('Error disconnecting project on server:', err);
      }
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
