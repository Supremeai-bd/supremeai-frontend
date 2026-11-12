import React from 'react';
import { Sparkles, Terminal, Shield, Cpu, Code2 } from 'lucide-react';
import { RolePersona, ModelDetail } from '../../types';

interface ChatEmptyStateProps {
  activeRole: RolePersona;
  activeModel: ModelDetail;
  onSendPrompt: (promptText: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
  activeRole,
  activeModel,
  onSendPrompt,
}) => {
  const starters = [
    {
      icon: Terminal,
      title: 'Analyze Repository Architecture',
      prompt: 'Inspect connected GitHub repositories, summarize module boundaries, and find refactoring targets.',
    },
    {
      icon: Shield,
      title: 'Run MCP Security Audit',
      prompt: 'Audit active MCP tools and API gateway routes for prompt injection vectors and rate limit enforcement.',
    },
    {
      icon: Cpu,
      title: 'Synthesize Agent Swarm Protocol',
      prompt: 'Draft an autonomous swarm worker workflow with automated task queue retries and error circuit breakers.',
    },
    {
      icon: Code2,
      title: 'Generate Production TypeScript Module',
      prompt: 'Write a type-safe API client adapter with exponential backoff, retry jitter, and AbortController support.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-fade-in">
      {/* Studio Icon / Brand mark */}
      <div className="relative w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_24px_rgba(0,240,255,0.2)]">
        <Sparkles className="w-8 h-8" />
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        SupremeAI Studio
      </h1>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        Autonomous AI workspace and command center powered by{' '}
        <span className="font-semibold text-cyan-500">{activeModel.name}</span>. Currently operating in{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">{activeRole.name}</span> persona.
      </p>

      {/* Starter Prompts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full text-left">
        {starters.map((starter, idx) => {
          const Icon = starter.icon;
          return (
            <button
              key={idx}
              onClick={() => onSendPrompt(starter.prompt)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-cyan-500/15 bg-white/60 dark:bg-slate-900/40 hover:border-cyan-500/50 hover:bg-cyan-500/[0.04] transition-all cursor-pointer group cyber-hud-glass text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {starter.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                {starter.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
