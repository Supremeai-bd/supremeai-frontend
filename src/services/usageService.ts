import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface WalletData {
  userId: string;
  balanceUsd: number;
  monthlyAllowanceUsd: number;
}

export interface BillingAnalytics {
  totalSpent: number;
  totalSaved: number;
  cachedQueries: number;
}

export interface DailyUsageMetric {
  metric_date: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  unique_users: number;
  avg_latency_ms: number;
  error_rate: number;
}

export const usageService = {
  /**
   * Fetch current authenticated user's wallet and allowance
   */
  async getWallet(): Promise<WalletData | null> {
    if (env.isMockEnabled) {
      return {
        userId: 'demo-user',
        balanceUsd: 125.5,
        monthlyAllowanceUsd: 500.0,
      };
    }

    try {
      const data = await apiClient.get<any>('/api/billing/wallet');
      return {
        userId: data.user_id || '',
        balanceUsd: typeof data.balance_usd === 'number' ? data.balance_usd : 0,
        monthlyAllowanceUsd: typeof data.monthly_allowance_usd === 'number' ? data.monthly_allowance_usd : 0,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch real aggregate spending and cache savings
   */
  async getAnalytics(): Promise<BillingAnalytics | null> {
    if (env.isMockEnabled) {
      return {
        totalSpent: 14.85,
        totalSaved: 32.4,
        cachedQueries: 1420,
      };
    }

    try {
      const data = await apiClient.get<any>('/api/billing/summary');
      return {
        totalSpent: typeof data.total_spent === 'number' ? data.total_spent : 0,
        totalSaved: typeof data.total_saved === 'number' ? data.total_saved : 0,
        cachedQueries: typeof data.cached_queries === 'number' ? data.cached_queries : 0,
      };
    } catch {
      return null;
    }
  },

  /**
   * Fetch historical daily token metrics
   */
  async getUsageMetrics(limit: number = 30): Promise<DailyUsageMetric[]> {
    if (env.isMockEnabled) {
      return [];
    }

    try {
      const res = await apiClient.get<{ items: DailyUsageMetric[]; total: number }>(`/metrics/usage?limit=${limit}`);
      return Array.isArray(res.items) ? res.items : [];
    } catch {
      return [];
    }
  },
};
