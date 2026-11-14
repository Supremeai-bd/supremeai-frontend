import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { LiveSessionStatus, LiveVoiceName } from '../../hooks/useLiveVoiceSession';
import { LiveVoiceAvatarCanvas } from './LiveVoiceAvatarCanvas';
import { useThemeStore } from '../../stores/useThemeStore';
import { useChatStore } from '../../stores/useChatStore';
import { useAvatarExpression } from '../../hooks/useAvatarExpression';
import {
  AvatarPreference,
  loadAvatarPreference,
  resolveAvatarSource,
  VOICE_AVATAR_SYNC_EVENT,
} from '../../utils/hologramAvatar';
import { useI18n } from '../../utils/i18n';

interface LiveVoicePanelProps {
  isOpen: boolean;
  status: LiveSessionStatus;
  voiceName: LiveVoiceName;
  liveModelText: string;
  levelsRef: React.MutableRefObject<{ input: number; output: number }>;
  canReadAgain?: boolean;
  onReadAgain?: () => void;
}

export const LiveVoicePanel: React.FC<LiveVoicePanelProps> = ({
  isOpen,
  status,
  voiceName,
  liveModelText,
  levelsRef,
  canReadAgain = false,
  onReadAgain,
}) => {
  const [avatarPref, setAvatarPref] = useState<AvatarPreference>(() => loadAvatarPreference());
  const { t } = useI18n();

  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const latestAssistantContent = useChatStore((s) => {
    const session = s.sessions.find((sess) => sess.id === s.activeSessionId);
    if (!session || session.messages.length === 0) return '';
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].role === 'assistant' && session.messages[i].content.trim()) {
        return session.messages[i].content;
      }
    }
    return '';
  });
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

  const { expression, expressionClass, intensity } = useAvatarExpression({
    streamingContent,
    isStreaming,
    voiceText: liveModelText,
    latestAssistantContent,
    isConnecting: status === 'connecting',
  });

  if (!isOpen) return null;

  const statusWhisper =
    status === 'connecting'
      ? t.voiceStatusConnecting
      : status === 'speaking'
      ? `${t.voiceStatusSpeaking} · ${voiceName}`
      : status === 'listening'
      ? t.voiceStatusListening
      : status === 'muted'
      ? t.voiceStatusMuted
      : `${t.voiceStatusReady} · ${voiceName}`;

  return (
    <aside
      data-testid="live-voice-panel"
      aria-label="3D Real-time Voice Companion"
      data-expression={expression}
      className={`${expressionClass} hidden sm:flex sm:w-[230px] md:w-[300px] lg:w-[350px] xl:w-[400px] shrink-0 h-full bg-transparent border-0 flex-col overflow-hidden relative select-none`}
    >
      <div className="flex-1 w-full h-full min-h-[240px] relative bg-transparent overflow-hidden">
        <LiveVoiceAvatarCanvas
          status={status}
          voiceName={voiceName}
          levelsRef={levelsRef}
          avatarSrc={activeAvatarSource.src}
          isPrestyledHologram={activeAvatarSource.isPrestyledHologram}
          avatarPreset={avatarPref.preset}
          customTraits={avatarPref.customTraits}
          renderingQuality={avatarPref.renderQuality || 'ultra'}
          expression={expression}
          expressionIntensity={intensity}
          isStreaming={isStreaming}
          isDark={isDark}
        />
      </div>

      <div className="pb-4 px-3 flex flex-wrap items-center justify-center gap-2">
        <span className="pointer-events-none inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-slate-600/90 dark:text-cyan-200/80 drop-shadow-[0_1px_6px_rgba(255,255,255,0.65)] dark:drop-shadow-[0_1px_8px_rgba(0,0,0,0.8)] whitespace-nowrap">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              status === 'speaking'
                ? 'bg-emerald-400 animate-ping'
                : status === 'listening'
                ? 'bg-cyan-400 animate-pulse'
                : status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span>{statusWhisper}</span>
        </span>

        {onReadAgain && (
          <button
            type="button"
            data-testid="voice-read-again-btn"
            onClick={onReadAgain}
            disabled={!canReadAgain}
            title={canReadAgain ? t.readAgainTooltip : t.noPreviousResponse}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
              canReadAgain
                ? 'border-slate-200/90 dark:border-cyan-500/35 bg-white/90 dark:bg-slate-900/85 text-slate-700 dark:text-cyan-100 hover:border-[var(--theme-accent)] hover:text-slate-900 dark:hover:text-white cursor-pointer shadow-xs'
                : 'border-slate-200/50 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-3 h-3 shrink-0" />
            <span>{t.readAgain}</span>
          </button>
        )}
      </div>
    </aside>
  );
};
