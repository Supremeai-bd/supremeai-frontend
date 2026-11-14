import os from 'os';
import { performance } from 'perf_hooks';
import type {
  DataProvenance,
  GatewayTrafficPoint,
  HostRuntimeSnapshot,
  McpHealthMonitorSnapshot,
  McpServiceHealthMetric,
  ProactiveHealthAlert,
  ProactiveHealthThresholds,
  ServiceResourcePoint,
} from '../types/controlCenter';
import type { McpTowerService } from '../types';

const MCP_TOWER_URL =
  process.env.SUPREMEAI_MCP_TOWER_URL?.trim() ||
  'https://supremeai-mcp-tower.onrender.com/agents/manus_niloyjoy7/mcp';

const MCP_TOWER_HEALTH_URL =
  process.env.SUPREMEAI_MCP_HEALTH_URL?.trim() ||
  'https://supremeai-mcp-tower.onrender.com/health';

const BACKEND_GATEWAY_URL =
  process.env.SUPREMEAI_BACKEND_URL?.trim() || 'https://supremeai-api-ulw0.onrender.com';

const GITHUB_COMMITS_URL = 'https://api.github.com/repos/Supremeai-bd/supremeai/commits/main';

const MAX_HISTORY_POINTS = 30;
const MAX_TRAFFIC_BUCKETS = 24;

let lastCpuUsage = process.cpuUsage();
let lastCpuSampleMs = Date.now();
let cachedSessionId: string | null = null;

let thresholds: ProactiveHealthThresholds = {
  cpuWarnPct: 70,
  cpuCritPct: 90,
  memWarnPct: 80,
  memCritPct: 92,
  latencyWarnMs: 1500,
  latencyCritMs: 2800,
};

const serviceHistoryMap = new Map<string, ServiceResourcePoint[]>();
const hostHistory: Array<{ ts: string; cpuPercent: number; memoryPercent: number; avgLatencyMs: number }> = [];

// Real HTTP request telemetry collected directly by Express middleware (no synthetic numbers)
interface MinuteRequestBucket {
  minuteKey: string;
  label: string;
  count: number;
  errorCount: number;
  totalLatencyMs: number;
}
const trafficBuckets = new Map<string, MinuteRequestBucket>();
let totalRequestsObserved = 0;
let totalErrorsObserved = 0;

let latestSnapshot: McpHealthMonitorSnapshot | null = null;
let inFlightProbe: Promise<McpHealthMonitorSnapshot> | null = null;
let lastProbeEpochMs = 0;

