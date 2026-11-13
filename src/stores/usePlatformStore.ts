import { create } from 'zustand';
import { PlatformConfig, ModelPolicy, AnnouncementBanner } from '../types';
import { adminService } from '../services/adminService';
import { toast } from './useToastStore';

const DEFAULT_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  maintenanceMessage:
    'SupremeAI Studio is undergoing scheduled database maintenance. Administrators remain online.',
  announcementBanner: {
    active: false,
    message: 'All Gemini 3.8 Flash and Gemini 4 Carbon routes are operating normally.',
    level: 'info',
  },
  allowNewSignups: true,
  defaultModelId: 'gemini-3.8-flash',
  featureFlags: {
    enable_gemini_4_reasoning: true,
    enable_multimodal_vision: true,
    enable_rag_grounding: true,
    enable_continuous_agent_swarm: true,
    enforce_strict_rate_limits: false,
    maintenance_mode: false,
  },
  modelPolicies: {
    'gemini-3.8-flash': { enabled: true, minTier: 'Free' },
    'gemini-3.1-flash-lite': { enabled: true, minTier: 'Free' },
    'gemini-4-carbon': { enabled: true, minTier: 'Pro' },
    'gemini-4-argon': { enabled: true, minTier: 'Enterprise' },
  },
};

interface PlatformState {
  config: PlatformConfig;
  isLoaded: boolean;
  isSaving: boolean;
  dismissedBannerMessage: string | null;

  fetchConfig: () => Promise<void>;
  updateConfig: (updates: {
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
    announcementBanner?: Partial<AnnouncementBanner>;
    allowNewSignups?: boolean;
    defaultModelId?: string;
  }) => Promise<void>;
  toggleFeatureFlag: (key: string, enabled: boolean) => Promise<void>;
  updateModelPolicy: (modelId: string, policy: Partial<ModelPolicy>) => Promise<void>;
  dismissBanner: (message: string) => void;
}

export const usePlatformStore = create<PlatformState>((set, get) => ({
  config: DEFAULT_CONFIG,
  isLoaded: false,
  isSaving: false,
  dismissedBannerMessage: null,

  fetchConfig: async () => {
    try {
      const remote = await adminService.fetchPlatformConfig();
      if (remote && remote.featureFlags) {
        set({ config: remote, isLoaded: true });
      }
    } catch {
      // Keep safe defaults if backend is still starting up
    }
  },

  updateConfig: async (updates) => {
    set({ isSaving: true });
    try {
      const payload: any = { ...updates };
      if (updates.announcementBanner) {
        payload.announcementBanner = {
          ...get().config.announcementBanner,
          ...updates.announcementBanner,
        };
      }
      const next = await adminService.updatePlatformConfig(payload);
      set({ config: next, isSaving: false, dismissedBannerMessage: null });
      toast.success('Platform Policy Saved', 'Changes are live across all workspaces.');
    } catch (err: unknown) {
      set({ isSaving: false });
      toast.error(
        'Policy Update Failed',
        err instanceof Error ? err.message : 'Could not update platform configuration'
      );
    }
  },

  toggleFeatureFlag: async (key: string, enabled: boolean) => {
    const prev = get().config;
    // Optimistic update
    set({
      config: {
        ...prev,
        maintenanceMode: key === 'maintenance_mode' ? enabled : prev.maintenanceMode,
        featureFlags: { ...prev.featureFlags, [key]: enabled },
      },
    });
    try {
      const updatedFlags = await adminService.updateFeatureFlag(key, enabled);
      set((state) => ({
        config: {
          ...state.config,
          maintenanceMode:
            typeof updatedFlags.maintenance_mode === 'boolean'
              ? updatedFlags.maintenance_mode
              : state.config.maintenanceMode,
          featureFlags: updatedFlags,
        },
      }));
    } catch (err: unknown) {
      set({ config: prev });
      toast.error(
        'Flag Update Failed',
        err instanceof Error ? err.message : 'Could not update feature flag'
      );
    }
  },

  updateModelPolicy: async (modelId: string, policy: Partial<ModelPolicy>) => {
    const prev = get().config;
    const prevModelPolicy = prev.modelPolicies[modelId] || { enabled: true, minTier: 'Free' };
    set({
      config: {
        ...prev,
        modelPolicies: {
          ...prev.modelPolicies,
          [modelId]: { ...prevModelPolicy, ...policy },
        },
      },
    });
    try {
      const modelPolicies = await adminService.updateModelPolicy(modelId, policy);
      set((state) => ({
        config: { ...state.config, modelPolicies },
      }));
      toast.info('Model Policy Updated', `${modelId} governance rules applied.`);
    } catch (err: unknown) {
      set({ config: prev });
      toast.error(
        'Model Policy Failed',
        err instanceof Error ? err.message : 'Could not update model access rule'
      );
    }
  },

  dismissBanner: (message: string) => set({ dismissedBannerMessage: message }),
}));
