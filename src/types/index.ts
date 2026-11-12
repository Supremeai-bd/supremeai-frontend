export type UserRole = 'admin' | 'user';

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
  projectId?: string;
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

export interface UserProject {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  description: string;
  language: string;
  stars: number;
  lastSynced: number;
  aiReviewStatus: 'idle' | 'reviewed' | 'pending';
}

export interface PluginItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'developer' | 'ai-grounding' | 'productivity' | 'security';
  isEnabled: boolean;
  version: string;
  author: string;
}

export interface UserAccountSettings {
  name: string;
  email: string;
  role: UserRole;
  plan: 'Pro' | 'Free' | 'Enterprise';
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  emailNotifications: boolean;
  autoCodeReview: boolean;
  streamResponses: boolean;
  defaultModel: string;
}
