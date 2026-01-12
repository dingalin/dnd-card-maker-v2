/**
 * LayoutCalculator - Smart layout algorithm for D&D cards
 * Calculates optimal positions for all card elements based on content
 * 
 * RENDERER BASE POSITIONS (after fix):
 * - rarity: Y = 100 + offset (TOP)
 * - type: Y = 140 + offset (below rarity)  
 * - name: Y = 200 + offset (below type)
 * - image: baseY = 230 + offset
 * - coreStats: Y = offset || 680 (ABSOLUTE)
 * - stats: Y = offset || 780 (ABSOLUTE)
 * - gold: Y = 920 + offset (bottom)
 */

import { SafeAreaBox } from './SafeAreaDetector';
import { FRONT_OFFSETS, GLOBAL_MARGINS } from '../config/SliderDefaults';

export interface LayoutOffsets {
    rarity?: number;
    type?: number;
    name?: number;
    imageYOffset?: number;
    coreStats?: number;
    stats?: number;
    gold?: number;
    nameWidth?: number;
    typeWidth?: number;
    rarityWidth?: number;
    coreStatsWidth?: number;
    statsWidth?: number;
    goldWidth?: number;
    [key: string]: number | undefined;
}

export interface ImageSettings {
    scale?: number;
    [key: string]: any;
}

export interface FontSizes {
    name?: number;
    [key: string]: number | undefined;
}

export interface LayoutResult {
    offsets: LayoutOffsets;
    fontSizes: FontSizes;
    imageSettings: ImageSettings;
}

export interface CardData {
    front?: {
        title?: string;
        type?: string;
        quickStats?: string;
    };
    name?: string;
    typeHe?: string;
    quickStats?: string;
    weaponDamage?: string;
    armorClass?: number | string;
    [key: string]: any;
}

export class LayoutCalculator {
    // Canvas dimensions (750x1050)
    static CARD_WIDTH = 750;
    static CARD_HEIGHT = 1050;

    /**
     * DEFAULT LAYOUT VALUES - imported from centralized SliderDefaults.ts
     * DO NOT hardcode values here - use SLIDER_DEFAULTS as the single source of truth
     */
    static SLIDER_MIDPOINTS = {
        // Position offsets - from centralized config
        ...FRONT_OFFSETS,
        // Global margins
        globalMarginX: GLOBAL_MARGINS.x,
        globalMarginY: GLOBAL_MARGINS.y,
    };

    // Safe content area (inside frame decorations)
    static SAFE_AREA = {
        top: 80,       // Below top frame
        bottom: 920,   // Above bottom frame (gold area)
        left: 70,      // Inside left frame
        right: 680     // Inside right frame
    };

    // NEW Renderer base positions (after fix)
    static BASE_POSITIONS = {
        rarity: 100,    // TOP
        type: 140,      // Below rarity
        name: 200,      // Below type
        image: 230,     // Image baseY
        coreStats: 680, // Damage/AC (absolute)
        stats: 780,     // Quick stats (absolute)
        gold: 920       // Bottom
    };

    /**
     * Calculate optimal layout for card elements
     */
    static calculateLayout(cardData: CardData, currentSettings: any = {}): LayoutResult {
        // Unused args
        // const _settings = currentSettings;
        const result: LayoutResult = {
            offsets: {},
            fontSizes: {},
            imageSettings: {}
        };

        // Destructure essential properties
        // const { type, subtype, ability } = cardData; // Unused

        // Get content info
        const name = cardData.front?.title || cardData.name || '';
        // const _type = cardData.front?.type || cardData.typeHe || ''; // Unused
        const hasStats = !!(cardData.weaponDamage || cardData.armorClass);
        // const _quickStats = cardData.front?.quickStats || cardData.quickStats || ''; // Unused

        // Calculate name font size based on length
        result.fontSizes.name = this.calculateNameFontSize(name);

        // === CALCULATE OFFSETS ===
        // Values from CardTextConfig.ts via SLIDER_MIDPOINTS

        // Header elements
        result.offsets.rarity = this.SLIDER_MIDPOINTS.rarity;
        result.offsets.type = this.SLIDER_MIDPOINTS.type;
        result.offsets.name = this.SLIDER_MIDPOINTS.name;

        // Image positioning
        result.offsets.imageYOffset = this.SLIDER_MIDPOINTS.imageYOffset;
        result.imageSettings.scale = this.SLIDER_MIDPOINTS.imageScale;

        // Stats positions (absolute Y values)
        result.offsets.coreStats = hasStats ? this.SLIDER_MIDPOINTS.coreStats : 0;
        result.offsets.stats = this.SLIDER_MIDPOINTS.stats;

        // Gold
        result.offsets.gold = this.SLIDER_MIDPOINTS.gold;

        return result;
    }

