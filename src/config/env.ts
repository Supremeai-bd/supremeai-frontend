/**
 * SupremeAI Environment Configuration & Standardizer
 * Validates and provides typed access to environment variables,
 * with seamless Mock-to-Real API adapter switching.
 */

export interface AppEnvConfig {
  isMockEnabled: boolean;
  apiBaseUrl: string;
  supabaseUrl: string;
  gatewayUrl: string;
  mcpTowerUrl: string;
  version: string;
}

const getEnvBool = (key: string, defaultValue: boolean): boolean => {
  const val = import.meta.env[key];
  if (val === undefined || val === null || val === '') return defaultValue;
  return val === 'true' || val === '1';
};

const getEnvString = (key: string, defaultValue: string): string => {
  return import.meta.env[key] || defaultValue;
};

// Check for runtime local override if developer switches mock mode in UI (ONLY in dev mode!)
const getRuntimeMockOverride = (): boolean | null => {
  if (import.meta.env.PROD) return false;
  try {
    const saved = localStorage.getItem('supremeai_mock_override');
    if (saved !== null) return saved === 'true';
  } catch {}
  return null;
};

export const env: AppEnvConfig = {
  isMockEnabled: import.meta.env.PROD ? false : (getRuntimeMockOverride() ?? getEnvBool('VITE_USE_MOCK', false)),
  apiBaseUrl: getEnvString('VITE_API_BASE_URL', ''),
  supabaseUrl: getEnvString('VITE_SUPABASE_URL', ''),
  gatewayUrl: getEnvString('VITE_GATEWAY_URL', '/v1'),
  mcpTowerUrl: getEnvString('VITE_MCP_TOWER_URL', '/api/mcp-tower'),
  version: 'v2.4.0-prod',
};

/**
 * Toggle between local Mock mode and live Backend API proxy mode at runtime.
 */
export const setRuntimeMockMode = (enabled: boolean): void => {
  localStorage.setItem('supremeai_mock_override', String(enabled));
  env.isMockEnabled = enabled;
  window.dispatchEvent(new CustomEvent('supremeai-mock-mode-changed', { detail: { enabled } }));
};
