// @ts-nocheck
/**
 * Assembly Armor Data - Armor and Wondrous item definitions for Assembly Table
 * Extracted from AssemblyController.js for better code organization
 */

interface ArmorItem {
    nameHe: string;
    nameEn: string;
    ac: number;
    icon: string;
    note?: string;
}

interface ArmorCategory {
    nameHe: string;
    nameEn: string;
    icon: string;
    items: Record<string, ArmorItem>;
}

// Armor data organized by weight class
export const ARMOR: Record<string, ArmorCategory> = {
    light: {
        nameHe: 'שריון קל',
        nameEn: 'Light Armor',
        icon: '🥋',
        items: {
            padded: { nameHe: 'מרופד', nameEn: 'Padded', ac: 11, icon: '🧥' },
            leather: { nameHe: 'עור', nameEn: 'Leather', ac: 11, icon: '🧥' },
            studdedLeather: { nameHe: 'עור מסומר', nameEn: 'Studded Leather', ac: 12, icon: '🧥' }
        }
    },
    medium: {
        nameHe: 'שריון בינוני',
        nameEn: 'Medium Armor',
        icon: '🦺',
        items: {
            hide: { nameHe: 'עור חיה', nameEn: 'Hide', ac: 12, icon: '🦺' },
            chainShirt: { nameHe: 'חולצת שריון', nameEn: 'Chain Shirt', ac: 13, icon: '⛓️' },
            scaleMail: { nameHe: 'שריון קשקשים', nameEn: 'Scale Mail', ac: 14, icon: '🐉' },
            breastplate: { nameHe: 'שריון חזה', nameEn: 'Breastplate', ac: 14, icon: '🛡️' },
            halfPlate: { nameHe: 'חצי-פלטות', nameEn: 'Half Plate', ac: 15, icon: '🛡️' }
        }
    },
    heavy: {
        nameHe: 'שריון כבד',
        nameEn: 'Heavy Armor',
        icon: '🛡️',
        items: {
            ringMail: { nameHe: 'שריון טבעות', nameEn: 'Ring Mail', ac: 14, icon: '⭕' },
            chainMail: { nameHe: 'שריון שרשרת', nameEn: 'Chain Mail', ac: 16, icon: '⛓️' },
            splint: { nameHe: 'שריון רצועות', nameEn: 'Splint', ac: 17, icon: '🛡️' },
            plate: { nameHe: 'שריון מלא', nameEn: 'Plate', ac: 18, icon: '🛡️' }
        }
    },
    shields: {
        nameHe: 'מגינים',
        nameEn: 'Shields',
        icon: '🛡️',
        items: {
            shield: { nameHe: 'מגן', nameEn: 'Shield', ac: 2, icon: '🛡️', note: '+2 לדרג"ש' }
        }
    }
};

interface WondrousCategory {
    nameHe: string;
    nameEn: string;
    icon: string;
    items: Record<string, any>;
}

// Wondrous items categories
export const WONDROUS: Record<string, WondrousCategory> = {
    head: { nameHe: 'ראש', nameEn: 'Head', icon: '👑', items: {} },
    neck: { nameHe: 'צוואר', nameEn: 'Neck', icon: '📿', items: {} },
    hands: { nameHe: 'ידיים', nameEn: 'Hands', icon: '🧤', items: {} },
    body: { nameHe: 'גוף', nameEn: 'Body', icon: '👘', items: {} },
    feet: { nameHe: 'רגליים', nameEn: 'Feet', icon: '👢', items: {} },
    rings: { nameHe: 'טבעות', nameEn: 'Rings', icon: '💍', items: {} }
};

// Helper to get all armor types flat
export function getAllArmorFlat() {
    const result: any[] = [];
    Object.entries(ARMOR).forEach(([categoryId, category]) => {
        Object.entries(category.items).forEach(([itemId, item]) => {
            result.push({
                id: itemId,
                category: categoryId,
                ...item
            });
        });
    });
    return result;
}

// Helper to get armor by ID
export function getArmorById(id: string) {
    for (const category of Object.values(ARMOR)) {
        if (category.items[id]) {
            return category.items[id];
        }
    }
    return null;
}

export default { ARMOR, WONDROUS, getAllArmorFlat, getArmorById };
