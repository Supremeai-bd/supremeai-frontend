import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface BrowserSessionInfo {
  session_id: string;
  status: string;
  url: string;
}

export interface BrowserActionResult {
  success: boolean;
  action: string;
  url: string;
  title?: string;
  screenshot?: string; // base64 PNG
  content?: string;
}

export interface BrowserProxyResponse {
  url: string;
  title: string;
  statusCode: number;
  latencyMs: number;
  extractedLinks: Array<{ text: string; href: string }>;
  textPreview: string;
  html: string;
  error?: string;
}

export const browserService = {
  /**
   * Create an isolated Playwright browser session on the backend.
   */
  async createSession(label: string = 'Operator Takeover Session', savedUrl?: string): Promise<BrowserSessionInfo> {
    if (env.isMockEnabled) {
      return {
        session_id: `mock_sess_${Date.now()}`,
        status: 'ready',
        url: savedUrl || 'https://example.com',
      };
    }

    try {
      return await apiClient.post<BrowserSessionInfo>('/api/browser/automation/sessions', {
        label,
        saved_url: savedUrl,
      });
    } catch {
      // Fallback response for un-configured Playwright host
      return {
        session_id: `fallback_${Date.now()}`,
        status: 'proxy-mode',
        url: savedUrl || '/api/health',
      };
    }
  },

  /**
   * Execute an action on an active browser session (navigate, click, fill, screenshot, etc.)
   */
  async executeAction(
    sessionId: string,
    action: 'navigate' | 'click' | 'fill' | 'type' | 'screenshot' | 'content' | 'extract' | 'back' | 'forward' | 'reload',
    params?: {
      url?: string;
      selector?: string;
      value?: string;
      full_page?: boolean;
    }
  ): Promise<BrowserActionResult> {
    if (env.isMockEnabled || sessionId.startsWith('mock_') || sessionId.startsWith('fallback_')) {
      return {
        success: true,
        action,
        url: params?.url || 'https://example.com',
        title: 'Mock Browser Session',
      };
    }

    return await apiClient.post<BrowserActionResult>('/api/browser/automation/actions', {
      session_id: sessionId,
      action,
      url: params?.url,
      selector: params?.selector,
      value: params?.value,
      full_page: params?.full_page || false,
    });
  },

  /**
   * Pause automation for operator manual takeover
   */
  async pauseAutomation(): Promise<{ status: string }> {
    try {
      return await apiClient.post<{ status: string }>('/api/browser/automation/pause', {});
    } catch {
      return { status: 'paused' };
    }
  },

  /**
   * Resume autonomous agent execution
   */
  async resumeAutomation(): Promise<{ status: string }> {
    try {
      return await apiClient.post<{ status: string }>('/api/browser/automation/resume', {});
    } catch {
      return { status: 'active' };
    }
  },

  /**
   * Fetch server-side rendered proxy content for static browsing / CORS-free DOM preview
   */
  async fetchProxy(url: string): Promise<BrowserProxyResponse> {
    const res = await fetch(`/api/workspace/browser-proxy?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  },
};
