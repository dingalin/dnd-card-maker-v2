/**
 * D&D 5e Official Item Pricing System
 * Based on DMG Chapter 7 guidelines and community-accepted "Sane Magic Item Prices"
 */

// ===== BASE RARITY PRICES =====
// DMG suggested price ranges with midpoints for consistent pricing
export const RARITY_BASE_PRICES: Record<string, { min: number; max: number; typical: number }> = {
    'נפוץ': { min: 50, max: 100, typical: 75 },           // Common
    'לא נפוץ': { min: 101, max: 500, typical: 300 },     // Uncommon
    'נדיר': { min: 501, max: 5000, typical: 2500 },      // Rare
    'נדיר מאוד': { min: 5001, max: 50000, typical: 25000 }, // Very Rare
    'אגדי': { min: 50001, max: 200000, typical: 100000 }, // Legendary
};

// English fallback
export const RARITY_BASE_PRICES_EN: Record<string, { min: number; max: number; typical: number }> = {
    'common': { min: 50, max: 100, typical: 75 },
    'uncommon': { min: 101, max: 500, typical: 300 },
    'rare': { min: 501, max: 5000, typical: 2500 },
    'very rare': { min: 5001, max: 50000, typical: 25000 },
    'legendary': { min: 50001, max: 200000, typical: 100000 },
};

// ===== ENCHANTMENT BONUS PRICES =====
// Price ADDED for magical enhancement bonuses
export const ENCHANTMENT_BONUS_PRICES: Record<number, number> = {
    1: 500,      // +1 (Uncommon tier)
    2: 5000,     // +2 (Rare tier)
    3: 50000,    // +3 (Very Rare tier)
};

// ===== MUNDANE ITEM BASE COSTS =====
// Base weapon/armor costs before enchantment (English + Hebrew)
export const MUNDANE_WEAPON_PRICES: Record<string, number> = {
    // Simple Melee (English)
    'club': 1, 'אלה': 1,
    'dagger': 2, 'פגיון': 2,
    'greatclub': 2, 'אלה גדולה': 2,
    'handaxe': 5, 'גרזן יד': 5,
    'javelin': 5, 'כידון': 5,
    'light hammer': 2, 'פטיש קל': 2,
    'mace': 5, 'מקל': 5,
    'quarterstaff': 2, 'מטה': 2,
    'sickle': 1, 'מגל': 1,
    'spear': 1, 'חנית': 1,
    // Simple Ranged
    'crossbow, light': 25, 'קשת צולבת קלה': 25,
    'dart': 0.05, 'חץ': 0.05,
    'shortbow': 25, 'קשת קצרה': 25,
    'sling': 1, 'קלע': 1,
    // Martial Melee
    'battleaxe': 10, 'גרזן קרב': 10,
    'flail': 10, 'שוט קרב': 10,
    'glaive': 20, 'חרמש': 20,
    'greataxe': 30, 'גרזן גדול': 30,
    'greatsword': 50, 'חרב גדולה': 50,
    'halberd': 20, 'חלברד': 20,
    'lance': 10, 'רומח': 10,
    'longsword': 15, 'חרב ארוכה': 15,
    'maul': 10, 'מקבת': 10,
    'morningstar': 15, 'כוכב בוקר': 15,
    'pike': 5, 'פייק': 5,
    'rapier': 25, 'רייפיר': 25,
    'scimitar': 25, 'סייף': 25,
    'shortsword': 10, 'חרב קצרה': 10,
    'trident': 5, 'קלשון': 5,
    'war pick': 5, 'מכוש': 5,
    'warhammer': 15, 'פטיש מלחמה': 15,
    'whip': 2, 'שוט': 2,
    // Martial Ranged
    'blowgun': 10, 'נשיפון': 10,
    'crossbow, hand': 75, 'קשת צולבת יד': 75,
    'crossbow, heavy': 50, 'קשת צולבת כבדה': 50,
    'longbow': 50, 'קשת ארוכה': 50,
    'net': 1, 'רשת': 1,
    // Staff (for magical items)
    'staff': 10, 'מטה קסם': 10,
};

