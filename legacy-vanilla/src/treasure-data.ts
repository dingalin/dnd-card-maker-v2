// @ts-nocheck
/**
 * Treasure Generator Data
 * Contains CR-to-rarity mappings, enemy type influences, and treasure tables
 * 
 * Note: RARITY_LABELS and ITEM_TYPE_ICONS are imported from centralized config
 */

// Import from centralized config
import {
    RARITY_LABELS as _RARITY_LABELS,
    ITEM_TYPE_ICONS as _ITEM_TYPE_ICONS,
    CR_RARITY_MAP as CONFIG_CR_RARITY_MAP,
    RARITY_ORDER
} from './config/items';
interface CrRarityMapItem {
    level: string;
    primaryRarity: string;
    secondaryRarity: string;
    magicChance: number;
    goldRange: { min: number; max: number };
    itemCount: { min: number; max: number };
}

interface EnemyType {
    labelHe: string;
    labelEn: string;
    icon: string;
    preferredItems: string[];
    themeKeywords: string[];
    themeKeywordsEn: string[];
    visualStyle: {
        colors: string[];
        aesthetic: string;
        elements: string[];
    };
    goldMultiplier: number;
    itemCountBonus: number;
    cursedChance?: number;
    damagePreference?: string;
    magicSchool?: string;
    preferLargeTreasure?: boolean;
    noCursed?: boolean;
    weirdItemChance?: number;
    isLootSource?: boolean;
    elementalAffinity?: boolean;
}

interface RarityLabel {
    he: string;
    en: string;
    color: string;
}

// CR to Item Level/Rarity mapping based on D&D guidelines
export const CR_RARITY_MAP: Record<string, CrRarityMapItem> = {
    // CR 0-4: Mostly mundane with occasional common magic items
    '0-4': {
        level: 'mundane',
        primaryRarity: 'mundane',
        secondaryRarity: 'common',
        magicChance: 0.2, // 20% chance of magic item
        goldRange: { min: 10, max: 100 },
        itemCount: { min: 1, max: 3 }
    },
    // CR 5-10: Common to Uncommon items
    '5-10': {
        level: '1-4',
        primaryRarity: 'common',
        secondaryRarity: 'uncommon',
        magicChance: 0.5,
        goldRange: { min: 100, max: 500 },
        itemCount: { min: 2, max: 4 }
    },
    // CR 11-16: Uncommon to Rare items
    '11-16': {
        level: '5-10',
        primaryRarity: 'uncommon',
        secondaryRarity: 'rare',
        magicChance: 0.75,
        goldRange: { min: 500, max: 5000 },
        itemCount: { min: 2, max: 5 }
    },
    // CR 17-20: Rare to Very Rare items
    '17-20': {
        level: '11-16',
        primaryRarity: 'rare',
        secondaryRarity: 'veryRare',
        magicChance: 0.9,
        goldRange: { min: 5000, max: 25000 },
        itemCount: { min: 3, max: 6 }
    },
    // CR 21+: Very Rare to Legendary items
    '21+': {
        level: '17+',
        primaryRarity: 'veryRare',
        secondaryRarity: 'legendary',
        magicChance: 1.0,
        goldRange: { min: 25000, max: 100000 },
        itemCount: { min: 3, max: 7 }
    }
};

