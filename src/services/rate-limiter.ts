import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config';

export class RateLimiter {
    private redis: Redis;
    private readonly DEFAULT_LIMIT = 60; // requests
    private readonly DEFAULT_WINDOW = 60; // seconds

    constructor() {
        this.redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db + 1 // Use a different DB for rate limiting
        });
    }

    public async isRateLimited(key: string, limit: number = this.DEFAULT_LIMIT, window: number = this.DEFAULT_WINDOW): Promise<boolean> {
        const now = Math.floor(Date.now() / 1000);
        const windowKey = `${key}:${Math.floor(now / window)}`;

        try {
            const current = await this.redis.incr(windowKey);
            if (current === 1) {
                await this.redis.expire(windowKey, window);
            }

            return current > limit;
        } catch (error) {
            logger.error(`Rate limiter error for key ${key}:`, error);
            return false; // Fail open if Redis is down
        }
    }

    public async getRemainingRequests(key: string, limit: number = this.DEFAULT_LIMIT, window: number = this.DEFAULT_WINDOW): Promise<number> {
        const now = Math.floor(Date.now() / 1000);
        const windowKey = `${key}:${Math.floor(now / window)}`;

        try {
            const current = await this.redis.get(windowKey);
            return current ? Math.max(0, limit - parseInt(current)) : limit;
        } catch (error) {
            logger.error(`Error getting remaining requests for key ${key}:`, error);
            return 0;
        }
    }
}