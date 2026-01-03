/**
 * PowerBudget.ts
 * ===============
 * Unified Power Budget System for D&D 5e Item Creation
 * 
 * This is the SINGLE SOURCE OF TRUTH for:
 * - Rarity budgets (point ranges per rarity)
 * - Ability definitions with costs (merged from assembly-tokens + power-budget)
 * - Budget calculation functions
 * 
 * Previously split between:
 * - src/data/power-budget.ts (point system)
 * - src/data/assembly-tokens.ts (abilities)
 * Now unified here.
 */

// ============================================
// INTERFACES
// ============================================

export interface Ability {
    id: string;
    nameHe: string;
    nameEn: string;
    cost: number;
    category: string;
    description?: string;
    descriptionEn?: string;
    icon?: string;
    exclusive?: boolean;      // Only one from this category
    requiresElement?: boolean;
    saveDC?: number;
    saveType?: string;
    rare?: boolean;
    legendary?: boolean;
    premium?: boolean;
    spellLevel?: number;
}

export interface RarityBudget {
    id: string;
    nameHe: string;
    nameEn: string;
    min: number;
    max: number;
    gold: [number, number];
    color: string;
    icon: string;
}

export interface DamageElement {
    id: string;
    nameHe: string;
    nameEn: string;
    icon: string;
    color: string;
    cost: number;
    premium?: boolean;
    note?: string;
}

export interface BudgetModifier {
    id: string;
    nameHe: string;
    nameEn: string;
    description: string;
    budgetBonus?: number;
    costMultiplier?: number;
}

// ============================================
// RARITY BUDGETS
// ============================================

export const RARITY_BUDGETS: Record<string, RarityBudget> = {
    common: {
        id: 'common',
        nameHe: 'נפוץ',
        nameEn: 'Common',
        min: 0,
        max: 1,
        gold: [50, 100],
        color: '#9ca3af',
        icon: '⚪'
    },
    uncommon: {
        id: 'uncommon',
        nameHe: 'לא נפוץ',
        nameEn: 'Uncommon',
        min: 2,
        max: 4,
        gold: [200, 500],
        color: '#22c55e',
        icon: '🟢'
    },
    rare: {
        id: 'rare',
        nameHe: 'נדיר',
        nameEn: 'Rare',
        min: 5,
        max: 8,
        gold: [2000, 5000],
        color: '#3b82f6',
        icon: '🔵'
    },
    veryRare: {
        id: 'veryRare',
        nameHe: 'נדיר מאוד',
        nameEn: 'Very Rare',
        min: 9,
        max: 13,
        gold: [20000, 50000],
        color: '#a855f7',
        icon: '🟣'
    },
    legendary: {
        id: 'legendary',
        nameHe: 'אגדי',
        nameEn: 'Legendary',
        min: 14,
        max: 20,
        gold: [100000, 200000],
        color: '#f97316',
        icon: '🟠'
    }
};

// ============================================
// DAMAGE ELEMENTS
// ============================================

export const DAMAGE_ELEMENTS: Record<string, DamageElement> = {
    fire: { id: 'fire', nameHe: 'אש', nameEn: 'Fire', icon: '🔥', color: '#ef4444', cost: 0 },
    cold: { id: 'cold', nameHe: 'קור', nameEn: 'Cold', icon: '❄️', color: '#3b82f6', cost: 0 },
    lightning: { id: 'lightning', nameHe: 'ברק', nameEn: 'Lightning', icon: '⚡', color: '#eab308', cost: 0 },
    acid: { id: 'acid', nameHe: 'חומצה', nameEn: 'Acid', icon: '🧪', color: '#22c55e', cost: 0 },
    poison: { id: 'poison', nameHe: 'רעל', nameEn: 'Poison', icon: '☠️', color: '#a855f7', cost: 0, note: 'יצורים רבים חסינים' },
    thunder: { id: 'thunder', nameHe: 'רעם', nameEn: 'Thunder', icon: '💥', color: '#6366f1', cost: 0 },
    necrotic: { id: 'necrotic', nameHe: 'נקרוטי', nameEn: 'Necrotic', icon: '💀', color: '#6b7280', cost: 0, note: 'מזוהה עם מוות/רוע' },
    // Premium elements (+1 cost)
    radiant: { id: 'radiant', nameHe: 'זוהר', nameEn: 'Radiant', icon: '☀️', color: '#fbbf24', cost: 1, premium: true, note: 'חזק נגד אל-מתים' },
    force: { id: 'force', nameHe: 'כוח', nameEn: 'Force', icon: '💫', color: '#ec4899', cost: 1, premium: true, note: 'כמעט אין עמידויות' },
    psychic: { id: 'psychic', nameHe: 'פסיכי', nameEn: 'Psychic', icon: '🧠', color: '#8b5cf6', cost: 1, premium: true, note: 'תוקף את התודעה' }
};

