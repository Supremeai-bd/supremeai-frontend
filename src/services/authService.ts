import { apiClient } from './apiClient';
import { AuthUser } from '../types';
import { env } from '../config/env';

export interface LoginResponse {
  success: boolean;
  user: AuthUser;
  token: string;
}

export interface Verify2FAResponse {
  success: boolean;
  verified: boolean;
  authMethod: string;
  trustedBrowser: boolean;
  trustedUntil: number | null;
  deviceId: string | null;
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (env.isMockEnabled) {
      // Mock fallback
      const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('njel');
      return {
        success: true,
        user: {
          id: `usr_${Date.now()}`,
          name: isAdmin ? 'Ziaul Haq (Admin)' : 'Mock Developer',
          email,
          role: isAdmin ? 'admin' : 'user',
          isAdminEligible: isAdmin,
          adminUserId: isAdmin ? 'admin_root_001' : undefined,
          plan: isAdmin ? 'Enterprise' : 'Pro',
          createdAt: '2026-01-15',
        },
        token: `mock_tok_${Date.now()}`,
      };
    }

    return apiClient.post<LoginResponse>('/api/auth/login', { email, password });
  },

  async signup(name: string, email: string, password: string, plan: string = 'Pro'): Promise<LoginResponse> {
    if (env.isMockEnabled) {
      const isAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('njel');
      return {
        success: true,
        user: {
          id: `usr_${Date.now()}`,
          name,
          email,
          role: isAdmin ? 'admin' : 'user',
          isAdminEligible: isAdmin,
          adminUserId: isAdmin ? 'admin_root_001' : undefined,
          plan: plan as any,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        token: `mock_tok_${Date.now()}`,
      };
    }

    return apiClient.post<LoginResponse>('/api/auth/signup', { name, email, password, plan });
  },

  async verify2FA(payload: {
    token?: string;
    biometricSignature?: string;
    method: 'totp' | 'biometric';
    trustFor7Days: boolean;
    userEmail: string;
  }): Promise<Verify2FAResponse> {
    if (env.isMockEnabled) {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      return {
        success: true,
        verified: true,
        authMethod: payload.method,
        trustedBrowser: payload.trustFor7Days,
        trustedUntil: payload.trustFor7Days ? Date.now() + SEVEN_DAYS_MS : null,
        deviceId: `mock_dev_${Date.now()}`,
        message: 'Mock 2FA verification passed.',
      };
    }

    return apiClient.post<Verify2FAResponse>('/api/auth/verify-2fa', payload);
  },

  async verifyAdminPasskey(passkey: string): Promise<{ success: boolean; authenticated: boolean; role: string }> {
    return apiClient.post('/api/admin/auth/verify', { passkey });
  },
};
