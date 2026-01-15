/**
 * Monster Loot Profiles
 * Contextually appropriate loot for different monster types
 * 
 * Each profile defines:
 * - carriedItems: Items the creature would carry on their person
 * - hoardTheme: Themes for their collected treasure
 * - preferredTypes: What types of magic items they'd have
 * - goldMultiplier: How much gold they tend to have vs standard
 * - cursedChance: Probability of cursed items in their loot
 * - flavor: Description for the DM
 */

import i18n from '../../../i18n/config';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MonsterLootProfile {
    id: string;
    displayName: string; // Translation key
    icon: string;
    carriedItems: string[];          // Items found on the body
    nearbyItems: string[];           // Items found in lair/surroundings
    hoardTheme: string[];            // Aesthetic themes for generated items
    preferredTypes: string[];        // Item types they prefer
    goldMultiplier: number;          // 1.0 = standard, 2.0 = double, etc.
    cursedChance: number;            // 0.0 to 1.0
    minCR: number;                   // Minimum CR for this creature type
    maxCR: number;                   // Maximum CR for this type
    flavor: string;                  // Translation key
    specialLoot?: string[];          // Unique items specific to this monster
}

// ============================================
// MONSTER LOOT PROFILES
// ============================================

export const MONSTER_LOOT_PROFILES: Record<string, MonsterLootProfile> = {
    // Humanoid - Basic Raiders
    humanoid: {
        id: 'humanoid',
        displayName: 'monsterProfiles.humanoid.displayName',
        icon: '👤',
        carriedItems: ['Weapon', 'Shield', 'Coins', 'Personal trinket'],
        nearbyItems: ['Camp supplies', 'Stolen goods', 'Map or note'],
        hoardTheme: ['practical', 'stolen', 'mismatched'],
        preferredTypes: ['weapon', 'armor', 'wondrous'],
        goldMultiplier: 1.0,
        cursedChance: 0.05,
        minCR: 0,
        maxCR: 10,
        flavor: 'monsterProfiles.humanoid.flavor'
    },

    // Goblinoid - Goblins, Hobgoblins, Bugbears
    goblinoid: {
        id: 'goblinoid',
        displayName: 'monsterProfiles.goblinoid.displayName',
        icon: '👺',
        carriedItems: ['Crude weapon', 'Stolen coins', 'Shiny trinket', 'Keys'],
        nearbyItems: ['Stolen goods pile', 'Crude trap components', 'Prisoner belongings'],
        hoardTheme: ['crude', 'stolen', 'shiny', 'mismatched'],
        preferredTypes: ['weapon', 'wondrous'],
        goldMultiplier: 0.7,
        cursedChance: 0.10,
        minCR: 0,
        maxCR: 5,
        flavor: 'monsterProfiles.goblinoid.flavor',
        specialLoot: ['Bag of caltrops', 'Net', 'Hunting trap']
    },

    // Orc - Savage Warriors
    orc: {
        id: 'orc',
        displayName: 'monsterProfiles.orc.displayName',
        icon: '👹',
        carriedItems: ['Heavy weapon', 'War trophy', 'Warchief token', 'Rations'],
        nearbyItems: ['Enemy skulls', 'Tribal banner', 'Captured weapons'],
        hoardTheme: ['brutal', 'tribal', 'bone', 'blood'],
        preferredTypes: ['weapon', 'armor'],
        goldMultiplier: 0.8,
        cursedChance: 0.15,
        minCR: 0,
        maxCR: 8,
        flavor: 'monsterProfiles.orc.flavor',
        specialLoot: ['Javelins', 'Greataxe']
    },

    // Undead - Zombies, Skeletons, Wights
    undead: {
        id: 'undead',
        displayName: 'monsterProfiles.undead.displayName',
        icon: '💀',
        carriedItems: ['Ancient armor', 'Burial jewelry', 'Sword or mace'],
        nearbyItems: ['Tombstone', 'Broken coffin', 'Grave goods', 'Funeral offerings'],
        hoardTheme: ['ancient', 'decayed', 'cursed', 'preserved'],
        preferredTypes: ['armor', 'ring', 'wondrous'],
        goldMultiplier: 0.5,
        cursedChance: 0.35,
        minCR: 0,
        maxCR: 15,
        flavor: 'monsterProfiles.undead.flavor',
        specialLoot: ['Signet ring', 'Love letter', 'Family heirloom']
    },

    // Vampire/Lich - Powerful Undead
    powerfulUndead: {
        id: 'powerfulUndead',
        displayName: 'monsterProfiles.powerfulUndead.displayName',
        icon: '🧛',
        carriedItems: ['Noble clothing', 'Magical ring', 'Ancient medallion'],
        nearbyItems: ['Coffin with gold lining', 'Portrait collection', 'Vintage wine'],
        hoardTheme: ['noble', 'ancient', 'dark', 'elegant'],
        preferredTypes: ['ring', 'wondrous', 'staff', 'wand'],
        goldMultiplier: 3.0,
        cursedChance: 0.40,
        minCR: 10,
        maxCR: 30,
        flavor: 'monsterProfiles.powerfulUndead.flavor'
    },

    // Dragon - The Classic Hoarder
    dragon: {
        id: 'dragon',
        displayName: 'monsterProfiles.dragon.displayName',
        icon: '🐉',
        carriedItems: [],  // Dragons don't carry - they HOARD
        nearbyItems: ['Mountain of gold', 'Knight\'s armor', 'Royal crown', 'Ancient scrolls'],
        hoardTheme: ['magnificent', 'ancient', 'powerful', 'diverse'],
        preferredTypes: ['weapon', 'armor', 'wondrous', 'ring', 'staff'],
        goldMultiplier: 5.0,
        cursedChance: 0.10,
        minCR: 5,
        maxCR: 30,
        flavor: 'monsterProfiles.dragon.flavor',
        specialLoot: ['Dragon scale', 'Dragon tooth', 'Knight\'s holy sword']
    },

    // Giant - Big and Strong
    giant: {
        id: 'giant',
        displayName: 'monsterProfiles.giant.displayName',
        icon: '🗿',
        carriedItems: ['Oversized weapon', 'Boulder bag', 'Giant-sized coins', 'Trophy collection'],
        nearbyItems: ['Livestock bones', 'Crushed cart', 'Human-sized equipment'],
        hoardTheme: ['crude', 'oversized', 'stolen', 'primitive'],
        preferredTypes: ['weapon', 'wondrous'],
        goldMultiplier: 2.0,
        cursedChance: 0.05,
        minCR: 5,
        maxCR: 20,
        flavor: 'monsterProfiles.giant.flavor',
        specialLoot: ['Giant-sized bag', 'Crushed wagon wheel']
    },

    // Beast - Wild Animals
    beast: {
        id: 'beast',
        displayName: 'monsterProfiles.beast.displayName',
        icon: '🐺',
        carriedItems: [],  // Beasts don't carry items
        nearbyItems: ['Previous victim remains', 'Shiny objects in nest', 'Bones'],
        hoardTheme: ['natural', 'bloody', 'savage'],
        preferredTypes: [],  // No preference - just what victims had
        goldMultiplier: 0.3,
        cursedChance: 0.0,
        minCR: 0,
        maxCR: 10,
        flavor: 'monsterProfiles.beast.flavor'
    },

    // Demon/Devil - Fiends
    fiend: {
        id: 'fiend',
        displayName: 'monsterProfiles.fiend.displayName',
        icon: '😈',
        carriedItems: ['Infernal weapon', 'Soul contract', 'Unholy symbol'],
        nearbyItems: ['Torture devices', 'Sacrificial altar', 'Bound souls'],
        hoardTheme: ['infernal', 'cursed', 'dark', 'corrupted'],
        preferredTypes: ['weapon', 'wondrous', 'ring'],
        goldMultiplier: 1.5,
        cursedChance: 0.60,
        minCR: 5,
        maxCR: 30,
        flavor: 'monsterProfiles.fiend.flavor',
        specialLoot: ['Soul coin', 'Infernal contract']
    },

    // Celestial - Angels
    celestial: {
        id: 'celestial',
        displayName: 'monsterProfiles.celestial.displayName',
        icon: '👼',
        carriedItems: ['Holy weapon', 'Divine blessing', 'Celestial armor'],
        nearbyItems: ['Sacred texts', 'Prayer beads', 'Holy water font'],
        hoardTheme: ['holy', 'radiant', 'pure', 'blessed'],
        preferredTypes: ['weapon', 'armor', 'wondrous'],
        goldMultiplier: 1.0,
        cursedChance: 0.0,
        minCR: 5,
        maxCR: 30,
        flavor: 'monsterProfiles.celestial.flavor'
    },

    // Elemental - Pure Elements
    elemental: {
        id: 'elemental',
        displayName: 'monsterProfiles.elemental.displayName',
        icon: '🔥',
        carriedItems: [],  // Pure elementals don't carry items
        nearbyItems: ['Crystallized element', 'Elemental core', 'Magical residue'],
        hoardTheme: ['elemental', 'primal', 'raw'],
        preferredTypes: ['wondrous'],
        goldMultiplier: 0.0,  // No gold, but special materials
        cursedChance: 0.0,
        minCR: 1,
        maxCR: 20,
        flavor: 'monsterProfiles.elemental.flavor',
        specialLoot: ['Elemental gem', 'Primordial essence']
    },

    // Construct - Golems, Animated Objects
    construct: {
        id: 'construct',
        displayName: 'monsterProfiles.construct.displayName',
        icon: '🤖',
        carriedItems: ['Control amulet', 'Power core'],
        nearbyItems: ['Creator\'s notes', 'Spare parts', 'Tools'],
        hoardTheme: ['mechanical', 'arcane', 'crafted'],
        preferredTypes: ['wondrous', 'armor'],
        goldMultiplier: 1.0,
        cursedChance: 0.10,
        minCR: 1,
        maxCR: 20,
        flavor: 'monsterProfiles.construct.flavor',
        specialLoot: ['Control amulet', 'Power core', 'Schematic']
    },

    // Aberration - Mind Flayers, Beholders
    aberration: {
        id: 'aberration',
        displayName: 'monsterProfiles.aberration.displayName',
        icon: '👁️',
        carriedItems: ['Alien artifact', 'Psionic focus', 'Brain jar'],
        nearbyItems: ['Strange geometry', 'Victim collection', 'Bizarre art'],
        hoardTheme: ['alien', 'psionic', 'strange', 'otherworldly'],
        preferredTypes: ['wondrous', 'ring', 'staff'],
        goldMultiplier: 1.5,
        cursedChance: 0.30,
        minCR: 5,
        maxCR: 30,
        flavor: 'monsterProfiles.aberration.flavor',
        specialLoot: ['Illithid skull', 'Beholder eye stalk']
    },

    // Fey - Fairies, Satyrs, Hags
    fey: {
        id: 'fey',
        displayName: 'monsterProfiles.fey.displayName',
        icon: '🧚',
        carriedItems: ['Nature charm', 'Glamour token', 'Moonlight vial'],
        nearbyItems: ['Enchanted flowers', 'Fairy circle components', 'Stolen memories'],
        hoardTheme: ['natural', 'enchanted', 'trickster', 'beautiful'],
        preferredTypes: ['wondrous', 'ring', 'potion'],
        goldMultiplier: 0.5,  // Fey care less about gold
        cursedChance: 0.25,  // Fey curses!
        minCR: 1,
        maxCR: 15,
        flavor: 'monsterProfiles.fey.flavor',
        specialLoot: ['Pixie dust', 'Satyr pipes', 'Hag eye']
    },

    // Plant - Treants, Blights
    plant: {
        id: 'plant',
        displayName: 'monsterProfiles.plant.displayName',
        icon: '🌳',
        carriedItems: [],  // Plants don't carry
        nearbyItems: ['Druid remains', 'Nature shrine offerings', 'Overgrown equipment'],
        hoardTheme: ['natural', 'ancient', 'overgrown'],
        preferredTypes: ['wondrous', 'staff'],
        goldMultiplier: 0.2,
        cursedChance: 0.05,
        minCR: 0,
        maxCR: 15,
        flavor: 'monsterProfiles.plant.flavor'
    },

    // Ooze - Gelatinous Cubes, etc.
    ooze: {
        id: 'ooze',
        displayName: 'monsterProfiles.ooze.displayName',
        icon: '🟢',
        carriedItems: [],  // Dissolved inside
        nearbyItems: ['Undigested metal items', 'Bones', 'Resistant gems'],
        hoardTheme: ['dissolved', 'random', 'dungeon'],
        preferredTypes: [],  // Whatever didn't dissolve
        goldMultiplier: 0.8,  // Some coins survive
        cursedChance: 0.0,
        minCR: 1,
        maxCR: 10,
        flavor: 'monsterProfiles.ooze.flavor',
        specialLoot: ['Acid-resistant ring', 'Gemstone']
    }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getMonsterProfile(monsterType: string): MonsterLootProfile {
    return MONSTER_LOOT_PROFILES[monsterType] || MONSTER_LOOT_PROFILES.humanoid;
}

export function getAllMonsterTypes(): { id: string; displayName: string; icon: string }[] {
    return Object.values(MONSTER_LOOT_PROFILES).map(profile => ({
        id: profile.id,
        displayName: i18n.t(profile.displayName),
        icon: profile.icon
    }));
}

export function getMonsterTypesForCR(cr: number): { id: string; displayName: string; icon: string }[] {
    return Object.values(MONSTER_LOOT_PROFILES)
        .filter(profile => cr >= profile.minCR && cr <= profile.maxCR)
        .map(profile => ({
            id: profile.id,
            displayName: i18n.t(profile.displayName),
            icon: profile.icon
        }));
}
