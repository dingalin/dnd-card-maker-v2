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
    GLOBAL_MARGINS
} from './CardTextConfig';

export const FRONT_OFFSETS = {
    ...FRONT_POSITIONS,
    ...FRONT_WIDTHS,
    ...IMAGE_SETTINGS,
} as const;

export const BACK_OFFSETS = {
    ...BACK_POSITIONS,
    ...BACK_WIDTHS,
} as const;

export { FRONT_FONT_SIZES, FRONT_FONT_STYLES, BACK_FONT_SIZES, BACK_FONT_STYLES, GLOBAL_MARGINS };

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
