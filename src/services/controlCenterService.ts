import type {
  ControlPlaneSafetyMode,
  SafetyGateContext,
  DeepDiagnoseReport,
  McpToolDescriptor,
  McpToolExecutionResult,
  ReleaseVerificationItem,
  HarnessPipelineRun,
  HitlTicket,
  RemediationDagPlan,
  ExecutionPolicyRule,
  ActiveTakeoverSession,
  AutoHealerIncident,
  MemoryGovernanceEntry,
  QdrantCollectionStats,
  AstGraphMatch,
  ExternalAgentRecord,
  BridgeWorkOrder,
  KaggleKernelRun,
  DevToolsAuditReport,
  CrawlerJob,
  TelegramDispatchRecord,
  CronTaskItem,
  FinOpsMeshService,
  DataProvenance,
} from '../types/controlCenter';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('supremeai_access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || data?.detail || `HTTP ${res.status}`);
  }
  return data as T;
}

export const controlCenterService = {
  async fetchOverview() {
    return requestJson<{
      safetyMode: ControlPlaneSafetyMode;
      mcpEndpoint: string;
      backendGateway: string;
      latestGithubCommit: { sha: string; message: string; author: string; date: string; provenance: DataProvenance };
      latestDiagnose: DeepDiagnoseReport;
      pendingHitlCount: number;
      activeTakeoversCount: number;
      unclaimedBridgeCount: number;
    }>('/api/admin/control-plane/overview');
  },

  async setSafetyMode(safetyMode: ControlPlaneSafetyMode, actor?: string) {
    return requestJson<{ success: boolean; safetyMode: ControlPlaneSafetyMode }>(
      '/api/admin/control-plane/safety-mode',
      { method: 'POST', body: JSON.stringify({ safetyMode, actor }) }
    );
  },

  async runDeepDiagnose(service: string = 'api', intent: string = 'is_healthy', actor?: string) {
    return requestJson<{ report: DeepDiagnoseReport }>('/api/admin/control-plane/deep-diagnose', {
      method: 'POST',
      body: JSON.stringify({ service, intent, actor }),
    });
  },

  async fetchMcpTools(refresh: boolean = false) {
    return requestJson<{
      tools: McpToolDescriptor[];
      provenance: DataProvenance;
      endpoint: string;
      warning?: string;
    }>(`/api/admin/control-plane/mcp-tools${refresh ? '?refresh=1' : ''}`);
  },

  async executeMcpTool(
    toolName: string,
    args: Record<string, any>,
    gate?: SafetyGateContext
  ) {
    return requestJson<{ result: McpToolExecutionResult }>('/api/admin/control-plane/mcp-call', {
      method: 'POST',
      body: JSON.stringify({ toolName, arguments: args, ...gate }),
    });
  },

  async fetchReleaseGate() {
    return requestJson<{
      githubCommit: { sha: string; message: string; author: string; date: string; provenance: DataProvenance };
      releases: ReleaseVerificationItem[];
      pipelines: HarnessPipelineRun[];
      releaseGateVerdict: 'GO' | 'NO_GO' | 'DEGRADED';
    }>('/api/admin/control-plane/release-gate');
  },

  async executeReleaseAction(
    action: 'restart' | 'redeploy' | 'rollback',
    service: string,
    rollbackTargetCommit?: string,
    gate?: SafetyGateContext
  ) {
    return requestJson<{ success: boolean; dryRun: boolean; message: string; upstreamNote?: string }>(
      '/api/admin/control-plane/release-execute',
      {
        method: 'POST',
        body: JSON.stringify({ action, service, rollbackTargetCommit, ...gate }),
      }
    );
  },

  async fetchHitlAndPolicies() {
    return requestJson<{
      tickets: HitlTicket[];
      plans: RemediationDagPlan[];
      policies: ExecutionPolicyRule[];
      takeoverSessions: ActiveTakeoverSession[];
      healerIncidents: AutoHealerIncident[];
    }>('/api/admin/control-plane/hitl');
  },

  async resolveHitlTicket(id: string, decision: 'approved' | 'rejected', gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; tickets?: HitlTicket[] }>(
      `/api/admin/control-plane/hitl/${encodeURIComponent(id)}/resolve`,
      { method: 'POST', body: JSON.stringify({ decision, ...gate }) }
    );
  },

  async generateRemediationPlan(service: string, failureLayer: string, actor?: string) {
    return requestJson<{ plan: RemediationDagPlan; plans: RemediationDagPlan[] }>(
      '/api/admin/control-plane/remediation-plan',
      { method: 'POST', body: JSON.stringify({ service, failureLayer, actor }) }
    );
  },

  async togglePolicyRule(id: string, gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; policies?: ExecutionPolicyRule[] }>(
      `/api/admin/control-plane/policies/${encodeURIComponent(id)}/toggle`,
      { method: 'POST', body: JSON.stringify({ ...gate }) }
    );
  },

  async toggleTakeoverSession(id: string, actor?: string) {
    return requestJson<{ success: boolean; takeoverSessions: ActiveTakeoverSession[] }>(
      `/api/admin/control-plane/takeover/${encodeURIComponent(id)}`,
      { method: 'POST', body: JSON.stringify({ actor }) }
    );
  },

  async fetchMemoryAndGraph() {
    return requestJson<{
      provenance: DataProvenance;
      entries: MemoryGovernanceEntry[];
      collections: QdrantCollectionStats[];
      astMatches: AstGraphMatch[];
    }>('/api/admin/control-plane/memory');
  },

  async promoteMemoryEntry(
    id: string,
    status: 'candidate' | 'trusted' | 'quarantined',
    gate?: SafetyGateContext
  ) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; entries?: MemoryGovernanceEntry[] }>(
      '/api/admin/control-plane/memory/promote',
      { method: 'POST', body: JSON.stringify({ id, status, ...gate }) }
    );
  },

  async learnMemoryFact(tier: 'episodic' | 'semantic' | 'procedural', fact: string, verifiedBy?: string) {
    return requestJson<{ success: boolean; entries: MemoryGovernanceEntry[] }>(
      '/api/admin/control-plane/memory/learn',
      { method: 'POST', body: JSON.stringify({ tier, fact, verifiedBy }) }
    );
  },

  async wipeQuarantinedMemory(gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; removed?: number; message?: string; entries?: MemoryGovernanceEntry[] }>(
      '/api/admin/control-plane/memory/wipe',
      { method: 'POST', body: JSON.stringify({ ...gate }) }
    );
  },

  async queryCodebaseGraph(query: string) {
    return requestJson<{ matches: AstGraphMatch[]; provenance: DataProvenance; liveOutput?: string }>(
      '/api/admin/control-plane/graph-query',
      { method: 'POST', body: JSON.stringify({ query }) }
    );
  },

  async fetchExternalAgentsAndBridge() {
    return requestJson<{
      provenance: DataProvenance;
      agents: ExternalAgentRecord[];
      workOrders: BridgeWorkOrder[];
    }>('/api/admin/control-plane/external-agents');
  },

  async bridgeWorkAction(issueNumber: number, action: 'claim' | 'renew' | 'release', gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; workOrders?: BridgeWorkOrder[] }>(
      `/api/admin/control-plane/bridge/${issueNumber}/action`,
      { method: 'POST', body: JSON.stringify({ action, ...gate }) }
    );
  },

  async fetchComputeAndBrowser() {
    return requestJson<{
      kaggleRuns: KaggleKernelRun[];
      devToolsAudits: DevToolsAuditReport[];
      crawlerJobs: CrawlerJob[];
    }>('/api/admin/control-plane/compute-browser');
  },

  async runDevToolsAudit(url: string) {
    return requestJson<{ report: DevToolsAuditReport; devToolsAudits: DevToolsAuditReport[] }>(
      '/api/admin/control-plane/devtools-audit',
      { method: 'POST', body: JSON.stringify({ url }) }
    );
  },

  async dispatchKaggleKernel(title: string, accelerator: 'T4x2' | 'P100' | 'TPU-v3-8', gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; kaggleRuns?: KaggleKernelRun[] }>(
      '/api/admin/control-plane/kaggle-dispatch',
      { method: 'POST', body: JSON.stringify({ title, accelerator, ...gate }) }
    );
  },

  async fetchFinOpsAndOmnichannel() {
    return requestJson<{
      finOpsMesh: FinOpsMeshService[];
      telegramLogs: TelegramDispatchRecord[];
      cronTasks: CronTaskItem[];
    }>('/api/admin/control-plane/finops-omnichannel');
  },

  async dispatchTelegram(message: string, gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; telegramLogs?: TelegramDispatchRecord[] }>(
      '/api/admin/control-plane/telegram-dispatch',
      { method: 'POST', body: JSON.stringify({ message, ...gate }) }
    );
  },

  async triggerCronTask(id: string, gate?: SafetyGateContext) {
    return requestJson<{ success: boolean; dryRun?: boolean; message?: string; cronTasks?: CronTaskItem[] }>(
      `/api/admin/control-plane/cron/${encodeURIComponent(id)}/trigger`,
      { method: 'POST', body: JSON.stringify({ ...gate }) }
    );
  },
};
