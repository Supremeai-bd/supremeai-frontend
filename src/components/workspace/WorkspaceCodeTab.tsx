import React, { useState, useEffect } from 'react';
import { Code2, Play, Copy, Check } from 'lucide-react';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

export const WorkspaceCodeTab: React.FC = () => {
  const {
    previewCode,
    previewLang,
    updatePreviewCode,
    setActiveDockTab,
  } = useWorkspaceStore();

  const [draft, setDraft] = useState(previewCode);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(previewCode);
  }, [previewCode]);

  const handleApplyAndPreview = () => {
    updatePreviewCode(draft);
    setActiveDockTab('preview');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const lineCount = draft.split('\n').length;
  const isDirty = draft !== previewCode;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#060910] text-slate-200 font-mono">
      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-slate-800/90 flex items-center justify-between gap-2 bg-[#0b101b]">
        <div className="flex items-center gap-2 text-[11px]">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-200 uppercase">{previewLang} BUFFER</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">{lineCount} lines</span>
          {isDirty && (
            <span className="text-[10px] text-amber-400 font-semibold">● Unsaved edits</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyAndPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-[11px] transition-colors cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Apply & Preview</span>
          </button>
        </div>
      </div>

      {/* Code Editor Textarea */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="w-10 py-3 bg-[#080c15] border-r border-slate-800/60 text-right pr-2 text-[11px] text-slate-600 select-none overflow-hidden leading-relaxed">
          {Array.from({ length: Math.min(lineCount, 300) }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={false}
          className="flex-1 p-3 bg-transparent text-xs leading-relaxed text-cyan-100 focus:outline-none resize-none overflow-y-auto"
          placeholder="Paste or edit HTML, React/JSX, Mermaid, or JavaScript code here..."
        />
      </div>
    </div>
  );
};
