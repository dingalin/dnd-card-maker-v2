// @ts-nocheck
/**
 * VisualEffects - Handles visual effects for card rendering
 * Includes center fade, rounded corners, gold icon, and image shadows
 *
 * Extracted from CardRenderer for better code organization
 */

/**
 * Draw a cream-colored rounded rectangle fade from the center outward
 * Helps improve text readability on complex backgrounds
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} intensity - 0-100, where 100 is maximum fade
 */
export function drawCenterFade(ctx, width, height, intensity) {
    if (intensity <= 0) return;

    // Cream/parchment color: soft warm off-white
    const creamColor = 'rgba(253, 245, 230,'; // FDF5E6 = oldlace/cream

    // Calculate opacity based on intensity (max 0.7 for full fade)
    const maxOpacity = 0.7;
    const opacity = (intensity / 100) * maxOpacity;

    // Margins for the rounded rectangle
    const margin = 30;
    const cornerRadius = 40;

    // Create gradient from center outward
    const centerX = width / 2;
    const centerY = height / 2;

    ctx.save();

    // Create rounded rectangle path for clipping
    ctx.beginPath();
    const rx = margin;
    const ry = margin;
    const rw = width - margin * 2;
    const rh = height - margin * 2;

    // Draw rounded rectangle
    ctx.moveTo(rx + cornerRadius, ry);
    ctx.lineTo(rx + rw - cornerRadius, ry);
    ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + cornerRadius);
    ctx.lineTo(rx + rw, ry + rh - cornerRadius);
    ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - cornerRadius, ry + rh);
    ctx.lineTo(rx + cornerRadius, ry + rh);
    ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - cornerRadius);
    ctx.lineTo(rx, ry + cornerRadius);
    ctx.quadraticCurveTo(rx, ry, rx + cornerRadius, ry);
    ctx.closePath();

    // Create radial gradient (elliptical to match card proportions)
    const gradientRadius = Math.max(width, height) * 0.7;
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, gradientRadius);

    // Center is most opaque, fades to transparent at edges
    gradient.addColorStop(0, `${creamColor} ${opacity})`);
    gradient.addColorStop(0.4, `${creamColor} ${opacity * 0.8})`);
    gradient.addColorStop(0.7, `${creamColor} ${opacity * 0.4})`);
    gradient.addColorStop(1, `${creamColor} 0)`);

    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.restore();

    console.log(`VisualEffects: Drew center fade with intensity ${intensity}%`);
}

/**
 * Apply rounded corners to the card like real trading cards
 * Uses destination-in composite to mask the corners
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} radius - Corner radius (default ~15px for TCG card look)
 */
export function applyRoundedCorners(ctx, width, height, radius = 15) {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';

    // Draw rounded rectangle mask
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();

    ctx.fillStyle = '#fff';
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a gold coin icon with gradient and shine
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {number} size - Icon diameter
 */
export function drawGoldIcon(ctx, x, y, size) {
    ctx.save();
    const r = size / 2;

    // 1. Outer Ring
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    const grad = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    grad.addColorStop(0, '#f9d976');
    grad.addColorStop(1, '#b06604'); // Dark gold
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#5a3a00';
    ctx.stroke();

    // 2. Inner Circle (Inset)
    ctx.beginPath();
    ctx.arc(x, y, r * 0.75, 0, Math.PI * 2);
    ctx.strokeStyle = '#fbecc2'; // Highlight ring
    ctx.lineWidth = 1;
    ctx.stroke();

    // 3. Shiny Highlight
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    ctx.restore();
}

/**
 * Draw text backdrop (semi-transparent band for readability)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} startY - Y position to start backdrop
 * @param {number} opacity - Opacity 0-100
 */
export function drawTextBackdrop(ctx, width, height, startY, opacity) {
    if (opacity <= 0) return;

    ctx.save();
    const backdropOpacity = opacity / 100;
    const backdropHeight = height - startY;

    ctx.fillStyle = `rgba(0, 0, 0, ${backdropOpacity})`;
    ctx.fillRect(0, startY, width, backdropHeight);
    ctx.restore();

    console.log(`VisualEffects: Drew backdrop at Y=${startY}, opacity=${opacity}%`);
}

/**
 * Apply vignette fade to an image on a temporary canvas
 * @param {CanvasRenderingContext2D} tCtx - Temporary canvas context
 * @param {number} centerX - Center X
 * @param {number} centerY - Center Y
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} fade - Fade intensity 0-100
 */
export function applyVignetteFade(tCtx, centerX, centerY, width, height, fade) {
    if (fade <= 0) return;

    tCtx.save();
    tCtx.globalCompositeOperation = 'destination-in';

    const halfMin = Math.min(width, height) / 2;
    const diag = Math.sqrt(width * width + height * height) / 2;
    const fadeFactor = fade / 100;

    const startOuter = diag * 1.5;
    const endOuter = halfMin * 0.7;
    const outerRadius = startOuter - (startOuter - endOuter) * fadeFactor;

    const startInner = diag * 1.2;
    const endInner = halfMin * 0.3;
    const innerRadius = startInner - (startInner - endInner) * fadeFactor;

    const gradient = tCtx.createRadialGradient(
        centerX, centerY, Math.max(0, innerRadius),
        centerX, centerY, Math.max(0, outerRadius)
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)'); // Fully visible
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)'); // Fully transparent

    tCtx.fillStyle = gradient;
    tCtx.fillRect(0, 0, tCtx.canvas.width, tCtx.canvas.height);
    tCtx.restore();
}

/**
 * Apply drop shadow settings to context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} shadow - Shadow intensity
 */
export function applyShadow(ctx, shadow) {
    if (shadow > 0) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
        ctx.shadowBlur = shadow * 0.6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = shadow * 0.25;
    } else {
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
}

export default {
    drawCenterFade,
    applyRoundedCorners,
    drawGoldIcon,
    drawTextBackdrop,
    applyVignetteFade,
    applyShadow
};
