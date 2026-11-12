import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Plus,
  Mic,
  ChevronDown,
  Trash2,
  Download,
  Sliders,
  Sparkles,
  Paperclip,
  Code,
} from 'lucide-react';
import { ModelDetail, RolePersona } from '../types';
import { GEMINI_MODELS } from '../data/models';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  onClearThread: () => void;
  onExportThread: (format: 'markdown' | 'json') => void;
  isStreaming: boolean;
  activeModel: ModelDetail;
  onSelectModel: (model: ModelDetail) => void;
  activeRole: RolePersona;
  onOpenRoleModal: () => void;
  hasMessages: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  onClearThread,
  onExportThread,
  isStreaming,
  activeModel,
  onSelectModel,
  activeRole,
  onOpenRoleModal,
  hasMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeMode, setActiveMode] = useState<'chat' | 'task'>('chat');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    onSendMessage(inputText.trim());
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Web Speech API Voice Dictation
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const insertSnippet = (snippet: string) => {
    setInputText((prev) => (prev ? `${prev}\n${snippet}` : snippet));
    setShowAttachMenu(false);
  };

  return (
    <div className="p-4 bg-transparent pb-6 transition-colors">
      <div className="max-w-3xl mx-auto space-y-3">
        {/* Gemini-style Floating Input Capsule */}
        <div className="relative rounded-3xl bg-slate-100/90 dark:bg-[#1e1f20] border border-slate-200/90 dark:border-slate-800 shadow-md focus-within:shadow-lg focus-within:border-slate-400 dark:focus-within:border-slate-600 transition-all p-2.5 flex items-center gap-2">
          {/* Plus (+) Button for Connectors & Skills */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              aria-label="Connectors and skills"
              className="w-8 h-8 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Quick Skills / Connectors Menu */}
            {showAttachMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowAttachMenu(false)}
                />
                <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 p-2 space-y-1 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Connectors & Code Templates
                  </div>
                  <button
                    type="button"
                    onClick={() => insertSnippet('Review supremeai-studio frontend code and optimize performance.')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-blue-500" />
                    <span>Review Studio Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('Analyze distributed multi-agent workflows for SupremeAI.')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span>Multi-Agent Workflow</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertSnippet('Generate strict TypeScript interface for this API endpoint:')}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-emerald-500" />
                    <span>TypeScript Schema Spec</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Text Area (Ask Gemini / Type @ for connectors) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type @ for connectors, skills and more"
            className="flex-1 max-h-40 bg-transparent resize-none border-none focus:outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-2 py-1 leading-relaxed"
          />

          {/* Right Controls inside Capsule: Model Selector + Mic + Send */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {/* Model Selector pill directly inside input like "Flash High ⌄" */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>{activeModel.name.replace('Gemini ', '')}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Model Menu Dropdown */}
              {showModelMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowModelMenu(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Gemini Foundation Models
                    </div>
                    {GEMINI_MODELS.map((model) => (
                      <button
                        key={model.id}
                        type="button"
                        onClick={() => {
                          onSelectModel(model);
                          setShowModelMenu(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition-colors cursor-pointer ${
                          model.id === activeModel.id
                            ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{model.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {model.latencyRating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {model.tagline}
                        </p>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Voice Dictation (Microphone) */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label="Voice input"
              className={`p-1.5 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer ${
                isListening
                  ? 'text-rose-600 bg-rose-100 dark:bg-rose-950 animate-pulse'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Submit / Stop button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                aria-label="Stop generating"
                className="w-8 h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!inputText.trim()}
                aria-label="Send prompt"
                className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Gemini Segmented Pills Below: [Chat | Task] + Quick Actions */}
        <div className="flex items-center justify-between px-2">
          {/* Centered Segmented Pill like Gemini screenshot: Chat | Task */}
          <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-full text-xs">
            <button
              type="button"
              onClick={() => setActiveMode('chat')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeMode === 'chat'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Chat
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('task')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeMode === 'task'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Task
            </button>
          </div>

          {/* Right Action buttons: Roles, Export, Clear */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={onOpenRoleModal}
              className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{activeRole.name}</span>
            </button>

            {hasMessages && (
              <>
                <span>·</span>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>

                  {showExportMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setShowExportMenu(false)}
                      />
                      <div className="absolute right-0 bottom-full mb-1.5 w-32 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-40 p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            onExportThread('markdown');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          Markdown (.md)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onExportThread('json');
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          JSON (.json)
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <span>·</span>
                <button
                  type="button"
                  onClick={onClearThread}
                  className="hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
