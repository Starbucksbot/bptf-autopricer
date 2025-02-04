import { StatisticalUtils } from '../utils/statistical-utils';
import { SKU } from '@tf2autobot/tf2-sku';
import { pool } from '../database/pool';
import { logger } from '../utils/logger';
import { Item, Listing } from '../types/item';

export class ItemPriceCalculator {
    private readonly PRICE_EXPIRY_HOURS = 24;
    private readonly MIN_LISTINGS_REQUIRED = 3;
    private readonly UNUSUAL_MIN_LISTINGS = 2;
    private readonly PRICE_HISTORY_DAYS = 30;
    private readonly TRUST_SCORE_THRESHOLD = 0.7;

    public isUnusual(sku: string): boolean {
        const data = SKU.fromString(sku);
        return data.quality === 5;
    }

    public async calculateBuyPrice(item: Item): Promise<number> {
        try {
            if (this.isUnusual(item.sku)) {
                return await this.calculateUnusualBuyPrice(item);
            }
            return await this.calculateNormalBuyPrice(item);
        } catch (error) {
            logger.error(`Error calculating buy price for ${item.sku}: ${error.message}`);
            throw error;
        }
    }

    public async calculateSellPrice(item: Item): Promise<number> {
        try {
            if (this.isUnusual(item.sku)) {
                return await this.calculateUnusualSellPrice(item);
            }
            return await this.calculateNormalSellPrice(item);
        } catch (error) {
            logger.error(`Error calculating sell price for ${item.sku}: ${error.message}`);
            throw error;
        }
    }

    private async calculateUnusualBuyPrice(item: Item): Promise<number> {
        const listings = await this.getItemListings(item);
        if (listings.length < this.UNUSUAL_MIN_LISTINGS) {
            throw new Error('Insufficient listings for unusual item pricing');
        }

        const validListings = this.filterListings(listings);
        if (validListings.length < this.UNUSUAL_MIN_LISTINGS) {
            throw new Error('Insufficient valid listings for unusual item pricing');
        }

        const prices = validListings.map(l => l.price);
        const filteredPrices = StatisticalUtils.filterOutliers(prices);
        const clusters = StatisticalUtils.findClusters(filteredPrices);
        const basePrice = StatisticalUtils.findMostFrequentClusterValue(clusters);

        return this.applyUnusualAdjustments(basePrice, item);
    }

    private async calculateUnusualSellPrice(item: Item): Promise<number> {
        const buyPrice = await this.calculateUnusualBuyPrice(item);
        return buyPrice * 1.15; // 15% markup for unusual items
    }

    private async calculateNormalBuyPrice(item: Item): Promise<number> {
        const listings = await this.getItemListings(item);
        if (listings.length < this.MIN_LISTINGS_REQUIRED) {
            throw new Error('Insufficient listings for normal item pricing');
        }

        const validListings = this.filterListings(listings);
        if (validListings.length < this.MIN_LISTINGS_REQUIRED) {
            throw new Error('Insufficient valid listings for normal item pricing');
        }

        const prices = validListings.map(l => l.price);
        const filteredPrices = StatisticalUtils.filterOutliers(prices);
        const clusters = StatisticalUtils.findClusters(filteredPrices);
        const basePrice = StatisticalUtils.findMostFrequentClusterValue(clusters);

        return this.applyMarketTrendAdjustment(basePrice, item);
    }

    private async calculateNormalSellPrice(item: Item): Promise<number> {
        const buyPrice = await this.calculateNormalBuyPrice(item);
        return buyPrice * 1.1; // 10% markup for normal items
    }

    private async getItemListings(item: Item): Promise<Listing[]> {
        const query = `
            SELECT price, created_at as "createdAt", steamid, automatic, intent
            FROM listings
            WHERE sku = $1
            AND created_at > NOW() - INTERVAL '${this.PRICE_HISTORY_DAYS} days'
            ORDER BY created_at DESC
        `;
        
        try {
            const result = await pool.query(query, [item.sku]);
            return result.rows;
        } catch (error) {
            logger.error(`Database error fetching listings for ${item.sku}: ${error.message}`);
            throw error;
        }
    }

    private filterListings(listings: Listing[]): Listing[] {
        const now = new Date();
        return listings.filter(listing => {
            const age = (now.getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60);
            if (age > this.PRICE_EXPIRY_HOURS) return false;

            const trustScore = this.calculateListingTrustScore(listing);
            return trustScore >= this.TRUST_SCORE_THRESHOLD;
        });
    }

    private calculateListingTrustScore(listing: Listing): number {
        let score = 0;
        
        if (listing.automatic) score += 0.3;
        
        const ageHours = (new Date().getTime() - listing.createdAt.getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 0.4 * (1 - ageHours / this.PRICE_EXPIRY_HOURS));
        
        score += 0.3; // Base trust score
        
        return Math.min(1, score);
    }

    private async applyMarketTrendAdjustment(basePrice: number, item: Item): Promise<number> {
        try {
            const trend = await this.getMarketTrend(item);
            return basePrice * (1 + trend);
        } catch (error) {
            logger.warn(`Failed to apply market trend for ${item.sku}: ${error.message}`);
            return basePrice;
        }
    }

    private async getMarketTrend(item: Item): Promise<number> {
        // TODO: Implement market trend analysis using historical data
        return 0;
    }

    private async applyUnusualAdjustments(basePrice: number, item: Item): Promise<number> {
        const effect = SKU.fromString(item.sku).effect || 0;
        const effectMultiplier = await this.getEffectMultiplier(effect);
        return basePrice * effectMultiplier;
    }

    private async getEffectMultiplier(effect: number): Promise<number> {
        // TODO: Implement effect rarity/demand multiplier logic
        return 1;
    }
}