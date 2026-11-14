import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Mic,
  MicOff,
  PhoneOff,
  AudioLines,
  VolumeX,
  Send,
  AlertCircle,
  RotateCcw,
  Trash2,
  Check,
  Maximize2,
  Minimize2,
  MessageSquareText,
  SlidersHorizontal,
  Square,
  Loader2,
} from 'lucide-react';
import {
  useLiveVoiceSession,
  LiveSessionStatus,
} from '../../hooks/useLiveVoiceSession';
import { LiveVoiceAvatarCanvas } from './LiveVoiceAvatarCanvas';
import { useThemeStore } from '../../stores/useThemeStore';
import { useChatStore } from '../../stores/useChatStore';
import { useAvatarExpression } from '../../hooks/useAvatarExpression';
import { useAudioTranscription } from '../../hooks/useAudioTranscription';
import {
  AVATAR_PRESETS,
  AvatarPreference,
  loadAvatarPreference,
  resolveAvatarSource,
  VOICE_AVATAR_SYNC_EVENT,
} from '../../utils/hologramAvatar';

interface LiveVoicePanelProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction?: string;
  roleName?: string;
  onCommitTurn?: (userText: string, assistantText: string, voiceName?: string) => void;
  onSendChatPrompt?: (text: string) => void;
  onOpenVoiceSettings?: () => void;
}

const STATUS_META: Record<LiveSessionStatus, { label: string; dotColor: string }> = {
  idle: { label: 'Ready', dotColor: 'bg-slate-400' },
  connecting: { label: 'Connecting...', dotColor: 'bg-amber-400' },
  listening: { label: 'Listening', dotColor: 'bg-emerald-500' },
  speaking: { label: 'Speaking', dotColor: 'bg-cyan-400' },
  muted: { label: 'Muted', dotColor: 'bg-rose-500' },
  error: { label: 'Interrupted', dotColor: 'bg-rose-500' },
};

