class ResultManager {
    constructor() {
        this.currentCardData = null;
        this.renderer = null;
        this.defaults = {
            nameSize: 60,
            typeSize: 24,
            raritySize: 24,
            abilityNameSize: 28,
            abilityDescSize: 24,
            descSize: 22,
            goldSize: 24
        };
    }

    async init(rendererInstance) {
        this.renderer = rendererInstance;
        console.log("ResultManager initialized");
    }

    getDefaultFontSize(target) {
        return this.defaults[target] || 24;
    }

    async updateLayout() {
        if (!this.currentCardData || !this.renderer) return;

        const getVal = (id, def) => {
            const el = document.getElementById(id);
            return el ? (parseInt(el.value) || def) : def;
        };

        const nameOffset = getVal('name-offset', 0);
        const typeOffset = getVal('type-offset', 0);
        const rarityOffset = getVal('rarity-offset', 0);
        const abilityOffset = getVal('ability-offset', 0);
        const fluffOffset = getVal('fluff-offset', 20);
        const goldOffset = getVal('gold-offset', 0);
        const imageOffset = getVal('image-offset', 0);

        // Check for edit controls first, fall back to generation controls
        const imageScale = parseFloat(document.getElementById('edit-image-scale')?.value) || parseFloat(document.getElementById('image-scale')?.value) || 1.0;
        const imageRotation = parseInt(document.getElementById('edit-image-rotation')?.value) || parseInt(document.getElementById('image-rotation')?.value) || 0;

        // Update displays
        const scaleDisplay = document.getElementById('image-scale-val');
        if (scaleDisplay) scaleDisplay.textContent = imageScale.toFixed(1);
        const editScaleDisplay = document.getElementById('edit-image-scale-val');
        if (editScaleDisplay) editScaleDisplay.textContent = imageScale.toFixed(1);

        const rotDisplay = document.getElementById('image-rotation-val');
        if (rotDisplay) rotDisplay.textContent = `${imageRotation}°`;
        const editRotDisplay = document.getElementById('edit-image-rotation-val');
        if (editRotDisplay) editRotDisplay.textContent = `${imageRotation}°`;

        const fontFamilyEl = document.getElementById('font-family-select');
        const fontFamily = fontFamilyEl ? fontFamilyEl.value : 'Heebo';

        const offsets = {
            name: nameOffset,
            type: typeOffset,
            rarity: rarityOffset,
            abilityY: 530 + abilityOffset,
            fluffPadding: fluffOffset,
            gold: goldOffset,
            imageYOffset: imageOffset,
            imageScale: imageScale,
            imageRotation: imageRotation,
            imageStyle: document.getElementById('image-style-option')?.value || 'natural',
            imageColor: document.getElementById('image-bg-color')?.value || '#ffffff',
            backgroundScale: parseFloat(document.getElementById('bg-scale')?.value) || 1.0,
            fontFamily: fontFamily,
            fontSizes: this.currentCardData.fontSizes || {}
        };

        // Save offsets to current data
        this.currentCardData.offsets = offsets;

        await this.renderer.render(this.currentCardData, offsets);
    }

    populateEditor(data) {
        if (!data) return;
        this.currentCardData = data;

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

        // Reset or set sliders
        if (data.offsets) {
            setVal('name-offset', data.offsets.name);
            setVal('type-offset', data.offsets.type);
            setVal('rarity-offset', data.offsets.rarity);
            setVal('ability-offset', data.offsets.abilityY ? (data.offsets.abilityY - 530) : 0);
            setVal('fluff-offset', data.offsets.fluffPadding);
            setVal('gold-offset', data.offsets.gold);
            setVal('image-offset', data.offsets.imageYOffset);
            setVal('image-scale', data.offsets.imageScale || 1.0);
            setVal('edit-image-scale', data.offsets.imageScale || 1.0);
            setVal('image-rotation', data.offsets.imageRotation || 0);
            setVal('edit-image-rotation', data.offsets.imageRotation || 0);
        } else {
            // Defaults
            document.querySelectorAll('input[type="range"]').forEach(input => {
                if (input.id === 'fluff-offset') input.value = 20;
                else if (input.id === 'image-scale' || input.id === 'edit-image-scale') input.value = 1.0;
                else input.value = 0;
            });
        }

        // Update Font Size Displays
        if (data.fontSizes) {
            for (const [key, value] of Object.entries(data.fontSizes)) {
                const display = document.getElementById(`${key}-display`);
                if (display) display.textContent = `${value}px`;
            }
        }
    }

    updateField(field, value) {
        if (!this.currentCardData) return;
        this.currentCardData[field] = value;
        this.updateLayout();
    }

    updateFontSize(target, change) {
        if (!this.currentCardData) return;

        if (!this.currentCardData.fontSizes) this.currentCardData.fontSizes = {};
        const currentSize = this.currentCardData.fontSizes[target] || this.getDefaultFontSize(target);
        const newSize = currentSize + (change * 2);
        this.currentCardData.fontSizes[target] = newSize;

        const display = document.getElementById(`${target}-display`);
        if (display) display.textContent = `${newSize}px`;

        this.updateLayout();
    }

    getCurrentData() {
        return this.currentCardData;
    }
}

// Export global instance
window.resultManager = new ResultManager();
