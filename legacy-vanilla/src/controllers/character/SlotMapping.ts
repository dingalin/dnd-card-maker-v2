// @ts-nocheck
/**
 * SlotMappingData - Equipment slot type definitions
 * Defines what item types can go in each character slot
 *
 * Extracted from CharacterController.js for reusability
 */

interface SlotConfigItem {
    type: string;
    subtype?: string;
    label: string;
    labelEn?: string;
}

interface SlotMappingItem {
    type: string;
    subtype?: string;
    label: string;
}

/**
 * Base slot configuration (static mapping)
 */
export const SLOT_CONFIG: Record<string, SlotConfigItem> = {
    helmet: { type: 'wondrous', subtype: 'Helmet', label: 'קסדה', labelEn: 'Helmet' },
    armor: { type: 'armor', label: 'שריון', labelEn: 'Armor' },
    mainhand: { type: 'weapon', label: 'נשק', labelEn: 'Weapon' },
    offhand: { type: 'armor', subtype: 'Shield (מגן)', label: 'מגן', labelEn: 'Shield' },
    ranged: { type: 'weapon', label: 'קשת', labelEn: 'Ranged' },
    ring1: { type: 'ring', label: 'טבעת', labelEn: 'Ring' },
    ring2: { type: 'ring', label: 'טבעת', labelEn: 'Ring' },
    necklace: { type: 'wondrous', subtype: 'Amulet', label: 'שרשרת', labelEn: 'Amulet' },
    cape: { type: 'wondrous', subtype: 'Cloak', label: 'גלימה', labelEn: 'Cloak' },
    boots: { type: 'wondrous', subtype: 'Boots', label: 'מגפיים', labelEn: 'Boots' },
    belt: { type: 'wondrous', subtype: 'Belt', label: 'חגורה', labelEn: 'Belt' },
    gloves: { type: 'wondrous', subtype: 'Gloves', label: 'כפפות', labelEn: 'Gloves' },
    ammo: { type: 'wondrous', subtype: 'Quiver', label: 'תחמושת', labelEn: 'Ammo' }
};

/**
 * Get all slot IDs
 * @returns {string[]}
 */
export function getAllSlotIds(): string[] {
    return Object.keys(SLOT_CONFIG);
}

/**
 * Pick random subtype from OFFICIAL_ITEMS
 * @param {string} type - Item type (weapon, armor, etc.)
 * @param {boolean} excludeShield - Whether to exclude shields
 * @returns {string|null}
 */
export function pickRandomSubtype(type: string, excludeShield: boolean = false): string | null {
    const items = (window as any).OFFICIAL_ITEMS?.[type];
    if (!items) return null;

    const allSubtypes: string[] = [];
    for (const category in items) {
        if (Array.isArray(items[category])) {
            // Exclude Shield from armor randomization
            if (excludeShield && category === 'Shield') continue;
            allSubtypes.push(...items[category]);
        }
    }
    if (allSubtypes.length > 0) {
        return allSubtypes[Math.floor(Math.random() * allSubtypes.length)];
    }
    return null;
}

/**
 * Get slot mapping with random subtypes for variety
 * @returns {Object} - Map of slotId to {type, subtype, label}
 */
export function getSlotMapping(): Record<string, SlotMappingItem> {
    // Pick random armor type (excluding Shield - it has its own slot)
    const randomArmor = pickRandomSubtype('armor', true) || 'Leather (עור)';
    // Pick random weapon for mainhand
    const randomWeapon = pickRandomSubtype('weapon') || 'Longsword (חרב ארוכה)';
    // Pick random ranged weapon
    const rangedItems = (window as any).OFFICIAL_ITEMS?.weapon?.['Simple Ranged']?.concat(
        (window as any).OFFICIAL_ITEMS?.weapon?.['Martial Ranged'] || []
    ) || [];
    const randomRanged = rangedItems.length > 0
        ? rangedItems[Math.floor(Math.random() * rangedItems.length)]
        : 'Longbow (קשת ארוכה)';

    return {
        'helmet': { type: 'wondrous', subtype: 'Helmet', label: 'קסדה' },
        'armor': { type: 'armor', subtype: randomArmor, label: 'שריון' },
        'mainhand': { type: 'weapon', subtype: randomWeapon, label: 'נשק' },
        'offhand': { type: 'armor', subtype: 'Shield (מגן)', label: 'מגן' },
        'ranged': { type: 'weapon', subtype: randomRanged, label: 'קשת' },
        'ring1': { type: 'ring', label: 'טבעת' },
        'ring2': { type: 'ring', label: 'טבעת' },
        'necklace': { type: 'wondrous', subtype: 'Amulet', label: 'שרשרת' },
        'cape': { type: 'wondrous', subtype: 'Cloak', label: 'גלימה' },
        'boots': { type: 'wondrous', subtype: 'Boots', label: 'מגפיים' },
        'belt': { type: 'wondrous', subtype: 'Belt', label: 'חגורה' },
        'gloves': { type: 'wondrous', subtype: 'Gloves', label: 'כפפות' },
        'ammo': { type: 'wondrous', subtype: 'Quiver', label: 'תחמושת' }
    };
}

