import { ModelDetail } from '../types';

export const GEMINI_MODELS: ModelDetail[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    alias: 'General Intelligence',
    badge: 'Recommended',
    tagline: 'General everyday tasks & responsive reasoning',
    description:
      'High-throughput multimodal foundation model designed for versatile reasoning, summarization, conversational coding, and rapid problem solving.',
    idealFor: 'General tasks, standard Q&A, and full-stack development',
    latencyRating: 'Balanced',
    contextTokens: '1,000,000+',
    reasoningCapability: 'High',
    tier: 'standard',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    alias: 'Low Latency',
    badge: 'Fast',
    tagline: 'Tasks that should happen fast with minimal overhead',
    description:
      'Ultra-compact, featherweight model engineered for instantaneous code formatting, regex generation, shell commands, and high-frequency tool calls.',
    idealFor: 'Rapid tasks, quick lookups, and instantaneous edits',
    latencyRating: 'Ultra-Fast',
    contextTokens: '1,000,000+',
    reasoningCapability: 'Standard',
    tier: 'standard',
  },
  {
    id: 'gemini-4-carbon',
    name: 'Gemini 4 Carbon',
    alias: 'Deep Reasoning',
    badge: 'Deep Compute',
    tagline: 'Deep reasoning, mathematical proofs & root-cause debugging',
    description:
      'State-of-the-art reasoning engine built for complex system decomposition, architectural invariant validation, distributed state analysis, and hard algorithms.',
    idealFor: 'Deep reasoning tasks, root-cause architecture analysis, and formal logic',
    latencyRating: 'Deep-Compute',
    contextTokens: '2,000,000+',
    reasoningCapability: 'Extreme',
    tier: 'advanced',
  },
  {
    id: 'gemini-4-argon',
    name: 'Gemini 4 Argon',
    alias: 'Complex Interactive',
    badge: 'Heavy Logic',
    tagline: 'Complex interactive coding & multi-step orchestration',
    description:
      'Advanced agentic model specialized for heavy full-stack codebases, end-to-end refactoring, multi-turn design workflows, and interactive debugging.',
    idealFor: 'Particularly complex interactive tasks, agentic workflows, and large codebases',
    latencyRating: 'Deep-Compute',
    contextTokens: '2,000,000+',
    reasoningCapability: 'Extreme',
    tier: 'advanced',
  },
];
