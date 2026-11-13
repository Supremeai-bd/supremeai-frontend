import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Plus,
  Mic,
  ChevronDown,
  Sparkles,
  Paperclip,
  Code,
  Image as ImageIcon,
  X,
  BookOpen,
  Database,
  Lock,
  AudioLines,
} from 'lucide-react';
import { ModelDetail, ChatAttachment, PlanTier } from '../types';
import { SUPREMEAI_MODELS } from '../data/models';
import { usePlatformStore } from '../stores/usePlatformStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useCustomerStore } from '../stores/useCustomerStore';

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: ChatAttachment) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  activeModel: ModelDetail;
  onSelectModel: (model: ModelDetail) => void;
  onOpenPromptLibrary?: () => void;
  isGroundingActive?: boolean;
  onToggleGrounding?: () => void;
  isDeepResearchActive?: boolean;
  onToggleDeepResearch?: () => void;
  developerMode?: boolean;
  enableKnowledgeGrounding?: boolean;
  onOpenLiveVoice?: () => void;
}

const TIER_RANK: Record<PlanTier, number> = {
  Free: 0,
  Pro: 1,
  Enterprise: 2,
};

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  activeModel,
  onSelectModel,
  onOpenPromptLibrary,
  isGroundingActive = false,
  onToggleGrounding,
  isDeepResearchActive = false,
  onToggleDeepResearch,
  developerMode: developerModeProp,
  enableKnowledgeGrounding = false,
  onOpenLiveVoice,
}) => {
  const [inputText, setInputText] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = usePlatformStore((s) => s.config);
  const currentRole = useAuthStore((s) => s.currentRole);
  const authUser = useAuthStore((s) => s.authUser);
  const storeDeveloperMode = useCustomerStore((s) => s.userSettings.developerMode);
  const developerMode =
    developerModeProp !== undefined
      ? developerModeProp
      : Boolean(storeDeveloperMode && (authUser?.isDeveloperEligible || currentRole === 'admin'));

  const userTier: PlanTier = authUser?.plan || 'Pro';
  const isVisionEnabled = config.featureFlags.enable_multimodal_vision !== false;
  const isRagEnabled = config.featureFlags.enable_rag_grounding !== false;
  const showRagControl = Boolean(enableKnowledgeGrounding && (isRagEnabled || currentRole === 'admin'));

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
    if ((!inputText.trim() && !attachment) || isStreaming) return;
    onSendMessage(inputText.trim(), attachment || undefined);
    setInputText('');
    setAttachment(null);
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

  // Handle File / Image Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isVisionEnabled && currentRole !== 'admin') return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAttachment({
        name: file.name,
        mimeType: file.type || 'text/plain',
        data: result,
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  // Web Speech API Voice Dictation
  const toggleListening = () => {
    const speechWindow = window as unknown as {
      SpeechRecognition?: any;
      webkitSpeechRecognition?: any;
    };
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
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
    <div className="w-full px-4 py-3 bg-transparent transition-colors">
      <div className="workspace-input-container space-y-2.5">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.txt,.ts,.tsx,.json,.py,.md"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment preview capsule if file is loaded */}
        {attachment && (
          <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 max-w-fit shadow-xs animate-in fade-in duration-150">
            {attachment.mimeType.startsWith('image/') ? (
              <img
                src={attachment.data}
                alt={attachment.name}
                className="w-8 h-8 rounded-md object-cover border border-slate-300 dark:border-slate-600"
              />
            ) : (
              <Paperclip className="w-4 h-4 text-cyan-500" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-mono font-medium text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                {attachment.name}
              </span>
              <span className="text-[10px] text-slate-400">Attached for multimodal reasoning</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-500 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* SupremeAI Floating Input Capsule */}
        <div className="relative rounded-full sm:rounded-3xl theme-input-surface border shadow-[0_12px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_14px_40px_rgba(0,0,0,0.45)] theme-capsule-focus transition-all p-2.5 flex items-center gap-2">
          {/* Plus (+) Button for Connectors, Recipes, and File Uploads */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              aria-label="Connectors, files, and skills"
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
                    Input & Prompt Options
                  </div>
                  {(isVisionEnabled || currentRole === 'admin') && (
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Upload Image / Document</span>
                    </button>
                  )}
                  {onOpenPromptLibrary && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenPromptLibrary();
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                      <span>Browse Prompt Recipes</span>
                    </button>
                  )}
                  {onToggleGrounding && showRagControl && (
                    <button
                      type="button"
                      onClick={() => {
                        onToggleGrounding();
                        setShowAttachMenu(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-between cursor-pointer font-medium"
                    >
                      <span className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Knowledge Grounding (RAG)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {isGroundingActive ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}
                  {developerMode && (
                    <>
                      <div className="border-t border-slate-100 dark:border-slate-700/60 my-1 pt-1" />
                      <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Developer Templates
                      </div>
                      <button
                        type="button"
                        onClick={() => insertSnippet('Review this TypeScript module for performance, security, and edge cases.')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                      >
                        <Code className="w-3.5 h-3.5 text-blue-500" />
                        <span>Review Studio Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => insertSnippet('Analyze distributed multi-agent workflows and failure modes.')}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Multi-Agent Workflow</span>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Quick File Upload button (hidden when vision flag disabled for non-admins) */}
          {(isVisionEnabled || currentRole === 'admin') && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file for multimodal reasoning"
              className="w-7 h-7 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors cursor-pointer shrink-0"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          )}

          {/* RAG Knowledge Grounding Toggle (controlled cleanly from Settings) */}
          {onToggleGrounding && showRagControl && (
            <button
              type="button"
              onClick={onToggleGrounding}
              title={isGroundingActive ? 'Knowledge Base Grounding Active (Click to disable)' : 'Enable Knowledge Base Grounding (RAG)'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isGroundingActive
                  ? 'theme-accent-active border shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Deep Research Mode Toggle */}
          {onToggleDeepResearch && (
            <button
              type="button"
              onClick={onToggleDeepResearch}
              title={isDeepResearchActive ? 'Deep Research mode active' : 'Enable Deep Research mode'}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isDeepResearchActive
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? 'Add instructions for attached file...' : 'Ask SupremeAI or type instructions...'}
            className="flex-1 max-h-40 bg-transparent resize-none border-none focus:outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-2 py-1 leading-relaxed"
          />

          {/* Right Controls inside Capsule: Model Selector + Mic + Send */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {/* Model Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-200/80 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>{activeModel.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {/* Model Menu Dropdown respecting Admin Model Policies */}
              {showModelMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowModelMenu(false)}
                  />
                  <div className="absolute right-0 bottom-full mb-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-40 p-1.5 space-y-1">
                    <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      SupremeAI Foundation Models
                    </div>
                    {SUPREMEAI_MODELS.map((model) => {
                      const policy = config.modelPolicies[model.id] || { enabled: true, minTier: 'Free' };
                      const isDisabledByAdmin = !policy.enabled && currentRole !== 'admin';
                      const isTierLocked =
                        currentRole !== 'admin' &&
                        TIER_RANK[userTier] < TIER_RANK[policy.minTier];
                      const isBlocked = isDisabledByAdmin || isTierLocked;

                      return (
                        <button
                          key={model.id}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => {
                            if (isBlocked) return;
                            onSelectModel(model);
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg transition-colors ${
                            isBlocked
                              ? 'opacity-50 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/30 text-slate-400'
                              : model.id === activeModel.id
                              ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium cursor-pointer'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                              {isBlocked && <Lock className="w-3 h-3 text-amber-500" />}
                              <span>{model.name}</span>
                            </span>
                            {(isDisabledByAdmin || isTierLocked || developerMode || currentRole === 'admin') && (
                              <span className="text-[10px] font-mono text-slate-400">
                                {isDisabledByAdmin
                                  ? 'Disabled'
                                  : isTierLocked
                                  ? `${policy.minTier}+`
                                  : model.latencyRating}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {model.tagline}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Voice Dictation (Microphone) */}
            <button
              type="button"
              onClick={toggleListening}
              aria-label="Voice input"
              title="Voice dictation"
              className={`p-1.5 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 transition-colors cursor-pointer ${
                isListening
                  ? 'text-rose-600 bg-rose-100 dark:bg-rose-950 animate-pulse'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Real-time Voice Conversation (Gemini Live API) */}
            {onOpenLiveVoice && (
              <button
                type="button"
                onClick={onOpenLiveVoice}
                aria-label="Live Voice Conversation"
                title="Start real-time voice conversation (gemini-3.8-live)"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full theme-accent-active border text-xs font-medium hover:brightness-105 transition-all cursor-pointer shrink-0"
              >
                <AudioLines className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voice</span>
              </button>
            )}

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
                disabled={!inputText.trim() && !attachment}
                aria-label="Send prompt"
                className="w-8 h-8 rounded-full theme-btn-primary disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
