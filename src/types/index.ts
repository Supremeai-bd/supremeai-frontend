export type UserRole = 'admin' | 'user';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  roleName?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  roleId: string;
  customSystemInstruction?: string;
  messages: ChatMessage[];
  projectId?: string;
}

export interface RolePersona {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  systemInstruction: string;
  suggestedModel: string;
  quickPrompts: string[];
}

export interface ModelDetail {
  id: string;
  name: string;
  alias: string;
  badge: string;
  tagline: string;
  description: string;
  idealFor: string;
  latencyRating: 'Ultra-Fast' | 'Balanced' | 'Deep-Compute';
  contextTokens: string;
  reasoningCapability: 'Standard' | 'High' | 'Extreme';
  tier: 'standard' | 'advanced';
}

export interface UserProject {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  description: string;
  language: string;
  stars: number;
  lastSynced: number;
  aiReviewStatus: 'idle' | 'reviewed' | 'pending';
}

export interface PluginItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'developer' | 'ai-grounding' | 'productivity' | 'security';
  isEnabled: boolean;
  version: string;
  author: string;
}

export interface UserAccountSettings {
  name: string;
  email: string;
  role: UserRole;
  plan: 'Pro' | 'Free' | 'Enterprise';
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  emailNotifications: boolean;
  autoCodeReview: boolean;
  streamResponses: boolean;
  defaultModel: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  tier: 'Free' | 'Pro' | 'Enterprise';
  status: 'active' | 'past_due' | 'suspended';
  mrr: number;
  tokensUsed: number;
  tokenLimit: number;
  connectedRepos: number;
  joinedDate: string;
  lastActive: string;
  githubHandle?: string;
  region: string;
}

export interface McpServiceLog {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: string;
  stackTrace?: string;
}

export interface McpTowerService {
  id: string;
  name: string;
  displayName: string;
  category: 'core' | 'ai' | 'integration' | 'telemetry';
  port: number;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'rebooting';
  uptime: string;
  latencyMs: number;
  cpuPercent: number;
  memoryMb: number;
  lastChecked: string;
  version: string;
  endpoint: string;
  errorCount: number;
  logs: McpServiceLog[];
}

// --- Customer Workspace Expansion Types ---

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  secretMasked: string;
  createdAt: string;
  lastUsed: string;
  rateLimitRpm: number;
  status: 'active' | 'revoked';
  permissions: ('chat:write' | 'models:read' | 'knowledge:read' | 'agents:invoke')[];
}

export interface WebhookItem {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  lastTriggered: string;
  failureCount: number;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: 'pdf' | 'markdown' | 'code' | 'url';
  sizeBytes: number;
  tokenCount: number;
  chunkCount: number;
  status: 'indexed' | 'indexing' | 'error';
  lastIndexed: string;
  isGroundingActive: boolean;
  contentPreview: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Owner' | 'Developer' | 'Reviewer' | 'Viewer';
  joinedDate: string;
  twoFactorEnabled: boolean;
  status: 'active' | 'invited';
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amountUsd: number;
  status: 'paid' | 'pending' | 'failed';
  planName: string;
  pdfDownloadUrl?: string;
}

// --- Admin Studio Expansion Types ---

export interface SwarmWorker {
  id: string;
  name: string;
  type: 'solver' | 'verifier' | 'ecosystem-scout' | 'rules-breaker';
  status: 'active' | 'idle' | 'paused' | 'error';
  currentTask: string;
  currentIssueOrPr: string;
  processedCount: number;
  successRate: number;
  cpuPercent: number;
  memoryMb: number;
  uptime: string;
  logs: string[];
}

export interface TaskQueueJob {
  id: string;
  queueName: 'ai-reasoning' | 'github-sync' | 'code-audit' | 'vector-embedding';
  taskType: string;
  payloadSummary: string;
  status: 'active' | 'waiting' | 'completed' | 'failed' | 'dlq';
  attempts: number;
  maxAttempts: number;
  latencyMs: number;
  createdAt: string;
  errorDetails?: string;
}

export interface SchemaParityTable {
  id: string;
  tableName: string;
  localColumns: number;
  stagingColumns: number;
  prodColumns: number;
  driftDetected: boolean;
  driftSummary?: string;
  rlsEnabled: boolean;
  lastMigrated: string;
}

export interface LlmGatewayRoute {
  id: string;
  modelId: string;
  displayName: string;
  primaryProvider: string;
  fallbackProvider: string;
  currentLatencyMs: number;
  errorRatePercent: number;
  requestsPerMin: number;
  costPer1MIn: number;
  costPer1MOut: number;
  customerPricePer1M: number;
  autoFailoverActive: boolean;
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'prompt_injection' | 'rate_limit_exceeded' | 'suspicious_ip' | 'token_spike';
  sourceIp: string;
  customerEmail: string;
  description: string;
  blocked: boolean;
}

export interface SystemAuditRecord {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}