export const MUNDANE_ARMOR_PRICES: Record<string, number> = {
    // Light Armor
    'padded': 5, 'מרופד': 5,
    'leather': 10, 'עור': 10,
    'studded leather': 45, 'עור ממוסמר': 45,
    // Medium Armor
    'hide': 10, 'עור חיה': 10,
    'chain shirt': 50, 'חולצת שרשראות': 50,
    'scale mail': 50, 'שריון קשקשים': 50,
    'breastplate': 400, 'שריון חזה': 400,
    'half plate': 750, 'חצי שריון': 750,
    // Heavy Armor
    'ring mail': 30, 'שריון טבעות': 30,
    'chain mail': 75, 'שריון שרשראות': 75,
    'splint': 200, 'שריון פסים': 200,
    'plate': 1500, 'שריון לוחות': 1500,
    // Shield
    'shield': 10, 'מגן': 10,
};

// ===== HELPER: Extract English name from mixed format =====
// "Longsword (חרב ארוכה)" -> "longsword"
// "חרב ארוכה" -> "חרב ארוכה"
function extractItemName(subtype: string): string {
    if (!subtype) return '';

    // Try to extract English name before parentheses
    const englishMatch = subtype.match(/^([A-Za-z\s,]+)/);
    if (englishMatch) {
        return englishMatch[1].trim().toLowerCase();
    }

    // Try to extract Hebrew name from parentheses
    const hebrewMatch = subtype.match(/\(([^)]+)\)/);
    if (hebrewMatch) {
        return hebrewMatch[1].trim();
    }

    // Return as-is (lowercase for English, original for Hebrew)
    return subtype.toLowerCase();
}

// ===== POTION PRICES (Official from DMG/Xanathar's) =====
export const POTION_PRICES: Record<string, number> = {
    // Healing Potions
    'healing': 50,
    'greater healing': 150,
    'superior healing': 500,
    'supreme healing': 1350,
    // Common Potions
    'climbing': 75,
    'swimming': 75,
    // Uncommon Potions
    'animal friendship': 200,
    'fire breath': 150,
    'growth': 250,
    'hill giant strength': 250,
    'poison': 100,
    'resistance': 300,
    'water breathing': 180,
    // Rare Potions
    'clairvoyance': 500,
    'diminution': 300,
    'gaseous form': 300,
    'frost giant strength': 1500,
    'fire giant strength': 2500,
    'heroism': 500,
    'invisibility': 500,
    'mind reading': 500,
    // Very Rare Potions
    'cloud giant strength': 5000,
    'storm giant strength': 10000,
    'flying': 5000,
    'invulnerability': 5000,
    'speed': 5000,
    'longevity': 10000,
    'vitality': 10000,
};

// ===== SPECIAL PROPERTY VALUE MODIFIERS =====
// Percentage multipliers for special properties
export const PROPERTY_VALUE_MODIFIERS: Record<string, number> = {
    // Damage Types
    'fire': 1.2,        // +20% for elemental damage
    'cold': 1.2,
    'lightning': 1.25,
    'thunder': 1.15,
    'acid': 1.15,
    'poison': 1.1,
    'necrotic': 1.3,
    'radiant': 1.35,
    'psychic': 1.25,
    'force': 1.4,

    // Special Properties
    'vorpal': 3.0,       // Triple price for vorpal
    'flametongue': 2.5,
    'frostbrand': 2.5,
    'dancing': 2.0,
    'defender': 2.5,
    'holy avenger': 3.0,
    'sun blade': 2.5,
    'luck blade': 3.0,

    // Utility Properties
    'returning': 1.3,
    'throwing': 1.2,
    'finesse': 1.1,
    'reach': 1.15,

    // Consumable Modifier (one use = 50% of permanent)
    'consumable': 0.5,

    // Attunement (slightly reduces value due to attunement slot cost)
    'attunement': 0.95,
};

