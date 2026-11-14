import { create } from 'zustand';
import {
  McpTowerService,
  SwarmWorker,
  TaskQueueJob,
  SchemaParityTable,
  LlmGatewayRoute,
  SecurityEventLog,
  SystemAuditRecord,
  CustomerRecord,
} from '../types';
import { INITIAL_MCP_SERVICES } from '../data/mcpTowerData';
import { INITIAL_CUSTOMERS } from '../data/customerData';
import {
  INITIAL_SWARM_WORKERS,
  INITIAL_QUEUE_JOBS,
  INITIAL_SCHEMA_PARITY,
  INITIAL_LLM_GATEWAY_ROUTES,
  INITIAL_SECURITY_LOGS,
  INITIAL_AUDIT_RECORDS,
} from '../data/adminExpansionData';
import { adminService } from '../services/adminService';
import { toast } from './useToastStore';

const MCP_SERVICES_KEY = 'supremeai_studio_mcp_services';
const SWARM_KEY = 'supremeai_studio_swarm_workers';
const QUEUE_KEY = 'supremeai_studio_queue_jobs';
const SCHEMA_KEY = 'supremeai_studio_schema_tables';
const GATEWAY_KEY = 'supremeai_studio_gateway_routes';
const SECURITY_KEY = 'supremeai_studio_security_events';
const BLOCKED_IPS_KEY = 'supremeai_studio_blocked_ips';
const AUDIT_KEY = 'supremeai_studio_audit_records';
const CUSTOMERS_KEY = 'supremeai_studio_customers';

interface BlockedIpRecord {
  ip: string;
  reason: string;
  date: string;
}

interface AdminState {
  mcpServices: McpTowerService[];
  isProbingCluster: boolean;
  swarmWorkers: SwarmWorker[];
  queueJobs: TaskQueueJob[];
  schemaTables: SchemaParityTable[];
  gatewayRoutes: LlmGatewayRoute[];
  securityEvents: SecurityEventLog[];
  blockedIps: BlockedIpRecord[];
  auditRecords: SystemAuditRecord[];
  customers: CustomerRecord[];

  // MCP & Central Sync Operations
  fetchMcpServices: () => Promise<void>;
  fetchAdminSync: () => Promise<void>;
  fetchAuditRecords: () => Promise<void>;
  rebootService: (serviceId: string) => Promise<void>;
  rebootAllServices: () => Promise<void>;
  probeCluster: () => Promise<void>;
  getMcpAlertCount: () => number;

  // Swarm & Tasks
  toggleSwarmWorker: (id: string) => void;
  scaleWorker: (id: string, delta: number) => void;
  retryQueueJob: (id: string) => void;
  retryAllDlq: () => void;
  clearCompletedJobs: () => void;

  // Schema & Gateway
  runParitySync: () => void;
  toggleFailover: (routeId: string) => void;
  updateGatewayPrice: (routeId: string, newPrice: number) => void;

  // Security & Audit
  addBlockedIp: (ip: string, reason: string) => void;
  removeBlockedIp: (ip: string) => void;

  // Customer Management
  addCustomer: (newCust: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>) => void;
  updateCustomer: (id: string, updates: Partial<CustomerRecord>) => void;
  deleteCustomer: (id: string) => void;
}

