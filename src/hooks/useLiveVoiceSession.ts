import { useState, useRef, useCallback, useEffect } from 'react';

export type LiveVoiceName = 'Zephyr' | 'Puck' | 'Kore' | 'Charon' | 'Fenrir';

export const LIVE_VOICE_OPTIONS: Array<{
  id: LiveVoiceName;
  label: string;
  tone: string;
}> = [
  { id: 'Zephyr', label: 'Zephyr', tone: 'Bright & balanced' },
  { id: 'Puck', label: 'Puck', tone: 'Upbeat & lively' },
  { id: 'Kore', label: 'Kore', tone: 'Clear & articulate' },
  { id: 'Charon', label: 'Charon', tone: 'Warm & composed' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Crisp & direct' },
];

export type LiveSessionStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'muted'
  | 'error';

export interface LiveTranscriptItem {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface UseLiveVoiceSessionOptions {
  systemInstruction?: string;
  onTurnCommitted?: (userText: string, assistantText: string, voice: LiveVoiceName) => void;
}

function resampleFloat32(
  input: Float32Array,
  sourceRate: number,
  targetRate: number
): Float32Array {
  if (sourceRate === targetRate || input.length === 0) return input;
  const ratio = sourceRate / targetRate;
  const outputLength = Math.max(1, Math.round(input.length / ratio));
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const low = Math.floor(srcIndex);
    const high = Math.min(low + 1, input.length - 1);
    const frac = srcIndex - low;
    output[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return output;
}

function float32ToBase64Pcm16(samples: Float32Array): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const sampleCount = Math.floor(bytes.byteLength / 2);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = view.getInt16(i * 2, true) / 32768;
  }
  return float32;
}

function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    sum += s * s;
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 4.2);
}

