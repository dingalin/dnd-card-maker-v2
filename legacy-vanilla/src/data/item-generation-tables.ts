// @ts-nocheck
/**
 * D&D 5e Structured Item Generation Tables
 * Defines weighted probability pools for each rarity tier
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Roll from a weighted table
 * @param {Array} table - Array of { value, weight, ... } objects
 * @returns {Object} The selected item
 */
export function rollFromTable(table) {
    const totalWeight = table.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;

    for (const item of table) {
        roll -= item.weight;
        if (roll <= 0) return { ...item };
    }
    return { ...table[table.length - 1] };
}

/**
 * Roll a random value within a range
 */
function rollInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// MASTER BALANCING TABLE (User's Design)
// ============================================

/**
 * Master reference table for rarity/price balance
 * Based on DMG guidelines + practical "fair market" prices
 */
export const MASTER_BALANCE_TABLE = {
    Common: {
        bonus: 0,
        spellLevelEquivalent: '0-1 (single use)',
        dmgPriceRange: { min: 50, max: 100 },
        recommendedPrice: 75,
        examples: ['Potion of Healing', 'Glowing Armor']
    },
    Uncommon: {
        bonus: 1,
        spellLevelEquivalent: '1-3',
        dmgPriceRange: { min: 101, max: 500 },
        recommendedPrice: 350,
        examples: ['+1 Weapon', 'Boots of Elvenkind', 'Wand of Magic Missiles']
    },
    Rare: {
        bonus: 2,
        spellLevelEquivalent: '4-6',
        dmgPriceRange: { min: 501, max: 5000 },
        recommendedPrice: 2500,
        examples: ['+2 Weapon', 'Ring of Protection', 'Cloak of Displacement']
    },
    'Very Rare': {
        bonus: 3,
        spellLevelEquivalent: '7-8',
        dmgPriceRange: { min: 5001, max: 50000 },
        recommendedPrice: 20000,
        examples: ['+3 Weapon', 'Tome of Understanding', 'Staff of Power']
    },
    Legendary: {
        bonus: 4, // Rare, only in Simple Mode
        spellLevelEquivalent: '9 / Reality-Changing',
        dmgPriceRange: { min: 50001, max: Infinity },
        recommendedPrice: 100000,
        examples: ['Holy Avenger', 'Staff of the Magi']
    }
};

// ============================================
// PRICE MODIFIERS
// ============================================

/**
 * Apply price modifiers based on item characteristics
 * @param {number} basePrice - The base price before modifiers
 * @param {Object} modifiers - { requiresAttunement, usageFrequency, damageType }
 * @returns {number} Modified price
 */
export function applyPriceModifiers(basePrice, modifiers = {}) {
    let price = basePrice;

    // 1. Attunement Requirement: -20% (opportunity cost of attunement slot)
    if (modifiers.requiresAttunement) {
        price = Math.floor(price * 0.8);
    }

    // 2. Usage Frequency
    switch (modifiers.usageFrequency) {
        case 'always_on':
            // Permanent effect = 1.5x value
            price = Math.floor(price * 1.5);
            break;
        case 'consumable':
            // Single-use = 50% value
            price = Math.floor(price * 0.5);
            break;
        case 'per_day':
        default:
            // 1/day or recharges at dawn = standard
            break;
    }

    // 3. Damage/Effect Type
    switch (modifiers.damageType) {
        case 'force':
        case 'radiant':
        case 'psychic':
            // Rare damage types with few resistances = +15%
            price = Math.floor(price * 1.15);
            break;
        case 'fire':
        case 'cold':
        case 'lightning':
            // Common elemental = standard
            break;
        case 'poison':
            // Many creatures resist poison = -10%
            price = Math.floor(price * 0.9);
            break;
        default:
            break;
    }

    return price;
}

/**
 * Calculate recommended price for an item
 * @param {string} rarity - Item rarity
 * @param {number} bonus - Weapon/Armor bonus (+0 to +4)
 * @param {Object} abilityDetails - { spellLevel, type }
 * @param {Object} modifiers - { requiresAttunement, usageFrequency, damageType }
 * @returns {number} Calculated fair price
 */
