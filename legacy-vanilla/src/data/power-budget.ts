// @ts-nocheck
/**
 * Power Budget System for D&D 5e Item Creation
 *
 * This module implements a point-buy system where:
 * - Each rarity has a power budget (points to spend)
 * - Each ability has a cost
 * - Users "buy" abilities until budget is spent
 * - Final rarity is determined by total points used
 */

interface AbilityCost {
    cost: number;
    nameHe: string;
    nameEn: string;
    category: string;
    exclusive?: boolean;
    requiresElement?: boolean;
    saveDC?: number;
    saveType?: string;
    rare?: boolean;
    legendary?: boolean;
    spellLevel?: number;
    description?: string;
    premium?: boolean;
    icon?: string;
    id?: string;
}

interface RarityBudget {
    min: number;
    max: number;
    gold: [number, number];
    color: string;
    icon: string;
}

interface Modifiers {
    attunement?: boolean;
    cursed?: boolean;
    consumable?: boolean;
}

// ============================================
// RARITY BUDGETS
// ============================================

/**
 * Power budget and gold price range for each rarity tier
 */
export const RARITY_BUDGETS: Record<string, RarityBudget> = {
    Common: {
        min: 0,
        max: 1,
        gold: [50, 100],
        color: '#9ca3af',    // Gray
        icon: '⚪'
    },
    Uncommon: {
        min: 2,
        max: 4,
        gold: [200, 500],
        color: '#22c55e',    // Green
        icon: '🟢'
    },
    Rare: {
        min: 5,
        max: 8,
        gold: [2000, 5000],
        color: '#3b82f6',    // Blue
        icon: '🔵'
    },
    'Very Rare': {
        min: 9,
        max: 13,
        gold: [20000, 50000],
        color: '#a855f7',    // Purple
        icon: '🟣'
    },
    Legendary: {
        min: 14,
        max: 20,
        gold: [100000, 200000],
        color: '#f97316',    // Orange
        icon: '🟠'
    }
};

// ============================================
// ABILITY COSTS
// ============================================

/**
 * Point costs for all available abilities
 * Organized by category for UI grouping
 */
