import { apiClient } from './apiClient';
import { McpTowerService } from '../types';
import { INITIAL_MCP_SERVICES, INITIAL_ADMIN_METRICS } from '../data/mcpTowerData';
import { INITIAL_FEATURE_FLAGS } from '../data/adminExpansionData';
import { env } from '../config/env';

export const adminService = {
  async fetchOverview() {
    if (env.isMockEnabled) {
      return {
        summary: INITIAL_ADMIN_METRICS,
        featureFlags: INITIAL_FEATURE_FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: f.enabled }), {}),
      };
    }
    return apiClient.get('/api/admin/overview');
  },

  async fetchMcpServices(): Promise<McpTowerService[]> {
    if (env.isMockEnabled) {
      return INITIAL_MCP_SERVICES;
    }
    const data = await apiClient.get<{ services: McpTowerService[] }>('/api/mcp-tower/services');
    return data.services || INITIAL_MCP_SERVICES;
  },

  async rebootMcpService(serviceId: string): Promise<McpTowerService> {
    if (env.isMockEnabled) {
      const match = INITIAL_MCP_SERVICES.find((s) => s.id === serviceId);
      return (
        match || {
          id: serviceId,
          name: serviceId,
          displayName: serviceId,
          category: 'core',
          port: 4000,
          status: 'healthy',
          uptime: '100%',
          latencyMs: 24,
          cpuPercent: 2.1,
          memoryMb: 128,
          lastChecked: 'Just now (Mock)',
          version: 'v2.1.0',
          endpoint: `/api/${serviceId}`,
          errorCount: 0,
          logs: [],
        }
      );
    }
    const data = await apiClient.post<{ service: McpTowerService }>('/api/mcp-tower/reboot', { serviceId });
    return data.service;
  },

  async rebootAllMcpServices(): Promise<McpTowerService[]> {
    if (env.isMockEnabled) {
      return INITIAL_MCP_SERVICES.map((s) => ({ ...s, status: 'healthy', errorCount: 0 }));
    }
    const data = await apiClient.post<{ services: McpTowerService[] }>('/api/mcp-tower/reboot-all');
    return data.services;
  },

  async probeMcpCluster(): Promise<McpTowerService[]> {
    if (env.isMockEnabled) {
      return INITIAL_MCP_SERVICES;
    }
    const data = await apiClient.post<{ services: McpTowerService[] }>('/api/mcp-tower/probe');
    return data.services;
  },

  async fetchFeatureFlags(): Promise<Record<string, boolean>> {
    if (env.isMockEnabled) {
      return INITIAL_FEATURE_FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: f.enabled }), {});
    }
    const data = await apiClient.get<{ flags: Record<string, boolean> }>('/api/admin/feature-flags');
    return data.flags;
  },

  async updateFeatureFlag(key: string, enabled: boolean): Promise<Record<string, boolean>> {
    if (env.isMockEnabled) {
      return { [key]: enabled };
    }
    const data = await apiClient.post<{ flags: Record<string, boolean> }>('/api/admin/feature-flags', {
      [key]: enabled,
    });
    return data.flags;
  },
};
