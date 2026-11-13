import React, { useState } from 'react';
import { Copy, Check, Paperclip, Sparkles, User } from 'lucide-react';
import { Marked } from 'marked';
import { ChatMessage, RolePersona, ModelDetail } from '../../types';
import { ResearchReportViewer } from './ResearchReportViewer';

interface ChatMessageItemProps {
  message: ChatMessage;
  activeRole: RolePersona;
  activeModel: ModelDetail;
  searchQuery?: string;
  developerMode?: boolean;
}

// Escape HTML utility
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createMarkdownProcessor(showDockButtons: boolean) {
  const processor = new Marked({
    gfm: true,
    breaks: true,
  });

  processor.use({
    renderer: {
      code({ text, lang }: { text: string; lang?: string }) {
        const cleanLang = (lang || 'code').trim();
        const escapedText = escapeHtml(text);
        const encodedCode = encodeURIComponent(text);

        const dockActions = showDockButtons
          ? `<button type="button" class="preview-code-btn flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 transition-colors text-[11px] cursor-pointer" data-code="${encodedCode}" data-lang="${escapeHtml(cleanLang)}">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
              <span>Preview</span>
            </button>
            <button type="button" class="edit-code-btn flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-300 transition-colors text-[11px] cursor-pointer" data-code="${encodedCode}" data-lang="${escapeHtml(cleanLang)}">
              <span>Dock</span>
            </button>`
          : '';

        return `<div class="code-block-wrapper my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md">
          <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono select-none">
            <span class="flex items-center gap-1.5 font-medium text-slate-300">
              <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span class="uppercase tracking-wider text-[11px]">${cleanLang}</span>
            </span>
            <div class="flex items-center gap-1.5">
              ${dockActions}
              <button type="button" class="copy-code-btn flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[11px] cursor-pointer" data-code="${encodedCode}">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                <span>Copy</span>
              </button>
            </div>
          </div>
          <pre class="p-3.5 overflow-x-auto text-xs leading-relaxed font-mono text-slate-100 bg-slate-950"><code class="language-${cleanLang}">${escapedText}</code></pre>
        </div>`;
      },
    },
    hooks: {
      postprocess(html: string) {
        return html
          .replace(/<table>/g, '<div class="markdown-table-wrapper"><table>')
          .replace(/<\/table>/g, '</table></div>');
      },
    },
  });

  return processor;
}

const devMarkdownProcessor = createMarkdownProcessor(true);
const standardMarkdownProcessor = createMarkdownProcessor(false);

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  activeRole,
  activeModel,
  developerMode = false,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert markdown to HTML for assistant responses
  const renderedContent = React.useMemo(() => {
    if (isUser) return message.content;
    try {
      const processor = developerMode ? devMarkdownProcessor : standardMarkdownProcessor;
      const parsed = processor.parse(message.content);
      return typeof parsed === 'string' ? parsed : '';
    } catch {
      return message.content;
    }
  }, [message.content, isUser, developerMode]);

  return (
    <div
      className={`group flex items-start gap-3.5 py-4 px-4 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-100/70 dark:bg-slate-900/40 ml-auto max-w-[85%] border border-slate-200/60 dark:border-slate-800'
          : 'bg-white/80 dark:bg-[#0f1422]/70 max-w-[92%] border border-slate-200/70 dark:border-cyan-500/15 cyber-hud-glass'
      }`}
    >
      {/* Avatar Icon */}
      <div
        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
          isUser
            ? 'bg-slate-800 dark:bg-slate-700 text-white'
            : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
      </div>

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {/* Sender meta */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 font-sans">
              {isUser ? 'You' : message.roleName || activeRole.name}
            </span>
            {!isUser && (
              <span className={developerMode ? 'text-[10px] font-mono text-cyan-500' : 'text-[10px] text-cyan-600 dark:text-cyan-400 font-medium'}>
                {developerMode ? message.model || activeModel.id : activeModel.name}
              </span>
            )}
            <span className="text-[10px] text-slate-400 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Copy Message Button */}
          <button
            onClick={handleCopyMessage}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer text-[11px] flex items-center gap-1"
            title="Copy message text"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-mono">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-mono">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Multimodal Attachment Preview if present */}
        {message.attachment && (
          <div className="mb-2 p-2 rounded-xl bg-slate-200/50 dark:bg-slate-800/60 border border-slate-300/60 dark:border-slate-700/60 flex items-center gap-2 text-xs">
            <Paperclip className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
            <span className="font-medium truncate max-w-xs">{message.attachment.name}</span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">
              {message.attachment.mimeType}
            </span>
          </div>
        )}

        {/* Content */}
        {isUser ? (
          <p className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
            {message.content}
          </p>
        ) : (
          <>
            {message.researchReport && (
              <ResearchReportViewer report={message.researchReport} />
            )}
            <div
              className="markdown-body text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans"
              dangerouslySetInnerHTML={{ __html: renderedContent }}
            />
          </>
        )}
      </div>
    </div>
  );
};
