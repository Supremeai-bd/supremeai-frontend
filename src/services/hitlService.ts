import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface HitlPendingRecord {
  id: string;
  action_name: string;
  command?: string;
  module?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const hitlService = {
  async getPending(): Promise<HitlPendingRecord[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const res = await apiClient.get<HitlPendingRecord[]>('/api/v1/hitl/pending');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async approve(recordId: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.post(`/api/v1/hitl/approve/${encodeURIComponent(recordId)}`);
      return true;
    } catch {
      return false;
    }
  },

  async reject(recordId: string, reason: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.post(`/api/v1/hitl/reject/${encodeURIComponent(recordId)}`, { reason });
      return true;
    } catch {
      return false;
    }
  },
};

