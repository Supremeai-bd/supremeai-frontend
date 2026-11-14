import { useMemo } from 'react';

export type AvatarExpression = 'joyful' | 'analytical' | 'happy' | 'thinking' | 'neutral';

export interface UseAvatarExpressionOptions {
  streamingContent?: string;
  isStreaming?: boolean;
  voiceText?: string;
  latestAssistantContent?: string;
  isConnecting?: boolean;
}

export interface AvatarExpressionResult {
  expression: AvatarExpression;
  expressionClass: string;
  intensity: number;
  matchedKeywords: string[];
}

const JOYFUL_KEYWORDS = [
  'great',
  'awesome',
  'excellent',
  'happy',
  'joy',
  'joyful',
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
  'excited',
  'thrilled',
  'enjoy',
  'pleased',
  'beautiful',
  'hurray',
  'smoothly',
  'appreciate',
];

const JOYFUL_EMOJIS = ['🎉', '✨', '😊', '😄', '🥳', '🚀', '❤️', '👍', '🌟', '🙌'];

const ANALYTICAL_KEYWORDS = [
  'algorithm',
  'architecture',
  'benchmark',
  'complexity',
  'compile',
  'compiler',
  'config',
  'configuration',
  'database',
  'debug',
  'debugging',
  'deployment',
  'distribution',
  'docker',
  'endpoint',
  'equation',
  'exception',
  'function',
  'implementation',
  'index',
  'interface',
  'javascript',
  'json',
  'kubernetes',
  'latency',
  'matrix',
  'memory',
  'metrics',
  'middleware',
  'parameter',
  'payload',
  'performance',
  'pipeline',
  'postgres',
  'protocol',
  'python',
  'query',
  'refactor',
  'regex',
  'runtime',
  'schema',
  'sql',
  'stack trace',
  'syntax',
  'telemetry',
  'throughput',
  'token',
  'typescript',
  'variance',
  'vector',
  'websocket',
];

