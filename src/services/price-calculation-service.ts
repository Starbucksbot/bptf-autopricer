import { pool } from '../../API/database/pool';
import { BackpackWebSocket } from '../../API/database/backpack-websocket';
import { SnapshotQueue } from '../../API/database/snapshot-queue';
import { SnapshotFetcher } from '../../API/database/snapshot-fetcher';

export class PriceCalculationService {
    private snapshotQueue: SnapshotQueue;
    private snapshotFetcher: SnapshotFetcher;
    private backpackWs: BackpackWebSocket;
    private calculationInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.snapshotQueue = new SnapshotQueue();
        this.snapshotFetcher = new SnapshotFetcher(this.snapshotQueue);
        this.backpackWs = new BackpackWebSocket();
        
        // Handle websocket pricing events
        this.backpackWs.on('pricing', (data) => {
            // Queue the item for snapshot fetching with 2-second delay
            this.snapshotFetcher.queueItem(data.sku);
        });
    }

    public start(): void {
        // Start the snapshot fetcher
        this.snapshotFetcher.start();
        
        // Start price calculation interval (every 0.7 minutes)
        this.calculationInterval = setInterval(() => {
            this.calculatePrices();
        }, 42000); // 0.7 minutes in milliseconds
    }

    public stop(): void {
        if (this.calculationInterval) {
            clearInterval(this.calculationInterval);
        }
        this.backpackWs.close();
    }

    private async calculatePrices(): Promise<void> {
        try {
            // Implement your price calculation logic here
            // This will be called every 0.7 minutes
            const query = `
                -- Your price calculation SQL query here
                -- This should process the latest snapshot data
            `;
            await pool.query(query);
        } catch (error) {
            console.error('Error calculating prices:', error);
        }
    }
}