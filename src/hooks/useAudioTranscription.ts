import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAudioTranscriptionOptions {
  onTranscript?: (transcript: string) => void;
  onAudioLevel?: (level: number) => void;
}

export interface UseAudioTranscriptionReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  recordingSeconds: number;
  error: string | null;
  lastTranscript: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  toggleRecording: () => Promise<void>;
  clearError: () => void;
}

function pickSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'audio/webm';
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to encode recorded audio.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Records microphone audio via MediaRecorder, tracks live input levels for
 * avatar animation, and transcribes speech via the server-side `gemini-3.5-transcribe` route.
 */
export function useAudioTranscription(
  options: UseAudioTranscriptionOptions = {}
): UseAudioTranscriptionReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastTranscript, setLastTranscript] = useState('');

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meterRafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMountedRef = useRef(true);

  const cleanupMedia = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (meterRafRef.current) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = 0;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    optionsRef.current.onAudioLevel?.(0);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore unmount stop errors
        }
      }
      cleanupMedia();
    };
  }, [cleanupMedia]);

  const transcribeBlob = useCallback(async (blob: Blob, mimeType: string) => {
    if (!blob || blob.size < 256) {
      if (isMountedRef.current) {
        setError('Recording was too short. Speak briefly and try again.');
      }
      return;
    }

    if (isMountedRef.current) {
      setIsTranscribing(true);
      setError(null);
    }

    try {
      const audioData = await blobToBase64(blob);
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData,
          mimeType: blob.type || mimeType,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || `Transcription request failed (${res.status})`);
      }

      const transcript = String(payload?.transcript || '').trim();
      if (!transcript) {
        throw new Error('No speech detected in the recording.');
      }

      if (isMountedRef.current) {
        setLastTranscript(transcript);
        optionsRef.current.onTranscript?.(transcript);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unable to transcribe audio.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsTranscribing(false);
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isTranscribing) return;
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Microphone recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickSupportedAudioMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Attach live RMS meter so avatar reacts while user speaks into microphone
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const sampleLevel = () => {
            if (!streamRef.current) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / Math.max(1, dataArray.length) / 255;
            optionsRef.current.onAudioLevel?.(Math.min(1, avg * 2.2));
            meterRafRef.current = requestAnimationFrame(sampleLevel);
          };
          meterRafRef.current = requestAnimationFrame(sampleLevel);
        }
      } catch {
        // Live audio level meter is optional; recording still proceeds
      }

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const capturedChunks = chunksRef.current;
        chunksRef.current = [];
        const recorderMime = recorder.mimeType || mimeType;
        cleanupMedia();
        if (isMountedRef.current) {
          setIsRecording(false);
          setRecordingSeconds(0);
        }
        const audioBlob = new Blob(capturedChunks, { type: recorderMime });
        void transcribeBlob(audioBlob, recorderMime);
      };

      recorder.onerror = () => {
        cleanupMedia();
        if (isMountedRef.current) {
          setIsRecording(false);
          setRecordingSeconds(0);
          setError('Microphone recording encountered an error.');
        }
      };

      recorder.start(250);
      setRecordingSeconds(0);
      setIsRecording(true);
      const startedAt = Date.now();
      durationIntervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          setRecordingSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }
      }, 500);
    } catch (err: unknown) {
      cleanupMedia();
      const errName = err instanceof DOMException || err instanceof Error ? err.name : '';
      const message =
        errName === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access.'
          : errName === 'NotFoundError' || errName === 'DevicesNotFoundError'
          ? 'No microphone detected on this device. Connect a microphone or type your message.'
          : err instanceof Error
          ? err.message
          : 'Could not access microphone.';
      setError(message);
    }
  }, [cleanupMedia, isRecording, isTranscribing, transcribeBlob]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        cleanupMedia();
        setIsRecording(false);
      }
    }
  }, [cleanupMedia]);

  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  const clearError = useCallback(() => setError(null), []);

  return {
    isRecording,
    isTranscribing,
    recordingSeconds,
    error,
    lastTranscript,
    startRecording,
    stopRecording,
    toggleRecording,
    clearError,
  };
}
