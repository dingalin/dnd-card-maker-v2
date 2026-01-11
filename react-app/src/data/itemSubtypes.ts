// Subtype data extracted from original app
export const WEAPON_SUBTYPES = {
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
    ]
};

export const ARMOR_SUBTYPES = {
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
};

export const POTION_SUBTYPES = {
    "Potions": [
        "Healing (ריפוי)",
        "Climbing (טיפוס)",
        "Invisibility (היעלמות)",
        "Speed (מהירות)",
        "Water Breathing (נשימה במים)",
        "Giant Strength (כוח ענקים)"
    ]
};

export const RING_SUBTYPES = {
    "Rings": [
        "Protection (הגנה)",
        "Invisibility (היעלמות)",
        "Feather Falling (נפילת נוצה)",
        "Regeneration (התחדשות)"
    ]
};

export const WONDROUS_SUBTYPES = {
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
};

// Mapping from Hebrew type names to subtype data
export const TYPE_TO_SUBTYPES: Record<string, Record<string, string[]>> = {
    'נשק': WEAPON_SUBTYPES,
    'שריון': ARMOR_SUBTYPES,
    'שיקוי': POTION_SUBTYPES,
    'טבעת': RING_SUBTYPES,
    'פריט נפלא': WONDROUS_SUBTYPES
};
