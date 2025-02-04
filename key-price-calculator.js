const { pool } = require('./API/database/pool');

class KeyPriceCalculator {
    constructor() {
        this.keysSku = '5021;6';
        this.updateInterval = 10 * 60 * 1000; // 10 minutes in milliseconds
        this.currentKeyPrice = null;
    }

    async calculateKeyPrice() {
        try {
            // Query snapshots for key listings
            const result = await pool.query(
                'SELECT * FROM snapshots WHERE sku = $1 AND timestamp > NOW() - INTERVAL \'1 hour\'',
                [this.keysSku]
            );

            if (result.rows.length === 0) {
                console.log('No recent key listings found');
                return;
            }

            // Calculate average price from snapshots
            // Filter and convert prices to ref
            const validPrices = result.rows
                .map(row => parseFloat(row.price))
                .filter(price => !isNaN(price) && price > 0);

            if (validPrices.length === 0) {
                console.log('No valid prices found in snapshots');
                return;
            }

            // Sort prices and remove outliers (top and bottom 10%)
            validPrices.sort((a, b) => a - b);
            const cutoff = Math.floor(validPrices.length * 0.1);
            const trimmedPrices = validPrices.slice(cutoff, -cutoff);

            // Calculate average of remaining prices
            const avgPrice = trimmedPrices.reduce((a, b) => a + b, 0) / trimmedPrices.length;
            
            this.currentKeyPrice = {
                buy: Math.round(avgPrice * 100) / 100,  // Round to 2 decimal places
                sell: Math.round((avgPrice + 0.11) * 100) / 100  // Add 0.11 ref markup for sell price
            };

            console.log(`Updated key prices - Buy: ${this.currentKeyPrice.buy}, Sell: ${this.currentKeyPrice.sell}`);
        } catch (error) {
            console.error('Error calculating key price:', error);
        }
    }

    startAutoUpdate() {
        // Calculate initial price
        this.calculateKeyPrice();
        
        // Set up periodic updates
        setInterval(() => {
            this.calculateKeyPrice();
        }, this.updateInterval);
    }

    getCurrentKeyPrice() {
        return this.currentKeyPrice;
    }
}

module.exports = { KeyPriceCalculator };