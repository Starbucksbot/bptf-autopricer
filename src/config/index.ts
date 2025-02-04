import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

export const config = {
    websocket: {
        url: process.env.BPTF_WEBSOCKET_URL || 'wss://ws.backpack.tf/socket',
        reconnectAttempts: parseInt(process.env.WS_RECONNECT_ATTEMPTS || '10'),
        initialReconnectDelay: parseInt(process.env.WS_INITIAL_RECONNECT_DELAY || '1000'),
        maxReconnectDelay: parseInt(process.env.WS_MAX_RECONNECT_DELAY || '30000'),
        heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000')
    },
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        name: process.env.DB_NAME || 'bptf_autopricer',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        schema: process.env.DB_SCHEMA || 'public'
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
    },
    pricing: {
        unusualMinListings: parseInt(process.env.UNUSUAL_MIN_LISTINGS || '2'),
        normalMinListings: parseInt(process.env.NORMAL_MIN_LISTINGS || '3'),
        priceExpiryHours: parseInt(process.env.PRICE_EXPIRY_HOURS || '24'),
        priceHistoryDays: parseInt(process.env.PRICE_HISTORY_DAYS || '30'),
        trustScoreThreshold: parseFloat(process.env.TRUST_SCORE_THRESHOLD || '0.7')
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        directory: process.env.LOG_DIR || path.join(process.cwd(), 'logs')
    }
};