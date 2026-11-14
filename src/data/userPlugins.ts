import { PluginItem, UserProject, UserAccountSettings } from '../types';

export const INITIAL_PLUGINS: PluginItem[] = [
  {
    id: 'github-sync',
    name: 'GitHub Project Bridge',
    tagline: 'Sync branches, pull requests, and commit diffs with SupremeAI',
    description:
      'Seamlessly links connected GitHub repositories to the chat context, allowing you to ask questions about your codebase, track recent commits, and inspect file trees.',
    category: 'developer',
    isEnabled: true,
    version: '1.4.2',
    author: 'Supremeai-bd',
  },
  {
    id: 'ai-code-auditor',
    name: 'AI Code Reviewer',
    tagline: 'Automatic pull request reviews and vulnerability scanning',
    description:
      'Analyzes submitted code blocks and GitHub pull requests for security vulnerabilities, logic edge cases, memory leaks, and architectural antipatterns.',
    category: 'security',
    isEnabled: true,
    version: '2.1.0',
    author: 'Supremeai-bd',
  },
  {
    id: 'web-grounding',
    name: 'Search & Docs Grounding',
    tagline: 'Ground answers in latest web docs and live library releases',
    description:
      'Augments SupremeAI responses with real-time documentation for React 19, Tailwind v4, Vite, and external developer packages.',
    category: 'ai-grounding',
    isEnabled: true,
    version: '1.8.0',
    author: 'Google AI Studio',
  },
  {
    id: 'terminal-assistant',
    name: 'Terminal & CLI Companion',
    tagline: 'Generate and validate shell commands, Docker scripts & CI/CD',
    description:
      'Translates natural language intents into secure, POSIX-compliant bash, Dockerfile, and GitHub Actions workflows with syntax safeguards.',
    category: 'developer',
    isEnabled: false,
    version: '1.2.5',
    author: 'Supremeai-bd',
  },
  {
    id: 'markdown-export-pro',
    name: 'Notion & Doc Exporter',
    tagline: 'Export chat conversations and technical specs into clean docs',
    description:
      'Formatted export of chat threads, architectural diagrams, and code snippets into Notion, Google Docs, or formatted Markdown.',
    category: 'productivity',
    isEnabled: true,
    version: '1.0.8',
    author: 'SupremeAI Community',
  },
  {
    id: 'figma-code-bridge',
    name: 'Figma to Tailwind Bridge',
    tagline: 'Generate clean React + Tailwind CSS code from design specs',
    description:
      'Converts design component specs and tokens into semantic React 19 components with responsive styling.',
    category: 'developer',
    isEnabled: false,
    version: '0.9.4',
    author: 'Supremeai-bd',
  },
];

export const INITIAL_USER_PROJECTS: UserProject[] = [
  {
    id: 'proj_supremeai_core',
    name: 'supremeai',
    repoUrl: 'https://github.com/Supremeai-bd/supremeai',
    branch: 'main',
    description: 'Core AI engine, model orchestration, and backend agent services.',
    language: 'TypeScript / Python',
    stars: 28,
    lastSynced: Date.now() - 3600000 * 4,
    aiReviewStatus: 'reviewed',
  },
  {
    id: 'proj_supremeai_studio',
    name: 'supremeai-studio',
    repoUrl: 'https://github.com/Supremeai-bd/supremeai-studio',
    branch: 'main',
    description: 'Ultra-lightweight SupremeAI developer studio & workspace frontend.',
    language: 'TypeScript / React',
    stars: 42,
    lastSynced: Date.now() - 3600000 * 2,
    aiReviewStatus: 'reviewed',
  },
];

export const DEFAULT_USER_SETTINGS: UserAccountSettings = {
  name: 'ziaul haq',
  email: 'ziaulhaquezia01@gmail.com',
  role: 'user', // default view is user, with quick toggle to admin
  plan: 'Pro',
  monthlyTokensUsed: 142500,
  monthlyTokensLimit: 1000000,
  emailNotifications: true,
  autoCodeReview: true,
  streamResponses: true,
  defaultModel: 'supreme-core',
  language: 'en',
  layoutMode: 'sidebar-focus',
  contentLayout: 'fluid',
  developerMode: false,
  enableKnowledgeGrounding: false,
  showWorkspaceTips: true,
  customInstructions: '',
};
