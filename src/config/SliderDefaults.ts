/**
 * SliderDefaults.ts - Re-exports from CardTextConfig.ts
 * 
 * This file exists for BACKWARDS COMPATIBILITY only.
 * All values are now defined in CardTextConfig.ts
 * 
 * DO NOT edit values here - edit CardTextConfig.ts instead!
 */

import {
    FRONT_POSITIONS,
    FRONT_WIDTHS,
    IMAGE_SETTINGS,
    FRONT_FONT_SIZES,
    FRONT_FONT_STYLES,
    BACK_POSITIONS,
    BACK_WIDTHS,
    BACK_FONT_SIZES,
    BACK_FONT_STYLES,
    GLOBAL_MARGINS,
} from './CardTextConfig';

// ============== FRONT SIDE RE-EXPORTS ==============

/**
 * Front side offset defaults (positions + widths + image)
 */
export const FRONT_OFFSETS = {
    ...FRONT_POSITIONS,
    ...FRONT_WIDTHS,
    ...IMAGE_SETTINGS,
} as const;

export { FRONT_FONT_SIZES, FRONT_FONT_STYLES };

// ============== BACK SIDE RE-EXPORTS ==============

/**
 * Back side offset defaults
 */
export const BACK_OFFSETS = {
    ...BACK_POSITIONS,
    ...BACK_WIDTHS,
} as const;

export { BACK_FONT_SIZES, BACK_FONT_STYLES };

// ============== GLOBAL RE-EXPORTS ==============

export { GLOBAL_MARGINS };

// ============== COMBINED DEFAULTS ==============

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