// ===== RING & WONDROUS ITEM PRICES =====
export const RING_PRICES: Record<string, number> = {
    'protection': 3500,
    'invisibility': 10000,
    'resistance': 6000,
    'spell storing': 24000,
    'regeneration': 50000,
    'three wishes': 150000,
    'water walking': 1500,
    'swimming': 1500,
    'feather falling': 2000,
    'jumping': 2500,
    'warmth': 1000,
    'mind shielding': 16000,
    'evasion': 15000,
    'free action': 20000,
    'x-ray vision': 6000,
    'telekinesis': 80000,
    'shooting stars': 14000,
    'ram': 5000,
    'animal influence': 4000,
};

// ===== PRICE CALCULATION FUNCTION =====
export interface PriceCalculationParams {
    itemType: string;           // נשק, שריון, שיקוי, טבעת, etc.
    itemSubtype?: string;       // longsword, plate, healing, etc.
    rarity: string;             // נפוץ, לא נפוץ, נדיר, etc.
    enchantmentBonus?: number;  // +1, +2, +3
    properties?: string[];      // ['fire', 'returning', 'vorpal']
    isConsumable?: boolean;
    requiresAttunement?: boolean;
}

export interface PriceResult {
    basePrice: number;
    mundanePrice: number;
    enchantmentPrice: number;
    propertyMultiplier: number;
    finalPrice: number;
    priceRange: { min: number; max: number };
    breakdown: string[];
}

export function calculateItemPrice(params: PriceCalculationParams): PriceResult {
    const {
        itemType,
        itemSubtype,
        rarity,
        enchantmentBonus = 0,
        properties = [],
        isConsumable = false,
        requiresAttunement = false,
    } = params;

    const breakdown: string[] = [];

    // 1. Get Base Rarity Price
    const rarityData = RARITY_BASE_PRICES[rarity] || RARITY_BASE_PRICES['לא נפוץ'];
    let basePrice = rarityData.typical;
    breakdown.push(`Base (${rarity}): ${basePrice}gp`);

    // 2. Get Mundane Item Price
    let mundanePrice = 0;
    // Extract clean item name from mixed format like "Longsword (חרב ארוכה)"
    const cleanSubtype = extractItemName(itemSubtype || '');
    const subtypeLower = cleanSubtype.toLowerCase();

    if (itemType.includes('נשק') || itemType.toLowerCase().includes('weapon')) {
        // Try English name first, then Hebrew, then default
        mundanePrice = MUNDANE_WEAPON_PRICES[subtypeLower]
            || MUNDANE_WEAPON_PRICES[cleanSubtype]
            || 15; // Default to longsword price
        breakdown.push(`Mundane Weapon (${cleanSubtype}): ${mundanePrice}gp`);
    } else if (itemType.includes('שריון') || itemType.toLowerCase().includes('armor')) {
        mundanePrice = MUNDANE_ARMOR_PRICES[subtypeLower]
            || MUNDANE_ARMOR_PRICES[cleanSubtype]
            || 50;
        breakdown.push(`Mundane Armor (${cleanSubtype}): ${mundanePrice}gp`);
    } else if (itemType.includes('שיקוי') || itemType.toLowerCase().includes('potion')) {
        // For potions, use specific potion prices
        const potionPrice = POTION_PRICES[subtypeLower]
            || POTION_PRICES[cleanSubtype]
            || rarityData.typical;
        basePrice = potionPrice;
        breakdown.push(`Potion Price: ${potionPrice}gp`);
    } else if (itemType.includes('טבעת') || itemType.toLowerCase().includes('ring')) {
        const ringPrice = RING_PRICES[subtypeLower] || RING_PRICES[cleanSubtype];
        if (ringPrice) {
            basePrice = ringPrice;
            breakdown.push(`Ring Price: ${ringPrice}gp`);
        }
    }

    // 3. Calculate Enchantment Bonus
    let enchantmentPrice = 0;
    if (enchantmentBonus > 0 && enchantmentBonus <= 3) {
        enchantmentPrice = ENCHANTMENT_BONUS_PRICES[enchantmentBonus] || 0;
        breakdown.push(`+${enchantmentBonus} Enchantment: ${enchantmentPrice}gp`);
    }

    // 4. Calculate Property Multiplier
    let propertyMultiplier = 1.0;
    for (const prop of properties) {
        const modifier = PROPERTY_VALUE_MODIFIERS[prop.toLowerCase()];
        if (modifier) {
            propertyMultiplier *= modifier;
            breakdown.push(`${prop}: x${modifier}`);
        }
    }

    // 5. Apply Consumable Modifier
    if (isConsumable) {
        propertyMultiplier *= PROPERTY_VALUE_MODIFIERS['consumable'];
        breakdown.push('Consumable: x0.5');
    }

    // 6. Apply Attunement Modifier (slight discount)
    if (requiresAttunement) {
        propertyMultiplier *= PROPERTY_VALUE_MODIFIERS['attunement'];
        breakdown.push('Requires Attunement: x0.95');
    }

    // 7. Calculate Final Price
    const subtotal = basePrice + mundanePrice + enchantmentPrice;
    let finalPrice = Math.round(subtotal * propertyMultiplier);

    // Round to nearest 10 for cleaner numbers (only for prices >= 10)
    if (finalPrice >= 10) {
        finalPrice = Math.round(finalPrice / 10) * 10;
    }

    // 8. Calculate Price Range (±20%)
    const priceRange = {
        min: Math.round((finalPrice * 0.8) / 10) * 10 || Math.round(finalPrice * 0.8),
        max: Math.round((finalPrice * 1.2) / 10) * 10 || Math.round(finalPrice * 1.2),
    };

    breakdown.push(`Final: ${finalPrice}gp (range: ${priceRange.min}-${priceRange.max}gp)`);

    return {
        basePrice,
        mundanePrice,
        enchantmentPrice,
        propertyMultiplier,
        finalPrice,
        priceRange,
        breakdown,
    };
}

