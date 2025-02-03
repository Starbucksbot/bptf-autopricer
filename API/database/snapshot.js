const { pool } = require('./pool');

async function insertSnapshotData(listing) {
    const query = `
        INSERT INTO tf2.snapshot (
            sku,
            keys,
            metal,
            time,
            steamid,
            deleted,
            automated,
            blacklisted,
            scm
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;
    
    const values = [
        listing.sku,
        listing.keys || 0,
        listing.metal || 0,
        listing.time,
        listing.steamid,
        listing.deleted || false,
        listing.automated || false,
        listing.blacklisted || false,
        listing.scm || 0
    ];

    try {
        await pool.query(query, values);
    } catch (error) {
        console.error('Error inserting snapshot data:', error);
        throw error;
    }
}

module.exports = {
    insertSnapshotData
};