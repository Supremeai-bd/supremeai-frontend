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
} from 'lucide-react';
import {
  useLiveVoiceSession,
  LIVE_VOICE_OPTIONS,
  LiveVoiceName,
  LiveSessionStatus,
} from '../../hooks/useLiveVoiceSession';

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemInstruction?: string;
  roleName?: string;
  onCommitTurn?: (userText: string, assistantText: string, voiceName?: string) => void;
}

const STATUS_COPY: Record<LiveSessionStatus, { label: string; dotClass: string }> = {
  idle: { label: 'Ready to connect', dotClass: 'bg-slate-400' },
  connecting: { label: 'Connecting to gemini-3.8-live...', dotClass: 'bg-amber-400 animate-pulse' },
  listening: { label: 'Listening — speak naturally', dotClass: 'bg-emerald-500 animate-pulse' },
  speaking: { label: 'SupremeAI Live speaking...', dotClass: 'bg-cyan-400 animate-ping' },
  muted: { label: 'Microphone muted', dotClass: 'bg-rose-500' },
  error: { label: 'Connection interrupted', dotClass: 'bg-rose-500' },
};

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  systemInstruction,
  roleName = 'Assistant',
  onCommitTurn,
}) => {
  const [syncToChat, setSyncToChat] = useState(true);
  const [textNudge, setTextNudge] = useState('');
  const syncToChatRef = useRef(syncToChat);
  syncToChatRef.current = syncToChat;

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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const hasAutoStartedRef = useRef(false);

  // Auto-start when opened, clean disconnect when closed
  useEffect(() => {
    if (isOpen && !hasAutoStartedRef.current) {
      hasAutoStartedRef.current = true;
      connect();
    } else if (!isOpen && hasAutoStartedRef.current) {
      hasAutoStartedRef.current = false;
      disconnect();
    }
  }, [isOpen, connect, disconnect]);

  // Keep transcript scrolled to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts.length, liveUserText, liveModelText]);

  // 60fps Audio Visualizer Canvas
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;
    let smoothInput = 0;
    let smoothOutput = 0;

    const renderOrb = () => {
      const size = 220;
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
      }

      const cx = size / 2;
      const cy = size / 2;
      ctx.clearRect(0, 0, size, size);

      smoothInput += (levelsRef.current.input - smoothInput) * 0.24;
      smoothOutput += (levelsRef.current.output - smoothOutput) * 0.28;
      const energy = Math.max(smoothInput, smoothOutput);
      phase += 0.038 + energy * 0.08;

      const accentHex =
        getComputedStyle(document.documentElement).getPropertyValue('--theme-accent').trim() ||
        '#06b6d4';

      const baseRadius = 56;
      const barCount = 44;

      // Ambient halo
      const haloRadius = baseRadius + 34 + energy * 24;
      const haloGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.4, cx, cy, haloRadius);
      if (status === 'speaking') {
        haloGrad.addColorStop(0, 'rgba(34, 211, 238, 0.34)');
        haloGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.14)');
        haloGrad.addColorStop(1, 'rgba(34, 211, 238, 0)');
      } else if (status === 'listening') {
        haloGrad.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        haloGrad.addColorStop(0.6, 'rgba(6, 182, 212, 0.12)');
        haloGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        haloGrad.addColorStop(0, 'rgba(148, 163, 184, 0.20)');
        haloGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
      }
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
      ctx.fill();

      // Dynamic spectrum bars around core ring
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const harmonic =
          Math.sin(angle * 3 + phase * 1.4) * 0.5 +
          Math.cos(angle * 5 - phase * 1.9) * 0.5;
        const amp =
          status === 'idle' || status === 'error'
            ? 3
            : 5 + energy * 26 + Math.abs(harmonic) * (6 + energy * 14);

        const r1 = baseRadius + 4;
        const r2 = r1 + amp;
        const x1 = cx + Math.cos(angle) * r1;
        const y1 = cy + Math.sin(angle) * r1;
        const x2 = cx + Math.cos(angle) * r2;
        const y2 = cy + Math.sin(angle) * r2;

        ctx.strokeStyle =
          status === 'speaking'
            ? 'rgba(34, 211, 238, 0.85)'
            : status === 'listening'
            ? 'rgba(16, 185, 129, 0.82)'
            : status === 'muted'
            ? 'rgba(244, 63, 94, 0.55)'
            : accentHex;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Inner pulsing core
      const coreR = baseRadius - 6 + energy * 5;
      const coreGrad = ctx.createLinearGradient(cx - coreR, cy - coreR, cx + coreR, cy + coreR);
      if (status === 'speaking') {
        coreGrad.addColorStop(0, '#06b6d4');
        coreGrad.addColorStop(1, '#3b82f6');
      } else if (status === 'listening') {
        coreGrad.addColorStop(0, '#10b981');
        coreGrad.addColorStop(1, '#06b6d4');
      } else if (status === 'muted' || status === 'error') {
        coreGrad.addColorStop(0, '#e11d48');
        coreGrad.addColorStop(1, '#9f1239');
      } else {
        coreGrad.addColorStop(0, '#64748b');
        coreGrad.addColorStop(1, '#475569');
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      rafId = window.requestAnimationFrame(renderOrb);
    };

    rafId = window.requestAnimationFrame(renderOrb);
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen, status, levelsRef]);

  if (!isOpen) return null;

  const isSessionActive =
    status === 'connecting' ||
    status === 'listening' ||
    status === 'speaking' ||
    status === 'muted';
  const statusMeta = STATUS_COPY[status];

  const handleVoiceSwitch = (nextVoice: LiveVoiceName) => {
    setVoiceName(nextVoice);
    if (isSessionActive) {
      connect(nextVoice);
    }
  };

  const handleSendNudge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textNudge.trim() || !isSessionActive) return;
    sendTextPrompt(textNudge);
    setTextNudge('');
  };

  const handleClose = () => {
    disconnect();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Real-time Voice Conversation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="w-full max-w-2xl rounded-3xl theme-surface-strong border border-slate-200/80 dark:border-slate-700/80 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl theme-btn-primary flex items-center justify-center shrink-0">
              <AudioLines className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Voice Conversation
                </h2>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {roleName} · Low-latency bidirectional audio (16kHz / 24kHz PCM)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSyncToChat((v) => !v)}
              title="Automatically save voice turns into active chat thread"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                syncToChat
                  ? 'theme-accent-active'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {syncToChat && <Check className="w-3 h-3" />}
              <span>Sync Chat</span>
            </button>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close voice conversation"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voice Selector & Status Bar */}
        <div className="px-5 py-2.5 bg-slate-50/70 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-medium">
            <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
            <span>{statusMeta.label}</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {LIVE_VOICE_OPTIONS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVoiceSwitch(v.id)}
                title={`${v.label}: ${v.tone}`}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                  voiceName === v.id
                    ? 'theme-accent-active border'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visualizer + Error Banner */}
        <div className="px-5 pt-4 pb-2 flex flex-col items-center justify-center shrink-0">
          {error && (
            <div className="w-full mb-3 px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => connect()}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-500/15 hover:bg-rose-500/25 font-semibold cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div className="relative flex items-center justify-center">
            <canvas ref={canvasRef} className="w-[180px] h-[180px]" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <AudioLines className="w-8 h-8 text-white drop-shadow-sm" />
            </div>
          </div>
        </div>

        {/* Live Transcript Feed */}
        <div className="flex-1 min-h-[140px] max-h-60 overflow-y-auto px-5 py-3 space-y-2.5">
          {transcripts.length === 0 && !liveUserText && !liveModelText ? (
            <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
              Speak into your microphone to start talking with SupremeAI Live, or type a message below to guide the voice session.
            </div>
          ) : (
            <>
              {transcripts.map((item) => (
                <div
                  key={item.id}
                  className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      item.role === 'user'
                        ? 'bg-slate-200/85 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-br-sm'
                        : 'theme-accent-active border rounded-bl-sm'
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
                  <div className="max-w-[82%] px-3.5 py-2 rounded-2xl rounded-br-sm bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 text-xs italic">
                    <div className="text-[10px] font-semibold opacity-60 mb-0.5">You (live)</div>
                    <p>{liveUserText}</p>
                  </div>
                </div>
              )}

              {liveModelText && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] px-3.5 py-2 rounded-2xl rounded-bl-sm theme-accent-active border text-xs">
                    <div className="text-[10px] font-semibold opacity-70 mb-0.5">
                      SupremeAI ({voiceName})
                    </div>
                    <p>{liveModelText}</p>
                  </div>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </>
          )}
        </div>

        {/* Mid-Call Text Input + Voice Call Controls */}
        <div className="px-5 py-4 border-t border-slate-200/70 dark:border-slate-800/80 space-y-3 bg-slate-50/60 dark:bg-slate-950/35">
          <form onSubmit={handleSendNudge} className="flex items-center gap-2">
            <input
              type="text"
              value={textNudge}
              onChange={(e) => setTextNudge(e.target.value)}
              disabled={!isSessionActive}
              placeholder={
                isSessionActive
                  ? 'Optional: send text context while speaking...'
                  : 'Start voice session to send live context...'
              }
              className="flex-1 px-3.5 py-2 rounded-xl theme-input-surface border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none disabled:opacity-50"
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

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                disabled={!isSessionActive}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isMuted
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
              </button>

              {status === 'speaking' && (
                <button
                  type="button"
                  onClick={interruptPlayback}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Interrupt</span>
                </button>
              )}

              {transcripts.length > 0 && (
                <button
                  type="button"
                  onClick={clearTranscripts}
                  title="Clear transcript display"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSessionActive ? (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Voice Chat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => connect()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl theme-btn-primary text-xs font-semibold cursor-pointer"
              >
                <AudioLines className="w-3.5 h-3.5" />
                <span>Start Voice Chat</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
