/**
 * Rendering Modules - Central export point for card rendering utilities
 *
 * This module provides:
 * - BackgroundRemover - Flood fill background removal
 * - TextRenderer - Styled text and damage translation
 * - VisualEffects - Fades, shadows, and visual enhancements
 */

export { removeWhiteBackground, sampleCornerColors } from './BackgroundRemover.ts';

export {
    translateDamageTypes,
    drawStyledText,
    wrapTextCentered,
    wrapText,
    buildFontString,
    cleanStatsText,
    DAMAGE_TYPES
} from './TextRenderer.ts';

export {
    drawCenterFade,
    applyRoundedCorners,
    drawGoldIcon,
    drawTextBackdrop,
    applyVignetteFade,
    applyShadow
} from './VisualEffects.ts';
