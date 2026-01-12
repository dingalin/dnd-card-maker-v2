/**
 * Item Enrichment Utilities
 * Shared logic for enriching item details with official D&D stats and translations
 */

import { Logger } from './Logger';

// ==================== TYPES ====================

export interface TranslationMap {
    [key: string]: { he: string; en: string };
}

export interface OfficialStats {
    damage?: string;
    damageType?: string;
    ac?: string; // Stored as string in legacy data
    basePrice?: number;
    dexMod?: 'full' | 'max2' | 'none';
    twoHanded?: boolean;
    versatile?: string;
    finesse?: boolean;
    reach?: boolean;
    thrown?: boolean;
    light?: boolean;
    effect?: string | { he?: string; en?: string };
    duration?: string | { he?: string; en?: string };
    typeLabel?: { he?: string; en?: string };
}

export interface ItemDetails {
    name?: string;
    type?: string;
    subtype?: string;
    typeHe?: string;
    weaponDamage?: string;
    damageType?: string;
    coreStats?: string;
    armorClass?: number | string; // Can be either - parsed to number later
    armorBonus?: number;
    dexModLabel?: string;
    weaponProperties?: string[];
    quickStats?: string;
    abilityDesc?: string;
    rarity?: string;
    rarityHe?: string;
    gold?: number | string;
    visualPrompt?: string;
    specialDamage?: string;
    spellAbility?: string;
    requiresAttunement?: boolean;
    versatileDamage?: string;
    assemblyAbilities?: any[];
    assemblyElement?: any;
    [key: string]: any;
}

// Global declaration removed to fix modifier mismatch
// Types are used via direct access or assumed global in legacy context

// ==================== TRANSLATION CONSTANTS ====================

const CATEGORY_TRANSLATIONS: TranslationMap = {
    simple: { he: 'פשוט', en: 'Simple' },
    martial: { he: 'קרבי', en: 'Martial' },
    weapon: { he: 'נשק', en: 'Weapon' },
    light: { he: 'קל', en: 'Light' },
    medium: { he: 'בינוני', en: 'Medium' },
    heavy: { he: 'כבד', en: 'Heavy' },
    shield: { he: 'מגן', en: 'Shield' }
};

const DAMAGE_TYPE_TRANSLATIONS: TranslationMap = {
    slashing: { he: 'חותך', en: 'slashing' },
    piercing: { he: 'דוקר', en: 'piercing' },
    bludgeoning: { he: 'מוחץ', en: 'bludgeoning' },
    fire: { he: 'אש', en: 'fire' },
    cold: { he: 'קור', en: 'cold' },
    lightning: { he: 'ברק', en: 'lightning' },
    poison: { he: 'רעל', en: 'poison' },
    acid: { he: 'חומצה', en: 'acid' },
    necrotic: { he: 'נמק', en: 'necrotic' },
    radiant: { he: 'זוהר', en: 'radiant' },
    force: { he: 'כוח', en: 'force' },
    psychic: { he: 'נפשי', en: 'psychic' },
    thunder: { he: 'רעם', en: 'thunder' }
};

const WEAPON_PROPERTY_TRANSLATIONS: TranslationMap = {
    twoHanded: { he: 'דו-ידני', en: 'Two-Handed' },
    versatile: { he: 'רב-שימושי', en: 'Versatile' },
    finesse: { he: 'עדין', en: 'Finesse' },
    reach: { he: 'טווח', en: 'Reach' },
    thrown: { he: 'הטלה', en: 'Thrown' },
    light: { he: 'קל', en: 'Light' }
};

const TYPE_TRANSLATIONS: { [key: string]: string } = {
    weapon: 'נשק',
    armor: 'שריון',
    potion: 'שיקוי',
    ring: 'טבעת',
    rod: 'מטה',
    staff: 'מקל',
    wand: 'שרביט',
    scroll: 'מגילה',
    wondrous: 'פלאי',
    'wondrous item': 'חפץ פלאי'
};

// ==================== HELPER FUNCTIONS ====================

// Magic bonus multipliers for pricing (DMG guidelines)
const MAGIC_BONUS_MULTIPLIERS: { [key: number]: number } = {
    0: 1,      // Non-magic
    1: 100,    // +1 item: basePrice + 100-500 GP
    2: 500,    // +2 item: basePrice + 500-5000 GP  
    3: 2500,   // +3 item: basePrice + 5000-25000 GP
    4: 10000   // +4 item: basePrice + 25000+ GP
};

