/**
 * ItemTypes.ts
 * =============
 * Single source of truth for all item type definitions
 * 
 * Contains:
 * - Main item categories (weapon, armor, etc.)
 * - Subcategories (melee, ranged, light armor, etc.)
 * - Icons and labels for each type
 * - Type-specific properties
 */

export interface ItemCategory {
    id: string;
    labelHe: string;
    labelEn: string;
    icon: string;
    subcategories?: ItemSubcategory[];
    defaultVisualStyle?: string;
}

export interface ItemSubcategory {
    id: string;
    labelHe: string;
    labelEn: string;
    items?: string[];
}

// ==================== MAIN ITEM CATEGORIES ====================
export const ITEM_CATEGORIES: ItemCategory[] = [
    {
        id: 'weapon',
        labelHe: 'נשק',
        labelEn: 'Weapon',
        icon: '⚔️',
        defaultVisualStyle: 'metallic, battle-worn',
        subcategories: [
            {
                id: 'simple-melee',
                labelHe: 'נשק קרב פשוט',
                labelEn: 'Simple Melee',
                items: ['Club (אלה)', 'Dagger (פגיון)', 'Greatclub (אלה גדולה)', 'Handaxe (גרזן יד)', 'Javelin (כידון)', 'Light Hammer (פטיש קל)', 'Mace (אלה)', 'Quarterstaff (מוט)', 'Sickle (מגל)', 'Spear (חנית)']
            },
            {
                id: 'simple-ranged',
                labelHe: 'נשק טווח פשוט',
                labelEn: 'Simple Ranged',
                items: ['Light Crossbow (רובה קשת קל)', 'Dart (חץ זריקה)', 'Shortbow (קשת קצרה)', 'Sling (קלע)']
            },
            {
                id: 'martial-melee',
                labelHe: 'נשק קרב מתקדם',
                labelEn: 'Martial Melee',
                items: ['Battleaxe (גרזן קרב)', 'Flail (שוט)', 'Glaive (חנית ארוכה)', 'Greataxe (גרזן גדול)', 'Greatsword (חרב גדולה)', 'Halberd (הלברד)', 'Lance (רומח)', 'Longsword (חרב ארוכה)', 'Maul (מקבת)', 'Morningstar (כוכב בוקר)', 'Pike (פייק)', 'Rapier (סיף)', 'Scimitar (חרב מעוקלת)', 'Shortsword (חרב קצרה)', 'Trident (קלשון)', 'War Pick (מכוש מלחמה)', 'Warhammer (קורנס)']
            },
            {
                id: 'martial-ranged',
                labelHe: 'נשק טווח מתקדם',
                labelEn: 'Martial Ranged',
                items: ['Blowgun (רובה נשיפה)', 'Hand Crossbow (רובה קשת יד)', 'Heavy Crossbow (רובה קשת כבד)', 'Longbow (קשת ארוכה)', 'Net (רשת)']
            }
        ]
    },
    {
        id: 'armor',
        labelHe: 'שריון',
        labelEn: 'Armor',
        icon: '🛡️',
        defaultVisualStyle: 'protective, crafted',
        subcategories: [
            {
                id: 'light-armor',
                labelHe: 'שריון קל',
                labelEn: 'Light Armor',
                items: ['Padded (מרופד)', 'Leather (עור)', 'Studded Leather (עור מחוזק)']
            },
            {
                id: 'medium-armor',
                labelHe: 'שריון בינוני',
                labelEn: 'Medium Armor',
                items: ['Hide (פרווה)', 'Chain Shirt (חולצת שרשרת)', 'Scale Mail (שריון קשקשים)', 'Breastplate (שריון חזה)', 'Half Plate (חצי שריון)']
            },
            {
                id: 'heavy-armor',
                labelHe: 'שריון כבד',
                labelEn: 'Heavy Armor',
                items: ['Ring Mail (שריון טבעות)', 'Chain Mail (שריון שרשרת)', 'Splint (שריון פסים)', 'Plate (שריון לוחות)']
            },
            {
                id: 'shields',
                labelHe: 'מגנים',
                labelEn: 'Shields',
                items: ['Shield (מגן)', 'Tower Shield (מגן מגדל)']
            }
        ]
    },
    {
        id: 'potion',
        labelHe: 'שיקוי',
        labelEn: 'Potion',
        icon: '🧪',
        defaultVisualStyle: 'glowing, magical liquid',
        subcategories: [
            {
                id: 'healing',
                labelHe: 'ריפוי',
                labelEn: 'Healing',
                items: ['Healing (ריפוי)', 'Greater Healing (ריפוי גדול)', 'Superior Healing (ריפוי מעולה)', 'Supreme Healing (ריפוי עליון)']
            },
            {
                id: 'enhancement',
                labelHe: 'שיפור',
                labelEn: 'Enhancement',
                items: ['Strength (כוח)', 'Invisibility (היעלמות)', 'Flying (עפיפה)', 'Speed (מהירות)']
            }
        ]
    },
    {
        id: 'ring',
        labelHe: 'טבעת',
        labelEn: 'Ring',
        icon: '💍',
        defaultVisualStyle: 'elegant, magical',
        subcategories: [
            {
                id: 'rings',
                labelHe: 'טבעות',
                labelEn: 'Rings',
                items: ['Protection (הגנה)', 'Invisibility (היעלמות)', 'Feather Falling (נפילת נוצה)', 'Regeneration (התחדשות)']
            }
        ]
    },
    {
        id: 'wondrous',
        labelHe: 'חפץ פלא',
        labelEn: 'Wondrous Item',
        icon: '💎',
        defaultVisualStyle: 'mystical, enchanted',
        subcategories: [
            {
                id: 'worn',
                labelHe: 'לבוש',
                labelEn: 'Worn',
                items: ['Amulet (קמע)', 'Belt (חגורה)', 'Boots (מגפיים)', 'Cloak (גלימה)', 'Gloves (כפפות)', 'Helmet (קסדה)']
            },
            {
                id: 'held',
                labelHe: 'מוחזק',
                labelEn: 'Held',
                items: ['Bag (תיק)', 'Gem (אבן חן)', 'Wand (שרביט)', 'Rod (מוט)', 'Staff (מטה קסם)']
            }
        ]
    },
    {
        id: 'scroll',
        labelHe: 'מגילה',
        labelEn: 'Scroll',
        icon: '📜',
        defaultVisualStyle: 'ancient, magical writing'
    },
    {
        id: 'staff',
        labelHe: 'מטה',
        labelEn: 'Staff',
        icon: '🪄',
        defaultVisualStyle: 'wooden, magical, runes'
    },
    {
        id: 'wand',
        labelHe: 'שרביט',
        labelEn: 'Wand',
        icon: '✨',
        defaultVisualStyle: 'elegant, magical, glowing'
    }
];

// ==================== QUICK ACCESS MAPS ====================
export const ITEM_TYPE_ICONS: Record<string, string> = Object.fromEntries(
    ITEM_CATEGORIES.map(cat => [cat.id, cat.icon])
);

export const ITEM_TYPE_LABELS: Record<string, { he: string; en: string }> = Object.fromEntries(
    ITEM_CATEGORIES.map(cat => [cat.id, { he: cat.labelHe, en: cat.labelEn }])
);

// ==================== HELPER FUNCTIONS ====================
export function getItemCategory(id: string): ItemCategory | undefined {
    return ITEM_CATEGORIES.find(cat => cat.id === id);
}

export function getItemIcon(typeId: string): string {
    return ITEM_TYPE_ICONS[typeId] || '❓';
}

export function getItemLabel(typeId: string, locale: 'he' | 'en' = 'he'): string {
    const labels = ITEM_TYPE_LABELS[typeId];
    return labels ? labels[locale] : typeId;
}

export function getAllSubcategoryItems(categoryId: string): string[] {
    const category = getItemCategory(categoryId);
    if (!category?.subcategories) return [];
    return category.subcategories.flatMap(sub => sub.items || []);
}

export default ITEM_CATEGORIES;
