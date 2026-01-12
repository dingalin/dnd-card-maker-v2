// @ts-nocheck
/**
 * Preview Manager - Handles fullscreen, zoom, and progress bar functionality
 */

export class PreviewManager {
    constructor() {
        this.zoomLevel = 100;
        this.currentStep = 0;
        // this.init(); // Removed auto-init to allow waiting for DOM
    }

    init() {
        this.setupFullscreen();
        this.setupZoom();
        this.setupKeyboardShortcuts();
    }

    // ==================== Fullscreen ====================

    setupFullscreen() {
        console.log("🔍 Setting up Fullscreen/Zoom interactions...");
        // DISABLED: Click-to-zoom removed per user request
        // The fullscreen toggle can still be accessed via keyboard shortcuts if enabled
        console.log("ℹ️ Click-to-zoom is disabled");

        // Close on Escape key is handled in setupKeyboardShortcuts
    }

    async openFullscreen() {
        const canvas = document.getElementById('card-canvas');
        if (!canvas) return;

        // Get current card data from state
        const cardData = window.stateManager?.getCardData?.() || null;

        // Get front image from canvas
        const frontImage = canvas.toDataURL('image/png');
        let backImage = null;

        // Try to render back side if we have card data with back content
        if (cardData) {
            const hasBackContent = cardData.back && (
                cardData.back.title ||
                cardData.back.description ||
                cardData.back.lore ||
                cardData.back.story
            );

            if (hasBackContent) {
                try {
                    // Import CardRenderer dynamically - FIX: Use .default for default export
                    const CardRenderer = (await import('./card-renderer.ts')).default;

                    // Create SEPARATE temp canvas for back (like TreasureController)
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = 750;
                    tempCanvas.height = 1050;
                    tempCanvas.id = 'temp-back-preview-' + Date.now();
                    tempCanvas.style.display = 'none';
                    document.body.appendChild(tempCanvas);

                    const tempRenderer = new CardRenderer(tempCanvas.id);
                    await tempRenderer.templateReady;

                    // Get settings
                    const currentState = window.stateManager?.getState?.() || {};
                    const backSettings = currentState.settings?.back || {};
                    const styleSettings = currentState.settings?.style || {};

                    // --- FIX: Load Custom Background if exists ---
                    if (styleSettings.cardBackgroundUrl) {
                        try {
                            console.log("previewManager: Loading custom background for enlarged view...", styleSettings.cardBackgroundUrl);
                            await tempRenderer.setTemplate(styleSettings.cardBackgroundUrl);
                        } catch (bgErr) {
                            console.warn("previewManager: Failed to load custom background, falling back to default.", bgErr);
                        }
                    }

                    // --- FIX: Spread ALL offsets to ensure widths/positions are correct ---
                    // Mimics RenderController logic
                    const renderOptions = {
                        ...backSettings.offsets, // Spread all offsets/widths (mechWidth, loreWidth, etc.)

                        fontSizes: backSettings.fontSizes,
                        fontStyles: backSettings.fontStyles,

                        // Fallbacks just in case
                        fontFamily: styleSettings.fontFamily || 'Heebo',
                        backgroundScale: currentState.settings?.front?.offsets?.backgroundScale ?? 1.0,

                        // Text Effects
                        textOutlineEnabled: styleSettings.textOutlineEnabled,
                        textOutlineWidth: styleSettings.textOutlineWidth,
                        textShadowEnabled: styleSettings.textShadowEnabled,
                        textShadowBlur: styleSettings.textShadowBlur,
                        textBackdropEnabled: styleSettings.textBackdropEnabled,
                        textBackdropOpacity: styleSettings.textBackdropOpacity
                    };

                    await tempRenderer.render(cardData, renderOptions, true);
                    backImage = tempCanvas.toDataURL('image/png');

                    // MEMORY LEAK FIX: Clear canvas dimensions to release GPU memory
                    tempCanvas.width = 0;
                    tempCanvas.height = 0;
                    document.body.removeChild(tempCanvas);
                    console.log('📸 PreviewManager: Back image rendered with custom settings');
                } catch (err) {
                    console.warn('Failed to render back for preview:', err);
                }
            }
        }

        // Import and use CardViewerService
        import('./services/CardViewerService.ts').then(({ CardViewerService }) => {
            CardViewerService.show({
                frontImage: frontImage,
                backImage: backImage,
                cardData: cardData,
                sourceElement: canvas
            });
        }).catch(err => {
            console.error('Failed to open card viewer:', err);
            const container = document.querySelector('.canvas-container');
            if (container) container.classList.toggle('expanded');
        });
    }