/**
 * Calculate final item price based on base item cost + magic bonus + random variance
 * @param {number} basePrice - Base item price from ITEM_STATS
 * @param {number} magicBonus - Magic bonus (+1, +2, etc)
 * @param {string} rarity - Item rarity for fallback pricing
 * @returns {number} - Final price rounded to nearest 10
 */
export function calculateItemPrice(basePrice: number = 0, magicBonus: number = 0, rarity: string = 'Uncommon'): number {
    // Base price from item (e.g., leather armor = 10 GP, plate = 1500 GP)
    let price = basePrice || 0;

    // Add magic bonus value
    const bonusMultiplier = MAGIC_BONUS_MULTIPLIERS[Math.min(magicBonus, 4)] || 0;
    if (magicBonus > 0) {
        // Rarity-based magic price ranges
        const magicPrices: { [key: string]: { min: number; max: number } } = {
            'Common': { min: 50, max: 100 },
            'Uncommon': { min: 100, max: 500 },
            'Rare': { min: 500, max: 5000 },
            'Very Rare': { min: 5000, max: 25000 },
            'Legendary': { min: 25000, max: 100000 }
        };
        const range = magicPrices[rarity] || magicPrices['Uncommon'];
        // Random price within rarity range
        price += range.min + Math.random() * (range.max - range.min);
    }

    // Apply ±20% random variance (different each time!)
    const randomSeed = Math.random(); // 0.0 to 1.0
    const variance = 0.8 + randomSeed * 0.4; // 0.8 to 1.2
    price = price * variance;

    // Dynamic rounding based on price magnitude for more natural-looking prices
    // Small prices (under 100): round to nearest 5
    // Medium prices (100-1000): round to nearest 10
    // Large prices (1000-10000): round to nearest 50
    // Very large prices (10000+): round to nearest 100
    let roundTo;
    if (price < 100) {
        roundTo = 5;
    } else if (price < 1000) {
        roundTo = 10;
    } else if (price < 10000) {
        roundTo = 50;
    } else {
        roundTo = 100;
    }
    price = Math.round(price / roundTo) * roundTo;

    // Add small jitter to break up "round" prices (±2% of final price)
    // This prevents everything from being exactly 50000, 75000, etc.
    const jitterSeed = Math.random();
    const jitterAmount = Math.round(price * 0.02 * (jitterSeed - 0.5) * 2);
    price = price + jitterAmount;

    // Re-round after jitter to keep prices clean but varied
    price = Math.round(price / roundTo) * roundTo;

    // Minimum price of 10 GP for any magic item
    if (magicBonus > 0 && price < 10) price = 10;

    // Minimum price of 1 GP for mundane items
    if (price < 1) price = Math.max(1, Math.round(basePrice * variance));

    Logger.debug('ItemEnrichment', `PRICE CALC: base=${basePrice}, bonus=+${magicBonus}, rarity=${rarity}, randomSeed=${randomSeed.toFixed(4)}, variance=${variance.toFixed(2)}, jitter=${jitterAmount}, FINAL=${price} GP`);

    return price;
}

/**
 * Get damage type translation based on locale
 */
export function getDamageTypeTranslation(dmgType: string, locale: 'he' | 'en' = 'he'): string {
    const translation = DAMAGE_TYPE_TRANSLATIONS[dmgType?.toLowerCase()];
    if (!translation) return dmgType;
    return translation[locale] || dmgType;
}

/**
 * Extract specific type name from subtype format "Longsword (חרב ארוכה)"
 */
function extractSpecificType(finalSubtype: string, isHebrew: boolean): string {
    if (!finalSubtype) return '';

    if (finalSubtype.includes('(')) {
        const matches = finalSubtype.match(/\(([^)]+)\)/);
        if (matches && matches[1]) {
            // For Hebrew, return the Hebrew name in parentheses
            if (isHebrew) return matches[1].trim();
            // For English, return the English name before parentheses
            return finalSubtype.split('(')[0].trim();
        }
    }
    return finalSubtype;
}

/**
 * Find official stats by matching subtype against ITEM_STATS keys
 */
