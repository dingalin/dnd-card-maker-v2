// @ts-nocheck
import { GeneratorUIManager } from './generator/GeneratorUIManager';
import { GenerationManager } from './generator/GenerationManager';
import { AutoLayoutManager } from './generator/AutoLayoutManager';
import { StateManager } from '../state';
import { I18nService } from '../i18n';

// Helper interface for implicit globals if needed
interface WindowGlobals {
    i18n?: I18nService;
    cardRenderer?: any;
    backgroundManager?: any;
    OFFICIAL_ITEMS: any;
}

export class GeneratorController {
    private state: StateManager;
    private ui: any;
    private preview: any;
    private layoutManager: any;

    constructor(stateManager: StateManager, uiManager: any, previewManager: any) {
        this.state = stateManager;
        this.preview = previewManager;

        // Initialize sub-managers
        this.ui = new GeneratorUIManager(this, uiManager, previewManager);
        this.layoutManager = new AutoLayoutManager(stateManager);
        // GenerationManager is initialized per-request to ensure fresh API key

        this.ui.setupListeners();
        this.setupExternalListeners();
    }

    setupExternalListeners() {
        // Listen for auto-equip generation requests
        document.addEventListener('auto-equip-generate-item', async (e: any) => {
            await this.onAutoEquipGenerateItem(e.detail);
        });

        // Listen for Assembly Table generation requests
        document.addEventListener('assembly-generate-item', async (e: any) => {
            await this.onAssemblyGenerateItem(e.detail);
        });
    }

    _getManager() {
        const apiKey = this.ui.getApiKey();
        if (!apiKey) return null;
        return new GenerationManager(apiKey, this.state);
    }

    async onGenerate(e: Event | undefined) {
        if (e) e.preventDefault();

        const manager = this._getManager();
        if (!manager) return;

        const params = this.ui.getGenerationParams(e);
        const i18n = (window as unknown as WindowGlobals).i18n;
        this.ui.setLoading(true, i18n?.t('preview.starting') || 'Starting...');

        try {
            const result = await manager.generateItem(params, (step: number, pct: number, msg: string) => {
                this.ui.updateProgress(step, pct, msg);
            });

            // Update UI if random subtype was generated
            if (result.generatedSubtype) {
                this.ui.updateNoteUI(params.level, params.type, result.generatedSubtype);
            }

            this.state.setCardData(result.cardData);
            this.state.saveCurrentCard();

            // Allow state to update "Last Visual Prompt"
            this.state.setLastVisualPrompt(result.cardData.visualPrompt);

            // Enable Save Button
            this.ui.setButtonState('save-gallery-btn', false);

            this.ui.updateProgress(4, 100, i18n?.t('preview.ready') || 'Ready!');
            await new Promise(r => setTimeout(r, 500));
            this.ui.setLoading(false);

            // Apply default layout to the newly generated card
            // This ensures consistent positioning for all new cards
            await this.onAutoLayout();

        } catch (error: any) {
            console.error(error);
            this.ui.setLoading(false);
            this.ui.globalUI.showToast(error.message, 'error');
        }
    }

    async onRegenerateImage() {
        const manager = this._getManager();
        if (!manager) return;

        const currentState = this.state.getState();
        const i18n = (window as unknown as WindowGlobals).i18n;

        // ALWAYS use form params for image generation - this is the "Appearance" button
        // which should generate an image based on CURRENT form selection, not old cardData
        const params = this.ui.getGenerationParams();
        console.log('🖼️ onRegenerateImage - using form params:', params);

        // Check for custom visual prompt override
        const container = document.getElementById('custom-visual-prompt') as HTMLTextAreaElement | null;
        const customPrompt = container?.value?.trim();

        // Use imageOnly mode - generates visual prompt via Gemini then creates just the image
        const imageOnlyParams = {
            ...params,
            imageOnly: true,
            complexityMode: 'simple',
            overrides: {
                ...params.overrides,
                customVisualPrompt: customPrompt || undefined
            }
        };

        this.ui.setLoading(true, i18n?.t('preview.creatingPrompt') || 'Creating image...');

        try {
            const result = await manager.generateItem(imageOnlyParams, (step: number, pct: number, msg: string) => {
                this.ui.updateProgress(step, pct, msg);
            });

            // Merge with existing cardData if present, otherwise use new result
            const newCardData = currentState.cardData
                ? {
                    ...currentState.cardData,
                    imageUrl: result.cardData.imageUrl,
                    visualPrompt: result.cardData.visualPrompt,
                    front: {
                        ...currentState.cardData.front!,
                        imageUrl: result.cardData.imageUrl
                    }
                }
                : result.cardData;

            this.state.setCardData(newCardData);
            this.ui.updateProgress(4, 100, i18n?.t('preview.ready') || 'Ready!');
            await new Promise(r => setTimeout(r, 500));
            this.ui.setLoading(false);

            this.ui.globalUI.showToast(i18n?.t('toasts.newImageCreated') || 'New image created!', 'success');
        } catch (error: any) {
            console.error(error);
            this.ui.setLoading(false);
            this.ui.globalUI.showToast(i18n?.t('toasts.errorCreatingImage') || 'Error creating image', 'error');
        }
    }

