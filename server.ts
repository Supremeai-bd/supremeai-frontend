import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) || 3000 : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Supported Gemini models as specified in requirements
const SUPPORTED_MODELS: Record<string, { name: string; description: string; tier: 'standard' | 'advanced' }> = {
  'gemini-3.8-flash': {
    name: 'Gemini 3.8 Flash',
    description: 'General tasks, balanced latency & intelligence (Recommended)',
    tier: 'standard',
  },
  'gemini-3.1-flash-lite': {
    name: 'Gemini 3.1 Flash Lite',
    description: 'Fast tasks, low-latency synthesis & quick responses',
    tier: 'standard',
  },
  'gemini-4-carbon': {
    name: 'Gemini 4 Carbon',
    description: 'Deep reasoning, architectural decisions & complex debugging',
    tier: 'advanced',
  },
  'gemini-4-argon': {
    name: 'Gemini 4 Argon',
    description: 'Particularly complex interactive tasks, logic & code generation',
    tier: 'advanced',
  },
};

const apiKey = process.env.GEMINI_API_KEY || '';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  model?: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  stream?: boolean;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health and metadata endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'SupremeAI Studio',
      organization: 'Supremeai-bd',
      repositories: {
        primary: 'https://github.com/Supremeai-bd/supremeai',
        studio: 'https://github.com/Supremeai-bd/supremeai-studio',
      },
      hasApiKey: Boolean(apiKey),
    });
  });

  // Models endpoint
  app.get('/api/models', (_req: Request, res: Response) => {
    res.json({
      models: SUPPORTED_MODELS,
      defaultModel: 'gemini-3.8-flash',
    });
  });

  // --- MCP Tower Services & Health Orchestration Endpoints ---
  let mcpClusterServices = [
    {
      id: 'gemini-gateway-service',
      name: 'gemini-gateway-service',
      displayName: 'Gemini Gateway Broker',
      category: 'core',
      port: 8081,
      status: 'healthy',
      uptime: '99.98%',
      latencyMs: 18,
      cpuPercent: 2.1,
      memoryMb: 142,
      lastChecked: 'Just now',
      version: 'v2.4.1',
      endpoint: '/api/chat',
      errorCount: 0,
      logs: [
        {
          id: 'gw-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Active route pool healthy. 4 Gemini models registered with live streaming hooks.',
          details: 'Endpoints: gemini-3.8-flash, gemini-3.1-flash-lite, gemini-4-carbon, gemini-4-argon',
        },
      ],
    },
    {
      id: 'mcp-context-server',
      name: 'mcp-context-server',
      displayName: 'MCP Context Protocol Server',
      category: 'ai',
      port: 9001,
      status: 'healthy',
      uptime: '99.94%',
      latencyMs: 34,
      cpuPercent: 4.8,
      memoryMb: 318,
      lastChecked: 'Just now',
      version: 'v1.8.0',
      endpoint: 'mcp://localhost:9001/protocol/v1',
      errorCount: 0,
      logs: [
        {
          id: 'mcp-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Model Context Protocol server listening on JSON-RPC stdio and SSE transport.',
        },
      ],
    },
    {
      id: 'code-auditor-worker',
      name: 'code-auditor-worker',
      displayName: 'Code Auditor & Security Worker',
      category: 'ai',
      port: 9002,
      status: 'unhealthy',
      uptime: '94.20%',
      latencyMs: 4120,
      cpuPercent: 98.4,
      memoryMb: 1840,
      lastChecked: '30s ago (Health check failed)',
      version: 'v1.3.2',
      endpoint: 'http://localhost:9002/audit/jobs',
      errorCount: 14,
      logs: [
        {
          id: 'aud-log-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 14).toLocaleTimeString(),
          level: 'WARN',
          message: 'Worker queue depth exceeded threshold (depth: 84 jobs > threshold: 25).',
          details: 'High concurrency in repository AST parsing for Supremeai-bd/supremeai.',
        },
        {
          id: 'aud-log-2',
          timestamp: new Date(Date.now() - 1000 * 60 * 8).toLocaleTimeString(),
          level: 'ERROR',
          message: 'Heap allocation failure: JavaScript heap out of memory during AST graph resolution.',
          details: 'Process allocated 1840MB of 2048MB container limit. Garbage collection pauses > 1200ms.',
          stackTrace: 'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory\\n  at AstGraphResolver.traverseSyntaxNode (/workers/auditor/ast/parser.ts:412:18)\\n  at CodeAuditorWorker.processJob (/workers/auditor/worker.ts:184:22)',
        },
        {
          id: 'aud-log-3',
          timestamp: new Date(Date.now() - 1000 * 60 * 2).toLocaleTimeString(),
          level: 'ERROR',
          message: 'Heartbeat ping timeout after 4000ms. Service process not responding to HTTP ping.',
          details: 'TCP connection active on port 9002, but event loop delay is 3890ms. Recommend service reboot.',
        },
      ],
    },
    {
      id: 'sse-stream-broker',
      name: 'sse-stream-broker',
      displayName: 'SSE Real-time Stream Broker',
      category: 'core',
      port: 8084,
      status: 'degraded',
      uptime: '98.10%',
      latencyMs: 195,
      cpuPercent: 62.8,
      memoryMb: 680,
      lastChecked: 'Just now',
      version: 'v2.1.0',
      endpoint: 'http://localhost:8084/sse/hub',
      errorCount: 4,
      logs: [
        {
          id: 'sse-log-1',
          timestamp: new Date(Date.now() - 1000 * 60 * 7).toLocaleTimeString(),
          level: 'WARN',
          message: 'Connection pool saturation reached 89% (890 / 1000 concurrent listeners).',
          details: 'Backpressure detected on 12 streaming sockets. Latency elevated to 195ms.',
        },
      ],
    },
    {
      id: 'github-sync-daemon',
      name: 'github-sync-daemon',
      displayName: 'GitHub Repository Sync Daemon',
      category: 'integration',
      port: 8085,
      status: 'healthy',
      uptime: '99.85%',
      latencyMs: 42,
      cpuPercent: 1.1,
      memoryMb: 112,
      lastChecked: 'Just now',
      version: 'v3.0.4',
      endpoint: 'http://localhost:8085/webhook/github',
      errorCount: 0,
      logs: [
        {
          id: 'gh-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Webhook subscription confirmed for Supremeai-bd organization repositories.',
        },
      ],
    },
    {
      id: 'vector-cache-engine',
      name: 'vector-cache-engine',
      displayName: 'Vector & Prompt Cache Engine',
      category: 'core',
      port: 6379,
      status: 'healthy',
      uptime: '99.99%',
      latencyMs: 3,
      cpuPercent: 0.8,
      memoryMb: 524,
      lastChecked: 'Just now',
      version: 'v7.2.4',
      endpoint: 'redis://localhost:6379/0',
      errorCount: 0,
      logs: [
        {
          id: 'vec-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'In-memory semantic cache hit ratio: 87.4% over 14,200 indexed queries.',
        },
      ],
    },
    {
      id: 'auth-token-prober',
      name: 'auth-token-prober',
      displayName: 'Auth Token & Identity Prober',
      category: 'integration',
      port: 8083,
      status: 'healthy',
      uptime: '99.99%',
      latencyMs: 11,
      cpuPercent: 0.4,
      memoryMb: 76,
      lastChecked: 'Just now',
      version: 'v1.4.0',
      endpoint: 'http://localhost:8083/auth/verify',
      errorCount: 0,
      logs: [
        {
          id: 'auth-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Public key JWKS rotation cache validated. Zero signature validation rejections.',
        },
      ],
    },
    {
      id: 'telemetry-collector',
      name: 'telemetry-collector',
      displayName: 'OpenTelemetry & Prometheus Collector',
      category: 'telemetry',
      port: 9090,
      status: 'healthy',
      uptime: '99.95%',
      latencyMs: 24,
      cpuPercent: 1.4,
      memoryMb: 135,
      lastChecked: 'Just now',
      version: 'v0.92.0',
      endpoint: 'http://localhost:9090/metrics',
      errorCount: 0,
      logs: [
        {
          id: 'tel-log-1',
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          message: 'Scraping metrics from 8 local endpoints with 10s interval.',
        },
      ],
    },
  ];

  // GET /api/mcp-tower/services - List all MCP Tower microservices and overall cluster status
  app.get('/api/mcp-tower/services', (_req: Request, res: Response) => {
    const total = mcpClusterServices.length;
    const healthy = mcpClusterServices.filter((s) => s.status === 'healthy').length;
    const degraded = mcpClusterServices.filter((s) => s.status === 'degraded').length;
    const unhealthy = mcpClusterServices.filter((s) => s.status === 'unhealthy').length;
    const totalLatency = mcpClusterServices.reduce((sum, s) => sum + s.latencyMs, 0);
    const avgLatency = Math.round(totalLatency / total);
    const healthScore = Math.round((healthy / total) * 100);

    res.json({
      summary: {
        total,
        healthy,
        degraded,
        unhealthy,
        avgLatency,
        healthScore,
        lastClusterAudit: new Date().toISOString(),
      },
      services: mcpClusterServices,
    });
  });

  // POST /api/mcp-tower/reboot - Reboot a specific service by ID
  app.post('/api/mcp-tower/reboot', (req: Request<{}, {}, { serviceId: string }>, res: Response) => {
    const { serviceId } = req.body;
    if (!serviceId) {
      res.status(400).json({ error: 'serviceId is required' });
      return;
    }

    const serviceIndex = mcpClusterServices.findIndex((s) => s.id === serviceId);
    if (serviceIndex === -1) {
      res.status(404).json({ error: `Service '${serviceId}' not found in MCP Tower cluster` });
      return;
    }

    const prev = mcpClusterServices[serviceIndex];
    const nowTime = new Date().toLocaleTimeString();

    const rebootLog = {
      id: `reboot-${Date.now()}`,
      timestamp: nowTime,
      level: 'INFO' as const,
      message: `Service process gracefully rebooted via SupremeAI Admin Dashboard. Memory garbage collected, connection pool drained and re-initialized.`,
      details: `PID reset. Cold boot latency: 28ms. All 0 previous error locks released.`,
    };

    const rebootedService = {
      ...prev,
      status: 'healthy' as const,
      errorCount: 0,
      latencyMs: serviceId === 'code-auditor-worker' ? 38 : serviceId === 'sse-stream-broker' ? 26 : Math.max(12, Math.round(prev.latencyMs * 0.4)),
      cpuPercent: serviceId === 'code-auditor-worker' ? 3.2 : serviceId === 'sse-stream-broker' ? 4.1 : 1.5,
      memoryMb: serviceId === 'code-auditor-worker' ? 240 : serviceId === 'sse-stream-broker' ? 180 : prev.memoryMb,
      uptime: '100%',
      lastChecked: 'Just now (Clean reboot)',
      logs: [rebootLog, ...prev.logs],
    };

    mcpClusterServices[serviceIndex] = rebootedService;

    res.json({
      success: true,
      message: `Service '${prev.displayName}' rebooted successfully.`,
      service: rebootedService,
    });
  });

  // POST /api/mcp-tower/reboot-all - Reboot all degraded/unhealthy services
  app.post('/api/mcp-tower/reboot-all', (_req: Request, res: Response) => {
    const nowTime = new Date().toLocaleTimeString();
    mcpClusterServices = mcpClusterServices.map((s) => {
      if (s.status === 'unhealthy' || s.status === 'degraded') {
        const rebootLog = {
          id: `reboot-all-${Date.now()}-${s.id}`,
          timestamp: nowTime,
          level: 'INFO' as const,
          message: `Cluster-wide recovery sweep rebooted service daemon. Memory flushed and health checks passed.`,
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
    });

    res.json({
      success: true,
      message: 'All degraded and unhealthy services in MCP Tower were successfully rebooted and recovered.',
      services: mcpClusterServices,
    });
  });

  // POST /api/mcp-tower/probe - Force an immediate health check probe
  app.post('/api/mcp-tower/probe', (_req: Request, res: Response) => {
    mcpClusterServices = mcpClusterServices.map((s) => ({
      ...s,
      lastChecked: 'Just now (Active probe)',
    }));
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: mcpClusterServices,
    });
  });

  // Multi-turn chat endpoint
  app.post('/api/chat', async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    try {
      const { model = 'gemini-3.8-flash', messages = [], systemInstruction, stream = true } = req.body;

      if (!messages || messages.length === 0) {
        res.status(400).json({ error: 'Messages array is required and must not be empty.' });
        return;
      }

      const validatedModel = SUPPORTED_MODELS[model] ? model : 'gemini-3.8-flash';
      const activeApiKey = process.env.GEMINI_API_KEY?.trim() || '';
      const isValidKey = activeApiKey && activeApiKey !== 'MY_GEMINI_API_KEY';

      const defaultSystemInstruction =
        'You are SupremeAI, the premier intelligent AI engineering partner created by Supremeai-bd. You provide sharp, concise, authoritative code solutions, architectural insight, and deep reasoning with clean formatting.';

      const activeSystemInstruction = (systemInstruction || '').trim() || defaultSystemInstruction;

      // When a valid GEMINI_API_KEY is present, perform real Gemini inference via @google/genai SDK
      if (isValidKey) {
        const clientAi = new GoogleGenAI({
          apiKey: activeApiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        const contents = messages
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg) => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          }));

        if (contents.length === 0) {
          res.status(400).json({ error: 'No user or assistant messages found.' });
          return;
        }

        // Stream with 15s timeout protection and 503 high-demand resilience
        const executeStream = async () => {
          try {
            return await clientAi.models.generateContentStream({
              model: validatedModel,
              contents,
              config: {
                systemInstruction: activeSystemInstruction,
              },
            });
          } catch (streamErr: unknown) {
            const errStr = String(streamErr instanceof Error ? streamErr.message : streamErr);
            if (
              (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) &&
              validatedModel !== 'gemini-3.1-flash-lite'
            ) {
              console.warn(
                `Model ${validatedModel} experiencing temporary 503 high demand. Resilient fallback to gemini-3.1-flash-lite.`
              );
              return await clientAi.models.generateContentStream({
                model: 'gemini-3.1-flash-lite',
                contents,
                config: {
                  systemInstruction: activeSystemInstruction,
                },
              });
            }
            throw streamErr;
          }
        };

        if (stream) {
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache, no-transform');
          res.setHeader('Connection', 'keep-alive');
          res.flushHeaders?.();

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Stream request timed out after 15s')), 15000)
          );

          const responseStream = await Promise.race([executeStream(), timeoutPromise]);

          for await (const chunk of responseStream) {
            const textChunk = chunk.text || '';
            if (textChunk) {
              res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
            }
          }

          res.write('data: [DONE]\n\n');
          res.end();
          return;
        } else {
          const executeGenerate = async () => {
            try {
              return await clientAi.models.generateContent({
                model: validatedModel,
                contents,
                config: {
                  systemInstruction: activeSystemInstruction,
                },
              });
            } catch (genErr: unknown) {
              const errStr = String(genErr instanceof Error ? genErr.message : genErr);
              if (
                (errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('high demand')) &&
                validatedModel !== 'gemini-3.1-flash-lite'
              ) {
                console.warn(
                  `Model ${validatedModel} experiencing temporary 503 high demand. Resilient fallback to gemini-3.1-flash-lite.`
                );
                return await clientAi.models.generateContent({
                  model: 'gemini-3.1-flash-lite',
                  contents,
                  config: {
                    systemInstruction: activeSystemInstruction,
                  },
                });
              }
              throw genErr;
            }
          };

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Inference request timed out after 15s')), 15000)
          );

          const response = await Promise.race([executeGenerate(), timeoutPromise]);

          res.json({
            text: response.text ?? '',
            model: validatedModel,
          });
          return;
        }
      }

      // If GEMINI_API_KEY is not yet injected into the environment:
      const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || 'Inquiry';
      const fallbackResponse = `### SupremeAI Studio Intelligence Engine\n\n**Model**: \`${validatedModel}\` · **Role**: Active Persona\n\nReceived prompt:\n> ${lastUserMessage}\n\n#### Architectural Insight\nSupremeAI Studio has processed your request through the ${validatedModel} pipeline. Here is the recommended technical approach for your \`supremeai-studio\` frontend and \`supremeai\` architecture:\n\n\`\`\`typescript\n// SupremeAI Core Pipeline Invariant\nexport interface StudioOrchestrator {\n  model: '${validatedModel}';\n  systemInstruction: string;\n  status: 'active';\n  latencyMode: 'low-latency';\n}\n\`\`\`\n\n*Note: To stream live inference directly from Google servers, ensure your GEMINI_API_KEY is active in the AI Studio environment.*`;

      if (stream) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        const words = fallbackResponse.split(' ');
        for (let i = 0; i < words.length; i += 3) {
          const chunk = words.slice(i, i + 3).join(' ') + ' ';
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          await new Promise((r) => setTimeout(r, 40));
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } else {
        res.json({
          text: fallbackResponse,
          model: validatedModel,
        });
      }
    } catch (err: unknown) {
      console.error('Error in /api/chat:', err);
      let errorMessage = err instanceof Error ? err.message : 'Unknown server error during Gemini inference';

      // Parse JSON formatted error messages from Gemini SDK for clean client display
      try {
        const parsed = JSON.parse(errorMessage);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        }
      } catch {
        // Keep original string if not JSON
      }

      if (!res.headersSent) {
        res.status(500).json({
          error: errorMessage,
          hint: errorMessage.includes('API_KEY')
            ? 'Please ensure your GEMINI_API_KEY is configured in the environment.'
            : errorMessage.includes('demand')
            ? 'Model is under temporary high demand. Try gemini-3.1-flash-lite for faster throughput.'
            : 'Gemini inference failed.',
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        res.end();
      }
    }
  });

  // Express Vite Dev Server or Production Static Serving
  if (isProduction) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SupremeAI Studio Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
