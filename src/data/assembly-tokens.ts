// @ts-nocheck
/**
 * Assembly Table Tokens - D&D 5e Item Building Data
 *
 * This module provides data for the Assembly Table drag & drop interface.
 * Each token represents a draggable component that can be added to create magic items.
 */

// ============================================
// WEAPON BASE ITEMS
// ============================================

export const WEAPONS = {
    // ========== SIMPLE MELEE ==========
    simpleMelee: {
        nameHe: 'נשק פשוט קרבי',
        nameEn: 'Simple Melee',
        icon: '⚔️',
        items: {
            club: {
                nameHe: 'אלה',
                nameEn: 'Club',
                damage: '1d4',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['light'],
                propertiesHe: ['קל'],
                basePrice: 0.1,
                icon: '🪵'
            },
            dagger: {
                nameHe: 'פגיון',
                nameEn: 'Dagger',
                damage: '1d4',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['finesse', 'light', 'thrown'],
                propertiesHe: ['מעודן', 'קל', 'הטלה (20/60)'],
                range: '20/60',
                basePrice: 2,
                icon: '🗡️'
            },
            greatclub: {
                nameHe: 'אלת קרב',
                nameEn: 'Greatclub',
                damage: '1d8',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['two-handed'],
                propertiesHe: ['דו-ידני'],
                basePrice: 0.2,
                icon: '🪵'
            },
            handaxe: {
                nameHe: 'גרזן יד',
                nameEn: 'Handaxe',
                damage: '1d6',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['light', 'thrown'],
                propertiesHe: ['קל', 'הטלה (20/60)'],
                range: '20/60',
                basePrice: 5,
                icon: '🪓'
            },
            javelin: {
                nameHe: 'כידון',
                nameEn: 'Javelin',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['thrown'],
                propertiesHe: ['הטלה (30/120)'],
                range: '30/120',
                basePrice: 0.5,
                icon: '🏹'
            },
            lightHammer: {
                nameHe: 'פטיש קל',
                nameEn: 'Light Hammer',
                damage: '1d4',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['light', 'thrown'],
                propertiesHe: ['קל', 'הטלה (20/60)'],
                range: '20/60',
                basePrice: 2,
                icon: '🔨'
            },
            mace: {
                nameHe: 'מקל',
                nameEn: 'Mace',
                damage: '1d6',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: [],
                propertiesHe: [],
                basePrice: 5,
                icon: '🔨'
            },
            quarterstaff: {
                nameHe: 'מוט',
                nameEn: 'Quarterstaff',
                damage: '1d6',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['versatile'],
                propertiesHe: ['רב-שימושי (1d8)'],
                versatileDamage: '1d8',
                basePrice: 0.2,
                icon: '🥢'
            },
            sickle: {
                nameHe: 'חרמש',
                nameEn: 'Sickle',
                damage: '1d4',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['light'],
                propertiesHe: ['קל'],
                basePrice: 1,
                icon: '🌙'
            },
            spear: {
                nameHe: 'חנית',
                nameEn: 'Spear',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['thrown', 'versatile'],
                propertiesHe: ['הטלה (20/60)', 'רב-שימושי (1d8)'],
                range: '20/60',
                versatileDamage: '1d8',
                basePrice: 1,
                icon: '🔱'
            }
        }
    },

    // ========== SIMPLE RANGED ==========
    simpleRanged: {
        nameHe: 'נשק פשוט טווח',
        nameEn: 'Simple Ranged',
        icon: '🏹',
        items: {
            lightCrossbow: {
                nameHe: 'רובה קשת קל',
                nameEn: 'Light Crossbow',
                damage: '1d8',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'loading', 'two-handed'],
                propertiesHe: ['תחמושת (80/320)', 'טעינה', 'דו-ידני'],
                range: '80/320',
                basePrice: 25,
                icon: '🏹'
            },
            dart: {
                nameHe: 'חץ הטלה',
                nameEn: 'Dart',
                damage: '1d4',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['finesse', 'thrown'],
                propertiesHe: ['מעודן', 'הטלה (20/60)'],
                range: '20/60',
                basePrice: 0.05,
                icon: '🎯'
            },
            shortbow: {
                nameHe: 'קשת קצרה',
                nameEn: 'Shortbow',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'two-handed'],
                propertiesHe: ['תחמושת (80/320)', 'דו-ידני'],
                range: '80/320',
                basePrice: 25,
                icon: '🏹'
            },
            sling: {
                nameHe: 'קלע',
                nameEn: 'Sling',
                damage: '1d4',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['ammunition'],
                propertiesHe: ['תחמושת (30/120)'],
                range: '30/120',
                basePrice: 0.1,
                icon: '🪨'
            }
        }
    },

    // ========== MARTIAL MELEE ==========
    martialMelee: {
        nameHe: 'נשק צבאי קרבי',
        nameEn: 'Martial Melee',
        icon: '⚔️',
        items: {
            battleaxe: {
                nameHe: 'גרזן קרב',
                nameEn: 'Battleaxe',
                damage: '1d8',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['versatile'],
                propertiesHe: ['רב-שימושי (1d10)'],
                versatileDamage: '1d10',
                basePrice: 10,
                icon: '🪓'
            },
            flail: {
                nameHe: 'מחבט',
                nameEn: 'Flail',
                damage: '1d8',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: [],
                propertiesHe: [],
                basePrice: 10,
                icon: '⛓️'
            },
            glaive: {
                nameHe: 'להב-מוט',
                nameEn: 'Glaive',
                damage: '1d10',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['heavy', 'reach', 'two-handed'],
                propertiesHe: ['כבד', 'הישג', 'דו-ידני'],
                basePrice: 20,
                icon: '🔱'
            },
            greataxe: {
                nameHe: 'גרזן גדול',
                nameEn: 'Greataxe',
                damage: '1d12',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['heavy', 'two-handed'],
                propertiesHe: ['כבד', 'דו-ידני'],
                basePrice: 30,
                icon: '🪓'
            },
            greatsword: {
                nameHe: 'חרב אדירה',
                nameEn: 'Greatsword',
                damage: '2d6',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['heavy', 'two-handed'],
                propertiesHe: ['כבד', 'דו-ידני'],
                basePrice: 50,
                icon: '⚔️'
            },
            halberd: {
                nameHe: 'הלברד',
                nameEn: 'Halberd',
                damage: '1d10',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['heavy', 'reach', 'two-handed'],
                propertiesHe: ['כבד', 'הישג', 'דו-ידני'],
                basePrice: 20,
                icon: '🔱'
            },
            lance: {
                nameHe: 'רומח פרש',
                nameEn: 'Lance',
                damage: '1d12',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['reach', 'special'],
                propertiesHe: ['הישג', 'מיוחד'],
                basePrice: 10,
                icon: '🏇'
            },
            longsword: {
                nameHe: 'חרב ארוכה',
                nameEn: 'Longsword',
                damage: '1d8',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['versatile'],
                propertiesHe: ['רב-שימושי (1d10)'],
                versatileDamage: '1d10',
                basePrice: 15,
                icon: '⚔️'
            },
            maul: {
                nameHe: 'מקבת',
                nameEn: 'Maul',
                damage: '2d6',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['heavy', 'two-handed'],
                propertiesHe: ['כבד', 'דו-ידני'],
                basePrice: 10,
                icon: '🔨'
            },
            morningstar: {
                nameHe: 'כוכב שחר',
                nameEn: 'Morningstar',
                damage: '1d8',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: [],
                propertiesHe: [],
                basePrice: 15,
                icon: '⛏️'
            },
            pike: {
                nameHe: 'רומח רגלים',
                nameEn: 'Pike',
                damage: '1d10',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['heavy', 'reach', 'two-handed'],
                propertiesHe: ['כבד', 'הישג', 'דו-ידני'],
                basePrice: 5,
                icon: '🔱'
            },
            rapier: {
                nameHe: 'רפייר',
                nameEn: 'Rapier',
                damage: '1d8',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['finesse'],
                propertiesHe: ['מעודן'],
                basePrice: 25,
                icon: '🗡️'
            },
            scimitar: {
                nameHe: 'חרב מעוקלת',
                nameEn: 'Scimitar',
                damage: '1d6',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['finesse', 'light'],
                propertiesHe: ['מעודן', 'קל'],
                basePrice: 25,
                icon: '⚔️'
            },
            shortsword: {
                nameHe: 'חרב קצרה',
                nameEn: 'Shortsword',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['finesse', 'light'],
                propertiesHe: ['מעודן', 'קל'],
                basePrice: 10,
                icon: '🗡️'
            },
            trident: {
                nameHe: 'קלשון',
                nameEn: 'Trident',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['thrown', 'versatile'],
                propertiesHe: ['הטלה (20/60)', 'רב-שימושי (1d8)'],
                range: '20/60',
                versatileDamage: '1d8',
                basePrice: 5,
                icon: '🔱'
            },
            warPick: {
                nameHe: 'מכוש מלחמה',
                nameEn: 'War Pick',
                damage: '1d8',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: [],
                propertiesHe: [],
                basePrice: 5,
                icon: '⛏️'
            },
            warhammer: {
                nameHe: 'פטיש קרב',
                nameEn: 'Warhammer',
                damage: '1d8',
                damageType: 'bludgeoning',
                damageTypeHe: 'מוחץ',
                properties: ['versatile'],
                propertiesHe: ['רב-שימושי (1d10)'],
                versatileDamage: '1d10',
                basePrice: 15,
                icon: '🔨'
            },
            whip: {
                nameHe: 'שוט',
                nameEn: 'Whip',
                damage: '1d4',
                damageType: 'slashing',
                damageTypeHe: 'חותך',
                properties: ['finesse', 'reach'],
                propertiesHe: ['מעודן', 'הישג'],
                basePrice: 2,
                icon: '〰️'
            }
        }
    },

    // ========== MARTIAL RANGED ==========
    martialRanged: {
        nameHe: 'נשק צבאי טווח',
        nameEn: 'Martial Ranged',
        icon: '🏹',
        items: {
            blowgun: {
                nameHe: 'רובה נשיפה',
                nameEn: 'Blowgun',
                damage: '1',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'loading'],
                propertiesHe: ['תחמושת (25/100)', 'טעינה'],
                range: '25/100',
                basePrice: 10,
                icon: '🎺'
            },
            handCrossbow: {
                nameHe: 'רובה קשת יד',
                nameEn: 'Hand Crossbow',
                damage: '1d6',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'light', 'loading'],
                propertiesHe: ['תחמושת (30/120)', 'קל', 'טעינה'],
                range: '30/120',
                basePrice: 75,
                icon: '🏹'
            },
            heavyCrossbow: {
                nameHe: 'רובה קשת כבד',
                nameEn: 'Heavy Crossbow',
                damage: '1d10',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'heavy', 'loading', 'two-handed'],
                propertiesHe: ['תחמושת (100/400)', 'כבד', 'טעינה', 'דו-ידני'],
                range: '100/400',
                basePrice: 50,
                icon: '🏹'
            },
            longbow: {
                nameHe: 'קשת ארוכה',
                nameEn: 'Longbow',
                damage: '1d8',
                damageType: 'piercing',
                damageTypeHe: 'דוקר',
                properties: ['ammunition', 'heavy', 'two-handed'],
                propertiesHe: ['תחמושת (150/600)', 'כבד', 'דו-ידני'],
                range: '150/600',
                basePrice: 50,
                icon: '🏹'
            },
            net: {
                nameHe: 'רשת',
                nameEn: 'Net',
                damage: '0',
                damageType: 'none',
                damageTypeHe: '-',
                properties: ['special', 'thrown'],
                propertiesHe: ['מיוחד', 'הטלה (5/15)'],
                range: '5/15',
                basePrice: 1,
                icon: '🕸️'
            }
        }
    }
};