export function calculateRecommendedPrice(rarity, bonus, abilityDetails = {}, modifiers = {}) {
    const masterEntry = MASTER_BALANCE_TABLE[rarity];
    if (!masterEntry) return 100;

    // Start with recommended price for the rarity
    let basePrice = masterEntry.recommendedPrice;

    // Adjust for bonus vs expected
    if (bonus > masterEntry.bonus) {
        // Higher bonus than expected for rarity = more valuable
        basePrice = Math.floor(basePrice * 1.25);
    } else if (bonus < masterEntry.bonus && bonus > 0) {
        // Lower bonus but has ability = standard
    }

    // Adjust for ability power (spell level equivalent)
    if (abilityDetails.spellLevel) {
        const expectedLevel = parseInt(masterEntry.spellLevelEquivalent) || 0;
        if (abilityDetails.spellLevel > expectedLevel + 2) {
            // Much stronger ability = too powerful, should be higher rarity
            console.warn('⚠️ Ability too strong for rarity');
        } else if (abilityDetails.spellLevel < expectedLevel - 2) {
            // Weaker ability = slight discount
            basePrice = Math.floor(basePrice * 0.85);
        }
    }

    // Apply modifiers
    return applyPriceModifiers(basePrice, modifiers);
}

// ============================================
// ABILITY DEFINITIONS
// ============================================

export const ELEMENTAL_TYPES = {
    he: ['אש', 'קור', 'ברק', 'חומצה', 'רעל', 'נמק', 'זוהר', 'כוח'],
    en: ['fire', 'cold', 'lightning', 'acid', 'poison', 'necrotic', 'radiant', 'force']
};

export const DAMAGE_TYPES = {
    he: { slashing: 'חותך', piercing: 'דוקר', bludgeoning: 'מוחץ' },
    en: { slashing: 'slashing', piercing: 'piercing', bludgeoning: 'bludgeoning' }
};

export const ABILITIES_POOL = {
    none: { type: 'none', nameHe: 'ללא', nameEn: 'None' },

    elemental_1d4: {
        type: 'elemental_damage',
        dice: '1d4',
        descHe: (element) => `מוסיף ${element} 1d4 לנזק`,
        descEn: (element) => `Deals extra 1d4 ${element} damage`
    },
    elemental_1d6: {
        type: 'elemental_damage',
        dice: '1d6',
        descHe: (element) => `מוסיף ${element} 1d6 לנזק`,
        descEn: (element) => `Deals extra 1d6 ${element} damage`
    },
    elemental_2d6: {
        type: 'elemental_damage',
        dice: '2d6',
        descHe: (element) => `מוסיף ${element} 2d6 לנזק`,
        descEn: (element) => `Deals extra 2d6 ${element} damage`
    },

    resistance: {
        type: 'resistance',
        descHe: (element) => `עמידות לנזק ${element}`,
        descEn: (element) => `Resistance to ${element} damage`
    },

    immunity: {
        type: 'immunity',
        descHe: (element) => `חסינות לנזק ${element}`,
        descEn: (element) => `Immunity to ${element} damage`
    },

    spell_1: { type: 'spell', maxLevel: 1, usesPerDay: 1 },
    spell_2: { type: 'spell', maxLevel: 2, usesPerDay: 1 },
    spell_3: { type: 'spell', maxLevel: 3, usesPerDay: 1 },
    spell_4: { type: 'spell', maxLevel: 4, usesPerDay: 1 },
    spell_5: { type: 'spell', maxLevel: 5, usesPerDay: 1 },
    spell_6: { type: 'spell', maxLevel: 6, usesPerDay: 1 },

    advantage: {
        type: 'advantage',
        checks: ['perception', 'stealth', 'athletics', 'intimidation', 'persuasion'],
        checksHe: ['תפיסה', 'התגנבות', 'אתלטיקה', 'הפחדה', 'שכנוע']
    }
};

// ============================================
// MATERIAL DEFINITIONS
// ============================================