// Enemy type definitions with treasure preferences
export const ENEMY_TYPES: Record<string, EnemyType> = {
    dragon: {
        labelHe: 'דרקון',
        labelEn: 'Dragon',
        icon: '🐉',
        // Preferred item types for this enemy
        preferredItems: ['staff', 'wand', 'wondrous', 'ring'],
        // Theme keywords to influence AI generation
        themeKeywords: ['עתיק', 'קשקשים', 'אש', 'קור', 'חומצה', 'ברק'],
        themeKeywordsEn: ['ancient', 'draconic', 'scales', 'fire', 'frost', 'acid', 'lightning'],
        // Visual style modifiers
        visualStyle: {
            colors: ['gold', 'red', 'blue', 'green', 'black', 'white'],
            aesthetic: 'ornate, ancient, powerful, glowing with inner fire',
            elements: ['dragon scales', 'claw marks', 'gemstones', 'runes']
        },
        // Gold multiplier
        goldMultiplier: 2.0,
        // Special: Dragons hoard treasure, so more items
        itemCountBonus: 2
    },

    undead: {
        labelHe: 'לא-מת',
        labelEn: 'Undead',
        icon: '💀',
        preferredItems: ['ring', 'wondrous', 'weapon', 'armor'],
        themeKeywords: ['נקרוטי', 'מוות', 'נשמה', 'ארור', 'קודר'],
        themeKeywordsEn: ['necrotic', 'death', 'soul', 'cursed', 'dark', 'tomb'],
        visualStyle: {
            colors: ['black', 'pale green', 'bone white', 'purple'],
            aesthetic: 'decayed, ancient, ghostly, eerie green glow',
            elements: ['skulls', 'bones', 'tattered cloth', 'spectral wisps']
        },
        goldMultiplier: 0.8,
        itemCountBonus: 0,
        // Special property: chance of cursed items
        cursedChance: 0.15
    },

    fiend: {
        labelHe: 'שד',
        labelEn: 'Fiend/Demon',
        icon: '👹',
        preferredItems: ['weapon', 'wondrous', 'ring'],
        themeKeywords: ['אש', 'גופרית', 'תהום', 'שטני', 'להבה'],
        themeKeywordsEn: ['fire', 'brimstone', 'infernal', 'demonic', 'hellfire', 'abyss'],
        visualStyle: {
            colors: ['red', 'black', 'orange', 'dark gold'],
            aesthetic: 'burning, corrupted, demonic symbols, smoke wisps',
            elements: ['flames', 'horns', 'chains', 'infernal runes']
        },
        goldMultiplier: 1.5,
        itemCountBonus: 1,
        // Special: fire damage preference
        damagePreference: 'fire'
    },

    fey: {
        labelHe: 'פֵיי',
        labelEn: 'Fey',
        icon: '🧝',
        preferredItems: ['wondrous', 'wand', 'ring', 'potion'],
        themeKeywords: ['אשליה', 'טבע', 'ירח', 'קסם', 'יער'],
        themeKeywordsEn: ['illusion', 'nature', 'moonlight', 'enchantment', 'forest', 'whimsical'],
        visualStyle: {
            colors: ['silver', 'pastel pink', 'light blue', 'gold', 'green'],
            aesthetic: 'ethereal, delicate, glowing softly, organic curves',
            elements: ['flowers', 'butterflies', 'moonlight', 'vines', 'crystals']
        },
        goldMultiplier: 0.5, // Fey care less about gold
        itemCountBonus: 0,
        // Special: illusion/charm themed items
        magicSchool: 'illusion'
    },

    humanoid: {
        labelHe: 'הומנואיד',
        labelEn: 'Humanoid',
        icon: '🗡️',
        preferredItems: ['weapon', 'armor', 'wondrous', 'potion'],
        themeKeywords: ['לוחם', 'שודד', 'מלך', 'אביר'],
        themeKeywordsEn: ['warrior', 'bandit', 'noble', 'knight', 'mercenary'],
        visualStyle: {
            colors: ['steel', 'brown', 'leather', 'gold trim'],
            aesthetic: 'practical, battle-worn, crafted, functional',
            elements: ['heraldry', 'leather straps', 'metal buckles', 'worn edges']
        },
        goldMultiplier: 1.0,
        itemCountBonus: 0
    },

    giant: {
        labelHe: 'ענק',
        labelEn: 'Giant',
        icon: '🏔️',
        preferredItems: ['weapon', 'armor', 'wondrous'],
        themeKeywords: ['ענק', 'עתיק', 'סלע', 'הרים'],
        themeKeywordsEn: ['massive', 'primordial', 'stone', 'mountain', 'thunderous'],
        visualStyle: {
            colors: ['grey', 'brown', 'ice blue', 'storm blue'],
            aesthetic: 'massive, rough-hewn, primitive, ancient power',
            elements: ['boulders', 'runes', 'animal hides', 'rough iron']
        },
        goldMultiplier: 1.5,
        itemCountBonus: 1,
        // Giants collect trophies
        preferLargeTreasure: true
    },

    celestial: {
        labelHe: 'שמימי',
        labelEn: 'Celestial',
        icon: '🌟',
        preferredItems: ['weapon', 'armor', 'wondrous', 'ring'],
        themeKeywords: ['קדוש', 'אור', 'שמימי', 'מבורך', 'צדק'],
        themeKeywordsEn: ['holy', 'radiant', 'blessed', 'divine', 'righteous', 'heavenly'],
        visualStyle: {
            colors: ['gold', 'white', 'silver', 'sky blue'],
            aesthetic: 'radiant, glorious, immaculate, warm glow',
            elements: ['wings', 'halos', 'holy symbols', 'sunbursts', 'stars']
        },
        goldMultiplier: 1.0,
        itemCountBonus: 0,
        damagePreference: 'radiant',
        // Celestials don't give cursed items
        noCursed: true
    },

    aberration: {
        labelHe: 'מפלצת',
        labelEn: 'Aberration',
        icon: '🦑',
        preferredItems: ['wondrous', 'ring', 'wand', 'scroll'],
        themeKeywords: ['פסיוני', 'זר', 'תודעה', 'טירוף', 'עין'],
        themeKeywordsEn: ['psionic', 'alien', 'mind', 'madness', 'eye', 'tentacle', 'void'],
        visualStyle: {
            colors: ['purple', 'dark blue', 'sickly green', 'black'],
            aesthetic: 'organic, unsettling, non-euclidean, pulsating',
            elements: ['tentacles', 'eyes', 'strange geometry', 'organic matter']
        },
        goldMultiplier: 0.7,
        itemCountBonus: 0,
        // Aberrations have weird items
        weirdItemChance: 0.3
    },

    construct: {
        labelHe: 'מבנה',
        labelEn: 'Construct',
        icon: '🤖',
        preferredItems: ['wondrous', 'armor', 'weapon'],
        themeKeywords: ['מכני', 'גולם', 'בנוי', 'מתכת'],
        themeKeywordsEn: ['mechanical', 'golem', 'crafted', 'metal', 'clockwork', 'animated'],
        visualStyle: {
            colors: ['bronze', 'copper', 'steel', 'gold'],
            aesthetic: 'mechanical, precise, geometric, runic',
            elements: ['gears', 'runes', 'metal plates', 'glowing cores']
        },
        goldMultiplier: 0.5, // Constructs don't collect treasure
        itemCountBonus: -1,
        // But they might BE the treasure
        isLootSource: true
    },

    elemental: {
        labelHe: 'יסודי',
        labelEn: 'Elemental',
        icon: '🌀',
        preferredItems: ['wondrous', 'ring', 'staff'],
        themeKeywords: ['יסודי', 'אש', 'מים', 'אוויר', 'אדמה'],
        themeKeywordsEn: ['elemental', 'fire', 'water', 'air', 'earth', 'primal'],
        visualStyle: {
            colors: ['red', 'blue', 'white', 'brown', 'multi-elemental'],
            aesthetic: 'raw elemental power, swirling, crackling, natural force',
            elements: ['flames', 'waves', 'wind spirals', 'crystals', 'magma']
        },
        goldMultiplier: 0.6,
        itemCountBonus: 0,
        elementalAffinity: true
    }
};