    /**
     * Calculate name font size based on text length
     */
    static calculateNameFontSize(name: string): number {
        const len = name.length;
        if (len <= 6) return 56;
        if (len <= 10) return 52;
        if (len <= 14) return 46;
        if (len <= 18) return 42;
        return 38;
    }

    /**
     * Calculate DEFAULT layout - sets all sliders to user's preferred default values
     * This is the layout used when a new card is created
     * 
     * @param cardData - Current card data (for calculating font size based on name)
     * @returns LayoutResult with default values for all offsets
     */
    static calculateMiddleLayout(cardData: CardData): LayoutResult {
        const result: LayoutResult = {
            offsets: {},
            fontSizes: {},
            imageSettings: {}
        };

        const name = cardData.front?.title || cardData.name || '';

        // Calculate font size based on name length (this logic stays the same)
        result.fontSizes.name = this.calculateNameFontSize(name);

        // === SET ALL SLIDERS TO DEFAULT VALUES ===
        // These are the user's preferred positions for a new card

        // Position offsets
        result.offsets.rarity = this.SLIDER_MIDPOINTS.rarity;
        result.offsets.type = this.SLIDER_MIDPOINTS.type;
        result.offsets.name = this.SLIDER_MIDPOINTS.name;
        result.offsets.imageYOffset = this.SLIDER_MIDPOINTS.imageYOffset;
        result.offsets.coreStats = this.SLIDER_MIDPOINTS.coreStats;
        result.offsets.stats = this.SLIDER_MIDPOINTS.stats;
        result.offsets.gold = this.SLIDER_MIDPOINTS.gold;

        // Width settings
        result.offsets.nameWidth = this.SLIDER_MIDPOINTS.nameWidth;
        result.offsets.typeWidth = this.SLIDER_MIDPOINTS.typeWidth;
        result.offsets.coreStatsWidth = this.SLIDER_MIDPOINTS.coreStatsWidth;
        result.offsets.statsWidth = this.SLIDER_MIDPOINTS.statsWidth;

        // Image settings
        result.imageSettings.scale = this.SLIDER_MIDPOINTS.imageScale;
        result.imageSettings.fade = this.SLIDER_MIDPOINTS.imageFade;
        result.imageSettings.shadow = this.SLIDER_MIDPOINTS.imageShadow;

        // Global margins
        result.offsets.globalMarginX = this.SLIDER_MIDPOINTS.globalMarginX;
        result.offsets.globalMarginY = this.SLIDER_MIDPOINTS.globalMarginY;

        console.log('LayoutCalculator: Using DEFAULT layout:', {
            offsets: result.offsets,
            fontSizes: result.fontSizes,
            imageSettings: result.imageSettings
        });

        return result;
    }

