import { stateManager } from './state.js';

class UIManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.init();
    }

    init() {
        // Subscribe to state changes
        stateManager.subscribe((state, changedKey) => {
            this.handleStateChange(state, changedKey);
        });
    }

    handleStateChange(state, changedKey) {
        if (changedKey === 'cardData') {
            this.updateEditor(state.cardData);
            this.render(state);
        } else if (changedKey.startsWith('cardData.')) {
            // Single field update, just render
            this.render(state);
        } else if (changedKey.startsWith('settings.')) {
            this.render(state);
            this.updateSettingsUI(state.settings);
        }
    }

    updateEditor(data) {
        if (!data) return;

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('edit-name', data.name);
        setVal('edit-type', data.typeHe);
        setVal('edit-rarity', data.rarityHe);
        setVal('edit-ability-name', data.abilityName);
        setVal('edit-ability-desc', data.abilityDesc);
        setVal('edit-desc', data.description);
        setVal('edit-gold', data.gold);

        // Update Font Size Displays
        if (data.fontSizes) {
            for (const [key, value] of Object.entries(data.fontSizes)) {
                const display = document.getElementById(`${key}-display`);
                if (display) display.textContent = `${value}px`;
            }
        }
    }

    updateSettingsUI(settings) {
        // Update slider displays if needed (most are handled by input event, but good for sync)
        if (settings.offsets) {
            const setDisplay = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            };
            setDisplay('image-scale-val', settings.offsets.imageScale?.toFixed(1));
            setDisplay('edit-image-scale-val', settings.offsets.imageScale?.toFixed(1));
            setDisplay('image-rotation-val', `${settings.offsets.imageRotation}°`);
            setDisplay('edit-image-rotation-val', `${settings.offsets.imageRotation}°`);
        }

        // Update Font Size Displays
        if (settings.fontSizes) {
            for (const [key, value] of Object.entries(settings.fontSizes)) {
                const display = document.getElementById(`${key}-display`);
                if (display) display.textContent = `${value}px`;
            }
        }
    }

    async render(state) {
        if (!state.cardData || !this.renderer) return;

        // Combine state settings with cardData specific overrides if any
        // (Logic from result-manager: cardData.offsets/fontSizes take precedence if they exist)
        // In this new architecture, we should probably merge them in StateManager, 
        // but for now let's use the centralized settings from state.

        const renderOptions = {
            ...state.settings.offsets,
            fontSizes: state.settings.fontSizes,
            fontFamily: state.settings.style.fontFamily,
            imageStyle: state.settings.style.imageStyle,
            imageColor: state.settings.style.imageColor
        };

        await this.renderer.render(state.cardData, renderOptions);
    }
}

export default UIManager;
