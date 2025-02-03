const { pool } = require('./pool');

async function initializeDatabase() {
    const createTablesQuery = `
        CREATE TABLE IF NOT EXISTS listings (
            id SERIAL PRIMARY KEY,
            sku VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            buy DECIMAL,
            sell DECIMAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS snapshots (
            id SERIAL PRIMARY KEY,
            listing_id INTEGER REFERENCES listings(id),
            buy DECIMAL,
            sell DECIMAL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        await pool.query(createTablesQuery);
        console.log('Database tables created successfully');
    } catch (error) {
        console.error('Error creating database tables:', error);
        throw error;
    }
}

// Execute the initialization
initializeDatabase()
    .then(() => {
        console.log('Database initialization completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database initialization failed:', error);
        process.exit(1);
    });