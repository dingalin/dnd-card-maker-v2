export interface SelectOption {
    value: string;
    label: string;
    labelEn: string;
}

export interface CharacterOptions {
    genders: SelectOption[];
    races: SelectOption[];
    classes: SelectOption[];
    styles: SelectOption[];
    backgrounds: SelectOption[];
    artStyles: SelectOption[];
    poses: SelectOption[];
}

export interface OfficialItems {
    weapon: Record<string, string[]>;
    armor: Record<string, string[]>;
    potion: Record<string, string[]>;
    ring: Record<string, string[]>;
    wondrous: Record<string, string[]>;
}

export interface ItemStat {
    damage?: string;
    damageType?: string;
    ac?: string;
    light?: boolean;
    twoHanded?: boolean;
    thrown?: boolean;
    versatile?: string;
    ranged?: boolean;
    reach?: boolean;
    finesse?: boolean;
    dexMod?: 'none' | 'full' | 'max2' | string;
    category?: string;
    basePrice?: number;
    effect?: { he: string; en: string };
    duration?: { he: string; en: string };
    rarity?: string;
    slot?: string;
    typical?: string[];
    typeLabel?: { he: string; en: string };
}

// Global window augmentation removed to avoid 'identical modifiers' conflict with exports
// Legacy code will access these via window, typed code should import them.


export const CHARACTER_OPTIONS: CharacterOptions = {
    genders: [
        { value: 'male', label: 'זכר', labelEn: 'Male' },
        { value: 'female', label: 'נקבה', labelEn: 'Female' },
        { value: 'non-binary', label: 'א-בינארי', labelEn: 'Non-Binary' }
    ],
    races: [
        { value: 'human', label: 'בן אנוש', labelEn: 'Human' },
        { value: 'elf', label: 'אלף', labelEn: 'Elf' },
        { value: 'dwarf', label: 'גמד', labelEn: 'Dwarf' },
        { value: 'halfling', label: 'זוטון', labelEn: 'Halfling' },
        { value: 'tiefling', label: 'טיפלינג', labelEn: 'Tiefling' },
        { value: 'gnome', label: 'ננס', labelEn: 'Gnome' },
        { value: 'dragonborn', label: 'דם דרקון', labelEn: 'Dragonborn' },
        { value: 'orc', label: 'אורק', labelEn: 'Orc' }
    ],
    classes: [
        { value: 'fighter', label: 'לוחם', labelEn: 'Fighter' },
        { value: 'wizard', label: 'קוסם', labelEn: 'Wizard' },
        { value: 'rogue', label: 'נוכל', labelEn: 'Rogue' },
        { value: 'cleric', label: 'כוהן', labelEn: 'Cleric' },
        { value: 'paladin', label: 'פלאדין', labelEn: 'Paladin' },
        { value: 'ranger', label: 'סייר', labelEn: 'Ranger' },
        { value: 'barbarian', label: 'ברברי', labelEn: 'Barbarian' },
        { value: 'bard', label: 'פייטן', labelEn: 'Bard' },
        { value: 'druid', label: 'דרואיד', labelEn: 'Druid' },
        { value: 'monk', label: 'נזיר', labelEn: 'Monk' },
        { value: 'sorcerer', label: 'מכשף', labelEn: 'Sorcerer' },
        { value: 'warlock', label: 'אמגוש', labelEn: 'Warlock' }
    ],
    styles: [
        { value: 'portrait', label: 'פורטרט פנים', labelEn: 'Portrait (Face)' },
        { value: 'full_body', label: 'גוף מלא', labelEn: 'Full Body' }
    ],
    backgrounds: [
        { value: 'dungeon', label: 'מבוך אפל', labelEn: 'Dark Dungeon' },
        { value: 'forest', label: 'יער עבות', labelEn: 'Dense Forest' },
        { value: 'tavern', label: 'פונדק', labelEn: 'Tavern' },
        { value: 'city_street', label: 'רחוב עיר', labelEn: 'City Street' },
        { value: 'library', label: 'ספרייה עתיקה', labelEn: 'Ancient Library' },
        { value: 'mountain', label: 'פסגת הר', labelEn: 'Mountain Peak' },
        { value: 'desert', label: 'מדבר', labelEn: 'Desert' },
        { value: 'none', label: 'רקע חלק/סטודיו', labelEn: 'Plain/Studio' }
    ],
    artStyles: [
        { value: 'realistic', label: 'ריאליסטי (Realistic)', labelEn: 'Realistic' },
        { value: 'watercolor_lineart', label: 'צבעי מים וקו (Watercolor & Line Art)', labelEn: 'Watercolor & Line Art' },
        { value: 'oil_painting', label: 'ציור שמן (Oil Painting)', labelEn: 'Oil Painting' },
        { value: 'pencil_sketch', label: 'רישום עיפרון (Pencil Sketch)', labelEn: 'Pencil Sketch' },
        { value: 'dark_fantasy', label: 'פנטזיה אפלה (Dark Fantasy)', labelEn: 'Dark Fantasy' },
        { value: 'anime', label: 'אנימה (Anime)', labelEn: 'Anime' },
        { value: 'woodcut', label: 'תחריט עץ (Woodcut)', labelEn: 'Woodcut' },
        { value: 'pixel_art', label: 'פיקסל ארט (Pixel Art)', labelEn: 'Pixel Art' },
        { value: 'comic_book', label: 'קומיקס / נובלה גרפית (Comic Book)', labelEn: 'Comic Book' },
        { value: 'simple_icon', label: 'אייקון פשוט (Simple Icon)', labelEn: 'Simple Icon' }
    ],
    poses: [
        { value: 'standing', label: 'עמידה רגילה', labelEn: 'Normal Standing' },
        { value: 'combat', label: 'תנוחת קרב', labelEn: 'Combat Stance' },
        { value: 'casting', label: 'הטלת לחש', labelEn: 'Casting Spell' },
        { value: 'stealth', label: 'התגנבות', labelEn: 'Stealth' },
        { value: 'sitting', label: 'ישיבה', labelEn: 'Sitting' }
    ]
};

