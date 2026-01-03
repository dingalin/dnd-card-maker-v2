/**
 * Central Configuration for D&D Card Creator
 * All constants and settings in one place for easy maintenance
 */

// API Configuration
export const API = {
    WORKER_URL: 'https://dnd-api-proxy.dingalin2000.workers.dev/',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3
};

// Canvas Configuration
export const CANVAS = {
    WIDTH: 750,
    HEIGHT: 1050,
    ASPECT_RATIO: 750 / 1050 // ~0.714
};

// Storage Configuration
export const STORAGE = {
    MAX_HISTORY_ITEMS: 100,
    LOCAL_STORAGE_KEYS: {
        CURRENT_CARD: 'dnd_current_card',
        API_KEY: 'getimg_api_key',
        GEMINI_KEY: 'gemini_api_key',
        LOCALE: 'dnd_locale'
    },
    DB_NAME: 'DnDCardCreator',
    DB_VERSION: 1
};

// Default Card Settings
export const CARD_DEFAULTS = {
    FRONT: {
        FONT_SIZES: {
            name: 64,
            type: 24,
            rarity: 24,
            stats: 32,
            coreStats: 42,
            gold: 32
        },
        OFFSETS: {
            name: -10,
            type: -50,
            rarity: -110,
            stats: 780,
            coreStats: 680,
            gold: 15
        }
    },
    BACK: {
        FONT_SIZES: {
            abilityName: 52,
            mech: 32,
            lore: 24
        },
        OFFSETS: {
            abilityName: 140,
            mech: 220,
            lore: 880
        }
    }
};

// Rarity Levels
export const RARITY = {
    COMMON: 'Common',
    UNCOMMON: 'Uncommon',
    RARE: 'Rare',
    VERY_RARE: 'Very Rare',
    LEGENDARY: 'Legendary'
};

// Item Types
export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    WONDROUS: 'wondrous',
    RING: 'ring',
    POTION: 'potion',
    SCROLL: 'scroll'
};

// Character Slots
export const CHARACTER_SLOTS = [
    'helmet', 'armor', 'mainhand', 'offhand', 'ranged',
    'ring1', 'ring2', 'necklace', 'cape', 'boots', 'belt', 'gloves', 'ammo'
];

// UI Configuration
export const UI = {
    TOAST_DURATION_MS: 3000,
    DEBOUNCE_MS: 300,
    ANIMATION_DURATION_MS: 300
};

// Export all as default object for convenience
export default {
    API,
    CANVAS,
    STORAGE,
    CARD_DEFAULTS,
    RARITY,
    ITEM_TYPES,
    CHARACTER_SLOTS,
    UI
};
