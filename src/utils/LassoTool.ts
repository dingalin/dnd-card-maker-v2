/**
 * LassoTool - Interactive Magic Wand with adjustable tolerance
 * Shows a live preview of the selected area
 * IMPORTANT: Analyzes the EMPTY template image, not the full rendered canvas
 */

export interface DetectedArea {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
    coverage: string;
    tolerance: number;
}

export type OnConfirmCallback = (area: DetectedArea) => void;

export class LassoTool {
    private modal: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private previewCanvas: HTMLCanvasElement | null = null;
    private tolerance: number = 10;
    private templateImage: HTMLImageElement | null = null;
    private displayCanvas: HTMLCanvasElement | null = null;
    private onConfirm: OnConfirmCallback | null = null;
    private detectedArea: DetectedArea | null = null;

    constructor() {
        this.open = this.open.bind(this);
        this.createModal = this.createModal.bind(this);
        this.updatePreview = this.updatePreview.bind(this);
        this.confirm = this.confirm.bind(this);
        this.close = this.close.bind(this);
    }

    /**
     * Open the lasso tool modal
     * @param {HTMLImageElement} templateImage - The EMPTY template image to analyze (no content)
     * @param {HTMLCanvasElement} displayCanvas - The full canvas to show for visual reference
     * @param {Function} onConfirm - Callback when user confirms selection
     */
    open(templateImage: HTMLImageElement, displayCanvas: HTMLCanvasElement, onConfirm: OnConfirmCallback): void {
        this.templateImage = templateImage;
        this.displayCanvas = displayCanvas;
        this.onConfirm = onConfirm;

        if (!templateImage || !templateImage.complete) {
            console.error('LassoTool: Template image not loaded');
            return;
        }

        console.log('LassoTool: Analyzing EMPTY template, size:', templateImage.naturalWidth, 'x', templateImage.naturalHeight);

        this.createModal();
        this.updatePreview();
    }

