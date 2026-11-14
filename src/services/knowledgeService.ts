import { apiClient } from './apiClient';
import { env } from '../config/env';
import { KnowledgeDoc } from '../types';
import { INITIAL_KNOWLEDGE_DOCS } from '../data/customerWorkspaceData';

export interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  score: number | null;
}

export const knowledgeService = {
  async fetchUserDocs(): Promise<KnowledgeDoc[]> {
    if (env.isMockEnabled) {
      return INITIAL_KNOWLEDGE_DOCS;
    }
    try {
      const res = await apiClient.get<{ documents: KnowledgeDoc[] }>('/api/user/knowledge');
      return res.documents || INITIAL_KNOWLEDGE_DOCS;
    } catch {
      return INITIAL_KNOWLEDGE_DOCS;
    }
  },

  async createDoc(doc: Omit<KnowledgeDoc, 'id' | 'lastIndexed'>): Promise<KnowledgeDoc> {
    if (env.isMockEnabled) {
      return {
        ...doc,
        id: `doc_${Date.now()}`,
        lastIndexed: 'Just now',
      };
    }
    try {
      const res = await apiClient.post<{ success: boolean; document: KnowledgeDoc }>(
        '/api/user/knowledge',
        doc
      );
      return res.document;
    } catch {
      return {
        ...doc,
        id: `doc_${Date.now()}`,
        lastIndexed: 'Just now',
      };
    }
  },

  async toggleGrounding(id: string, isGroundingActive: boolean): Promise<KnowledgeDoc | null> {
    if (env.isMockEnabled) {
      const match = INITIAL_KNOWLEDGE_DOCS.find((d) => d.id === id);
      if (match) {
        match.isGroundingActive = isGroundingActive;
        return match;
      }
      return null;
    }
    try {
      const res = await apiClient.request<{ success: boolean; document: KnowledgeDoc }>(
        `/api/user/knowledge/${encodeURIComponent(id)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isGroundingActive }),
        }
      );
      return res.document;
    } catch {
      return null;
    }
  },

  async deleteDoc(id: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.delete(`/api/user/knowledge/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },

  async search(question: string, limit: number = 5): Promise<SemanticSearchResult[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const res = await apiClient.post<{ results: SemanticSearchResult[] }>(
        `/api/v1/knowledge/search?limit=${limit}`,
        { question }
      );
      return res.results || [];
    } catch {
      return [];
    }
  },

  async seedDocument(doc: { title: string; content: string; category?: string }): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.post('/api/v1/knowledge/seed', [doc]);
      return true;
    } catch {
      return false;
    }
  },

  async ask(question: string): Promise<{ answer: string; citations: string[] }> {
    if (env.isMockEnabled) {
      return {
        answer: 'Semantic grounded answer from SupremeAI Scribe.',
        citations: ['knowledge_manifest.json'],
      };
    }
    try {
      return await apiClient.post('/api/v1/knowledge/ask-scribe', { question });
    } catch (err: unknown) {
      return {
        answer: err instanceof Error ? err.message : 'Knowledge retrieval failed',
        citations: [],
      };
    }
  },
};
