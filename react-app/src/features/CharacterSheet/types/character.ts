// Character Sheet Types

// Equipment slot identifiers - V2 Layout (11 slots)
export type EquipmentSlotId =
    | 'helmet'
    | 'necklace'
    | 'armor'
    | 'cape'
    | 'mainhand'
    | 'offhand'
    | 'gloves'
    | 'ring1'
    | 'ring2'
    | 'belt'
    | 'boots'
    | 'ranged';

// Slot configuration for UI
export interface SlotConfig {
    id: EquipmentSlotId;
    label: string;
    labelHe: string;
    icon: string;
    acceptTypes: string[]; // Item types that can go in this slot
}

// Equipped item data
export interface EquippedItem {
    uniqueId: string;
    name: string;
    nameHe?: string;
    type: string;
    rarity: string;
    thumbnail: string;        // Card front image
    backThumbnail?: string;   // Card back image
    cardData?: any;           // Full card data for viewing
}

// Character portrait options
export interface CharacterOptions {
    name: string;
    gender: 'male' | 'female' | 'other';
    race: string;
    charClass: string;
    background: string;
    artStyle: string;
    portraitStyle: 'portrait' | 'full_body';
    pose: string;
}

// Full character state
export interface CharacterState {
    // Character info
    name: string;
    portraitUrl: string | null;
    options: CharacterOptions;

    // Equipment (11 slots)
    equipment: Partial<Record<EquipmentSlotId, EquippedItem | null>>;

    // Backpack (18 slots like V2)
    backpack: (EquippedItem | null)[];
}

// Slot mapping configuration - V2 Layout
export const EQUIPMENT_SLOTS: SlotConfig[] = [
    // Row 1: Ranged, Necklace, Helmet, Cape
    { id: 'ranged', label: 'Ranged', labelHe: 'כלי ירייה', icon: 'slot-bow.png', acceptTypes: ['bow', 'crossbow', 'ranged', 'קשת', 'ארבלת'] },
    { id: 'necklace', label: 'Necklace', labelHe: 'שרשרת', icon: 'slot-necklace.png', acceptTypes: ['necklace', 'amulet', 'pendant', 'שרשרת', 'תליון', 'קמע'] },
    { id: 'helmet', label: 'Helmet', labelHe: 'קסדה', icon: 'slot-helmet.png', acceptTypes: ['helmet', 'head', 'hat', 'קסדה', 'כובע', 'ראש'] },
    { id: 'cape', label: 'Cape', labelHe: 'גלימה', icon: 'slot-cape.png', acceptTypes: ['cape', 'cloak', 'back', 'גלימה', 'שכמייה'] },

    // Row 2: Offhand, [Portrait], Mainhand
    { id: 'offhand', label: 'Off Hand', labelHe: 'יד שמאל', icon: 'slot-shield.png', acceptTypes: ['shield', 'offhand', 'weapon', 'מגן', 'נשק'] },
    { id: 'mainhand', label: 'Main Hand', labelHe: 'יד ימין', icon: 'slot-sword.png', acceptTypes: ['sword', 'axe', 'mace', 'weapon', 'melee', 'נשק', 'חרב', 'גרזן', 'אלה'] },

    // Row 3: Armor, [Portrait], Gloves
    { id: 'armor', label: 'Armor', labelHe: 'שריון', icon: 'slot-armor.png', acceptTypes: ['armor', 'chest', 'body', 'שריון', 'גוף'] },
    { id: 'gloves', label: 'Gloves', labelHe: 'כפפות', icon: 'slot-gloves.png', acceptTypes: ['gloves', 'hands', 'gauntlets', 'כפפות', 'ידיים'] },

    // Row 4: Ring1, Belt, Boots, Ring2
    { id: 'ring1', label: 'Ring', labelHe: 'טבעת', icon: 'slot-ring.png', acceptTypes: ['ring', 'טבעת'] },
    { id: 'belt', label: 'Belt', labelHe: 'חגורה', icon: 'slot-belt.png', acceptTypes: ['belt', 'waist', 'חגורה', 'מותניים'] },
    { id: 'boots', label: 'Boots', labelHe: 'מגפיים', icon: 'slot-boots.png', acceptTypes: ['boots', 'feet', 'shoes', 'מגפיים', 'נעליים', 'רגליים'] },
    { id: 'ring2', label: 'Ring', labelHe: 'טבעת', icon: 'slot-ring.png', acceptTypes: ['ring', 'טבעת'] },
];

// Initial empty state
export const INITIAL_CHARACTER_STATE: CharacterState = {
    name: '',
    portraitUrl: null,
    options: {
        name: '',
        gender: 'male',
        race: 'human',
        charClass: 'fighter',
        background: '',
        artStyle: 'oil_painting',
        portraitStyle: 'portrait',
        pose: 'heroic',
    },
    equipment: {},
    backpack: Array(32).fill(null),
};

// Backpack size
export const BACKPACK_SIZE = 32;
