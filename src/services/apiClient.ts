import { env } from '../config/env';

export interface ApiRequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number = 500, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * SupremeAI Centralized API Client
 * Wraps browser fetch with automatic bearer token injection, timeout handling,
 * and unified error extraction.
 */
class ApiClient {
  private getAuthToken(): string | null {
    try {
      const directToken = localStorage.getItem('supremeai_access_token');
      if (directToken) return directToken;

      const userRaw = localStorage.getItem('supremeai_auth_user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        return user.token || null;
      }
    } catch {}
    return null;
  }

  public async request<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
    const { timeoutMs = 15000, skipAuth = false, headers = {}, ...rest } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(headers as Record<string, string>),
    };

    if (!skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        mergedHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const url = endpoint.startsWith('http') ? endpoint : `${env.apiBaseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: options.signal || controller.signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      let data: any = null;
      if (isJson) {
        try {
          data = await response.json();
        } catch {
          data = null;
        }
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMessage =
          (isJson && (data?.detail || data?.error || data?.message)) ||
          (typeof data === 'string' && data.trim()) ||
          `HTTP Error ${response.status}: ${response.statusText}`;
        throw new ApiError(errorMessage, response.status, data);
      }

      return data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new ApiError(`Request timeout exceeded (${timeoutMs}ms) for ${endpoint}`, 408);
      }

      const errMsg = err instanceof Error ? err.message : String(err);
      const isFetchNetworkError =
        /failed to fetch|networkerror|load failed|err_blocked_by_client|network error|http2/i.test(errMsg) ||
        (err instanceof TypeError && /fetch|network/i.test(errMsg));

      if (isFetchNetworkError && endpoint !== '/api/health') {
        let onlineProbeOk = false;
        try {
          const probeCtrl = new AbortController();
          const probeTimer = setTimeout(() => probeCtrl.abort(), 2200);
          const probeRes = await fetch('/api/health', {
            method: 'GET',
            cache: 'no-store',
            signal: probeCtrl.signal,
          });
          clearTimeout(probeTimer);
          onlineProbeOk = probeRes.ok;
        } catch {
          onlineProbeOk = false;
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          throw new ApiError('Network offline. Check your internet connection and retry.', 0);
        }

        const isCrossOriginCall =
          url.startsWith('http') &&
          typeof window !== 'undefined' &&
          !url.startsWith(window.location.origin);

        if (!onlineProbeOk || isCrossOriginCall || /err_blocked_by_client/i.test(errMsg)) {
          throw new ApiError(
            'Network request blocked. If you are using an Ad-blocker or Privacy extension, please pause it for this site.',
            0
          );
        }

        throw new ApiError(
          `Request to ${endpoint} interrupted (${errMsg || 'connection reset'}).`,
          0
        );
      }

      throw new ApiError(err instanceof Error ? err.message : 'Network request failed', 500);
    }
  }

  public get<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T = any>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