// ============================================
// ABILITIES (Merged from assembly-tokens + costs)
// ============================================

export const ABILITIES: Record<string, Record<string, Ability>> = {
    // ========== ATTACK/DAMAGE BONUSES ==========
    bonuses: {
        magical: {
            id: 'magical',
            nameHe: 'נשק קסום',
            nameEn: 'Magical Weapon',
            description: 'הנשק נחשב קסום לצורך התגברות על עמידויות',
            descriptionEn: 'Counts as magical for overcoming resistance',
            cost: 1,
            category: 'bonus',
            icon: '✨',
            exclusive: true
        },
        bonus_1: {
            id: 'bonus_1',
            nameHe: '+1 להתקפה ונזק',
            nameEn: '+1 to attack and damage',
            description: 'בונוס +1 לכל התקפות ונזק',
            cost: 3,
            category: 'bonus',
            icon: '⚔️',
            exclusive: true
        },
        bonus_2: {
            id: 'bonus_2',
            nameHe: '+2 להתקפה ונזק',
            nameEn: '+2 to attack and damage',
            description: 'בונוס +2 לכל התקפות ונזק',
            cost: 6,
            category: 'bonus',
            icon: '⚔️',
            exclusive: true
        },
        bonus_3: {
            id: 'bonus_3',
            nameHe: '+3 להתקפה ונזק',
            nameEn: '+3 to attack and damage',
            description: 'בונוס +3 לכל התקפות ונזק',
            cost: 10,
            category: 'bonus',
            icon: '⚔️',
            exclusive: true,
            legendary: true
        }
    },

    // ========== EXTRA DAMAGE DICE ==========
    extraDamage: {
        damage_1d4: {
            id: 'damage_1d4',
            nameHe: '+1d4 נזק',
            nameEn: '+1d4 extra damage',
            description: 'נזק נוסף מסוג הנבחר',
            cost: 2,
            category: 'damage',
            icon: '🎲',
            requiresElement: true,
            exclusive: true
        },
        damage_1d6: {
            id: 'damage_1d6',
            nameHe: '+1d6 נזק',
            nameEn: '+1d6 extra damage',
            description: 'נזק נוסף מסוג הנבחר',
            cost: 3,
            category: 'damage',
            icon: '🎲',
            requiresElement: true,
            exclusive: true
        },
        damage_1d8: {
            id: 'damage_1d8',
            nameHe: '+1d8 נזק',
            nameEn: '+1d8 extra damage',
            description: 'נזק נוסף מסוג הנבחר',
            cost: 4,
            category: 'damage',
            icon: '🎲',
            requiresElement: true,
            exclusive: true
        }
    },

    // ========== COMBAT EFFECTS ==========
    combatEffects: {
        vicious: {
            id: 'vicious',
            nameHe: 'אכזרי',
            nameEn: 'Vicious',
            description: 'בגלגול 20 טבעי, מוסיף 7 נזק נוסף',
            descriptionEn: 'On natural 20, deal +7 damage',
            cost: 3,
            category: 'combat',
            icon: '💢'
        },
        keen: {
            id: 'keen',
            nameHe: 'דיוק',
            nameEn: 'Keen',
            description: 'פגיעה קריטית ב-19 ו-20',
            descriptionEn: 'Critical hit on 19-20',
            cost: 4,
            category: 'combat',
            icon: '🎯'
        },
        vorpal: {
            id: 'vorpal',
            nameHe: 'עריפה',
            nameEn: 'Vorpal',
            description: 'בגלגול 20 טבעי, כורת את ראש היריב',
            descriptionEn: 'On natural 20, decapitate',
            cost: 12,
            category: 'combat',
            icon: '⚔️',
            legendary: true
        }
    },

    // ========== SPECIAL FEATURES ==========
    specialFeatures: {
        returning: {
            id: 'returning',
            nameHe: 'זריקה וחזרה',
            nameEn: 'Returning',
            description: 'הנשק חוזר ליד המטיל מיד לאחר התקפה מטווח רחוק',
            descriptionEn: 'Returns to hand after thrown',
            cost: 1,
            category: 'special',
            icon: '🔄'
        },
        warning: {
            id: 'warning',
            nameHe: 'אזהרה',
            nameEn: 'Warning',
            description: 'יתרון ליוזמה, אי אפשר להפתיע את המשתמש',
            descriptionEn: "Advantage on initiative, can't be surprised",
            cost: 3,
            category: 'special',
            icon: '⚠️'
        },
        light: {
            id: 'light',
            nameHe: 'מאיר',
            nameEn: 'Light',
            description: 'משרה אור בהיר 20 רגל ואור עמום 40 רגל',
            descriptionEn: 'Sheds bright light 20ft, dim light 40ft',
            cost: 1,
            category: 'special',
            icon: '💡'
        },
        thrown: {
            id: 'thrown',
            nameHe: 'הטלה',
            nameEn: 'Thrown',
            description: 'ניתן לזרוק את הנשק (טווח 20/60)',
            descriptionEn: 'Can be thrown (range 20/60)',
            cost: 1,
            category: 'special',
            icon: '🎯'
        },
        reach: {
            id: 'reach',
            nameHe: 'הישג',
            nameEn: 'Reach',
            description: 'טווח הישג +5 רגל',
            descriptionEn: 'Reach +5 feet',
            cost: 2,
            category: 'special',
            icon: '📏'
        }
    },

    // ========== CONDITION EFFECTS ==========
    conditionEffects: {
        push_5ft: {
            id: 'push_5ft',
            nameHe: 'דחיפה 5\'',
            nameEn: 'Push 5ft',
            description: 'דוחף את היריב 5 רגל אחורה',
            cost: 1,
            category: 'condition',
            icon: '💨'
        },
        push_10ft: {
            id: 'push_10ft',
            nameHe: 'דחיפה 10\'',
            nameEn: 'Push 10ft',
            description: 'דוחף את היריב 10 רגל אחורה (הצלת כוח DC 13)',
            cost: 2,
            category: 'condition',
            icon: '💨',
            saveDC: 13,
            saveType: 'STR'
        },
        prone: {
            id: 'prone',
            nameHe: 'הפלה',
            nameEn: 'Knock Prone',
            description: 'מפיל את היריב (הצלת כוח DC 13/15)',
            descriptionEn: 'Strength save DC 13/15',
            cost: 4,
            category: 'condition',
            icon: '⬇️',
            saveDC: 13,
            saveType: 'STR'
        },
        frightened: {
            id: 'frightened',
            nameHe: 'הפחדה',
            nameEn: 'Frightened',
            description: 'מפחיד את היריב (הצלת חוכמה DC 13/15)',
            descriptionEn: 'Wisdom save DC 13/15',
            cost: 4,
            category: 'condition',
            icon: '😱',
            saveDC: 13,
            saveType: 'WIS'
        },
        stunned: {
            id: 'stunned',
            nameHe: 'הלם',
            nameEn: 'Stunned',
            description: 'הצלת חוסן DC 15 או היריב בהלם',
            descriptionEn: 'Constitution save DC 15',
            cost: 6,
            category: 'condition',
            icon: '💫',
            saveDC: 15,
            saveType: 'CON',
            rare: true
        }
    },

    // ========== SPELLS (Level 1) ==========
    spellsLevel1: {
        bless: {
            id: 'bless',
            nameHe: 'ברכה',
            nameEn: 'Bless',
            description: 'תוסף 1d4 להתקפות והצלות (פעם/יום)',
            descriptionEn: '+1d4 to attacks and saves (1/day)',
            cost: 2,
            category: 'spell',
            icon: '✝️',
            spellLevel: 1
        },
        command: {
            id: 'command',
            nameHe: 'פקודה',
            nameEn: 'Command',
            description: 'פקודה מילולית לאויב (פעם/יום)',
            descriptionEn: 'One-word command to enemy (1/day)',
            cost: 2,
            category: 'spell',
            icon: '👆',
            spellLevel: 1
        },
        cureWounds: {
            id: 'cureWounds',
            nameHe: 'ריפוי פצעים',
            nameEn: 'Cure Wounds',
            description: 'ריפוי במגע 1d8 + מתאם (פעם/יום)',
            descriptionEn: 'Heal 1d8 + modifier (1/day)',
            cost: 2,
            category: 'spell',
            icon: '💚',
            spellLevel: 1
        },
        faerieFire: {
            id: 'faerieFire',
            nameHe: 'אש פיות',
            nameEn: 'Faerie Fire',
            description: 'סימון אויבים באור, יתרון להתקפות נגדם (פעם/יום)',
            descriptionEn: 'Mark enemies, grants advantage (1/day)',
            cost: 2,
            category: 'spell',
            icon: '✨',
            spellLevel: 1
        },
        shield: {
            id: 'shield',
            nameHe: 'מגן',
            nameEn: 'Shield',
            description: 'תוסף +5 לדרג"ש כתגובה (פעם/יום)',
            descriptionEn: '+5 AC as reaction (1/day)',
            cost: 2,
            category: 'spell',
            icon: '🛡️',
            spellLevel: 1
        }
    },

    // ========== SPELLS (Level 2) ==========
    spellsLevel2: {
        invisibility: {
            id: 'invisibility',
            nameHe: 'היעלמות',
            nameEn: 'Invisibility',
            description: 'היעלמות מעין (פעם/יום)',
            descriptionEn: 'Become invisible (1/day)',
            cost: 3,
            category: 'spell',
            icon: '👻',
            spellLevel: 2
        },
        mistyStep: {
            id: 'mistyStep',
            nameHe: 'צעד ערפילי',
            nameEn: 'Misty Step',
            description: 'השתגרות לטווח קצר 30 פיט (פעם/יום)',
            descriptionEn: 'Teleport 30 feet (1/day)',
            cost: 3,
            category: 'spell',
            icon: '🌫️',
            spellLevel: 2
        },
        holdPerson: {
            id: 'holdPerson',
            nameHe: 'שיתוק אדם',
            nameEn: 'Hold Person',
            description: 'שיתוק דמוי-אדם (פעם/יום)',
            descriptionEn: 'Paralyze humanoid (1/day)',
            cost: 3,
            category: 'spell',
            icon: '🧊',
            spellLevel: 2
        },
        scorchingRay: {
            id: 'scorchingRay',
            nameHe: 'קרני שריפה',
            nameEn: 'Scorching Ray',
            description: '3 קרני אש, 2d6 כל אחת (פעם/יום)',
            descriptionEn: '3 rays of fire, 2d6 each (1/day)',
            cost: 3,
            category: 'spell',
            icon: '🔥',
            spellLevel: 2
        }
    },

    // ========== SPELLS (Level 3) ==========
    spellsLevel3: {
        fireball: {
            id: 'fireball',
            nameHe: 'כדור אש',
            nameEn: 'Fireball',
            description: '8d6 נזק אש באזור 20 רגל (פעם/יום)',
            descriptionEn: '8d6 fire damage in 20ft sphere (1/day)',
            cost: 4,
            category: 'spell',
            icon: '🔥',
            spellLevel: 3
        },
        fly: {
            id: 'fly',
            nameHe: 'תעופה',
            nameEn: 'Fly',
            description: 'מעופף למשך 10 דקות (פעם/יום)',
            descriptionEn: 'Fly for 10 minutes (1/day)',
            cost: 4,
            category: 'spell',
            icon: '🦅',
            spellLevel: 3
        },
        haste: {
            id: 'haste',
            nameHe: 'האצה',
            nameEn: 'Haste',
            description: 'פעולה נוספת, +2 דרג"ש, מהירות כפולה (פעם/יום)',
            descriptionEn: 'Extra action, +2 AC, double speed (1/day)',
            cost: 5,
            category: 'spell',
            icon: '⚡',
            spellLevel: 3,
            rare: true
        },
        lightningBolt: {
            id: 'lightningBolt',
            nameHe: 'ברק',
            nameEn: 'Lightning Bolt',
            description: '8d6 נזק ברק בקו 100 פיט (פעם/יום)',
            descriptionEn: '8d6 lightning damage in 100ft line (1/day)',
            cost: 4,
            category: 'spell',
            icon: '⚡',
            spellLevel: 3
        }
    },

    // ========== MATERIALS ==========
    materials: {
        silvered: {
            id: 'silvered',
            nameHe: 'מצופה כסף',
            nameEn: 'Silvered',
            description: 'עוקף עמידות של אנשי-זאב ושדים',
            descriptionEn: 'Bypasses lycanthrope and fiend resistance',
            cost: 1,
            category: 'material',
            icon: '🥈'
        },
        adamantine: {
            id: 'adamantine',
            nameHe: 'אדמנטיט',
            nameEn: 'Adamantine',
            description: 'קריטי אוטומטי נגד חפצים, בלתי שביר',
            descriptionEn: 'Auto-crit vs objects, unbreakable',
            cost: 2,
            category: 'material',
            icon: '⬛'
        },
        mithral: {
            id: 'mithral',
            nameHe: "מית'ריל",
            nameEn: 'Mithral',
            description: 'קל יותר - מסיר את תכונת ה-Heavy',
            descriptionEn: 'Lighter - removes Heavy property',
            cost: 2,
            category: 'material',
            icon: '🔘'
        }
    }
};