export function useLiveVoiceSession({
  systemInstruction,
  onTurnCommitted,
}: UseLiveVoiceSessionOptions = {}) {
  const [status, setStatus] = useState<LiveSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [voiceName, setVoiceName] = useState<LiveVoiceName>('Zephyr');
  const [isMuted, setIsMuted] = useState(false);
  const [transcripts, setTranscripts] = useState<LiveTranscriptItem[]>([]);
  const [liveUserText, setLiveUserText] = useState('');
  const [liveModelText, setLiveModelText] = useState('');

  // Mutable refs for real-time audio callbacks (avoids stale closures & 60fps React renders)
  const wsRef = useRef<WebSocket | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const outputCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const muteGainRef = useRef<GainNode | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;

  const voiceRef = useRef<LiveVoiceName>(voiceName);
  voiceRef.current = voiceName;

  const systemInstructionRef = useRef<string | undefined>(systemInstruction);
  systemInstructionRef.current = systemInstruction;

  const onTurnCommittedRef = useRef(onTurnCommitted);
  onTurnCommittedRef.current = onTurnCommitted;

  const pendingUserTextRef = useRef<string>('');
  const pendingModelTextRef = useRef<string>('');
  const levelsRef = useRef<{ input: number; output: number }>({ input: 0, output: 0 });
  const teardownGuardRef = useRef<boolean>(false);

  const flushPendingTurn = useCallback(() => {
    const uText = pendingUserTextRef.current.trim();
    const mText = pendingModelTextRef.current.trim();
    if (!uText && !mText) return;

    const now = Date.now();
    const additions: LiveTranscriptItem[] = [];
    if (uText) {
      additions.push({
        id: `live_u_${now}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        text: uText,
        timestamp: now,
      });
    }
    if (mText) {
      additions.push({
        id: `live_m_${now + 1}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'assistant',
        text: mText,
        timestamp: now + 1,
      });
    }

    pendingUserTextRef.current = '';
    pendingModelTextRef.current = '';
    setLiveUserText('');
    setLiveModelText('');
    setTranscripts((prev) => [...prev, ...additions]);

    if (onTurnCommittedRef.current) {
      onTurnCommittedRef.current(uText, mText, voiceRef.current);
    }
  }, []);

  const stopAllPlayback = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.onended = null;
        src.stop();
        src.disconnect();
      } catch {
        // Ignore stopped source errors
      }
    }
    activeSourcesRef.current.clear();
    if (outputCtxRef.current) {
      nextStartTimeRef.current = outputCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    levelsRef.current.output = 0;
  }, []);

  const cleanupMediaAndSocket = useCallback(
    (preserveError: boolean = false) => {
      teardownGuardRef.current = true;

      flushPendingTurn();
      stopAllPlayback();

      if (processorRef.current) {
        try {
          processorRef.current.onaudioprocess = null;
          processorRef.current.disconnect();
        } catch {}
        processorRef.current = null;
      }
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
        } catch {}
        sourceNodeRef.current = null;
      }
      if (muteGainRef.current) {
        try {
          muteGainRef.current.disconnect();
        } catch {}
        muteGainRef.current = null;
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          try {
            track.stop();
          } catch {}
        }
        streamRef.current = null;
      }
      if (inputCtxRef.current) {
        inputCtxRef.current.close().catch(() => {});
        inputCtxRef.current = null;
      }
      if (outputCtxRef.current) {
        outputCtxRef.current.close().catch(() => {});
        outputCtxRef.current = null;
      }
      if (wsRef.current) {
        const ws = wsRef.current;
        wsRef.current = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          try {
            ws.close();
          } catch {}
        }
      }

      levelsRef.current = { input: 0, output: 0 };
      if (!preserveError) {
        setStatus('idle');
      }
    },
    [flushPendingTurn, stopAllPlayback]
  );

  const playAudioChunk = useCallback((base64Pcm: string) => {
    const outputCtx = outputCtxRef.current;
    if (!outputCtx) return;
    if (outputCtx.state === 'suspended') {
      outputCtx.resume().catch(() => {});
    }

    const float32 = base64Pcm16ToFloat32(base64Pcm);
    if (float32.length === 0) return;

    levelsRef.current.output = computeRms(float32);

    const audioBuffer = outputCtx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = outputCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputCtx.destination);

    const now = outputCtx.currentTime;
    const startAt = Math.max(now, nextStartTimeRef.current);
    nextStartTimeRef.current = startAt + audioBuffer.duration;

    activeSourcesRef.current.add(source);
    setStatus('speaking');

    source.onended = () => {
      activeSourcesRef.current.delete(source);
      if (activeSourcesRef.current.size === 0) {
        levelsRef.current.output = 0;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          setStatus(isMutedRef.current ? 'muted' : 'listening');
        }
      }
    };

    source.start(startAt);
  }, []);

  const connect = useCallback(
    async (overrideVoice?: LiveVoiceName) => {
      cleanupMediaAndSocket(false);
      teardownGuardRef.current = false;

      const selectedVoice = overrideVoice || voiceRef.current;
      if (overrideVoice) {
        setVoiceName(overrideVoice);
        voiceRef.current = overrideVoice;
      }

      setError(null);
      setStatus('connecting');

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Microphone capture is not supported in this browser environment.');
        }

        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) {
          throw new Error('Web Audio API is unavailable in this browser.');
        }

        // Capture 16kHz input and create 24kHz playback context per Live API spec
        const inputCtx = new AudioCtx({ sampleRate: 16000 });
        const outputCtx = new AudioCtx({ sampleRate: 24000 });
        await inputCtx.resume();
        await outputCtx.resume();

        inputCtxRef.current = inputCtx;
        outputCtxRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (teardownGuardRef.current) {
          for (const t of stream.getTracks()) t.stop();
          return;
        }

        streamRef.current = stream;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/api/live`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        const silentGain = inputCtx.createGain();
        silentGain.gain.value = 0;

        source.connect(processor);
        processor.connect(silentGain);
        silentGain.connect(inputCtx.destination);

        sourceNodeRef.current = source;
        processorRef.current = processor;
        muteGainRef.current = silentGain;

        processor.onaudioprocess = (event) => {
          const activeWs = wsRef.current;
          if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;

          if (isMutedRef.current) {
            levelsRef.current.input = 0;
            return;
          }

          const rawInput = event.inputBuffer.getChannelData(0);
          levelsRef.current.input = computeRms(rawInput);

          const pcm16k = resampleFloat32(rawInput, inputCtx.sampleRate, 16000);
          const base64Audio = float32ToBase64Pcm16(pcm16k);
          activeWs.send(JSON.stringify({ type: 'audio', data: base64Audio }));
        };

        ws.onopen = () => {
          ws.send(
            JSON.stringify({
              type: 'init',
              voiceName: selectedVoice,
              systemInstruction: systemInstructionRef.current || '',
            })
          );
        };

        ws.onmessage = (event) => {
          let msg: any;
          try {
            msg = JSON.parse(event.data);
          } catch {
            return;
          }

          if (msg.type === 'connected' || msg.type === 'setup_complete') {
            setStatus(isMutedRef.current ? 'muted' : 'listening');
          } else if (msg.type === 'audio' && typeof msg.data === 'string') {
            playAudioChunk(msg.data);
          } else if (msg.type === 'input_transcript' && typeof msg.text === 'string') {
            pendingUserTextRef.current += msg.text;
            setLiveUserText(pendingUserTextRef.current);
          } else if (msg.type === 'output_transcript' && typeof msg.text === 'string') {
            pendingModelTextRef.current += msg.text;
            setLiveModelText(pendingModelTextRef.current);
          } else if (msg.type === 'interrupted') {
            stopAllPlayback();
            flushPendingTurn();
            setStatus(isMutedRef.current ? 'muted' : 'listening');
          } else if (msg.type === 'turn_complete') {
            flushPendingTurn();
            if (activeSourcesRef.current.size === 0) {
              setStatus(isMutedRef.current ? 'muted' : 'listening');
            }
          } else if (msg.type === 'error') {
            const errMsg = String(msg.message || 'Live API error.');
            setError(errMsg);
            setStatus('error');
            cleanupMediaAndSocket(true);
          } else if (msg.type === 'closed') {
            cleanupMediaAndSocket(false);
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error while talking to SupremeAI Live service.');
          setStatus('error');
          cleanupMediaAndSocket(true);
        };

        ws.onclose = () => {
          if (!teardownGuardRef.current) {
            cleanupMediaAndSocket(false);
          }
        };
      } catch (err: unknown) {
        const message =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Microphone permission was denied. Please allow microphone access to start a voice conversation.'
            : err instanceof Error
            ? err.message
            : 'Unable to start voice conversation.';
        setError(message);
        setStatus('error');
        cleanupMediaAndSocket(true);
      }
    },
    [cleanupMediaAndSocket, flushPendingTurn, playAudioChunk, stopAllPlayback]
  );

  const disconnect = useCallback(() => {
    setError(null);
    cleanupMediaAndSocket(false);
  }, [cleanupMediaAndSocket]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (next) {
        levelsRef.current.input = 0;
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'audio_end' }));
        }
        if (activeSourcesRef.current.size === 0) {
          setStatus('muted');
        }
      } else if (wsRef.current?.readyState === WebSocket.OPEN && activeSourcesRef.current.size === 0) {
        setStatus('listening');
      }
      return next;
    });
  }, []);

  const sendTextPrompt = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const now = Date.now();
    setTranscripts((prev) => [
      ...prev,
      {
        id: `live_txt_${now}`,
        role: 'user',
        text: trimmed,
        timestamp: now,
      },
    ]);
    wsRef.current.send(JSON.stringify({ type: 'text', text: trimmed }));
  }, []);

  const interruptPlayback = useCallback(() => {
    stopAllPlayback();
    flushPendingTurn();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setStatus(isMutedRef.current ? 'muted' : 'listening');
    }
  }, [flushPendingTurn, stopAllPlayback]);

  const clearTranscripts = useCallback(() => {
    pendingUserTextRef.current = '';
    pendingModelTextRef.current = '';
    setLiveUserText('');
    setLiveModelText('');
    setTranscripts([]);
  }, []);

  useEffect(() => {
    return () => {
      cleanupMediaAndSocket(false);
    };
  }, [cleanupMediaAndSocket]);

  return {
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
  };
}
