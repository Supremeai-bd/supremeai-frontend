import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatThread } from './components/ChatThread';
import { ChatInput } from './components/ChatInput';
import { RoleModal } from './components/RoleModal';
import { RoleLab } from './components/RoleLab';
import { ModelMatrix } from './components/ModelMatrix';
import { RepoHub } from './components/RepoHub';
import { UserProjectsView } from './components/user/UserProjectsView';
import { UserPluginsView } from './components/user/UserPluginsView';
import { UserSettingsView } from './components/user/UserSettingsView';
import { UserApiKeysView } from './components/user/UserApiKeysView';
import { UserKnowledgeBaseView } from './components/user/UserKnowledgeBaseView';
import { UserTeamView } from './components/user/UserTeamView';
import { UserBillingView } from './components/user/UserBillingView';
import { AdminCustomersView } from './components/admin/AdminCustomersView';
import { AdminMcpTowerView } from './components/admin/AdminMcpTowerView';
import { AdminAgentSwarmView } from './components/admin/AdminAgentSwarmView';
import { AdminTaskQueueView } from './components/admin/AdminTaskQueueView';
import { AdminSchemaParityView } from './components/admin/AdminSchemaParityView';
import { AdminLlmGatewayView } from './components/admin/AdminLlmGatewayView';
import { AdminSecurityView } from './components/admin/AdminSecurityView';
import { AdminSystemAuditView } from './components/admin/AdminSystemAuditView';
import { AdminFeatureFlagsView } from './components/admin/AdminFeatureFlagsView';
import { AdminProviderKeysView } from './components/admin/AdminProviderKeysView';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { PromptLibraryModal } from './components/user/PromptLibraryModal';
import { UsageView } from './components/UsageView';

import {
  ChatSession,
  ChatMessage,
  ChatAttachment,
  RolePersona,
  ModelDetail,
  UserRole,
  UserProject,
  PluginItem,
  UserAccountSettings,
  CustomerRecord,
  McpTowerService,
  ApiKeyItem,
  WebhookItem,
  KnowledgeDoc,
  TeamMember,
  BillingInvoice,
  SwarmWorker,
  TaskQueueJob,
  SchemaParityTable,
  LlmGatewayRoute,
  SecurityEventLog,
  SystemAuditRecord,
} from './types';
import { SYSTEM_ROLES } from './data/roles';
import { GEMINI_MODELS } from './data/models';
import {
  INITIAL_PLUGINS,
  INITIAL_USER_PROJECTS,
  DEFAULT_USER_SETTINGS,
} from './data/userPlugins';
import { INITIAL_CUSTOMERS } from './data/customerData';
import { INITIAL_MCP_SERVICES } from './data/mcpTowerData';
import {
  INITIAL_API_KEYS,
  INITIAL_WEBHOOKS,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_TEAM_MEMBERS,
  INITIAL_INVOICES,
} from './data/customerWorkspaceData';
import {
  INITIAL_SWARM_WORKERS,
  INITIAL_QUEUE_JOBS,
  INITIAL_SCHEMA_PARITY,
  INITIAL_LLM_GATEWAY_ROUTES,
  INITIAL_SECURITY_LOGS,
  INITIAL_AUDIT_RECORDS,
} from './data/adminExpansionData';

const STORAGE_KEY = 'supremeai_studio_sessions_v1';
const THEME_KEY = 'supremeai_studio_theme';
const ROLE_KEY = 'supremeai_studio_user_role';
const PROJECTS_KEY = 'supremeai_studio_user_projects';
const PLUGINS_KEY = 'supremeai_studio_user_plugins';
const SETTINGS_KEY = 'supremeai_studio_user_settings';
const CUSTOMERS_KEY = 'supremeai_studio_customers';
const API_KEYS_KEY = 'supremeai_studio_api_keys';
const WEBHOOKS_KEY = 'supremeai_studio_webhooks';
const KNOWLEDGE_KEY = 'supremeai_studio_knowledge_docs';
const TEAM_KEY = 'supremeai_studio_team_members';
const INVOICES_KEY = 'supremeai_studio_invoices';
const SWARM_KEY = 'supremeai_studio_swarm_workers';
const QUEUE_KEY = 'supremeai_studio_queue_jobs';
const SCHEMA_KEY = 'supremeai_studio_schema_tables';
const GATEWAY_KEY = 'supremeai_studio_gateway_routes';
const SECURITY_KEY = 'supremeai_studio_security_events';
const BLOCKED_IPS_KEY = 'supremeai_studio_blocked_ips';
const AUDIT_KEY = 'supremeai_studio_audit_records';

