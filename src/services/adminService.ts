import { apiClient } from './apiClient';
import {
  McpTowerService,
  PlatformConfig,
  ModelPolicy,
  CustomerRecord,
  SystemAuditRecord,
  BlockedIpRecord,
  ProviderKeyItem,
} from '../types';
import { INITIAL_MCP_SERVICES, INITIAL_ADMIN_METRICS } from '../data/mcpTowerData';
import {
  INITIAL_FEATURE_FLAGS,
  INITIAL_AUDIT_RECORDS,
  INITIAL_PROVIDER_KEYS,
} from '../data/adminExpansionData';
import { INITIAL_CUSTOMERS } from '../data/customerData';
import { env } from '../config/env';

export const adminService = {
  async fetchPlatformConfig(): Promise<PlatformConfig> {
    return apiClient.get<PlatformConfig>('/api/platform/config');
  },

  async updatePlatformConfig(
    updates: Partial<Omit<PlatformConfig, 'featureFlags' | 'modelPolicies'>> & { actor?: string }
  ): Promise<PlatformConfig> {
    const res = await apiClient.post<{ success: boolean; config: PlatformConfig }>(
      '/api/admin/config',
      updates
    );
    return res.config;
  },

  async updateModelPolicy(
    modelId: string,
    policy: Partial<ModelPolicy>
  ): Promise<Record<string, ModelPolicy>> {
    const res = await apiClient.post<{ success: boolean; modelPolicies: Record<string, ModelPolicy> }>(
      '/api/admin/models/policy',
      { modelId, ...policy }
    );
    return res.modelPolicies;
  },

  async fetchOverview() {
    if (env.isMockEnabled) {
      return {
        summary: INITIAL_ADMIN_METRICS,
        featureFlags: INITIAL_FEATURE_FLAGS.reduce((acc, f) => ({ ...acc, [f.key]: f.enabled }), {}),
      };
    }
    return apiClient.get('/api/admin/overview');
  },

  mapTowerService(raw: any): McpTowerService {
    return {
      id: raw.id,
      name: raw.name || raw.id,
      displayName: raw.displayName || raw.name || raw.id,
      category: raw.category || 'core',
      port: typeof raw.port === 'number' ? raw.port : 0,
      status: raw.status || 'healthy',
      uptime: raw.uptime || '—',
      latencyMs: typeof raw.latencyMs === 'number' ? raw.latencyMs : 0,
      cpuPercent: typeof raw.cpuPercent === 'number' ? raw.cpuPercent : 0,
      memoryMb: typeof raw.memoryMb === 'number' ? raw.memoryMb : 0,
      lastChecked: raw.lastChecked || 'Just now',
      version: raw.version || raw.deployStatus || 'live',
      endpoint: raw.endpoint || '',
      errorCount: typeof raw.errorCount === 'number' ? raw.errorCount : 0,
      logs: Array.isArray(raw.logs) ? raw.logs : [],
      deployStatus: raw.deployStatus,
      monthlyBuildMinutes: raw.monthlyBuildMinutes,
      freeLimitRemainingMinutes: raw.freeLimitRemainingMinutes,
      freeLimitExhausted: raw.freeLimitExhausted,
      deployAgeDays: raw.deployAgeDays,
      commitSha: raw.commitSha,
      freshness: raw.freshness,
    };
  },

  async fetchMcpServices(): Promise<McpTowerService[]> {
    if (env.isMockEnabled) {
      return INITIAL_MCP_SERVICES;
    }
    const data = await apiClient.get<{ services: any[] }>('/api/mcp-tower/services');
    const mapped = (data.services || []).map((s) => this.mapTowerService(s));
    return mapped.length > 0 ? mapped : INITIAL_MCP_SERVICES;
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

  async fetchCustomers(): Promise<CustomerRecord[]> {
    if (env.isMockEnabled) {
      return INITIAL_CUSTOMERS;
    }
    try {
      const res = await apiClient.get<{ customers: CustomerRecord[] }>('/api/admin/customers');
      return res.customers || INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  async createCustomer(
    customer: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>
  ): Promise<CustomerRecord[]> {
    if (env.isMockEnabled) {
      const newRec: CustomerRecord = {
        ...customer,
        id: `cust_${String(Date.now()).slice(-4)}`,
        joinedDate: new Date().toISOString().slice(0, 10),
        lastActive: 'Just now',
      };
      return [newRec, ...INITIAL_CUSTOMERS];
    }
    try {
      const res = await apiClient.post<{ customers: CustomerRecord[] }>('/api/admin/customers', customer);
      return res.customers || INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  async updateCustomer(id: string, updates: Partial<CustomerRecord>): Promise<CustomerRecord[]> {
    if (env.isMockEnabled) {
      return INITIAL_CUSTOMERS.map((c) => (c.id === id ? { ...c, ...updates } : c));
    }
    try {
      const res = await apiClient.request<{ customers: CustomerRecord[] }>(`/api/admin/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return res.customers || INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  async deleteCustomer(id: string): Promise<CustomerRecord[]> {
    if (env.isMockEnabled) {
      return INITIAL_CUSTOMERS.filter((c) => c.id !== id);
    }
    try {
      const res = await apiClient.delete<{ customers: CustomerRecord[] }>(`/api/admin/customers/${id}`);
      return res.customers || INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  async fetchBlockedIps(): Promise<BlockedIpRecord[]> {
    const fallback: BlockedIpRecord[] = [
      { ip: '45.154.255.8', reason: 'Internal MCP Port Scanner', date: '2 days ago' },
      { ip: '198.51.100.44', reason: 'Adversarial Jailbreak Payload Injection', date: 'Today' },
    ];
    if (env.isMockEnabled) {
      return fallback;
    }
    try {
      const res = await apiClient.get<{ blockedIps: BlockedIpRecord[] }>('/api/admin/security');
      return res.blockedIps || fallback;
    } catch {
      return fallback;
    }
  },

  async blockIp(ip: string, reason: string): Promise<BlockedIpRecord[]> {
    try {
      const res = await apiClient.post<{ blockedIps: BlockedIpRecord[] }>('/api/admin/security/block-ip', {
        ip,
        reason,
      });
      return res.blockedIps || [];
    } catch {
      return [{ ip, reason, date: 'Just now' }];
    }
  },

  async unblockIp(ip: string): Promise<BlockedIpRecord[]> {
    try {
      const res = await apiClient.delete<{ blockedIps: BlockedIpRecord[] }>(
        `/api/admin/security/block-ip/${encodeURIComponent(ip)}`
      );
      return res.blockedIps || [];
    } catch {
      return [];
    }
  },

  async fetchAuditRecords(): Promise<SystemAuditRecord[]> {
    if (env.isMockEnabled) {
      return INITIAL_AUDIT_RECORDS;
    }
    try {
      const res = await apiClient.get<{ auditRecords: SystemAuditRecord[] }>('/api/admin/audit');
      return res.auditRecords || INITIAL_AUDIT_RECORDS;
    } catch {
      return INITIAL_AUDIT_RECORDS;
    }
  },

  async flushDlq(): Promise<void> {
    try {
      await apiClient.post('/api/admin/queue/flush-dlq');
    } catch {}
  },

  async fetchProviders(): Promise<ProviderKeyItem[]> {
    if (env.isMockEnabled) {
      return INITIAL_PROVIDER_KEYS;
    }
    try {
      const res = await apiClient.get<{ providers: ProviderKeyItem[] }>('/api/admin/providers');
      return res.providers || INITIAL_PROVIDER_KEYS;
    } catch {
      return INITIAL_PROVIDER_KEYS;
    }
  },

  async probeProvider(
    providerId: string
  ): Promise<{ success: boolean; message: string; providers: ProviderKeyItem[] }> {
    return apiClient.post('/api/admin/providers/probe', { providerId });
  },

  async updateProviderPriority(
    providerId: string,
    direction: 'up' | 'down'
  ): Promise<ProviderKeyItem[]> {
    const res = await apiClient.post<{ providers: ProviderKeyItem[] }>('/api/admin/providers/priority', {
      providerId,
      direction,
    });
    return res.providers || [];
  },
};
