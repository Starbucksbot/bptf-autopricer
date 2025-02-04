import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';

class Database {
    private pool: Pool;
    private static instance: Database;

    private constructor() {
        this.pool = new Pool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.setupPoolErrorHandler();
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private setupPoolErrorHandler(): void {
        this.pool.on('error', (err, client) => {
            logger.error('Unexpected error on idle client', err);
        });
    }

    public async getClient(): Promise<PoolClient> {
        try {
            return await this.pool.connect();
        } catch (error) {
            logger.error('Error getting database client:', error);
            throw error;
        }
    }

    public async query<T>(text: string, params: any[] = []): Promise<T[]> {
        const client = await this.getClient();
        try {
            const result = await client.query(text, params);
            return result.rows;
        } catch (error) {
            logger.error('Error executing query:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}