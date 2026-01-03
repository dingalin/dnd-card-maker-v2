// @ts-nocheck
import { FrontCardRenderer } from './rendering/FrontCardRenderer.ts';
import { BackCardRenderer } from './rendering/BackCardRenderer.ts';
import { CANVAS } from './config/CanvasConfig';

// detect base path for github pages or local development
/* 
 * NOTE: Base path logic is no longer needed for assets imported via Vite, 
 * but kept if needed for other dynamically constructed paths.
 */
// const getBasePath = () => {
//     const isGithubPages = window.location.hostname.includes('github.io');
//     const repoName = 'dnd-card-creator';
//     return isGithubPages ? `/${repoName}/` : '/';
// };

// const BASE_PATH = getBasePath();
// const cardTemplateUrl = `${BASE_PATH}assets/card-template.png`;
const cardTemplateUrl = new URL('/assets/card-template.png', import.meta.url).href; // Vite-friendly

class CardRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        // Initial setup
        this.template = new Image();
        this.template.crossOrigin = "anonymous"; // Enable CORS for the template image
        this.templateLoaded = false;

        // Load default template immediately
        this._loadTemplate();
    }

    reset() {
        this.templateLoaded = false;
        this._loadTemplate();
    }

    _loadTemplate() {
        console.log("CardRenderer: Loading default template from:", cardTemplateUrl);

        this.templateReady = new Promise((resolve, reject) => {
            this.template.onload = () => {
                this.templateLoaded = true;
                console.log("CardRenderer: Template loaded successfully", {
                    width: this.template.width,
                    height: this.template.height,
                    naturalWidth: this.template.naturalWidth
                });

                // Set canvas size to FIXED dimensions for consistent element positioning
                // All backgrounds will be stretched to fit this standard size
                // Using CANVAS config as single source of truth
                this.canvas.width = CANVAS.WIDTH;
                this.canvas.height = CANVAS.HEIGHT;
                console.log(`CardRenderer: Canvas set to fixed size ${CANVAS.WIDTH}x${CANVAS.HEIGHT}`);
                resolve();
            };
            this.template.onerror = (e) => {
                console.error("CardRenderer: Failed to load template image", e);
                this.templateLoaded = false;
                reject(e);
            };
            // Add timestamp to prevent caching issues if needed
            this.template.src = cardTemplateUrl;
        });
    }

    setTemplate(url) {
        console.log("CardRenderer: Switching template to:", url);
        this.templateReady = new Promise((resolve, reject) => {
            this.template.onload = () => {
                this.templateLoaded = true;
                // NOTE: Do NOT change canvas dimensions here!
                // Canvas should remain at fixed size for consistent element positioning.
                // The background will be stretched to fill the canvas in drawTemplate()
                console.log("CardRenderer: New template loaded (canvas size unchanged at", this.canvas.width, "x", this.canvas.height, ")");
                resolve();
            };
            this.template.onerror = (e) => {
                console.error("CardRenderer: Failed to load new template", e);
                // Don't set loaded to false, keep previous or fail gracefully
                reject(e);
            };
            this.template.src = url;
        });
    }

    async render(sourceData, options = {}, isFlipped = false) {
        if (!sourceData) {
            console.warn("CardRenderer: No data provided to render");
            return;
        }

        // Merge card data
        const cardData = { ...sourceData };

        // Ensure template is ready
        if (!this.templateLoaded) {
            try {
                await this.templateReady;
            } catch (e) {
                console.error("CardRenderer: Cannot render, template not ready");
                return;
            }
        }

        // ALWAYS enforce fixed canvas size before render
        // This ensures consistent element positioning regardless of how we got here
        if (this.canvas.width !== CANVAS.WIDTH || this.canvas.height !== CANVAS.HEIGHT) {
            console.log(`CardRenderer: Enforcing fixed canvas size ${CANVAS.WIDTH}x${CANVAS.HEIGHT} (was`, this.canvas.width, "x", this.canvas.height, ")");
            this.canvas.width = CANVAS.WIDTH;
            this.canvas.height = CANVAS.HEIGHT;
        }

        // Use the helper for the main render flow too
        await this._renderWithDoubleBuffer(async (offCtx, offCanvas) => {
            if (isFlipped) {
                await BackCardRenderer.render(offCtx, offCanvas, cardData, options, this.template);
            } else {
                await FrontCardRenderer.render(offCtx, offCanvas, cardData, options, this.template);
            }
        });

        // Dispatch event that render is complete (useful for thumbnails)
        document.dispatchEvent(new CustomEvent('card-render-complete', { detail: { isFlipped } }));
    }

    // Helper: Kept for compatibility
    async renderFront(cardData, options = {}) {
        await this._renderWithDoubleBuffer(async (ctx, canvas) => {
            await FrontCardRenderer.render(ctx, canvas, cardData, options, this.template);
        });
    }

    // Helper: Kept for compatibility
    async renderBack(cardData, options = {}) {
        await this._renderWithDoubleBuffer(async (ctx, canvas) => {
            await BackCardRenderer.render(ctx, canvas, cardData, options, this.template);
        });
    }

    /**
     * Internal helper to handle double buffering.
     * @param {Function} renderFn - Async function (ctx, canvas) => Promise<void>
     */
    async _renderWithDoubleBuffer(renderFn) {
        if (!this.offscreenCanvas) {
            this.offscreenCanvas = document.createElement('canvas');
        }
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        const offCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });

        // offCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height); // Optional

        await renderFn(offCtx, this.offscreenCanvas);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    }

    async downloadCard(filename = 'card') {
        try {
            console.log(`CardRenderer: Starting save process for "${filename}"`);

            // Ensure filename ends with .jpg
            let finalName = filename.replace(/\.(png|jpg|jpeg)$/i, '');
            finalName = `${finalName}.jpg`;

            // 1. Modern Method: window.showSaveFilePicker (Allows user to choose folder)
            if (window.showSaveFilePicker) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: finalName,
                        types: [{
                            description: 'JPG Image',
                            accept: { 'image/jpeg': ['.jpg'] },
                        }],
                    });

                    const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/jpeg', 0.9));
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    console.log(`Card saved via FilePicker: ${finalName}`);
                    return; // Success, exit
                } catch (err) {
                    if (err.name === 'AbortError') {
                        console.log('User cancelled save dialog');
                        return;
                    }
                    console.warn('FilePicker failed, trying fallback:', err);
                    // Fallthrough to fallback
                }
            }

            // 2. Fallback Method: Classic <a> tag with Blob (Better for special chars than DataURL)
            const blob = await new Promise(resolve => this.canvas.toBlob(resolve, 'image/jpeg', 0.9));
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.download = finalName;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Cleanup
            setTimeout(() => URL.revokeObjectURL(url), 100);
            console.log(`Card downloaded via fallback: ${finalName}`);

        } catch (e) {
            console.error("Download/Save failed:", e);
            if (window.confirm("שגיאה בשמירת הקובץ. האם ברצונך לנסות שוב?")) {
                this.downloadCard(filename);
            }
        }
    }
}

export default CardRenderer;
