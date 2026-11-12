import React, { useState, useRef } from 'react';
import { X, FileUp, FileText, CheckCircle2, AlertCircle, Sparkles, Layers, Eye } from 'lucide-react';
import { KnowledgeDoc } from '../../../types';
import { validateKnowledgeFile, FileValidationResult } from '../../../utils/validation';

interface FileProcessingPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<KnowledgeDoc, 'id' | 'lastIndexed'>) => void;
}

export const FileProcessingPreviewModal: React.FC<FileProcessingPreviewModalProps> = ({
  isOpen,
  onClose,
  onAddDocument,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'markdown' | 'pdf' | 'code'>('markdown');
  const [fileContent, setFileContent] = useState('');
  const [validationInfo, setValidationInfo] = useState<FileValidationResult | null>(null);
  const [isGroundingActive, setIsGroundingActive] = useState(true);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = (file: File) => {
    setError(null);
    const validation = validateKnowledgeFile(file);
    setValidationInfo(validation);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid file.');
      return;
    }

    // Auto-detect type
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (ext === '.pdf') setDocType('pdf');
    else if (['.ts', '.js', '.py', '.json', '.html', '.css'].includes(ext)) setDocType('code');
    else setDocType('markdown');

    if (!docTitle.trim()) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    setIsReadingFile(true);

    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setFileContent(result);
      } else {
        // PDF or binary simulation text
        setFileContent(
          `[EXTRACTED PDF TEXT: ${file.name}]\n\nDocument structure indexed with vector chunking. Token payload: ~${validation.estimatedTokens} tokens ready for semantic grounding.`
        );
      }
      setIsReadingFile(false);
    };

    reader.onerror = () => {
      setError('Failed to read file from disk.');
      setIsReadingFile(false);
    };

    if (ext === '.pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleIndexSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !fileContent.trim()) {
      setError('Please provide a document title and file content.');
      return;
    }

    const estimatedTokens = Math.ceil(fileContent.length / 4);
    const estimatedChunks = Math.max(1, Math.ceil(estimatedTokens / 800));

    onAddDocument({
      title: docTitle.trim(),
      type: docType,
      sizeBytes: fileContent.length,
      tokenCount: estimatedTokens,
      chunkCount: estimatedChunks,
      status: 'indexed',
      isGroundingActive,
      contentPreview: fileContent.trim().substring(0, 320),
    });

    handleClose();
  };

  const handleClose = () => {
    setDocTitle('');
    setFileContent('');
    setValidationInfo(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-cyan-500/25 p-6 shadow-2xl relative cyber-hud-glass flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Index Document with Live Preview
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Client-side validation, token estimation, and semantic grounding setup
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleIndexSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
                : 'border-slate-300 dark:border-slate-700 hover:border-cyan-500/60 bg-slate-50 dark:bg-slate-900/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.json,.pdf,.ts,.js,.py,.html,.css"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <FileUp className="w-8 h-8 text-cyan-500" />
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Click to browse or drag and drop document
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                Supports PDF, Markdown (.md), Plain Text (.txt), JSON, Code (.ts, .py) · Max 5MB
              </p>
            </div>
          </div>

          {/* Validation & Token Estimation Bar */}
          {validationInfo && (
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">FILE SIZE</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {validationInfo.formattedSize}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOKEN ESTIMATE</span>
                <span className="font-semibold text-cyan-500">
                  ~{validationInfo.estimatedTokens.toLocaleString()} tokens
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">CHUNKS READY</span>
                <span className="font-semibold text-emerald-500">
                  ~{Math.max(1, Math.ceil(validationInfo.estimatedTokens / 800))} vector chunks
                </span>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Document Index Title
              </label>
              <input
                type="text"
                placeholder="e.g. Architecture RFC 2026"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Source Type Classification
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as 'markdown' | 'pdf' | 'code')}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="markdown">Markdown Documentation (.md)</option>
                <option value="pdf">PDF Document / Whitepaper</option>
                <option value="code">Source Code / Config (.ts, .py, .json)</option>
              </select>
            </div>
          </div>

          {/* Live Content Preview */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-cyan-500" />
                <span>Live Document Preview</span>
              </label>
              {fileContent && (
                <span className="text-[11px] font-mono text-slate-400">
                  {fileContent.split('\n').length} lines · {fileContent.length} chars
                </span>
              )}
            </div>
            <textarea
              rows={6}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Extracted file preview will appear here, or you can paste content directly..."
              className="w-full p-3 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-cyan-500 text-slate-800 dark:text-slate-200 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Grounding Toggle */}
          <div
            onClick={() => setIsGroundingActive(!isGroundingActive)}
            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer flex items-center justify-between select-none"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Enable Semantic Grounding in Studio Chat
                </p>
                <p className="text-[10px] text-slate-400">
                  Ground Gemini inferences with this document automatically
                </p>
              </div>
            </div>
            <div
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                isGroundingActive ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  isGroundingActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!docTitle.trim() || !fileContent.trim()}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-mono transition-colors cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>INDEX DOCUMENT</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
