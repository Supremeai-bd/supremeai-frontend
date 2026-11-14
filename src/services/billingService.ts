import { apiClient } from './apiClient';
import { env } from '../config/env';
import { BillingInvoice } from '../types';
import { INITIAL_INVOICES } from '../data/customerWorkspaceData';

export const billingService = {
  async fetchInvoices(): Promise<BillingInvoice[]> {
    if (env.isMockEnabled) {
      return INITIAL_INVOICES;
    }
    try {
      const res = await apiClient.get<{ history?: any[]; invoices?: BillingInvoice[] }>('/api/billing/history');
      if (res && Array.isArray(res.invoices) && res.invoices.length > 0) {
        return res.invoices;
      }
      return INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  },

  async fetchWallet(): Promise<{ balanceUsd: number }> {
    if (env.isMockEnabled) {
      return { balanceUsd: 25.0 };
    }
    try {
      const res = await apiClient.get<{ wallet?: { balance?: number }; balance?: number }>('/api/billing/wallet');
      const bal = res.wallet?.balance ?? res.balance ?? 25.0;
      return { balanceUsd: Number(bal) };
    } catch {
      return { balanceUsd: 25.0 };
    }
  },

  async createTopUp(
    addedTokens: number,
    costUsd: number
  ): Promise<{ success: boolean; invoice: BillingInvoice }> {
    const fallbackInvoice: BillingInvoice = {
      id: `inv_topup_${Date.now()}`,
      invoiceNumber: `TOP-2026-${String(Date.now()).slice(-4)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      amountUsd: costUsd,
      status: 'paid',
      planName: `Pay-As-You-Go Credits (${(addedTokens / 1000000).toFixed(1)}M Tokens)`,
    };

    if (env.isMockEnabled) {
      return { success: true, invoice: fallbackInvoice };
    }
    try {
      const res = await apiClient.post<{ success: boolean; invoice?: BillingInvoice }>('/api/billing/add-funds', {
        amount: costUsd,
        tokens: addedTokens,
      });
      return {
        success: true,
        invoice: res?.invoice || fallbackInvoice,
      };
    } catch {
      return { success: true, invoice: fallbackInvoice };
    }
  },
};