function findOfficialStats(finalSubtype: string): OfficialStats | null {
    if (!(window as any).ITEM_STATS || !finalSubtype) return null;

    // Try direct match first
    if ((window as any).ITEM_STATS[finalSubtype]) {
        Logger.debug('ItemEnrichment', 'Direct match found', { finalSubtype });
        return (window as any).ITEM_STATS[finalSubtype];
    }

    // Normalize the subtype for matching
    const normalizedSubtype = finalSubtype.toLowerCase().trim();

    // Extract English name from format "Longsword (חרב ארוכה)"
    const englishName = finalSubtype.includes('(')
        ? finalSubtype.split('(')[0].trim().toLowerCase()
        : normalizedSubtype;

    // Extract Hebrew name if present
    const hebrewMatch = finalSubtype.match(/\(([^)]+)\)/);
    const hebrewName = hebrewMatch?.[1]?.trim() || '';

    // Search for partial match with multiple strategies
    const statsKeys = Object.keys((window as any).ITEM_STATS);
    const matchingKey = statsKeys.find(key => {
        const keyLower = key.toLowerCase();
        const keyEnglish = key.includes('(') ? key.split('(')[0].trim().toLowerCase() : keyLower;
        const keyHebrewMatch = key.match(/\(([^)]+)\)/);
        const keyHebrew = keyHebrewMatch?.[1]?.trim() || '';

        // Strategy 1: Key contains subtype or vice versa
        if (keyLower.includes(normalizedSubtype) || normalizedSubtype.includes(keyLower)) return true;

        // Strategy 2: English names match
        if (englishName && keyEnglish && (keyEnglish.includes(englishName) || englishName.includes(keyEnglish))) return true;

        // Strategy 3: Hebrew names match
        if (hebrewName && keyHebrew && (keyHebrew.includes(hebrewName) || hebrewName.includes(keyHebrew))) return true;

        // Strategy 4: First word match (e.g., "Longsword" from both)
        const subtypeFirstWord = englishName.split(' ')[0];
        const keyFirstWord = keyEnglish.split(' ')[0];
        if (subtypeFirstWord.length > 3 && keyFirstWord.length > 3 &&
            (subtypeFirstWord === keyFirstWord || subtypeFirstWord.includes(keyFirstWord) || keyFirstWord.includes(subtypeFirstWord))) {
            return true;
        }

        return false;
    });

    if (matchingKey) {
        Logger.debug('ItemEnrichment', 'Match found', { matchingKey, finalSubtype });
        return (window as any).ITEM_STATS[matchingKey];
    }

    Logger.warn('ItemEnrichment', `No stats found for: ${finalSubtype} | Available keys sample: ${statsKeys.slice(0, 5).join(', ')}`);
    return null;
}

/**
 * Clean damage string - translate based on locale and remove duplicates
 */
function cleanDamageString(str: string, isHebrew: boolean): string {
    if (!str) return str;
    let result = str;

    if (isHebrew) {
        // Translate English to Hebrew
        for (const [eng, trans] of Object.entries(DAMAGE_TYPE_TRANSLATIONS)) {
            result = result.replace(new RegExp(eng, 'gi'), trans.he);
        }
        // Remove duplicate Hebrew damage types
        for (const trans of Object.values(DAMAGE_TYPE_TRANSLATIONS)) {
            result = result.replace(new RegExp(`${trans.he}\\s+${trans.he}`, 'g'), trans.he);
        }
    } else {
        // Translate Hebrew to English
        for (const [eng, trans] of Object.entries(DAMAGE_TYPE_TRANSLATIONS)) {
            result = result.replace(new RegExp(trans.he, 'g'), eng);
        }
        // Remove duplicate English damage types
        for (const eng of Object.keys(DAMAGE_TYPE_TRANSLATIONS)) {
            result = result.replace(new RegExp(`${eng}\\s+${eng}`, 'gi'), eng);
        }
    }

    return result.replace(/\s{2,}/g, ' ').trim();
}

// ==================== MAIN FUNCTION ====================

/**
 * Enrich item details with official D&D stats and proper translations
 * @param {Object} itemDetails - Item details object to enrich (mutated in place)
 * @param {string} type - Item type (weapon, armor, etc.)
 * @param {string} finalSubtype - Specific item subtype
 * @param {string} locale - 'he' or 'en'
 */
