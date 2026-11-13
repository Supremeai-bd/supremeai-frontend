import { ChatMessage, ModelDetail } from '../types';
import { env } from '../config/env';

export interface ChatStreamOptions {
  model: string;
  messages: ChatMessage[];
  sessionId?: string;
  systemInstruction?: string;
  groundingContext?: string;
  deepResearch?: boolean;
  stream?: boolean;
  userContext?: {
    email?: string;
    role?: 'admin' | 'user';
    tier?: 'Free' | 'Pro' | 'Enterprise';
  };
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onDone: (fullText: string) => void;
  onError: (err: Error) => void;
}

export const chatService = {
  async streamChat(options: ChatStreamOptions): Promise<void> {
    const {
      model,
      messages,
      sessionId,
      systemInstruction,
      groundingContext,
      deepResearch = false,
      stream = true,
      userContext,
      signal,
      onChunk,
      onDone,
      onError,
    } = options;

    try {
      const token = localStorage.getItem('supremeai_access_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['X-SupremeAI-Key'] = token;
      }

      // Format messages including optional system instructions and grounding context
      const formattedMessages: { role: string; content: string }[] = [];
      if (systemInstruction?.trim()) {
        formattedMessages.push({ role: 'system', content: systemInstruction.trim() });
      }
      if (groundingContext?.trim()) {
        formattedMessages.push({
          role: 'system',
          content: `Grounding Knowledge Context:\n${groundingContext.trim()}`,
        });
      }
      for (const m of messages) {
        formattedMessages.push({
          role: m.role,
          content: m.content,
        });
      }

      // Extract latest user prompt for backend contract compliance (ChatStreamRequest expects prompt/message)
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const promptText = lastUserMsg?.content || messages[messages.length - 1]?.content || '';

      // Transparent model resolution from SupremeAI native model to backend provider engine
      const resolveBackendModel = (id: string): string => {
        switch (id) {
          case 'supreme-reason':
            return 'gemini-2.5-pro';
          case 'supreme-spark':
            return 'gemini-2.5-flash';
          case 'supreme-deep':
            return 'gemini-2.5-pro';
          case 'supreme-core':
          default:
            return 'auto';
        }
      };

      const backendModel = resolveBackendModel(model);

      // Live backend route on deployed gateway: /api/v1/stream/chat
      const response = await fetch(`${env.apiBaseUrl}/api/v1/stream/chat`, {
        method: 'POST',
        headers,
        signal,
        body: JSON.stringify({
          prompt: promptText,
          message: promptText,
          session_id: sessionId,
          model: backendModel,
          task_type: deepResearch ? 'deep_research' : 'chat',
          messages: formattedMessages,
          stream: true,
          deepResearch,
          userContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.detail ||
          errorData.error ||
          errorData.message ||
          `Server error: ${response.status} ${response.statusText}`;
        throw new Error(errorMsg);
      }

      if (!response.body) {
        throw new Error('No readable response body received from SupremeAI inference gateway.');
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
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                const errDetail =
                  typeof parsed.error === 'object'
                    ? parsed.error.message || JSON.stringify(parsed.error)
                    : String(parsed.error);
                throw new Error(errDetail);
              }
              // Standard OpenAI/Gateway SSE delta chunk: parsed.choices[0].delta.content
              // Fallback legacy proxy chunk: parsed.text
              const chunk = parsed.choices?.[0]?.delta?.content ?? parsed.text ?? '';
              if (chunk) {
                accumulatedText += chunk;
                onChunk(chunk);
              }
            } catch (jsonErr: any) {
              if (jsonErr.message && !jsonErr.message.includes('JSON')) {
                throw jsonErr;
              }
              // Non-json SSE data frame ignored safely
            }
          }
        }
      }

      onDone(accumulatedText);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Stream aborted by user
        return;
      }
      onError(err instanceof Error ? err : new Error('Chat streaming failed'));
    }
  },
};
