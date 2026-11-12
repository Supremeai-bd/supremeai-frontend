import { useState, useEffect, useRef, useCallback } from 'react';

export type StreamConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface UseRealtimeStreamOptions<T> {
  url: string;
  enabled?: boolean;
  onMessage?: (data: T) => void;
  onError?: (err: Event | Error) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface UseRealtimeStreamReturn<T> {
  status: StreamConnectionStatus;
  lastHeartbeat: number | null;
  lastData: T | null;
  reconnect: () => void;
  disconnect: () => void;
  isConnected: boolean;
}

/**
 * Robust Client Hook for Real-time Server-Sent Events (SSE) and live telemetry streams.
 * Includes automatic reconnection backoff, heartbeat tracking, and clean lifecycle management.
 */
export function useRealtimeStream<T = unknown>({
  url,
  enabled = true,
  onMessage,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}: UseRealtimeStreamOptions<T>): UseRealtimeStreamReturn<T> {
  const [status, setStatus] = useState<StreamConnectionStatus>('disconnected');
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const [lastData, setLastData] = useState<T | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);

  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    cleanup();

    if (!enabled) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');
    isManuallyClosedRef.current = false;

    try {
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        reconnectAttemptsRef.current = 0;
        setLastHeartbeat(Date.now());
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as T;
          setLastData(parsed);
          setLastHeartbeat(Date.now());
          if (onMessageRef.current) {
            onMessageRef.current(parsed);
          }
        } catch {
          // Non-JSON ping
          setLastHeartbeat(Date.now());
        }
      };

      es.onerror = (err) => {
        if (isManuallyClosedRef.current) return;

        es.close();
        setStatus('error');

        if (onErrorRef.current) {
          onErrorRef.current(err);
        }

        // Attempt reconnection if within threshold
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = reconnectInterval * Math.min(reconnectAttemptsRef.current, 3);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          setStatus('disconnected');
        }
      };
    } catch (err: unknown) {
      setStatus('error');
      if (onErrorRef.current && err instanceof Error) {
        onErrorRef.current(err);
      }
    }
  }, [url, enabled, cleanup, reconnectInterval, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    return () => {
      isManuallyClosedRef.current = true;
      cleanup();
    };
  }, [connect, cleanup]);

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true;
    cleanup();
    setStatus('disconnected');
  }, [cleanup]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  return {
    status,
    lastHeartbeat,
    lastData,
    reconnect,
    disconnect,
    isConnected: status === 'connected',
  };
}