// Re-export from centralized config for backward compatibility
export const RARITY_LABELS = _RARITY_LABELS;
export const ITEM_TYPE_ICONS = _ITEM_TYPE_ICONS;

/**
 * Roll for gold amount based on CR
 */
export function rollGold(crRange: string, enemyType: string | null = null): number {
    const crData = CR_RARITY_MAP[crRange];
    if (!crData) return 0;

    const { min, max } = crData.goldRange;
    let gold = Math.floor(Math.random() * (max - min + 1)) + min;

    // Apply enemy type multiplier
    if (enemyType && ENEMY_TYPES[enemyType]) {
        gold = Math.floor(gold * ENEMY_TYPES[enemyType].goldMultiplier);
    }

    return gold;
}

/**
 * Determine how many items to generate
 */
export function rollItemCount(crRange: string, enemyType: string | null = null): number {
    const crData = CR_RARITY_MAP[crRange];
    if (!crData) return 1;

    const { min, max } = crData.itemCount;
    let count = Math.floor(Math.random() * (max - min + 1)) + min;

    // Apply enemy type bonus
    if (enemyType && ENEMY_TYPES[enemyType]) {
        count += ENEMY_TYPES[enemyType].itemCountBonus || 0;
    }

    return Math.max(1, count);
}

/**
 * Select a random item type based on enemy preferences
 */
export function selectItemType(enemyType: string | null = null): string {
    const allTypes = ['weapon', 'armor', 'wondrous', 'potion', 'ring', 'scroll', 'staff', 'wand'];

    if (enemyType && ENEMY_TYPES[enemyType]) {
        const preferred = ENEMY_TYPES[enemyType].preferredItems;
        // 70% chance to pick from preferred items
        if (Math.random() < 0.7 && preferred.length > 0) {
            return preferred[Math.floor(Math.random() * preferred.length)];
        }
    }

    return allTypes[Math.floor(Math.random() * allTypes.length)];
}

/**
 * Determine rarity based on CR with some randomness
 */
export function selectRarity(crRange: string): string {
    const crData = CR_RARITY_MAP[crRange];
    if (!crData) return 'mundane';

    // Primary rarity 60%, secondary 30%, one level up/down 10%
    const roll = Math.random();
    if (roll < 0.6) {
        return crData.primaryRarity;
    } else if (roll < 0.9) {
        return crData.secondaryRarity;
    } else {
        // Surprise! One level higher
        const rarityOrder = ['mundane', 'common', 'uncommon', 'rare', 'veryRare', 'legendary'];
        const currentIndex = rarityOrder.indexOf(crData.secondaryRarity);
        return rarityOrder[Math.min(currentIndex + 1, rarityOrder.length - 1)];
    }
}

/**
 * Generate theme keywords for AI prompt based on enemy type
 */
export function getThemeKeywords(enemyType: string, locale = 'he'): string {
    if (!enemyType || !ENEMY_TYPES[enemyType]) return '';

    const enemy = ENEMY_TYPES[enemyType];
    const keywords = locale === 'he' ? enemy.themeKeywords : enemy.themeKeywordsEn;

    // Pick 2-3 random keywords
    const shuffled = keywords.slice().sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).join(', ');
}

/**
 * Get visual style hints for image generation
 */
export function getVisualStyleHints(enemyType: string) {
    if (!enemyType || !ENEMY_TYPES[enemyType]) return null;
    return ENEMY_TYPES[enemyType].visualStyle;
}

// Export for debugging
(window as any).TREASURE_DATA = {
    CR_RARITY_MAP,
    ENEMY_TYPES,
    RARITY_LABELS,
    ITEM_TYPE_ICONS
};
