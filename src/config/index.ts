/**
 * Config Index
 * ============
 * Central export point for all configuration files
 * 
 * Usage:
 * import { SLIDER_LIMITS, FONT_SIZE_LIMITS, CANVAS } from './config';
 * 
 * Or import specific modules:
 * import { SLIDER_DEFAULTS } from './config/SliderDefaults';
 */

// API Configuration
export const API = {
    WORKER_URL: 'https://dnd-api-proxy.dingalin2000.workers.dev/',
    TIMEOUT_MS: 30000,
    RETRY_ATTEMPTS: 3
};

// Slider default values (existing)
export { SLIDER_DEFAULTS, FRONT_OFFSETS, BACK_OFFSETS } from './SliderDefaults';

// Slider min/max limits (new)
export {
    SLIDER_LIMITS,
    FRONT_OFFSET_LIMITS,
    BACK_OFFSET_LIMITS,
    IMAGE_SLIDER_LIMITS,
    TEXT_EFFECT_LIMITS,
    GLOBAL_MARGIN_LIMITS,
    getSliderLimits,
    type SliderLimit
} from './SliderLimits';

// Slider initializer - applies config to HTML sliders
export { SliderInitializer } from './SliderInitializer';

// Font size limits (new)
export {
    FONT_SIZE_LIMITS,
    FRONT_FONT_LIMITS,
    BACK_FONT_LIMITS,
    getFontSizeLimits,
    clampFontSize,
    type FontSizeLimit
} from './FontSizeLimits';

// Canvas and rendering config (new)
export {
    CANVAS_CONFIG,
    CANVAS,
    BACKGROUND,
    FRONT_BASE_POSITIONS,
    BACK_BASE_POSITIONS,
    TEXT_DEFAULTS
} from './CanvasConfig';

/**
 * Quick Reference:
 * ================
 * 
 * SLIDER_DEFAULTS - Default values for all sliders (offsets, font sizes)
 * SLIDER_LIMITS - Min/max ranges for all sliders
 * FONT_SIZE_LIMITS - Min/max ranges for font sizes
 * CANVAS - Canvas dimensions (WIDTH: 1000, HEIGHT: 1400)
 * 
 * Helper functions:
 * - getSliderLimits(sliderId) - Get limits for a slider by ID
 * - getFontSizeLimits(key) - Get limits for a font size
 * - clampFontSize(key, value) - Clamp value within limits
 */
