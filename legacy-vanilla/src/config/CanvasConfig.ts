/**
 * CanvasConfig.ts
 * Centralized canvas dimensions and base element positions
 * This is the SINGLE SOURCE OF TRUTH for card rendering dimensions
 * 
 * When changing card dimensions:
 * 1. Update CANVAS values here
 * 2. All renderers will use these values
 */

// ==================== CANVAS DIMENSIONS ====================
export const CANVAS = {
    /** 
     * Fixed canvas width in pixels
     * All backgrounds are stretched to fit this width
     */
    WIDTH: 1000,

    /**
     * Fixed canvas height in pixels
     * All backgrounds are stretched to fit this height
     */
    HEIGHT: 1400,

    /**
     * Aspect ratio (width / height)
     */
    get ASPECT_RATIO() {
        return this.WIDTH / this.HEIGHT;
    }
};

// ==================== BACKGROUND IMAGE DIMENSIONS ====================
export const BACKGROUND = {
    /**
     * High-resolution background generation size
     * Used in BackgroundManager.generateHighResSlice()
     */
    WIDTH: 1000,
    HEIGHT: 1500,
};

// ==================== FRONT CARD BASE POSITIONS ====================
/**
 * Base Y positions for text elements on the front of the card
 * The actual position is: BASE_Y + offset (from slider)
 */
export const FRONT_BASE_POSITIONS = {
    // Formula: actualY = baseY + sliderOffset
    rarity: { baseY: 100, description: 'נדירות - top of card' },
    type: { baseY: 140, description: 'סוג - below rarity' },
    name: { baseY: 200, description: 'שם - main title area' },
    coreStats: { baseY: 0, description: 'נזק/דרג"ש - offset is absolute Y' },
    stats: { baseY: 0, description: 'תיאור קצר - offset is absolute Y' },
    gold: { baseY: 920, description: 'מחיר - near bottom' },
};

// ==================== BACK CARD BASE POSITIONS ====================
export const BACK_BASE_POSITIONS = {
    abilityName: { baseY: 80, description: 'שם יכולת - top' },
    mech: { baseY: 200, description: 'מכניקה - middle' },
    lore: { baseY: 600, description: 'לור - bottom' },
};

// ==================== TEXT RENDERING DEFAULTS ====================
export const TEXT_DEFAULTS = {
    FONT_FAMILY: 'Heebo',
    TEXT_COLOR: '#2c1810',
    STATS_COLOR: '#1a1a1a',
};

// ==================== COMBINED EXPORT ====================
export const CANVAS_CONFIG = {
    canvas: CANVAS,
    background: BACKGROUND,
    frontPositions: FRONT_BASE_POSITIONS,
    backPositions: BACK_BASE_POSITIONS,
    textDefaults: TEXT_DEFAULTS,
};

export default CANVAS_CONFIG;