export const ABILITY_COSTS: Record<string, Record<string, AbilityCost>> = {
    // ========== ATTACK/DAMAGE BONUSES ==========
    bonuses: {
        bonus_1: {
            cost: 3,
            nameHe: '+1 להתקפה ונזק',
            nameEn: '+1 to attack and damage',
            category: 'bonus',
            exclusive: true  // Can only pick one bonus tier
        },
        bonus_2: {
            cost: 6,
            nameHe: '+2 להתקפה ונזק',
            nameEn: '+2 to attack and damage',
            category: 'bonus',
            exclusive: true
        },
        bonus_3: {
            cost: 10,
            nameHe: '+3 להתקפה ונזק',
            nameEn: '+3 to attack and damage',
            category: 'bonus',
            exclusive: true
        },
        magical: {
            cost: 1,
            nameHe: 'נשק קסום (ללא בונוס)',
            nameEn: 'Magical weapon (no bonus)',
            category: 'bonus',
            exclusive: true
        }
    },

    // ========== EXTRA DAMAGE ==========
    extraDamage: {
        damage_1d4: {
            cost: 2,
            nameHe: '+1d4 נזק',
            nameEn: '+1d4 extra damage',
            category: 'damage',
            requiresElement: true,
            exclusive: true
        },
        damage_1d6: {
            cost: 3,
            nameHe: '+1d6 נזק',
            nameEn: '+1d6 extra damage',
            category: 'damage',
            requiresElement: true,
            exclusive: true
        },
        damage_1d8: {
            cost: 4,
            nameHe: '+1d8 נזק',
            nameEn: '+1d8 extra damage',
            category: 'damage',
            requiresElement: true,
            exclusive: true
        }
    },

    // ========== DAMAGE ELEMENTS ==========
    elements: {
        fire: { cost: 0, nameHe: 'אש', nameEn: 'Fire', icon: '🔥', category: 'element' },
        cold: { cost: 0, nameHe: 'קור', nameEn: 'Cold', icon: '❄️', category: 'element' },
        lightning: { cost: 0, nameHe: 'ברק', nameEn: 'Lightning', icon: '⚡', category: 'element' },
        acid: { cost: 0, nameHe: 'חומצה', nameEn: 'Acid', icon: '🧪', category: 'element' },
        poison: { cost: 0, nameHe: 'רעל', nameEn: 'Poison', icon: '☠️', category: 'element' },
        necrotic: { cost: 0, nameHe: 'נמק', nameEn: 'Necrotic', icon: '💀', category: 'element' },
        thunder: { cost: 0, nameHe: 'רעם', nameEn: 'Thunder', icon: '💥', category: 'element' },
        // Premium elements (add +1 to cost)
        radiant: { cost: 1, nameHe: 'זוהר', nameEn: 'Radiant', icon: '☀️', premium: true, category: 'element' },
        force: { cost: 1, nameHe: 'כוח', nameEn: 'Force', icon: '💫', premium: true, category: 'element' },
        psychic: { cost: 1, nameHe: 'נפשי', nameEn: 'Psychic', icon: '🧠', premium: true, category: 'element' }
    },

    // ========== ON-HIT EFFECTS ==========
    onHitEffects: {
        push_5ft: {
            cost: 1,
            nameHe: 'דחיפה 5 רגל',
            nameEn: 'Push 5 feet on hit',
            category: 'effect'
        },
        push_10ft: {
            cost: 2,
            nameHe: 'דחיפה 10 רגל',
            nameEn: 'Push 10 feet on hit',
            category: 'effect'
        },
        slow: {
            cost: 2,
            nameHe: 'האטת מהירות -10',
            nameEn: 'Reduce speed by 10',
            category: 'effect'
        },
        prone: {
            cost: 4,
            nameHe: 'הפלה (הצלת כוח DC 13)',
            nameEn: 'Knock prone (STR DC 13)',
            category: 'effect',
            saveDC: 13,
            saveType: 'STR'
        },
        bleed: {
            cost: 3,
            nameHe: 'דימום (1d4/סיבוב)',
            nameEn: 'Bleed (1d4/turn)',
            category: 'effect'
        },
        frightened: {
            cost: 4,
            nameHe: 'הפחדה (הצלת חוכמה DC 13)',
            nameEn: 'Frightened (WIS DC 13)',
            category: 'effect',
            saveDC: 13,
            saveType: 'WIS'
        },
        stunned: {
            cost: 6,
            nameHe: 'הלם (הצלת חוסן DC 15)',
            nameEn: 'Stunned (CON DC 15)',
            category: 'effect',
            saveDC: 15,
            saveType: 'CON',
            rare: true
        }
    },

    // ========== SPECIAL FEATURES ==========
    specialFeatures: {
        returning: {
            cost: 1,
            nameHe: 'חוזר ליד',
            nameEn: 'Returning',
            category: 'special',
            icon: '🔄'
        },
        light: {
            cost: 1,
            nameHe: 'מאיר (20/40 רגל)',
            nameEn: 'Sheds light (20/40 ft)',
            category: 'special',
            icon: '💡'
        },
        thrown: {
            cost: 1,
            nameHe: 'ניתן לזריקה (20/60)',
            nameEn: 'Thrown (20/60)',
            category: 'special',
            icon: '🎯'
        },
        reach: {
            cost: 2,
            nameHe: 'טווח +5 רגל',
            nameEn: 'Reach +5 feet',
            category: 'special',
            icon: '📏'
        },
        keen: {
            cost: 4,
            nameHe: 'דיוק (קריטי ב-19-20)',
            nameEn: 'Keen (Critical on 19-20)',
            category: 'special',
            icon: '🎯'
        },
        vicious: {
            cost: 3,
            nameHe: 'אכזרי (+7 נזק בקריטי)',
            nameEn: 'Vicious (+7 damage on nat 20)',
            category: 'special',
            icon: '💢'
        },
        vorpal: {
            cost: 12,
            nameHe: 'עריפה (עריפת ראש ב-20)',
            nameEn: 'Vorpal (decapitate on nat 20)',
            category: 'special',
            icon: '⚔️',
            legendary: true
        },
        warning: {
            cost: 3,
            nameHe: 'אזהרה (יתרון ליוזמה, לא ניתן להפתיע)',
            nameEn: 'Warning (adv. initiative, can\'t be surprised)',
            category: 'special',
            icon: '⚠️'
        }
    },

    // ========== SITUATIONAL ADVANTAGES ==========
    advantages: {
        adv_initiative: {
            cost: 2,
            nameHe: 'יתרון ביוזמה',
            nameEn: 'Advantage on Initiative',
            category: 'advantage'
        },
        adv_perception: {
            cost: 2,
            nameHe: 'יתרון בתפיסה',
            nameEn: 'Advantage on Perception',
            category: 'advantage'
        },
        adv_stealth: {
            cost: 2,
            nameHe: 'יתרון בהתגנבות',
            nameEn: 'Advantage on Stealth',
            category: 'advantage'
        },
        adv_intimidation: {
            cost: 2,
            nameHe: 'יתרון בהפחדה',
            nameEn: 'Advantage on Intimidation',
            category: 'advantage'
        }
    },

    // ========== SPELLS/ABILITIES ==========
    spells: {
        // Generic spell slots by level
        spell_1: {
            cost: 2,
            nameHe: 'לחש רמה 1 (פעם/יום)',
            nameEn: 'Level 1 spell (1/day)',
            category: 'spell',
            spellLevel: 1
        },
        spell_2: {
            cost: 3,
            nameHe: 'לחש רמה 2 (פעם/יום)',
            nameEn: 'Level 2 spell (1/day)',
            category: 'spell',
            spellLevel: 2
        },
        spell_3: {
            cost: 4,
            nameHe: 'לחש רמה 3 (פעם/יום)',
            nameEn: 'Level 3 spell (1/day)',
            category: 'spell',
            spellLevel: 3
        },
        spell_4: {
            cost: 5,
            nameHe: 'לחש רמה 4 (פעם/יום)',
            nameEn: 'Level 4 spell (1/day)',
            category: 'spell',
            spellLevel: 4
        },
        // Specific Level 1 spells (Uncommon)
        bless: {
            cost: 2,
            nameHe: 'ברכה (Bless)',
            nameEn: 'Bless (1/day)',
            category: 'spell',
            spellLevel: 1,
            description: '+1d4 להתקפות והצלות'
        },
        command: {
            cost: 2,
            nameHe: 'פקודה (Command)',
            nameEn: 'Command (1/day)',
            category: 'spell',
            spellLevel: 1
        },
        cure_wounds: {
            cost: 2,
            nameHe: 'ריפוי פצעים (Cure Wounds)',
            nameEn: 'Cure Wounds (1/day)',
            category: 'spell',
            spellLevel: 1,
            description: 'ריפוי 1d8 + מתאם'
        },
        faerie_fire: {
            cost: 2,
            nameHe: 'אש פיות (Faerie Fire)',
            nameEn: 'Faerie Fire (1/day)',
            category: 'spell',
            spellLevel: 1,
            description: 'יתרון להתקפות נגד אויבים מסומנים'
        },
        shield: {
            cost: 2,
            nameHe: 'מגן (Shield)',
            nameEn: 'Shield (1/day)',
            category: 'spell',
            spellLevel: 1,
            description: '+5 לדרג"ש כתגובה'
        },
        // Specific Level 2 spells (Rare)
        invisibility: {
            cost: 3,
            nameHe: 'היעלמות (Invisibility)',
            nameEn: 'Invisibility (1/day)',
            category: 'spell',
            spellLevel: 2
        },
        misty_step: {
            cost: 3,
            nameHe: 'צעד ערפילי (Misty Step)',
            nameEn: 'Misty Step (1/day)',
            category: 'spell',
            spellLevel: 2,
            description: 'השתגרות 30 פיט'
        },
        hold_person: {
            cost: 3,
            nameHe: 'שיתוק אדם (Hold Person)',
            nameEn: 'Hold Person (1/day)',
            category: 'spell',
            spellLevel: 2
        },
        scorching_ray: {
            cost: 3,
            nameHe: 'קרני שריפה (Scorching Ray)',
            nameEn: 'Scorching Ray (1/day)',
            category: 'spell',
            spellLevel: 2,
            description: '3 קרני אש'
        },
        // Specific Level 3 spells (Rare/Very Rare)
        fireball: {
            cost: 4,
            nameHe: 'כדור אש (Fireball)',
            nameEn: 'Fireball (1/day)',
            category: 'spell',
            spellLevel: 3,
            description: '8d6 נזק אש באזור'
        },
        fly: {
            cost: 4,
            nameHe: 'תעופה (Fly)',
            nameEn: 'Fly (1/day)',
            category: 'spell',
            spellLevel: 3
        },
        haste: {
            cost: 5,
            nameHe: 'האצה (Haste)',
            nameEn: 'Haste (1/day)',
            category: 'spell',
            spellLevel: 3,
            description: 'פעולה נוספת, +2 דרג"ש, מהירות כפולה'
        },
        lightning_bolt: {
            cost: 4,
            nameHe: 'ברק (Lightning Bolt)',
            nameEn: 'Lightning Bolt (1/day)',
            category: 'spell',
            spellLevel: 3,
            description: '8d6 נזק ברק בקו'
        },
        vampiric_touch: {
            cost: 4,
            nameHe: 'מגע ערפדי (Vampiric Touch)',
            nameEn: 'Vampiric Touch (1/day)',
            category: 'spell',
            spellLevel: 3,
            description: 'נזק וריפוי חצי'
        }
    },

    // ========== RESISTANCES (for armor) ==========
    resistances: {
        resist_fire: {
            cost: 2,
            nameHe: 'עמידות לאש',
            nameEn: 'Fire Resistance',
            category: 'resistance'
        },
        resist_cold: {
            cost: 2,
            nameHe: 'עמידות לקור',
            nameEn: 'Cold Resistance',
            category: 'resistance'
        },
        resist_lightning: {
            cost: 2,
            nameHe: 'עמידות לברק',
            nameEn: 'Lightning Resistance',
            category: 'resistance'
        },
        resist_acid: {
            cost: 2,
            nameHe: 'עמידות לחומצה',
            nameEn: 'Acid Resistance',
            category: 'resistance'
        },
        resist_poison: {
            cost: 2,
            nameHe: 'עמידות לרעל',
            nameEn: 'Poison Resistance',
            category: 'resistance'
        },
        resist_necrotic: {
            cost: 3,
            nameHe: 'עמידות לנמק',
            nameEn: 'Necrotic Resistance',
            category: 'resistance'
        },
        resist_radiant: {
            cost: 3,
            nameHe: 'עמידות לזוהר',
            nameEn: 'Radiant Resistance',
            category: 'resistance'
        },
        resist_thunder: {
            cost: 2,
            nameHe: 'עמידות לרעם',
            nameEn: 'Thunder Resistance',
            category: 'resistance'
        },
        resist_force: {
            cost: 3,
            nameHe: 'עמידות לכוח',
            nameEn: 'Force Resistance',
            category: 'resistance'
        },
        resist_psychic: {
            cost: 3,
            nameHe: 'עמידות לנפשי',
            nameEn: 'Psychic Resistance',
            category: 'resistance'
        }
    },

    // ========== SPECIAL MATERIALS ==========
    materials: {
        adamantine: {
            cost: 2,
            nameHe: 'אדמנטיט',
            nameEn: 'Adamantine',
            category: 'material',
            icon: '⬛',
            description: 'קריטי אוטומטי נגד חפצים, בלתי שביר'
        },
        silvered: {
            cost: 1,
            nameHe: 'מצופה כסף',
            nameEn: 'Silvered',
            category: 'material',
            icon: '🥈',
            description: 'עוקף עמידות של אנשי-זאב ושדים'
        },
        mithral: {
            cost: 2,
            nameHe: 'מית\'ריל',
            nameEn: 'Mithral',
            category: 'material',
            icon: '🔘',
            description: 'קל יותר - מסיר את תכונת ה-Heavy'
        },
        obsidian: {
            cost: 1,
            nameHe: 'זכוכית געשית',
            nameEn: 'Obsidian',
            category: 'material',
            icon: '🖤',
            description: 'חד מאוד אך שביר'
        },
        ironwood: {
            cost: 1,
            nameHe: 'עץ הברזל',
            nameEn: 'Ironwood',
            category: 'material',
            icon: '🪵',
            description: 'לדרואידים - לא מתכת'
        },
        crystal: {
            cost: 2,
            nameHe: 'קריסטל',
            nameEn: 'Crystal',
            category: 'material',
            icon: '💎',
            description: 'מוליך אנרגיה פסיונית'
        }
    }
};

