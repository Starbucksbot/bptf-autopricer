import { WebSocketHandler } from '../ws-handler';
import { config } from '../config';
import { CacheService } from './services/cache-service';
import { RateLimiter } from './services/rate-limiter';
import { ErrorHandler } from './middleware/error-handler';
import { ItemPriceCalculator } from './calculators/item-price-calculator';
import { logger } from './utils/logger';

export class BPTFAutopricer {
    private wsHandler: WebSocketHandler;
    private priceCalculator: ItemPriceCalculator;

    constructor(wsUrl: string) {
        this.priceCalculator = new ItemPriceCalculator();
        this.wsHandler = new WebSocketHandler(wsUrl);
        this.setupWebSocket();
    }

    private setupWebSocket(): void {
        this.wsHandler.on('connected', () => {
            logger.info('WebSocket connected successfully');
        });

        this.wsHandler.on('disconnected', () => {
            logger.warn('WebSocket disconnected, attempting to reconnect...');
        });

        this.wsHandler.on('error', (error) => {
            logger.error('WebSocket error:', error);
        });

        this.wsHandler.on('message', async (data) => {
            try {
                await this.handleWebSocketMessage(data);
            } catch (error) {
                logger.error('Error handling WebSocket message:', error);
            }
        });

        this.wsHandler.on('max_retries_reached', () => {
            logger.error('Maximum WebSocket reconnection attempts reached');
            process.exit(1);
        });
    }

    private async handleWebSocketMessage(data: any): Promise<void> {
        try {
            // Handle different message types
            switch (data.type) {
                case 'item_update':
                    await this.handleItemUpdate(data.item);
                    break;
                case 'ping':
                    this.wsHandler.send({ type: 'pong' });
                    break;
                default:
                    logger.warn(`Unknown message type: ${data.type}`);
            }
        } catch (error) {
            logger.error('Error processing message:', error);
            throw error;
        }
    }

    private async handleItemUpdate(item: any): Promise<void> {
        try {
            const buyPrice = await this.priceCalculator.calculateBuyPrice(item);
            const sellPrice = await this.priceCalculator.calculateSellPrice(item);

            // Send price update
            this.wsHandler.send({
                type: 'price_update',
                item: item.sku,
                buyPrice,
                sellPrice
            });
        } catch (error) {
            logger.error(`Error updating prices for item ${item.sku}:`, error);
        }
    }

    public start(): void {
        logger.info('Starting BPTFAutopricer...');
        // Additional initialization if needed
    }

    public stop(): void {
        logger.info('Stopping BPTFAutopricer...');
        this.wsHandler.close();
    }
}