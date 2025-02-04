export interface Item {
    sku: string;
    name?: string;
    quality?: number;
    effect?: number;
    price?: number;
    lastUpdate?: Date;
}

export interface Listing {
    price: number;
    createdAt: Date;
    steamid: string;
    automatic: boolean;
    intent: 'buy' | 'sell';
}