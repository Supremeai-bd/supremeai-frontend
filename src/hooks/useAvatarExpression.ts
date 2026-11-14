import { useMemo } from 'react';

export type AvatarExpression = 'happy' | 'thinking' | 'neutral';

export interface UseAvatarExpressionOptions {
  streamingContent?: string;
  isStreaming?: boolean;
  voiceText?: string;
  isConnecting?: boolean;
}

export interface AvatarExpressionResult {
  expression: AvatarExpression;
  expressionClass: string;
  matchedKeywords: string[];
}

const HAPPY_KEYWORDS = [
  'great',
  'awesome',
  'excellent',
  'happy',
  'glad',
  'wonderful',
  'love',
  'fantastic',
  'amazing',
  'perfect',
  'success',
  'succeeded',
  'congrats',
  'congratulations',
  'welcome',
  'brilliant',
  'cheer',
  'celebrate',
  'delighted',
  'thank',
  'thanks',
  'solved',
  'fixed',
  'ready',
  'yay',
  'nice',
  'good job',
  'well done',
];

const THINKING_KEYWORDS = [
  'thinking',
  'think',
  'let me',
  'analyz',
  'consider',
  'checking',
  'check',
  'evaluat',
  'calculat',
  'research',
  'investigat',
  'synthesiz',
  'initializing',
  'step by step',
  'hypothesis',
  'perhaps',
  'maybe',
  'ponder',
  'reason',
  'because',
  'therefore',
  'inspect',
  'debugging',
  'debug',
  'hmm',
  'wait',
  'comparing',
];

/**
 * Analyzes sentiment and cognitive cues from streaming chat/voice text via
 * keyword matching and maps it to deterministic CSS avatar expression states.
 */
export function useAvatarExpression(
  streamingContentOrOptions?: string | UseAvatarExpressionOptions,
  isStreamingArg = false
): AvatarExpressionResult {
  const options: UseAvatarExpressionOptions =
    typeof streamingContentOrOptions === 'string'
      ? { streamingContent: streamingContentOrOptions, isStreaming: isStreamingArg }
      : streamingContentOrOptions || {};

  const content = (options.voiceText || options.streamingContent || '').trim();
  const isStreaming = Boolean(options.isStreaming);
  const isConnecting = Boolean(options.isConnecting);

  return useMemo(() => {
    const normalized = content.toLowerCase();

    if (isConnecting) {
      return {
        expression: 'thinking',
        expressionClass: 'avatar-expression-thinking',
        matchedKeywords: ['connecting'],
      };
    }

    if (!normalized) {
      if (isStreaming) {
        return {
          expression: 'thinking',
          expressionClass: 'avatar-expression-thinking',
          matchedKeywords: ['streaming-init'],
        };
      }
      return {
        expression: 'neutral',
        expressionClass: 'avatar-expression-neutral',
        matchedKeywords: [],
      };
    }

    // Focus slightly more weight on the most recent clause so expression shifts dynamically mid-stream
    const recentTail = normalized.slice(-320);

    const happyMatches = HAPPY_KEYWORDS.filter((kw) => recentTail.includes(kw));
    const thinkingMatches = THINKING_KEYWORDS.filter((kw) => recentTail.includes(kw));

    let happyScore = happyMatches.length * 2;
    let thinkingScore = thinkingMatches.length * 2;

    if (recentTail.includes('!')) happyScore += 1;
    if (recentTail.includes('?') || recentTail.includes('...')) thinkingScore += 1;
    if (isStreaming && normalized.length < 36) thinkingScore += 1;

    if (happyScore > 0 && happyScore >= thinkingScore) {
      return {
        expression: 'happy',
        expressionClass: 'avatar-expression-happy',
        matchedKeywords: happyMatches,
      };
    }

    if (thinkingScore > 0) {
      return {
        expression: 'thinking',
        expressionClass: 'avatar-expression-thinking',
        matchedKeywords: thinkingMatches,
      };
    }

    return {
      expression: 'neutral',
      expressionClass: 'avatar-expression-neutral',
      matchedKeywords: [],
    };
  }, [content, isStreaming, isConnecting]);
}