export const MATERIALS = {
    steel: { nameHe: 'פלדה', nameEn: 'Steel', bonus: 0 },
    silver: { nameHe: 'כסף', nameEn: 'Silver', bonus: 0, special: 'overcomes_lycanthrope' },
    cold_iron: { nameHe: 'ברזל קר', nameEn: 'Cold Iron', bonus: 0, special: 'overcomes_fey' },
    adamantine: { nameHe: 'אדמנטין', nameEn: 'Adamantine', bonus: 0, special: 'critical_on_objects' },
    mithral: { nameHe: 'מיתריל', nameEn: 'Mithral', bonus: 0, special: 'lighter_no_stealth_penalty' },
    dragon: { nameHe: 'קשקשי דרקון', nameEn: 'Dragon Scale', bonus: 0, special: 'thematic' },
    crystal: { nameHe: 'קריסטל', nameEn: 'Crystal', bonus: 0, special: 'thematic' },
    bone: { nameHe: 'עצם', nameEn: 'Bone', bonus: 0, special: 'thematic' },
    obsidian: { nameHe: 'אובסידיאן', nameEn: 'Obsidian', bonus: 0, special: 'thematic' }
};

// ============================================
// RARITY TABLES
// ============================================

export const ITEM_GENERATION_TABLES = {

    // ========== COMMON ==========
    Common: {
        bonus: [
            { value: 0, weight: 100, hasAbility: false, note: 'Non-magical or cosmetic only' }
        ],
        abilities: [
            { ability: 'none', weight: 70 },
            { ability: 'cosmetic', weight: 20, desc: 'Glows faintly, changes color, minor visual effect' },
            { ability: 'light', weight: 10, desc: 'Sheds light as a candle' }
        ],
        materials: [
            { material: 'steel', weight: 100 }
        ],
        priceRange: { min: 25, max: 100 }
    },

    // ========== UNCOMMON ==========
    Uncommon: {
        bonus: [
            { value: 0, weight: 15, hasAbility: true, note: 'Item with ability only (no +X)' },
            { value: 1, weight: 50, hasAbility: false, note: 'Pure +1 (most common!)' },
            { value: 1, weight: 35, hasAbility: true, note: '+1 with minor ability' }
        ],
        abilities: [
            { ability: 'none', weight: 50, note: 'Pure +X, no ability' },
            { ability: 'elemental_1d4', weight: 20, elements: ['fire', 'cold', 'lightning'] },
            { ability: 'resistance', weight: 15, elements: ['fire', 'cold', 'poison'] },
            { ability: 'spell_1', weight: 10 },
            { ability: 'advantage', weight: 5 }
        ],
        materials: [
            { material: 'steel', weight: 50 },
            { material: 'silver', weight: 25 },
            { material: 'cold_iron', weight: 15 },
            { material: 'adamantine', weight: 10 }
        ],
        priceRange: { min: 100, max: 500 },
        pureWeaponPrice: { min: 350, max: 500 }
    },

    // ========== RARE ==========
    Rare: {
        bonus: [
            { value: 1, weight: 25, hasAbility: true, note: '+1 with strong ability' },
            { value: 2, weight: 45, hasAbility: false, note: 'Pure +2 (most common)' },
            { value: 2, weight: 30, hasAbility: true, note: '+2 with ability' }
        ],
        abilities: [
            { ability: 'none', weight: 40, note: 'Pure +X' },
            { ability: 'elemental_1d6', weight: 25, elements: ['fire', 'cold', 'lightning', 'radiant'] },
            { ability: 'resistance', weight: 15, elements: ['fire', 'cold', 'lightning', 'poison', 'necrotic'] },
            { ability: 'spell_3', weight: 15 },
            { ability: 'spell_4', weight: 5 }
        ],
        materials: [
            { material: 'steel', weight: 30 },
            { material: 'mithral', weight: 30 },
            { material: 'adamantine', weight: 25 },
            { material: 'dragon', weight: 15 }
        ],
        priceRange: { min: 500, max: 5000 },
        pureWeaponPrice: { min: 2000, max: 4000 }
    },

    // ========== VERY RARE ==========
    'Very Rare': {
        bonus: [
            { value: 2, weight: 20, hasAbility: true, note: '+2 with multiple abilities' },
            { value: 3, weight: 40, hasAbility: false, note: 'Pure +3' },
            { value: 3, weight: 40, hasAbility: true, note: '+3 with ability' }
        ],
        abilities: [
            { ability: 'none', weight: 35, note: 'Pure +X' },
            { ability: 'elemental_2d6', weight: 25, elements: ['fire', 'cold', 'lightning', 'radiant', 'necrotic'] },
            { ability: 'immunity', weight: 10, elements: ['fire', 'cold', 'poison'] },
            { ability: 'spell_5', weight: 15 },
            { ability: 'spell_6', weight: 10 },
            { ability: 'multiple', weight: 5, note: '2-3 combined abilities' }
        ],
        materials: [
            { material: 'mithral', weight: 35 },
            { material: 'adamantine', weight: 30 },
            { material: 'dragon', weight: 25 },
            { material: 'crystal', weight: 10 }
        ],
        priceRange: { min: 5000, max: 50000 },
        pureWeaponPrice: { min: 15000, max: 30000 }
    },

    // ========== LEGENDARY ==========
    Legendary: {
        bonus: [
            { value: 3, weight: 35, hasAbility: true, note: '+3 with multiple strong abilities' },
            { value: 4, weight: 30, hasAbility: false, note: 'Pure +4 (Simple Mode)' },
            { value: 3, weight: 35, hasAbility: true, note: '+3 with game-changing ability' }
        ],
        abilities: [
            { ability: 'none', weight: 25, note: 'Pure +X' },
            { ability: 'sentient', weight: 15, note: 'Item has consciousness' },
            { ability: 'multiple_spells', weight: 25, note: 'Multiple high-level spells' },
            { ability: 'game_changer', weight: 25, note: 'Significant unique ability' },
            { ability: 'legendary_history', weight: 10, note: 'Item with storied past' }
        ],
        materials: [
            { material: 'adamantine', weight: 30 },
            { material: 'dragon', weight: 30 },
            { material: 'crystal', weight: 20 },
            { material: 'obsidian', weight: 10 },
            { material: 'bone', weight: 10 }
        ],
        priceRange: { min: 50000, max: 200000 },
        pureWeaponPrice: { min: 75000, max: 150000 }
    },

    // ========== ARTIFACT ==========
    Artifact: {
        bonus: [
            { value: 4, weight: 40, hasAbility: true, note: '+4 with legendary abilities' },
            { value: 5, weight: 30, hasAbility: true, note: '+5 with multiple abilities' },
            { value: 3, weight: 30, hasAbility: true, note: '+3 with world-altering powers' }
        ],
        abilities: [
            { ability: 'world_altering', weight: 40 },
            { ability: 'divine_connection', weight: 30 },
            { ability: 'reality_bending', weight: 30 }
        ],
        materials: [
            { material: 'unique', weight: 100, note: 'Unique otherworldly material' }
        ],
        priceRange: { min: 100000, max: Infinity }
    }
};

