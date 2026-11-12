import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
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
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
      server: { middlewareMode: true },
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
