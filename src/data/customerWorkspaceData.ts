import {
  ApiKeyItem,
  WebhookItem,
  KnowledgeDoc,
  TeamMember,
  BillingInvoice,
} from '../types';

export const INITIAL_API_KEYS: ApiKeyItem[] = [
  {
    id: 'key_prod_01',
    name: 'SupremeAI Studio Production CLI',
    keyPrefix: 'sk-supreme-live-4a8f',
    secretMasked: 'sk-supreme-live-4a8f••••••••••••••••9c2b',
    createdAt: '2026-03-12',
    lastUsed: '2 minutes ago',
    rateLimitRpm: 600,
    status: 'active',
    permissions: ['chat:write', 'models:read', 'knowledge:read', 'agents:invoke'],
  },
  {
    id: 'key_dev_02',
    name: 'Local Dev & GitHub Actions CI',
    keyPrefix: 'sk-supreme-test-8e12',
    secretMasked: 'sk-supreme-test-8e12••••••••••••••••7a1f',
    createdAt: '2026-04-01',
    lastUsed: '1 hour ago',
    rateLimitRpm: 120,
    status: 'active',
    permissions: ['chat:write', 'models:read'],
  },
  {
    id: 'key_revoked_03',
    name: 'Legacy Staging Key (Deprecated)',
    keyPrefix: 'sk-supreme-test-01bb',
    secretMasked: 'sk-supreme-test-01bb••••••••••••••••43d1',
    createdAt: '2026-01-15',
    lastUsed: '34 days ago',
    rateLimitRpm: 60,
    status: 'revoked',
    permissions: ['models:read'],
  },
];

export const INITIAL_WEBHOOKS: WebhookItem[] = [
  {
    id: 'wh_slack_01',
    name: 'Slack Dev Channel Alerts',
    url: 'https://hooks.slack.com/services/T00/B00/XyZaBcDeFg',
    events: ['chat.completed', 'agent.finished', 'token.threshold_warning'],
    secret: 'whsec_slack_98a72b61ef34',
    active: true,
    lastTriggered: '14 minutes ago (200 OK)',
    failureCount: 0,
  },
  {
    id: 'wh_github_02',
    name: 'GitHub Repository Auto-PR Auditor',
    url: 'https://api.supremeai.bd/webhooks/github-prs',
    events: ['code.analyzed', 'security.alert_detected'],
    secret: 'whsec_gh_81a172c3d4e5',
    active: true,
    lastTriggered: '2 hours ago (200 OK)',
    failureCount: 0,
  },
];

export const INITIAL_KNOWLEDGE_DOCS: KnowledgeDoc[] = [
  {
    id: 'doc_arch_01',
    title: 'SupremeAI Core Architecture Spec v2.4.md',
    type: 'markdown',
    sizeBytes: 142000,
    tokenCount: 28400,
    chunkCount: 32,
    status: 'indexed',
    lastIndexed: 'Today at 09:15',
    isGroundingActive: true,
    contentPreview:
      '# SupremeAI Core Architecture\nHigh-throughput agent orchestration layer interacting with Gemini 3.8 Flash and Gemini 4 Carbon through WebSocket broker and SSE transport.',
  },
  {
    id: 'doc_mcp_02',
    title: 'Model Context Protocol (MCP) Integration Guide.pdf',
    type: 'pdf',
    sizeBytes: 420000,
    tokenCount: 64200,
    chunkCount: 74,
    status: 'indexed',
    lastIndexed: 'Yesterday',
    isGroundingActive: true,
    contentPreview:
      'MCP specification compliance guidelines: JSON-RPC stdio and SSE transport protocols for local tools, file system bridges, and dynamic context caching.',
  },
  {
    id: 'doc_code_03',
    title: 'Supremeai-bd/supremeai Service Handlers.ts',
    type: 'code',
    sizeBytes: 88400,
    tokenCount: 19800,
    chunkCount: 24,
    status: 'indexed',
    lastIndexed: '3 days ago',
    isGroundingActive: false,
    contentPreview:
      'TypeScript microservice definitions for auth-token-prober, sse-stream-broker, and gemini-gateway-service with resilient circuit breakers.',
  },
  {
    id: 'doc_audit_04',
    title: 'Security Hardening & RBAC Rules.md',
    type: 'markdown',
    sizeBytes: 54000,
    tokenCount: 11200,
    chunkCount: 14,
    status: 'indexed',
    lastIndexed: '5 days ago',
    isGroundingActive: true,
    contentPreview:
      'Zero-trust policy definitions, prompt injection defense mechanisms, and customer token quota isolation rules.',
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member_01',
    name: 'Ziaul Haq',
    email: 'ziaul@supremeai.bd',
    avatar: 'Z',
    role: 'Owner',
    joinedDate: 'Jan 2026',
    twoFactorEnabled: true,
    status: 'active',
  },
  {
    id: 'member_02',
    name: 'Sarah Chen',
    email: 'sarah.chen@supremeai.bd',
    avatar: 'S',
    role: 'Developer',
    joinedDate: 'Feb 2026',
    twoFactorEnabled: true,
    status: 'active',
  },
  {
    id: 'member_03',
    name: 'Rafiqul Islam',
    email: 'rafiqul@supremeai.bd',
    avatar: 'R',
    role: 'Reviewer',
    joinedDate: 'Mar 2026',
    twoFactorEnabled: true,
    status: 'active',
  },
  {
    id: 'member_04',
    name: 'Alex Johnson',
    email: 'alex.j@partner.io',
    avatar: 'A',
    role: 'Viewer',
    joinedDate: 'Apr 2026',
    twoFactorEnabled: false,
    status: 'active',
  },
];

