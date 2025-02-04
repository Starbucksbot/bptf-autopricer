export class StatisticalUtils {
    /**
     * Filters outliers from a dataset using both IQR and Z-score methods
     */
    public static filterOutliers(prices: number[]): number[] {
        if (!prices.length) return [];
        if (prices.length === 1) return prices;

        try {
            const zScoreFiltered = this.filterByZScore(prices);
            return this.filterByIQR(zScoreFiltered);
        } catch (error) {
            console.error('Error filtering outliers:', error);
            return prices; // Return original array if filtering fails
        }
    }

    /**
     * Filters outliers using the Z-score method
     * Values with z-score > 3 are considered outliers
     */
    private static filterByZScore(prices: number[]): number[] {
        if (prices.length < 2) return prices;

        const mean = this.calculateMean(prices);
        const std = this.calculateStandardDeviation(prices, mean);
        
        if (std === 0) return prices;

        return prices.filter(price => {
            const zScore = Math.abs((price - mean) / std);
            return zScore <= 3;
        });
    }

    /**
     * Filters outliers using the Interquartile Range (IQR) method
     */
    private static filterByIQR(prices: number[]): number[] {
        if (prices.length < 4) return prices;

        const sorted = [...prices].sort((a, b) => a - b);
        const q1 = this.getQuantile(sorted, 0.25);
        const q3 = this.getQuantile(sorted, 0.75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        return prices.filter(price => price >= lowerBound && price <= upperBound);
    }

    /**
     * Finds price clusters using a modified DBSCAN algorithm
     */
    public static findClusters(prices: number[]): number[][] {
        if (!prices.length) return [];
        if (prices.length === 1) return [prices];

        try {
            const eps = this.calculateEpsilon(prices);
            const minPts = Math.min(2, Math.floor(prices.length / 4));
            const clusters: number[][] = [];
            const visited = new Set<number>();

            for (const price of prices) {
                if (visited.has(price)) continue;

                const cluster = this.expandCluster(price, prices, eps, minPts);
                if (cluster.length >= minPts) {
                    clusters.push(cluster);
                }
                cluster.forEach(p => visited.add(p));
            }

            return clusters.length ? clusters : [prices];
        } catch (error) {
            console.error('Error finding clusters:', error);
            return [prices]; // Return single cluster with all prices if clustering fails
        }
    }

    /**
     * Expands a cluster from a starting point
     */
    private static expandCluster(point: number, prices: number[], eps: number, minPts: number): number[] {
        const cluster: number[] = [point];
        
        prices.forEach(price => {
            if (Math.abs(price - point) <= eps) {
                cluster.push(price);
            }
        });

        return Array.from(new Set(cluster)); // Remove duplicates
    }

    /**
     * Finds the most representative value in the largest cluster
     */
    public static findMostFrequentClusterValue(clusters: number[][]): number {
        if (!clusters.length) return 0;

        // Sort clusters by size
        const sortedClusters = clusters.sort((a, b) => b.length - a.length);
        const largestCluster = sortedClusters[0];

        if (!largestCluster.length) return 0;

        // For small clusters, use median
        if (largestCluster.length <= 3) {
            const sorted = [...largestCluster].sort((a, b) => a - b);
            return sorted[Math.floor(sorted.length / 2)];
        }

        // For larger clusters, use trimmed mean
        const sorted = [...largestCluster].sort((a, b) => a - b);
        const trimAmount = Math.floor(sorted.length * 0.1); // Trim 10% from each end
        const trimmed = sorted.slice(trimAmount, sorted.length - trimAmount);
        
        return this.calculateMean(trimmed);
    }

    /**
     * Calculates the optimal epsilon value for clustering
     */
    private static calculateEpsilon(prices: number[]): number {
        const mean = this.calculateMean(prices);
        const median = this.calculateMedian(prices);
        
        // Use a smaller epsilon if mean and median are close (more stable prices)
        const deviation = Math.abs(mean - median) / mean;
        const baseEpsilon = mean * 0.05; // 5% of mean as base threshold
        
        return baseEpsilon * (1 + deviation);
    }

    private static calculateMean(values: number[]): number {
        if (!values.length) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private static calculateMedian(values: number[]): number {
        if (!values.length) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    private static calculateStandardDeviation(values: number[], mean: number): number {
        if (values.length <= 1) return 0;
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    private static getQuantile(sorted: number[], q: number): number {
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;

        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    }
}