// ===== HELPER: Extract Bonus from Ability Description =====
export function extractEnchantmentBonus(abilityDesc: string): number {
    // Look for +1, +2, +3 patterns
    const match = abilityDesc.match(/\+([1-3])/);
    if (match) {
        return parseInt(match[1], 10);
    }
    return 0;
}

// ===== HELPER: Extract Properties from Ability Description =====
export function extractProperties(abilityDesc: string): string[] {
    const properties: string[] = [];
    const lowerDesc = abilityDesc.toLowerCase();

    const propertyKeywords = [
        'fire', 'אש', 'cold', 'קרח', 'lightning', 'ברק', 'thunder', 'רעם',
        'acid', 'חומצה', 'poison', 'רעל', 'necrotic', 'נקרוטי', 'radiant', 'קורן',
        'psychic', 'פסיכי', 'force', 'כוח', 'vorpal', 'flametongue', 'frostbrand',
        'returning', 'חוזר', 'dancing', 'רוקד', 'defender', 'מגן',
    ];

    for (const keyword of propertyKeywords) {
        if (lowerDesc.includes(keyword)) {
            // Normalize Hebrew to English
            const normalized = keyword === 'אש' ? 'fire'
                : keyword === 'קרח' ? 'cold'
                    : keyword === 'ברק' ? 'lightning'
                        : keyword === 'רעל' ? 'poison'
                            : keyword === 'חוזר' ? 'returning'
                                : keyword;
            if (!properties.includes(normalized)) {
                properties.push(normalized);
            }
        }
    }

    return properties;
}

// ===== MAIN EXPORT: Calculate Price from AI Result =====
export function calculatePriceFromAIResult(
    itemType: string,
    itemSubtype: string,
    rarity: string,
    abilityDesc: string,
    requiresAttunement: boolean = false
): number {
    const enchantmentBonus = extractEnchantmentBonus(abilityDesc);
    const properties = extractProperties(abilityDesc);
    const isConsumable = itemType.includes('שיקוי') || itemType.toLowerCase().includes('potion');

    const result = calculateItemPrice({
        itemType,
        itemSubtype,
        rarity,
        enchantmentBonus,
        properties,
        isConsumable,
        requiresAttunement,
    });

    return result.finalPrice;
}