// ============================================
// MAIN GENERATOR FUNCTION
// ============================================

/**
 * Generate rolled properties for an item
 * @param {string} rarity - The item rarity
 * @param {string} itemType - 'weapon', 'armor', 'ring', etc.
 * @param {string} mode - 'simple', 'creative', 'mundane'
 * @returns {Object} Rolled properties
 */
export function generateItemProperties(rarity, itemType = 'weapon', mode = 'simple') {
    const tables = ITEM_GENERATION_TABLES[rarity];

    if (!tables) {
        console.warn(`Unknown rarity: ${rarity}, defaulting to Common`);
        return generateItemProperties('Common', itemType, mode);
    }

    // Roll bonus
    const bonusRoll = rollFromTable(tables.bonus);

    // Roll ability (only if bonusRoll says we should have one, or if bonus is 0)
    let abilityRoll = { ability: 'none' };
    if (bonusRoll.hasAbility || bonusRoll.value === 0) {
        abilityRoll = rollFromTable(tables.abilities);
    } else if (mode === 'creative') {
        // In creative mode, always roll for ability
        abilityRoll = rollFromTable(tables.abilities);
    }

    // If ability needs an element, pick one randomly
    if (abilityRoll.elements) {
        const elements = abilityRoll.elements;
        abilityRoll.selectedElement = elements[Math.floor(Math.random() * elements.length)];
    }

    // Roll material (only for weapons/armor)
    let materialRoll = { material: 'steel' };
    if (itemType === 'weapon' || itemType === 'armor') {
        materialRoll = rollFromTable(tables.materials);
    }

    // ============================================
    // CALCULATE PRICE USING MASTER TABLE + MODIFIERS
    // ============================================
    const isPureBonus = abilityRoll.ability === 'none' && bonusRoll.value > 0;

    // Determine ability details for pricing
    let abilityDetails = {};
    if (abilityRoll.ability && abilityRoll.ability !== 'none') {
        // Map ability to approximate spell level
        const abilitySpellLevelMap = {
            'elemental_1d4': 1,   // Similar to Cantrip+
            'elemental_1d6': 2,   // Similar to level 1-2 spell
            'elemental_2d6': 4,   // Similar to level 3-4 spell
            'resistance': 2,
            'immunity': 6,
            'spell_1': 1,
            'spell_2': 2,
            'spell_3': 3,
            'spell_4': 4,
            'spell_5': 5,
            'spell_6': 6,
            'advantage': 1
        };
        abilityDetails.spellLevel = abilitySpellLevelMap[abilityRoll.ability] || 0;
    }

    // Build modifiers
    const modifiers = {
        requiresAttunement: false, // Default, can be overridden
        usageFrequency: 'per_day', // Default for most abilities
        damageType: abilityRoll.selectedElement || null
    };

    // Calculate price using Master Table
    let price = calculateRecommendedPrice(rarity, bonusRoll.value, abilityDetails, modifiers);

    // Add some variance (±15%) to avoid exact same prices
    const variance = 0.15;
    const minPrice = Math.floor(price * (1 - variance));
    const maxPrice = Math.floor(price * (1 + variance));
    price = rollInRange(minPrice, maxPrice);

    // Log the calculation for debugging
    console.log(`💰 Price calculated: Base=${MASTER_BALANCE_TABLE[rarity]?.recommendedPrice}, Final=${price} (${rarity})`);

    return {
        rarity,
        bonus: bonusRoll.value,
        bonusNote: bonusRoll.note,
        hasAbility: bonusRoll.hasAbility || abilityRoll.ability !== 'none',
        ability: abilityRoll,
        material: MATERIALS[materialRoll.material] || MATERIALS.steel,
        price,
        isPureBonus,
        modifiers
    };
}

