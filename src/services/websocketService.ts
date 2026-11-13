import { env } from '../config/env';
import { mockDataSync } from './mockDataSyncService';

export class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval: ReturnType<typeof setTimeout> | null = null;
  private isConnected = false;

  connect() {
    if (this.socket && this.isConnected) {
      return;
    }

    const wsUrl = env.wsBaseUrl.replace(/^http/, 'ws');

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        console.log('✅ WebSocket connected to', wsUrl);

        if (!env.isMockEnabled) {
          mockDataSync.syncAllMockData().catch(() => {});
        }
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch {}
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.warn('WebSocket connection notice:', error);
      };
    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectInterval = setTimeout(() => {
      this.connect();
    }, 5000);
  }

  private handleMessage(data: any) {
    switch (data?.type) {
      case 'customer_updated':
        console.log('Real-time Customer update received:', data.customer);
        break;
      case 'mcp_service_updated':
        console.log('Real-time MCP service update received:', data.service);
        break;
      case 'sync_complete':
        console.log('Real-time sync completed successfully:', data);
        break;
      default:
        break;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    this.isConnected = false;
  }

  send(message: any) {
    if (this.socket && this.isConnected) {
      this.socket.send(JSON.stringify(message));
    }
  }

  public getConnectionState(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();