// ============================================
// MODIFIERS (affect budget, not abilities)
// ============================================

export const BUDGET_MODIFIERS: Record<string, any> = {
    attunement: {
        budgetBonus: 2,
        nameHe: 'דורש התכווננות',
        nameEn: 'Requires Attunement',
        description: 'מוסיף 2 נקודות לתקציב'
    },
    cursed: {
        budgetBonus: 1,
        nameHe: 'מקולל',
        nameEn: 'Cursed',
        description: 'מוסיף 1 נקודה לתקציב'
    },
    consumable: {
        costMultiplier: 0.5,
        nameHe: 'חד פעמי',
        nameEn: 'Consumable',
        description: 'כל היכולות עולות חצי'
    }
};

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate total cost of selected abilities
 * @param {Array<string>} selectedAbilities - Array of ability IDs (e.g., ['bonus_1', 'damage_1d6', 'fire'])
 * @param {Object} modifiers - {consumable: boolean}
 * @returns {number} Total power points cost
 */
export function calculateTotalCost(selectedAbilities: string[], modifiers: Modifiers = {}): number {
    let total = 0;

    // Flatten all ability categories into lookup map
    const allAbilities = getAllAbilitiesFlat();

    for (const abilityId of selectedAbilities) {
        const ability = allAbilities[abilityId];
        if (ability) {
            total += ability.cost;
        } else {
            console.warn(`Unknown ability: ${abilityId}`);
        }
    }

    // Apply consumable modifier
    if (modifiers.consumable) {
        total = Math.ceil(total * BUDGET_MODIFIERS.consumable.costMultiplier);
    }

    return total;
}

