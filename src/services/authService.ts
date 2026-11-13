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
          isDeveloperEligible: isAdmin || email.toLowerCase().includes('sarah') || email.toLowerCase().includes('dev'),
          adminUserId: isAdmin ? 'admin_root_001' : undefined,
          plan: isAdmin ? 'Enterprise' : 'Pro',
          createdAt: '2026-01-15',
        },
        token: `mock_tok_${Date.now()}`,
      };
    }

    const data = await apiClient.post<any>('/api/v1/auth/login', { username: email, email, password });
    const token = data.access_token || data.token || '';
    const isAdmin = data.role === 'admin' || (data.user && data.user.role === 'admin');
    const user: AuthUser = data.user || {
      id: data.user_id || `usr_${Date.now()}`,
      name: email.split('@')[0],
      email: email,
      role: isAdmin ? 'admin' : 'user',
      isAdminEligible: isAdmin,
      isDeveloperEligible: isAdmin,
      adminUserId: isAdmin ? data.user_id : undefined,
      plan: isAdmin ? 'Enterprise' : 'Pro',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (token) {
      localStorage.setItem('supremeai_access_token', token);
    }

    return {
      success: true,
      user,
      token,
    };
  },

  async signup(
    name: string,
    email: string,
    password: string,
    plan: string = 'Pro',
    isDeveloperEligible: boolean = false
  ): Promise<LoginResponse> {
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
          isDeveloperEligible: isAdmin || isDeveloperEligible,
          adminUserId: isAdmin ? 'admin_root_001' : undefined,
          plan: plan as any,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        token: `mock_tok_${Date.now()}`,
      };
    }

    const data = await apiClient.post<any>('/api/v1/auth/register', {
      username: email,
      email,
      password,
      name,
      plan,
      isDeveloperEligible,
      workspaceFocus: isDeveloperEligible ? 'developer' : 'everyday',
    });
    const token = data.access_token || data.token || '';
    const isAdmin = data.role === 'admin' || (data.user && data.user.role === 'admin');
    const user: AuthUser = data.user || {
      id: data.user_id || `usr_${Date.now()}`,
      name: name || email.split('@')[0],
      email: email,
      role: isAdmin ? 'admin' : 'user',
      isAdminEligible: isAdmin,
      isDeveloperEligible: isAdmin || isDeveloperEligible,
      adminUserId: isAdmin ? data.user_id : undefined,
      plan: (plan as any) || (isAdmin ? 'Enterprise' : 'Pro'),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    if (token) {
      localStorage.setItem('supremeai_access_token', token);
    }

    return {
      success: true,
      user,
      token,
    };
  },

  async getMe(): Promise<AuthUser | null> {
    try {
      const data = await apiClient.get<any>('/api/v1/auth/me');
      if (!data) return null;
      const isAdmin = data.role === 'admin';
      return {
        id: data.user_id || 'usr_unknown',
        name: (data.email || 'user').split('@')[0],
        email: data.email || '',
        role: isAdmin ? 'admin' : 'user',
        isAdminEligible: isAdmin,
        isDeveloperEligible: isAdmin || Boolean(data.isDeveloperEligible),
        adminUserId: isAdmin ? data.user_id : undefined,
        plan: isAdmin ? 'Enterprise' : 'Pro',
        createdAt: new Date().toISOString().slice(0, 10),
      };
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      if (!env.isMockEnabled) {
        await apiClient.post('/api/v1/auth/logout');
      }
    } catch {}
    localStorage.removeItem('supremeai_access_token');
    localStorage.removeItem('supremeai_auth_user');
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
