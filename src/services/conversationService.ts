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
      const res = await apiClient.get<any>(`/api/v1/conversations?limit=${limit}`);
      const list = Array.isArray(res) ? res : (res?.conversations || []);
      return list.map((c: any) => ({
        id: c.id || c.conversation_id,
        title: c.title || 'Untitled Conversation',
        created_at: c.created_at || c.createdAt || new Date().toISOString(),
        updated_at: c.updated_at || c.updatedAt || new Date().toISOString(),
        message_count: c.message_count || c.messages?.length || 0,
      }));
    } catch {
      return [];
    }
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const res = await apiClient.get<any>(`/api/v1/conversations/${encodeURIComponent(sessionId)}/messages`);
      const list = Array.isArray(res) ? res : (res?.messages || []);
      return list.map((item: any, idx: number) => ({
        id: item.id || `msg_${idx}_${Date.now()}`,
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content || '',
        timestamp: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
      }));
    } catch {
      return [];
    }
  },

  async createConversation(
    title?: string,
    conversationId?: string,
    model?: string
  ): Promise<RemoteConversation | null> {
    if (env.isMockEnabled) {
      return null;
    }
    try {
      const res = await apiClient.post<any>('/api/v1/conversations', {
        id: conversationId,
        conversation_id: conversationId,
        title: title || 'New Conversation',
        metadata: model ? { model } : undefined,
      });
      const conv = res?.conversation || res;
      if (!conv || !conv.id) return null;
      return {
        id: conv.id,
        title: conv.title || title || 'New Conversation',
        created_at: conv.created_at || new Date().toISOString(),
        updated_at: conv.updated_at || new Date().toISOString(),
      };
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
    } catch (err) {
      console.warn(`[ConversationSync] Failed to sync ${role} message to ${conversationId}:`, err);
    }
  },

  async renameConversation(conversationId: string, title: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.patch(`/api/v1/conversations/${encodeURIComponent(conversationId)}`, {
        title,
      });
      return true;
    } catch {
      return false;
    }
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.delete(`/api/v1/conversations/${encodeURIComponent(conversationId)}`);
      return true;
    } catch {
      return false;
    }
  },
};

