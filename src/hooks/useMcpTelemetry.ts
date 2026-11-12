import { useCallback } from 'react';
import { useRealtimeStream, StreamConnectionStatus } from './useRealtimeStream';
import { useAdminStore } from '../stores/useAdminStore';
import { McpTowerService } from '../types';

interface TelemetryStreamPayload {
  type: 'init' | 'telemetry_tick' | 'heartbeat';
  timestamp: number;
  services: McpTowerService[];
}

/**
 * Hook to connect MCP Tower with the live SSE pipeline.
 * Seamlessly feeds server metrics into the Zustand useAdminStore.
 */
export function useMcpTelemetry(enabled: boolean = true) {
  const handleIncomingTelemetry = useCallback((data: TelemetryStreamPayload) => {
    if (data && Array.isArray(data.services) && data.services.length > 0) {
      useAdminStore.setState({ mcpServices: data.services });
    }
  }, []);

  const { status, lastHeartbeat, isConnected, reconnect } = useRealtimeStream<TelemetryStreamPayload>({
    url: '/api/mcp-tower/stream',
    enabled,
    onMessage: handleIncomingTelemetry,
  });

  return {
    status,
    lastHeartbeat,
    isConnected,
    reconnect,
  };
}
