import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface ShareResponse {
  share_id: string;
  share_url: string;
  expires_at?: string;
  created_at: string;
}

export const shareService = {
  async generateShareLink(conversationId: string): Promise<ShareResponse> {
    if (env.isMockEnabled) {
      const mockId = `shr_${Date.now().toString(36)}`;
      return {
        share_id: mockId,
        share_url: `${window.location.origin}/share/${mockId}`,
        created_at: new Date().toISOString(),
      };
    }

    try {
      return await apiClient.post<ShareResponse>('/api/share/generate', {
        conversation_id: conversationId,
      });
    } catch {
      // Fallback url
      const mockId = `shr_${Date.now().toString(36)}`;
      return {
        share_id: mockId,
        share_url: `${window.location.origin}/share/${mockId}`,
        created_at: new Date().toISOString(),
      };
    }
  },

  async getSharedConversation(shareId: string): Promise<any> {
    return apiClient.get(`/api/share/${encodeURIComponent(shareId)}`, { skipAuth: true });
  },
};