    closeFullscreen() {
        // CardViewerService handles its own close
        const container = document.querySelector('.canvas-container');
        if (container) {
            container.classList.remove('expanded');
        }
        // Also close CardViewerService if open
        if (window.cardViewerService) {
            window.cardViewerService.hide();
        }
    }

    // ==================== Zoom ====================

    setupZoom() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const zoomResetBtn = document.getElementById('zoom-reset-btn');
        const fullscreenContainer = document.querySelector('.fullscreen-canvas-container');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => this.zoomReset());
        }

        // Mouse wheel zoom
        if (fullscreenContainer) {
            fullscreenContainer.addEventListener('wheel', (e) => {
                e.preventDefault();
                if (e.deltaY < 0) {
                    this.zoomIn();
                } else {
                    this.zoomOut();
                }
            }, { passive: false });
        }
    }

    zoomIn() {
        if (this.zoomLevel < 300) {
            this.zoomLevel += 25;
            this.applyZoom();
        }
    }

    zoomOut() {
        if (this.zoomLevel > 25) {
            this.zoomLevel -= 25;
            this.applyZoom();
        }
    }

    zoomReset() {
        this.zoomLevel = 100;
        this.applyZoom();
    }

    applyZoom() {
        const fullscreenCanvas = document.getElementById('fullscreen-canvas');
        if (fullscreenCanvas) {
            fullscreenCanvas.style.transform = `scale(${this.zoomLevel / 100})`;
        }
        this.updateZoomDisplay();
    }

    updateZoomDisplay() {
        const zoomLevelDisplay = document.getElementById('zoom-level');
        if (zoomLevelDisplay) {
            zoomLevelDisplay.textContent = `${this.zoomLevel}%`;
        }
    }

    // ==================== Keyboard Shortcuts ====================

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            const container = document.querySelector('.canvas-container');
            const isFullscreen = container && container.classList.contains('expanded');

            // F key to toggle fullscreen
            if (e.key === 'f' || e.key === 'F') {
                if (!isFullscreen) {
                    this.openFullscreen();
                }
            }

            // Escape to close fullscreen
            if (e.key === 'Escape' && isFullscreen) {
                this.closeFullscreen();
            }

            // Plus/Minus for zoom when in fullscreen
            if (isFullscreen) {
                if (e.key === '+' || e.key === '=') {
                    this.zoomIn();
                } else if (e.key === '-') {
                    this.zoomOut();
                } else if (e.key === '0') {
                    this.zoomReset();
                }
            }
        });
    }

    // ==================== Progress Bar ====================

    /**
     * Update progress bar and steps during generation
     * @param {number} step - Current step (1-4)
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} text - Loading text to display
     */
    updateProgress(step, progress, text) {
        const progressBar = document.getElementById('progress-bar');
        const loadingText = document.getElementById('loading-text');
        const steps = document.querySelectorAll('.progress-steps .step');
        const connectors = document.querySelectorAll('.progress-steps .step-connector');

        // Update progress bar
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // Update loading text
        if (loadingText && text) {
            loadingText.textContent = text;
        }

        // Update steps
        steps.forEach((stepEl, index) => {
            const stepNum = index + 1;
            stepEl.classList.remove('active', 'completed');

            if (stepNum < step) {
                stepEl.classList.add('completed');
            } else if (stepNum === step) {
                stepEl.classList.add('active');
            }
        });

        // Update connectors
        connectors.forEach((connector, index) => {
            if (index < step - 1) {
                connector.classList.add('filled');
            } else {
                connector.classList.remove('filled');
            }
        });

        this.currentStep = step;
    }

    /**
     * Reset progress bar to initial state
     */
    resetProgress() {
        this.updateProgress(0, 0, window.i18n?.t('preview.loading') || 'Starting...');
        const connectors = document.querySelectorAll('.progress-steps .step-connector');
        connectors.forEach(c => c.classList.remove('filled'));
    }
}

// Create and export singleton
export const previewManager = new PreviewManager();
window.previewManager = previewManager;
