export class StatisticalUtils {
    /**
     * Calculates the Interquartile Range (IQR) for a dataset
     */
    public static calculateIQR(values: number[]): { q1: number; q3: number; iqr: number } {
        const sorted = [...values].sort((a, b) => a - b);
        const q1Index = Math.floor(sorted.length / 4);
        const q3Index = Math.floor((3 * sorted.length) / 4);
        
        const q1 = sorted[q1Index];
        const q3 = sorted[q3Index];
        const iqr = q3 - q1;
        
        return { q1, q3, iqr };
    }

    /**
     * Calculates the z-score for each value in the dataset
     */
    public static calculateZScores(values: number[]): number[] {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return values.map(value => (value - mean) / stdDev);
    }

    /**
     * Filters outliers using both IQR and z-score methods
     */
    public static filterOutliers(values: number[]): number[] {
        const { q1, q3, iqr } = this.calculateIQR(values);
        const zScores = this.calculateZScores(values);
        
        return values.filter((value, index) => {
            const isWithinIQR = value >= (q1 - 1.5 * iqr) && value <= (q3 + 1.5 * iqr);
            const isWithinZScore = Math.abs(zScores[index]) <= 2;
            return isWithinIQR && isWithinZScore;
        });
    }

    /**
     * Groups values into clusters where values are within 1% of each other
     */
    public static findClusters(values: number[]): number[][] {
        const sorted = [...values].sort((a, b) => a - b);
        const clusters: number[][] = [];
        let currentCluster: number[] = [sorted[0]];

        for (let i = 1; i < sorted.length; i++) {
            const current = sorted[i];
            const lastInCluster = currentCluster[currentCluster.length - 1];
            
            if ((Math.abs(current - lastInCluster) / lastInCluster) <= 0.01) {
                currentCluster.push(current);
            } else {
                clusters.push(currentCluster);
                currentCluster = [current];
            }
        }
        
        if (currentCluster.length > 0) {
            clusters.push(currentCluster);
        }
        
        return clusters;
    }

    /**
     * Finds the most frequent value in the clusters
     */
    public static findMostFrequentClusterValue(clusters: number[][]): number {
        const clusterSizes = clusters.map(cluster => ({
            value: cluster.reduce((sum, val) => sum + val, 0) / cluster.length,
            size: cluster.length
        }));
        
        return clusterSizes.reduce((prev, current) => 
            current.size > prev.size ? current : prev
        ).value;
    }
}