    /**
     * Calculate layout using a detected safe area
     * SIMPLE PROPORTIONAL: positions are percentages of safe area height
     */
    static calculateLayoutWithSafeArea(cardData: CardData, safeArea: SafeAreaBox, currentSettings: any = {}): LayoutResult {
        const result: LayoutResult = {
            offsets: {},
            fontSizes: {},
            imageSettings: {}
        };

        const name = cardData.front?.title || cardData.name || '';
        const hasStats = !!(cardData.weaponDamage || cardData.armorClass);
        const hasQuickStats = !!(cardData.front?.quickStats || cardData.quickStats);

        // Safe area bounds
        const safeTop = safeArea.top;
        const safeBottom = safeArea.bottom;
        const safeLeft = safeArea.left || 70;
        const safeRight = safeArea.right || 680;
        const safeHeight = safeBottom - safeTop;
        const safeWidth = safeRight - safeLeft;

        // Calculate max text width based on safe area (with 8% padding on each side)
        const maxTextWidth = Math.round(safeWidth * 0.84);

        console.log(`LayoutCalculator: Safe area X:${safeLeft}-${safeRight} Y:${safeTop}-${safeBottom} (${safeWidth}x${safeHeight})`);

        // === COMPACT TEXT LAYOUT ===
        // Header elements close together at top, bottom elements close together at bottom
        // Leaves maximum space for image in the center
        // === COMPACT TEXT LAYOUT ===
        // Tweaked for better separation based on user feedback
        const RATIOS = {
            rarity: 0.03,      // 3% 
            type: 0.20,        // 20% (Pushed down)
            name: 0.26,        // 26% (Pushed down)
            imageCenter: 0.45, // 45% (Centered)
            coreStats: 1.1,    // 110% (Below safe area - Damage)
            quickStats: 1.2,   // 120% (Below damage)
            gold: 1.25         // 125% (Bottom)
        };

        // === CALCULATE ABSOLUTE Y POSITIONS ===
        const rarityY = safeTop + (RATIOS.rarity * safeHeight);
        const typeY = safeTop + (RATIOS.type * safeHeight);
        const nameY = safeTop + (RATIOS.name * safeHeight);
        const imageCenterY = safeTop + (RATIOS.imageCenter * safeHeight);
        const quickStatsY = safeTop + (RATIOS.quickStats * safeHeight);
        const coreStatsY = safeTop + (RATIOS.coreStats * safeHeight);
        const goldY = safeTop + (RATIOS.gold * safeHeight);

        // === CONVERT TO OFFSETS (relative to renderer base positions) ===
        // Renderer draws at: rarity=100, type=140, name=200, gold=920
        result.offsets.rarity = Math.round(rarityY - 100);
        result.offsets.type = Math.round(typeY - 140);
        result.offsets.name = Math.round(nameY - 200);

        // Image: center is at base 230 + 150 = 380
        result.offsets.imageYOffset = Math.round(imageCenterY - 380);

        // Image scale proportional to safe area height
        const refHeight = 840;
        const scaleRatio = safeHeight / refHeight;
        // Reduced max scale to 1.15 to ensure clean text separation by default
        result.imageSettings.scale = Math.max(0.8, Math.min(1.4, 1.15 * scaleRatio));

        // Stats are absolute Y positions
        result.offsets.stats = hasQuickStats ? Math.round(quickStatsY) : 0;
        result.offsets.coreStats = hasStats ? Math.round(coreStatsY) : 0;

        // Gold
        result.offsets.gold = Math.round(goldY - 920);

        // Set all text widths to respect safe area bounds
        result.offsets.nameWidth = maxTextWidth;
        result.offsets.typeWidth = maxTextWidth;
        result.offsets.rarityWidth = maxTextWidth;
        result.offsets.coreStatsWidth = maxTextWidth;
        result.offsets.statsWidth = maxTextWidth;
        result.offsets.goldWidth = maxTextWidth;

        // Font size
        result.fontSizes.name = this.calculateNameFontSize(name);
        if (scaleRatio < 0.9) {
            if (typeof result.fontSizes.name === 'number')
                result.fontSizes.name = Math.round(result.fontSizes.name * 0.9);
        }

        console.log('LayoutCalculator: Simple proportional layout:', {
            safeArea: { top: safeTop, bottom: safeBottom, height: safeHeight },
            positions: { rarityY, typeY, nameY, imageCenterY },
            offsets: result.offsets,
            imageScale: result.imageSettings.scale?.toFixed(2)
        });

        return result;
    }

    /**
     * This method is no longer used in the new layout logic.
     * It's kept for reference or if a more dynamic vertical layout is needed later.
     */
    static calculateVerticalLayout(contentInfo: any): any {
        return {}; // Return empty object as this method is no longer actively used
    }

    /**
     * Apply calculated layout to state
     */
    static applyLayout(stateManager: any, layout: LayoutResult): void {
        // Apply offsets
        for (const [key, value] of Object.entries(layout.offsets)) {
            if (typeof value === 'number') {
                stateManager.updateOffset(key, value);
            }
        }

        // Apply font sizes
        for (const [key, delta] of Object.entries(layout.fontSizes)) {
            if (key === 'name' && typeof delta === 'number') {
                // Calculate delta from default (56)
                const deltaFromDefault = delta - 56;
                if (deltaFromDefault !== 0) {
                    stateManager.updateFontSize('name', deltaFromDefault);
                }
            }
        }

        // Apply image settings
        if (layout.imageSettings.scale) {
            stateManager.updateOffset('imageScale', layout.imageSettings.scale);
        }
    }
}

export default LayoutCalculator;
