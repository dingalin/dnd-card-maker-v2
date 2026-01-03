// @ts-nocheck
import BackgroundRemover from './BackgroundRemover.ts';
import VisualEffects from './VisualEffects.ts';

/**
 * ImageRenderer - Handles drawing of item images with effects
 * Extracted from CardRenderer
 */
export const ImageRenderer = {
    /**
     * Draw the main item image with various effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} url - Image URL
     * @param {Object} options - Rendering options
     * @param {number} centerX - Canvas center X
     * @param {number} centerY - Canvas center Y
     * @returns {Promise<void>}
     */
    // Simple memory cache
    _cache: new Map(),

    /**
     * Clear cache (call this when memory pressure is high or card changes completely)
     */
    clearCache() {
        this._cache.clear();
    },

    /**
     * Draw the main item image with various effects
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {string} url - Image URL
     * @param {Object} options - Rendering options
     * @param {number} centerX - Canvas center X
     * @param {number} centerY - Canvas center Y
     * @returns {Promise<void>}
     */
    async drawItemImage(ctx, url, options = {}, centerX, centerY) {
        if (!url) return;

        // Generate cache key
        const cacheKey = JSON.stringify({ url, ...options });

        if (this._cache.has(cacheKey)) {
            const processed = this._cache.get(cacheKey);
            // Re-calculate target position based on new center
            const finalX = centerX - (processed.width / 2);
            const finalY = (centerY + (options.yOffset || 0)) - (processed.height / 2);

            ctx.save();
            // Apply shadow again (it was applied to ctx, not temp canvas? No, in previous code shadow was applied to ctx before drawing temp)
            const shadow = options.shadow || 0;
            if (shadow > 0) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
                ctx.shadowBlur = shadow * 0.6;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = shadow * 0.25;
            }
            ctx.drawImage(processed.canvas, finalX, finalY);
            ctx.restore();
            return;
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                try {
                    const yOffset = options.yOffset || 0;
                    const scale = options.scale || 1.0;
                    const rotation = options.rotation || 0;
                    const style = options.style || 'natural';
                    const color = options.color || '#ffffff'; // Target color for removal
                    const fade = options.fade || 0;
                    const shadow = options.shadow || 0;

                    // Calculate dimensions
                    // Base size: try to fit within 600x600 box but respect aspect ratio
                    const baseSize = 650;
                    const aspect = img.width / img.height;
                    let w = baseSize * aspect;
                    let h = baseSize;

                    // Apply scale
                    w *= scale;
                    h *= scale;

                    const tCx = w / 2;
                    const tCy = h / 2;

                    // Create temp canvas for rotation/effects
                    const tempCanvas = document.createElement('canvas');
                    // Add padding for rotation/shadow to avoid clipping
                    const padding = 200;
                    tempCanvas.width = w + padding;
                    tempCanvas.height = h + padding;
                    const tCtx = tempCanvas.getContext('2d');

                    // Center on temp canvas
                    const tempCenterX = tempCanvas.width / 2;
                    const tempCenterY = tempCanvas.height / 2;

                    tCtx.save();
                    tCtx.translate(tempCenterX, tempCenterY);
                    tCtx.rotate(rotation * Math.PI / 180);

                    // 1. Prepare Source (Remove BG if needed)
                    let drawSource = img;
                    if (style === 'no-background') {
                        // Use extracted BackgroundRemover
                        drawSource = BackgroundRemover.removeWhiteBackground(img, color);
                    }

                    // 2. Draw Image on Temp Canvas with Clipping if needed
                    if (style === 'round-frame') {
                        tCtx.beginPath();
                        tCtx.arc(0, 0, Math.min(w, h) / 2, 0, Math.PI * 2);
                        tCtx.clip();
                    } else if (style === 'square-frame') {
                        tCtx.beginPath();
                        tCtx.rect(-w / 2, -h / 2, w, h);
                        tCtx.clip();
                    }

                    tCtx.drawImage(drawSource, -w / 2, -h / 2, w, h);

                    // Draw Border for frames
                    if (style === 'round-frame' || style === 'square-frame') {
                        tCtx.strokeStyle = '#000000';
                        tCtx.lineWidth = 2;
                        tCtx.stroke();
                    }

                    tCtx.restore();

                    // 3. Apply Fade (Vignette)
                    if (fade > 0) {
                        VisualEffects.applyVignetteFade(tCtx, tempCenterX, tempCenterY, tempCanvas.width, tempCanvas.height, fade);
                    }

                    // Cache the result
                    this._cache.set(cacheKey, {
                        canvas: tempCanvas,
                        width: tempCanvas.width,
                        height: tempCanvas.height
                    });

                    // Limit cache size
                    if (this._cache.size > 10) {
                        const firstKey = this._cache.keys().next().value;
                        this._cache.delete(firstKey);
                    }

                    // 4. Draw Temp Canvas onto Main Canvas with Shadow
                    ctx.save();

                    if (shadow > 0) {
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
                        ctx.shadowBlur = shadow * 0.6;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = shadow * 0.25;
                    } else {
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                    }

                    // Position on main canvas
                    // We need to draw tempCanvas such that its center (tempCenterX, tempCenterY) lands on (centerX, centerY + yOffset)
                    const targetX = centerX - tempCenterX;
                    const targetY = (centerY + yOffset) - tempCenterY;

                    ctx.drawImage(tempCanvas, targetX, targetY);

                    ctx.restore();
                    resolve();

                } catch (e) {
                    console.error("ImageRenderer: Error drawing image", e);
                    reject(e);
                }
            };
            img.onerror = (e) => {
                console.error("ImageRenderer: Error loading image", url, e);
                reject(e);
            };
            img.src = url;
        });
    }
};

export default ImageRenderer;
