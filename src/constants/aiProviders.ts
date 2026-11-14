import { AiProviderId } from '../types';

export interface AiProviderDefinition {
  id: AiProviderId;
  label: string;
  shortLabel: string;
  defaultPath: string;
  keyHint: string;
  supportsAutoGenerate?: boolean;
}

export const AI_PROVIDER_DEFINITIONS: AiProviderDefinition[] = [
  {
    id: 'supremeai',
    label: 'SupremeAI Gateway Mesh',
    shortLabel: 'SupremeAI',
    defaultPath: '/core/SUPREMEAI_GATEWAY_SIGNING_KEY',
    keyHint: 'sk-supreme-live-...',
    supportsAutoGenerate: true,
  },
  {
    id: 'google_ai_studio',
    label: 'Google AI Studio (Gemini)',
    shortLabel: 'Google AI Studio',
    defaultPath: '/ai-providers/GEMINI_API_KEY',
    keyHint: 'AIzaSy...',
  },
  {
    id: 'vertex_ai',
    label: 'Google Cloud Vertex AI',
    shortLabel: 'Vertex AI',
    defaultPath: '/ai-providers/VERTEX_ADC_CREDENTIALS',
    keyHint: 'projects/<id>/locations/...',
  },
  {
    id: 'openai',
    label: 'OpenAI Platform (GPT-4o / o3)',
    shortLabel: 'OpenAI',
    defaultPath: '/ai-providers/OPENAI_API_KEY',
    keyHint: 'sk-proj-...',
  },
  {
    id: 'anthropic',
    label: 'Anthropic Claude',
    shortLabel: 'Anthropic',
    defaultPath: '/ai-providers/ANTHROPIC_API_KEY',
    keyHint: 'sk-ant-api03-...',
  },
  {
    id: 'groq',
    label: 'Groq LPU Inference',
    shortLabel: 'Groq LPU',
    defaultPath: '/ai-providers/GROQ_API_KEY',
    keyHint: 'gsk_...',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek R1',
    shortLabel: 'DeepSeek',
    defaultPath: '/ai-providers/DEEPSEEK_API_KEY',
    keyHint: 'sk-ds-...',
  },
  {
    id: 'mistral',
    label: 'Mistral Codestral',
    shortLabel: 'Mistral',
    defaultPath: '/ai-providers/MISTRAL_API_KEY',
    keyHint: 'msk_...',
  },
];

export const AI_PROVIDER_MAP: Record<string, AiProviderDefinition> = AI_PROVIDER_DEFINITIONS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, AiProviderDefinition>
);

export function getProviderShortLabel(providerId?: string): string {
  if (!providerId) return 'SupremeAI';
  return AI_PROVIDER_MAP[providerId]?.shortLabel || providerId;
}

export function getProviderLabel(providerId?: string): string {
  if (!providerId) return 'SupremeAI Gateway Mesh';
  return AI_PROVIDER_MAP[providerId]?.label || providerId;
}