// ============================================
// ENCHANTMENT TIERS
// ============================================

export const ENCHANTMENT_TIERS = {
    moonTouched: {
        id: 'moonTouched',
        bonus: 0,
        nameHe: 'נגיעת ירח (+0)',
        nameEn: 'Moon-Touched (+0)',
        rarity: 'Common',
        description: 'עוקף עמידויות לנזק לא-קסום',
        descriptionEn: 'Overcomes resistance to non-magical damage',
        icon: '🌙'
    },
    plus1: {
        id: 'plus1',
        bonus: 1,
        nameHe: 'נשק +1',
        nameEn: '+1 Weapon',
        rarity: 'Uncommon',
        description: '+1 להתקפה ונזק',
        descriptionEn: '+1 to attack and damage',
        icon: '✨'
    },
    plus2: {
        id: 'plus2',
        bonus: 2,
        nameHe: 'נשק +2',
        nameEn: '+2 Weapon',
        rarity: 'Rare',
        description: '+2 להתקפה ונזק',
        descriptionEn: '+2 to attack and damage',
        icon: '💫'
    },
    plus3: {
        id: 'plus3',
        bonus: 3,
        nameHe: 'נשק +3',
        nameEn: '+3 Weapon',
        rarity: 'Very Rare',
        description: '+3 להתקפה ונזק',
        descriptionEn: '+3 to attack and damage',
        icon: '⭐'
    }
};

