import { apiClient } from './apiClient';
import { env } from '../config/env';
import { ApiKeyItem } from '../types';
import { INITIAL_API_KEYS } from '../data/customerWorkspaceData';

export const apiKeyService = {
  async fetchApiKeys(): Promise<ApiKeyItem[]> {
    if (env.isMockEnabled) {
      return INITIAL_API_KEYS;
    }
    try {
      const res = await apiClient.get<{ keys: ApiKeyItem[] }>('/api/api-keys');
      if (res && Array.isArray(res.keys) && res.keys.length > 0) {
        return res.keys;
      }
      return INITIAL_API_KEYS;
    } catch {
      return INITIAL_API_KEYS;
    }
  },

  async createApiKey(newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>): Promise<ApiKeyItem> {
    const fallbackItem: ApiKeyItem = {
      ...newKey,
      id: `key_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
    };
    if (env.isMockEnabled) {
      return fallbackItem;
    }
    try {
      const res = await apiClient.post<{
        id?: string | number;
        name?: string;
        key?: string;
        key_masked?: string;
        rate_limit_rps?: number;
        created_at?: string;
        scopes?: string[];
      }>('/api/api-keys/create', {
        user_id: 'current_user',
        name: newKey.name,
        rate_limit_rps: Math.max(1, Math.floor(newKey.rateLimitRpm / 60)) || 6,
        scopes: newKey.permissions,
      });

      return {
        id: String(res.id || fallbackItem.id),
        name: res.name || newKey.name,
        keyPrefix: res.key ? res.key.slice(0, 12) : newKey.keyPrefix,
        secretMasked: res.key_masked || newKey.secretMasked,
        createdAt: res.created_at ? String(res.created_at).slice(0, 10) : fallbackItem.createdAt,
        lastUsed: 'Never',
        rateLimitRpm: res.rate_limit_rps ? res.rate_limit_rps * 60 : newKey.rateLimitRpm,
        status: 'active',
        permissions: (res.scopes as ApiKeyItem['permissions']) || newKey.permissions,
      };
    } catch {
      return fallbackItem;
    }
  },

  async revokeApiKey(id: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.post(`/api/api-keys/${encodeURIComponent(id)}/revoke`, {});
      return true;
    } catch {
      return false;
    }
  },

  async deleteApiKey(id: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.delete(`/api/api-keys/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },
};
