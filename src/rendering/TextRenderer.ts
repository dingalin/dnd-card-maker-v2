// @ts-nocheck
/**
 * TextRenderer - Handles all text rendering for D&D cards
 * Includes styled text, damage translation, and text wrapping
 *
 * Extracted from CardRenderer for better code organization
 */

// Damage type translations
export const DAMAGE_TYPES = {
    "slashing": "חותך", "piercing": "דוקר", "bludgeoning": "מוחץ",
    "fire": "אש", "cold": "קור", "lightning": "ברק", "poison": "רעל",
    "acid": "חומצה", "necrotic": "נמק", "radiant": "זוהר", "force": "כוח",
    "psychic": "נפשי", "thunder": "רעם"
};

/**
 * Translate damage types based on locale
 * @param {string} text - Text containing damage types
 * @param {string} locale - Target locale ('he' or 'en')
 * @returns {string} - Translated text
 */
export function translateDamageTypes(text, locale = 'he') {
    if (!text) return text;

    const isHebrew = locale === 'he';
    let result = text;

    if (isHebrew) {
        // Translate English to Hebrew
        for (const [eng, heb] of Object.entries(DAMAGE_TYPES)) {
            result = result.replace(new RegExp(eng, 'gi'), heb);
        }
        // Remove duplicate Hebrew damage types
        for (const heb of Object.values(DAMAGE_TYPES)) {
            result = result.replace(new RegExp(`${heb}\\s+${heb}`, 'g'), heb);
        }
    } else {
        // Translate Hebrew to English
        for (const [eng, heb] of Object.entries(DAMAGE_TYPES)) {
            result = result.replace(new RegExp(heb, 'g'), eng);
        }
        // Remove duplicate English damage types
        for (const eng of Object.keys(DAMAGE_TYPES)) {
            result = result.replace(new RegExp(`${eng}\\s+${eng}`, 'gi'), eng);
        }
    }

    return result.replace(/\s{2,}/g, ' ').trim();
}

/**
 * Draw styled text with optional glow, shadow, and outline
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} maxWidth - Maximum width
 * @param {Object} options - Style options
 */
export function drawStyledText(ctx, text, x, y, maxWidth, options = {}) {
    if (!text) return;

    const {
        elementName = '',
        styles = {},
        outlineEnabled = false,
        outlineWidth = 2,
        shadowBlur = 4,
        shadowEnabled = false
    } = options;

    ctx.save();

    // Check per-element shadow and glow
    const elementShadow = styles[`${elementName}Shadow`] || shadowEnabled;
    const elementGlow = styles[`${elementName}Glow`];

    // 1. Draw Glow (Halo) - BEHIND everything
    if (elementGlow) {
        ctx.save();
        ctx.shadowColor = '#e2c47f'; // Softer, parchment-gold
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = '#e2c47f';
        ctx.fillText(text, x, y, maxWidth);
        ctx.fillText(text, x, y, maxWidth);
        ctx.restore();
    }

    // 2. Apply shadow if enabled
    if (elementShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 2;
    }

    // 3. Draw outline first (behind fill but above glow)
    if (outlineEnabled) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = outlineWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, x, y, maxWidth);
    }

    // 4. Draw fill with AUTO SCALING (not squishing)
    // ctx.fillText(text, x, y, maxWidth) causes squishing.
    // We want to reduce font size instead.

    // Parse current font size
    let currentFont = ctx.font;
    let fontSize = parseInt(currentFont.match(/\d+/) || [0]) || 40; // Default fallback
    const originalFontSize = fontSize;
    const minFontSize = 24; // Don't go below this for titles

    // Check width
    if (maxWidth && text) {
        let width = ctx.measureText(text).width;
        if (width > maxWidth) {
            // Optimization: Estimate new size directly first
            const ratio = maxWidth / width;
            fontSize = Math.floor(fontSize * ratio);

            // Clamp
            if (fontSize < minFontSize) fontSize = minFontSize;

            // Apply new font
            ctx.font = currentFont.replace(/\d+px/, `${fontSize}px`);
        }
    }

    // Now draw (allow maxWidth to still squish if we hit minFontSize)
    ctx.fillText(text, x, y, maxWidth);

    ctx.restore();
}

