import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface ResearchSection {
  title: string;
  content: string;
  sources?: string[];
}

export interface ResearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface ResearchReport {
  title: string;
  summary: string;
  sections: ResearchSection[];
  sources: ResearchSource[];
}

export interface DeepResearchResult {
  id: string;
  report: ResearchReport;
  steps_completed: number;
  total_sources: number;
}

export interface ResearchHistoryItem {
  id: string;
  query: string;
  status: string;
  steps_completed: number;
  total_sources: number;
  created_at: string;
  report?: ResearchReport;
}

export const researchService = {
  async execute(query: string, maxSteps: number = 8): Promise<DeepResearchResult> {
    if (env.isMockEnabled) {
      return {
        id: `res_${Date.now()}`,
        steps_completed: maxSteps,
        total_sources: 6,
        report: {
          title: `Deep Research Analysis: ${query}`,
          summary: `Synthesized multi-source empirical investigation into ${query}. Analysis includes system benchmarks, verified documentation, and architectural considerations.`,
          sections: [
            {
              title: '1. Executive Summary & Problem Scope',
              content: `A thorough investigation of "${query}" indicates high relevance to production distributed systems and cloud optimization strategies. Current industry standards emphasize zero-cost tiers, fail-safe redundancy, and verified cryptographic attestation.`,
              sources: ['https://supremeai.bd/docs', 'https://docs.render.com'],
            },
            {
              title: '2. Technical Architecture & Invariants',
              content: `Key findings demonstrate that multi-tenant isolation, combined with Redis command pooling and pgvector memory projections, yields 99.9% uptime while eliminating cold-start latency regressions.`,
              sources: ['https://upstash.com/docs', 'https://supabase.com/docs'],
            },
            {
              title: '3. Strategic Recommendations',
              content: `Implement automated quota governors, enforce strict single-service account boundaries on PaaS providers, and maintain atomic database rollback handlers on all mission-critical data stores.`,
              sources: ['https://github.com/Supremeai-bd/supremeai'],
            },
          ],
          sources: [
            { title: 'SupremeAI Architectural SSOT', url: 'https://supremeai.bd/docs', snippet: 'Multi-cloud free tier safeguard specification' },
            { title: 'Render Multi-Service Blueprint', url: 'https://docs.render.com', snippet: 'Account limits and runtime isolation' },
            { title: 'Upstash Global Distributed Quota', url: 'https://upstash.com/docs', snippet: 'Command budgeting and latency metrics' },
          ],
        },
      };
    }

    try {
      return await apiClient.post<DeepResearchResult>('/api/research/deep', {
        query,
        max_steps: maxSteps,
      });
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Deep research execution failed.');
    }
  },

  async getHistory(): Promise<ResearchHistoryItem[]> {
    if (env.isMockEnabled) {
      return [];
    }
    try {
      const res = await apiClient.get<ResearchHistoryItem[]>('/api/research/history');
      return Array.isArray(res) ? res : [];
    } catch {
      return [];
    }
  },

  async getDetail(researchId: string): Promise<DeepResearchResult | null> {
    if (env.isMockEnabled) {
      return null;
    }
    try {
      return await apiClient.get<DeepResearchResult>(`/api/research/${encodeURIComponent(researchId)}`);
    } catch {
      return null;
    }
  },
};
