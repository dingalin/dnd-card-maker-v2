/**
 * SliderDefaults.ts - Single Source of Truth for all slider DEFAULT values
 * 
 * This file defines the DEFAULT values for sliders (used on reset).
 * For MIN/MAX LIMITS, see SliderLimits.ts
 * 
 * Config Structure:
 * - SliderDefaults.ts  → Default values (this file)
 * - SliderLimits.ts    → Min/max ranges
 * - FontSizeLimits.ts  → Font size min/max
 * - CanvasConfig.ts    → Canvas dimensions
 * 
 * DO NOT hardcode these values anywhere else in the codebase!
 */

/**
 * Front side offset defaults
 * These control the Y-position of text elements on the card
 */
export const FRONT_OFFSETS = {
    // Text positions (Y coordinate or offset)
    rarity: 50,          // נדירות - position slider: min=-100, max=200
    type: 71,            // סוג - position slider: min=-100, max=200
    name: 80,            // שם החפץ - position slider: min=-100, max=200
    coreStats: 893,      // נזק/דרג"ש - position slider: min=600, max=1100
    stats: 969,          // תיאור קצר - position slider: min=600, max=1200
    gold: 111,           // מחיר - position slider: min=0, max=200

    // Text widths
    nameWidth: 450,      // רוחב שם - width slider: min=100, max=800
    typeWidth: 450,      // רוחב סוג - width slider: min=200, max=700
    rarityWidth: 500,    // רוחב נדירות (no slider in HTML)
    coreStatsWidth: 537, // רוחב נזק/דרג"ש - width slider: min=100, max=800
    statsWidth: 450,     // רוחב תיאור - width slider: min=100, max=800
    goldWidth: 500,      // רוחב מחיר (no slider in HTML)

    // Image settings
    imageYOffset: 0,     // מיקום תמונה - slider: min=-150, max=150
    imageScale: 0.8,     // זום - slider: min=0.5, max=2.0, step=0.1
    imageRotation: 0,    // סיבוב - slider: min=-180, max=180, step=5
    imageFade: 100,      // עמעום מסגרת - slider: min=0, max=100
    imageShadow: 78,     // הצללה - slider: min=0, max=100
    backgroundScale: 1.0 // גודל רקע - slider: min=1.0, max=2.0, step=0.1
} as const;

/**
 * Front side font size defaults
 */
export const FRONT_FONT_SIZES = {
    nameSize: 68,        // שם החפץ
    typeSize: 50,        // סוג
    raritySize: 46,      // נדירות
    statsSize: 52,       // תיאור קצר
    coreStatsSize: 60,   // נזק/דרג"ש
    goldSize: 38         // מחיר
} as const;

/**
 * Front side font style defaults
 */
export const FRONT_FONT_STYLES = {
    nameBold: true, nameItalic: false,
    typeBold: false, typeItalic: false,
    rarityBold: false, rarityItalic: false,
    statsBold: true, statsItalic: false,
    coreStatsBold: true, coreStatsItalic: false,
    goldBold: true, goldItalic: false
} as const;

/**
 * Back side offset defaults
 */
export const BACK_OFFSETS = {
    abilityName: 140,    // שם יכולת - slider: min=50, max=250
    mech: 220,           // מכניקה - slider: min=100, max=400
    lore: 880,           // לור - slider: min=400, max=1100
    mechWidth: 600,      // רוחב מכניקה - slider: min=100, max=800
    loreWidth: 550       // רוחב לור - slider: min=100, max=800
} as const;

/**
 * Back side font size defaults
 */
export const BACK_FONT_SIZES = {
    abilityNameSize: 52,
    mechSize: 32,
    loreSize: 24
} as const;

/**
 * Back side font style defaults
 */
export const BACK_FONT_STYLES = {
    abilityNameBold: true, abilityNameItalic: false,
    mechBold: false, mechItalic: false,
    loreBold: false, loreItalic: true
} as const;

/**
 * Global margin defaults (for image shrink controls)
 */
export const GLOBAL_MARGINS = {
    x: 6,  // כיווץ אופקי - slider: min=-100, max=100
    y: 6   // כיווץ אנכי - slider: min=-100, max=100
} as const;

/**
 * Combined defaults for easy import
 */
export const SLIDER_DEFAULTS = {
    front: {
        offsets: FRONT_OFFSETS,
        fontSizes: FRONT_FONT_SIZES,
        fontStyles: FRONT_FONT_STYLES
    },
    back: {
        offsets: BACK_OFFSETS,
        fontSizes: BACK_FONT_SIZES,
        fontStyles: BACK_FONT_STYLES
    },
    globalMargins: GLOBAL_MARGINS
} as const;

export default SLIDER_DEFAULTS;
