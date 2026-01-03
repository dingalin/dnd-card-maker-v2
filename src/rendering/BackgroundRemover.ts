// @ts-nocheck
/**
 * BackgroundRemover - Advanced background removal for item images
 * Uses flood fill and color detection algorithms
 *
 * Extracted from CardRenderer for better code organization
 */

/**
 * Convert hex color to RGB object
 * @param {string} hex - Hex color string (e.g., '#ffffff')
 * @returns {{r: number, g: number, b: number}}
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
}

/**
 * Remove white/colored background from an image using flood fill algorithm
 * @param {HTMLImageElement} img - Source image
 * @param {string} targetColor - Hex color to remove (default: white '#ffffff')
 * @returns {HTMLCanvasElement} - Canvas with transparent background
 */
export function removeWhiteBackground(img, targetColor = '#ffffff') {
    console.log(`BackgroundRemover: removeWhiteBackground called with targetColor: ${targetColor}`);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    let imageData;
    try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (e) {
        console.error("BackgroundRemover: Failed to get image data (CORS issue?)", e);
        return canvas;
    }

    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    console.log(`BackgroundRemover: Processing image ${width}x${height}`);

    // Parse target color from hex
    const target = hexToRgb(targetColor);
    console.log(`BackgroundRemover: Target color RGB: (${target.r}, ${target.g}, ${target.b})`);

    // --- AUTO-DETECT: If target is white but corners are different, use corner color ---
    const getPixelColor = (x, y) => {
        const idx = (y * width + x) * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
    };

    // Sample corners and edges
    const cornerSamples = [
        getPixelColor(5, 5),                           // Top-left
        getPixelColor(width - 6, 5),                   // Top-right
        getPixelColor(5, height - 6),                  // Bottom-left
        getPixelColor(width - 6, height - 6),          // Bottom-right
        getPixelColor(Math.floor(width / 2), 5),       // Top-center
        getPixelColor(Math.floor(width / 2), height - 6), // Bottom-center
        getPixelColor(5, Math.floor(height / 2)),      // Left-center
        getPixelColor(width - 6, Math.floor(height / 2))  // Right-center
    ];

    // Calculate average corner color
    let avgR = 0, avgG = 0, avgB = 0;
    cornerSamples.forEach(c => { avgR += c.r; avgG += c.g; avgB += c.b; });
    avgR = Math.round(avgR / cornerSamples.length);
    avgG = Math.round(avgG / cornerSamples.length);
    avgB = Math.round(avgB / cornerSamples.length);

    // If target is white (#ffffff) but corners are significantly different, use corner color
    const cornerDistance = Math.sqrt(
        Math.pow(avgR - target.r, 2) + Math.pow(avgG - target.g, 2) + Math.pow(avgB - target.b, 2)
    );

    let effectiveTarget = target;
    if (target.r === 255 && target.g === 255 && target.b === 255 && cornerDistance > 50) {
        effectiveTarget = { r: avgR, g: avgG, b: avgB };
        console.log(`BackgroundRemover: Auto-detected background color: RGB(${avgR}, ${avgG}, ${avgB})`);
    } else if (cornerDistance < 100) {
        console.log(`BackgroundRemover: Target color matches corners (distance: ${cornerDistance.toFixed(1)})`);
    } else {
        console.log(`BackgroundRemover: Using provided target, corner distance: ${cornerDistance.toFixed(1)}`);
    }

    // --- STRATEGY 1: FLOOD FILL (Magic Wand) ---
    const queue = [];
    const visited = new Uint8Array(width * height);

    const getIdx = (x, y) => (y * width + x) * 4;

    // Color distance function - now uses effectiveTarget
    const colorDistance = (r, g, b) => {
        return Math.sqrt(
            Math.pow(r - effectiveTarget.r, 2) +
            Math.pow(g - effectiveTarget.g, 2) +
            Math.pow(b - effectiveTarget.b, 2)
        );
    };

    // Threshold for PURE WHITE backgrounds
    // 60 is balanced: catches light grays from FLUX but protects item colors
    const isStartColor = (idx) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return colorDistance(r, g, b) < 60; // Catches white and light gray
    };

    // Expansion threshold - slightly higher to fill gaps
    const isCloseToTarget = (idx) => {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        return colorDistance(r, g, b) < 70; // Expand through light areas but stop at item
    };

    // 1. Collect start points from ALL borders (every pixel on edge)
    for (let x = 0; x < width; x++) {
        [0, height - 1].forEach(y => {
            const idx = getIdx(x, y);
            if (isStartColor(idx)) {
                queue.push({ x, y });
                visited[y * width + x] = 1;
            }
        });
    }
    for (let y = 0; y < height; y++) {
        [0, width - 1].forEach(x => {
            const idx = getIdx(x, y);
            if (!visited[y * width + x] && isStartColor(idx)) {
                queue.push({ x, y });
                visited[y * width + x] = 1;
            }
        });
    }

    // 2. IMPROVED: Also add corner regions (not just edge pixels)
    const cornerSize = 20;
    const corners = [
        { x0: 0, y0: 0 },                                    // Top-left
        { x0: width - cornerSize, y0: 0 },                   // Top-right
        { x0: 0, y0: height - cornerSize },                  // Bottom-left
        { x0: width - cornerSize, y0: height - cornerSize }  // Bottom-right
    ];

    corners.forEach(corner => {
        for (let dy = 0; dy < cornerSize; dy++) {
            for (let dx = 0; dx < cornerSize; dx++) {
                const x = corner.x0 + dx;
                const y = corner.y0 + dy;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const vIdx = y * width + x;
                    if (!visited[vIdx]) {
                        const idx = getIdx(x, y);
                        if (isStartColor(idx)) {
                            queue.push({ x, y });
                            visited[vIdx] = 1;
                        }
                    }
                }
            }
        }
    });

    console.log(`BackgroundRemover: Found ${queue.length} starting pixels (borders + corners)`);

    let floodFilledPixels = 0;
    while (queue.length > 0) {
        const { x, y } = queue.shift();
        const idx = getIdx(x, y);

        // Remove pixel
        data[idx + 3] = 0;
        floodFilledPixels++;

        // 8-direction neighbors (including diagonals for better fill)
        const neighbors = [
            { x: x + 1, y: y }, { x: x - 1, y: y },
            { x: x, y: y + 1 }, { x: x, y: y - 1 },
            { x: x + 1, y: y + 1 }, { x: x - 1, y: y - 1 },
            { x: x + 1, y: y - 1 }, { x: x - 1, y: y + 1 }
        ];

        for (const n of neighbors) {
            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                const vIdx = n.y * width + n.x;
                if (!visited[vIdx]) {
                    const nIdx = getIdx(n.x, n.y);
                    if (isCloseToTarget(nIdx)) {
                        visited[vIdx] = 1;
                        queue.push(n);
                    }
                }
            }
        }
    }
    console.log(`BackgroundRemover: Flood Fill removed ${floodFilledPixels} pixels`);

    // --- STRATEGY 2: FALLBACK (Target Color Threshold) with FEATHERING ---
    if (floodFilledPixels < (width * height * 0.01)) {
        console.warn("BackgroundRemover: Flood Fill ineffective, running fallback threshold removal with feathering...");

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] === 0) continue;

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist = colorDistance(r, g, b);

            // Fallback threshold - balanced
            if (dist < 50) {
                // White/very light gray - fully transparent
                data[i + 3] = 0;
            } else if (dist < 80) {
                // Light colors - gradual feathering for smooth edges
                const alpha = Math.round(((dist - 50) / 30) * 255);
                data[i + 3] = Math.min(data[i + 3], alpha);
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
}

/**
 * Sample corner colors from an image to detect background color
 * @param {ImageData} imageData - Image data to sample
 * @returns {{r: number, g: number, b: number}} - Average corner color
 */
export function sampleCornerColors(imageData) {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    const getPixelColor = (x, y) => {
        const idx = (y * width + x) * 4;
        return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
    };

    const cornerSamples = [
        getPixelColor(5, 5),
        getPixelColor(width - 6, 5),
        getPixelColor(5, height - 6),
        getPixelColor(width - 6, height - 6)
    ];

    let avgR = 0, avgG = 0, avgB = 0;
    cornerSamples.forEach(c => { avgR += c.r; avgG += c.g; avgB += c.b; });

    return {
        r: Math.round(avgR / cornerSamples.length),
        g: Math.round(avgG / cornerSamples.length),
        b: Math.round(avgB / cornerSamples.length)
    };
}

export default { removeWhiteBackground, sampleCornerColors, hexToRgb };
