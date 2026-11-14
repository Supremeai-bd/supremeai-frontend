import { ChatAttachment } from '../types';

const DEFAULT_TITLES = new Set([
  '',
  'new conversation',
  'new chat',
  'supremeai chat',
  'conversation',
  'untitled conversation',
]);

const PRESERVED_TECH_TERMS: Record<string, string> = {
  ai: 'AI',
  api: 'API',
  apis: 'APIs',
  aws: 'AWS',
  cd: 'CD',
  ci: 'CI',
  cli: 'CLI',
  cpu: 'CPU',
  css: 'CSS',
  db: 'DB',
  dlq: 'DLQ',
  dom: 'DOM',
  gcp: 'GCP',
  github: 'GitHub',
  gpu: 'GPU',
  graphql: 'GraphQL',
  html: 'HTML',
  http: 'HTTP',
  https: 'HTTPS',
  id: 'ID',
  ios: 'iOS',
  ip: 'IP',
  javascript: 'JavaScript',
  js: 'JS',
  json: 'JSON',
  jsx: 'JSX',
  jwt: 'JWT',
  llm: 'LLM',
  llms: 'LLMs',
  macos: 'macOS',
  mcp: 'MCP',
  ml: 'ML',
  nextjs: 'Next.js',
  'next.js': 'Next.js',
  nodejs: 'Node.js',
  'node.js': 'Node.js',
  npm: 'npm',
  oauth: 'OAuth',
  orm: 'ORM',
  pdf: 'PDF',
  postgres: 'Postgres',
  postgresql: 'PostgreSQL',
  pwa: 'PWA',
  rag: 'RAG',
  rbac: 'RBAC',
  redis: 'Redis',
  rest: 'REST',
  sdk: 'SDK',
  seo: 'SEO',
  sql: 'SQL',
  sse: 'SSE',
  ssh: 'SSH',
  svg: 'SVG',
  tailwind: 'Tailwind',
  ts: 'TS',
  tsx: 'TSX',
  typescript: 'TypeScript',
  ui: 'UI',
  url: 'URL',
  useeffect: 'useEffect',
  usestate: 'useState',
  usememo: 'useMemo',
  useref: 'useRef',
  ux: 'UX',
  vite: 'Vite',
  vm: 'VM',
  webgl: 'WebGL',
  websocket: 'WebSocket',
  ws: 'WS',
  xml: 'XML',
  yaml: 'YAML',
};

const LOWERCASE_CONNECTORS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'into',
  'of',
  'on',
  'or',
  'the',
  'to',
  'vs',
  'via',
  'with',
]);

