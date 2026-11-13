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
} from 'lucide-react';
import {
  useLiveVoiceSession,
  LiveSessionStatus,
} from '../../hooks/useLiveVoiceSession';
import { LiveVoiceAvatarCanvas } from './LiveVoiceAvatarCanvas';
import { useThemeStore } from '../../stores/useThemeStore';
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
  onOpenVoiceSettings,
}) => {
  const [syncToChat, setSyncToChat] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
  const [textNudge, setTextNudge] = useState('');
  const [avatarPref, setAvatarPref] = useState<AvatarPreference>(() => loadAvatarPreference());
  const syncToChatRef = useRef(syncToChat);
  syncToChatRef.current = syncToChat;

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
      ? 'Custom Hologram'
      : AVATAR_PRESETS.find((p) => p.id === avatarPref.preset)?.label || 'Female Hologram';

  const handleSendNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textNudge.trim() || !isSessionActive) return;
    sendTextPrompt(textNudge);
    setTextNudge('');
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
    : latestTurn
    ? latestTurn.role === 'user'
      ? 'You'
      : `SupremeAI (${voiceName})`
    : null;
  const captionText = liveModelText || liveUserText || latestTurn?.text || '';

  return (
    <aside
      data-testid="live-voice-panel"
      aria-label="3D Real-time Voice Companion"
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen bg-slate-100/88 dark:bg-slate-950/86 flex flex-col overflow-hidden'
          : 'fixed inset-0 z-40 md:static md:z-auto w-full md:w-[340px] lg:w-[370px] xl:w-[400px] shrink-0 h-full border-l border-slate-200/70 dark:border-slate-800/80 bg-slate-100/92 dark:bg-slate-950/90 md:bg-transparent dark:md:bg-transparent flex flex-col overflow-hidden'
      }
    >
      {/* Top Bar (Outside 3D Canvas Viewport) */}
      <div className="px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800/90 bg-white/92 dark:bg-slate-900/92 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg theme-btn-primary flex items-center justify-center shrink-0">
            <AudioLines className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                3D Voice Avatar
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-200">
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dotColor}`} />
                <span>{statusMeta.label}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {roleName} · gemini-3.8-live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setSyncToChat((v) => !v)}
            title="Save spoken turns directly to chat conversation"
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border transition-colors cursor-pointer ${
              syncToChat
                ? 'theme-accent-active'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {syncToChat && <Check className="w-3 h-3" />}
            <span>Sync Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTranscriptDrawer((v) => !v)}
            title={showTranscriptDrawer ? 'Hide voice transcript' : 'Show voice transcript'}
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

      {/* Error Banner */}
      {error && (
        <div className="px-3.5 py-2 bg-rose-950/90 border-b border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <p className="flex-1 min-w-0 truncate">{error}</p>
          <button
            type="button"
            onClick={() => connect()}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/35 text-[11px] font-semibold cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Unobstructed Transparent 3D Hologram Viewport */}
      <div className="flex-1 min-h-[260px] relative bg-transparent overflow-hidden">
        <LiveVoiceAvatarCanvas
          status={status}
          voiceName={voiceName}
          levelsRef={levelsRef}
          avatarSrc={activeAvatarSource.src}
          isPrestyledHologram={activeAvatarSource.isPrestyledHologram}
          isDark={isDark}
        />

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

        {/* Optional Collapsible Transcript Drawer (Solid surface, no backdrop-blur) */}
        {showTranscriptDrawer && (
          <div className="absolute inset-x-3 bottom-3 max-h-[55%] rounded-2xl bg-slate-950/95 border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-semibold">Live Voice Transcript</span>
              <div className="flex items-center gap-1.5">
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

        {/* Mid-Call Text Context Input */}
        <form onSubmit={handleSendNudge} className="flex items-center gap-1.5">
          <input
            type="text"
            value={textNudge}
            onChange={(e) => setTextNudge(e.target.value)}
            disabled={!isSessionActive}
            placeholder={
              isSessionActive
                ? 'Type context to guide the 3D avatar...'
                : 'Start voice chat to send context...'
            }
            className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/90 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isSessionActive || !textNudge.trim()}
            aria-label="Send text prompt to voice session"
            className="p-2 rounded-xl theme-btn-primary disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Primary Call Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Call</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer"
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