/**
 * Format rolled properties into prompt instructions
 */
export function formatPropertiesForPrompt(props, locale = 'he') {
    const isHebrew = locale === 'he';
    const lines = [];

    // Bonus instruction
    if (props.bonus > 0) {
        lines.push(isHebrew
            ? `- בונוס: +${props.bonus} להתקפה ולנזק`
            : `- Bonus: +${props.bonus} to attack and damage`
        );
    }

    // Ability instruction
    if (props.ability.ability === 'none') {
        lines.push(isHebrew
            ? `- יכולת: ללא (זהו פריט "נקי" - רק הבונוס)`
            : `- Ability: None (this is a "pure" item - bonus only)`
        );
    } else if (props.ability.ability === 'elemental_1d4' ||
        props.ability.ability === 'elemental_1d6' ||
        props.ability.ability === 'elemental_2d6') {
        const dice = props.ability.dice || '1d6';
        const element = props.ability.selectedElement;
        lines.push(isHebrew
            ? `- יכולת: נזק ${element} נוסף (${dice})`
            : `- Ability: Extra ${element} damage (${dice})`
        );
    } else if (props.ability.ability === 'resistance') {
        lines.push(isHebrew
            ? `- יכולת: עמידות לנזק ${props.ability.selectedElement}`
            : `- Ability: Resistance to ${props.ability.selectedElement} damage`
        );
    }

    // Material instruction
    if (props.material) {
        lines.push(isHebrew
            ? `- חומר: ${props.material.nameHe}`
            : `- Material: ${props.material.nameEn}`
        );
    }

    // Price instruction
    lines.push(isHebrew
        ? `- מחיר: ${props.price} זהב`
        : `- Price: ${props.price} GP`
    );

    return lines.join('\n');
}