export const OFFICIAL_ITEMS: OfficialItems = {
    weapon: {
        "Simple Melee": [
            "Club (אלה)",
            "Dagger (פגיון)",
            "Greatclub (אלה גדולה)",
            "Handaxe (גרזן יד)",
            "Javelin (כידון)",
            "Light Hammer (פטיש קל)",
            "Mace (אלת קרב)",
            "Quarterstaff (מטה)",
            "Sickle (מגל)",
            "Spear (חנית)"
        ],
        "Simple Ranged": [
            "Light Crossbow (רובה קשת קל)",
            "Dart (חץ הטלה)",
            "Shortbow (קשת קצרה)",
            "Sling (קלע)"
        ],
        "Martial Melee": [
            "Battleaxe (גרזן קרב)",
            "Flail (מורג)",
            "Glaive (גלייב)",
            "Greataxe (גרזן דו-ידני)",
            "Greatsword (חרב דו-ידנית)",
            "Halberd (הלבארד)",
            "Lance (רומח)",
            "Longsword (חרב ארוכה)",
            "Maul (פטיש קרב)",
            "Morningstar (כוכב שחר)",
            "Pike (רומח רגלים)",
            "Rapier (סיף)",
            "Scimitar (חרב מעוקלת)",
            "Shortsword (חרב קצרה)",
            "Trident (קלשון)",
            "War Pick (מכוש מלחמה)",
            "Warhammer (קורנס)"
        ],
        "Martial Ranged": [
            "Blowgun (רובה נשיפה)",
            "Hand Crossbow (רובה קשת יד)",
            "Heavy Crossbow (רובה קשת כבד)",
            "Longbow (קשת ארוכה)",
            "Net (רשת)"
        ],
        "Ammunition (תחמושת)": [
            "Arrows (חצים)",
            "Bolts (קליעים)",
            "Sling Bullets (אבני קלע)",
            "Blowgun Needles (מחטי נשיפה)"
        ]
    },
    armor: {
        "Light Armor": [
            "Padded (מרופד)",
            "Leather (עור)",
            "Studded Leather (עור מחוזק)"
        ],
        "Medium Armor": [
            "Hide (פרווה)",
            "Chain Shirt (חולצת שרשראות)",
            "Scale Mail (שריון קשקשים)",
            "Breastplate (שריון חזה)",
            "Half Plate (חצי לוחות)"
        ],
        "Heavy Armor": [
            "Ring Mail (שריון טבעות)",
            "Chain Mail (שריון שרשראות)",
            "Splint (שריון רצועות)",
            "Plate (שריון לוחות)"
        ],
        "Shield": [
            "Shield (מגן)"
        ]
    },
    potion: {
        "Potions": [
            "Healing (ריפוי)",
            "Climbing (טיפוס)",
            "Invisibility (היעלמות)",
            "Speed (מהירות)",
            "Water Breathing (נשימה במים)",
            "Giant Strength (כוח ענקים)"
        ]
    },
    ring: {
        "Rings": [
            "Protection (הגנה)",
            "Invisibility (היעלמות)",
            "Feather Falling (נפילת נוצה)",
            "Regeneration (התחדשות)"
        ]
    },
    wondrous: {
        "Worn": [
            "Amulet (קמע)",
            "Belt (חגורה)",
            "Boots (מגפיים)",
            "Cloak (גלימה)",
            "Gloves (כפפות)",
            "Helmet (קסדה)"
        ],
        "Held": [
            "Bag (תיק)",
            "Gem (אבן חן)",
            "Wand (שרביט)",
            "Rod (מוט)",
            "Staff (מטה קסם)"
        ]
    }
};

