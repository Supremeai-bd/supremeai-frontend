import { ChatMessage, ModelDetail } from '../types';
import { env } from '../config/env';

export interface ChatStreamOptions {
  model: string;
  messages: ChatMessage[];
  systemInstruction?: string;
  groundingContext?: string;
  stream?: boolean;
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
      systemInstruction,
      groundingContext,
      stream = true,
      signal,
      onChunk,
      onDone,
      onError,
    } = options;

    try {
      const response = await fetch(`${env.apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({
          model,
          systemInstruction,
          groundingContext,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            attachment: m.attachment,
          })),
          stream,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No readable response body received from Gemini inference proxy.');
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
                onChunk(parsed.text);
              }
            } catch {
              // Ignore non-json data frames
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
