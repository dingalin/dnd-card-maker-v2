/**
 * Item Enrichment Utilities
 * Shared logic for enriching item details with official D&D stats and translations
 */

// ==================== TRANSLATION CONSTANTS ====================

const CATEGORY_TRANSLATIONS = {
    simple: { he: 'פשוט', en: 'Simple' },
    martial: { he: 'קרבי', en: 'Martial' },
    weapon: { he: 'נשק', en: 'Weapon' },
    light: { he: 'קל', en: 'Light' },
    medium: { he: 'בינוני', en: 'Medium' },
    heavy: { he: 'כבד', en: 'Heavy' },
    shield: { he: 'מגן', en: 'Shield' }
};

const DAMAGE_TYPE_TRANSLATIONS = {
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

const WEAPON_PROPERTY_TRANSLATIONS = {
    twoHanded: { he: 'דו-ידני', en: 'Two-Handed' },
    versatile: { he: 'רב-שימושי', en: 'Versatile' },
    finesse: { he: 'עדין', en: 'Finesse' },
    reach: { he: 'טווח', en: 'Reach' },
    thrown: { he: 'הטלה', en: 'Thrown' },
    light: { he: 'קל', en: 'Light' }
};

const TYPE_TRANSLATIONS = {
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

/**
 * Get damage type translation based on locale
 * @param {string} dmgType - English damage type
 * @param {string} locale - 'he' or 'en'
 * @returns {string} - Translated damage type
 */
export function getDamageTypeTranslation(dmgType, locale = 'he') {
    const translation = DAMAGE_TYPE_TRANSLATIONS[dmgType?.toLowerCase()];
    if (!translation) return dmgType;
    return translation[locale] || dmgType;
}

/**
 * Extract specific type name from subtype format "Longsword (חרב ארוכה)"
 */
function extractSpecificType(finalSubtype, isHebrew) {
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
function findOfficialStats(finalSubtype) {
    if (!window.ITEM_STATS || !finalSubtype) return null;

    // Try direct match first
    if (window.ITEM_STATS[finalSubtype]) {
        console.log("ItemEnrichment: Direct match found:", finalSubtype);
        return window.ITEM_STATS[finalSubtype];
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
    const statsKeys = Object.keys(window.ITEM_STATS);
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
        console.log("ItemEnrichment: Match found:", matchingKey, "for:", finalSubtype);
        return window.ITEM_STATS[matchingKey];
    }

    console.warn("ItemEnrichment: No stats found for:", finalSubtype,
        "| Available keys sample:", statsKeys.slice(0, 5).join(', '));
    return null;
}

/**
 * Clean damage string - translate based on locale and remove duplicates
 */
function cleanDamageString(str, isHebrew) {
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
export function enrichItemDetails(itemDetails, type, finalSubtype, locale = 'he') {
    if (!window.OFFICIAL_ITEMS) return;

    const isHebrew = locale === 'he';

    try {
        console.log(`ItemEnrichment: Enriching ${type} / ${finalSubtype} (locale: ${locale})`);

        const specificType = extractSpecificType(finalSubtype, isHebrew);
        const t = (key) => CATEGORY_TRANSLATIONS[key]?.[isHebrew ? 'he' : 'en'] || key;

        // === WEAPONS ===
        if (type === 'weapon' && window.OFFICIAL_ITEMS.weapon) {
            let weaponPrefix = t('weapon');
            const cats = window.OFFICIAL_ITEMS.weapon;

            const checkCategory = (category) => {
                if (!cats[category]) return false;
                return cats[category].some(item =>
                    item.includes(finalSubtype) || finalSubtype?.includes(item.split(' ')[0]) ||
                    (specificType && item.includes(specificType))
                );
            };

            const isSimple = checkCategory("Simple Melee") || checkCategory("Simple Ranged");
            const isMartial = checkCategory("Martial Melee") || checkCategory("Martial Ranged");

            if (isSimple) weaponPrefix = t('simple');
            if (isMartial) weaponPrefix = t('martial');

            if (specificType) {
                itemDetails.typeHe = `${specificType} (${weaponPrefix})`;
            } else if (itemDetails.typeHe?.toLowerCase() === 'weapon') {
                itemDetails.typeHe = `${t('weapon')} ${weaponPrefix}`;
            }
        }

        // === ARMOR ===
        else if (type === 'armor' && window.OFFICIAL_ITEMS.armor) {
            const cats = window.OFFICIAL_ITEMS.armor;
            let armorCategory = "";

            if ((cats["Light Armor"] || []).some(x => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('light');
            } else if ((cats["Medium Armor"] || []).some(x => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('medium');
            } else if ((cats["Heavy Armor"] || []).some(x => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
                armorCategory = t('heavy');
            } else if ((cats["Shield"] || []).some(x => x.includes(finalSubtype) || finalSubtype?.includes(x.split(' ')[0]))) {
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
                const damageMap = isHebrew
                    ? { bludgeoning: 'מוחץ', piercing: 'דוקר', slashing: 'חותך' }
                    : { bludgeoning: 'bludgeoning', piercing: 'piercing', slashing: 'slashing' };
                const officialDamageType = damageMap[officialStats.damageType] || officialStats.damageType;

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

                console.log("ItemEnrichment: Set weapon stats:", itemDetails.weaponDamage, itemDetails.damageType);
            }

            // Armor AC
            if (type === 'armor' && officialStats.ac) {
                itemDetails.armorClass = officialStats.ac;
                itemDetails.coreStats = `AC ${officialStats.ac}`;
                console.log("ItemEnrichment: Set armor AC:", officialStats.ac);
            }

            // Weapon properties
            if (type === 'weapon') {
                const tp = (key) => WEAPON_PROPERTY_TRANSLATIONS[key]?.[isHebrew ? 'he' : 'en'] || key;
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

    } catch (err) {
        console.warn("ItemEnrichment: Error enriching details:", err);
    }
}
