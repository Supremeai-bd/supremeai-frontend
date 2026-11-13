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
} from 'lucide-react';
import { ModelDetail, ChatAttachment } from '../types';
import { GEMINI_MODELS } from '../data/models';

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
}

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
}) => {
  const [inputText, setInputText] = useState('');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachment, setAttachment] = useState<ChatAttachment | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For text, markdown, code, read as Data URL or text
      reader.readAsDataURL(file);
    }

    // Reset input so re-selecting same file works
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
      alert('Speech recognition is not supported in this browser.');
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
      <div className="max-w-3xl mx-auto space-y-2.5">
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

        {/* Gemini-style Floating Input Capsule */}
        <div className="relative rounded-3xl bg-slate-100/90 dark:bg-[#1e1f20] border border-slate-200/90 dark:border-slate-800 shadow-md focus-within:shadow-lg focus-within:border-slate-400 dark:focus-within:border-slate-600 transition-all p-2.5 flex items-center gap-2">
          {/* Plus (+) Button for Connectors, Skills, and File Uploads */}
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
                    Input & Connectors
                  </div>
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
                  <div className="border-t border-slate-100 dark:border-slate-700/60 my-1 pt-1" />
                  <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Quick Templates
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
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Multi-Agent Swarm</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick File Upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach image or file for multimodal reasoning"
            className="w-7 h-7 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-700/80 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>

          {/* RAG Knowledge Grounding Toggle */}
          {onToggleGrounding && (
            <button
              type="button"
              onClick={onToggleGrounding}
              title={isGroundingActive ? "Knowledge Base Grounding Active (Click to disable)" : "Enable Knowledge Base Grounding (RAG)"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isGroundingActive
                  ? "bg-cyan-500/20 text-cyan-500 border border-cyan-500/40 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
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
              title={isDeepResearchActive ? "Deep Research mode active" : "Enable Deep Research mode"}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                isDeepResearchActive
                  ? "bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Text Area (Ask Gemini / Type @ for connectors) */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? 'Add instructions for attached file...' : 'Ask Gemini or type instructions...'}
            className="flex-1 max-h-40 bg-transparent resize-none border-none focus:outline-none text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 px-2 py-1 leading-relaxed"
          />

          {/* Right Controls inside Capsule: Model Selector + Mic + Send */}
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            {/* Model Selector pill directly inside input */}
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
                disabled={!inputText.trim() && !attachment}
                aria-label="Send prompt"
                className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer shadow-xs"
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
