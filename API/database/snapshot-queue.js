const { pool } = require('./pool');

class SnapshotQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.batchSize = 500; // Handle bulk pricing events
        this.processInterval = 30000; // Process every 0.5 minutes (30000 ms)
        this.priceCalculationInterval = 42000; // Calculate prices every 0.7 minutes (42000 ms)
        this.lastPriceCalculation = new Date();
        this.start();
    }

    add(listing) {
        // Deduplicate by SKU, keeping only the most recent entry
        const existingIndex = this.queue.findIndex(item => item.sku === listing.sku);
        if (existingIndex !== -1) {
            if (listing.time > this.queue[existingIndex].time) {
                this.queue[existingIndex] = listing;
            }
        } else {
            this.queue.push(listing);
        }
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        try {
            const now = new Date();
            const timeSinceLastCalculation = now - this.lastPriceCalculation;

            // Process bulk updates
            const batch = this.queue.splice(0, this.batchSize);
            const query = `
                INSERT INTO tf2.snapshot (
                    sku,
                    keys,
                    metal,
                    time,
                    steamid,
                    deleted,
                    automated,
                    blacklisted
                ) 
                VALUES 
                ${batch.map((_, index) => `($${index * 8 + 1}, $${index * 8 + 2}, $${index * 8 + 3}, $${index * 8 + 4}, $${index * 8 + 5}, $${index * 8 + 6}, $${index * 8 + 7}, $${index * 8 + 8})`).join(',')}
            `;

            const values = batch.flatMap(listing => [
                listing.sku,
                listing.keys || 0,
                listing.metal || 0,
                listing.time,
                listing.steamid,
                listing.deleted || false,
                listing.automated || false,
                listing.blacklisted || false
            ]);

            await pool.query(query, values);
        } catch (error) {
            console.error('Error processing snapshot queue:', error);
            // Put failed items back in queue
            this.queue.unshift(...batch);
        } finally {
            this.processing = false;
        }
    }

    start() {
        setInterval(() => this.processQueue(), this.processInterval);
    }
}

const snapshotQueue = new SnapshotQueue();
module.exports = { snapshotQueue };