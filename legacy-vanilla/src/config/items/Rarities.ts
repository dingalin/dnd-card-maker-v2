/**
 * Rarities.ts
 * ============
 * Single source of truth for all rarity definitions
 * 
 * Contains:
 * - Rarity levels (mundane → legendary)
 * - Colors and visual styling
 * - CR (Challenge Rating) mappings
 * - Drop rates and probabilities
 */

export interface Rarity {
    id: string;
    labelHe: string;
    labelEn: string;
    color: string;
    glowColor?: string;
    tier: number; // 0 = lowest, 5 = highest
    dropWeight: number; // Higher = more common
}

export interface CRRarityMapping {
    crRange: string;
    level: string;
    primaryRarity: string;
    secondaryRarity: string;
    magicChance: number;
    goldRange: { min: number; max: number };
    itemCount: { min: number; max: number };
}

// ==================== RARITY DEFINITIONS ====================
export const RARITIES: Record<string, Rarity> = {
    mundane: {
        id: 'mundane',
        labelHe: 'רגיל',
        labelEn: 'Mundane',
        color: '#9ca3af',
        tier: 0,
        dropWeight: 100
    },
    common: {
        id: 'common',
        labelHe: 'נפוץ',
        labelEn: 'Common',
        color: '#ffffff',
        tier: 1,
        dropWeight: 80
    },
    uncommon: {
        id: 'uncommon',
        labelHe: 'לא נפוץ',
        labelEn: 'Uncommon',
        color: '#22c55e',
        glowColor: '#22c55e40',
        tier: 2,
        dropWeight: 40
    },
    rare: {
        id: 'rare',
        labelHe: 'נדיר',
        labelEn: 'Rare',
        color: '#3b82f6',
        glowColor: '#3b82f640',
        tier: 3,
        dropWeight: 15
    },
    veryRare: {
        id: 'veryRare',
        labelHe: 'נדיר מאוד',
        labelEn: 'Very Rare',
        color: '#a855f7',
        glowColor: '#a855f740',
        tier: 4,
        dropWeight: 5
    },
    legendary: {
        id: 'legendary',
        labelHe: 'אגדי',
        labelEn: 'Legendary',
        color: '#f59e0b',
        glowColor: '#f59e0b60',
        tier: 5,
        dropWeight: 1
    }
};

// ==================== RARITY ORDER (sorted) ====================
export const RARITY_ORDER: string[] = [
    'mundane',
    'common',
    'uncommon',
    'rare',
    'veryRare',
    'legendary'
];

// ==================== BACKWARD COMPATIBILITY ====================
// RARITY_LABELS format for existing code (treasure-data.ts)
export interface RarityLabel {
    he: string;
    en: string;
    color: string;
}

export const RARITY_LABELS: Record<string, RarityLabel> = Object.fromEntries(
    Object.entries(RARITIES).map(([key, rarity]) => [
        key,
        { he: rarity.labelHe, en: rarity.labelEn, color: rarity.color }
    ])
) as Record<string, RarityLabel>;

// ==================== CR TO RARITY MAPPINGS ====================
export const CR_RARITY_MAP: Record<string, CRRarityMapping> = {
    '0-4': {
        crRange: '0-4',
        level: 'mundane',
        primaryRarity: 'mundane',
        secondaryRarity: 'common',
        magicChance: 0.1,
        goldRange: { min: 10, max: 100 },
        itemCount: { min: 1, max: 2 }
    },
    '5-10': {
        crRange: '5-10',
        level: '1-4',
        primaryRarity: 'common',
        secondaryRarity: 'uncommon',
        magicChance: 0.3,
        goldRange: { min: 50, max: 500 },
        itemCount: { min: 1, max: 3 }
    },
    '11-16': {
        crRange: '11-16',
        level: '5-10',
        primaryRarity: 'uncommon',
        secondaryRarity: 'rare',
        magicChance: 0.5,
        goldRange: { min: 500, max: 5000 },
        itemCount: { min: 2, max: 4 }
    },
    '17-20': {
        crRange: '17-20',
        level: '11-16',
        primaryRarity: 'rare',
        secondaryRarity: 'veryRare',
        magicChance: 0.8,
        goldRange: { min: 5000, max: 25000 },
        itemCount: { min: 2, max: 5 }
    },
    '21+': {
        crRange: '21+',
        level: '17+',
        primaryRarity: 'veryRare',
        secondaryRarity: 'legendary',
        magicChance: 1.0,
        goldRange: { min: 25000, max: 100000 },
        itemCount: { min: 3, max: 7 }
    }
};

// ==================== HELPER FUNCTIONS ====================
export function getRarity(id: string): Rarity | undefined {
    return RARITIES[id];
}

export function getRarityColor(rarityId: string): string {
    return RARITIES[rarityId]?.color || '#ffffff';
}

export function getRarityLabel(rarityId: string, locale: 'he' | 'en' = 'he'): string {
    const rarity = RARITIES[rarityId];
    return rarity ? (locale === 'he' ? rarity.labelHe : rarity.labelEn) : rarityId;
}

export function getRarityByTier(tier: number): Rarity | undefined {
    return Object.values(RARITIES).find(r => r.tier === tier);
}

export function getCRRarityMapping(crRange: string): CRRarityMapping | undefined {
    return CR_RARITY_MAP[crRange];
}

export function selectRandomRarity(crRange: string): string {
    const mapping = CR_RARITY_MAP[crRange];
    if (!mapping) return 'common';

    // 70% primary, 30% secondary
    return Math.random() < 0.7 ? mapping.primaryRarity : mapping.secondaryRarity;
}

export default RARITIES;
