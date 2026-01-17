import type { EquipmentSlotId } from '../features/CharacterSheet/types/character';

// Simple weighted rarity generator
function rollRarity(): string {
    const roll = Math.random();
    if (roll < 0.60) return 'Common';      // 60%
    if (roll < 0.90) return 'Uncommon';    // 30%
    if (roll < 0.98) return 'Rare';        // 8%
    return 'Very Rare';                    // 2%
    // Legendary reserved for special events or higher levels
}

export interface SmartLootContext {
    slotId: EquipmentSlotId;
    baseType: string;      // e.g. "Weapon", "Wondrous Item"
    subtype: string;       // e.g. "Longsword", "Staff"
    rarity: string;        // "Common", "Rare"
    visualHint: string;    // e.g. "crystal tip", "rusty"
    theme?: string;        // From character background/class
}

export function getSmartLootContext(
    slotId: EquipmentSlotId,
    charClass: string,
    background: string
): SmartLootContext {
    const cls = charClass.toLowerCase();
    const rarity = rollRarity();

    let baseType = "Wondrous Item";
    let subtype = "Artifact";
    let visualHint = "magical item";

    // --- WEAPONS (Main Hand) ---
    if (slotId === 'mainhand') {
        baseType = "Weapon";
        switch (cls) {
            case 'wizard':
            case 'sorcerer':
            case 'warlock':
                subtype = ["Wand", "Staff", "Dagger", "Orb"][Math.floor(Math.random() * 4)];
                visualHint = "arcane focus, glowing energy";
                break;
            case 'rogue':
            case 'ranger':
                subtype = ["Dagger", "Shortsword", "Rapier", "Machete"][Math.floor(Math.random() * 4)];
                visualHint = "lightweight, stealthy, sharp";
                break;
            case 'fighter':
            case 'paladin':
            case 'barbarian':
                subtype = ["Longsword", "Battleaxe", "Warhammer", "Greatsword"][Math.floor(Math.random() * 4)];
                visualHint = "heavy warrior weapon, battle worn";
                break;
            case 'cleric':
            case 'druid':
                subtype = ["Mace", "Quarterstaff", "Club", "Sickle"][Math.floor(Math.random() * 4)];
                visualHint = "divine symbol, nature inspired";
                break;
            default:
                subtype = "Longsword";
                visualHint = "standard adventurer weapon";
        }
    }

    // --- OFF HAND ---
    else if (slotId === 'offhand') {
        if (cls === 'wizard' || cls === 'sorcerer') {
            baseType = "Wondrous Item";
            subtype = ["Spellbook", "Orb", "Crystal", "Scroll"][Math.floor(Math.random() * 4)];
            visualHint = "magical source, runes";
        } else if (cls === 'rogue' || cls === 'ranger') {
            baseType = "Weapon";
            subtype = "Dagger";
            visualHint = "parrying dagger, matching main hand";
        } else {
            baseType = "Armor";
            subtype = "Shield";
            visualHint = "sturdy protection, heraldic symbol";
        }
    }

    // --- ARMOR ---
    else if (slotId === 'armor') {
        baseType = "Armor";
        if (['wizard', 'sorcerer', 'monk'].includes(cls)) {
            subtype = "Robes";
            visualHint = "magical cloth, embroidered";
        } else if (['rogue', 'ranger', 'druid', 'bard'].includes(cls)) {
            subtype = "Leather Armor";
            visualHint = "light armor, flexible, straps";
        } else {
            subtype = "Plate Armor";
            visualHint = "heavy steel plate, knightly";
        }
    }

    // --- RANGED ---
    else if (slotId === 'ranged') {
        baseType = "Weapon";
        if (cls === 'ranger' || cls === 'fighter') {
            subtype = "Longbow";
            visualHint = "elegant wood, large quiver";
        } else if (cls === 'rogue') {
            subtype = "Shortbow";
            visualHint = "compact bow, stealthy";
        } else {
            subtype = "Crossbow";
            visualHint = "mechanical, heavy bolt";
        }
    }

    // --- ACCESSORIES ---
    else if (slotId === 'ring1' || slotId === 'ring2') {
        baseType = "Ring";
        subtype = "Ring";
        visualHint = "gemstone, metal band, magical glow";
    }
    else if (slotId === 'necklace') {
        baseType = "Wondrous Item";
        subtype = "Amulet";
        visualHint = "pendant, chain, jewel";
    }
    else if (slotId === 'cape') {
        baseType = "Wondrous Item";
        subtype = "Cloak";
        visualHint = "fabric, hood, flowing";
    }

    // --- HELMET ---
    else if (slotId === 'helmet') {
        baseType = "Wondrous Item";
        if (['fighter', 'paladin', 'cleric'].includes(cls)) {
            subtype = "Helmet";
            visualHint = "metal helm, protective visor";
        } else if (['wizard', 'sorcerer', 'warlock'].includes(cls)) {
            subtype = "Hood";
            visualHint = "magical hood, shadowy";
        } else {
            subtype = "Circlet";
            visualHint = "elegant headband, gem inset";
        }
    }

    // --- GLOVES ---
    else if (slotId === 'gloves') {
        baseType = "Wondrous Item";
        if (['fighter', 'paladin', 'barbarian'].includes(cls)) {
            subtype = "Gauntlets";
            visualHint = "heavy metal gauntlets, runes";
        } else if (['monk', 'rogue', 'ranger'].includes(cls)) {
            subtype = "Bracers";
            visualHint = "leather bracers, straps";
        } else {
            subtype = "Gloves";
            visualHint = "fine silk gloves, magical embroidery";
        }
    }

    // --- BOOTS ---
    else if (slotId === 'boots') {
        baseType = "Wondrous Item";
        if (['fighter', 'paladin'].includes(cls)) {
            subtype = "Greaves";
            visualHint = "armored boots, heavy tread";
        } else {
            subtype = "Boots";
            visualHint = "leather boots, winged or glowing";
        }
    }

    // --- BELT ---
    else if (slotId === 'belt') {
        baseType = "Wondrous Item";
        if (['fighter', 'barbarian', 'paladin'].includes(cls)) {
            subtype = "Belt";
            visualHint = "heavy leather belt, large buckle";
        } else {
            subtype = "Sash";
            visualHint = "cloth sash, elegant knot";
        }
    }

    // --- GENERIC FALLBACK ---
    else {
        baseType = "Wondrous Item";
        subtype = "Item";
        visualHint = `adventurer gear, ${background} style`;
    }

    return {
        slotId,
        baseType,
        subtype,
        rarity,
        visualHint,
        theme: background
    };
}
