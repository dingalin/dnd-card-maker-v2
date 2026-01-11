/**
 * Core Type Definitions for D&D Card Creator (React Migration)
 * Migrated from original src/types/index.d.ts and src/types/card.ts
 */

// ============== CARD DATA ==============

/**
 * Front side of a card
 */
export interface CardFront {
    title: string;
    type: string;
    rarity: string;
    imageUrl?: string | null;
    imageStyle?: string;
    quickStats?: string;
    gold?: string;
    badges?: string[];
}

/**
 * Back side of a card
 */
export interface CardBack {
    title: string;
    mechanics: string;
    lore: string;
    imageUrl?: string | null;
    capturedBackImage?: string | null;
}

/**
 * Full card data structure (V2 format)
 */
export interface CardData {
    id?: number | string;
    timestamp?: number;

    // V2 style (nested) - PREFERRED
    front?: CardFront;
    back?: CardBack;

    // V1 style (flat) - Legacy support
    name?: string;
    typeHe?: string;
    rarityHe?: string;
    quickStats?: string;
    gold?: string;
    imageUrl?: string | null;
    itemImageUrl?: string | null; // AI-generated item image
    backgroundUrl?: string | null; // AI-generated card background/frame

    // Back side (V1 style)
    abilityName?: string;
    abilityDesc?: string;
    description?: string;

    // Weapon/Armor stats
    weaponDamage?: string;
    damageType?: string;
    armorClass?: string;
    versatileDamage?: string | null;
    weaponProperties?: string[];

    // Quick-glance stats
    specialDamage?: string;
    spellAbility?: string;

    // Metadata
    savedAt?: string;
    type?: string;
    subtype?: string;
    rarity?: string;
    legacy?: boolean;
    imageStyle?: string;
}

// ============== FONT SIZES ==============

export interface FrontFontSizes {
    nameSize: number;
    typeSize: number;
    raritySize: number;
    statsSize: number;
    coreStatsSize: number;
    goldSize: number;
    [key: string]: number;
}

export interface BackFontSizes {
    abilityNameSize: number;
    mechSize: number;
    loreSize: number;
    [key: string]: number;
}

export type FontSizes = Partial<FrontFontSizes & BackFontSizes>;

// ============== OFFSETS ==============

export interface FrontOffsets {
    name: number;
    type: number;
    rarity: number;
    stats: number;
    coreStats: number;
    gold: number;
    imageXOffset: number;
    imageYOffset: number;
    imageScale: number;
    imageRotation: number;
    imageFade: number;
    imageShadow: number;
    backgroundScale: number;
    centerFade: number;
    nameWidth: number;
    typeWidth: number;
    rarityWidth: number;
    coreStatsWidth: number;
    statsWidth: number;
    goldWidth: number;
    template?: string;
    [key: string]: number | string | undefined;
}

export interface BackOffsets {
    abilityName: number;
    mech: number;
    lore: number;
    mechWidth: number;
    loreWidth: number;
    template?: string;
    [key: string]: number | string | undefined;
}

export type Offsets = Partial<FrontOffsets & BackOffsets>;

// ============== STYLE SETTINGS ==============

export interface StyleSettings {
    fontFamily: string;
    imageStyle: 'natural' | 'vignette' | 'glow' | 'silhouette';
    imageColor: string;
    textOutlineEnabled: boolean;
    textOutlineWidth: number;
    textShadowEnabled: boolean;
    textShadowBlur: number;
    textBackdropEnabled: boolean;
    textBackdropOpacity: number;
    cardBackgroundUrl?: string;
    [key: string]: string | number | boolean | undefined;
}

// ============== FONT STYLES ==============

export interface FontStyles {
    [key: string]: boolean;
}

// ============== SIDE SETTINGS ==============

export interface SideSettings {
    offsets: Offsets;
    fontSizes: FontSizes;
    fontStyles: FontStyles;
    customStyles: Record<string, any>;
}

// ============== APP SETTINGS ==============

export interface AppSettings {
    front: {
        offsets: Partial<FrontOffsets>;
        fontSizes: Partial<FrontFontSizes>;
        fontStyles: FontStyles;
        customStyles: Record<string, any>;
    };
    back: {
        offsets: Partial<BackOffsets>;
        fontSizes: Partial<BackFontSizes>;
        fontStyles: FontStyles;
        customStyles: Record<string, any>;
    };
    style: Partial<StyleSettings>;
}

// ============== RENDER OPTIONS ==============

export interface RenderOptions {
    // Font sizes
    fontSizes?: FontSizes;
    fontStyles?: FontStyles;
    fontFamily?: string;

    // Offsets (position adjustments)
    name?: number;
    type?: number;
    rarity?: number;
    stats?: number;
    coreStats?: number;
    gold?: number;
    abilityName?: number;
    mech?: number;
    lore?: number;

    // Image settings
    imageYOffset?: number;
    imageScale?: number;
    imageRotation?: number;
    imageFade?: number;
    imageShadow?: number;
    imageStyle?: string;
    imageColor?: string;

    // Widths
    nameWidth?: number;
    typeWidth?: number;
    rarityWidth?: number;
    coreStatsWidth?: number;
    statsWidth?: number;
    goldWidth?: number;
    mechWidth?: number;
    loreWidth?: number;

    // Background
    backgroundScale?: number;
    centerFade?: number;

    // Text effects
    textOutlineEnabled?: boolean;
    textOutlineWidth?: number;
    textShadowEnabled?: boolean;
    textShadowBlur?: number;
    textBackdropEnabled?: boolean;
    textBackdropOpacity?: number;

    // Local image
    useLocalImage?: boolean;
    localImageBase64?: string;
}

// ============== APP STATE ==============

export interface AppState {
    cardData: CardData | null;
    isFlipped: boolean;
    isEditMode?: boolean;
    settings: AppSettings;
    lastContext?: unknown | null;
    lastVisualPrompt?: string | null;
}

// ============== HISTORY ITEM ==============

export interface HistoryItem {
    id: number;
    name: string;
    cardData: CardData;
    settings: AppSettings;
    thumbnail: string | null;
    savedAt: string;
}

// ============== THUMBNAIL RESULT ==============

export interface ThumbnailResult {
    front: string;
    back: string | null;
}
