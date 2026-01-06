/**
 * SliderLimits.ts
 * Centralized min/max limits for all sliders in the application
 * This is the SINGLE SOURCE OF TRUTH for slider ranges
 * 
 * When adding a new slider:
 * 1. Add its limits here
 * 2. Reference SLIDER_LIMITS in the relevant components
 */

export interface SliderLimit {
    min: number;
    max: number;
    default: number;
    step?: number;
}

// ==================== FRONT SIDE OFFSET SLIDERS ====================
export const FRONT_OFFSET_LIMITS: Record<string, SliderLimit> = {
    // Position (Y) sliders - control vertical position of elements
    'name-offset': { min: -100, max: 200, default: 80 },
    'type-offset': { min: -100, max: 200, default: 71 },
    'rarity-offset': { min: -100, max: 200, default: 50 },
    'coreStats-offset': { min: 600, max: 1350, default: 893 },
    'stats-offset': { min: 600, max: 1350, default: 969 },
    'gold-offset': { min: 0, max: 480, default: 111 },

    // Width sliders - control text width
    'name-width': { min: 100, max: 800, default: 450 },
    'type-width': { min: 200, max: 700, default: 450 },
    'coreStats-width': { min: 100, max: 800, default: 537 },
    'stats-width': { min: 100, max: 800, default: 450 },
};

// ==================== BACK SIDE OFFSET SLIDERS ====================
export const BACK_OFFSET_LIMITS: Record<string, SliderLimit> = {
    'ability-offset': { min: 0, max: 400, default: 130 },
    'mech-offset': { min: 0, max: 800, default: 295 },
    'lore-offset': { min: 0, max: 1200, default: 700 },
    'ability-width': { min: 100, max: 800, default: 550 },
    'lore-width': { min: 100, max: 800, default: 550 },
};

// ==================== IMAGE SLIDERS ====================
export const IMAGE_SLIDER_LIMITS: Record<string, SliderLimit> = {
    'image-offset': { min: -400, max: 400, default: 0 },
    'image-scale': { min: 0.1, max: 2.0, default: 0.8, step: 0.01 },
    'image-rotation': { min: -180, max: 180, default: 0 },
    'image-fade': { min: 0, max: 100, default: 100 },
    'image-shadow': { min: 0, max: 100, default: 78 },
    'background-scale': { min: 0.5, max: 1.5, default: 1.0, step: 0.01 },
    'center-fade': { min: 0, max: 100, default: 0 },
};

// ==================== TEXT EFFECT SLIDERS ====================
export const TEXT_EFFECT_LIMITS: Record<string, SliderLimit> = {
    'text-outline-width': { min: 1, max: 10, default: 2 },
    'text-shadow-blur': { min: 1, max: 20, default: 4 },
    'text-backdrop-opacity': { min: 0, max: 100, default: 40 },
};

// ==================== GLOBAL MARGIN SLIDERS ====================
export const GLOBAL_MARGIN_LIMITS: Record<string, SliderLimit> = {
    'global-margin-y': { min: 450, max: 969, default: 710 },
    'global-margin-x': { min: 0, max: 200, default: 100 },
};

// ==================== COMBINED EXPORT ====================
export const SLIDER_LIMITS = {
    front: FRONT_OFFSET_LIMITS,
    back: BACK_OFFSET_LIMITS,
    image: IMAGE_SLIDER_LIMITS,
    textEffects: TEXT_EFFECT_LIMITS,
    globalMargins: GLOBAL_MARGIN_LIMITS,
};

/**
 * Helper function to get limits for a slider by ID
 */
export function getSliderLimits(sliderId: string): SliderLimit | undefined {
    // Search in all limit categories
    const allLimits = {
        ...FRONT_OFFSET_LIMITS,
        ...BACK_OFFSET_LIMITS,
        ...IMAGE_SLIDER_LIMITS,
        ...TEXT_EFFECT_LIMITS,
        ...GLOBAL_MARGIN_LIMITS,
    };
    return allLimits[sliderId];
}

export default SLIDER_LIMITS;
