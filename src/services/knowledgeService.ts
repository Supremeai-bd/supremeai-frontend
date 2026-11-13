import { apiClient } from './apiClient';
import { env } from '../config/env';
import { KnowledgeDoc } from '../types';

export interface SemanticSearchResult {
  id: string;
  title: string;
  content: string;
  source: string;
  score: number | null;
}

export const knowledgeService = {
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