/**
 * Get target slots for a card based on its type
 * @param {Object} cardData - Card data with type/subtype
 * @returns {string[]} - Array of compatible slot IDs
 */
export function getTargetSlotsForCard(cardData: any): string[] {
    const frontType = cardData.front?.type || '';
    const rootType = cardData.type || '';

    // Combine types for check (lower case)
    const type = (rootType || frontType).toLowerCase();

    // Subtype often contains the specific "Plate", "Shield", etc.
    const subtype = (cardData.subtype || cardData.itemType || frontType || '').toLowerCase();
    const name = (cardData.name || cardData.front?.title || '').toLowerCase();

    // Weapon detection
    if (type === 'weapon' || type === 'נשק' ||
        subtype.includes('sword') || subtype.includes('axe') ||
        subtype.includes('חרב') || subtype.includes('גרזן')) {

        // Ranged weapon
        if (subtype.includes('bow') || subtype.includes('crossbow') ||
            subtype.includes('קשת') || subtype.includes('ארבלת') ||
            name.includes('bow') || name.includes('קשת')) {
            return ['ranged', 'mainhand'];
        }
        return ['mainhand', 'offhand'];
    }

    // Shield detection
    if (subtype.includes('shield') || subtype.includes('מגן') ||
        name.includes('shield') || name.includes('מגן')) {
        return ['offhand'];
    }

    // Armor detection (including Hebrew 'עור' = leather)
    if (type === 'armor' || type === 'שריון' || type === 'עור' ||
        subtype.includes('armor') || subtype.includes('plate') ||
        subtype.includes('שריון') || subtype.includes('leather') ||
        subtype.includes('עור')) {
        return ['armor'];
    }

    // Ring detection
    if (type === 'ring' || subtype.includes('ring') || subtype.includes('טבעת') ||
        name.includes('ring') || name.includes('טבעת')) {
        return ['ring1', 'ring2'];
    }

    // Wondrous items - specific body parts
    if (subtype.includes('helmet') || subtype.includes('crown') ||
        subtype.includes('קסדה') || subtype.includes('כתר') ||
        name.includes('helm') || name.includes('קסדה')) {
        return ['helmet'];
    }

    if (subtype.includes('amulet') || subtype.includes('necklace') ||
        subtype.includes('שרשרת') || subtype.includes('אמולט')) {
        return ['necklace'];
    }

    if (subtype.includes('cloak') || subtype.includes('cape') ||
        subtype.includes('גלימה') || subtype.includes('מעיל')) {
        return ['cape'];
    }

    if (subtype.includes('boots') || subtype.includes('shoes') ||
        subtype.includes('מגפיים') || subtype.includes('נעליים')) {
        return ['boots'];
    }

    if (subtype.includes('belt') || subtype.includes('חגורה')) {
        return ['belt'];
    }

    if (subtype.includes('gloves') || subtype.includes('gauntlets') ||
        subtype.includes('כפפות') || subtype.includes('כסתות')) {
        return ['gloves'];
    }

    // Default to generic wondrous slots
    return ['helmet', 'necklace', 'cape', 'belt', 'gloves', 'boots'];
}

export default {
    SLOT_CONFIG,
    getAllSlotIds,
    pickRandomSubtype,
    getSlotMapping,
    getTargetSlotsForCard
};