// ============================================
// DAMAGE ELEMENTS (for extra damage)
// ============================================

export const DAMAGE_ELEMENTS = {
    fire: {
        id: 'fire',
        nameHe: 'אש',
        nameEn: 'Fire',
        icon: '🔥',
        color: '#ef4444',
        note: 'הנפוץ ביותר'
    },
    cold: {
        id: 'cold',
        nameHe: 'קור',
        nameEn: 'Cold',
        icon: '❄️',
        color: '#3b82f6'
    },
    lightning: {
        id: 'lightning',
        nameHe: 'ברק',
        nameEn: 'Lightning',
        icon: '⚡',
        color: '#eab308'
    },
    acid: {
        id: 'acid',
        nameHe: 'חומצה',
        nameEn: 'Acid',
        icon: '🧪',
        color: '#22c55e'
    },
    poison: {
        id: 'poison',
        nameHe: 'רעל',
        nameEn: 'Poison',
        icon: '☠️',
        color: '#a855f7',
        note: 'יצורים רבים חסינים'
    },
    necrotic: {
        id: 'necrotic',
        nameHe: 'נקרוטי',
        nameEn: 'Necrotic',
        icon: '💀',
        color: '#6b7280',
        note: 'מזוהה עם מוות/רוע'
    },
    radiant: {
        id: 'radiant',
        nameHe: 'זוהר',
        nameEn: 'Radiant',
        icon: '☀️',
        color: '#fbbf24',
        premium: true,
        note: 'חזק נגד אל-מתים'
    },
    force: {
        id: 'force',
        nameHe: 'כוח',
        nameEn: 'Force',
        icon: '💫',
        color: '#ec4899',
        premium: true,
        note: 'כמעט אין עמידויות - הכי חזק'
    },
    psychic: {
        id: 'psychic',
        nameHe: 'פסיכי',
        nameEn: 'Psychic',
        icon: '🧠',
        color: '#8b5cf6',
        premium: true,
        note: 'תוקף את התודעה'
    },
    thunder: {
        id: 'thunder',
        nameHe: 'רעם',
        nameEn: 'Thunder',
        icon: '💥',
        color: '#6366f1',
        note: 'נזק קולי'
    }
};

