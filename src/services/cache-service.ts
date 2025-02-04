import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { config } from '../config';

export class CacheService {
    private redis: Redis;
    private readonly CACHE_TTL = 3600; // 1 hour default TTL

    constructor() {
        this.redis = new Redis({
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password,
            db: config.redis.db,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            }
        });

        this.setupRedisHandlers();
    }

    private setupRedisHandlers(): void {
        this.redis.on('error', (error) => {
            logger.error('Redis error:', error);
        });

        this.redis.on('connect', () => {
            logger.info('Redis connected successfully');
        });
    }

    public async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Error getting cache key ${key}:`, error);
            return null;
        }
    }

    public async set(key: string, value: any, ttl: number = this.CACHE_TTL): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
        } catch (error) {
            logger.error(`Error setting cache key ${key}:`, error);
        }
    }

    public async delete(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (error) {
            logger.error(`Error deleting cache key ${key}:`, error);
        }
    }

    public async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl: number = this.CACHE_TTL): Promise<T | null> {
        const cached = await this.get<T>(key);
        if (cached) return cached;

        try {
            const value = await fetchFn();
            await this.set(key, value, ttl);
            return value;
        } catch (error) {
            logger.error(`Error fetching/caching data for key ${key}:`, error);
            return null;
        }
    }
}