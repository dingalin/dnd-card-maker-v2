/**
 * SafeAreaDetector - Detects the inner content area of a card template
 * Uses a flood-fill algorithm similar to Photoshop's Magic Wand tool
 */

export class SafeAreaDetector {

    /**
     * Detect the safe (inner) area of a card template
     * @param {HTMLImageElement|HTMLCanvasElement} source - The template image or canvas
     * @param {Object} options - Detection options
     * @returns {Object} Bounding box of the safe area {top, bottom, left, right, width, height}
     */
    static detect(source, options = {}) {
        const {
            startX = null,           // Start X (default: center)
            startY = null,           // Start Y (default: center)
            tolerancePercent = 5,    // Color tolerance in PERCENT (5 = 5%)
            sampleSize = 5           // Size of initial color sample area
        } = options;

        // Create canvas from source
        const canvas = document.createElement('canvas');
        let width, height;

        if (source instanceof HTMLCanvasElement) {
            width = source.width;
            height = source.height;
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(source, 0, 0);
        } else if (source instanceof HTMLImageElement) {
            width = source.naturalWidth || source.width;
            height = source.naturalHeight || source.height;
            canvas.width = width;
            canvas.height = height;
            canvas.getContext('2d').drawImage(source, 0, 0);
        } else {
            throw new Error('Source must be HTMLImageElement or HTMLCanvasElement');
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Determine start point (default: center)
        const centerX = startX !== null ? startX : Math.floor(width / 2);
        const centerY = startY !== null ? startY : Math.floor(height / 2);

        console.log(`SafeAreaDetector: Starting detection from (${centerX}, ${centerY})`);
        console.log(`SafeAreaDetector: Image size ${width}x${height}, tolerance: ${tolerancePercent}%`);

        // Get reference color from center area (average of sample area)
        const refColor = this._getAverageColor(data, width, height, centerX, centerY, sampleSize);
        console.log(`SafeAreaDetector: Reference color: RGB(${refColor.r}, ${refColor.g}, ${refColor.b})`);

        // Calculate tolerance as percentage of max color distance (441 = sqrt(255^2 * 3))
        // 5% of 255 per channel = ~12.75 per channel
        const maxChannelDelta = Math.round(255 * (tolerancePercent / 100));
        console.log(`SafeAreaDetector: Max channel delta for ${tolerancePercent}%: ${maxChannelDelta}`);

        // Flood fill to find connected pixels with similar color
        const visited = new Uint8Array(width * height);
        const queue = [{ x: centerX, y: centerY }];
        visited[centerY * width + centerX] = 1;

        let minX = centerX, maxX = centerX;
        let minY = centerY, maxY = centerY;
        let pixelCount = 0;

        while (queue.length > 0) {
            const { x, y } = queue.shift();
            const idx = (y * width + x) * 4;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Check if each channel is within tolerance percent
            const rDiff = Math.abs(r - refColor.r);
            const gDiff = Math.abs(g - refColor.g);
            const bDiff = Math.abs(b - refColor.b);

            if (rDiff <= maxChannelDelta && gDiff <= maxChannelDelta && bDiff <= maxChannelDelta) {
                pixelCount++;

                // Update bounding box
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;

                // Check neighbors (4-directional)
                const neighbors = [
                    { x: x + 1, y },
                    { x: x - 1, y },
                    { x, y: y + 1 },
                    { x, y: y - 1 }
                ];

                for (const n of neighbors) {
                    if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                        const vIdx = n.y * width + n.x;
                        if (!visited[vIdx]) {
                            visited[vIdx] = 1;
                            queue.push(n);
                        }
                    }
                }
            }
        }

        // Add small padding to ensure text doesn't touch the edge
        const padding = 20;
        const safeArea = {
            top: Math.max(0, minY + padding),
            bottom: Math.min(height, maxY - padding),
            left: Math.max(0, minX + padding),
            right: Math.min(width, maxX - padding),
            width: maxX - minX - (padding * 2),
            height: maxY - minY - (padding * 2),
            pixelCount,
            coverage: (pixelCount / (width * height) * 100).toFixed(1) + '%'
        };

        console.log(`SafeAreaDetector: Found safe area:`, safeArea);
        return safeArea;
    }

    /**
     * Get average color in a square area
     */
    static _getAverageColor(data, width, height, centerX, centerY, size) {
        let r = 0, g = 0, b = 0, count = 0;
        const halfSize = Math.floor(size / 2);

        for (let dy = -halfSize; dy <= halfSize; dy++) {
            for (let dx = -halfSize; dx <= halfSize; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const idx = (y * width + x) * 4;
                    r += data[idx];
                    g += data[idx + 1];
                    b += data[idx + 2];
                    count++;
                }
            }
        }

        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    /**
     * Calculate color distance (Euclidean)
     */
    static _colorDistance(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt(
            Math.pow(r1 - r2, 2) +
            Math.pow(g1 - g2, 2) +
            Math.pow(b1 - b2, 2)
        );
    }

    /**
     * Visualize the detected area by drawing it on a canvas
     * Useful for debugging
     */
    static visualize(source, safeArea) {
        const canvas = document.createElement('canvas');
        let width, height;

        if (source instanceof HTMLCanvasElement) {
            width = source.width;
            height = source.height;
        } else {
            width = source.naturalWidth || source.width;
            height = source.naturalHeight || source.height;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(source, 0, 0);

        // Draw safe area rectangle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(
            safeArea.left,
            safeArea.top,
            safeArea.right - safeArea.left,
            safeArea.bottom - safeArea.top
        );

        // Draw center cross
        const centerX = (safeArea.left + safeArea.right) / 2;
        const centerY = (safeArea.top + safeArea.bottom) / 2;
        ctx.strokeStyle = '#ff0000';
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY);
        ctx.lineTo(centerX + 20, centerY);
        ctx.moveTo(centerX, centerY - 20);
        ctx.lineTo(centerX, centerY + 20);
        ctx.stroke();

        return canvas;
    }
}

export default SafeAreaDetector;
