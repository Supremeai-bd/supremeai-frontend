import { apiClient } from './apiClient';
import { env } from '../config/env';
import { ChatSession, ChatMessage } from '../types';

export interface RemoteConversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export const conversationService = {
  async listConversations(limit: number = 50): Promise<RemoteConversation[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const res = await apiClient.get<RemoteConversation[]>(`/api/v1/conversations/?limit=${limit}`);
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const list = await apiClient.get<any[]>(`/api/v1/conversations/${encodeURIComponent(sessionId)}/messages`);
      if (!Array.isArray(list)) return [];
      return list.map((item, idx) => ({
        id: `msg_${idx}_${Date.now()}`,
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content || '',
        timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      }));
    } catch {
      return [];
    }
  },

  async createConversation(title?: string): Promise<RemoteConversation | null> {
    if (env.isMockEnabled) {
      return null;
    }
    try {
      return await apiClient.post<RemoteConversation>('/api/v1/conversations/', { title });
    } catch {
      return null;
    }
  },

  async syncMessage(conversationId: string, role: 'user' | 'assistant', content: string): Promise<void> {
    if (env.isMockEnabled) {
      return;
    }
    try {
      await apiClient.post(`/api/v1/conversations/${encodeURIComponent(conversationId)}/messages`, {
        conversation_id: conversationId,
        role,
        content,
      });
    } catch {
      // Best effort background sync — never blocks user UX
    }
  },
};

