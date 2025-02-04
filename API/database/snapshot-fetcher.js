const axios = require('axios');
const config = require('../../config.json');
const { SnapshotQueue } = require('./snapshot-queue');

class SnapshotFetcher {
    constructor(snapshotQueue) {
        this.snapshotQueue = snapshotQueue;
        this.apiKey = config.bptfAPIKey;
        this.requestDelay = 2000; // 2 seconds between requests
        this.maxRequestsPerMinute = Math.min(config.maxRequestsPerMinute || 30, 50);
        this.itemQueue = [];
        this.processing = false;
    }

    async fetchSnapshot(sku) {
        try {
            const response = await axios.get('https://backpack.tf/api/classifieds/listings/snapshot', {
                params: {
                    key: this.apiKey,
                    sku: sku
                }
            });

            if (response.data && response.data.listings) {
                for (const listing of response.data.listings) {
                    this.snapshotQueue.add({
                        sku: listing.item.sku,
                        keys: listing.currencies.keys || 0,
                        metal: listing.currencies.metal || 0,
                        time: new Date(),
                        steamid: listing.steamid,
                        deleted: false,
                        automated: listing.automatic === true,
                        blacklisted: false
                    });
                }
            }
        } catch (error) {
            console.error(`Error fetching snapshot for SKU ${sku}:`, error);
        }
    }

    queueItem(sku) {
        if (!this.itemQueue.includes(sku)) {
            this.itemQueue.push(sku);
        }
    }

    async processQueue() {
        if (this.processing || this.itemQueue.length === 0) {
            return;
        }

        this.processing = true;
        let processedCount = 0;

        while (this.itemQueue.length > 0 && processedCount < this.maxRequestsPerMinute) {
            const sku = this.itemQueue.shift();
            await this.fetchSnapshot(sku);
            processedCount++;

            if (this.itemQueue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.requestDelay));
            }
        }

        this.processing = false;

        // If there are remaining items, schedule next batch
        if (this.itemQueue.length > 0) {
            setTimeout(() => this.processQueue(), 60000); // Wait 1 minute before processing next batch
        }
    }

    start() {
        // Start processing the queue
        this.processQueue();
    }
}

module.exports = { SnapshotFetcher };