    async onRegenerateStats() {
        const manager = this._getManager();
        if (!manager) return;

        const currentState = this.state.getState();
        if (!currentState.cardData) return;
        const i18n = (window as unknown as WindowGlobals).i18n;

        this.ui.setButtonState('regen-stats-btn', true);

        try {
            const originalParams = (currentState.cardData as any).originalParams || {};

            // Re-read UI params to allow changing level/type during regen
            const uiParams = this.ui.getGenerationParams(); // passing undefined event

            // Merge: UI params take precedence if valid, else original params
            const type = uiParams.type || originalParams.type || 'wondrous';
            const level = uiParams.level || originalParams.level || '1-4';
            const subtype = uiParams.subtype || originalParams.subtype;

            // Construct params for manager
            const genParams = {
                ...uiParams, // includes overrides etc
                type,
                level,
                subtype,
                skipImage: true,
                existingImageUrl: currentState.cardData.front?.imageUrl || currentState.cardData.imageUrl
            };

            const result = await manager.generateItem(genParams);

            // Preserve originalParams but update with new choices
            const newCardData = {
                ...result.cardData,
                originalParams: { ...originalParams, type, subtype }
            };

            this.state.setCardData(newCardData);
            this.ui.globalUI.showToast(i18n?.t('toasts.newStatsCreated') || 'New stats created!', 'success');

        } catch (error) {
            console.error(error);
            this.ui.globalUI.showToast(i18n?.t('toasts.errorCreatingStats') || 'Error creating stats', 'error');
        } finally {
            this.ui.setButtonState('regen-stats-btn', false);
        }
    }

    async onGenerateBackground() {
        const manager = this._getManager();
        if (!manager) return;
        const i18n = (window as unknown as WindowGlobals).i18n;

        this.ui.setButtonState('generate-bg-btn', true, i18n?.t('generator.calculating') || 'Processing...');

        try {
            const theme = (document.getElementById('bg-theme-select') as HTMLSelectElement)?.value || 'Fire';
            const style = (document.getElementById('bg-style-select') as HTMLSelectElement)?.value || 'watercolor';
            const model = (document.getElementById('bg-model-select') as HTMLSelectElement)?.value || 'getimg-flux';
            const getImgKey = (document.getElementById('getimg-api-key') as HTMLInputElement)?.value.trim() || '';

            const bgUrl = await manager.generateBackground(theme, style, model, getImgKey);

            let persistentBgUrl = bgUrl;
            if (bgUrl.startsWith('blob:')) {
                const { blobToBase64 } = await import('../utils');
                persistentBgUrl = await blobToBase64(bgUrl);
            }

            this.state.updateStyle('cardBackgroundUrl', persistentBgUrl);
            if ((window as any).stateManager) (window as any).stateManager.notify('settings.style');

            this.ui.globalUI.showToast(i18n?.t('toasts.newBackgroundCreated') || 'New background created!', 'success');
        } catch (error) {
            this.ui.globalUI.showToast(i18n?.t('toasts.errorCreatingBackground') || 'Error creating background', 'error');
        } finally {
            this.ui.setButtonState('generate-bg-btn', false, i18n?.t('cardBackground.generate') || 'Create Background');
        }
    }

    async onSurprise(e: Event | undefined) {
        if (e) e.preventDefault();
        const apiKey = this.ui.getApiKey();
        if (!apiKey) return;
        const i18n = (window as unknown as WindowGlobals).i18n;

        // 0. Random Background
        const bgManager = (window as unknown as WindowGlobals).backgroundManager;
        if (bgManager) {
            this.ui.globalUI.showToast(i18n?.t('toasts.selectingRandomBg') || 'Selecting random background...', 'info');
            await bgManager.pickRandomBackground();
        }

        // 1. Randomize Params
        const levels = ['1-4', '5-10', '11-16', '17+'];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];

