// @ts-nocheck
import { GetImgService } from '../services/GetImgService.ts';
import i18n from '../i18n.ts';
import { CharacterUIManager } from './character/CharacterUIManager.ts';
import { CharacterEquipmentManager } from './character/CharacterEquipmentManager.ts';

interface WindowGlobals {
    i18n?: any;
    uiManager?: any;
    stateManager?: any;
    characterController?: any;
}

export class CharacterController {
    public state: any;
    public itemRegistry: Map<string, any>;
    public backpackItems: Map<number, any>;
    public ui: CharacterUIManager;
    public equipment: CharacterEquipmentManager;
    private localeListenerRegistered: boolean = false;

    constructor(stateManager: any) {
        this.state = stateManager;     // Reference to global state

        // Central Data Stores
        this.itemRegistry = new Map(); // Stores cardData by UUID
        this.backpackItems = new Map(); // Stores backpack items by slot index

        // Initialize Sub-Managers
        this.ui = new CharacterUIManager(this);
        this.equipment = new CharacterEquipmentManager(this, this.itemRegistry, this.backpackItems);

        this.init();
    }

    init() {
        console.log("CharacterController: Initializing...");

        // Initialize UI and Equipment systems
        this.ui.setupListeners();
        this.ui.populateOptions();
        this.equipment.initBackpack();
        this.equipment.setupDragDrop();

        // Register locale change listener
        if (!this.localeListenerRegistered) {
            this.localeListenerRegistered = true;
            i18n.onLocaleChange(() => {
                this.ui.populateOptions();
            });
        }
    }

    // ============================================
    // Core Actions (Delegated from UI or Events)
    // ============================================

    /**
     * Generate a new character portrait
     */
    async generateCharacter() {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            alert(i18n.t('character.apiKeyRequired'));
            return;
        }

        // Gather data from UI inputs
        // Note: Ideally UI Manager should gather this, but standard DOM access is fine here
        const race = (document.getElementById('char-race') as HTMLSelectElement)?.value;
        const charClass = (document.getElementById('char-class') as HTMLSelectElement)?.value;
        const background = (document.getElementById('char-background') as HTMLInputElement)?.value;
        const gender = (document.getElementById('char-gender') as HTMLSelectElement)?.value || 'male';
        const pose = (document.getElementById('char-pose') as HTMLSelectElement)?.value;
        const style = (document.getElementById('char-style') as HTMLSelectElement)?.value || 'portrait';
        const artStyleVal = (document.getElementById('char-art-style') as HTMLSelectElement)?.value;

        // Construct Prompt
        let artStylePrompt = 'oil painting';
        if (artStyleVal) {
            if (artStyleVal === 'comic_book') {
                artStylePrompt = 'detailed comic book art, graphic novel style, bold ink lines, flat colors, cel shaded';
            } else {
                artStylePrompt = artStyleVal.replace(/_/g, ' ');
            }
        }

        const styleDesc = style === 'full_body'
            ? 'full body shot, showing entire character from head to toe, detailed clothing and boots'
            : 'close up face portrait, head and shoulders only, detailed facial features, looking at camera';

        const prompt = `Fantasy RPG character art, ${artStylePrompt} style, ${styleDesc} of a ${gender} ${race} ${charClass}, ${background ? background + ' background, ' : ''}${pose} pose, highly detailed, dramatic lighting, masterpiece. Ensure no text, no writing, no watermarks, no logos, no brand names, clean image.`;

        console.log("Generating with Prompt:", prompt);
        this.ui.setLoading(true);

        try {
            const service = new GetImgService(apiKey);
            const b64Image = await service.generateImage(prompt);
            const imageUrl = `data:image/jpeg;base64,${b64Image}`;

            // Update UI
            this.updatePortrait(imageUrl);

        } catch (error: any) {
            console.error("Generation Error:", error);
            if (error && error.message && (error.message.includes('401') || error.message.includes('auth'))) {
                localStorage.removeItem('getimg_api_key');
                alert(i18n.t('character.checkApiKey'));
            } else {
                alert(i18n.t('character.generationError', { error: error ? error.message : 'Unknown error' }));
            }
        } finally {
            this.ui.setLoading(false);
        }
    }

    /**
     * Trigger auto-equip for all empty slots
     */
    async autoEquipAllSlots() {
        // Delegate to equipment manager
        await this.equipment.autoEquipAllSlots();
    }

    /**
     * Export all items to History Gallery
     */
    exportAllToGallery() {
        if (!this.state) return;

        let count = 0;

        // Export equipped items
        this.itemRegistry.forEach((cardData) => {
            if (cardData) {
                // We need to set state so saveToHistory knows what to save
                // This mimics the original functionality which likely did this
                this.state.setCardData(cardData);
                // The thumbnail argument is what's used for the history grid usually
                const image = cardData.thumbnail || cardData.image;
                this.state.saveToHistory(image);
                count++;
            }
        });

        const globals = window as unknown as WindowGlobals;
        if (globals.uiManager) {
            globals.uiManager.showToast(i18n.t('character.exportedCount', { count }), 'success');
        }
    }

    // ============================================
    // Helpers / Gateways
    // ============================================

    updatePortrait(imageUrl: string) {
        this.ui.updatePortrait(imageUrl);
    }

    getApiKey() {
        let key = localStorage.getItem('getimg_api_key');
        if (!key) {
            key = prompt('אנא הכנס מפתח API של GetImg (Flux):');
            if (key) {
                localStorage.setItem('getimg_api_key', key.trim());
            }
        }
        return key;
    }

    /**
     * Handle Slot Click (Delegated from UI)
     */
    handleSlotClick(e: Event) {
        // Handled by specific managers or ignored if covered by drag-drop/view logic
    }

    /**
     * Handle Equip Request (from RenderController)
     */
    handleEquipRequest(itemData: any) {
        // Ensure card is in registry (or add it)
        const uniqueId = itemData.uniqueId || Date.now().toString();
        // Enrich if necessary
        if (!itemData.uniqueId) itemData.uniqueId = uniqueId;

        this.itemRegistry.set(uniqueId, itemData);

        // Simulate a drag data object for auto-slotting
        const dragData = {
            uniqueId: uniqueId,
            itemName: itemData.name,
            imageSrc: itemData.image || itemData.thumbnail,
            sourceType: 'generated', // New source type
            sourceId: 'generator'
        };

        this.equipment.handleAutoSlotFromBackpack(dragData);
    }
}
