import React, { useEffect, useState } from 'react';
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

interface LiveVoicePanelProps {
  isOpen: boolean;
  status: LiveSessionStatus;
  voiceName: LiveVoiceName;
  liveModelText: string;
  levelsRef: React.MutableRefObject<{ input: number; output: number }>;
}

export const LiveVoicePanel: React.FC<LiveVoicePanelProps> = ({
  isOpen,
  status,
  voiceName,
  liveModelText,
  levelsRef,
}) => {
  const [avatarPref, setAvatarPref] = useState<AvatarPreference>(() => loadAvatarPreference());

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

  return (
    <aside
      data-testid="live-voice-panel"
      aria-label="3D Real-time Voice Companion"
      data-expression={expression}
      className={`${expressionClass} hidden sm:flex sm:w-[230px] md:w-[300px] lg:w-[350px] xl:w-[400px] shrink-0 h-full bg-transparent flex-col overflow-hidden`}
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
          expression={expression}
          expressionIntensity={intensity}
          isStreaming={isStreaming}
          isDark={isDark}
        />
      </div>
    </aside>
  );
};
