import { apiClient } from './apiClient';
import { env } from '../config/env';

export interface GraphNode {
  id: string;
  data: {
    label: string;
    category?: string;
    description?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PathResponse {
  path: string[];
}

const FALLBACK_GRAPH: GraphData = {
  nodes: [
    { id: 'python', data: { label: 'Python 3.11', category: 'Language', description: 'Core Python execution runtime' } },
    { id: 'fastapi', data: { label: 'FastAPI Gateway', category: 'Framework', description: 'High-performance async ASGI API layer' } },
    { id: 'redis', data: { label: 'Upstash Redis Fleet', category: 'Database', description: '2.5M multi-account state & token quota store' } },
    { id: 'supabase', data: { label: 'Supabase Postgres', category: 'Database', description: 'Relational sessions & pgvector vector memory' } },
    { id: 'qdrant', data: { label: 'Qdrant Vector DB', category: 'AI Engine', description: 'Semantic search embedding store' } },
    { id: 'supreme_engine', data: { label: 'SupremeAI Cognitive Mesh', category: 'AI Engine', description: 'Multimodal reasoning & code agent router' } },
    { id: 'mcp-tower', data: { label: 'MCP Control Tower', category: 'Governance', description: 'Streamable HTTP cluster monitoring & probe plane' } },
    { id: 'browser-agent', data: { label: 'Autonomous Browser', category: 'Agent', description: 'Playwright ghost browser agent' } },
  ],
  edges: [
    { id: 'e1', source: 'python', target: 'fastapi', label: 'POWERS' },
    { id: 'e2', source: 'fastapi', target: 'redis', label: 'CACHES_IN' },
    { id: 'e3', source: 'fastapi', target: 'supabase', label: 'PERSISTS_TO' },
    { id: 'e4', source: 'fastapi', target: 'qdrant', label: 'VECTOR_INDEX' },
    { id: 'e5', source: 'fastapi', target: 'supreme_engine', label: 'ROUTES_INFERENCE' },
    { id: 'e6', source: 'mcp-tower', target: 'fastapi', label: 'HEALTH_PROBE' },
    { id: 'e7', source: 'fastapi', target: 'browser-agent', label: 'DISPATCHES' },
  ],
};

export const graphService = {
  async getSkillGraph(): Promise<GraphData> {
    if (env.isMockEnabled) {
      return FALLBACK_GRAPH;
    }
    try {
      const res = await apiClient.get<GraphData>('/api/v1/graph/skills');
      if (res && Array.isArray(res.nodes) && res.nodes.length > 0) {
        return res;
      }
      return FALLBACK_GRAPH;
    } catch {
      return FALLBACK_GRAPH;
    }
  },

  async getLearningPath(startSkill: string, endSkill: string): Promise<string[]> {
    if (env.isMockEnabled) {
      return [startSkill, 'fastapi', endSkill];
    }
    try {
      const res = await apiClient.get<PathResponse>(
        `/api/v1/graph/path?start_skill=${encodeURIComponent(startSkill)}&end_skill=${encodeURIComponent(endSkill)}`
      );
      return res.path || [];
    } catch {
      return [startSkill, endSkill];
    }
  },
};
