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

      const streamEndpoint = `${env.apiBaseUrl}/api/v1/stream/chat`;

      // Live backend route on deployed gateway: /api/v1/stream/chat
      const response = await fetch(streamEndpoint, {
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
        const rawErrText = await response.text().catch(() => '');
        let errorData: any = {};
        try {
          errorData = rawErrText ? JSON.parse(rawErrText) : {};
        } catch {
          errorData = {};
        }
        const extractedMsg =
          errorData.detail ||
          errorData.error ||
          errorData.message ||
          (rawErrText && rawErrText.length < 240 ? rawErrText.trim() : '');
        const errorMsg =
          response.status === 500
            ? `Upstream API Gateway returned HTTP 500 (${extractedMsg || 'Internal Server Error'}).`
            : extractedMsg || `Server error: ${response.status} ${response.statusText}`;
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
            let frameError: string | null = null;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                frameError =
                  typeof parsed.error === 'object'
                    ? parsed.error.message || JSON.stringify(parsed.error)
                    : String(parsed.error);
              } else {
                // Standard OpenAI/Gateway SSE delta chunk: parsed.choices[0].delta.content
                // Fallback legacy proxy chunk: parsed.text
                const chunk = parsed.choices?.[0]?.delta?.content ?? parsed.text ?? '';
                if (chunk) {
                  accumulatedText += chunk;
                  onChunk(chunk);
                }
              }
            } catch {
              // Non-json SSE data frame ignored safely
            }
            if (frameError) {
              throw new Error(frameError);
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

      const errMsg = err instanceof Error ? err.message : String(err);
      const isFetchNetworkFailure =
        /failed to fetch|networkerror|load failed|err_blocked_by_client|network error|http2/i.test(errMsg) ||
        (err instanceof TypeError && /fetch|network|stream|body/i.test(errMsg));

      if (isFetchNetworkFailure) {
        let sameOriginHealthy = false;
        let isLocalStudioServer = false;
        try {
          const probeCtrl = new AbortController();
          const probeTimer = setTimeout(() => probeCtrl.abort(), 2500);
          const probeRes = await fetch('/api/health', {
            method: 'GET',
            cache: 'no-store',
            signal: probeCtrl.signal,
          });
          clearTimeout(probeTimer);
          sameOriginHealthy = probeRes.ok;
          if (probeRes.ok) {
            const probeJson = await probeRes.json().catch(() => null);
            isLocalStudioServer = probeJson?.app === 'SupremeAI Studio';
          }
        } catch {
          sameOriginHealthy = false;
        }

        // In AI Studio preview, if the SSE transport was interrupted mid-proxy, fall back once to JSON /api/chat
        if (isLocalStudioServer) {
          try {
            const fallbackRes = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal,
              body: JSON.stringify({
                model,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                systemInstruction,
                groundingContext,
                stream: false,
                userContext,
              }),
            });
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const text = String(fallbackData?.text || '');
              if (text) {
                onChunk(text);
                onDone(text);
                return;
              }
            }
          } catch {
            // Fall through to accurate diagnostic message below
          }
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          onError(new Error('Network offline. Please check your internet connection and try again.'));
          return;
        }

        const wasCrossOriginBlocked =
          !sameOriginHealthy ||
          /err_blocked_by_client/i.test(errMsg) ||
          Boolean(env.apiBaseUrl && typeof window !== 'undefined' && !env.apiBaseUrl.startsWith(window.location.origin));

        if (wasCrossOriginBlocked) {
          onError(
            new Error(
              'Network request blocked. If you are using an Ad-blocker or Privacy extension, please pause it for this site.'
            )
          );
          return;
        }

        onError(
          new Error(
            `Streaming transport error on /api/v1/stream/chat (${errMsg || 'connection reset'}). Same-origin /api/health is reachable.`
          )
        );
        return;
      }

      onError(err instanceof Error ? err : new Error('Chat streaming failed'));
    }
  },
};
