// @ts-nocheck
import { GeneratorUIManager } from './generator/GeneratorUIManager.js';
import { GenerationManager } from './generator/GenerationManager.js';
import { AutoLayoutManager } from './generator/AutoLayoutManager.js';
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
        if (!currentState.cardData) return;

        const container = document.getElementById('custom-visual-prompt') as HTMLTextAreaElement | null;
        const customPrompt = container?.value?.trim();
        const prompt = customPrompt || currentState.cardData.visualPrompt || currentState.lastVisualPrompt;
        const i18n = (window as unknown as WindowGlobals).i18n;

        if (!prompt) {
            this.ui.globalUI.showToast(i18n?.t('toasts.noPromptSaved') || 'No prompt saved', 'warning');
            return;
        }

        this.ui.setButtonState('regen-image-btn', true);

        try {
            const imageUrl = await manager.generateImage(prompt);

            let persistentImageUrl = imageUrl;
            if (imageUrl.startsWith('blob:')) {
                const { blobToBase64 } = await import('../utils');
                persistentImageUrl = await blobToBase64(imageUrl);
            }

            const newCardData = {
                ...currentState.cardData,
                imageUrl: persistentImageUrl,
                front: {
                    ...currentState.cardData.front!,
                    imageUrl: persistentImageUrl
                }
            };

            this.state.setCardData(newCardData);
            this.ui.globalUI.showToast(i18n?.t('toasts.newImageCreated') || 'New image created!', 'success');
        } catch (error) {
            console.error(error);
            this.ui.globalUI.showToast(i18n?.t('toasts.errorCreatingImage') || 'Error creating image', 'error');
        } finally {
            this.ui.setButtonState('regen-image-btn', false);
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

            document.dispatchEvent(new CustomEvent('request-character-equip-item', {
                detail: {
                    cardData: result,
                    imageUrl: result.imageUrl,
                    isRenderedCard: false
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
