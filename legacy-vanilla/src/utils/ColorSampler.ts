/**
 * ColorSampler - Color analysis utilities for card background matching
 * Samples colors from card templates and converts to descriptive words for FLUX prompts
 * 
 * Extracted from GeneratorController.js for better code organization
 */

/**
 * Make Sample Result Interface
 */
export interface ColorSampleResult {
    hex: string;
    description: string;
}

/**
 * Sample the center color of a card background image
 */
export async function sampleCardBackgroundColor(bgUrl: string): Promise<ColorSampleResult> {
    try {
        if (!bgUrl) {
            console.log('🎨 No card background URL, using default cream');
            return { hex: '#F5E6D3', description: 'warm cream parchment' };
        }

        // Load image and sample center
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = bgUrl;
        });

        // Create small canvas to sample
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Could not get canvas context");
        }
        ctx.drawImage(img, 0, 0);

        // Sample from CENTER of template (where items will be placed)
        // This is the card template WITHOUT any item - sample 30% of center area
        const centerX = Math.floor(img.width / 2);
        const centerY = Math.floor(img.height / 2);
        const sampleWidth = Math.floor(img.width * 0.3);
        const sampleHeight = Math.floor(img.height * 0.3);

        const imageData = ctx.getImageData(
            centerX - sampleWidth / 2,
            centerY - sampleHeight / 2,
            sampleWidth,
            sampleHeight
        );

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
            count++;
        }

        if (count > 0) {
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
        }

        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        // Convert RGB to descriptive words
        const description = colorToDescription(r, g, b);

        console.log(`🎨 Sampled card template center (30%): ${hex} → "${description}"`);
        return { hex, description };

    } catch (err) {
        console.warn('Failed to sample card background:', err);
        return { hex: '#F5E6D3', description: 'warm cream parchment' };
    }
}

/**
 * Convert RGB values to descriptive color words for FLUX prompt
 */
export function colorToDescription(r: number, g: number, b: number): string {
    // Calculate HSL for better color naming
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    const l = (max + min) / 2;

    // Lightness descriptions
    let lightness = '';
    if (l > 0.85) lightness = 'very light ';
    else if (l > 0.7) lightness = 'light ';
    else if (l < 0.3) lightness = 'dark ';
    else if (l < 0.15) lightness = 'very dark ';

    // Determine dominant color
    // const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255; // Unused

    // Check for neutrals (gray/white/black)
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30) {
        if (l > 0.9) return 'pure white';
        if (l > 0.75) return 'off-white cream';
        if (l > 0.5) return 'light gray';
        if (l > 0.25) return 'medium gray';
        return 'dark charcoal';
    }

    // Color naming based on RGB dominance
    let colorName = '';

    // Warm colors (red/orange/yellow/brown)
    if (r > g && r > b) {
        if (g > b * 1.5) {
            if (r > 200 && g > 150) colorName = 'golden yellow';
            else if (g > r * 0.6) colorName = 'warm orange';
            else colorName = 'amber brown';
        } else {
            colorName = l > 0.5 ? 'coral pink' : 'deep red';
        }
    }
    // Green tones
    else if (g > r && g > b) {
        if (r > b) colorName = 'olive green';
        else colorName = l > 0.5 ? 'sage green' : 'forest green';
    }
    // Blue/purple tones
    else if (b > r && b > g) {
        if (r > g) colorName = l > 0.5 ? 'lavender purple' : 'deep purple';
        else colorName = l > 0.5 ? 'sky blue' : 'navy blue';
    }
    // Fallback for edge cases
    else {
        if (r > 180 && g > 150 && b < 150) colorName = 'warm beige';
        else if (r > 200 && g > 180 && b > 150) colorName = 'cream parchment';
        else colorName = 'neutral tan';
    }

    return `${lightness}${colorName}`;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

/**
 * Convert RGB to hex string
 */
export function rgbToHex(r: number, g: number, b: number): string {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default {
    sampleCardBackgroundColor,
    colorToDescription,
    hexToRgb,
    rgbToHex
};