const CODE_SYNTAX_PATTERNS: Array<{ label: string; regex: RegExp; weight: number }> = [
  { label: 'code-fence', regex: /```[\s\S]*?/, weight: 5 },
  { label: 'inline-code', regex: /`[^`\n]{2,}`/, weight: 2 },
  {
    label: 'code-keywords',
    regex: /\b(const|let|var|function|async|await|import|export|interface|type|class|def|return|SELECT|FROM|WHERE)\b/,
    weight: 3,
  },
  { label: 'arrow-or-strict-op', regex: /=>|===|!==|\b0x[0-9a-f]+\b/i, weight: 2 },
  { label: 'api-path', regex: /\/api\/[a-z0-9/_-]+/i, weight: 2 },
  { label: 'json-structure', regex: /\{\s*"[a-z0-9_-]+"\s*:/i, weight: 3 },
  { label: 'markdown-table', regex: /\|[\s:-]{3,}\|/, weight: 3 },
  { label: 'big-o', regex: /O\((1|n|log n|n log n|n\^2)\)/i, weight: 3 },
];

const THINKING_KEYWORDS = [
  'thinking',
  'think',
  'let me',
  'consider',
  'checking',
  'check',
  'evaluat',
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
  'hmm',
  'wait',
  'comparing',
];

/**
 * Analyzes sentiment, conversational warmth, and technical/code cues from the
 * active AI response (streaming, live voice transcript, or latest assistant reply)
 * and maps it to expressive avatar states ('joyful', 'analytical', 'thinking', 'neutral').
 */
export function useAvatarExpression(
  streamingContentOrOptions?: string | UseAvatarExpressionOptions,
  isStreamingArg = false
): AvatarExpressionResult {
  const options: UseAvatarExpressionOptions =
    typeof streamingContentOrOptions === 'string'
      ? { streamingContent: streamingContentOrOptions, isStreaming: isStreamingArg }
      : streamingContentOrOptions || {};

  const primaryStream = (options.streamingContent || '').trim();
  const voiceTranscript = (options.voiceText || '').trim();
  const latestReply = (options.latestAssistantContent || '').trim();
  const content = primaryStream || voiceTranscript || latestReply;
  const isStreaming = Boolean(options.isStreaming);
  const isConnecting = Boolean(options.isConnecting);

  return useMemo(() => {
    const normalized = content.toLowerCase();

    if (isConnecting) {
      return {
        expression: 'thinking',
        expressionClass: 'avatar-expression-thinking',
        intensity: 0.65,
        matchedKeywords: ['connecting'],
      };
    }

    if (!normalized) {
      if (isStreaming) {
        return {
          expression: 'thinking',
          expressionClass: 'avatar-expression-thinking',
          intensity: 0.6,
          matchedKeywords: ['streaming-init'],
        };
      }
      return {
        expression: 'neutral',
        expressionClass: 'avatar-expression-neutral',
        intensity: 0,
        matchedKeywords: [],
      };
    }

    // Evaluate both the overall response structure (code blocks/tables) and recent clause
    const recentTail = normalized.slice(-420);
    const fullCheckWindow = normalized.slice(-1800);
    const rawTail = content.slice(-420);

    const joyfulMatches = JOYFUL_KEYWORDS.filter((kw) => recentTail.includes(kw));
    const joyfulEmojiMatches = JOYFUL_EMOJIS.filter((emoji) => rawTail.includes(emoji));
    const analyticalKeywordMatches = ANALYTICAL_KEYWORDS.filter((kw) =>
      recentTail.includes(kw)
    );
    const codePatternMatches: string[] = [];
    let codeScore = 0;

    for (const pattern of CODE_SYNTAX_PATTERNS) {
      if (pattern.regex.test(fullCheckWindow)) {
        codePatternMatches.push(pattern.label);
        codeScore += pattern.weight;
      }
    }

    const thinkingMatches = THINKING_KEYWORDS.filter((kw) => recentTail.includes(kw));

    let joyfulScore = joyfulMatches.length * 2 + joyfulEmojiMatches.length * 2;
    let analyticalScore = analyticalKeywordMatches.length * 2 + codeScore;
    let thinkingScore = thinkingMatches.length * 2;

    if (recentTail.includes('!')) joyfulScore += 1;
    if ((recentTail.match(/!/g) || []).length >= 2) joyfulScore += 1;

    // Quantitative / numeric telemetry density boosts analytical recognition
    const numericTokens = recentTail.match(/\b\d+(\.\d+)?\s*(ms|s|%|kb|mb|gb|hz|fps|rows|ops)\b/gi);
    if (numericTokens && numericTokens.length > 0) {
      analyticalScore += Math.min(4, numericTokens.length * 2);
      codePatternMatches.push('numeric-metrics');
    }

    if (recentTail.includes('?') || recentTail.includes('...')) thinkingScore += 1;
    if (isStreaming && normalized.length < 36 && codeScore === 0) thinkingScore += 1;

    // Prioritize analytical when code or substantial technical data is generated
    if (analyticalScore >= 3 && analyticalScore >= joyfulScore) {
      const intensity = Math.min(1, 0.45 + analyticalScore * 0.08);
      return {
        expression: 'analytical',
        expressionClass: 'avatar-expression-analytical',
        intensity,
        matchedKeywords: [...codePatternMatches, ...analyticalKeywordMatches],
      };
    }

    if (joyfulScore > 0 && joyfulScore >= thinkingScore) {
      const intensity = Math.min(1, 0.45 + joyfulScore * 0.1);
      return {
        expression: 'joyful',
        expressionClass: 'avatar-expression-joyful',
        intensity,
        matchedKeywords: [...joyfulMatches, ...joyfulEmojiMatches],
      };
    }

    if (analyticalScore > 0 && analyticalScore >= thinkingScore) {
      const intensity = Math.min(1, 0.4 + analyticalScore * 0.1);
      return {
        expression: 'analytical',
        expressionClass: 'avatar-expression-analytical',
        intensity,
        matchedKeywords: [...codePatternMatches, ...analyticalKeywordMatches],
      };
    }

    if (thinkingScore > 0) {
      const intensity = Math.min(1, 0.4 + thinkingScore * 0.1);
      return {
        expression: 'thinking',
        expressionClass: 'avatar-expression-thinking',
        intensity,
        matchedKeywords: thinkingMatches,
      };
    }

    return {
      expression: 'neutral',
      expressionClass: 'avatar-expression-neutral',
      intensity: 0,
      matchedKeywords: [],
    };
  }, [content, isStreaming, isConnecting]);
}