export function enrichItemDetails(itemDetails: ItemDetails, type: string, finalSubtype: string, locale: 'he' | 'en' = 'he'): void {
    if (!(window as any).OFFICIAL_ITEMS) return;

    const isHebrew = locale === 'he';

    try {
        Logger.debug('ItemEnrichment', `Enriching ${type} / ${finalSubtype}`, { locale });

        const specificType = extractSpecificType(finalSubtype, isHebrew);
        const t = (key: string) => CATEGORY_TRANSLATIONS[key]?.[isHebrew ? 'he' : 'en'] || key;

        // === WEAPONS ===
        if (type === 'weapon' && (window as any).OFFICIAL_ITEMS.weapon) {
            let weaponPrefix = t('weapon');
            const cats = (window as any).OFFICIAL_ITEMS.weapon;

            // Check if item exactly matches one in the category
            const checkCategory = (category: string) => {
                if (!cats[category]) return false;
                return cats[category].some((item: string) => {
                    // Exact match
                    if (item === finalSubtype) return true;
                    // Check if item key matches (e.g., "Handaxe (גרזן יד)" matches "Handaxe")
                    const itemKey = item.split(' ')[0].toLowerCase();
                    const subtypeKey = finalSubtype?.split(' ')[0]?.toLowerCase();
                    if (itemKey === subtypeKey) return true;
                    // Check Hebrew name in parentheses exactly
                    const itemHebrew = item.match(/\(([^)]+)\)/)?.[1];
                    const subtypeHebrew = finalSubtype?.match(/\(([^)]+)\)/)?.[1];
                    if (itemHebrew && subtypeHebrew && itemHebrew === subtypeHebrew) return true;
                    return false;
                });
            };

            const isSimple = checkCategory("Simple Melee") || checkCategory("Simple Ranged");
            const isMartial = checkCategory("Martial Melee") || checkCategory("Martial Ranged");

            // Simple takes precedence if matched (fix for items matching both)
            if (isSimple) weaponPrefix = t('simple');
            else if (isMartial) weaponPrefix = t('martial');

            if (specificType) {
                itemDetails.typeHe = `${specificType} (${weaponPrefix})`;
            } else if (itemDetails.typeHe?.toLowerCase() === 'weapon') {
                itemDetails.typeHe = `${t('weapon')} ${weaponPrefix}`;
            }
        }

        // === ARMOR ===
        else if (type === 'armor' && (window as any).OFFICIAL_ITEMS.armor) {
            const cats = (window as any).OFFICIAL_ITEMS.armor;
            let armorCategory = "";

            if ((cats["Light Armor"] || []).some((x: string) => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('light');
            } else if ((cats["Medium Armor"] || []).some((x: string) => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('medium');
            } else if ((cats["Heavy Armor"] || []).some((x: string) => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('heavy');
            } else if ((cats["Shield"] || []).some((x: string) => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('shield');
            }

            if (specificType) {
                if (armorCategory === t('shield')) {
                    itemDetails.typeHe = t('shield');
                } else if (armorCategory) {
                    itemDetails.typeHe = `${specificType} (${armorCategory})`;
                } else {
                    itemDetails.typeHe = specificType;
                }
            }
        }

        // === STAT BACKFILL (only for weapons and armor) ===
        const shouldLookupStats = type === 'weapon' || type === 'armor';
        const officialStats = shouldLookupStats ? findOfficialStats(finalSubtype) : null;

        if (officialStats) {
            // Weapon damage
            if (type === 'weapon' && officialStats.damage) {
                const damageMap: { [key: string]: string } = isHebrew
                    ? { bludgeoning: 'מוחץ', piercing: 'דוקר', slashing: 'חותך' }
                    : { bludgeoning: 'bludgeoning', piercing: 'piercing', slashing: 'slashing' };
                const officialDamageType = damageMap[officialStats.damageType || ''] || officialStats.damageType;

                // Preserve AI-generated bonus (e.g., "+1")
                let bonusMatch = null;
                if (itemDetails.weaponDamage && typeof itemDetails.weaponDamage === 'string') {
                    bonusMatch = itemDetails.weaponDamage.match(/(\+\s*\d+)/);
                }
                const bonus = bonusMatch ? ` ${bonusMatch[1].replace(/\s/g, '')}` : '';

                itemDetails.weaponDamage = `${officialStats.damage}${bonus}`;
                itemDetails.damageType = officialDamageType;

                // Also set coreStats for TreasureController compatibility
                itemDetails.coreStats = `${officialStats.damage} ${officialDamageType}`;

                Logger.debug('ItemEnrichment', 'Set weapon stats', { weaponDamage: itemDetails.weaponDamage, damageType: itemDetails.damageType });
            }

            // Armor AC
            if (type === 'armor' && officialStats.ac) {
                let armorBonus = 0;
                let totalAC = 0;

                // SKIP if armorClass was already set correctly by ItemGenerator's updateArmorClassWithBonus
                const existingAC = parseInt(String(itemDetails.armorClass), 10) || 0;
                if (existingAC >= 10) {
                    Logger.debug('ItemEnrichment', 'Keeping existing armorClass (already valid)', { existingAC });
                    totalAC = existingAC;
                    armorBonus = itemDetails.armorBonus || 0;
                } else {
                    // CRITICAL: officialStats.ac is stored as STRING in dnd-data.js!
                    // Must parse as integer to avoid string concatenation bug ("17" + 0 = "170")
                    const baseAC = parseInt(officialStats.ac, 10) || 0;

                    // Extract +X bonus from ability description or other fields
                    const bonusMatch = itemDetails.abilityDesc?.match(/\+(\d+)\s*(לדרגת שריון|to AC|AC|לשריון|armor class)/i) ||
                        itemDetails.abilityDesc?.match(/מעניק\s*\+(\d+)/i);
                    if (bonusMatch) {
                        armorBonus = parseInt(bonusMatch[1], 10);
                        Logger.debug('ItemEnrichment', 'Extracted armor bonus', { armorBonus });
                    }

                    // Total AC = Base + Bonus
                    totalAC = baseAC + armorBonus;
                    itemDetails.armorClass = totalAC;
                    itemDetails.armorBonus = armorBonus; // Store for display
                    Logger.debug('ItemEnrichment', 'Set armorClass', { totalAC, baseAC, armorBonus });
                }

                // Core stats shows "+X" indicator if there's a bonus
                if (armorBonus > 0) {
                    itemDetails.coreStats = `${totalAC} AC (+${armorBonus})`;
                } else {
                    itemDetails.coreStats = `AC ${totalAC}`;
                }

                // Add dexterity modifier info based on armor category
                if (officialStats.dexMod) {
                    const dexLabels: { [key: string]: { he: string; en: string } } = {
                        full: { he: '+זריזות', en: '+Dex' },
                        max2: { he: '+זריזות (עד +2)', en: '+Dex (max 2)' },
                        none: { he: '', en: '' } // No text for heavy armor
                    };
                    const dexLabel = dexLabels[officialStats.dexMod]?.[isHebrew ? 'he' : 'en'] || '';
                    if (dexLabel) {
                        itemDetails.dexModLabel = dexLabel;
                    }
                }

                Logger.debug('ItemEnrichment', 'Final armor AC', { totalAC, armorBonus, dexMod: officialStats.dexMod });
            }

            // Weapon properties
            if (type === 'weapon') {
                const tp = (key: string) => WEAPON_PROPERTY_TRANSLATIONS[key]?.[isHebrew ? 'he' : 'en'] || key;
                const props = [];

                if (officialStats.twoHanded) props.push(tp('twoHanded'));
                if (officialStats.versatile) {
                    props.push(tp('versatile'));
                    itemDetails.versatileDamage = officialStats.versatile;
                }
                if (officialStats.finesse) props.push(tp('finesse'));
                if (officialStats.reach) props.push(tp('reach'));
                if (officialStats.thrown) props.push(tp('thrown'));
                if (officialStats.light) props.push(tp('light'));

                itemDetails.weaponProperties = props;
            }

            // Potion effects
            if (type === 'potion' && officialStats.effect) {
                const effect = typeof officialStats.effect === 'object'
                    ? (officialStats.effect[isHebrew ? 'he' : 'en'] || '')
                    : officialStats.effect;

                const duration = typeof officialStats.duration === 'object'
                    ? (officialStats.duration[isHebrew ? 'he' : 'en'] || '')
                    : (officialStats.duration || '');

                // Build quickStats from official data
                if (duration && duration !== 'Instant' && duration !== 'מיידי') {
                    itemDetails.quickStats = `${effect}\n(${duration})`;
                } else {
                    itemDetails.quickStats = effect;
                }

                Logger.debug('ItemEnrichment', 'Set potion effect', { effect });
            }

            // Ring effects
            if (type === 'ring' && officialStats.effect) {
                const effect = typeof officialStats.effect === 'object'
                    ? (officialStats.effect[isHebrew ? 'he' : 'en'] || '')
                    : officialStats.effect;

                itemDetails.quickStats = effect;
                Logger.debug('ItemEnrichment', 'Set ring effect', { effect });
            }

            // Wondrous item type labels
            if (type === 'wondrous' && officialStats.typeLabel) {
                const typeLabel = officialStats.typeLabel[isHebrew ? 'he' : 'en'] || '';
                if (typeLabel && !itemDetails.typeHe?.includes(typeLabel)) {
                    itemDetails.typeHe = `${typeLabel} (${isHebrew ? 'פלאי' : 'Wondrous'})`;
                }
                Logger.debug('ItemEnrichment', 'Set wondrous type', { typeHe: itemDetails.typeHe });
            }
        }

        // === POST-PROCESSING ===
        if (itemDetails.weaponDamage) {
            itemDetails.weaponDamage = cleanDamageString(itemDetails.weaponDamage, isHebrew);
        }
        if (itemDetails.quickStats) {
            itemDetails.quickStats = cleanDamageString(itemDetails.quickStats, isHebrew);
        }

        // Fix typeHe if in wrong language
        if (itemDetails.typeHe && isHebrew) {
            const lower = itemDetails.typeHe.toLowerCase();
            if (TYPE_TRANSLATIONS[lower]) {
                itemDetails.typeHe = TYPE_TRANSLATIONS[lower];
            }
        }

        // === PRICE CALCULATION ===
        // Calculate price based on base item cost + magic bonus + ±20% random variance
        // Note: officialStats was already defined earlier in this function
        const basePrice = officialStats?.basePrice || 0;

        Logger.debug('ItemEnrichment', 'Price calculation check', { hasOfficialStats: !!officialStats, basePrice });

        // Extract magic bonus from armor or weapon
        let magicBonus = 0;
        if (itemDetails.armorBonus) {
            magicBonus = itemDetails.armorBonus;
        } else if (itemDetails.weaponDamage) {
            const bonusMatch = itemDetails.weaponDamage.match(/\+(\d+)/);
            if (bonusMatch) magicBonus = parseInt(bonusMatch[1], 10);
        }

        // Get rarity - use various possible field names
        const rarity = itemDetails.rarityHe || itemDetails.rarity || 'Uncommon';
        const normalizedRarity = rarity.includes('נדיר מאוד') ? 'Very Rare' :
            rarity.includes('נדיר') ? 'Rare' :
                rarity.includes('אגדי') ? 'Legendary' :
                    rarity.includes('נפוץ') && !rarity.includes('לא') ? 'Common' :
                        rarity.includes('לא נפוץ') ? 'Uncommon' :
                            rarity; // Keep as-is if already English

        Logger.debug('ItemEnrichment', 'Parsed rarity', { rarity, normalizedRarity, magicBonus });

        // Calculate price if we have base price OR magic bonus (always for weapons/armor)
        // BUT: Skip if gold was already set to a high value by PricingService
        const existingGold = parseInt(String(itemDetails.gold), 10) || 0;
        const skipPriceCalc = existingGold > 500; // PricingService already calculated; don't overwrite

        if (skipPriceCalc) {
            Logger.debug('ItemEnrichment', 'Keeping PricingService gold (skipping enrichment calc)', { existingGold });
        } else if (basePrice > 0 || magicBonus > 0 || (type === 'weapon' || type === 'armor')) {
            const calculatedPrice = calculateItemPrice(basePrice, magicBonus, normalizedRarity);
            itemDetails.gold = calculatedPrice;
            Logger.debug('ItemEnrichment', 'Set item gold', { calculatedPrice, basePrice, magicBonus, rarity: normalizedRarity });
        } else {
            Logger.debug('ItemEnrichment', 'Skipping price calc: no basePrice, no bonus', { type });
        }

    } catch (err) {
        Logger.error('ItemEnrichment', 'Error enriching details', err as Error);
    }
}
