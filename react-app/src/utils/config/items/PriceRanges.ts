/**
 * PriceRanges.ts
 * ===============
 * Single source of truth for item pricing
 * 
 * Contains:
 * - Base prices per rarity
 * - Price modifiers by item type
 * - Gold calculation formulas
 */

export interface PriceRange {
    min: number;
    max: number;
    typical: number;
}

export interface ItemTypeModifier {
    multiplier: number;
    description: string;
}

// ==================== BASE PRICES BY RARITY ====================
export const BASE_PRICES: Record<string, PriceRange> = {
    mundane: {
        min: 1,
        max: 50,
        typical: 15
    },
    common: {
        min: 50,
        max: 100,
        typical: 75
    },
    uncommon: {
        min: 101,
        max: 500,
        typical: 300
    },
    rare: {
        min: 501,
        max: 5000,
        typical: 2500
    },
    veryRare: {
        min: 5001,
        max: 50000,
        typical: 25000
    },
    legendary: {
        min: 50001,
        max: 200000,
        typical: 100000
    }
};

// ==================== ITEM TYPE PRICE MODIFIERS ====================
export const ITEM_TYPE_MODIFIERS: Record<string, ItemTypeModifier> = {
    weapon: {
        multiplier: 1.0,
        description: 'Standard pricing'
    },
    armor: {
        multiplier: 1.2,
        description: 'Armor costs slightly more due to materials'
    },
    potion: {
        multiplier: 0.5,
        description: 'Consumables cost less'
    },
    ring: {
        multiplier: 1.3,
        description: 'Jewelry commands premium prices'
    },
    wondrous: {
        multiplier: 1.1,
        description: 'Magical items slightly premium'
    },
    scroll: {
        multiplier: 0.7,
        description: 'Single-use, lower price'
    },
    staff: {
        multiplier: 1.4,
        description: 'Complex magical items'
    },
    wand: {
        multiplier: 1.2,
        description: 'Magical focus items'
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate item price based on rarity and type
 */
export function calculatePrice(
    rarityId: string,
    itemTypeId: string,
    variance: number = 0.2
): number {
    const baseRange = BASE_PRICES[rarityId] || BASE_PRICES.common;
    const modifier = ITEM_TYPE_MODIFIERS[itemTypeId]?.multiplier || 1.0;

    // Start with typical price
    let price = baseRange.typical * modifier;

    // Add random variance (±20% by default)
    const varianceFactor = 1 + (Math.random() * variance * 2 - variance);
    price *= varianceFactor;

    // Clamp within range
    const min = baseRange.min * modifier;
    const max = baseRange.max * modifier;
    price = Math.max(min, Math.min(max, price));

    // Round to nice numbers
    if (price < 100) {
        price = Math.round(price / 5) * 5;
    } else if (price < 1000) {
        price = Math.round(price / 25) * 25;
    } else if (price < 10000) {
        price = Math.round(price / 100) * 100;
    } else {
        price = Math.round(price / 500) * 500;
    }

    return Math.max(1, price);
}

/**
 * Get price range for display
 */
export function getPriceRange(rarityId: string, itemTypeId: string): PriceRange {
    const baseRange = BASE_PRICES[rarityId] || BASE_PRICES.common;
    const modifier = ITEM_TYPE_MODIFIERS[itemTypeId]?.multiplier || 1.0;

    return {
        min: Math.round(baseRange.min * modifier),
        max: Math.round(baseRange.max * modifier),
        typical: Math.round(baseRange.typical * modifier)
    };
}

/**
 * Format gold value for display
 */
export function formatGold(amount: number): string {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
}

export default BASE_PRICES;