const CONVERSATIONAL_PREFIXES: RegExp[] = [
  /^(?:hey|hi|hello|yo|greetings|good\s+(?:morning|afternoon|evening))[\s,!.:-]*(?:there|assistant|supremeai|ai|gemini|team)?[\s,!.:-]*/i,
  /^(?:please|pls|kindly)\s+/i,
  /^(?:can|could|would|will)\s+you\s+(?:please\s+|kindly\s+)?(?:help\s+me\s+(?:to\s+|with\s+)?)?/i,
  /^(?:i\s+(?:need|want|would\s+like|'d\s+like)\s+(?:you\s+to\s+|help\s+(?:with|on)\s+|to\s+)?)/i,
  /^(?:help\s+me\s+(?:to\s+|with\s+)?)/i,
  /^(?:tell\s+me\s+(?:about\s+)?|explain\s+(?:to\s+me\s+)?(?:how\s+to\s+|what\s+is\s+|why\s+)?|show\s+me\s+(?:how\s+to\s+)?)/i,
  /^(?:give\s+me\s+(?:a|an|some)\s+)/i,
  /^(?:how\s+(?:do|can|should|would)\s+(?:i|we|you)\s+)/i,
  /^(?:what\s+(?:is|are)\s+(?:the\s+best\s+way\s+to\s+|the\s+|a\s+|an\s+)?)/i,
  /^(?:can\s+we\s+)/i,
];

export const isDefaultSessionTitle = (title?: string | null): boolean => {
  const normalized = (title || '').trim().toLowerCase();
  return DEFAULT_TITLES.has(normalized);
};

export const sanitizeChatTitle = (raw: string, maxLength: number = 44): string => {
  if (!raw) return '';

  const firstLine =
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0) || '';

  let cleaned = firstLine
    .replace(/^(?:title|topic|subject|summary|chat\s*title)\s*[:\-–—]\s*/i, '')
    .replace(/^[#>*\-\d.)\s]+/, '')
    .replace(/[`*_~"]/g, '')
    .replace(/^['‘’“”]+|['‘’“”]+$/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[.?!:;,\-–—]+$/g, '')
    .trim();

  if (!cleaned) return '';

  if (cleaned.length > maxLength) {
    const sliced = cleaned.slice(0, maxLength);
    const lastSpace = sliced.lastIndexOf(' ');
    cleaned = (lastSpace >= Math.floor(maxLength * 0.55) ? sliced.slice(0, lastSpace) : sliced).trim();
    cleaned = cleaned.replace(/[.?!:;,\-–—]+$/g, '').trim();
  }

  return cleaned;
};

const toSmartTitleCase = (input: string): string => {
  const words = input.split(/\s+/).filter(Boolean);
  return words
    .map((word, idx) => {
      const stripped = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9.+_-]+$/g, '');
      const lower = stripped.toLowerCase();
      const preserved = PRESERVED_TECH_TERMS[lower];
      if (preserved) {
        return word.replace(stripped, preserved);
      }

      // Preserve camelCase or PascalCase identifiers such as useEffect, ChatThread
      if (/[a-z][A-Z]/.test(stripped) || /^[A-Z0-9_-]{2,}$/.test(stripped)) {
        return word;
      }

      if (idx > 0 && idx < words.length - 1 && LOWERCASE_CONNECTORS.has(lower)) {
        return lower;
      }

      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const formatAttachmentTitle = (attachment: Pick<ChatAttachment, 'name' | 'mimeType'>): string => {
  const cleanName = attachment.name.replace(/\s+/g, ' ').trim();
  const baseName = cleanName.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || cleanName;
  const isImage = attachment.mimeType?.startsWith('image/');
  const prefix = isImage ? 'Image' : 'File';
  const combined = `${prefix}: ${toSmartTitleCase(baseName)}`;
  return sanitizeChatTitle(combined, 42) || `${prefix} Analysis`;
};

export const generateHeuristicChatTitle = (
  text: string,
  attachment?: Pick<ChatAttachment, 'name' | 'mimeType'> | null
): string => {
  const raw = (text || '').trim();
  if (!raw) {
    return attachment ? formatAttachmentTitle(attachment) : 'New Conversation';
  }

  // Extract language hint from fenced code blocks if the prompt is mostly code
  const codeBlockMatch = raw.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
  const textWithoutCode = raw.replace(/```[\s\S]*?```/g, ' ').replace(/\s+/g, ' ').trim();

  let working = textWithoutCode;
  if (!working && codeBlockMatch) {
    const lang = codeBlockMatch[1]?.trim();
    const langLabel = lang ? toSmartTitleCase(lang) : 'Code';
    return `${langLabel} Code Snippet`;
  }

  // Condense raw URLs into hostnames so they remain readable
  working = working.replace(/https?:\/\/([^\s/]+)[^\s]*/gi, (_m, host: string) =>
    host.replace(/^www\./i, '')
  );

  // Use the primary sentence or line when prompt is multi-sentence
  const firstClause = working
    .split(/(?:\r?\n|[.!?](?:\s+|$))/)
    .map((s) => s.trim())
    .find((s) => s.length >= 3);
  if (firstClause) {
    working = firstClause;
  }

  // Strip conversational lead-in phrases iteratively (up to 3 passes)
  for (let pass = 0; pass < 3; pass++) {
    let changed = false;
    for (const pattern of CONVERSATIONAL_PREFIXES) {
      const next = working.replace(pattern, '').trim();
      if (next && next.length >= 4 && next !== working) {
        working = next;
        changed = true;
      }
    }
    if (!changed) break;
  }

  // Limit to ~6 concise words while avoiding awkward dangling connectors
  const words = working
    .replace(/[`*_~"'“”‘’]/g, '')
    .replace(/[?!.:,;]+$/g, '')
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return attachment ? formatAttachmentTitle(attachment) : 'New Conversation';
  }

  const maxWords = 6;
  const selected = words.slice(0, maxWords);
  while (selected.length > 2 && LOWERCASE_CONNECTORS.has(selected[selected.length - 1].toLowerCase())) {
    selected.pop();
  }

  const titleCased = toSmartTitleCase(selected.join(' '));
  return sanitizeChatTitle(titleCased, 42) || 'New Conversation';
};

export const requestAutoChatTitle = async (params: {
  message: string;
  attachmentName?: string;
  attachmentMimeType?: string;
}): Promise<string | null> => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5500);

  try {
    const response = await fetch('/api/chat/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(params),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const cleaned = sanitizeChatTitle(typeof data?.title === 'string' ? data.title : '', 46);
    if (!cleaned || isDefaultSessionTitle(cleaned)) {
      return null;
    }
    return cleaned;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
};