    createModal(): void {
        // Remove existing modal if any
        const existing = document.getElementById('lasso-tool-modal');
        if (existing) existing.remove();

        this.modal = document.createElement('div');
        this.modal.id = 'lasso-tool-modal';
        this.modal.innerHTML = `
            <div class="lasso-modal-overlay">
                <div class="lasso-modal-content">
                    <div class="lasso-header">
                        <h3>🔍 כלי בחירת שטח (מנתח Template ריק)</h3>
                        <button class="lasso-close-btn">&times;</button>
                    </div>
                    
                    <div class="lasso-body">
                        <div class="lasso-preview-container">
                            <canvas id="lasso-preview-canvas"></canvas>
                        </div>
                        
                        <div class="lasso-controls">
                            <div class="lasso-slider-group">
                                <label>רגישות: <span id="lasso-tolerance-val">${this.tolerance}%</span></label>
                                <input type="range" id="lasso-tolerance" min="1" max="50" value="${this.tolerance}">
                            </div>
                            
                            <div class="lasso-info" id="lasso-info">
                                <div>גודל שטח: <span id="lasso-size">-</span></div>
                                <div>כיסוי: <span id="lasso-coverage">-</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="lasso-footer">
                        <button class="lasso-cancel-btn">ביטול</button>
                        <button class="lasso-confirm-btn">✓ אשר והחל</button>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .lasso-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            }
            
            .lasso-modal-content {
                background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
                border-radius: 16px;
                border: 2px solid #d4af37;
                max-width: 600px;
                width: 95%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .lasso-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #444;
            }
            
            .lasso-header h3 {
                margin: 0;
                color: #d4af37;
                font-size: 1.3rem;
            }
            
            .lasso-close-btn {
                background: none;
                border: none;
                color: #888;
                font-size: 1.5rem;
                cursor: pointer;
                transition: color 0.2s;
            }
            
            .lasso-close-btn:hover {
                color: #fff;
            }
            
            .lasso-body {
                padding: 20px;
            }
            
            .lasso-preview-container {
                background: #111;
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 16px;
                display: flex;
                justify-content: center;
            }
            
            #lasso-preview-canvas {
                max-width: 100%;
                max-height: 400px;
                border-radius: 4px;
            }
            
            .lasso-controls {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .lasso-slider-group {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .lasso-slider-group label {
                color: #ccc;
                font-size: 0.95rem;
            }
            
            .lasso-slider-group input[type="range"] {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: #333;
                outline: none;
                -webkit-appearance: none;
            }
            
            .lasso-slider-group input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #d4af37;
                cursor: pointer;
            }
            
            .lasso-info {
                display: flex;
                gap: 20px;
                color: #888;
                font-size: 0.9rem;
            }
            
            .lasso-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 16px 20px;
                border-top: 1px solid #444;
            }
            
            .lasso-cancel-btn, .lasso-confirm-btn {
                padding: 10px 24px;
                border-radius: 8px;
                border: none;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .lasso-cancel-btn {
                background: #444;
                color: #fff;
            }
            
            .lasso-cancel-btn:hover {
                background: #555;
            }
            
            .lasso-confirm-btn {
                background: linear-gradient(135deg, #d4af37, #aa8a2e);
                color: #000;
                font-weight: bold;
            }
            
            .lasso-confirm-btn:hover {
                transform: scale(1.02);
                box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
            }
        `;
        this.modal.appendChild(style);
        document.body.appendChild(this.modal);

        // Setup preview canvas - use STANDARD 750x1050 dimensions
        this.previewCanvas = document.getElementById('lasso-preview-canvas') as HTMLCanvasElement;
        this.previewCanvas.width = 750;
        this.previewCanvas.height = 1050;

        // Event listeners
        const toleranceSlider = document.getElementById('lasso-tolerance') as HTMLInputElement;
        if (toleranceSlider) {
            toleranceSlider.addEventListener('input', (e) => {
                const target = e.target as HTMLInputElement;
                this.tolerance = parseInt(target.value);
                const valEl = document.getElementById('lasso-tolerance-val');
                if (valEl) valEl.textContent = `${this.tolerance}%`;
                this.updatePreview();
            });
        }

        this.modal.querySelector('.lasso-close-btn')?.addEventListener('click', () => this.close());
        this.modal.querySelector('.lasso-cancel-btn')?.addEventListener('click', () => this.close());
        this.modal.querySelector('.lasso-confirm-btn')?.addEventListener('click', () => this.confirm());
        this.modal.querySelector('.lasso-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.close();
        });
    }

    updatePreview(): void {
        if (!this.previewCanvas || !this.templateImage) return;

        const ctx = this.previewCanvas.getContext('2d');
        if (!ctx) return;

        const width = this.previewCanvas.width;
        const height = this.previewCanvas.height;

        // Draw the TEMPLATE (empty frame) scaled to standard size
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(this.templateImage, 0, 0, width, height);

        // Get image data for analysis (from the EMPTY template)
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        // Get center color (this should be the inner parchment color)
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const refColor = this.getAverageColor(data, width, height, centerX, centerY, 15);

        console.log('LassoTool: Center color of template:', refColor);

        // Calculate max delta from tolerance percent
        const maxDelta = Math.round(255 * (this.tolerance / 100));

        // === FLOOD FILL from center (only CONNECTED pixels) ===
        const selectionData = new Uint8ClampedArray(width * height);
        let minX = width, maxX = 0, minY = height, maxY = 0;
        let matchCount = 0;

        // Check if a pixel matches the reference color
        const colorMatches = (x: number, y: number) => {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            return Math.abs(r - refColor.r) <= maxDelta &&
                Math.abs(g - refColor.g) <= maxDelta &&
                Math.abs(b - refColor.b) <= maxDelta;
        };

        // Flood fill using a queue (BFS)
        const queue: [number, number][] = [[centerX, centerY]];
        selectionData[centerY * width + centerX] = 1;

        while (queue.length > 0) {
            const point = queue.shift();
            if (!point) break;
            const [x, y] = point;

            // Update bounds
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            matchCount++;

            // Check 4 neighbors (up, down, left, right)
            const neighbors: [number, number][] = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
            for (const [nx, ny] of neighbors) {
                // Bounds check
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                // Already visited?
                if (selectionData[ny * width + nx]) continue;
                // Does it match?
                if (colorMatches(nx, ny)) {
                    selectionData[ny * width + nx] = 1;
                    queue.push([nx, ny]);
                }
            }
        }

        console.log('LassoTool: Flood fill found', matchCount, 'connected pixels');

        // Draw selection overlay (green tint on selected areas)
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                if (selectionData[y * width + x]) {
                    // Tint green
                    data[idx] = Math.round(data[idx] * 0.7);      // R
                    data[idx + 1] = Math.min(255, data[idx + 1] + 50); // G
                    data[idx + 2] = Math.round(data[idx + 2] * 0.7);  // B
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

        // Draw bounding box
        if (matchCount > 0) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
            ctx.setLineDash([]);

            // Draw center cross
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(centerX - 30, centerY);
            ctx.lineTo(centerX + 30, centerY);
            ctx.moveTo(centerX, centerY - 30);
            ctx.lineTo(centerX, centerY + 30);
            ctx.stroke();
        }

        // Update info
        const areaWidth = maxX - minX;
        const areaHeight = maxY - minY;
        const coverage = ((matchCount / (width * height)) * 100).toFixed(1);

        const sizeEl = document.getElementById('lasso-size');
        const coverageEl = document.getElementById('lasso-coverage');
        if (sizeEl) sizeEl.textContent = `${areaWidth}x${areaHeight}`;
        if (coverageEl) coverageEl.textContent = `${coverage}%`;

        // Store detected area
        this.detectedArea = {
            top: minY + 20,       // Add padding
            bottom: maxY - 20,
            left: minX + 20,
            right: maxX - 20,
            width: areaWidth - 40,
            height: areaHeight - 40,
            coverage: coverage,
            tolerance: this.tolerance
        };
    }

    getAverageColor(data: Uint8ClampedArray, width: number, height: number, centerX: number, centerY: number, size: number) {
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

        if (count === 0) return { r: 0, g: 0, b: 0 };

        return {
            r: Math.round(r / count),
            g: Math.round(g / count),
            b: Math.round(b / count)
        };
    }

    confirm(): void {
        if (this.detectedArea && this.onConfirm) {
            console.log('LassoTool: Confirmed area:', this.detectedArea);
            this.onConfirm(this.detectedArea);
        }
        this.close();
    }

    close(): void {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}

export default LassoTool;
