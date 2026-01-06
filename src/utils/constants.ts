/**
 * Card Rendering Constants
 * 
 * NOTE: Font sizes and offsets are now imported from CardTextConfig.ts
 * Edit that file to change default values!
 */

import {
    FRONT_FONT_SIZES,
    BACK_FONT_SIZES,
    FRONT_POSITIONS,
    FRONT_WIDTHS,
    BACK_POSITIONS,
    BACK_WIDTHS,
    IMAGE_SETTINGS
} from '../config/CardTextConfig';

// ============== CARD DIMENSIONS ==============
export const CARD_WIDTH = 750;
export const CARD_HEIGHT = 1050;

// ============== DEFAULT FONT SIZES (from CardTextConfig) ==============
export const DEFAULT_FONT_SIZES = {
    front: { ...FRONT_FONT_SIZES },
    back: { ...BACK_FONT_SIZES }
};

// ============== DEFAULT OFFSETS (from CardTextConfig) ==============
export const DEFAULT_OFFSETS = {
    front: {
        ...FRONT_POSITIONS,
        ...IMAGE_SETTINGS,
    },
    back: { ...BACK_POSITIONS }
};

// ============== DEFAULT WIDTHS (from CardTextConfig) ==============
export const DEFAULT_WIDTHS = {
    ...FRONT_WIDTHS,
    ...BACK_WIDTHS,
};

// ============== DEFAULT STYLE ==============
export const DEFAULT_STYLE = {
    fontFamily: 'Heebo',
    imageStyle: 'natural',
    imageColor: '#ffffff',
    textOutlineEnabled: false,
    textOutlineWidth: 2,
    textShadowEnabled: false,
    textShadowBlur: 4,
    textBackdropEnabled: false,
    textBackdropOpacity: 40
};

// ============== THUMBNAIL QUALITY ==============
export const THUMBNAIL_QUALITY = 0.85;
export const THUMBNAIL_FORMAT = 'image/jpeg';