// ============================================
// EXTRA DAMAGE DICE OPTIONS
// ============================================

export const EXTRA_DAMAGE_DICE = {
    d4: {
        id: 'd4',
        dice: '1d4',
        nameHe: '+1d4 נזק',
        nameEn: '+1d4 damage',
        cost: 2
    },
    d6: {
        id: 'd6',
        dice: '1d6',
        nameHe: '+1d6 נזק',
        nameEn: '+1d6 damage',
        cost: 3
    },
    d8: {
        id: 'd8',
        dice: '1d8',
        nameHe: '+1d8 נזק',
        nameEn: '+1d8 damage',
        cost: 4
    }
};

// ============================================
// SPECIAL ABILITIES (Drag & Drop Features)
// ============================================

export const SPECIAL_ABILITIES = {
    // Combat Effects
    combatEffects: {
        nameHe: 'השפעות קרב',
        nameEn: 'Combat Effects',
        items: {
            vicious: {
                nameHe: 'אכזרי',
                nameEn: 'Vicious',
                description: 'בגלגול 20 טבעי, מוסיף 7 נזק נוסף',
                descriptionEn: 'On natural 20, deal +7 damage',
                icon: '💢'
            },
            vorpal: {
                nameHe: 'עריפה',
                nameEn: 'Vorpal',
                description: 'בגלגול 20 טבעי, כורת את ראש היריב (אגדי בלבד)',
                descriptionEn: 'On natural 20, decapitate (Legendary only)',
                legendary: true,
                icon: '⚔️'
            },
            keen: {
                nameHe: 'דיוק',
                nameEn: 'Keen',
                description: 'פגיעה קריטית ב-19 ו-20',
                descriptionEn: 'Critical hit on 19-20',
                icon: '🎯'
            },
            returning: {
                nameHe: 'זריקה וחזרה',
                nameEn: 'Returning',
                description: 'הנשק חוזר ליד המטיל מיד לאחר התקפה מטווח רחוק',
                descriptionEn: 'Returns to hand after thrown',
                icon: '🔄'
            },
            warning: {
                nameHe: 'אזהרה',
                nameEn: 'Warning',
                description: 'יתרון ליוזמה, אי אפשר להפתיע את המשתמש',
                descriptionEn: 'Advantage on initiative, can\'t be surprised',
                icon: '⚠️'
            }
        }
    },

    // Condition Effects
    conditionEffects: {
        nameHe: 'השפעות מצב',
        nameEn: 'Condition Effects',
        items: {
            prone: {
                nameHe: 'הפלה',
                nameEn: 'Knock Prone',
                description: 'הצלת כוח DC 13/15',
                descriptionEn: 'Strength save DC 13/15',
                icon: '⬇️'
            },
            push: {
                nameHe: 'דחיפה',
                nameEn: 'Push 10ft',
                description: 'הצלת כוח DC 13/15',
                descriptionEn: 'Strength save DC 13/15',
                icon: '💨'
            },
            frightened: {
                nameHe: 'הפחדה',
                nameEn: 'Frightened',
                description: 'הצלת חוכמה DC 13/15',
                descriptionEn: 'Wisdom save DC 13/15',
                icon: '😱'
            },
            stunned: {
                nameHe: 'הלם',
                nameEn: 'Stunned',
                description: 'הצלת חוסן DC 15 (נדיר מאוד)',
                descriptionEn: 'Constitution save DC 15 (very rare)',
                rare: true,
                icon: '💫'
            }
        }
    }
};

