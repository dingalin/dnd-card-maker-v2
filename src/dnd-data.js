window.CHARACTER_OPTIONS = {
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

window.OFFICIAL_ITEMS = {
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

window.ITEM_STATS = {
    // Simple Melee
    "Club (אלה)": { damage: "1d4", damageType: "bludgeoning" },
    "Dagger (פגיון)": { damage: "1d4", damageType: "piercing", light: true },
    "Greatclub (אלה גדולה)": { damage: "1d8", damageType: "bludgeoning", twoHanded: true },
    "Handaxe (גרזן יד)": { damage: "1d6", damageType: "slashing", light: true },
    "Javelin (כידון)": { damage: "1d6", damageType: "piercing", thrown: true },
    "Light Hammer (פטיש קל)": { damage: "1d4", damageType: "bludgeoning", light: true },
    "Mace (אלת קרב)": { damage: "1d6", damageType: "bludgeoning" },
    "Quarterstaff (מטה)": { damage: "1d6", damageType: "bludgeoning", versatile: "1d8" },
    "Sickle (מגל)": { damage: "1d4", damageType: "slashing", light: true },
    "Spear (חנית)": { damage: "1d6", damageType: "piercing", versatile: "1d8", thrown: true },

    // Simple Ranged
    "Light Crossbow (רובה קשת קל)": { damage: "1d8", damageType: "piercing", twoHanded: true, ranged: true },
    "Dart (חץ הטלה)": { damage: "1d4", damageType: "piercing", thrown: true, ranged: true },
    "Shortbow (קשת קצרה)": { damage: "1d6", damageType: "piercing", twoHanded: true, ranged: true },
    "Sling (קלע)": { damage: "1d4", damageType: "bludgeoning", ranged: true },

    // Martial Melee
    "Battleaxe (גרזן קרב)": { damage: "1d8", damageType: "slashing", versatile: "1d10" },
    "Flail (מורג)": { damage: "1d8", damageType: "bludgeoning" },
    "Glaive (גלייב)": { damage: "1d10", damageType: "slashing", twoHanded: true, reach: true },
    "Greataxe (גרזן דו-ידני)": { damage: "1d12", damageType: "slashing", twoHanded: true },
    "Greatsword (חרב דו-ידנית)": { damage: "2d6", damageType: "slashing", twoHanded: true },
    "Halberd (הלבארד)": { damage: "1d10", damageType: "slashing", twoHanded: true, reach: true },
    "Lance (רומח)": { damage: "1d12", damageType: "piercing", reach: true },
    "Longsword (חרב ארוכה)": { damage: "1d8", damageType: "slashing", versatile: "1d10" },
    "Maul (פטיש קרב)": { damage: "2d6", damageType: "bludgeoning", twoHanded: true },
    "Morningstar (כוכב שחר)": { damage: "1d8", damageType: "piercing" },
    "Pike (רומח רגלים)": { damage: "1d10", damageType: "piercing", twoHanded: true, reach: true },
    "Rapier (סיף)": { damage: "1d8", damageType: "piercing", finesse: true },
    "Scimitar (חרב מעוקלת)": { damage: "1d6", damageType: "slashing", light: true, finesse: true },
    "Shortsword (חרב קצרה)": { damage: "1d6", damageType: "piercing", light: true, finesse: true },
    "Trident (קלשון)": { damage: "1d6", damageType: "piercing", versatile: "1d8", thrown: true },
    "War Pick (מכוש מלחמה)": { damage: "1d8", damageType: "piercing" },
    "Warhammer (קורנס)": { damage: "1d8", damageType: "bludgeoning", versatile: "1d10" },

    // Martial Ranged
    "Blowgun (רובה נשיפה)": { damage: "1", damageType: "piercing", ranged: true },
    "Hand Crossbow (רובה קשת יד)": { damage: "1d6", damageType: "piercing", light: true, ranged: true },
    "Heavy Crossbow (רובה קשת כבד)": { damage: "1d10", damageType: "piercing", twoHanded: true, ranged: true },
    "Longbow (קשת ארוכה)": { damage: "1d8", damageType: "piercing", twoHanded: true, ranged: true },
    "Net (רשת)": { damage: "-", damageType: "-", thrown: true, ranged: true },

    // Armor - dexMod: 'full' = +Dex, 'max2' = +Dex (max +2), 'none' = no Dex
    // Light Armor
    "Padded (מרופד)": { ac: "11", dexMod: "full", category: "light" },
    "Leather (עור)": { ac: "11", dexMod: "full", category: "light" },
    "Studded Leather (עור מחוזק)": { ac: "12", dexMod: "full", category: "light" },
    // Medium Armor
    "Hide (פרווה)": { ac: "12", dexMod: "max2", category: "medium" },
    "Chain Shirt (חולצת שרשראות)": { ac: "13", dexMod: "max2", category: "medium" },
    "Scale Mail (שריון קשקשים)": { ac: "14", dexMod: "max2", category: "medium" },
    "Breastplate (שריון חזה)": { ac: "14", dexMod: "max2", category: "medium" },
    "Half Plate (חצי לוחות)": { ac: "15", dexMod: "max2", category: "medium" },
    // Heavy Armor
    "Ring Mail (שריון טבעות)": { ac: "14", dexMod: "none", category: "heavy" },
    "Chain Mail (שריון שרשראות)": { ac: "16", dexMod: "none", category: "heavy" },
    "Splint (שריון רצועות)": { ac: "17", dexMod: "none", category: "heavy" },
    "Plate (שריון לוחות)": { ac: "18", dexMod: "none", category: "heavy" },
    // Shield
    "Shield (מגן)": { ac: "+2", dexMod: "none", category: "shield" },

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
    }
};
