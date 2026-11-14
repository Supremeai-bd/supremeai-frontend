import { create } from 'zustand';
import { controlCenterService } from '../services/controlCenterService';
import { toast } from './useToastStore';
import type {
  ControlPlaneSafetyMode,
  SafetyGateContext,
  DataProvenance,
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
  McpHealthMonitorSnapshot,
  ProactiveHealthThresholds,
  GatewayTrafficPoint,
} from '../types/controlCenter';

export interface SafetyGatePrompt {
  title: string;
  description: string;
  impactSummary: string;
  riskLevel: 'medium' | 'high' | 'critical';
  onExecute: (gate: SafetyGateContext) => Promise<void>;
}

interface ControlCenterState {
  safetyMode: ControlPlaneSafetyMode;
  mcpEndpoint: string;
  backendGateway: string;
  isLoadingOverview: boolean;
  isDiagnosing: boolean;
  latestGithubCommit: { sha: string; message: string; author: string; date: string; provenance: DataProvenance } | null;
  latestDiagnose: DeepDiagnoseReport | null;
  pendingHitlCount: number;
  activeTakeoversCount: number;
  unclaimedBridgeCount: number;

  // MCP Live Registry
  mcpTools: McpToolDescriptor[];
  mcpToolsProvenance: DataProvenance;
  isLoadingTools: boolean;
  lastToolResult: McpToolExecutionResult | null;

  // Release Gate & CI
  releases: ReleaseVerificationItem[];
  pipelines: HarnessPipelineRun[];
  isLoadingReleases: boolean;

  // HITL, DAG Plans, Policies & Takeover
  hitlTickets: HitlTicket[];
  remediationPlans: RemediationDagPlan[];
  executionPolicies: ExecutionPolicyRule[];
  takeoverSessions: ActiveTakeoverSession[];
  healerIncidents: AutoHealerIncident[];
  isLoadingHitl: boolean;

  // Memory, Qdrant & AST Graph
  memoryEntries: MemoryGovernanceEntry[];
  memoryProvenance: DataProvenance;
  qdrantCollections: QdrantCollectionStats[];
  astMatches: AstGraphMatch[];
  isLoadingMemory: boolean;

  // External Agents & Bridge
  externalAgents: ExternalAgentRecord[];
  bridgeWorkOrders: BridgeWorkOrder[];
  bridgeProvenance: DataProvenance;
  isLoadingBridge: boolean;

  // Compute & Browser Fleet
  kaggleRuns: KaggleKernelRun[];
  devToolsAudits: DevToolsAuditReport[];
  crawlerJobs: CrawlerJob[];
  isLoadingCompute: boolean;

  // FinOps & Omnichannel
  finOpsMesh: FinOpsMeshService[];
  telegramLogs: TelegramDispatchRecord[];
  cronTasks: CronTaskItem[];
  isLoadingFinOps: boolean;

  // Real-Time MCP Resource & Latency Health Monitor
  healthSnapshot: McpHealthMonitorSnapshot | null;
  trafficSummary: {
    rpm: number;
    avgLatencyMs: number;
    errorRatePercent: number;
    totalRequests: number;
    history: GatewayTrafficPoint[];
  } | null;
  isLoadingHealth: boolean;
  isProbingHealth: boolean;

  // Safety Gate Modal
  pendingGate: SafetyGatePrompt | null;
  isExecutingGate: boolean;

  // Actions
  loadOverview: () => Promise<void>;
  setSafetyMode: (mode: ControlPlaneSafetyMode, actor?: string) => Promise<void>;
  runDeepDiagnose: (service?: string, intent?: string, actor?: string) => Promise<void>;
  loadMcpTools: (refresh?: boolean) => Promise<void>;
  runMcpTool: (toolName: string, args: Record<string, any>, isMutating: boolean, actor?: string) => Promise<void>;
  loadReleaseGate: () => Promise<void>;
  loadHitlAndPolicies: () => Promise<void>;
  generateDagPlan: (service: string, failureLayer: string, actor?: string) => Promise<void>;
  toggleTakeover: (id: string, actor?: string) => Promise<void>;
  loadMemoryAndGraph: () => Promise<void>;
  learnMemory: (tier: 'episodic' | 'semantic' | 'procedural', fact: string, verifiedBy?: string) => Promise<void>;
  queryAstGraph: (query: string) => Promise<void>;
  loadExternalAgentsAndBridge: () => Promise<void>;
  loadComputeAndBrowser: () => Promise<void>;
  runDevToolsAudit: (url: string) => Promise<void>;
  loadFinOpsAndOmnichannel: () => Promise<void>;
  loadServiceHealth: (refresh?: boolean) => Promise<void>;
  runServiceHealthProbe: (actor?: string) => Promise<void>;
  saveHealthThresholds: (thresholds: Partial<ProactiveHealthThresholds>, actor?: string) => Promise<void>;
  applyHealthStreamSnapshot: (snapshot: McpHealthMonitorSnapshot, traffic?: ControlCenterState['trafficSummary']) => void;

