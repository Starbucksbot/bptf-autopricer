const { Pool } = require('pg');
const config = require('../../config.json');

async function initializeDatabase() {
    let tempPool = null;
    let appPool = null;

    try {
        // First connect to postgres database
        tempPool = new Pool({
            host: config.database.host,
            port: config.database.port,
            database: 'postgres',
            user: config.database.user,
            password: config.database.password
        });

        // Check if our database exists
        const result = await tempPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [config.database.name]
        );

        if (result.rows.length === 0) {
            // Create database if it doesn't exist
            await tempPool.query(`CREATE DATABASE ${config.database.name}`);
            console.log(`Created database: ${config.database.name}`);
        }

        // Close temporary connection
        await tempPool.end();

        // Now connect to our application database
        appPool = new Pool({
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password
        });

        // Create necessary tables
        await appPool.query(`
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                sku VARCHAR(255) NOT NULL,
                price DECIMAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS snapshots (
                id SERIAL PRIMARY KEY,
                sku VARCHAR(255) NOT NULL,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS listings_sku_idx ON listings(sku);
            CREATE INDEX IF NOT EXISTS snapshots_sku_idx ON snapshots(sku);
        `);

        console.log('Database tables initialized successfully');

    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    } finally {
        if (appPool) {
            await appPool.end().catch(console.error);
        }
        if (tempPool && !tempPool.ended) {
            await tempPool.end().catch(console.error);
        }
    }
}

module.exports = { initializeDatabase };