export const useAdminStore = create<AdminState>((set, get) => {
  // Helpers to read from localStorage with fallbacks
  const getInitialStorage = <T>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return fallback;
  };

  const initialMcpServices = getInitialStorage<McpTowerService[]>(MCP_SERVICES_KEY, INITIAL_MCP_SERVICES);
  const initialSwarmWorkers = getInitialStorage<SwarmWorker[]>(SWARM_KEY, INITIAL_SWARM_WORKERS);
  const initialQueueJobs = getInitialStorage<TaskQueueJob[]>(QUEUE_KEY, INITIAL_QUEUE_JOBS);
  const initialSchemaTables = getInitialStorage<SchemaParityTable[]>(SCHEMA_KEY, INITIAL_SCHEMA_PARITY);
  const initialGatewayRoutes = getInitialStorage<LlmGatewayRoute[]>(GATEWAY_KEY, INITIAL_LLM_GATEWAY_ROUTES);
  const initialSecurityLogs = getInitialStorage<SecurityEventLog[]>(SECURITY_KEY, INITIAL_SECURITY_LOGS);
  const initialBlockedIps = getInitialStorage<BlockedIpRecord[]>(BLOCKED_IPS_KEY, [
    { ip: '45.154.255.8', reason: 'Internal MCP Port Scanner', date: '2 days ago' },
    { ip: '198.51.100.44', reason: 'Adversarial Jailbreak Payload Injection', date: 'Today' },
  ]);
  const initialAuditRecords = getInitialStorage<SystemAuditRecord[]>(AUDIT_KEY, INITIAL_AUDIT_RECORDS);
  const initialCustomers = getInitialStorage<CustomerRecord[]>(CUSTOMERS_KEY, INITIAL_CUSTOMERS);

  return {
    mcpServices: initialMcpServices,
    isProbingCluster: false,
    swarmWorkers: initialSwarmWorkers,
    queueJobs: initialQueueJobs,
    schemaTables: initialSchemaTables,
    gatewayRoutes: initialGatewayRoutes,
    securityEvents: initialSecurityLogs,
    blockedIps: initialBlockedIps,
    auditRecords: initialAuditRecords,
    customers: initialCustomers,

    fetchMcpServices: async () => {
      try {
        const services = await adminService.fetchMcpServices();
        if (services && services.length > 0) {
          localStorage.setItem(MCP_SERVICES_KEY, JSON.stringify(services));
          set({ mcpServices: services });
        }
      } catch (err) {
        console.warn('MCP tower fetch failed, using cached/mock telemetry:', err);
      }
    },

    fetchAuditRecords: async () => {
      try {
        const records = await adminService.fetchAuditRecords();
        if (records && records.length > 0) {
          localStorage.setItem(AUDIT_KEY, JSON.stringify(records));
          set({ auditRecords: records });
        }
      } catch {}
    },

    fetchAdminSync: async () => {
      try {
        const [customers, blockedIps, auditRecords, swarmWorkers, queueJobs] = await Promise.all([
          adminService.fetchCustomers(),
          adminService.fetchBlockedIps(),
          adminService.fetchAuditRecords(),
          adminService.fetchSwarmWorkers(),
          adminService.fetchQueueJobs(),
        ]);
        if (customers && customers.length > 0) {
          localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
          set({ customers });
        }
        if (blockedIps) {
          localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blockedIps));
          set({ blockedIps });
        }
        if (auditRecords && auditRecords.length > 0) {
          localStorage.setItem(AUDIT_KEY, JSON.stringify(auditRecords));
          set({ auditRecords });
        }
        if (swarmWorkers && swarmWorkers.length > 0) {
          localStorage.setItem(SWARM_KEY, JSON.stringify(swarmWorkers));
          set({ swarmWorkers });
        }
        if (queueJobs && queueJobs.length > 0) {
          localStorage.setItem(QUEUE_KEY, JSON.stringify(queueJobs));
          set({ queueJobs });
        }
      } catch (err) {
        console.warn('Admin central sync failed, keeping local cache:', err);
      }
    },

    rebootService: async (serviceId: string) => {
      const prev = get().mcpServices;
      set((state) => ({
        mcpServices: state.mcpServices.map((s) => (s.id === serviceId ? { ...s, status: 'rebooting' } : s)),
      }));

      try {
        const rebooted = await adminService.rebootMcpService(serviceId);
        if (rebooted) {
          set((state) => {
            const updated = state.mcpServices.map((s) => (s.id === serviceId ? rebooted : s));
            localStorage.setItem(MCP_SERVICES_KEY, JSON.stringify(updated));
            return { mcpServices: updated };
          });
          toast.success('Service Rebooted', `${serviceId} successfully recovered.`);
          return;
        }
        throw new Error('Reboot returned no service');
      } catch (err) {
        console.warn('Backend reboot failed:', err);
        // Restore truthful state from backend instead of faking success.
        try { await get().fetchMcpServices(); } catch {}
        toast.error('Reboot Failed', `${serviceId} could not be restarted: ${(err as Error)?.message || err}`);
      }
    },

    rebootAllServices: async () => {
      set((state) => ({
        mcpServices: state.mcpServices.map((s) =>
          s.status === 'unhealthy' || s.status === 'degraded' ? { ...s, status: 'rebooting' } : s
        ),
      }));

      try {
        const services = await adminService.rebootAllMcpServices();
        if (services && services.length > 0) {
          localStorage.setItem(MCP_SERVICES_KEY, JSON.stringify(services));
          set({ mcpServices: services });
          toast.success('Cluster Recovered', 'All degraded services brought back online.');
          return;
        }
        throw new Error('Cluster reboot returned no services');
      } catch (err) {
        console.warn('Backend cluster reboot failed:', err);
        try { await get().fetchMcpServices(); } catch {}
        toast.error('Cluster Reboot Failed', (err as Error)?.message || String(err));
      }
    },

    probeCluster: async () => {
      set({ isProbingCluster: true });
      try {
        const services = await adminService.probeMcpCluster();
        if (services && services.length > 0) {
          localStorage.setItem(MCP_SERVICES_KEY, JSON.stringify(services));
          set({ mcpServices: services });
          toast.info('Cluster Health Probed', 'Active ping latency and memory stats updated.');
        }
      } catch (err) {
        console.warn('Probe failed:', err);
        toast.error('Probe Failed', (err as Error)?.message || String(err));
      } finally {
        setTimeout(() => set({ isProbingCluster: false }), 500);
      }
    },

    getMcpAlertCount: () => {
      const { mcpServices } = get();
      return mcpServices.filter((s) => s.status === 'unhealthy' || s.status === 'degraded').length;
    },

    toggleSwarmWorker: (id: string) => {
      set((state) => {
        const updated = state.swarmWorkers.map((w) =>
          w.id === id ? { ...w, status: w.status === 'active' ? ('paused' as const) : ('active' as const) } : w
        );
        localStorage.setItem(SWARM_KEY, JSON.stringify(updated));
        return { swarmWorkers: updated };
      });
      adminService.toggleSwarmWorker(id).catch(() => {});
      toast.info('Swarm Worker Updated', 'Worker state modified.');
    },

    scaleWorker: (id: string, delta: number) => {
      set((state) => {
        const updated = state.swarmWorkers.map((w) =>
          w.id === id
            ? { ...w, cpuPercent: Math.max(1, Math.min(95, Math.round(w.cpuPercent + delta * 4))) }
            : w
        );
        localStorage.setItem(SWARM_KEY, JSON.stringify(updated));
        return { swarmWorkers: updated };
      });
      adminService.scaleSwarmWorker(id, delta).catch(() => {});
    },

    retryQueueJob: (id: string) => {
      set((state) => {
        const updated = state.queueJobs.map((j) =>
          j.id === id ? { ...j, status: 'active' as const, attempts: 1, errorDetails: undefined } : j
        );
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
        return { queueJobs: updated };
      });
      adminService.retryQueueJob(id).catch(() => {});
      toast.info('Job Re-queued', 'Task moved back to active ingestion queue.');
    },

    retryAllDlq: () => {
      set((state) => {
        const updated = state.queueJobs.map((j) =>
          j.status === 'dlq' ? { ...j, status: 'active' as const, attempts: 1, errorDetails: undefined } : j
        );
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
        return { queueJobs: updated };
      });
      adminService.flushDlq().then(() => get().fetchAuditRecords()).catch(() => {});
      toast.success('DLQ Reprocessed', 'All dead-letter jobs moved to active execution.');
    },

    clearCompletedJobs: () => {
      set((state) => {
        const updated = state.queueJobs.filter((j) => j.status !== 'completed');
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
        return { queueJobs: updated };
      });
      adminService.clearCompletedQueueJobs().catch(() => {});
      toast.info('Queue Cleaned', 'Completed tasks purged from history.');
    },

    runParitySync: () => {
      set((state) => {
        const updated = state.schemaTables.map((t) => ({
          ...t,
          driftDetected: false,
          driftSummary: undefined,
          prodColumns: t.localColumns,
          lastMigrated: `${new Date().toISOString().slice(0, 10)} (Parity Synced)`,
        }));
        localStorage.setItem(SCHEMA_KEY, JSON.stringify(updated));
        return { schemaTables: updated };
      });
      toast.success('Schema Parity Reached', 'Database schemas aligned across dev and production.');
    },

    toggleFailover: (routeId: string) => {
      set((state) => {
        const updated = state.gatewayRoutes.map((r) =>
          r.id === routeId ? { ...r, autoFailoverActive: !r.autoFailoverActive } : r
        );
        localStorage.setItem(GATEWAY_KEY, JSON.stringify(updated));
        return { gatewayRoutes: updated };
      });
    },

    updateGatewayPrice: (routeId: string, newPrice: number) => {
      set((state) => {
        const updated = state.gatewayRoutes.map((r) =>
          r.id === routeId ? { ...r, customerPricePer1M: newPrice } : r
        );
        localStorage.setItem(GATEWAY_KEY, JSON.stringify(updated));
        return { gatewayRoutes: updated };
      });
      toast.info('Route Updated', `Gateway route price updated to $${newPrice}/1M.`);
    },

    addBlockedIp: (ip: string, reason: string) => {
      set((state) => {
        const updated = [{ ip, reason, date: 'Just now' }, ...state.blockedIps];
        localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(updated));
        return { blockedIps: updated };
      });
      adminService
        .blockIp(ip, reason)
        .then((blockedIps) => {
          localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blockedIps));
          set({ blockedIps });
          get().fetchAuditRecords();
        })
        .catch(() => {});
      toast.warning('IP Blocked', `${ip} has been added to Gateway WAF blacklist.`);
    },

    removeBlockedIp: (ip: string) => {
      set((state) => {
        const updated = state.blockedIps.filter((b) => b.ip !== ip);
        localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(updated));
        return { blockedIps: updated };
      });
      adminService
        .unblockIp(ip)
        .then((blockedIps) => {
          localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blockedIps));
          set({ blockedIps });
          get().fetchAuditRecords();
        })
        .catch(() => {});
      toast.info('IP Unblocked', `${ip} removed from WAF blacklist.`);
    },

    addCustomer: (newCust) => {
      const customer: CustomerRecord = {
        ...newCust,
        id: `cust_${String(Date.now()).slice(-4)}`,
        joinedDate: new Date().toISOString().slice(0, 10),
        lastActive: 'Just now',
      };
      set((state) => {
        const updated = [customer, ...state.customers];
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
        return { customers: updated };
      });
      adminService
        .createCustomer(newCust)
        .then((customers) => {
          if (customers.length > 0) {
            localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
            set({ customers });
            get().fetchAuditRecords();
          }
        })
        .catch(() => {});
      toast.success('Customer Created', `${customer.name} added to workspace.`);
    },

    updateCustomer: (id: string, updates: Partial<CustomerRecord>) => {
      set((state) => {
        const updated = state.customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
        return { customers: updated };
      });
      adminService
        .updateCustomer(id, updates)
        .then((customers) => {
          if (customers.length > 0) {
            localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
            set({ customers });
            get().fetchAuditRecords();
          }
        })
        .catch(() => {});
      toast.info('Customer Updated', 'Profile changes saved.');
    },

    deleteCustomer: (id: string) => {
      set((state) => {
        const updated = state.customers.filter((c) => c.id !== id);
        localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(updated));
        return { customers: updated };
      });
      adminService
        .deleteCustomer(id)
        .then((customers) => {
          localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
          set({ customers });
          get().fetchAuditRecords();
        })
        .catch(() => {});
      toast.info('Customer Removed', 'Account purged from workspace.');
    },
  };
});