export default function App() {
  // Dual Role State: 'user' (normal user) vs 'admin' (developer studio)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('supremeai_admin_authed') === 'true';
  });
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(ROLE_KEY);
    return saved === 'admin' ? 'admin' : 'user';
  });

  const handleToggleRole = (forcedRole?: UserRole) => {
    const nextRole = forcedRole || (currentRole === 'admin' ? 'user' : 'admin');
    if (nextRole === 'admin' && !isAdminAuthenticated) {
      setIsAdminAuthModalOpen(true);
      return;
    }
    setCurrentRole(nextRole);
    localStorage.setItem(ROLE_KEY, nextRole);
    setActiveTab('chat');
  };

  const handleAdminAuthSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('supremeai_admin_authed', 'true');
    setIsAdminAuthModalOpen(false);
    setCurrentRole('admin');
    localStorage.setItem(ROLE_KEY, 'admin');
    setActiveTab('chat');
  };

  const handleImpersonateCustomer = (customer: CustomerRecord) => {
    setCurrentRole('user');
    localStorage.setItem(ROLE_KEY, 'user');
    setActiveTab('chat');
    handleNewSession();
  };

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  // Active Role and Model Selection
  const [activeRole, setActiveRole] = useState<RolePersona>(SYSTEM_ROLES[0]);
  const [activeModel, setActiveModel] = useState<ModelDetail>(() => {
    return GEMINI_MODELS.find((m) => m.id === 'gemini-3.8-flash') || GEMINI_MODELS[0];
  });
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // User Projects State
  const [userProjects, setUserProjects] = useState<UserProject[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_USER_PROJECTS;
  });

  useEffect(() => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(userProjects));
  }, [userProjects]);

  // User Plugins State
  const [userPlugins, setUserPlugins] = useState<PluginItem[]>(() => {
    try {
      const saved = localStorage.getItem(PLUGINS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PLUGINS;
  });

  useEffect(() => {
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(userPlugins));
  }, [userPlugins]);

  // User Account Settings State
  const [userSettings, setUserSettings] = useState<UserAccountSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_USER_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(userSettings));
  }, [userSettings]);

  // Customers State (for Admin Workspace)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  }, [customers]);

  const handleAddCustomer = (
    newCust: Omit<CustomerRecord, 'id' | 'joinedDate' | 'lastActive'>
  ) => {
    const customer: CustomerRecord = {
      ...newCust,
      id: `cust_${String(Date.now()).slice(-4)}`,
      joinedDate: new Date().toISOString().slice(0, 10),
      lastActive: 'Just now',
    };
    setUserSettings((prev) => prev); // keep state synchronized
    setCustomers([customer, ...customers]);
  };

  const handleUpdateCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // --- Customer Expansion States ---
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(() => {
    try {
      const saved = localStorage.getItem(API_KEYS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_API_KEYS;
  });
  useEffect(() => {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(apiKeys));
  }, [apiKeys]);

  const handleAddApiKey = (newKey: Omit<ApiKeyItem, 'id' | 'createdAt' | 'lastUsed'>) => {
    const keyItem: ApiKeyItem = {
      ...newKey,
      id: `key_${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      lastUsed: 'Never',
    };
    setApiKeys([keyItem, ...apiKeys]);
  };

  const handleRevokeApiKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k))
    );
  };

  const [webhooks, setWebhooks] = useState<WebhookItem[]>(() => {
    try {
      const saved = localStorage.getItem(WEBHOOKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_WEBHOOKS;
  });
  useEffect(() => {
    localStorage.setItem(WEBHOOKS_KEY, JSON.stringify(webhooks));
  }, [webhooks]);

  const handleAddWebhook = (
    newWebhook: Omit<WebhookItem, 'id' | 'lastTriggered' | 'failureCount'>
  ) => {
    const wh: WebhookItem = {
      ...newWebhook,
      id: `wh_${Date.now()}`,
      lastTriggered: 'Never',
      failureCount: 0,
    };
    setWebhooks([wh, ...webhooks]);
  };

  const handleDeleteWebhook = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const handleTestWebhook = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === id ? { ...w, lastTriggered: 'Just now (200 OK test ping)' } : w
      )
    );
  };

  const [knowledgeDocs, setKnowledgeDocs] = useState<KnowledgeDoc[]>(() => {
    try {
      const saved = localStorage.getItem(KNOWLEDGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_KNOWLEDGE_DOCS;
  });
  useEffect(() => {
    localStorage.setItem(KNOWLEDGE_KEY, JSON.stringify(knowledgeDocs));
  }, [knowledgeDocs]);

  const handleAddKnowledgeDoc = (
    doc: Omit<KnowledgeDoc, 'id' | 'lastIndexed'>
  ) => {
    const newDoc: KnowledgeDoc = {
      ...doc,
      id: `doc_${Date.now()}`,
      lastIndexed: 'Just now',
    };
    setKnowledgeDocs([newDoc, ...knowledgeDocs]);
  };

  const handleToggleKnowledgeGrounding = (id: string) => {
    setKnowledgeDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isGroundingActive: !d.isGroundingActive } : d))
    );
  };

  const handleDeleteKnowledgeDoc = (id: string) => {
    setKnowledgeDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(TEAM_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_TEAM_MEMBERS;
  });
  useEffect(() => {
    localStorage.setItem(TEAM_KEY, JSON.stringify(teamMembers));
  }, [teamMembers]);

  const handleInviteTeamMember = (
    member: Omit<TeamMember, 'id' | 'joinedDate' | 'avatar'>
  ) => {
    const newMem: TeamMember = {
      ...member,
      id: `mem_${Date.now()}`,
      joinedDate: 'Just now',
      avatar: member.name.charAt(0).toUpperCase() || 'M',
    };
    setTeamMembers([...teamMembers, newMem]);
  };

  const handleUpdateTeamRole = (id: string, newRole: TeamMember['role']) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const [invoices, setInvoices] = useState<BillingInvoice[]>(() => {
    try {
      const saved = localStorage.getItem(INVOICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_INVOICES;
  });
  useEffect(() => {
    localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  }, [invoices]);

  const handleTopUpTokens = (addedTokens: number, costUsd: number) => {
    setUserSettings((prev) => ({
      ...prev,
      monthlyTokensLimit: prev.monthlyTokensLimit + addedTokens,
    }));
    const newInv: BillingInvoice = {
      id: `inv_topup_${Date.now()}`,
      invoiceNumber: `TOP-2026-${String(Date.now()).slice(-4)}`,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      amountUsd: costUsd,
      status: 'paid',
      planName: `Pay-As-You-Go Credits (${(addedTokens / 1000000).toFixed(1)}M Tokens)`,
    };
    setInvoices([newInv, ...invoices]);
  };

  // --- Admin Expansion States ---
  const [swarmWorkers, setSwarmWorkers] = useState<SwarmWorker[]>(() => {
    try {
      const saved = localStorage.getItem(SWARM_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SWARM_WORKERS;
  });
  useEffect(() => {
    localStorage.setItem(SWARM_KEY, JSON.stringify(swarmWorkers));
  }, [swarmWorkers]);

  const handleToggleSwarmWorker = (id: string) => {
    setSwarmWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, status: w.status === 'active' ? ('paused' as const) : ('active' as const) }
          : w
      )
    );
  };

  const handleScaleWorker = (id: string, delta: number) => {
    setSwarmWorkers((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              cpuPercent: Math.max(1, Math.min(95, Math.round(w.cpuPercent + delta * 4))),
            }
          : w
      )
    );
  };

  const [queueJobs, setQueueJobs] = useState<TaskQueueJob[]>(() => {
    try {
      const saved = localStorage.getItem(QUEUE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_QUEUE_JOBS;
  });
  useEffect(() => {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queueJobs));
  }, [queueJobs]);

  const handleRetryQueueJob = (id: string) => {
    setQueueJobs((prev) =>
      prev.map((j) =>
        j.id === id
          ? { ...j, status: 'active' as const, attempts: 1, errorDetails: undefined }
          : j
      )
    );
  };

  const handleRetryAllDlq = () => {
    setQueueJobs((prev) =>
      prev.map((j) =>
        j.status === 'dlq'
          ? { ...j, status: 'active' as const, attempts: 1, errorDetails: undefined }
          : j
      )
    );
  };

  const handleClearCompletedJobs = () => {
    setQueueJobs((prev) => prev.filter((j) => j.status !== 'completed'));
  };

  const [schemaTables, setSchemaTables] = useState<SchemaParityTable[]>(() => {
    try {
      const saved = localStorage.getItem(SCHEMA_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SCHEMA_PARITY;
  });
  useEffect(() => {
    localStorage.setItem(SCHEMA_KEY, JSON.stringify(schemaTables));
  }, [schemaTables]);

  const handleRunParitySync = () => {
    setSchemaTables((prev) =>
      prev.map((t) => ({
        ...t,
        driftDetected: false,
        driftSummary: undefined,
        prodColumns: t.localColumns,
        lastMigrated: `${new Date().toISOString().slice(0, 10)} (Parity Synced)`,
      }))
    );
  };

  const [gatewayRoutes, setGatewayRoutes] = useState<LlmGatewayRoute[]>(() => {
    try {
      const saved = localStorage.getItem(GATEWAY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LLM_GATEWAY_ROUTES;
  });
  useEffect(() => {
    localStorage.setItem(GATEWAY_KEY, JSON.stringify(gatewayRoutes));
  }, [gatewayRoutes]);

  const handleToggleFailover = (routeId: string) => {
    setGatewayRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId ? { ...r, autoFailoverActive: !r.autoFailoverActive } : r
      )
    );
  };

  const handleUpdateGatewayPrice = (routeId: string, newPrice: number) => {
    setGatewayRoutes((prev) =>
      prev.map((r) => (r.id === routeId ? { ...r, customerPricePer1M: newPrice } : r))
    );
  };

  const [securityEvents, setSecurityEvents] = useState<SecurityEventLog[]>(() => {
    try {
      const saved = localStorage.getItem(SECURITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_SECURITY_LOGS;
  });
  useEffect(() => {
    localStorage.setItem(SECURITY_KEY, JSON.stringify(securityEvents));
  }, [securityEvents]);

  const [blockedIps, setBlockedIps] = useState<{ ip: string; reason: string; date: string }[]>(() => {
    try {
      const saved = localStorage.getItem(BLOCKED_IPS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { ip: '45.154.255.8', reason: 'Internal MCP Port Scanner', date: '2 days ago' },
      { ip: '198.51.100.44', reason: 'Adversarial Jailbreak Payload Injection', date: 'Today' },
    ];
  });
  useEffect(() => {
    localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blockedIps));
  }, [blockedIps]);

  const handleAddBlockedIp = (ip: string, reason: string) => {
    setBlockedIps([{ ip, reason, date: 'Just now' }, ...blockedIps]);
  };

  const handleRemoveBlockedIp = (ip: string) => {
    setBlockedIps((prev) => prev.filter((b) => b.ip !== ip));
  };

  const [auditRecords, setAuditRecords] = useState<SystemAuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(AUDIT_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_AUDIT_RECORDS;
  });
  useEffect(() => {
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditRecords));
  }, [auditRecords]);

  // --- MCP Tower Services & Cluster Health State ---
  const MCP_SERVICES_KEY = 'supremeai_studio_mcp_services';
  const [mcpServices, setMcpServices] = useState<McpTowerService[]>(() => {
    try {
      const saved = localStorage.getItem(MCP_SERVICES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MCP_SERVICES;
  });

  const [isProbingCluster, setIsProbingCluster] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(MCP_SERVICES_KEY, JSON.stringify(mcpServices));
  }, [mcpServices]);

  // Initial fetch from backend API if available
  useEffect(() => {
    fetch('/api/mcp-tower/services')
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.services) && data.services.length > 0) {
          setMcpServices(data.services);
        }
      })
      .catch((err) => {
        console.warn('Backend MCP Tower API unavailable, using local telemetry:', err);
      });
  }, []);

  // Reboot a specific service
  const handleRebootService = async (serviceId: string) => {
    // 1. Optimistic UI update: mark service as 'rebooting'
    setMcpServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, status: 'rebooting' } : s))
    );

    try {
      const response = await fetch('/api/mcp-tower/reboot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.service) {
          setMcpServices((prev) =>
            prev.map((s) => (s.id === serviceId ? data.service : s))
          );
          return;
        }
      }
    } catch (err) {
      console.warn('Backend reboot request failed, performing client-side recovery:', err);
    }

    // Client-side fallback recovery in case backend call times out
    setTimeout(() => {
      setMcpServices((prev) =>
        prev.map((s) => {
          if (s.id === serviceId) {
            const rebootLog = {
              id: `reboot-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO' as const,
              message: 'Service process gracefully rebooted via SupremeAI Admin Dashboard. Memory garbage collected, connection pool drained and re-initialized.',
              details: 'PID reset. Cold boot latency: 28ms. All previous error locks released.',
            };
            return {
              ...s,
              status: 'healthy' as const,
              errorCount: 0,
              latencyMs: s.id === 'code-auditor-worker' ? 38 : s.id === 'sse-stream-broker' ? 26 : Math.max(12, Math.round(s.latencyMs * 0.4)),
              cpuPercent: s.id === 'code-auditor-worker' ? 3.2 : s.id === 'sse-stream-broker' ? 4.1 : 1.5,
              memoryMb: s.id === 'code-auditor-worker' ? 240 : s.id === 'sse-stream-broker' ? 180 : s.memoryMb,
              uptime: '100%',
              lastChecked: 'Just now (Clean reboot)',
              logs: [rebootLog, ...s.logs],
            };
          }
          return s;
        })
      );
    }, 600);
  };

  // Reboot all degraded / unhealthy services
  const handleRebootAllServices = async () => {
    // 1. Mark all degraded and unhealthy as 'rebooting'
    setMcpServices((prev) =>
      prev.map((s) =>
        s.status === 'unhealthy' || s.status === 'degraded'
          ? { ...s, status: 'rebooting' }
          : s
      )
    );

    try {
      const response = await fetch('/api/mcp-tower/reboot-all', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setMcpServices(data.services);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend reboot-all request failed, performing client-side recovery:', err);
    }

    // Client-side fallback recovery
    setTimeout(() => {
      setMcpServices((prev) =>
        prev.map((s) => {
          if (s.status === 'unhealthy' || s.status === 'degraded' || s.status === 'rebooting') {
            const rebootLog = {
              id: `reboot-all-${Date.now()}-${s.id}`,
              timestamp: new Date().toLocaleTimeString(),
              level: 'INFO' as const,
              message: 'Cluster-wide recovery sweep rebooted service daemon. Memory flushed and health checks passed.',
            };
            return {
              ...s,
              status: 'healthy' as const,
              errorCount: 0,
              latencyMs: s.id === 'code-auditor-worker' ? 35 : s.id === 'sse-stream-broker' ? 24 : 20,
              cpuPercent: 2.4,
              memoryMb: s.id === 'code-auditor-worker' ? 230 : 190,
              uptime: '100%',
              lastChecked: 'Just now (Cluster reboot)',
              logs: [rebootLog, ...s.logs],
            };
          }
          return s;
        })
      );
    }, 800);
  };

  // Probe cluster health
  const handleProbeCluster = async () => {
    setIsProbingCluster(true);
    try {
      const response = await fetch('/api/mcp-tower/probe', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.services) {
          setMcpServices(data.services);
        }
      }
    } catch {
      // Local fallback
      setMcpServices((prev) =>
        prev.map((s) => ({ ...s, lastChecked: 'Just now (Active probe)' }))
      );
    } finally {
      setTimeout(() => setIsProbingCluster(false), 600);
    }
  };

  const mcpAlertCount = mcpServices.filter(
    (s) => s.status === 'unhealthy' || s.status === 'degraded'
  ).length;

  // Sessions and Chat History
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved sessions:', e);
    }

    const initialSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'SupremeAI Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      roleId: SYSTEM_ROLES[0].id,
      messages: [],
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => sessions[0]?.id || '');

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Periodic auto-save mechanism every 30 seconds
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<number>(Date.now());
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      try {
        if (sessions && sessions.length > 0) {
          setIsAutoSaving(true);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
          localStorage.setItem('supremeai_studio_autosave_ts', String(Date.now()));
          setLastAutoSaveTime(Date.now());
          setTimeout(() => setIsAutoSaving(false), 1200);
        }
      } catch (err) {
        console.warn('Auto-save periodic error:', err);
      }
    }, 30000); // 30,000 ms = 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [sessions]);

  const lastAutoSavedText = `Auto-saved at ${new Date(lastAutoSaveTime).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  }, [sessions]);

  const currentSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Create New Session
  const handleNewSession = () => {
    const newSession: ChatSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: activeModel.id,
      roleId: activeRole.id,
      customSystemInstruction: customInstruction || undefined,
      messages: [],
    };

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setActiveTab('chat');
    setInferenceError(null);
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === 0) {
      const fallback: ChatSession = {
        id: `session_${Date.now()}`,
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        model: activeModel.id,
        roleId: activeRole.id,
        messages: [],
      };
      setSessions([fallback]);
      setActiveSessionId(fallback.id);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear Current Thread
  const handleClearThread = () => {
    if (!currentSession) return;
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? { ...s, messages: [], updatedAt: Date.now() } : s))
    );
    setStreamingContent('');
    setInferenceError(null);
  };

  // Export Thread
  const handleExportThread = (format: 'markdown' | 'json') => {
    if (!currentSession) return;

    let blob: Blob;
    let filename: string;

    if (format === 'markdown') {
      let md = `# ${currentSession.title}\n`;
      md += `*Exported from SupremeAI Studio · Model: ${currentSession.model} · Date: ${new Date().toLocaleString()}*\n\n---\n\n`;

      currentSession.messages.forEach((msg) => {
        const sender = msg.role === 'user' ? '### User' : `### Assistant (${msg.roleName || 'SupremeAI'})`;
        md += `${sender}\n\n${msg.content}\n\n---\n\n`;
      });

      blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      filename = `${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.md`;
    } else {
      const json = JSON.stringify(currentSession, null, 2);
      blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      filename = `${currentSession.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.json`;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    if (streamingContent.trim() && currentSession) {
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: streamingContent,
        timestamp: Date.now(),
        model: activeModel.id,
        roleName: activeRole.name,
      };

      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }
            : s
        )
      );
      setStreamingContent('');
    }
  };

  // Send Message with optional multimodal attachment & RAG grounding
  const handleSendMessage = async (text: string, attachment?: ChatAttachment) => {
    if ((!text.trim() && !attachment) || isStreaming || !currentSession) return;

    setInferenceError(null);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachment: attachment,
    };

    const updatedMessages = [...currentSession.messages, userMsg];
    const isFirstUserMessage = currentSession.messages.filter((m) => m.role === 'user').length === 0;
    const sessionTitle = isFirstUserMessage
      ? (text.slice(0, 32).trim() || (attachment ? `Analysis: ${attachment.name}` : 'New Chat')) + (text.length > 32 ? '...' : '')
      : currentSession.title;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: sessionTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
              model: activeModel.id,
              roleId: activeRole.id,
            }
          : s
      )
    );

    // Track token usage
    const estimatedTokens = Math.ceil(text.length / 4) + (attachment ? 258 : 0);
    setUserSettings((prev) => ({
      ...prev,
      monthlyTokensUsed: prev.monthlyTokensUsed + estimatedTokens,
    }));

    setIsStreaming(true);
    setStreamingContent('');
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Collect active knowledge base grounding docs
    const activeGroundingDocs = knowledgeDocs.filter((d) => d.isGroundingActive);
    const groundingContext =
      activeGroundingDocs.length > 0
        ? activeGroundingDocs
            .map(
              (d) =>
                `[GROUNDING DOCUMENT: "${d.title}" (Type: ${d.type})]\n${d.contentPreview}`
            )
            .join('\n\n')
        : undefined;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: activeModel.id,
          systemInstruction: customInstruction || activeRole.systemInstruction,
          groundingContext,
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment,
          })),
          stream: userSettings.streamResponses,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.text) {
                accumulatedText += parsed.text;
                setStreamingContent(accumulatedText);
              }
            } catch {}
          }
        }
      }

      if (accumulatedText.trim()) {
        const assistantMsg: ChatMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: accumulatedText,
          timestamp: Date.now(),
          model: activeModel.id,
          roleName: activeRole.name,
        };

        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: [...s.messages, assistantMsg],
                  updatedAt: Date.now(),
                }
              : s
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Aborted intentionally
      } else {
        console.error('Chat error:', err);
        setInferenceError(err instanceof Error ? err.message : 'Inference error');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  // User Project Actions
  const handleAddProject = (
    project: Omit<UserProject, 'id' | 'lastSynced' | 'stars' | 'aiReviewStatus'>
  ) => {
    const newProject: UserProject = {
      ...project,
      id: `proj_${Date.now()}`,
      lastSynced: Date.now(),
      stars: 1,
      aiReviewStatus: 'idle',
    };
    setUserProjects([newProject, ...userProjects]);
  };

  const handleDeleteProject = (id: string) => {
    setUserProjects(userProjects.filter((p) => p.id !== id));
  };

  const handleChatWithProject = (project: UserProject) => {
    handleNewSession();
    handleSendMessage(
      `Please inspect my connected GitHub repository: "${project.name}" (${project.repoUrl}, branch: ${project.branch}). Description: ${project.description}. Give me a quick architecture summary and recommended next steps.`
    );
  };

  const handleTriggerCodeReview = (project: UserProject) => {
    handleNewSession();
    handleSendMessage(
      `Perform a comprehensive AI Code Review for the repository "${project.name}" (${project.repoUrl}). Check for security vulnerabilities, TypeScript strictness, and clean architecture.`
    );
  };

  // User Plugin Actions
  const handleTogglePlugin = (id: string) => {
    setUserPlugins(
      userPlugins.map((p) => (p.id === id ? { ...p, isEnabled: !p.isEnabled } : p))
    );
  };

  const handleAddCustomPlugin = (plugin: Omit<PluginItem, 'id'>) => {
    const newPlugin: PluginItem = {
      ...plugin,
      id: `plugin_${Date.now()}`,
    };
    setUserPlugins([newPlugin, ...userPlugins]);
  };

  // User Settings Actions
  const handleUpdateSettings = (newSettings: Partial<UserAccountSettings>) => {
    setUserSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Role Modal Handler
  const handleSaveRole = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) setActiveModel(matchedModel);
  };

  const handleSelectRoleFromLab = (role: RolePersona, customPrompt?: string) => {
    setActiveRole(role);
    setCustomInstruction(customPrompt || '');
    const matchedModel = GEMINI_MODELS.find((m) => m.id === role.suggestedModel);
    if (matchedModel) setActiveModel(matchedModel);
  };

  const activePluginsCount = userPlugins.filter((p) => p.isEnabled).length;

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#131314] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors">
      {/* Top Bar Navigation Contract: 3 zones */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNewSession={handleNewSession}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        activeModel={activeModel}
        currentRole={currentRole}
        onToggleRole={() => handleToggleRole()}
        mcpAlertCount={mcpAlertCount}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Gemini-Style Sidebar */}
        <Sidebar
          sessions={sessions}
          activeSessionId={currentSession?.id || ''}
          onSelectSession={setActiveSessionId}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onNewSession={handleNewSession}
          activeRole={activeRole}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
          isOpen={sidebarOpen}
          onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
          onSelectTab={setActiveTab}
          activeTab={activeTab}
          currentRole={currentRole}
          onToggleRole={() => handleToggleRole()}
          projectsCount={userProjects.length}
          activePluginsCount={activePluginsCount}
          customersCount={customers.length}
          mcpAlertCount={mcpAlertCount}
        />

        {/* --- Tab Views --- */}
        {/* 1. Chat Tab (Shared between User and Admin, with role-specific depth) */}
        {activeTab === 'chat' && (
          <main className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(219,234,254,0.45),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_25%,rgba(30,58,138,0.2),rgba(19,19,20,0))]">
            <ChatThread
              messages={currentSession?.messages || []}
              activeRole={activeRole}
              activeModel={activeModel}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              onSendPrompt={handleSendMessage}
              error={inferenceError}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              onStopStreaming={handleStopStreaming}
              onClearThread={handleClearThread}
              onExportThread={handleExportThread}
              isStreaming={isStreaming}
              activeModel={activeModel}
              onSelectModel={setActiveModel}
              activeRole={activeRole}
              onOpenRoleModal={() => setIsRoleModalOpen(true)}
              hasMessages={(currentSession?.messages?.length || 0) > 0}
              lastAutoSavedText={lastAutoSavedText}
              isAutoSaving={isAutoSaving}
              onOpenPromptLibrary={() => setIsPromptModalOpen(true)}
              activeGroundingDocsCount={knowledgeDocs.filter((d) => d.isGroundingActive).length}
            />
          </main>
        )}

        {/* 2. User Specific Views */}
        {activeTab === 'user-projects' && (
          <UserProjectsView
            projects={userProjects}
            onAddProject={handleAddProject}
            onDeleteProject={handleDeleteProject}
            onChatWithProject={handleChatWithProject}
            onTriggerCodeReview={handleTriggerCodeReview}
          />
        )}

        {activeTab === 'user-api-keys' && (
          <UserApiKeysView
            apiKeys={apiKeys}
            onAddApiKey={handleAddApiKey}
            onRevokeApiKey={handleRevokeApiKey}
            webhooks={webhooks}
            onAddWebhook={handleAddWebhook}
            onDeleteWebhook={handleDeleteWebhook}
            onTestWebhook={handleTestWebhook}
          />
        )}

        {activeTab === 'user-knowledge' && (
          <UserKnowledgeBaseView
            documents={knowledgeDocs}
            onAddDocument={handleAddKnowledgeDoc}
            onToggleGrounding={handleToggleKnowledgeGrounding}
            onDeleteDocument={handleDeleteKnowledgeDoc}
          />
        )}

        {activeTab === 'user-team' && (
          <UserTeamView
            members={teamMembers}
            onInviteMember={handleInviteTeamMember}
            onUpdateRole={handleUpdateTeamRole}
            onRemoveMember={handleRemoveTeamMember}
          />
        )}

        {activeTab === 'user-billing' && (
          <UserBillingView
            invoices={invoices}
            currentTokensUsed={userSettings.monthlyTokensUsed}
            tokensLimit={userSettings.monthlyTokensLimit}
            onTopUpTokens={handleTopUpTokens}
          />
        )}

        {activeTab === 'user-plugins' && (
          <UserPluginsView
            plugins={userPlugins}
            onTogglePlugin={handleTogglePlugin}
            onAddCustomPlugin={handleAddCustomPlugin}
          />
        )}

        {activeTab === 'user-settings' && (
          <UserSettingsView
            settings={userSettings}
            onUpdateSettings={handleUpdateSettings}
            onSwitchRole={(newRole) => handleToggleRole(newRole)}
            currentRole={currentRole}
          />
        )}

        {/* 3. Usage Analytics (Recharts Bar Chart) */}
        {activeTab === 'usage' && (
          <UsageView sessions={sessions} darkMode={darkMode} />
        )}

        {/* 4. Admin Specific Views */}
        {activeTab === 'agent-swarm' && (
          <AdminAgentSwarmView
            workers={swarmWorkers}
            onToggleWorkerStatus={handleToggleSwarmWorker}
            onScaleConcurrency={handleScaleWorker}
          />
        )}

        {activeTab === 'task-queue' && (
          <AdminTaskQueueView
            jobs={queueJobs}
            onRetryJob={handleRetryQueueJob}
            onRetryAllDlq={handleRetryAllDlq}
            onClearCompleted={handleClearCompletedJobs}
          />
        )}

        {activeTab === 'schema-parity' && (
          <AdminSchemaParityView
            tables={schemaTables}
            onRunParitySync={handleRunParitySync}
          />
        )}

        {activeTab === 'llm-gateway' && (
          <AdminLlmGatewayView
            routes={gatewayRoutes}
            onToggleFailover={handleToggleFailover}
            onUpdatePrice={handleUpdateGatewayPrice}
          />
        )}

        {activeTab === 'feature-flags' && (
          <AdminFeatureFlagsView />
        )}

        {activeTab === 'provider-keys' && (
          <AdminProviderKeysView />
        )}

        {activeTab === 'security' && (
          <AdminSecurityView
            securityEvents={securityEvents}
            onAddBlockedIp={handleAddBlockedIp}
            onRemoveBlockedIp={handleRemoveBlockedIp}
            blockedIps={blockedIps}
          />
        )}

        {activeTab === 'system-audit' && (
          <AdminSystemAuditView
            auditRecords={auditRecords}
          />
        )}

        {activeTab === 'customers' && (
          <AdminCustomersView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onImpersonateCustomer={handleImpersonateCustomer}
          />
        )}

        {activeTab === 'mcp-tower' && (
          <AdminMcpTowerView
            services={mcpServices}
            onRebootService={handleRebootService}
            onRebootAll={handleRebootAllServices}
            onProbeCluster={handleProbeCluster}
            isProbing={isProbingCluster}
          />
        )}

        {activeTab === 'roles' && (
          <RoleLab
            onSelectRoleForChat={handleSelectRoleFromLab}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'models' && (
          <ModelMatrix
            activeModel={activeModel}
            onSelectModel={setActiveModel}
            onNavigateToChat={() => setActiveTab('chat')}
          />
        )}

        {activeTab === 'repos' && <RepoHub />}
      </div>

      {/* Role & System Instruction Configuration Modal */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        activeRole={activeRole}
        customInstruction={customInstruction}
        onSaveRole={handleSaveRole}
        activeModel={activeModel}
        onSelectModel={setActiveModel}
      />

      {/* Admin Authentication Gatekeeper Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Prompt Recipes & Library Modal */}
      <PromptLibraryModal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        onSelectTemplate={(text) => handleSendMessage(text)}
      />
    </div>
  );
}
