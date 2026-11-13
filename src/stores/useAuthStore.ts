import { create } from 'zustand';
import { AuthUser, UserRole, CustomerRecord } from '../types';
import { authService } from '../services/authService';
import { env } from '../config/env';
import { useCustomerStore } from './useCustomerStore';
import { useChatStore } from './useChatStore';
import { toast } from './useToastStore';

const AUTH_USER_KEY = 'supremeai_auth_user';
const ROLE_KEY = 'supremeai_studio_user_role';
const TRUSTED_BROWSER_KEY = 'supremeai_trusted_browser_until';

interface AuthState {
  authUser: AuthUser | null;
  originalAdminUser: AuthUser | null;
  impersonatedCustomer: CustomerRecord | null;
  currentRole: UserRole;
  trustedBrowserUntil: number | null;
  isTwoFactorModalOpen: boolean;
  isAdminAuthModalOpen: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, plan?: string, isDeveloperEligible?: boolean) => Promise<boolean>;
  logout: () => void;
  restoreSession: () => Promise<void>;
  verify2FA: (payload: {
    token?: string;
    biometricSignature?: string;
    method: 'totp' | 'biometric';
    trustFor7Days: boolean;
    userEmail: string;
  }) => Promise<boolean>;
  handleToggleRole: (forcedRole?: UserRole) => void;
  setDeveloperEligibility: (eligible: boolean) => void;
  setIsTwoFactorModalOpen: (open: boolean) => void;
  setIsAdminAuthModalOpen: (open: boolean) => void;
  revokeTrustedBrowser: () => void;
  impersonateCustomer: (customer: CustomerRecord) => void;
  exitImpersonation: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize from localStorage
  const getInitialUser = (): AuthUser | null => {
    try {
      const saved = localStorage.getItem(AUTH_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Integration plan Phase 1: never seed a default admin identity here.
    // A stored identity is provisional until restoreSession() validates it
    // against GET /api/v1/auth/me.
    return null;
  };

  const getInitialRole = (): UserRole => {
    const saved = localStorage.getItem(ROLE_KEY);
    return saved === 'admin' ? 'admin' : 'user';
  };

  const getInitialTrustedUntil = (): number | null => {
    try {
      const saved = localStorage.getItem(TRUSTED_BROWSER_KEY);
      if (saved) {
        const val = Number(saved);
        if (val > Date.now()) return val;
      }
    } catch {}
    return null;
  };

  return {
    authUser: getInitialUser(),
    originalAdminUser: null,
    impersonatedCustomer: null,
    currentRole: getInitialRole(),
    trustedBrowserUntil: getInitialTrustedUntil(),
    isTwoFactorModalOpen: false,
    isAdminAuthModalOpen: false,
    isLoading: false,

    restoreSession: async () => {
      // Integration plan Phase 1: validate any stored session against the
      // deployed API before trusting it. Mock mode keeps local state by design.
      if (env.isMockEnabled) return;

      const token = localStorage.getItem('supremeai_access_token');
      if (!token) {
        // No token: any locally stored user identity is not authenticated.
        if (localStorage.getItem(AUTH_USER_KEY)) {
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.setItem(ROLE_KEY, 'user');
          set({ authUser: null, currentRole: 'user' });
        }
        return;
      }

      set({ isLoading: true });
      try {
        const user = await authService.getMe();
        if (user) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
          const role: UserRole = user.isAdminEligible && user.role === 'admin' ? 'admin' : 'user';
          localStorage.setItem(ROLE_KEY, role);
          set({ authUser: user, currentRole: role, isLoading: false });
          useChatStore.getState().syncRemoteSessions().catch(() => {});
        } else {
          // Expired or invalid credentials: clear the session fail-closed.
          localStorage.removeItem(AUTH_USER_KEY);
          localStorage.removeItem('supremeai_access_token');
          localStorage.setItem(ROLE_KEY, 'user');
          set({ authUser: null, currentRole: 'user', isLoading: false });
        }
      } catch {
        // Network failure: keep the provisional session but stop loading.
        // Authorization remains enforced server-side on every request.
        set({ isLoading: false });
      }
    },

    login: async (email: string, password: string) => {
      set({ isLoading: true });
      try {
        const res = await authService.login(email, password);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
        const roleToSet = res.user.isAdminEligible && res.user.role === 'admin' ? 'admin' : 'user';
        localStorage.setItem(ROLE_KEY, roleToSet);

        set({
          authUser: res.user,
          originalAdminUser: null,
          impersonatedCustomer: null,
          currentRole: roleToSet,
          isLoading: false,
        });

        useCustomerStore.getState().updateSettings({
          name: res.user.name,
          email: res.user.email,
          plan: res.user.plan,
          developerMode: false,
        });

        toast.success(
          `Welcome back, ${res.user.name}!`,
          `Signed in as ${res.user.role === 'admin' ? 'Administrator' : 'User'}`
        );
        useChatStore.getState().syncRemoteSessions().catch(() => {});
        return true;
      } catch (err: unknown) {
        set({ isLoading: false });
        toast.error('Sign In Failed', err instanceof Error ? err.message : 'Invalid credentials');
        return false;
      }
    },

    signup: async (
      name: string,
      email: string,
      password: string,
      plan: string = 'Pro',
      isDeveloperEligible: boolean = false
    ) => {
      set({ isLoading: true });
      try {
        const res = await authService.signup(name, email, password, plan, isDeveloperEligible);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(res.user));
        localStorage.setItem(ROLE_KEY, res.user.role);

        set({
          authUser: res.user,
          originalAdminUser: null,
          impersonatedCustomer: null,
          currentRole: res.user.role,
          isLoading: false,
        });

        useCustomerStore.getState().updateSettings({
          name: res.user.name,
          email: res.user.email,
          plan: res.user.plan,
          developerMode: false,
        });

        toast.success('Account Created', `Welcome to SupremeAI Studio, ${res.user.name}!`);
        return true;
      } catch (err: unknown) {
        set({ isLoading: false });
        toast.error('Registration Failed', err instanceof Error ? err.message : 'Could not create account');
        return false;
      }
    },

    logout: () => {
      authService.logout();
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem('supremeai_access_token');
      localStorage.setItem(ROLE_KEY, 'user');
      sessionStorage.removeItem('supremeai_admin_authed');
      set({
        authUser: null,
        originalAdminUser: null,
        impersonatedCustomer: null,
        currentRole: 'user',
        isTwoFactorModalOpen: false,
        isAdminAuthModalOpen: false,
      });
      toast.info('Signed Out', 'You have been safely signed out of SupremeAI Studio.');
    },

    verify2FA: async (payload) => {
      try {
        const res = await authService.verify2FA(payload);
        if (res.verified) {
          if (res.trustedUntil) {
            localStorage.setItem(TRUSTED_BROWSER_KEY, String(res.trustedUntil));
            set({ trustedBrowserUntil: res.trustedUntil });
          }
          localStorage.setItem(ROLE_KEY, 'admin');
          set({
            currentRole: 'admin',
            isTwoFactorModalOpen: false,
          });
          toast.success(
            'Admin Access Granted',
            res.trustedBrowser
              ? '2-Step Verification passed. Browser trusted for the next 7 days.'
              : 'Welcome to Admin Studio Command Center.'
          );
          return true;
        }
        return false;
      } catch (err: unknown) {
        toast.error('2FA Verification Failed', err instanceof Error ? err.message : 'Invalid 2FA token');
        return false;
      }
    },

    handleToggleRole: (forcedRole?: UserRole) => {
      const { authUser, currentRole, trustedBrowserUntil, impersonatedCustomer } = get();
      if (impersonatedCustomer && forcedRole === 'admin') {
        get().exitImpersonation();
        return;
      }
      const nextRole = forcedRole || (currentRole === 'admin' ? 'user' : 'admin');

      if (nextRole === 'admin') {
        if (!authUser?.isAdminEligible) {
          toast.warning(
            'Access Restricted',
            'Only verified Admin accounts matching admin_root_001 can switch to Admin Studio.'
          );
          return;
        }

        const isBrowserTrusted = trustedBrowserUntil !== null && trustedBrowserUntil > Date.now();
        if (!isBrowserTrusted) {
          set({ isTwoFactorModalOpen: true });
          return;
        }
      }

      localStorage.setItem(ROLE_KEY, nextRole);
      set({ currentRole: nextRole });
      toast.info('Workspace Switch', `Switched to ${nextRole === 'admin' ? 'Admin Studio' : 'User Mode'}`);
    },

    setDeveloperEligibility: (eligible: boolean) => {
      const { authUser } = get();
      if (!authUser) return;
      const updatedUser: AuthUser = {
        ...authUser,
        isDeveloperEligible: eligible,
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      set({ authUser: updatedUser });
      if (!eligible) {
        useCustomerStore.getState().updateSettings({ developerMode: false });
      }
      toast.info(
        eligible ? 'Developer Switch Unlocked' : 'Developer Switch Hidden',
        eligible
          ? 'You can now switch between Standard and Developer Mode from the navigation bar or sidebar.'
          : 'Your workspace is now set to clean Standard Mode.'
      );
    },

    setIsTwoFactorModalOpen: (open: boolean) => set({ isTwoFactorModalOpen: open }),
    setIsAdminAuthModalOpen: (open: boolean) => set({ isAdminAuthModalOpen: open }),

    revokeTrustedBrowser: () => {
      localStorage.removeItem(TRUSTED_BROWSER_KEY);
      set({ trustedBrowserUntil: null });
      toast.info('Trusted Device Revoked', 'Next time you switch to Admin, 2-step verification will be required.');
    },

    impersonateCustomer: (customer: CustomerRecord) => {
      const { authUser, originalAdminUser } = get();
      const adminSnapshot = originalAdminUser || authUser;

      const impersonatedUser: AuthUser = {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        avatar: customer.name.charAt(0).toUpperCase(),
        role: 'user',
        isAdminEligible: false,
        isDeveloperEligible: Boolean(customer.isDeveloperEligible),
        plan: customer.tier,
        createdAt: customer.joinedDate,
      };

      localStorage.setItem(ROLE_KEY, 'user');
      useCustomerStore.getState().updateSettings({
        name: customer.name,
        email: customer.email,
        plan: customer.tier,
        monthlyTokensUsed: customer.tokensUsed,
        monthlyTokensLimit: customer.tokenLimit,
        developerMode: false,
      });

      set({
        originalAdminUser: adminSnapshot,
        impersonatedCustomer: customer,
        authUser: impersonatedUser,
        currentRole: 'user',
      });
      toast.info('Customer Impersonation Active', `Viewing workspace as ${customer.name} (${customer.tier}).`);
    },

    exitImpersonation: () => {
      const { originalAdminUser } = get();
      if (!originalAdminUser) return;

      localStorage.setItem(ROLE_KEY, 'admin');
      useCustomerStore.getState().updateSettings({
        name: originalAdminUser.name,
        email: originalAdminUser.email,
        plan: originalAdminUser.plan,
      });

      set({
        authUser: originalAdminUser,
        originalAdminUser: null,
        impersonatedCustomer: null,
        currentRole: 'admin',
      });
      toast.success('Returned to Admin Studio', 'Exited customer impersonation session.');
    },
  };
});