// ============================================
// BUDGET MODIFIERS
// ============================================

export const BUDGET_MODIFIERS: Record<string, BudgetModifier> = {
    attunement: {
        id: 'attunement',
        nameHe: 'דורש התכווננות',
        nameEn: 'Requires Attunement',
        description: 'מוסיף 2 נקודות לתקציב',
        budgetBonus: 2
    },
    cursed: {
        id: 'cursed',
        nameHe: 'מקולל',
        nameEn: 'Cursed',
        description: 'מוסיף 1 נקודה לתקציב',
        budgetBonus: 1
    },
    consumable: {
        id: 'consumable',
        nameHe: 'חד פעמי',
        nameEn: 'Consumable',
        description: 'כל היכולות עולות חצי',
        costMultiplier: 0.5
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all abilities as a flat map (id -> ability)
 */
export function getAllAbilitiesFlat(): Record<string, Ability> {
    const flat: Record<string, Ability> = {};

    for (const category of Object.values(ABILITIES)) {
        for (const [id, ability] of Object.entries(category)) {
            flat[id] = ability;
        }
    }

    return flat;
}

/**
 * Calculate total cost of selected abilities
 */
export function calculateTotalCost(
    selectedAbilities: string[],
    consumable: boolean = false
): number {
    const allAbilities = getAllAbilitiesFlat();
    let total = 0;

    for (const abilityId of selectedAbilities) {
        const ability = allAbilities[abilityId];
        if (ability) {
            total += ability.cost;
        }
    }

    // Apply consumable modifier
    if (consumable) {
        total = Math.ceil(total * 0.5);
    }

    return total;
}

/**
 * Get effective budget for a rarity
 */
export function getEffectiveBudget(
    rarityId: string,
    attunement: boolean = false,
    cursed: boolean = false
): number {
    const rarity = RARITY_BUDGETS[rarityId];
    if (!rarity) return 0;

    let budget = rarity.max;
    if (attunement) budget += 2;
    if (cursed) budget += 1;

    return budget;
}

/**
 * Determine rarity based on total points spent
 */
export function determineRarity(totalPoints: number): string {
    const order = ['legendary', 'veryRare', 'rare', 'uncommon', 'common'];

    for (const rarityId of order) {
        const rarity = RARITY_BUDGETS[rarityId];
        if (totalPoints >= rarity.min) {
            return rarityId;
        }
    }

    return 'common';
}

/**
 * Calculate gold price based on points and rarity
 */
export function calculateGoldPrice(totalPoints: number, rarityId: string): number {
    const rarity = RARITY_BUDGETS[rarityId];
    if (!rarity) return 100;

    const [minGold, maxGold] = rarity.gold;
    const range = maxGold - minGold;
    const rarityRange = rarity.max - rarity.min;
    const pointsIntoRarity = totalPoints - rarity.min;
    const position = rarityRange > 0 ? pointsIntoRarity / rarityRange : 0.5;

    let price = minGold + (range * position);

    // Add jitter (±10%)
    const jitter = 0.9 + (Math.random() * 0.2);
    price *= jitter;

    // Round to nice numbers
    if (price < 100) return Math.round(price / 5) * 5;
    if (price < 1000) return Math.round(price / 25) * 25;
    if (price < 10000) return Math.round(price / 100) * 100;
    return Math.round(price / 500) * 500;
}

/**
 * Validate if abilities fit within budget
 */
export function validateBudget(
    selectedAbilities: string[],
    rarityId: string,
    attunement: boolean = false,
    cursed: boolean = false,
    consumable: boolean = false
) {
    const totalCost = calculateTotalCost(selectedAbilities, consumable);
    const budget = getEffectiveBudget(rarityId, attunement, cursed);
    const remaining = budget - totalCost;

    return {
        valid: remaining >= 0,
        totalCost,
        budget,
        remaining,
        percentUsed: budget > 0 ? Math.round((totalCost / budget) * 100) : 0
    };
}

export default {
    RARITY_BUDGETS,
    DAMAGE_ELEMENTS,
    ABILITIES,
    BUDGET_MODIFIERS,
    getAllAbilitiesFlat,
    calculateTotalCost,
    getEffectiveBudget,
    determineRarity,
    calculateGoldPrice,
    validateBudget
};