export const INITIAL_INVOICES: BillingInvoice[] = [
  {
    id: 'inv_2026_04',
    invoiceNumber: 'INV-2026-004',
    date: 'Apr 01, 2026',
    amountUsd: 49.0,
    status: 'paid',
    planName: 'Developer Pro (Monthly)',
  },
  {
    id: 'inv_2026_03',
    invoiceNumber: 'INV-2026-003',
    date: 'Mar 01, 2026',
    amountUsd: 49.0,
    status: 'paid',
    planName: 'Developer Pro (Monthly)',
  },
  {
    id: 'inv_2026_topup',
    invoiceNumber: 'TOP-2026-118',
    date: 'Feb 18, 2026',
    amountUsd: 50.0,
    status: 'paid',
    planName: 'Pay-As-You-Go Credits (2,500,000 Tokens)',
  },
  {
    id: 'inv_2026_02',
    invoiceNumber: 'INV-2026-002',
    date: 'Feb 01, 2026',
    amountUsd: 49.0,
    status: 'paid',
    planName: 'Developer Pro (Monthly)',
  },
];

export const MODEL_USAGE_BREAKDOWN = [
  { model: 'Gemini 3.8 Flash', tokens: 680000, percentage: 54, cost: '$0.68', color: '#3b82f6' },
  { model: 'Gemini 4 Carbon', tokens: 340000, percentage: 27, cost: '$1.70', color: '#8b5cf6' },
  { model: 'Gemini 3.1 Flash Lite', tokens: 190000, percentage: 15, cost: '$0.15', color: '#10b981' },
  { model: 'Gemini 4 Argon', tokens: 50000, percentage: 4, cost: '$0.40', color: '#f59e0b' },
];

export const INITIAL_PROMPT_TEMPLATES = [
  {
    id: 'tmpl_01',
    title: 'Strict Security Audit & OWASP Fuzz',
    category: 'security',
    description: 'Inspect endpoints, authentication middleware, and input sanitization against Top 10 vulnerabilities.',
    template: 'Perform a comprehensive security audit on the following code. Check for SQL/NoSQL injection, prototype pollution, unhandled async exceptions, and OWASP top 10 risks:\n\n```\n[PASTE CODE HERE]\n```',
    tags: ['security', 'audit', 'owasp'],
  },
  {
    id: 'tmpl_02',
    title: 'TypeScript Interface & Type Guard Invariants',
    category: 'code',
    description: 'Generate strict non-nullable TypeScript models, schema parsers, and type predicates.',
    template: 'Design clean, strict TypeScript interfaces for this data model. Include runtime assertion type guards (`isX(val: unknown): val is X`), schema validation, and proper generics:\n\n```json\n[PASTE JSON PAYLOAD HERE]\n```',
    tags: ['typescript', 'interfaces', 'types'],
  },
  {
    id: 'tmpl_03',
    title: 'Distributed System Architectural Invariant Review',
    category: 'architecture',
    description: 'Analyze distributed microservices for split-brain risks, idempotency, and backpressure.',
    template: 'Review the following microservice orchestration design. Evaluate idempotency guarantees, dead-letter fallback, retry storms, and event-driven backpressure:\n\n```\n[DESCRIBE ARCHITECTURE HERE]\n```',
    tags: ['architecture', 'microservices', 'reliability'],
  },
  {
    id: 'tmpl_04',
    title: 'Refactor to React 19 Functional Hooks',
    category: 'review',
    description: 'Modernize legacy components into modern React 19 functional code with zero re-render bloat.',
    template: 'Refactor the following React component to modern React 19 best practices. Use clean custom hooks, proper cleanup effects, memoization where needed, and eliminate redundant state:\n\n```tsx\n[PASTE COMPONENT HERE]\n```',
    tags: ['react19', 'refactor', 'hooks'],
  },
];

export const INITIAL_WEBHOOK_DELIVERIES = [
  {
    id: 'del_01',
    webhookId: 'wh_slack_01',
    eventType: 'chat.completed',
    timestamp: 'Today at 10:48:12',
    statusCode: 200,
    latencyMs: 142,
    payloadJson: '{"event":"chat.completed","sessionId":"session_108","model":"gemini-3.8-flash","tokens":840}',
    success: true,
  },
  {
    id: 'del_02',
    webhookId: 'wh_github_02',
    eventType: 'code.analyzed',
    timestamp: 'Today at 09:20:04',
    statusCode: 200,
    latencyMs: 310,
    payloadJson: '{"event":"code.analyzed","pr":94,"repo":"Supremeai-bd/supremeai-studio","findings":0}',
    success: true,
  },
  {
    id: 'del_03',
    webhookId: 'wh_slack_01',
    eventType: 'token.threshold_warning',
    timestamp: 'Yesterday at 16:30:00',
    statusCode: 504,
    latencyMs: 5000,
    payloadJson: '{"event":"token.threshold_warning","usedPercent":82,"quota":2500000}',
    success: false,
  },
];