  requestGuardedAction: (prompt: SafetyGatePrompt) => void;
  closeGuardedAction: () => void;
  executeGuardedAction: (gate: SafetyGateContext) => Promise<void>;
}

export const useControlCenterStore = create<ControlCenterState>((set, get) => ({
  safetyMode: 'dry-run-hitl',
  mcpEndpoint: 'https://supremeai-mcp-tower.onrender.com/agents/manus_niloyjoy7/mcp',
  backendGateway: 'https://supremeai-api-ulw0.onrender.com',
  isLoadingOverview: false,
  isDiagnosing: false,
  latestGithubCommit: null,
  latestDiagnose: null,
  pendingHitlCount: 0,
  activeTakeoversCount: 0,
  unclaimedBridgeCount: 0,

  mcpTools: [],
  mcpToolsProvenance: 'local-snapshot',
  isLoadingTools: false,
  lastToolResult: null,

  releases: [],
  pipelines: [],
  isLoadingReleases: false,

  hitlTickets: [],
  remediationPlans: [],
  executionPolicies: [],
  takeoverSessions: [],
  healerIncidents: [],
  isLoadingHitl: false,

  memoryEntries: [],
  memoryProvenance: 'local-snapshot',
  qdrantCollections: [],
  astMatches: [],
  isLoadingMemory: false,

  externalAgents: [],
  bridgeWorkOrders: [],
  bridgeProvenance: 'local-snapshot',
  isLoadingBridge: false,

  kaggleRuns: [],
  devToolsAudits: [],
  crawlerJobs: [],
  isLoadingCompute: false,

  finOpsMesh: [],
  telegramLogs: [],
  cronTasks: [],
  isLoadingFinOps: false,

  healthSnapshot: null,
  trafficSummary: null,
  isLoadingHealth: false,
  isProbingHealth: false,

  pendingGate: null,
  isExecutingGate: false,

  loadOverview: async () => {
    set({ isLoadingOverview: true });
    try {
      const data = await controlCenterService.fetchOverview();
      set({
        safetyMode: data.safetyMode,
        mcpEndpoint: data.mcpEndpoint,
        backendGateway: data.backendGateway,
        latestGithubCommit: data.latestGithubCommit,
        latestDiagnose: data.latestDiagnose,
        pendingHitlCount: data.pendingHitlCount,
        activeTakeoversCount: data.activeTakeoversCount,
        unclaimedBridgeCount: data.unclaimedBridgeCount,
        trafficSummary: data.trafficSummary || get().trafficSummary,
      });
    } catch {
      // Keep prior state cleanly
    } finally {
      set({ isLoadingOverview: false });
    }
  },

  setSafetyMode: async (mode, actor) => {
    try {
      const res = await controlCenterService.setSafetyMode(mode, actor);
      set({ safetyMode: res.safetyMode });
      toast.info('Safety Posture Updated', `Control Center safety mode set to "${res.safetyMode}".`);
    } catch (err: unknown) {
      toast.error('Safety Mode Error', err instanceof Error ? err.message : 'Update failed.');
    }
  },

  runDeepDiagnose: async (service = 'api', intent = 'is_healthy', actor) => {
    set({ isDiagnosing: true });
    try {
      const { report } = await controlCenterService.runDeepDiagnose(service, intent, actor);
      set({ latestDiagnose: report });
      toast.success(
        `Deep Diagnose: ${report.releaseGate}`,
        `5-layer TruthMatrix refreshed (${report.provenance}).`
      );
    } catch (err: unknown) {
      toast.error('Deep Diagnose Error', err instanceof Error ? err.message : 'Probe failed.');
    } finally {
      set({ isDiagnosing: false });
    }
  },

  loadMcpTools: async (refresh = false) => {
    set({ isLoadingTools: true });
    try {
      const res = await controlCenterService.fetchMcpTools(refresh);
      set({ mcpTools: res.tools, mcpToolsProvenance: res.provenance });
    } catch (err: unknown) {
      toast.error('MCP Discovery Failed', err instanceof Error ? err.message : 'Unable to reach MCP registry.');
    } finally {
      set({ isLoadingTools: false });
    }
  },

  runMcpTool: async (toolName, args, isMutating, actor) => {
    if (!isMutating) {
      try {
        const { result } = await controlCenterService.executeMcpTool(toolName, args, { actor });
        set({ lastToolResult: result });
        if (result.error) {
          toast.warning(`MCP Tool ${toolName}`, result.error);
        } else {
          toast.success(`Executed ${toolName}`, `Completed in ${result.latencyMs}ms (${result.provenance}).`);
        }
      } catch (err: unknown) {
        toast.error('MCP Execution Error', err instanceof Error ? err.message : 'Failed to call tool.');
      }
      return;
    }

    get().requestGuardedAction({
      title: `Execute MCP Tool: ${toolName}`,
      description: `Invoke live MCP Control Tower tool "${toolName}" with custom JSON payload.`,
      impactSummary: JSON.stringify(args),
      riskLevel: 'high',
      onExecute: async (gate) => {
        const { result } = await controlCenterService.executeMcpTool(toolName, args, { ...gate, actor });
        set({ lastToolResult: result });
        toast.success(
          result.dryRun ? `Dry-Run Passed: ${toolName}` : `Executed ${toolName}`,
          result.dryRun ? 'Dry-run simulation validated.' : `Completed in ${result.latencyMs}ms.`
        );
      },
    });
  },

  loadReleaseGate: async () => {
    set({ isLoadingReleases: true });
    try {
      const res = await controlCenterService.fetchReleaseGate();
      set({
        latestGithubCommit: res.githubCommit,
        releases: res.releases,
        pipelines: res.pipelines,
      });
    } finally {
      set({ isLoadingReleases: false });
    }
  },

  loadHitlAndPolicies: async () => {
    set({ isLoadingHitl: true });
    try {
      const res = await controlCenterService.fetchHitlAndPolicies();
      set({
        hitlTickets: res.tickets,
        remediationPlans: res.plans,
        executionPolicies: res.policies,
        takeoverSessions: res.takeoverSessions,
        healerIncidents: res.healerIncidents,
        pendingHitlCount: res.tickets.filter((t) => t.status === 'pending').length,
      });
    } finally {
      set({ isLoadingHitl: false });
    }
  },

  generateDagPlan: async (service, failureLayer, actor) => {
    try {
      const res = await controlCenterService.generateRemediationPlan(service, failureLayer, actor);
      set({ remediationPlans: res.plans });
      toast.success('DAG Plan Synthesized', `Generated topological waves for ${failureLayer}.`);
    } catch (err: unknown) {
      toast.error('Planner Error', err instanceof Error ? err.message : 'Could not synthesize plan.');
    }
  },

  toggleTakeover: async (id, actor) => {
    try {
      const res = await controlCenterService.toggleTakeoverSession(id, actor);
      set({ takeoverSessions: res.takeoverSessions });
      toast.info('Session Control Updated', 'Live operator takeover state updated.');
    } catch (err: unknown) {
      toast.error('Takeover Failed', err instanceof Error ? err.message : 'Unable to switch takeover.');
    }
  },

  loadMemoryAndGraph: async () => {
    set({ isLoadingMemory: true });
    try {
      const res = await controlCenterService.fetchMemoryAndGraph();
      set({
        memoryEntries: res.entries,
        memoryProvenance: res.provenance,
        qdrantCollections: res.collections,
        astMatches: res.astMatches,
      });
    } finally {
      set({ isLoadingMemory: false });
    }
  },

  learnMemory: async (tier, fact, verifiedBy) => {
    try {
      const res = await controlCenterService.learnMemoryFact(tier, fact, verifiedBy);
      set({ memoryEntries: res.entries });
      toast.success('Memory Recorded', `Added ${tier} fact (${verifiedBy ? 'trusted' : 'candidate'}).`);
    } catch (err: unknown) {
      toast.error('Memory Error', err instanceof Error ? err.message : 'Failed to store fact.');
    }
  },

  queryAstGraph: async (query) => {
    try {
      const res = await controlCenterService.queryCodebaseGraph(query);
      set({ astMatches: res.matches });
    } catch (err: unknown) {
      toast.error('AST Query Failed', err instanceof Error ? err.message : 'Query failed.');
    }
  },

  loadExternalAgentsAndBridge: async () => {
    set({ isLoadingBridge: true });
    try {
      const res = await controlCenterService.fetchExternalAgentsAndBridge();
      set({
        externalAgents: res.agents,
        bridgeWorkOrders: res.workOrders,
        bridgeProvenance: res.provenance,
        unclaimedBridgeCount: res.workOrders.filter((w) => w.status === 'unclaimed').length,
      });
    } finally {
      set({ isLoadingBridge: false });
    }
  },

  loadComputeAndBrowser: async () => {
    set({ isLoadingCompute: true });
    try {
      const res = await controlCenterService.fetchComputeAndBrowser();
      set({
        kaggleRuns: res.kaggleRuns,
        devToolsAudits: res.devToolsAudits,
        crawlerJobs: res.crawlerJobs,
      });
    } finally {
      set({ isLoadingCompute: false });
    }
  },

  runDevToolsAudit: async (url) => {
    set({ isLoadingCompute: true });
    try {
      const res = await controlCenterService.runDevToolsAudit(url);
      set({ devToolsAudits: res.devToolsAudits });
      toast.success('Headless CDP Audit Complete', `${res.report.url} · LCP ${res.report.lcpMs}ms`);
    } catch (err: unknown) {
      toast.error('DevTools Audit Error', err instanceof Error ? err.message : 'Audit failed.');
    } finally {
      set({ isLoadingCompute: false });
    }
  },

  loadFinOpsAndOmnichannel: async () => {
    set({ isLoadingFinOps: true });
    try {
      const res = await controlCenterService.fetchFinOpsAndOmnichannel();
      set({
        finOpsMesh: res.finOpsMesh,
        telegramLogs: res.telegramLogs,
        cronTasks: res.cronTasks,
      });
    } finally {
      set({ isLoadingFinOps: false });
    }
  },

  loadServiceHealth: async (refresh = false) => {
    set({ isLoadingHealth: true });
    try {
      const res = await controlCenterService.fetchServiceHealth(refresh);
      set({ healthSnapshot: res.snapshot, trafficSummary: res.traffic });
    } catch (err: unknown) {
      toast.error('Health Monitor Error', err instanceof Error ? err.message : 'Unable to probe services.');
    } finally {
      set({ isLoadingHealth: false });
    }
  },

  runServiceHealthProbe: async (actor) => {
    set({ isProbingHealth: true });
    try {
      const res = await controlCenterService.probeServiceHealth(actor);
      set({ healthSnapshot: res.snapshot, trafficSummary: res.traffic });
      toast.success(
        'Live Health Probe Complete',
        `${res.snapshot.summary.healthy}/${res.snapshot.summary.total} healthy · avg ${res.snapshot.summary.avgLatencyMs}ms`
      );
    } catch (err: unknown) {
      toast.error('Live Probe Failed', err instanceof Error ? err.message : 'Upstream probe error.');
    } finally {
      set({ isProbingHealth: false });
    }
  },

  saveHealthThresholds: async (thresholds, actor) => {
    try {
      await controlCenterService.updateHealthThresholds(thresholds, actor);
      const res = await controlCenterService.fetchServiceHealth(true);
      set({ healthSnapshot: res.snapshot, trafficSummary: res.traffic });
      toast.success('Alert Thresholds Saved', 'Proactive health monitor thresholds updated.');
    } catch (err: unknown) {
      toast.error('Threshold Update Error', err instanceof Error ? err.message : 'Failed to save thresholds.');
    }
  },

  applyHealthStreamSnapshot: (snapshot, traffic) => {
    set((state) => ({
      healthSnapshot: snapshot,
      trafficSummary: traffic || state.trafficSummary,
    }));
  },

  requestGuardedAction: (prompt) => {
    set({ pendingGate: prompt });
  },

  closeGuardedAction: () => {
    set({ pendingGate: null, isExecutingGate: false });
  },

  executeGuardedAction: async (gate) => {
    const active = get().pendingGate;
    if (!active) return;
    set({ isExecutingGate: true });
    try {
      await active.onExecute(gate);
      set({ pendingGate: null });
    } catch (err: unknown) {
      toast.error('Safety Gate Rejected', err instanceof Error ? err.message : 'Action blocked.');
    } finally {
      set({ isExecutingGate: false });
    }
  },
}));