export const ITEM_STATS: Record<string, ItemStat> = {
    // Simple Melee (PHB prices in GP)
    "Club (אלה)": { damage: "1d4", damageType: "bludgeoning", basePrice: 0.1 },
    "Dagger (פגיון)": { damage: "1d4", damageType: "piercing", light: true, basePrice: 2 },
    "Greatclub (אלה גדולה)": { damage: "1d8", damageType: "bludgeoning", twoHanded: true, basePrice: 0.2 },
    "Handaxe (גרזן יד)": { damage: "1d6", damageType: "slashing", light: true, basePrice: 5 },
    "Javelin (כידון)": { damage: "1d6", damageType: "piercing", thrown: true, basePrice: 0.5 },
    "Light Hammer (פטיש קל)": { damage: "1d4", damageType: "bludgeoning", light: true, basePrice: 2 },
    "Mace (אלת קרב)": { damage: "1d6", damageType: "bludgeoning", basePrice: 5 },
    "Quarterstaff (מטה)": { damage: "1d6", damageType: "bludgeoning", versatile: "1d8", basePrice: 0.2 },
    "Sickle (מגל)": { damage: "1d4", damageType: "slashing", light: true, basePrice: 1 },
    "Spear (חנית)": { damage: "1d6", damageType: "piercing", versatile: "1d8", thrown: true, basePrice: 1 },

    // Simple Ranged
    "Light Crossbow (רובה קשת קל)": { damage: "1d8", damageType: "piercing", twoHanded: true, ranged: true, basePrice: 25 },
    "Dart (חץ הטלה)": { damage: "1d4", damageType: "piercing", thrown: true, ranged: true, basePrice: 0.05 },
    "Shortbow (קשת קצרה)": { damage: "1d6", damageType: "piercing", twoHanded: true, ranged: true, basePrice: 25 },
    "Sling (קלע)": { damage: "1d4", damageType: "bludgeoning", ranged: true, basePrice: 0.1 },

    // Martial Melee
    "Battleaxe (גרזן קרב)": { damage: "1d8", damageType: "slashing", versatile: "1d10", basePrice: 10 },
    "Flail (מורג)": { damage: "1d8", damageType: "bludgeoning", basePrice: 10 },
    "Glaive (גלייב)": { damage: "1d10", damageType: "slashing", twoHanded: true, reach: true, basePrice: 20 },
    "Greataxe (גרזן דו-ידני)": { damage: "1d12", damageType: "slashing", twoHanded: true, basePrice: 30 },
    "Greatsword (חרב דו-ידנית)": { damage: "2d6", damageType: "slashing", twoHanded: true, basePrice: 50 },
    "Halberd (הלבארד)": { damage: "1d10", damageType: "slashing", twoHanded: true, reach: true, basePrice: 20 },
    "Lance (רומח)": { damage: "1d12", damageType: "piercing", reach: true, basePrice: 10 },
    "Longsword (חרב ארוכה)": { damage: "1d8", damageType: "slashing", versatile: "1d10", basePrice: 15 },
    "Maul (פטיש קרב)": { damage: "2d6", damageType: "bludgeoning", twoHanded: true, basePrice: 10 },
    "Morningstar (כוכב שחר)": { damage: "1d8", damageType: "piercing", basePrice: 15 },
    "Pike (רומח רגלים)": { damage: "1d10", damageType: "piercing", twoHanded: true, reach: true, basePrice: 5 },
    "Rapier (סיף)": { damage: "1d8", damageType: "piercing", finesse: true, basePrice: 25 },
    "Scimitar (חרב מעוקלת)": { damage: "1d6", damageType: "slashing", light: true, finesse: true, basePrice: 25 },
    "Shortsword (חרב קצרה)": { damage: "1d6", damageType: "piercing", light: true, finesse: true, basePrice: 10 },
    "Trident (קלשון)": { damage: "1d6", damageType: "piercing", versatile: "1d8", thrown: true, basePrice: 5 },
    "War Pick (מכוש מלחמה)": { damage: "1d8", damageType: "piercing", basePrice: 5 },
    "Warhammer (קורנס)": { damage: "1d8", damageType: "bludgeoning", versatile: "1d10", basePrice: 15 },

    // Martial Ranged
    "Blowgun (רובה נשיפה)": { damage: "1", damageType: "piercing", ranged: true, basePrice: 10 },
    "Hand Crossbow (רובה קשת יד)": { damage: "1d6", damageType: "piercing", light: true, ranged: true, basePrice: 75 },
    "Heavy Crossbow (רובה קשת כבד)": { damage: "1d10", damageType: "piercing", twoHanded: true, ranged: true, basePrice: 50 },
    "Longbow (קשת ארוכה)": { damage: "1d8", damageType: "piercing", twoHanded: true, ranged: true, basePrice: 50 },
    "Net (רשת)": { damage: "-", damageType: "-", thrown: true, ranged: true, basePrice: 1 },

    // Armor - dexMod: 'full' = +Dex, 'max2' = +Dex (max +2), 'none' = no Dex
    // Light Armor
    "Padded (מרופד)": { ac: "11", dexMod: "full", category: "light", basePrice: 5 },
    "Leather (עור)": { ac: "11", dexMod: "full", category: "light", basePrice: 10 },
    "Studded Leather (עור מחוזק)": { ac: "12", dexMod: "full", category: "light", basePrice: 45 },
    // Medium Armor
    "Hide (פרווה)": { ac: "12", dexMod: "max2", category: "medium", basePrice: 10 },
    "Chain Shirt (חולצת שרשראות)": { ac: "13", dexMod: "max2", category: "medium", basePrice: 50 },
    "Scale Mail (שריון קשקשים)": { ac: "14", dexMod: "max2", category: "medium", basePrice: 50 },
    "Breastplate (שריון חזה)": { ac: "14", dexMod: "max2", category: "medium", basePrice: 400 },
    "Half Plate (חצי לוחות)": { ac: "15", dexMod: "max2", category: "medium", basePrice: 750 },
    // Heavy Armor
    "Ring Mail (שריון טבעות)": { ac: "14", dexMod: "none", category: "heavy", basePrice: 30 },
    "Chain Mail (שריון שרשראות)": { ac: "16", dexMod: "none", category: "heavy", basePrice: 75 },
    "Splint (שריון רצועות)": { ac: "17", dexMod: "none", category: "heavy", basePrice: 200 },
    "Plate (שריון לוחות)": { ac: "18", dexMod: "none", category: "heavy", basePrice: 1500 },
    // Shield
    "Shield (מגן)": { ac: "+2", dexMod: "none", category: "shield", basePrice: 10 },

    // ==================== POTIONS ====================
    "Healing (ריפוי)": {
        effect: { he: "מרפא 2d4+2 HP", en: "Heals 2d4+2 HP" },
        duration: { he: "מיידי", en: "Instant" },
        rarity: "common"
    },
    "Greater Healing (ריפוי גדול)": {
        effect: { he: "מרפא 4d4+4 HP", en: "Heals 4d4+4 HP" },
        duration: { he: "מיידי", en: "Instant" },
        rarity: "uncommon"
    },
    "Superior Healing (ריפוי עילאי)": {
        effect: { he: "מרפא 8d4+8 HP", en: "Heals 8d4+8 HP" },
        duration: { he: "מיידי", en: "Instant" },
        rarity: "rare"
    },
    "Climbing (טיפוס)": {
        effect: { he: "מהירות טיפוס = מהירות הליכה", en: "Climbing speed = walking speed" },
        duration: { he: "שעה אחת", en: "1 hour" },
        rarity: "common"
    },
    "Invisibility (היעלמות)": {
        effect: { he: "הופך לבלתי נראה", en: "Become invisible" },
        duration: { he: "שעה אחת (או עד התקפה)", en: "1 hour (or until attack)" },
        rarity: "very rare"
    },
    "Speed (מהירות)": {
        effect: { he: "מהירות כפולה, +2 לדרג\"ש", en: "Speed doubled, +2 AC" },
        duration: { he: "דקה אחת", en: "1 minute" },
        rarity: "very rare"
    },
    "Water Breathing (נשימה במים)": {
        effect: { he: "יכול לנשום מתחת למים", en: "Can breathe underwater" },
        duration: { he: "שעה אחת", en: "1 hour" },
        rarity: "uncommon"
    },
    "Giant Strength (כוח ענקים)": {
        effect: { he: "כוח הופך ל-21", en: "Strength becomes 21" },
        duration: { he: "שעה אחת", en: "1 hour" },
        rarity: "rare"
    },
    "Fire Resistance (עמידות לאש)": {
        effect: { he: "עמידות לנזק אש", en: "Resistance to fire damage" },
        duration: { he: "שעה אחת", en: "1 hour" },
        rarity: "uncommon"
    },
    "Flying (טיסה)": {
        effect: { he: "מהירות טיסה 60 רגל", en: "Flying speed 60 ft" },
        duration: { he: "שעה אחת", en: "1 hour" },
        rarity: "very rare"
    },

    // ==================== RINGS ====================
    "Protection (הגנה)": {
        slot: "finger",
        effect: { he: "+1 לדרג\"ש ולגלגולי הצלה", en: "+1 to AC and saving throws" },
        rarity: "rare"
    },
    "Invisibility (היעלמות) Ring": {
        slot: "finger",
        effect: { he: "פעולה להפוך לבלתי נראה", en: "Action to become invisible" },
        rarity: "legendary"
    },
    "Feather Falling (נפילת נוצה)": {
        slot: "finger",
        effect: { he: "נופל לאט (60 רגל/סיבוב), ללא נזק נפילה", en: "Fall slowly (60 ft/round), no fall damage" },
        rarity: "rare"
    },
    "Regeneration (התחדשות)": {
        slot: "finger",
        effect: { he: "מרפא 1d6 HP כל 10 דקות", en: "Regain 1d6 HP every 10 minutes" },
        rarity: "very rare"
    },

    // ==================== WONDROUS ITEMS ====================
    "Amulet (קמע)": {
        slot: "neck",
        typical: ["protection", "health", "detection"],
        typeLabel: { he: "קמע", en: "Amulet" }
    },
    "Belt (חגורה)": {
        slot: "waist",
        typical: ["strength", "carrying", "storage"],
        typeLabel: { he: "חגורה", en: "Belt" }
    },
    "Boots (מגפיים)": {
        slot: "feet",
        typical: ["speed", "stealth", "terrain"],
        typeLabel: { he: "מגפיים", en: "Boots" }
    },
    "Cloak (גלימה)": {
        slot: "shoulders",
        typical: ["protection", "stealth", "resistance"],
        typeLabel: { he: "גלימה", en: "Cloak" }
    },
    "Gloves (כפפות)": {
        slot: "hands",
        typical: ["dexterity", "combat", "thievery"],
        typeLabel: { he: "כפפות", en: "Gloves" }
    },
    "Helmet (קסדה)": {
        slot: "head",
        typical: ["perception", "telepathy", "protection"],
        typeLabel: { he: "קסדה", en: "Helmet" }
    },
    "Bag (תיק)": {
        slot: "held",
        typical: ["storage", "extradimensional", "carrying"],
        typeLabel: { he: "תיק", en: "Bag" }
    },
    "Gem (אבן חן)": {
        slot: "held",
        typical: ["elemental", "storing", "focus"],
        typeLabel: { he: "אבן חן", en: "Gem" }
    },
    "Wand (שרביט)": {
        slot: "held",
        typical: ["spellcasting", "charges", "attack"],
        typeLabel: { he: "שרביט", en: "Wand" }
    },
    "Rod (מוט)": {
        slot: "held",
        typical: ["leadership", "control", "power"],
        typeLabel: { he: "מוט", en: "Rod" }
    },
    "Staff (מטה קסם)": {
        slot: "held",
        typical: ["spellcasting", "charges", "versatile"],
        typeLabel: { he: "מטה קסם", en: "Staff" }
    },

    // Quiver/Ammunition
    "Quiver (אשפה)": {
        slot: "back",
        typical: ["storage", "magical arrows"],
        typeLabel: { he: "אשפה", en: "Quiver" }
    },
    // Ammunition Stats
    "Arrows (חצים)": { basePrice: 0.05, category: "ammo" },
    "Bolts (קליעים)": { basePrice: 0.05, category: "ammo" },
    "Sling Bullets (אבני קלע)": { basePrice: 0.01, category: "ammo" },
    "Blowgun Needles (מחטי נשיפה)": { basePrice: 0.02, category: "ammo" }
};

(window as any).CHARACTER_OPTIONS = CHARACTER_OPTIONS;
(window as any).OFFICIAL_ITEMS = OFFICIAL_ITEMS;
(window as any).ITEM_STATS = ITEM_STATS;