/**
 * Get effective budget for a rarity, including modifiers
 * @param {string} rarity - Rarity name
 * @param {Object} modifiers - {attunement: boolean, cursed: boolean}
 * @returns {number} Maximum budget points
 */
export function getEffectiveBudget(rarity: string, modifiers: Modifiers = {}): number {
    const base = RARITY_BUDGETS[rarity];
    if (!base) {
        console.warn(`Unknown rarity: ${rarity}`);
        return 0;
    }

    let budget = base.max;

    if (modifiers.attunement) {
        budget += BUDGET_MODIFIERS.attunement.budgetBonus;
    }
    if (modifiers.cursed) {
        budget += BUDGET_MODIFIERS.cursed.budgetBonus;
    }

    return budget;
}

/**
 * Validate if selected abilities fit within budget
 * @param {Array<string>} selectedAbilities
 * @param {string} rarity
 * @param {Object} modifiers
 * @returns {{valid: boolean, totalCost: number, budget: number, remaining: number}}
 */
export function validateBudget(selectedAbilities: string[], rarity: string, modifiers: Modifiers = {}) {
    const totalCost = calculateTotalCost(selectedAbilities, modifiers);
    const budget = getEffectiveBudget(rarity, modifiers);
    const remaining = budget - totalCost;

    return {
        valid: remaining >= 0,
        totalCost,
        budget,
        remaining,
        percentUsed: Math.round((totalCost / budget) * 100)
    };
}

