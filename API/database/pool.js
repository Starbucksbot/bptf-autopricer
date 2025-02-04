const { Pool } = require('pg');
const config = require('../../config.json');

// Create pool for application database
const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password
});

module.exports = { pool };