import ReconnectingWebSocket from 'reconnecting-websocket';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

export class WebSocketHandler extends EventEmitter {
    private ws: ReconnectingWebSocket;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private readonly MAX_RECONNECT_ATTEMPTS = 10;
    private readonly HEARTBEAT_INTERVAL = 30000;
    private readonly INITIAL_RECONNECT_DELAY = 1000;
    private readonly MAX_RECONNECT_DELAY = 30000;

    constructor(url: string) {
        super();
        this.ws = new ReconnectingWebSocket(url, [], {
            WebSocket: ws,
            connectionTimeout: 4000,
            maxRetries: this.MAX_RECONNECT_ATTEMPTS,
            maxReconnectionDelay: this.MAX_RECONNECT_DELAY,
            minReconnectionDelay: this.INITIAL_RECONNECT_DELAY
        });

        this.setupEventHandlers();
        this.startHeartbeat();
    }

    private setupEventHandlers(): void {
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
            this.emit('connected');
            this.startHeartbeat();
        };

        this.ws.onclose = () => {
            this.stopHeartbeat();
            this.emit('disconnected');
            
            if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
                this.emit('max_retries_reached');
                return;
            }
            
            this.reconnectAttempts++;
            const delay = this.getReconnectDelay();
            setTimeout(() => this.ws.reconnect(), delay);
        };

        this.ws.onerror = (error) => {
            this.emit('error', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data.toString());
                this.emit('message', data);
            } catch (error) {
                this.emit('error', new Error('Failed to parse message'));
            }
        };
    }

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, this.HEARTBEAT_INTERVAL);
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private getReconnectDelay(): number {
        return Math.min(
            this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
            this.MAX_RECONNECT_DELAY
        );
    }

    public send(data: any): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.emit('error', new Error('WebSocket is not connected'));
        }
    }

    public close(): void {
        this.stopHeartbeat();
        this.ws.close();
    }
}