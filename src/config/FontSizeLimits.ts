/**
 * FontSizeLimits.ts
 * Centralized min/max limits for all font sizes in the application
 * This is the SINGLE SOURCE OF TRUTH for font size ranges
 * 
 * When adding a new text element:
 * 1. Add its limits here
 * 2. The updateFontSize() in state.ts will use these limits
 */

export interface FontSizeLimit {
    min: number;
    max: number;
    default: number;
    step?: number;
}

// ==================== FRONT SIDE FONT SIZES ====================
export const FRONT_FONT_LIMITS: Record<string, FontSizeLimit> = {
    // Element name format: [elementName]Size
    nameSize: { min: 16, max: 120, default: 64 },       // שם החפץ - large, prominent
    typeSize: { min: 12, max: 72, default: 24 },        // סוג החפץ
    raritySize: { min: 12, max: 72, default: 24 },      // נדירות
    coreStatsSize: { min: 16, max: 96, default: 42 },   // נזק/דרג"ש - important stat
    statsSize: { min: 12, max: 72, default: 28 },       // תיאור קצר
    goldSize: { min: 12, max: 72, default: 24 },        // מחיר
};

// ==================== BACK SIDE FONT SIZES ====================
export const BACK_FONT_LIMITS: Record<string, FontSizeLimit> = {
    abilityNameSize: { min: 16, max: 96, default: 36 }, // שם היכולת
    mechSize: { min: 12, max: 64, default: 24 },        // מכניקה
    loreSize: { min: 12, max: 64, default: 20 },        // לור/סיפור
};

// ==================== COMBINED EXPORT ====================
export const FONT_SIZE_LIMITS = {
    front: FRONT_FONT_LIMITS,
    back: BACK_FONT_LIMITS,
};

/**
 * Helper function to get limits for a font size by key
 */
export function getFontSizeLimits(key: string): FontSizeLimit | undefined {
    return FRONT_FONT_LIMITS[key] || BACK_FONT_LIMITS[key];
}

/**
 * Clamp a font size value within its defined limits
 */
export function clampFontSize(key: string, value: number): number {
    const limits = getFontSizeLimits(key);
    if (!limits) return value;
    return Math.max(limits.min, Math.min(limits.max, value));
}

export default FONT_SIZE_LIMITS;
