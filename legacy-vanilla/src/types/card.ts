export interface CardData {
    id?: string;
    type?: 'item'; // Discriminator for BaseEntity compatibility
    version: 'v2';
    front: FrontCardData;
    back: BackCardData;
    meta: CardMetadata;
}

export interface FrontCardData {
    title: string;
    type: ItemType;
    subtype?: string;
    rarity: Rarity;
    image?: string;
    stats: ItemStats;
    price: PriceInfo;
}

export interface BackCardData {
    abilityName: string;
    mechanics: string;
    lore: string;
}

export interface CardMetadata {
    timestamp: number;
    generatorVersion: string;
    isCustom?: boolean;
    historyId?: string;
}

export interface ItemStats {
    details: string[]; // e.g. ["Range 60ft", "Damage 1d8"]
}

export interface PriceInfo {
    value: number;
    currency: string; // "gp"
    formatted: string; // "500 gp"
}

export type ItemType = 'weapon' | 'armor' | 'wondrous' | 'ring' | 'potion' | 'scroll' | 'rod' | 'staff' | 'wand';
export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Very Rare' | 'Legendary' | 'Artifact';