// ============================================
// EMBEDDABLE SPELLS
// ============================================

export const EMBEDDABLE_SPELLS = {
    level1: {
        nameHe: 'לחשי רמה 1 (נפוץ)',
        nameEn: 'Level 1 Spells (Uncommon)',
        rarity: 'Uncommon',
        items: {
            bless: {
                nameHe: 'ברכה',
                nameEn: 'Bless',
                description: 'תוסף 1d4 להתקפות והצלות',
                descriptionEn: '+1d4 to attacks and saves',
                icon: '✝️'
            },
            command: {
                nameHe: 'פקודה',
                nameEn: 'Command',
                description: 'פקודה מילולית לאויב ("פול!", "ברח!")',
                descriptionEn: 'One-word command to enemy',
                icon: '👆'
            },
            cureWounds: {
                nameHe: 'ריפוי פצעים',
                nameEn: 'Cure Wounds',
                description: 'ריפוי במגע (1d8 + מתאם)',
                descriptionEn: 'Heal 1d8 + modifier',
                icon: '💚'
            },
            faerieFire: {
                nameHe: 'אש פיות',
                nameEn: 'Faerie Fire',
                description: 'סימון אויבים באור (נותן יתרון להתקפות נגדם)',
                descriptionEn: 'Mark enemies, grants advantage against them',
                icon: '✨'
            },
            shield: {
                nameHe: 'מגן',
                nameEn: 'Shield',
                description: 'תוסף +5 לדרג"ש כתגובה',
                descriptionEn: '+5 AC as reaction',
                icon: '🛡️'
            }
        }
    },
    level2: {
        nameHe: 'לחשי רמה 2 (נדיר)',
        nameEn: 'Level 2 Spells (Rare)',
        rarity: 'Rare',
        items: {
            invisibility: {
                nameHe: 'היעלמות',
                nameEn: 'Invisibility',
                description: 'היעלמות מעין',
                descriptionEn: 'Become invisible',
                icon: '👻'
            },
            mistyStep: {
                nameHe: 'צעד ערפילי',
                nameEn: 'Misty Step',
                description: 'השתגרות לטווח קצר (30 פיט)',
                descriptionEn: 'Teleport 30 feet',
                icon: '🌫️'
            },
            holdPerson: {
                nameHe: 'שיתוק אדם',
                nameEn: 'Hold Person',
                description: 'שיתוק דמוי-אדם',
                descriptionEn: 'Paralyze humanoid',
                icon: '🧊'
            },
            scorchingRay: {
                nameHe: 'קרני שריפה',
                nameEn: 'Scorching Ray',
                description: '3 קרני אש (2d6 כל אחת)',
                descriptionEn: '3 rays of fire (2d6 each)',
                icon: '🔥'
            }
        }
    }
};
