const WebSocket = require('ws');
const config = require('../../config.json');

class BackpackWebSocket {
    constructor() {
        this.ws = null;
        this.connected = false;
        this.eventHandlers = new Map();
        this.connect();
    }

    connect() {
        this.ws = new WebSocket('wss://next.backpack.tf/socket/websocket');
        
        this.ws.on('open', () => {
            this.connected = true;
            console.log('Connected to backpack.tf websocket');
            this.authenticate();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing websocket message:', error);
            }
        });

        this.ws.on('close', () => {
            this.connected = false;
            console.log('Disconnected from backpack.tf websocket, reconnecting in 5s...');
            setTimeout(() => this.connect(), 5000);
        });

        this.ws.on('error', (error) => {
            console.error('Websocket error:', error);
        });
    }

    authenticate() {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: "auth",
                apikey: config.bptfAPIKey
            }));
        }
    }

    handleMessage(message) {
        if (message.type === "authenticated") {
            console.log('Successfully authenticated with backpack.tf');
            this.subscribeToPricing();
        }
        // Handle pricing events
        if (message.type === "pricing#update") {
            if (this.eventHandlers.has('pricing')) {
                this.eventHandlers.get('pricing')(message.data);
            }
        }
    }

    subscribeToPricing() {
        if (this.connected) {
            this.ws.send(JSON.stringify({
                type: "subscribe",
                channel: "pricing"
            }));
        }
    }

    on(event, handler) {
        this.eventHandlers.set(event, handler);
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

module.exports = { BackpackWebSocket };