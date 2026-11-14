import { ModelDetail } from '../types';

export const SUPREMEAI_MODELS: ModelDetail[] = [
  {
    id: 'supreme-core',
    name: 'SupremeAI Core',
    alias: 'Flagship Intelligence',
    badge: 'Recommended',
    tagline: 'High-throughput multimodal foundation intelligence',
    description:
      'Versatile reasoning, full-stack conversational coding, structured analysis, and instant problem solving.',
    idealFor: 'Everyday engineering tasks, full-stack development, and architecture Q&A',
    latencyRating: 'Balanced',
    contextTokens: '1,000,000+',
    reasoningCapability: 'High',
    tier: 'standard',
  },
  {
    id: 'supreme-reason',
    name: 'SupremeAI Reason',
    alias: 'Deep Analytical Engine',
    badge: 'Deep Compute',
    tagline: 'Deep reasoning, mathematical proofs & root-cause debugging',
    description:
      'Engineered for hard algorithm synthesis, distributed system invariants, formal logic, and architectural failure mode auditing.',
    idealFor: 'Complex algorithmic logic, security audits, and mission-critical reasoning',
    latencyRating: 'Deep-Compute',
    contextTokens: '2,000,000+',
    reasoningCapability: 'Extreme',
    tier: 'advanced',
  },
  {
    id: 'supreme-spark',
    name: 'SupremeAI Spark',
    alias: 'Ultra-Low Latency',
    badge: 'Fast',
    tagline: 'Instant snippets, regex transformations & shell synthesis',
    description:
      'Featherweight, rapid turnaround model designed for high-frequency tool calls, instantaneous script edits, and sub-second completions.',
    idealFor: 'Rapid tasks, syntax conversions, regex, and instantaneous lookups',
    latencyRating: 'Ultra-Fast',
    contextTokens: '1,000,000+',
    reasoningCapability: 'Standard',
    tier: 'standard',
  },
  {
    id: 'supreme-deep',
    name: 'SupremeAI Deep',
    alias: 'Agentic Orchestration',
    badge: 'Autonomous',
    tagline: 'Complex interactive coding & multi-agent swarms',
    description:
      'Specialized for large multi-file refactoring, autonomous agent workflows, terminal loop execution, and deep repository inspection.',
    idealFor: 'Multi-step autonomous tasks, large refactors, and complex agentic jobs',
    latencyRating: 'Deep-Compute',
    contextTokens: '2,000,000+',
    reasoningCapability: 'Extreme',
    tier: 'advanced',
  },
  {
    id: 'supremeai-web',
    name: 'SupremeAI Web',
    alias: 'Stealth Webpool',
    badge: 'Zero-Cost Web',
    tagline: 'Stealth web session relay via cookie pool',
    description:
      'Direct $0 cookie-authenticated web session relay for uninterrupted high-volume web queries and search synthesis.',
    idealFor: 'Web scraping, live search synthesis, zero-token cost streaming',
    latencyRating: 'Balanced',
    contextTokens: '1,000,000+',
    reasoningCapability: 'High',
    tier: 'standard',
  },
  {
    id: 'supremeai-api',
    name: 'SupremeAI API',
    alias: 'Multi-Cloud API Squad',
    badge: 'Enterprise API',
    tagline: 'High-availability multi-key provider pool',
    description:
      'Direct load-balanced multi-provider API squad across Gemini, Groq, OpenRouter, Mistral, and Hugging Face.',
    idealFor: 'Mission-critical enterprise completions, production APIs, guaranteed failover',
    latencyRating: 'Ultra-Fast',
    contextTokens: '2,000,000+',
    reasoningCapability: 'Extreme',
    tier: 'standard',
  },
];