function formatClock(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatMinuteLabel(epochMs: number): string {
  return new Date(epochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function recordHttpRequestMetric(latencyMs: number, isError: boolean) {
  const now = Date.now();
  const minuteEpoch = Math.floor(now / 60_000) * 60_000;
  const minuteKey = String(minuteEpoch);

  totalRequestsObserved += 1;
  if (isError) totalErrorsObserved += 1;

  let bucket = trafficBuckets.get(minuteKey);
  if (!bucket) {
    bucket = {
      minuteKey,
      label: formatMinuteLabel(minuteEpoch),
      count: 0,
      errorCount: 0,
      totalLatencyMs: 0,
    };
    trafficBuckets.set(minuteKey, bucket);
    if (trafficBuckets.size > MAX_TRAFFIC_BUCKETS) {
      const oldestKey = trafficBuckets.keys().next().value;
      if (oldestKey) trafficBuckets.delete(oldestKey);
    }
  }
  bucket.count += 1;
  if (isError) bucket.errorCount += 1;
  bucket.totalLatencyMs += Math.max(0, latencyMs);
}

export function getRealGatewayTrafficSummary(): {
  rpm: number;
  avgLatencyMs: number;
  errorRatePercent: number;
  totalRequests: number;
  history: GatewayTrafficPoint[];
} {
  const buckets = Array.from(trafficBuckets.values());
  if (buckets.length === 0) {
    const lastProbeLatency = latestSnapshot?.summary?.avgLatencyMs ?? 0;
    return {
      rpm: 0,
      avgLatencyMs: lastProbeLatency,
      errorRatePercent: 0,
      totalRequests: totalRequestsObserved,
      history: [],
    };
  }

  const latest = buckets[buckets.length - 1];
  const history: GatewayTrafficPoint[] = buckets.map((b) => ({
    time: b.label,
    rpm: b.count,
    avgLatencyMs: b.count > 0 ? Math.round(b.totalLatencyMs / b.count) : 0,
    errorRatePct: b.count > 0 ? Number(((b.errorCount / b.count) * 100).toFixed(2)) : 0,
  }));

  const errorRatePercent =
    totalRequestsObserved > 0
      ? Number(((totalErrorsObserved / totalRequestsObserved) * 100).toFixed(2))
      : 0;

  return {
    rpm: latest.count,
    avgLatencyMs: latest.count > 0 ? Math.round(latest.totalLatencyMs / latest.count) : 0,
    errorRatePercent,
    totalRequests: totalRequestsObserved,
    history,
  };
}

export function sampleHostRuntime(): HostRuntimeSnapshot {
  const now = Date.now();
  const elapsedMs = Math.max(100, now - lastCpuSampleMs);
  const delta = process.cpuUsage(lastCpuUsage);
  lastCpuUsage = process.cpuUsage();
  lastCpuSampleMs = now;

  const cpus = os.cpus();
  const cpuCores = Math.max(1, cpus.length);
  const totalCpuMicros = delta.user + delta.system;
  // Convert CPU microseconds consumed by this Node process across elapsed wall clock & normalize by core count
  const rawProcessCpuPct = (totalCpuMicros / (elapsedMs * 1000 * cpuCores)) * 100;
  const loadAvg = os.loadavg();
  const osLoadPct = (loadAvg[0] / cpuCores) * 100;
  // Report true non-zero host pressure combining real OS 1m load & Node process CPU
  const cpuPercent = Number(Math.min(100, Math.max(rawProcessCpuPct, osLoadPct)).toFixed(1));

  const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
  const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
  const systemMemUsedPct = Number((((totalMemMb - freeMemMb) / Math.max(1, totalMemMb)) * 100).toFixed(1));

  const mem = process.memoryUsage();
  const processRssMb = Math.round(mem.rss / (1024 * 1024));
  const processHeapUsedMb = Math.round(mem.heapUsed / (1024 * 1024));
  const processHeapTotalMb = Math.round(mem.heapTotal / (1024 * 1024));

  return {
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.arch()}`,
    nodeVersion: process.version,
    cpuCores,
    cpuPercent,
    loadAvg1m: Number(loadAvg[0].toFixed(2)),
    loadAvg5m: Number(loadAvg[1].toFixed(2)),
    totalMemMb,
    freeMemMb,
    systemMemUsedPct,
    processRssMb,
    processHeapUsedMb,
    processHeapTotalMb,
    uptimeSec: Math.round(process.uptime()),
    sampledAt: new Date(now).toISOString(),
  };
}

function parseSseOrJson(raw: string): any {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return JSON.parse(trimmed);
  }
  const dataLines = trimmed
    .split(/\r?\n/)
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .filter(Boolean);
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      return JSON.parse(dataLines[i]);
    } catch {
      // ignore non-json frame
    }
  }
  return null;
}

async function fetchTimedJson(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 7000
): Promise<{ ok: boolean; status: number; latencyMs: number; json: any; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const latencyMs = Math.round(performance.now() - start);
    const text = await res.text();
    let json: any = null;
    try {
      json = parseSseOrJson(text);
    } catch {
      json = null;
    }
    return {
      ok: res.ok,
      status: res.status,
      latencyMs,
      json,
      error: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - start),
      json: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchMcpStatusPayload(): Promise<{
  ok: boolean;
  latencyMs: number;
  payload: any;
  error?: string;
}> {
  const start = performance.now();
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  };
  if (process.env.SUPREMEAI_TOWER_TOKEN?.trim()) {
    baseHeaders['Authorization'] = `Bearer ${process.env.SUPREMEAI_TOWER_TOKEN.trim()}`;
  }

  const initSession = async (): Promise<string | null> => {
    const r = await fetchTimedJson(
      MCP_TOWER_URL,
      {
        method: 'POST',
        headers: baseHeaders,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'supremeai-studio-health-monitor', version: '2.4.0' },
          },
        }),
      },
      7500
    );
    if (!r.ok) throw new Error(r.error || 'MCP initialize failed');
    return null;
  };

  try {
    if (!cachedSessionId) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7500);
      try {
        const res = await fetch(MCP_TOWER_URL, {
          method: 'POST',
          headers: baseHeaders,
          signal: controller.signal,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
              protocolVersion: '2024-11-05',
              capabilities: {},
              clientInfo: { name: 'supremeai-studio-health-monitor', version: '2.4.0' },
            },
          }),
        });
        const sid = res.headers.get('mcp-session-id');
        if (!res.ok || !sid) {
          await initSession().catch(() => {});
          throw new Error(`MCP handshake returned HTTP ${res.status}`);
        }
        cachedSessionId = sid;
        await fetch(MCP_TOWER_URL, {
          method: 'POST',
          headers: { ...baseHeaders, 'mcp-session-id': sid },
          body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
        }).catch(() => {});
      } finally {
        clearTimeout(timer);
      }
    }

    const callRes = await fetchTimedJson(
      MCP_TOWER_URL,
      {
        method: 'POST',
        headers: { ...baseHeaders, 'mcp-session-id': cachedSessionId! },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: { name: 'status', arguments: {} },
        }),
      },
      8500
    );

    if (!callRes.ok && (callRes.status === 400 || callRes.status === 404)) {
      cachedSessionId = null;
      return fetchMcpStatusPayload();
    }

    if (!callRes.ok || !callRes.json?.result?.content?.[0]?.text) {
      return {
        ok: false,
        latencyMs: Math.round(performance.now() - start),
        payload: null,
        error: callRes.error || 'Empty MCP status payload',
      };
    }

    const parsedPayload = JSON.parse(callRes.json.result.content[0].text);
    return {
      ok: true,
      latencyMs: callRes.latencyMs,
      payload: parsedPayload,
    };
  } catch (err: unknown) {
    cachedSessionId = null;
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - start),
      payload: null,
      error: err instanceof Error ? err.message : 'MCP status unreachable',
    };
  }
}

function computePercentiles(values: number[]): { p50: number | null; p95: number | null } {
  if (values.length === 0) return { p50: null, p95: null };
  const sorted = [...values].sort((a, b) => a - b);
  const p50Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.5));
  const p95Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return { p50: sorted[p50Idx], p95: sorted[p95Idx] };
}

function appendHistoryPoint(id: string, point: ServiceResourcePoint): ServiceResourcePoint[] {
  const existing = serviceHistoryMap.get(id) || [];
  const next = [...existing, point].slice(-MAX_HISTORY_POINTS);
  serviceHistoryMap.set(id, next);
  return next;
}

function inferCategory(
  idOrProvider: string
): McpServiceHealthMetric['category'] {
  const key = idOrProvider.toLowerCase();
  if (key.includes('studio') || key.includes('runtime')) return 'runtime';
  if (key.includes('redis') || key.includes('qdrant')) return 'cache';
  if (key.includes('supabase')) return 'database';
  if (key.includes('cloudflare') || key.includes('vercel')) return 'edge';
  if (key.includes('api') || key.includes('gateway')) return 'gateway';
  if (key.includes('brain') || key.includes('kaggle') || key.includes('firecrawl')) return 'ai-provider';
  if (key.includes('render')) return 'compute';
  return 'integration';
}

function normalizeStatus(
  rawStatus: string | undefined,
  latencyMs: number | null,
  available?: boolean
): McpServiceHealthMetric['status'] {
  const s = (rawStatus || '').toLowerCase();
  if (available === false || s === 'unreachable' || s === 'down' || s === 'offline') return 'unreachable';
  if (s === 'circuit_open' || s === 'unhealthy' || s === 'critical' || s === 'failed') return 'critical';
  if (latencyMs !== null && latencyMs >= thresholds.latencyCritMs) return 'critical';
  if (s === 'degraded' || s === 'unknown' || s === 'warning') return 'degraded';
  if (latencyMs !== null && latencyMs >= thresholds.latencyWarnMs) return 'degraded';
  return 'healthy';
}

function buildProactiveAlerts(services: McpServiceHealthMetric[], checkedAt: string): ProactiveHealthAlert[] {
  const alerts: ProactiveHealthAlert[] = [];
  for (const svc of services) {
    if (svc.status === 'unreachable' || svc.rawStatus === 'circuit_open' || svc.consecutiveFailures > 0) {
      alerts.push({
        id: `al_${svc.id}_avail`,
        serviceId: svc.id,
        displayName: svc.displayName,
        metric: 'availability',
        severity: svc.status === 'critical' || svc.status === 'unreachable' ? 'critical' : 'warning',
        valueLabel: svc.rawStatus || svc.status,
        thresholdLabel: '0 consecutive failures',
        message:
          svc.errorMessage ||
          `${svc.displayName} reported ${svc.rawStatus || svc.status} (${svc.consecutiveFailures} consecutive failure(s)).`,
        detectedAt: svc.checkedAt || checkedAt,
      });
    }

    if (svc.cpuPercent !== null && svc.cpuPercent >= thresholds.cpuWarnPct) {
      const isCrit = svc.cpuPercent >= thresholds.cpuCritPct;
      alerts.push({
        id: `al_${svc.id}_cpu`,
        serviceId: svc.id,
        displayName: svc.displayName,
        metric: 'cpu',
        severity: isCrit ? 'critical' : 'warning',
        valueLabel: `${svc.cpuPercent}%`,
        thresholdLabel: `${isCrit ? thresholds.cpuCritPct : thresholds.cpuWarnPct}%`,
        message: `${svc.displayName} CPU load at ${svc.cpuPercent}% (threshold ${isCrit ? thresholds.cpuCritPct : thresholds.cpuWarnPct}%).`,
        detectedAt: svc.checkedAt || checkedAt,
      });
    }

    if (svc.memoryPercent !== null && svc.memoryPercent >= thresholds.memWarnPct) {
      const isCrit = svc.memoryPercent >= thresholds.memCritPct;
      alerts.push({
        id: `al_${svc.id}_mem`,
        serviceId: svc.id,
        displayName: svc.displayName,
        metric: 'memory',
        severity: isCrit ? 'critical' : 'warning',
        valueLabel: `${svc.memoryPercent}%`,
        thresholdLabel: `${isCrit ? thresholds.memCritPct : thresholds.memWarnPct}%`,
        message: `${svc.displayName} memory pressure at ${svc.memoryPercent}% (${svc.memoryMb ?? '—'} MB).`,
        detectedAt: svc.checkedAt || checkedAt,
      });
    }

    if (svc.latencyMs !== null && svc.latencyMs >= thresholds.latencyWarnMs) {
      const isCrit = svc.latencyMs >= thresholds.latencyCritMs;
      alerts.push({
        id: `al_${svc.id}_lat`,
        serviceId: svc.id,
        displayName: svc.displayName,
        metric: 'latency',
        severity: isCrit ? 'critical' : 'warning',
        valueLabel: `${svc.latencyMs}ms`,
        thresholdLabel: `${isCrit ? thresholds.latencyCritMs : thresholds.latencyWarnMs}ms`,
        message: `${svc.displayName} response latency elevated to ${svc.latencyMs}ms (limit ${isCrit ? thresholds.latencyCritMs : thresholds.latencyWarnMs}ms).`,
        detectedAt: svc.checkedAt || checkedAt,
      });
    }
  }
  return alerts;
}

export async function collectLiveServiceHealth(forceRefresh: boolean = false): Promise<McpHealthMonitorSnapshot> {
  if (!forceRefresh && latestSnapshot && Date.now() - lastProbeEpochMs < 4000) {
    return latestSnapshot;
  }
  if (inFlightProbe) return inFlightProbe;

  inFlightProbe = (async (): Promise<McpHealthMonitorSnapshot> => {
    const nowEpoch = Date.now();
    const nowIso = new Date(nowEpoch).toISOString();
    const nowClock = formatClock(nowEpoch);
    const host = sampleHostRuntime();

    // Execute real parallel network probes against live endpoints & MCP Tower
    const [mcpStatusRes, towerHealthRes, backendHealthRes, githubRes] = await Promise.all([
      fetchMcpStatusPayload(),
      fetchTimedJson(MCP_TOWER_HEALTH_URL, {}, 6500),
      fetchTimedJson(`${BACKEND_GATEWAY_URL}/healthz`, {}, 6500),
      fetchTimedJson(GITHUB_COMMITS_URL, { headers: { 'User-Agent': 'SupremeAI-HealthMonitor' } }, 5000),
    ]);

    const services: McpServiceHealthMetric[] = [];
    const seenIds = new Set<string>();

    // 1. Local Studio Backend Runtime (Real OS & Node process CPU/Mem + measured gateway latency)
    const gwTraffic = getRealGatewayTrafficSummary();
    const studioStatus: McpServiceHealthMetric['status'] =
      host.cpuPercent >= thresholds.cpuCritPct || host.systemMemUsedPct >= thresholds.memCritPct
        ? 'critical'
        : host.cpuPercent >= thresholds.cpuWarnPct || host.systemMemUsedPct >= thresholds.memWarnPct
        ? 'degraded'
        : 'healthy';

    const studioHist = appendHistoryPoint('supremeai-studio-runtime', {
      ts: nowClock,
      epochMs: nowEpoch,
      latencyMs: gwTraffic.avgLatencyMs || 1,
      cpuPercent: host.cpuPercent,
      memoryMb: host.processRssMb,
      memoryPercent: host.systemMemUsedPct,
    });
    const studioPct = computePercentiles(
      studioHist.map((p) => p.latencyMs).filter((n): n is number => n !== null)
    );
    services.push({
      id: 'supremeai-studio-runtime',
      name: 'supremeai-studio-runtime',
      displayName: 'SupremeAI Studio BFF & Proxy Runtime',
      provider: 'local-node',
      category: 'runtime',
      source: 'local-runtime',
      status: studioStatus,
      rawStatus: `${host.nodeVersion} · ${host.cpuCores} cores · up ${host.uptimeSec}s`,
      cpuPercent: host.cpuPercent,
      memoryMb: host.processRssMb,
      memoryPercent: host.systemMemUsedPct,
      latencyMs: gwTraffic.avgLatencyMs || 1,
      p50LatencyMs: studioPct.p50,
      p95LatencyMs: studioPct.p95,
      consecutiveFailures: 0,
      evidenceSummary: `Process RSS ${host.processRssMb} MB · Heap ${host.processHeapUsedMb}/${host.processHeapTotalMb} MB · Load ${host.loadAvg1m}`,
      checkedAt: nowIso,
      history: studioHist,
    });
    seenIds.add('supremeai-studio-runtime');

    // 2. Direct Live HTTP Probe: Render Primary API (/healthz)
    const backendOk = backendHealthRes.ok && backendHealthRes.json?.status === 'healthy';
    const backendStatus = normalizeStatus(
      backendOk ? 'healthy' : backendHealthRes.status === 0 ? 'unreachable' : 'degraded',
      backendHealthRes.latencyMs,
      backendHealthRes.ok
    );
    const backendHist = appendHistoryPoint('live-probe-supremeai-api', {
      ts: nowClock,
      epochMs: nowEpoch,
      latencyMs: backendHealthRes.latencyMs,
      cpuPercent: null,
      memoryMb: null,
      memoryPercent: null,
    });
    const backendPct = computePercentiles(
      backendHist.map((p) => p.latencyMs).filter((n): n is number => n !== null)
    );
    services.push({
      id: 'live-probe-supremeai-api',
      name: 'supremeai-api',
      displayName: 'SupremeAI Primary Gateway (/healthz)',
      provider: 'render-api-direct',
      category: 'gateway',
      source: 'live-http-probe',
      status: backendStatus,
      rawStatus: backendHealthRes.json?.status || backendHealthRes.error || `HTTP ${backendHealthRes.status}`,
      cpuPercent: null,
      memoryMb: null,
      memoryPercent: null,
      latencyMs: backendHealthRes.latencyMs,
      p50LatencyMs: backendPct.p50,
      p95LatencyMs: backendPct.p95,
      consecutiveFailures: backendHealthRes.ok ? 0 : 1,
      errorMessage: backendHealthRes.error,
      evidenceSummary: backendHealthRes.json
        ? `v${backendHealthRes.json.version || '2.0.0'} · chat_ready=${String(backendHealthRes.json.chat_ready)}`
        : backendHealthRes.error || 'Direct HTTP healthz probe',
      checkedAt: backendHealthRes.json?.timestamp || nowIso,
      history: backendHist,
    });
    seenIds.add('live-probe-supremeai-api');

    // 3. Direct Live HTTP Probe: MCP Control Tower (/health)
    const towerHealthJson = towerHealthRes.json || {};
    const towerStatus = normalizeStatus(
      towerHealthRes.ok ? String(towerHealthJson.status || 'healthy') : 'unreachable',
      towerHealthRes.latencyMs,
      towerHealthRes.ok
    );
    const towerHist = appendHistoryPoint('live-probe-mcp-tower', {
      ts: nowClock,
      epochMs: nowEpoch,
      latencyMs: towerHealthRes.latencyMs,
      cpuPercent: null,
      memoryMb: null,
      memoryPercent: null,
    });
    const towerPct = computePercentiles(
      towerHist.map((p) => p.latencyMs).filter((n): n is number => n !== null)
    );
    services.push({
      id: 'live-probe-mcp-tower',
      name: 'supremeai-mcp-tower',
      displayName: 'MCP Control Tower (/health)',
      provider: 'mcp-tower-direct',
      category: 'compute',
      source: 'live-http-probe',
      status: towerStatus,
      rawStatus: towerHealthJson.status || towerHealthRes.error || 'unknown',
      cpuPercent: null,
      memoryMb: null,
      memoryPercent: null,
      latencyMs: towerHealthRes.latencyMs,
      p50LatencyMs: towerPct.p50,
      p95LatencyMs: towerPct.p95,
      consecutiveFailures: towerHealthRes.ok ? 0 : 1,
      errorMessage: towerHealthRes.error,
      evidenceSummary: towerHealthJson.services
        ? `${towerHealthJson.services.healthy}/${towerHealthJson.services.total} sweeps healthy · ${towerHealthJson.sweepCompletions ?? 0} sweeps`
        : towerHealthRes.error,
      checkedAt: towerHealthJson.timestamp || nowIso,
      history: towerHist,
    });
    seenIds.add('live-probe-mcp-tower');

    // 4. All Services Discovered via Live MCP Tower JSON-RPC `status` Tool
    const mcpPayload = mcpStatusRes.payload;
    const mcpHealthMap: Record<string, any> = (mcpPayload && mcpPayload.health) || {};
    const mcpSystemServices: any[] = Array.isArray(mcpPayload?.system?.services)
      ? mcpPayload.system.services
      : [];

    for (const sysSvc of mcpSystemServices) {
      const id = String(sysSvc.id || sysSvc.name || '');
      if (!id || seenIds.has(id)) continue;
      seenIds.add(id);

      const providerKey = String(sysSvc.provider || '').toLowerCase();
      const healthRec = mcpHealthMap[providerKey];

      // Measure real latency: prefer provider sweep latency from MCP Tower, or direct RTT for GitHub/Render
      let latencyMs: number | null =
        typeof healthRec?.latencyMs === 'number' ? healthRec.latencyMs : null;
      if (providerKey === 'github' && githubRes.ok && latencyMs === null) {
        latencyMs = githubRes.latencyMs;
      }
      if (id === 'render-primary' && backendHealthRes.latencyMs) {
        latencyMs = backendHealthRes.latencyMs;
      }
      if (id === 'render-mcp' && towerHealthRes.latencyMs) {
        latencyMs = towerHealthRes.latencyMs;
      }

      const rawState =
        typeof healthRec?.status === 'string'
          ? healthRec.status
          : sysSvc.available === false
          ? 'unreachable'
          : 'healthy';

      const svcStatus = normalizeStatus(rawState, latencyMs, sysSvc.available);
      const checkedAt = String(healthRec?.checkedAt || mcpPayload?.timestamp || nowIso);

      const hist = appendHistoryPoint(id, {
        ts: nowClock,
        epochMs: nowEpoch,
        latencyMs,
        cpuPercent: null,
        memoryMb: null,
        memoryPercent: null,
      });
      const pct = computePercentiles(
        hist.map((p) => p.latencyMs).filter((n): n is number => n !== null)
      );

      services.push({
        id,
        name: id,
        displayName: String(sysSvc.displayName || id),
        provider: providerKey || 'mcp-tower',
        category: inferCategory(`${id} ${providerKey}`),
        source: 'mcp-tower-sweep',
        status: svcStatus,
        rawStatus: rawState,
        cpuPercent: null,
        memoryMb: null,
        memoryPercent: null,
        latencyMs,
        p50LatencyMs: pct.p50,
        p95LatencyMs: pct.p95,
        consecutiveFailures: Number(healthRec?.consecutiveFailures || 0),
        errorMessage: healthRec?.error ? String(healthRec.error).slice(0, 260) : undefined,
        evidenceSummary: healthRec?.evidence?.summary
          ? String(healthRec.evidence.summary)
          : `Reported available=${String(sysSvc.available)} by MCP Tower`,
        checkedAt,
        history: hist,
      });
    }

    // 5. Additional MCP Tower Provider Health Probes not already listed in `system.services`
    for (const [providerKey, healthRec] of Object.entries(mcpHealthMap)) {
      const id = `mcp-provider-${providerKey}`;
      const alreadyRepresented = services.some((s) => s.provider === providerKey);
      if (alreadyRepresented || seenIds.has(id)) continue;
      seenIds.add(id);

      const latencyMs = typeof healthRec?.latencyMs === 'number' ? healthRec.latencyMs : null;
      const rawState = String(healthRec?.status || 'unknown');
      const svcStatus = normalizeStatus(rawState, latencyMs, rawState !== 'unreachable');
      const checkedAt = String(healthRec?.checkedAt || mcpPayload?.timestamp || nowIso);

      const hist = appendHistoryPoint(id, {
        ts: nowClock,
        epochMs: nowEpoch,
        latencyMs,
        cpuPercent: null,
        memoryMb: null,
        memoryPercent: null,
      });
      const pct = computePercentiles(
        hist.map((p) => p.latencyMs).filter((n): n is number => n !== null)
      );

      services.push({
        id,
        name: providerKey,
        displayName: `${providerKey.charAt(0).toUpperCase() + providerKey.slice(1)} Upstream Service`,
        provider: providerKey,
        category: inferCategory(providerKey),
        source: 'mcp-tower-sweep',
        status: svcStatus,
        rawStatus: rawState,
        cpuPercent: null,
        memoryMb: null,
        memoryPercent: null,
        latencyMs,
        p50LatencyMs: pct.p50,
        p95LatencyMs: pct.p95,
        consecutiveFailures: Number(healthRec?.consecutiveFailures || 0),
        errorMessage: healthRec?.error ? String(healthRec.error).slice(0, 260) : undefined,
        evidenceSummary: healthRec?.evidence?.summary ? String(healthRec.evidence.summary) : undefined,
        checkedAt,
        history: hist,
      });
    }

    const alerts = buildProactiveAlerts(services, nowIso);
    const validLatencies = services
      .map((s) => s.latencyMs)
      .filter((v): v is number => v !== null && Number.isFinite(v));
    const avgLatencyMs = validLatencies.length
      ? Math.round(validLatencies.reduce((a, b) => a + b, 0) / validLatencies.length)
      : 0;
    const globalLatPct = computePercentiles(validLatencies);

    hostHistory.push({
      ts: nowClock,
      cpuPercent: host.cpuPercent,
      memoryPercent: host.systemMemUsedPct,
      avgLatencyMs,
    });
    if (hostHistory.length > MAX_HISTORY_POINTS) {
      hostHistory.shift();
    }

    const provenance: DataProvenance = mcpStatusRes.ok
      ? 'live-mcp'
      : backendHealthRes.ok || towerHealthRes.ok
      ? 'live-gateway'
      : 'local-snapshot';

    latestSnapshot = {
      provenance,
      collectedAt: nowIso,
      mcpTowerStatus: mcpStatusRes.ok
        ? String(towerHealthJson.status || 'live')
        : mcpStatusRes.error || 'unreachable',
      sweepCompletions:
        typeof towerHealthJson.sweepCompletions === 'number'
          ? towerHealthJson.sweepCompletions
          : undefined,
      lastTowerSweepAt: towerHealthJson.lastCompletedSweepAt || undefined,
      host,
      thresholds: { ...thresholds },
      summary: {
        total: services.length,
        healthy: services.filter((s) => s.status === 'healthy').length,
        degraded: services.filter((s) => s.status === 'degraded').length,
        critical: services.filter((s) => s.status === 'critical').length,
        unreachable: services.filter((s) => s.status === 'unreachable').length,
        avgLatencyMs,
        p95LatencyMs: globalLatPct.p95 ?? avgLatencyMs,
        activeAlertCount: alerts.length,
      },
      services,
      alerts,
      hostHistory: [...hostHistory],
    };

    lastProbeEpochMs = Date.now();
    return latestSnapshot;
  })();

  try {
    return await inFlightProbe;
  } finally {
    inFlightProbe = null;
  }
}

export function updateHealthThresholds(next: Partial<ProactiveHealthThresholds>): ProactiveHealthThresholds {
  thresholds = {
    cpuWarnPct: clampThreshold(next.cpuWarnPct, thresholds.cpuWarnPct, 10, 99),
    cpuCritPct: clampThreshold(next.cpuCritPct, thresholds.cpuCritPct, 15, 100),
    memWarnPct: clampThreshold(next.memWarnPct, thresholds.memWarnPct, 10, 99),
    memCritPct: clampThreshold(next.memCritPct, thresholds.memCritPct, 15, 100),
    latencyWarnMs: clampThreshold(next.latencyWarnMs, thresholds.latencyWarnMs, 50, 10000),
    latencyCritMs: clampThreshold(next.latencyCritMs, thresholds.latencyCritMs, 100, 15000),
  };
  return { ...thresholds };
}

function clampThreshold(val: unknown, fallback: number, min: number, max: number): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.round(num)));
}

export function getLatestHealthSnapshot(): McpHealthMonitorSnapshot | null {
  return latestSnapshot;
}

/**
 * Maps live collected MCP + HTTP probe metrics into the McpTowerService shape
 * consumed by /api/mcp-tower/services and /api/mcp-tower/stream (zero fake jitter).
 */
export async function getLiveMcpTowerServices(forceRefresh: boolean = false): Promise<McpTowerService[]> {
  const snap = await collectLiveServiceHealth(forceRefresh);
  return snap.services.map((s): McpTowerService => {
    const mappedStatus: McpTowerService['status'] =
      s.status === 'healthy'
        ? 'healthy'
        : s.status === 'degraded'
        ? 'degraded'
        : 'unhealthy';
    const cat: McpTowerService['category'] =
      s.category === 'runtime' || s.category === 'gateway' || s.category === 'database'
        ? 'core'
        : s.category === 'ai-provider'
        ? 'ai'
        : 'integration';

    return {
      id: s.id,
      name: s.name,
      displayName: s.displayName,
      category: cat,
      port: s.source === 'local-runtime' ? 3000 : 443,
      status: mappedStatus,
      uptime: s.consecutiveFailures > 0 ? 'Degraded' : 'Live',
      latencyMs: s.latencyMs ?? 0,
      cpuPercent: s.cpuPercent ?? 0,
      memoryMb: s.memoryMb ?? 0,
      lastChecked: new Date(s.checkedAt).toLocaleTimeString(),
      version: s.rawStatus || s.source,
      endpoint:
        s.provider === 'render-api-direct'
          ? `${BACKEND_GATEWAY_URL}/healthz`
          : s.provider === 'mcp-tower-direct'
          ? MCP_TOWER_HEALTH_URL
          : MCP_TOWER_URL,
      errorCount: s.consecutiveFailures,
      logs: [
        {
          id: `live-${s.id}`,
          timestamp: new Date(s.checkedAt).toLocaleTimeString(),
          level: mappedStatus === 'healthy' ? 'INFO' : mappedStatus === 'degraded' ? 'WARN' : 'ERROR',
          message: s.errorMessage || s.evidenceSummary || `${s.displayName} checked (${s.source}).`,
        },
      ],
      freshness: s.status === 'healthy' ? 'live-current' : 'live-stale',
    };
  });
}