/**
 * Determine rarity based on total points spent
 * (Used for "reverse calculation" - user picks abilities, system determines rarity)
 * @param {number} totalPoints
 * @returns {string} Rarity name
 */
export function determineRarity(totalPoints: number): string {
    // Check from highest to lowest
    const rarities = ['Legendary', 'Very Rare', 'Rare', 'Uncommon', 'Common'];

    for (const rarity of rarities) {
        const budget = RARITY_BUDGETS[rarity];
        if (totalPoints >= budget.min) {
            return rarity;
        }
    }

    return 'Common';
}

/**
 * Calculate gold price based on total points and rarity
 * @param {number} totalPoints
 * @param {string} rarity
 * @param {Object} modifiers
 * @returns {number} Recommended gold price
 */
export function calculateGoldPrice(totalPoints: number, rarity: string, modifiers: Modifiers = {}): number {
    const budget = RARITY_BUDGETS[rarity];
    if (!budget) return 100;

    const [minGold, maxGold] = budget.gold;
    const range = maxGold - minGold;

    // Calculate position within rarity based on points
    const rarityRange = budget.max - budget.min;
    const pointsIntoRarity = totalPoints - budget.min;
    const position = rarityRange > 0 ? pointsIntoRarity / rarityRange : 0.5;

    // Base price interpolated within range
    let price = minGold + (range * position);

    // Apply attunement discount (-20%)
    if (modifiers.attunement) {
        price *= 0.8;
    }

    // Add jitter (±10%) for variety
    const jitter = 0.9 + (Math.random() * 0.2);
    price *= jitter;

    // Round to nice numbers
    if (price < 100) {
        return Math.round(price / 5) * 5;
    } else if (price < 1000) {
        return Math.round(price / 25) * 25;
    } else if (price < 10000) {
        return Math.round(price / 100) * 100;
    } else {
        return Math.round(price / 500) * 500;
    }
}

/**
 * Get ability that conflicts with selection (for exclusive groups)
 * @param {string} abilityId
 * @param {Array<string>} selectedAbilities
 * @returns {string|null} Conflicting ability ID or null
 */
export function getConflictingAbility(abilityId: string, selectedAbilities: string[]): string | null {
    const allAbilities = getAllAbilitiesFlat();
    const ability = allAbilities[abilityId];

    if (!ability || !ability.exclusive) return null;

    // Find other abilities in same category
    for (const selectedId of selectedAbilities) {
        const selected = allAbilities[selectedId];
        if (selected &&
            selected.category === ability.category &&
            selected.exclusive &&
            selectedId !== abilityId) {
            return selectedId;
        }
    }

    return null;
}

/**
 * Get all abilities that the user can still afford
 * @param {Array<string>} selectedAbilities
 * @param {string} rarity
 * @param {Object} modifiers
 * @returns {Array<string>} Array of affordable ability IDs
 */