export const LiveVoicePanel: React.FC<LiveVoicePanelProps> = ({
  isOpen,
  onClose,
  systemInstruction,
  roleName = 'Assistant',
  onCommitTurn,
  onSendChatPrompt,
  onOpenVoiceSettings,
}) => {
  const [syncToChat, setSyncToChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [textNudge, setTextNudge] = useState('');
  const [resetViewCounter, setResetViewCounter] = useState(0);
  const [liveAudioLevel, setLiveAudioLevel] = useState(0);
  const [avatarPref, setAvatarPref] = useState<AvatarPreference>(() => loadAvatarPreference());
  const syncToChatRef = useRef(syncToChat);
  syncToChatRef.current = syncToChat;

  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const resolvedScheme = useThemeStore((s) => s.resolvedScheme);
  const isDark = resolvedScheme === 'dark';

  const activeAvatarSource = resolveAvatarSource(avatarPref);

  useEffect(() => {
    const handleSync = () => {
      setAvatarPref(loadAvatarPreference());
    };
    window.addEventListener(VOICE_AVATAR_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(VOICE_AVATAR_SYNC_EVENT, handleSync);
  }, []);

  const {
    status,
    error,
    micNotice,
    hasMicrophone,
    voiceName,
    setVoiceName,
    isMuted,
    toggleMute,
    transcripts,
    liveUserText,
    liveModelText,
    levelsRef,
    connect,
    disconnect,
    sendTextPrompt,
    interruptPlayback,
    clearTranscripts,
  } = useLiveVoiceSession({
    systemInstruction,
    onTurnCommitted: (userText, assistantText, activeVoice) => {
      if (syncToChatRef.current && onCommitTurn) {
        onCommitTurn(userText, assistantText, activeVoice);
      }
    },
  });

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const hasAutoStartedRef = useRef(false);

  const { expression, expressionClass } = useAvatarExpression({
    streamingContent,
    isStreaming,
    voiceText: liveModelText,
    isConnecting: status === 'connecting',
  });

  const statusRef = useRef(status);
  statusRef.current = status;

  const {
    isRecording: isTranscribingRec,
    isTranscribing,
    recordingSeconds,
    error: transcribeError,
    lastTranscript,
    toggleRecording: toggleTranscribeRecording,
    clearError: clearTranscribeError,
  } = useAudioTranscription({
    onAudioLevel: (lvl) => {
      levelsRef.current.input = lvl;
    },
    onTranscript: (text) => {
      const s = statusRef.current;
      const liveReady = s === 'listening' || s === 'speaking' || s === 'muted';
      if (liveReady) {
        sendTextPrompt(text);
      } else if (onSendChatPrompt) {
        onSendChatPrompt(text);
      } else {
        setTextNudge((prev) => (prev ? `${prev} ${text}` : text));
      }
    },
  });

  // Sample audio output level smoothly when panel is open so CSS keyframes scale with voice energy
  useEffect(() => {
    if (!isOpen) return;
    const id = setInterval(() => {
      const nextLevel = Math.min(1, Math.max(0, levelsRef.current.output || 0));
      setLiveAudioLevel((prev) => (Math.abs(prev - nextLevel) > 0.04 ? nextLevel : prev));
    }, 90);
    return () => clearInterval(id);
  }, [isOpen, levelsRef]);

  // Auto-start session when panel opens; disconnect when panel closes
  useEffect(() => {
    if (isOpen && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      connect();
    } else if (!isOpen && hasAutoStartedRef.current) {
      hasAutoStartedRef.current = false;
      setIsFullscreen(false);
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  // Escape exits fullscreen cleanly without terminating the call
  useEffect(() => {
    if (!isOpen || !isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, isFullscreen]);

  // Scroll transcript drawer when visible
  useEffect(() => {
    if (showTranscriptDrawer) {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showTranscriptDrawer, transcripts.length, liveUserText, liveModelText]);

  if (!isOpen) return null;

  const isSessionActive =
    status === 'connecting' ||
    status === 'listening' ||
    status === 'speaking' ||
    status === 'muted';
  const statusMeta = STATUS_META[status];

  const activeAvatarLabel =
    avatarPref.preset === 'custom'
      ? 'Face-Matched 3D'
      : AVATAR_PRESETS.find((p) => p.id === avatarPref.preset)?.label || 'Aria (3D Female)';

  const compactStatusLabel =
    isStreaming && status !== 'speaking'
      ? 'Responding'
      : status === 'muted' && !hasMicrophone
      ? 'Listen & Type'
      : expression === 'thinking' && status === 'idle'
      ? 'Thinking'
      : statusMeta.label;

  const handleSendNudge = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = textNudge.trim();
    if (!cleaned) return;
    if (isSessionActive) {
      sendTextPrompt(cleaned);
      setTextNudge('');
    } else if (onSendChatPrompt) {
      onSendChatPrompt(cleaned);
      setTextNudge('');
    }
  };

  const handleClose = () => {
    disconnect();
    setIsFullscreen(false);
    onClose();
  };

  const latestTurn = transcripts[transcripts.length - 1];
  const captionSpeaker = liveModelText
    ? `SupremeAI (${voiceName})`
    : liveUserText
    ? 'You'
    : isTranscribing
    ? 'gemini-3.5-transcribe'
    : lastTranscript && !latestTurn
    ? 'Transcribed'
    : latestTurn
    ? latestTurn.role === 'user'
      ? 'You'
      : `SupremeAI (${voiceName})`
    : null;
  const captionText =
    liveModelText ||
    liveUserText ||
    (isTranscribing ? 'Transcribing microphone audio...' : '') ||
    latestTurn?.text ||
    lastTranscript ||
    '';

  const isSpeechActive = isStreaming || status === 'speaking' || liveAudioLevel > 0.06;
  const effectiveAudioLevel = isStreaming
    ? Math.max(liveAudioLevel, 0.55)
    : status === 'speaking'
    ? Math.max(liveAudioLevel, 0.4)
    : liveAudioLevel;

  const canSendText = isSessionActive || Boolean(onSendChatPrompt);
  const avatarVisualStatus: LiveSessionStatus = isTranscribingRec ? 'listening' : status;

  return (
    <aside
      data-testid="live-voice-panel"
      aria-label="3D Real-time Voice Companion"
      style={{ '--avatar-audio-level': effectiveAudioLevel.toFixed(2) } as React.CSSProperties}
      className={`${expressionClass} ${isSpeechActive ? 'avatar-speech-active' : ''} ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-100/88 dark:bg-slate-950/86 flex flex-col overflow-hidden'
          : 'fixed inset-0 z-40 md:static md:z-auto w-full md:w-[340px] lg:w-[370px] xl:w-[400px] shrink-0 h-full border-l border-slate-200/70 dark:border-slate-800/80 bg-slate-100/92 dark:bg-slate-950/90 md:bg-transparent dark:md:bg-transparent flex flex-col overflow-hidden'
      }`}
    >
      {/* Clean Decluttered Top Bar */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/92 dark:bg-slate-900/92 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Expressive CSS Keyframe Mini-Avatar (blinking eyes + audio/streaming pulsing mouth + sentiment class) */}
          <div
            data-testid="avatar-expression-indicator"
            data-expression={expression}
            title={`${roleName} · Expression: ${expression}`}
            className="avatar-expression-badge avatar-face-shell w-8 h-8 rounded-xl border bg-slate-950/90 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              <span className="avatar-eye-sim w-1.5 h-1.5 rounded-full bg-current" />
              <span className="avatar-eye-sim w-1.5 h-1.5 rounded-full bg-current" />
            </div>
            <span className="avatar-mouth-sim w-3 h-1 rounded-full bg-current" />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              Voice Avatar
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
              <span>{compactStatusLabel}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowTranscriptDrawer((v) => !v)}
            title={showTranscriptDrawer ? 'Hide transcript' : 'Transcript & sync options'}
            aria-label="Toggle live voice transcript"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showTranscriptDrawer
                ? 'theme-accent-active'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquareText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            aria-label={isFullscreen ? 'Restore split view' : 'Expand 3D avatar to fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen 3D Avatar'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close 3D voice panel"
            title="Close Voice Panel"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fatal Error Banner (mic absence handled gracefully via micNotice without error state) */}
      {(error || transcribeError) && (
        <div className="px-3.5 py-2 bg-rose-950/90 border-b border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <p className="flex-1 min-w-0 truncate">{transcribeError || error}</p>
          {transcribeError ? (
            <button
              type="button"
              onClick={clearTranscribeError}
              className="p-1 rounded hover:bg-rose-500/25 cursor-pointer shrink-0"
              aria-label="Dismiss transcription error"
            >
              <X className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-[11px] font-semibold cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Unobstructed Transparent 3D Hologram Viewport */}
      <div className="flex-1 min-h-[260px] relative bg-transparent overflow-hidden">
        <LiveVoiceAvatarCanvas
          status={avatarVisualStatus}
          voiceName={voiceName}
          levelsRef={levelsRef}
          avatarSrc={activeAvatarSource.src}
          isPrestyledHologram={activeAvatarSource.isPrestyledHologram}
          avatarPreset={avatarPref.preset}
          customTraits={avatarPref.customTraits}
          expression={expression}
          isStreaming={isStreaming}
          isDark={isDark}
          resetViewCounter={resetViewCounter}
        />

        {/* Subtle Viewport Reset View Control (Bottom-Right Corner, Out of Top Header) */}
        <button
          type="button"
          onClick={() => setResetViewCounter((c) => c + 1)}
          title="Reset 3D camera angle"
          aria-label="Reset 3D camera view"
          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-950/55 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-900/80 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Minimal Bottom Live Caption Strip (No backdrop-filter over WebGL) */}
        {captionText && !showTranscriptDrawer && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex justify-center">
            <div className="max-w-xl px-3 py-1.5 rounded-xl bg-slate-950/88 border border-slate-700/70 text-[11px] text-slate-100 leading-snug shadow-lg">
              {captionSpeaker && (
                <span className="font-semibold text-cyan-300 mr-1.5">{captionSpeaker}:</span>
              )}
              <span className="line-clamp-2">{captionText}</span>
            </div>
          </div>
        )}

        {/* Optional Collapsible Transcript Drawer (Houses Sync Chat toggle & Transcript History) */}
        {showTranscriptDrawer && (
          <div className="absolute inset-x-3 bottom-3 max-h-[55%] rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between gap-2 text-[11px] text-slate-300">
              <span className="font-semibold">Voice Transcript</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSyncToChat((v) => !v)}
                  title="Save spoken turns directly to chat conversation"
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                    syncToChat
                      ? 'theme-accent-active'
                      : 'border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {syncToChat && <Check className="w-2.5 h-2.5" />}
                  <span>Sync Chat</span>
                </button>
                {transcripts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearTranscripts}
                    title="Clear transcripts"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowTranscriptDrawer(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              {transcripts.length === 0 && !liveUserText && !liveModelText ? (
                <p className="text-center text-slate-400 py-3">
                  Speak into your microphone or type below to start.
                </p>
              ) : (
                <>
                  {transcripts.map((item) => (
                    <div
                      key={item.id}
                      className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[88%] px-2.5 py-1.5 rounded-xl leading-relaxed ${
                          item.role === 'user'
                            ? 'bg-slate-800 text-slate-100'
                            : 'bg-cyan-950/80 border border-cyan-500/30 text-cyan-50'
                        }`}
                      >
                        <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                          {item.role === 'user' ? 'You' : `SupremeAI (${voiceName})`}
                        </div>
                        <p>{item.text}</p>
                      </div>
                    </div>
                  ))}
                  {liveUserText && (
                    <div className="flex justify-end">
                      <div className="max-w-[88%] px-2.5 py-1.5 rounded-xl bg-slate-800/70 text-slate-300 italic">
                        {liveUserText}
                      </div>
                    </div>
                  )}
                  {liveModelText && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] px-2.5 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-500/30 text-cyan-50">
                        {liveModelText}
                      </div>
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unified Bottom Control Dock (Outside 3D Canvas) */}
      <div className="px-3.5 py-3 border-t border-slate-200/80 dark:border-slate-800/90 bg-white/92 dark:bg-slate-900/92 space-y-2.5 shrink-0">
        {/* Active Avatar & Voice Summary with Settings Shortcut */}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0 text-slate-600 dark:text-slate-300 truncate">
            <span className="font-medium text-slate-900 dark:text-white truncate">{activeAvatarLabel}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="truncate">{voiceName} Voice</span>
          </div>
          {onOpenVoiceSettings && (
            <button
              type="button"
              onClick={onOpenVoiceSettings}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200/90 dark:border-slate-700 text-[10px] font-medium text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Avatar & Voice</span>
            </button>
          )}
        </div>

        {/* Mid-Call Text & Transcribe Audio Input (gemini-3.5-transcribe) */}
        <form onSubmit={handleSendNudge} className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void toggleTranscribeRecording()}
            disabled={isTranscribing}
            aria-label={isTranscribingRec ? 'Stop recording and transcribe audio' : 'Record speech to transcribe with gemini-3.5-transcribe'}
            title={
              isTranscribing
                ? 'Transcribing audio with gemini-3.5-transcribe...'
                : isTranscribingRec
                ? 'Stop & transcribe audio'
                : 'Transcribe microphone audio (gemini-3.5-transcribe)'
            }
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer shrink-0 disabled:opacity-50 ${
              isTranscribingRec
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[var(--theme-accent)]'
            }`}
          >
            {isTranscribing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" />
            ) : isTranscribingRec ? (
              <>
                <Square className="w-3 h-3 fill-current" />
                <span className="font-mono text-[11px]">
                  0:{String(recordingSeconds).padStart(2, '0')}
                </span>
              </>
            ) : (
              <Mic className="w-3.5 h-3.5 theme-accent-text" />
            )}
          </button>

          <input
            type="text"
            value={textNudge}
            onChange={(e) => setTextNudge(e.target.value)}
            disabled={!canSendText}
            placeholder={
              isTranscribingRec
                ? 'Listening for transcription... click stop when done'
                : isTranscribing
                ? 'Transcribing with gemini-3.5-transcribe...'
                : micNotice
                ? 'No mic detected — type to chat with voice...'
                : isSessionActive
                ? 'Type or dictate to talk with avatar...'
                : 'Type or dictate to ask avatar...'
            }
            className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSendText || !textNudge.trim()}
            aria-label="Send text prompt to avatar"
            className="p-2 rounded-xl theme-btn-primary disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Subtle non-fatal mic status helper when hardware microphone is absent */}
        {micNotice && !error && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 px-0.5 truncate">
            {micNotice}
          </p>
        )}

        {/* Primary Call Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {hasMicrophone && (
              <button
                type="button"
                onClick={toggleMute}
                disabled={!isSessionActive}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isMuted
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            )}

            {status === 'speaking' && (
              <button
                type="button"
                onClick={interruptPlayback}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>Interrupt</span>
              </button>
            )}
          </div>

          {isSessionActive ? (
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer ml-auto"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer ml-auto"
            >
              <AudioLines className="w-3.5 h-3.5" />
              <span>Start Voice</span>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
