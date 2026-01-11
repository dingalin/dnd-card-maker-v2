/**
 * FontSizeLimits.ts - Re-exports from CardTextConfig.ts
 * 
 * This file exists for BACKWARDS COMPATIBILITY only.
 * All values are now defined in CardTextConfig.ts
 * 
 * DO NOT edit values here - edit CardTextConfig.ts instead!
 */

import {
    FONT_SIZE_LIMITS as CONFIG_FONT_SIZE_LIMITS,
    type SliderLimit as ConfigSliderLimit
} from './CardTextConfig';

// Re-export type
export type FontSizeLimit = ConfigSliderLimit;

// Extract front/back limits for backwards compatibility
export const FRONT_FONT_LIMITS: Record<string, FontSizeLimit> = {
    nameSize: CONFIG_FONT_SIZE_LIMITS.nameSize,
    typeSize: CONFIG_FONT_SIZE_LIMITS.typeSize,
    raritySize: CONFIG_FONT_SIZE_LIMITS.raritySize,
    coreStatsSize: CONFIG_FONT_SIZE_LIMITS.coreStatsSize,
    statsSize: CONFIG_FONT_SIZE_LIMITS.statsSize,
    goldSize: CONFIG_FONT_SIZE_LIMITS.goldSize,
};

export const BACK_FONT_LIMITS: Record<string, FontSizeLimit> = {
    abilityNameSize: CONFIG_FONT_SIZE_LIMITS.abilityNameSize,
    mechSize: CONFIG_FONT_SIZE_LIMITS.mechSize,
    loreSize: CONFIG_FONT_SIZE_LIMITS.loreSize,
};

export const FONT_SIZE_LIMITS = {
    front: FRONT_FONT_LIMITS,
    back: BACK_FONT_LIMITS,
};

/**
 * Helper function to get limits for a font size by key
 */
export function getFontSizeLimits(key: string): FontSizeLimit | undefined {
    return CONFIG_FONT_SIZE_LIMITS[key];
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
