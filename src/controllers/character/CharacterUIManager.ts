// @ts-nocheck
import i18n from '../../i18n.ts';
import { CHARACTER_OPTIONS } from '../../dnd-data.ts';

interface CharacterController {
    updatePortrait(url: string): void;
    exportAllToGallery(): void;
    autoEquipAllSlots(): void;
}

export class CharacterUIManager {
    public controller: CharacterController;

    constructor(controller: CharacterController) {
        this.controller = controller;
    }

    /**
     * Initialize UI listeners
     */
    setupListeners() {
        // Character Name Input
        const nameInput = document.getElementById('character-name-input') as HTMLInputElement;
        if (nameInput) {
            nameInput.addEventListener('input', (e) => this.displayCharacterName((e.target as HTMLInputElement).value));
            // Trigger immediately if value exists
            if (nameInput.value) this.displayCharacterName(nameInput.value);
        }

        // Portrait Upload
        const uploadBtn = document.getElementById('upload-portrait-btn');
        const fileInput = document.getElementById('portrait-file-input') as HTMLInputElement;

        if (uploadBtn && fileInput) {
            uploadBtn.addEventListener('click', () => fileInput.click());

            fileInput.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files && target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        this.controller.updatePortrait(evt.target?.result as string);
                    };
                    reader.readAsDataURL(target.files[0]);
                }
            });
        }

        // Export Button
        const exportBtn = document.getElementById('export-character-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.controller.exportAllToGallery());
        }

        // Auto Equip Button
        const autoEquipBtn = document.getElementById('auto-equip-btn');
        if (autoEquipBtn) {
            autoEquipBtn.addEventListener('click', () => this.controller.autoEquipAllSlots());
        }

        // Listen for language changes to update dropdowns
        if ((window as any).i18n) {
            (window as any).i18n.onLocaleChange(() => {
                this.populateOptions();
            });
        }
    }

    /**
     * Display character name above portrait
     * @param {string} name - The character name to display
     */
    displayCharacterName(name: string) {
        const displayEl = document.getElementById('character-name-display');
        if (displayEl) {
            displayEl.textContent = name;

            // Show/hide based on content
            if (name && name.trim().length > 0) {
                displayEl.classList.remove('hidden');
                displayEl.classList.add('visible');
            } else {
                displayEl.classList.remove('visible');
                displayEl.classList.add('hidden');
            }
        }
    }

    /**
     * Update character portrait
     * @param {string} imageUrl
     */
    updatePortrait(imageUrl: string) {
        const portraitImg = document.getElementById('character-portrait-img') as HTMLImageElement;
        const portraitSlot = document.querySelector('.character-portrait-slot');

        if (portraitImg) {
            portraitImg.src = imageUrl;
            portraitImg.classList.remove('hidden');
        }

        if (portraitSlot) {
            portraitSlot.classList.add('has-image');
        }
    }

    /**
     * Set loading state
     * @param {boolean} isLoading
     */
    setLoading(isLoading: boolean) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (isLoading) overlay.classList.remove('hidden');
            else overlay.classList.add('hidden');
        }
    }

    populateOptions() {
        const isEnglish = i18n.locale === 'en';

        // Helper to map options based on language
        const mapOptions = (options: any[]) => options.map(opt => ({
            value: opt.value,
            label: isEnglish ? opt.labelEn : opt.label
        }));

        this.populateSelect('char-gender', mapOptions(CHARACTER_OPTIONS.genders));
        this.populateSelect('char-race', mapOptions(CHARACTER_OPTIONS.races));
        this.populateSelect('char-class', mapOptions(CHARACTER_OPTIONS.classes));
        this.populateSelect('char-background', mapOptions(CHARACTER_OPTIONS.backgrounds));
        this.populateSelect('char-art-style', mapOptions(CHARACTER_OPTIONS.artStyles));
        this.populateSelect('char-pose', mapOptions(CHARACTER_OPTIONS.poses));

        const levels = [
            { value: '1-4', label: isEnglish ? 'Levels 1-4' : 'רמות 1-4' },
            { value: '5-10', label: isEnglish ? 'Levels 5-10' : 'רמות 5-10' },
            { value: '11-16', label: isEnglish ? 'Levels 11-16' : 'רמות 11-16' },
            { value: '17+', label: isEnglish ? 'Levels 17+' : 'רמות 17+' }
        ];

        const complexities = [
            { value: 'simple', label: isEnglish ? 'Standard' : 'רגיל' },
            { value: 'complex', label: isEnglish ? 'Complex' : 'מורכב' }
        ];

        this.populateSelect('auto-equip-level', levels);
        this.populateSelect('auto-equip-complexity', complexities);
    }

    populateSelect(elementId: string, items: any[]) {
        const select = document.getElementById(elementId) as HTMLSelectElement;
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '';

        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.value;
            option.textContent = item.label;
            select.appendChild(option);
        });

        if (currentValue) {
            // Restore selection if valid
            const exists = items.some(i => i.value === currentValue);
            if (exists) select.value = currentValue;
        }
    }
}