/**
 * Wrap text with centered alignment
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to wrap
 * @param {number} x - Center X coordinate
 * @param {number} y - Starting Y coordinate
 * @param {number} maxWidth - Maximum width per line
 * @param {number} lineHeight - Height between lines
 * @param {Object} options - Optional glow settings
 * @returns {number} - Final Y position after all lines
 */
export function wrapTextCentered(ctx, text, x, y, maxWidth, lineHeight, options = {}) {
    // Split by newlines first to respect manual line breaks
    const paragraphs = text.split('\n');
    let currentY = y;

    paragraphs.forEach(paragraph => {
        const words = paragraph.split(' ');
        let line = '';

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth && n > 0) {
                if (options.glow) {
                    ctx.save();
                    ctx.shadowColor = '#e2c47f';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillStyle = '#e2c47f';
                    ctx.fillText(line, x, currentY);
                    ctx.fillText(line, x, currentY);
                    ctx.restore();
                }
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        if (options.glow) {
            ctx.save();
            ctx.shadowColor = '#e2c47f';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.fillStyle = '#e2c47f';
            ctx.fillText(line, x, currentY);
            ctx.fillText(line, x, currentY);
            ctx.restore();
        }
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
    });

    return currentY;
}

/**
 * Wrap text with left alignment
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to wrap
 * @param {number} x - Starting X coordinate
 * @param {number} y - Starting Y coordinate
 * @param {number} maxWidth - Maximum width per line
 * @param {number} lineHeight - Height between lines
 * @returns {number} - Final Y position
 */
export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
    return currentY;
}

/**
 * Build font string from options
 * @param {Object} styles - Font styles object
 * @param {string} prefix - Element prefix (e.g., 'name', 'rarity')
 * @param {number} size - Font size in pixels
 * @param {string} fontFamily - Font family name
 * @returns {string} - CSS font string
 */
export function buildFontString(styles, prefix, size, fontFamily) {
    const bold = styles[`${prefix}Bold`] ? 'bold ' : '';
    const italic = styles[`${prefix}Italic`] ? 'italic ' : '';
    return `${italic}${bold}${size}px "${fontFamily}"`;
}

/**
 * Clean up stats text by removing redundant info
 * @param {string} text - Stats text to clean
 * @param {string} locale - Current locale
 * @returns {string} - Cleaned text
 */
export function cleanStatsText(text, locale = 'he') {
    if (!text) return '';

    let result = translateDamageTypes(text, locale);

    // Remove dice patterns (already shown in core stats)
    result = result.replace(/\d+d\d+(\s*[+-]\s*\d+)?/gi, '').trim();

    if (locale === 'he') {
        // Remove ONLY physical damage types (redundant with weapon)
        result = result.replace(/(מוחץ|דוקר|חותך)/gi, '').trim();
        // Remove redundant armor class mentions
        result = result.replace(/דרגת שריון\s*:?\s*\d+/gi, '').trim();
        result = result.replace(/דרג"ש\s*:?\s*\d+/gi, '').trim();
        // Remove confusing dexterity text
        result = result.replace(/\(?\s*ללא\s*זריזות\s*\)?/gi, '').trim();
        result = result.replace(/\(?\s*\+\s*זריזות[^)]*\)?/gi, '').trim();
    } else {
        // Remove ONLY physical damage types
        result = result.replace(/(bludgeoning|piercing|slashing)/gi, '').trim();
        // Remove redundant AC mentions
        result = result.replace(/AC\s*:?\s*\d+/gi, '').trim();
        result = result.replace(/Armor Class\s*:?\s*\d+/gi, '').trim();
        // Remove confusing dexterity text
        result = result.replace(/\(?\s*no\s*Dex(terity)?\s*\)?/gi, '').trim();
        result = result.replace(/\(?\s*\+\s*Dex[^)]*\)?/gi, '').trim();
    }

    // Clean up orphaned fragments
    result = result.replace(/\+\d*\s*ל\s*,?/gi, '').trim();
    result = result.replace(/^\s*,\s*/g, '').trim();
    result = result.replace(/\s*,\s*$/g, '').trim();
    result = result.replace(/^\s*\+\s*$/g, '').trim();
    result = result.replace(/\s*,\s*,\s*/g, ', ').trim();
    result = result.replace(/[^\S\n]{2,}/g, ' ');

    return result;
}

export default {
    translateDamageTypes,
    drawStyledText,
    wrapTextCentered,
    wrapText,
    buildFontString,
    cleanStatsText,
    DAMAGE_TYPES
};
