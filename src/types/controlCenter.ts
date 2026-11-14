export type ControlPlaneSafetyMode = 'read-only' | 'dry-run-hitl' | 'operator-override';

export type DataProvenance = 'live-mcp' | 'live-gateway' | 'live-github' | 'local-snapshot';

export interface SafetyGateContext {
  dryRun?: boolean;
  approvalToken?: string;
  idempotencyKey?: string;
  actor?: string;
}

export interface TruthMatrixDimension {
  dimension:
    | 'providerHealth'
    | 'serviceHealth'
    | 'releaseIntegrity'
    | 'dependencyHealth'
    | 'schemaParity'
    | 'userJourneyHealth';
  label: string;
  status: 'pass' | 'warn' | 'fail';
  latencyMs: number;
  summary: string;
  evidence: string;
}

export interface DeepDiagnoseReport {
  id: string;
  service: string;
  intent: string;
  releaseGate: 'GO' | 'NO_GO' | 'DEGRADED';
  evidenceHash: string;
  checkedAt: string;
  provenance: DataProvenance;
  truthMatrix: TruthMatrixDimension[];
  summary: string;
}

export interface McpToolDescriptor {
  name: string;
  description: string;
  category:
    | 'system'
    | 'memory'
    | 'bridge'
    | 'github'
    | 'qdrant'
    | 'devtools'
    | 'compute'
    | 'notifications';
  readOnlyHint: boolean;
  destructiveHint: boolean;
  inputSchema?: Record<string, any>;
}

export interface McpToolExecutionResult {
  toolName: string;
  provenance: DataProvenance;
  latencyMs: number;
  executedAt: string;
  dryRun: boolean;
  output: any;
  error?: string;
}

export interface ReleaseVerificationItem {
  id: string;
  serviceName: string;
  runtime: string;
  githubBranch: string;
  githubSha: string;
  deployedSha: string;
  shaMatch: boolean;
  renderStatus: 'live' | 'deploying' | 'degraded' | 'suspended';
  buildMinutesUsed: number;
  buildMinutesLimit: number;
  healthCheckPath: string;
  lastDeployedAt: string;
  provenance: DataProvenance;
}

export interface HarnessPipelineRun {
  id: string;
  pipelineName: string;
  environment: 'Production' | 'Staging' | 'Canary';
  status: 'succeeded' | 'running' | 'failed' | 'waiting-approval';
  commitSha: string;
  triggeredBy: string;
  durationSec: number;
  startedAt: string;
}

export interface HitlTicket {
  id: string;
  actionType: 'rollback' | 'restart' | 'memory_wipe' | 'policy_change' | 'bridge_merge' | 'secret_rotate';
  service: string;
  requestedBy: string;
  reason: string;
  blastRadius: string;
  riskLevel: 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected';
  dryRunDiff: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface RemediationStep {
  id: string;
  wave: number;
  title: string;
  tool: string;
  dependsOn: string[];
  approvalRequired: boolean;
  status: 'pending' | 'ready' | 'completed' | 'blocked';
}

export interface RemediationDagPlan {
  planId: string;
  service: string;
  failureLayer: string;
  goal: string;
  dagValid: boolean;
  createdAt: string;
  steps: RemediationStep[];
}

export interface ExecutionPolicyRule {
  id: string;
  name: string;
  scope: 'mcp-allowlist' | 'rate-limit' | 'sandbox' | 'hitl-gate';
  target: string;
  mode: 'enforce' | 'audit-only' | 'disabled';
  description: string;
  updatedAt: string;
}

export interface ActiveTakeoverSession {
  id: string;
  customerEmail: string;
  agentId: string;
  topic: string;
  status: 'autonomous' | 'escalated' | 'human-takeover';
  startedAt: string;
  lastMessagePreview: string;
}

export interface AutoHealerIncident {
  id: string;
  fingerprint: string;
  component: string;
  actionTaken: string;
  circuitState: 'closed' | 'half-open' | 'open';
  recovered: boolean;
  occurredAt: string;
}

export interface MemoryGovernanceEntry {
  id: string;
  tier: 'episodic' | 'semantic' | 'procedural';
  status: 'candidate' | 'trusted' | 'quarantined';
  fact: string;
  verifiedBy?: string;
  source: string;
  createdAt: string;
}

export interface QdrantCollectionStats {
  name: string;
  vectorsCount: number;
  dimensions: number;
  distance: 'Cosine' | 'Dot' | 'Euclid';
  status: 'green' | 'yellow';
}

export interface AstGraphMatch {
  id: string;
  symbol: string;
  modulePath: string;
  kind: 'router' | 'service' | 'model' | 'invariant';
  connections: number;
  summary: string;
}

export interface ExternalAgentRecord {
  id: string;
  agentKey: string;
  displayName: string;
  endpointPath: string;
  status: 'online' | 'idle' | 'offline';
  heartbeatAgo: string;
  activeLeases: number;
  trustScope: string;
  capabilities: string[];
}

export interface BridgeWorkOrder {
  issueNumber: number;
  title: string;
  labels: string[];
  status: 'unclaimed' | 'claimed' | 'submitted' | 'approved';
  claimedBy?: string;
  leaseExpiresInMin?: number;
  updatedAt: string;
}

export interface KaggleKernelRun {
  id: string;
  title: string;
  accelerator: 'T4x2' | 'P100' | 'TPU-v3-8';
  status: 'running' | 'completed' | 'queued' | 'failed';
  durationSec: number;
  submittedBy: string;
  submittedAt: string;
}

export interface DevToolsAuditReport {
  id: string;
  url: string;
  lcpMs: number;
  cls: number;
  fcpMs: number;
  consoleErrors: number;
  networkFailures: number;
  verdict: 'healthy' | 'needs-attention' | 'failing';
  auditedAt: string;
  provenance: DataProvenance;
}

export interface CrawlerJob {
  id: string;
  targetUrl: string;
  engine: 'firecrawl' | 'cdp-playwright' | 'microvm-sandbox';
  pagesCrawled: number;
  status: 'completed' | 'running' | 'blocked';
  latencyMs: number;
  ranAt: string;
}

export interface TelegramDispatchRecord {
  id: string;
  commandOrMessage: string;
  direction: 'inbound-command' | 'outbound-alert';
  chatTarget: string;
  delivered: boolean;
  timestamp: string;
}

export interface CronTaskItem {
  id: string;
  name: string;
  schedule: string;
  category: 'keepwarm' | 'parity' | 'memory-gc' | 'dlq-sweep';
  lastStatus: 'ok' | 'warning';
  lastRunAt: string;
  nextRunIn: string;
}

export interface FinOpsMeshService {
  id: string;
  name: string;
  provider: 'Cloudflare' | 'Render' | 'Qdrant' | 'Stripe' | 'Vercel' | 'Infisical';
  status: 'nominal' | 'degraded' | 'unconfigured';
  monthlyBudgetUsd: number;
  currentSpendUsd: number;
  detail: string;
}