        const OFFICIAL_ITEMS = (window as unknown as WindowGlobals).OFFICIAL_ITEMS;
        const types = Object.keys(OFFICIAL_ITEMS);
        const randomType = types[Math.floor(Math.random() * types.length)];

        // Get random subtype logic locally to update UI
        let randomSubtype = '';
        if (OFFICIAL_ITEMS[randomType]) {
            const categories = OFFICIAL_ITEMS[randomType];
            const allSubtypes = [];
            for (const cat in categories) {
                if (Array.isArray(categories[cat])) allSubtypes.push(...categories[cat]);
            }
            if (allSubtypes.length > 0) {
                randomSubtype = allSubtypes[Math.floor(Math.random() * allSubtypes.length)];
            }
        }

        // 2. Update UI
        this.ui.updateNoteUI(randomLevel, randomType, randomSubtype);
        this.ui.globalUI.showToast(i18n?.t('toasts.surpriseRolling') || 'Rolling surprise item...', 'info');

        // 3. Trigger Generation (which now includes auto-layout)
        await this.onGenerate(e);
    }

    async onAutoLayout() {
        const i18n = (window as unknown as WindowGlobals).i18n;

        this.ui.setButtonState('auto-layout-btn', true, i18n?.t('generator.calculating') || 'Calculating...');

        try {
            // Reset all settings to their default values
            this.state.resetToDefaults();

            // Get the new default values to update UI
            const newSettings = this.state.getState().settings;

            // Update all UI sliders with the default values
            const frontOffsets = newSettings.front.offsets;
            const allSliderValues = {
                name: frontOffsets.name,
                type: frontOffsets.type,
                rarity: frontOffsets.rarity,
                stats: frontOffsets.stats,
                coreStats: frontOffsets.coreStats,
                gold: frontOffsets.gold,
                imageYOffset: frontOffsets.imageYOffset,
                imageScale: frontOffsets.imageScale,
                imageRotation: frontOffsets.imageRotation,
                imageFade: frontOffsets.imageFade,
                imageShadow: frontOffsets.imageShadow,
                nameWidth: frontOffsets.nameWidth,
                typeWidth: frontOffsets.typeWidth,
                rarityWidth: frontOffsets.rarityWidth,
                coreStatsWidth: frontOffsets.coreStatsWidth,
                statsWidth: frontOffsets.statsWidth,
                goldWidth: frontOffsets.goldWidth,
                backgroundScale: frontOffsets.backgroundScale
            };
            this.ui.updateLayoutSliders(allSliderValues);

            // Update font size displays
            const frontFontSizes = newSettings.front.fontSizes;
            this.ui.updateFontSizeDisplay(frontFontSizes.nameSize || 64);

            // === UPDATE BACK CARD UI SLIDERS ===
            const backOffsets = newSettings.back.offsets;
            const backFontSizes = newSettings.back.fontSizes;

            // Update back card position sliders
            const setSlider = (id: string, val: number | undefined) => {
                const el = document.getElementById(id) as HTMLInputElement;
                if (el && val !== undefined) {
                    el.value = String(val);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                }
            };

            setSlider('ability-offset', backOffsets.abilityName);
            setSlider('mech-offset', backOffsets.mech);
            setSlider('lore-offset', backOffsets.lore);
            setSlider('ability-width', backOffsets.mechWidth);
            setSlider('lore-width', backOffsets.loreWidth);

            // Update back card font size sliders
            const updateDisplay = (displayId: string, val: number | undefined) => {
                const el = document.getElementById(displayId);
                if (el && val !== undefined) {
                    el.textContent = `${val}px`;
                }
            };

            updateDisplay('abilityNameSize-display', backFontSizes.abilityNameSize);
            updateDisplay('mechSize-display', backFontSizes.mechSize);
            updateDisplay('loreSize-display', backFontSizes.loreSize);

            this.ui.globalUI.showToast(i18n?.t('toasts.autoLayoutComplete') || 'Reset to defaults!', 'success');
        } catch (error) {
            console.error(error);
            this.ui.globalUI.showToast(i18n?.t('toasts.autoLayoutError') || 'Auto layout error', 'error');
        } finally {
            this.ui.setButtonState('auto-layout-btn', false, '✨ כיוונון אוטומטי');
        }
    }

    async onLassoTool() {
        const canvas = document.getElementById('card-canvas');
        if (!canvas) return;

        // Get template from global renderer (ugly dependency but consistent with old code)
        const templateImg = (window as unknown as WindowGlobals).cardRenderer?.template;
        const i18n = (window as unknown as WindowGlobals).i18n;

        try {
            await this.layoutManager.openLassoTool(templateImg, canvas, async (detectedArea: any) => {
                const currentState = this.state.getState();
                const layout = await this.layoutManager.calculateLayoutWithArea(currentState.cardData, detectedArea, currentState.settings);

                this.layoutManager.applyLayoutToState(layout);
                this.ui.updateLayoutSliders(layout.offsets);

                this.ui.globalUI.showToast(i18n?.t('toasts.layoutApplied') || 'Layout applied!', 'success');
            });
        } catch (error: any) {
            this.ui.globalUI.showToast(error.message, 'error');
        }
    }

    async onAutoEquipGenerateItem(detail: any) {
        const manager = this._getManager();
        let m = manager;
        if (!m) {
            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey) m = new GenerationManager(storedKey, this.state);
        }

        if (!m) {
            console.error("Auto Equip: No API Key");
            return;
        }

        try {
            const ability = (document.getElementById('item-ability') as HTMLInputElement)?.value.trim() || '';
            const manualDamage = (document.getElementById('weapon-damage') as HTMLInputElement)?.value.trim() || '';
            const manualAC = (document.getElementById('armor-class') as HTMLInputElement)?.value.trim() || '';

            const result = await m.generateAutoEquipItem(detail, {
                ability,
                manualDamage,
                manualAC
            });

            // Render both front AND back thumbnails for the equipment slot
            let thumbnailUrl = result.imageUrl;
            let backThumbnailUrl: string | null = null;

            try {
                const { renderCardThumbnail } = await import('../utils/CardThumbnailRenderer.ts');
                console.log('📸 Auto-equip card data:', {
                    abilityName: result.abilityName || result.back?.title,
                    abilityDesc: result.abilityDesc || result.back?.mechanics,
                    description: result.description || result.back?.lore
                });
                const thumbnails = await renderCardThumbnail(result, result.imageUrl, this.state, true);
                thumbnailUrl = thumbnails.front || result.imageUrl;
                backThumbnailUrl = thumbnails.back || null;
                console.log('✅ Card thumbnails rendered for auto-equip - back exists:', backThumbnailUrl ? 'YES' : 'NO');
            } catch (thumbnailError) {
                console.warn('Could not render thumbnails, using raw image:', thumbnailError);
            }

            // Add the thumbnails to the card data
            result.thumbnail = thumbnailUrl;
            result.backThumbnail = backThumbnailUrl;

            document.dispatchEvent(new CustomEvent('request-character-equip-item', {
                detail: {
                    cardData: result,
                    imageUrl: thumbnailUrl,
                    backImageUrl: backThumbnailUrl,
                    isRenderedCard: true,
                    targetSlotId: detail.slotId // Pass the target slot directly
                }
            }));
            console.log(`✅ Auto-equip item generated for slot: ${detail.slotId}`);

        } catch (error) {
            console.error("Auto Equip Error", error);
        }
    }

    async onAssemblyGenerateItem(buildData: any) {
        const manager = this._getManager();
        if (!manager) return;
        const i18n = (window as unknown as WindowGlobals).i18n;

        this.ui.setLoading(true, i18n?.t('preview.starting') || 'Starting...');

        try {
            const result = await manager.generateAssemblyItem(buildData, (s: number, p: number, m: string) => this.ui.updateProgress(s, p, m));

            this.state.setCardData(result);
            this.state.saveCurrentCard();

            this.state.setLastVisualPrompt(result.visualPrompt);

            this.ui.setButtonState('save-gallery-btn', false);
            this.ui.updateProgress(4, 100, i18n?.t('preview.ready') || 'Ready!');
            await new Promise(r => setTimeout(r, 500));
            this.ui.setLoading(false);

            (document.querySelector('[data-tab="creator"]') as HTMLElement)?.click();
            this.ui.globalUI.showToast(i18n?.t('toasts.cardCreated') || 'Card created!', 'success');

        } catch (error: any) {
            console.error(error);
            this.ui.setLoading(false);
            this.ui.globalUI.showToast(error.message, 'error');
        }
    }
}
