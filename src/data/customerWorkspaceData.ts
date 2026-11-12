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