export function getAffordableAbilities(selectedAbilities: string[], rarity: string, modifiers: Modifiers = {}): string[] {
    const { remaining } = validateBudget(selectedAbilities, rarity, modifiers);
    const allAbilities = getAllAbilitiesFlat();
    const affordable = [];

    for (const [id, ability] of Object.entries(allAbilities)) {
        // Skip already selected
        if (selectedAbilities.includes(id)) continue;

        // Check if affordable
        if (ability.cost <= remaining) {
            affordable.push(id);
        }
    }

    return affordable;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Flatten all ability categories into a single lookup object
 * @returns {Object.<string, Object>}
 */
export function getAllAbilitiesFlat(): Record<string, AbilityCost> {
    const flat: Record<string, AbilityCost> = {};

    for (const category of Object.values(ABILITY_COSTS)) {
        for (const [id, ability] of Object.entries(category)) {
            flat[id] = { ...ability, id };
        }
    }

    return flat;
}

/**
 * Get abilities grouped by category for UI rendering
 * @returns {Object}
 */
export function getAbilitiesByCategory() {
    return ABILITY_COSTS;
}

/**
 * Format selected abilities into a human-readable summary
 * @param {Array<string>} selectedAbilities
 * @param {string} locale
 * @returns {string}
 */
export function formatAbilitiesSummary(selectedAbilities: string[], locale = 'he'): string {
    const allAbilities = getAllAbilitiesFlat();
    const isHebrew = locale === 'he';
    const lines = [];

    for (const id of selectedAbilities) {
        const ability = allAbilities[id];
        if (ability) {
            const name = isHebrew ? ability.nameHe : ability.nameEn;
            lines.push(`• ${name}`);
        }
    }

    return lines.join('\n');
}

/**
 * Build item properties object from selected abilities
 * (For passing to AI generation)
 * @param {Array<string>} selectedAbilities
 * @param {string} rarity
 * @param {Object} modifiers
 * @returns {Object}
 */
export function buildItemProperties(selectedAbilities: string[], rarity: string, modifiers: Modifiers = {}) {
    const allAbilities = getAllAbilitiesFlat();
    const props = {
        name: '', // To be generated
        rarity: rarity,
        description: '', // Generated based on abilities
        bonuses: [] as string[],
        damageDice: [] as string[],
        damageType: [] as string[],
        effects: [] as string[],
        spells: [] as string[],
        features: [] as string[],
        requiresAttunement: modifiers.attunement,
        isCursed: modifiers.cursed
    };

    for (const id of selectedAbilities) {
        const ability = allAbilities[id];
        if (!ability) continue;

        // Process based on category
        switch (ability.category) {
            case 'bonus':
                props.bonuses.push(ability.nameEn);
                break;
            case 'damage':
                props.damageDice.push(ability.nameEn.split(' ')[0]); // Extract "+1d6"
                break;
            case 'element':
                props.damageType.push(ability.nameEn);
                break;
            case 'effect':
                props.effects.push(ability.nameEn);
                break;
            case 'spell':
                props.spells.push(ability.nameEn);
                break;
            case 'special':
            case 'material':
            case 'advantage':
            case 'resistance':
                props.features.push(ability.nameEn);
                break;
        }
    }

    return props;
}

/**
 * Generate random abilities within a given budget for a rarity
 * Used by "auto" mode in PowerBudgetController
 * @param {string} rarity - Target rarity
 * @param {string} itemType - 'weapon', 'armor', 'wondrous', etc.
 * @param {Object} modifiers - {attunement, cursed, consumable}
 * @returns {Array<string>} Array of ability IDs
 */
export function generateRandomAbilities(rarity: string, itemType: string, modifiers: Modifiers = {}): string[] {
    const budget = getEffectiveBudget(rarity, modifiers);
    const allAbilities = getAllAbilitiesFlat();
    const selected: string[] = [];
    let remaining = budget;

    // Get abilities appropriate for item type
    const appropriateCategories: Record<string, string[]> = {
        weapon: ['bonuses', 'extraDamage', 'elements', 'onHitEffects', 'specialFeatures', 'materials'],
        armor: ['resistances', 'advantages', 'spells', 'materials'],
        wondrous: ['advantages', 'spells', 'specialFeatures'],
        ring: ['resistances', 'spells', 'advantages'],
        potion: ['spells'],
        scroll: ['spells'],
        staff: ['spells', 'specialFeatures'],
        wand: ['spells']
    };

    const categories = appropriateCategories[itemType] || ['bonuses', 'specialFeatures', 'spells'];

    // Build pool of valid abilities
    const pool: { id: string; cost: number }[] = [];
    for (const catName of categories) {
        const category = ABILITY_COSTS[catName];
        if (category) {
            for (const [id, ability] of Object.entries(category)) {
                pool.push({ id, cost: ability.cost });
            }
        }
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Pick abilities until budget is exhausted
    for (const { id, cost } of pool) {
        if (cost <= remaining) {
            // Check for exclusive conflicts
            const conflict = getConflictingAbility(id, selected);
            if (!conflict) {
                selected.push(id);
                remaining -= cost;
            }
        }
        if (remaining <= 0) break;
    }

    return selected;
}

// ============================================
// ELEMENT-RESISTANCE MAPPING
// ============================================

/**
 * Maps element IDs to their corresponding resistance IDs
 * Used for auto-converting element selection to resistance for non-weapons
 */
export const ELEMENT_TO_RESISTANCE: Record<string, string> = {
    fire: 'resist_fire',
    cold: 'resist_cold',
    lightning: 'resist_lightning',
    acid: 'resist_acid',
    poison: 'resist_poison',
    necrotic: 'resist_necrotic',
    radiant: 'resist_radiant',
    thunder: 'resist_thunder',
    force: 'resist_force',
    psychic: 'resist_psychic'
};

/**
 * Reverse mapping: resistance ID to element ID
 */
export const RESISTANCE_TO_ELEMENT: Record<string, string> = Object.fromEntries(
    Object.entries(ELEMENT_TO_RESISTANCE).map(([element, resistance]) => [resistance, element])
);

// ============================================
// ITEM TYPE UTILITIES
// ============================================

/**
 * Item types that use elemental damage (extra dice)
 */
export const WEAPON_TYPES = ['weapon', 'staff'] as const;

/**
 * Item types that get resistance instead of damage
 */
export const RESISTANCE_TYPES = ['armor', 'wondrous', 'ring', 'staff', 'wand'] as const;

/**
 * Consumable item types (potions, scrolls)
 */
export const CONSUMABLE_TYPES = ['potion', 'scroll'] as const;

/**
 * Check if item type should use extra damage dice when element is selected
 */
export function isWeaponType(itemType: string): boolean {
    return WEAPON_TYPES.includes(itemType as any);
}

/**
 * Check if item type should get resistance when element is selected
 */
export function isResistanceType(itemType: string): boolean {
    return RESISTANCE_TYPES.includes(itemType as any);
}

/**
 * Get the corresponding resistance ID for an element
 */
export function getResistanceForElement(elementId: string): string | null {
    return ELEMENT_TO_RESISTANCE[elementId] || null;
}

/**
 * Get the corresponding element ID for a resistance
 */
export function getElementForResistance(resistanceId: string): string | null {
    return RESISTANCE_TO_ELEMENT[resistanceId] || null;
}

/**
 * Convert element selection to resistance for non-weapon items
 * Returns updated abilities array with element replaced by resistance
 */
export function convertElementToResistance(selectedAbilities: string[]): string[] {
    return selectedAbilities.map(id => {
        if (ABILITY_COSTS.elements[id]) {
            return ELEMENT_TO_RESISTANCE[id] || id;
        }
        return id;
    });
}

/**
 * Convert resistance selection to element for weapon items
 * Returns updated abilities array with resistance replaced by element
 */
export function convertResistanceToElement(selectedAbilities: string[]): string[] {
    return selectedAbilities.map(id => {
        if (ABILITY_COSTS.resistances[id]) {
            return RESISTANCE_TO_ELEMENT[id] || id;
        }
        return id;
    });
}

/**
 * Get the currently selected element from abilities list
 */
export function getSelectedElement(selectedAbilities: string[]): string | null {
    for (const id of selectedAbilities) {
        if (ABILITY_COSTS.elements[id]) {
            return id;
        }
    }
    return null;
}

/**
 * Get the currently selected resistance from abilities list
 */
export function getSelectedResistance(selectedAbilities: string[]): string | null {
    for (const id of selectedAbilities) {
        if (ABILITY_COSTS.resistances[id]) {
            return id;
        }
    }
    return null;
}

/**
 * Get the currently selected damage dice from abilities list
 */
export function getSelectedDamageDice(selectedAbilities: string[]): string | null {
    for (const id of selectedAbilities) {
        if (ABILITY_COSTS.extraDamage[id]) {
            return id;
        }
    }
    return null;
}

/**
 * Check if item type can have extra damage dice
 */
export function canHaveExtraDamage(itemType: string): boolean {
    return isWeaponType(itemType);
}

/**
 * Check if item type can have elemental resistance
 */
export function canHaveResistance(itemType: string): boolean {
    return isResistanceType(itemType);
}

// ============================================
// TOOLTIP GENERATION
// ============================================

/**
 * Generate detailed tooltip text for an ability
 * Shows exact D&D rules effect based on item type context
 */
export function getAbilityTooltip(abilityId: string, itemType: string = 'weapon', locale: string = 'he'): string {
    const allAbilities = getAllAbilitiesFlat();
    const ability = allAbilities[abilityId];

    if (!ability) return abilityId;

    const isHe = locale === 'he';
    const name = isHe ? ability.nameHe : ability.nameEn;
    const cost = ability.cost || 0;

    // Base info
    let tooltip = `${name}\n`;
    tooltip += isHe ? `עלות: ${cost} נק'` : `Cost: ${cost} pts`;

    // Add category-specific details
    switch (ability.category) {
        case 'bonus':
            tooltip += isHe
                ? `\n• מוסיף ${name} לגלגולי התקפה ונזק`
                : `\n• Adds ${name} to attack and damage rolls`;
            break;

        case 'damage':
            if (isWeaponType(itemType)) {
                tooltip += isHe
                    ? `\n• מוסיף ${abilityId.replace('damage_', '')} נזק יסודי בפגיעה`
                    : `\n• Adds ${abilityId.replace('damage_', '')} elemental damage on hit`;
                tooltip += isHe
                    ? `\n• דורש בחירת יסוד (אש, קור וכו')`
                    : `\n• Requires element selection (fire, cold, etc.)`;
            }
            break;

        case 'element':
            if (isWeaponType(itemType)) {
                tooltip += isHe
                    ? `\n• הנזק הנוסף יהיה מסוג ${name}`
                    : `\n• Extra damage will be ${name} type`;
            } else if (isResistanceType(itemType)) {
                tooltip += isHe
                    ? `\n• עמידות לנזק ${name}\n• חצי נזק מהסוג הזה`
                    : `\n• Resistance to ${name} damage\n• Take half damage from this type`;
            }
            break;

        case 'resistance':
            tooltip += isHe
                ? `\n• עמידות לנזק מסוג זה\n• מקבל חצי נזק בלבד`
                : `\n• Resistance to this damage type\n• Take only half damage`;
            break;

        case 'effect':
            if (ability.saveDC && ability.saveType) {
                tooltip += isHe
                    ? `\n• יעד חייב להצליח הצלת ${ability.saveType} DC ${ability.saveDC}`
                    : `\n• Target must succeed on DC ${ability.saveDC} ${ability.saveType} save`;
            }
            tooltip += isHe
                ? `\n• אפקט מופעל בפגיעה`
                : `\n• Effect triggers on hit`;
            break;

        case 'special':
            if (ability.description) {
                tooltip += `\n• ${ability.description}`;
            }
            break;

        case 'spell':
            if (ability.spellLevel) {
                tooltip += isHe
                    ? `\n• לחש רמה ${ability.spellLevel}`
                    : `\n• Level ${ability.spellLevel} spell`;
            }
            tooltip += isHe
                ? `\n• שימוש: פעם ביום`
                : `\n• Usage: Once per day`;
            if (ability.description) {
                tooltip += `\n• ${ability.description}`;
            }
            break;

        case 'material':
            if (ability.description) {
                tooltip += `\n• ${ability.description}`;
            }
            break;
    }

    // Add rarity indicator
    if (ability.legendary) {
        tooltip += isHe ? `\n⚠️ אגדי בלבד` : `\n⚠️ Legendary only`;
    } else if (ability.rare) {
        tooltip += isHe ? `\n⚠️ נדיר ומעלה` : `\n⚠️ Rare or higher`;
    }

    return tooltip;
}

/**
 * Format abilities for card description
 * Creates a readable list of abilities for the item card
 */
export function formatAbilitiesForCard(selectedAbilities: string[], itemType: string, locale: string = 'he'): string[] {
    const allAbilities = getAllAbilitiesFlat();
    const isHe = locale === 'he';
    const lines: string[] = [];

    // Get element and damage dice for combined display
    const selectedElement = getSelectedElement(selectedAbilities);
    const selectedDice = getSelectedDamageDice(selectedAbilities);

    for (const id of selectedAbilities) {
        const ability = allAbilities[id];
        if (!ability) continue;

        const name = isHe ? ability.nameHe : ability.nameEn;

        switch (ability.category) {
            case 'bonus':
                lines.push(name);
                break;

            case 'damage':
                // Skip - will be combined with element
                break;

            case 'element':
                if (isWeaponType(itemType) && selectedDice) {
                    // Combine with damage dice
                    const dice = selectedDice.replace('damage_', '');
                    lines.push(isHe
                        ? `+${dice} נזק ${name}`
                        : `+${dice} ${name} damage`);
                } else if (isResistanceType(itemType)) {
                    // Show as resistance
                    lines.push(isHe
                        ? `עמידות ל${name}`
                        : `${name} Resistance`);
                }
                break;

            case 'resistance':
                lines.push(name);
                break;

            case 'effect':
                if (ability.saveDC && ability.saveType) {
                    lines.push(isHe
                        ? `${name} (${ability.saveType} DC ${ability.saveDC})`
                        : `${name} (${ability.saveType} DC ${ability.saveDC})`);
                } else {
                    lines.push(name);
                }
                break;

            case 'spell':
                lines.push(isHe
                    ? `${name} (1/יום)`
                    : `${name} (1/day)`);
                break;

            default:
                lines.push(name);
        }
    }

    return lines;
}
