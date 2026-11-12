export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  roleName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  roleId: string;
  customSystemInstruction?: string;
  messages: ChatMessage[];
}

export interface RolePersona {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  systemInstruction: string;
  suggestedModel: string;
  quickPrompts: string[];
}

export interface ModelDetail {
  id: string;
  name: string;
  alias: string;
  badge: string;
  tagline: string;
  description: string;
  idealFor: string;
  latencyRating: 'Ultra-Fast' | 'Balanced' | 'Deep-Compute';
  contextTokens: string;
  reasoningCapability: 'Standard' | 'High' | 'Extreme';
  tier: 'standard' | 'advanced';
}
