import EventEmitter from 'eventemitter3';
import { WSMessage } from '../types';

const INITIAL_DELAY = 1000;
const MAX_DELAY = 30000;
const JITTER_RANGE = 1000;

export class WebSocketAPI extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectDelay = INITIAL_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldConnect = false;
  private connected = false;

  constructor(url: string) {
    super();
    this.url = url;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  connect(): void {
    this.shouldConnect = true;
    this.openConnection();
  }

  disconnect(): void {
    this.shouldConnect = false;
    this.cancelReconnect();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.connected = false;
  }

  send(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private openConnection(): void {
    if (!this.shouldConnect || !this.url) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.connected = true;
        this.reconnectDelay = INITIAL_DELAY;
        this.emit('connect');
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const message: WSMessage = JSON.parse(event.data as string);
          this.emit('message', message);
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.connected = false;
        this.emit('disconnect', event.code);
        if (this.shouldConnect && event.code !== 1000) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.emit('error');
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    this.cancelReconnect();
    const jitter = Math.random() * JITTER_RANGE;
    const delay = Math.min(this.reconnectDelay + jitter, MAX_DELAY);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_DELAY);

    this.reconnectTimer = setTimeout(() => {
      this.openConnection();
    }, delay);
  }

  private cancelReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}
