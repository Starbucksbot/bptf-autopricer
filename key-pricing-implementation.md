# Key Price Calculation Implementation

The key price calculation has been implemented in `key-price-calculator.js` with the following features:

1. **Currency**: All prices are handled in ref currency
2. **Update Interval**: Prices are recalculated every 10 minutes
3. **SKU**: Uses the correct key SKU (5021;6)
4. **Price Calculation Method**:
   - Fetches snapshot data from the last hour
   - Filters out invalid prices (NaN or <= 0)
   - Removes outliers (top and bottom 10% of prices)
   - Calculates average of remaining prices
   - Buy price = average price (rounded to 2 decimal places)
   - Sell price = average price + 0.11 ref markup (rounded to 2 decimal places)

The implementation meets the requirements by:
- Separating buy and sell prices
- Using a dedicated class for key price calculation
- Regularly updating via snapshot search
- Operating solely in ref currency

The class provides methods to:
- Start automatic updates (`startAutoUpdate`)
- Calculate prices on demand (`calculateKeyPrice`)
- Retrieve current prices (`getCurrentKeyPrice`)