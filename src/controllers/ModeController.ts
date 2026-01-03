// @ts-nocheck
/**
 * ModeController - Manages switching between Auto (AI) and Manual modes
 */

export type CreationMode = 'auto' | 'manual';

export class ModeController {
    private currentMode: CreationMode = 'auto';
    private toggle: HTMLInputElement | null = null;
    private autoLabel: HTMLElement | null = null;
    private manualLabel: HTMLElement | null = null;
    private onModeChangeCallbacks: ((mode: CreationMode) => void)[] = [];

    constructor() {
        this.init();
    }

    private init(): void {
        this.toggle = document.getElementById('mode-toggle') as HTMLInputElement;
        this.autoLabel = document.querySelector('.mode-label-auto');
        this.manualLabel = document.querySelector('.mode-label-manual');

        if (!this.toggle) {
            console.warn('ModeController: Toggle not found');
            return;
        }

        // Load saved mode from localStorage
        const savedMode = localStorage.getItem('creation-mode') as CreationMode;
        if (savedMode === 'manual') {
            this.toggle.checked = true;
            this.setMode('manual', false);
        } else {
            this.setMode('auto', false);
        }

        // Listen for toggle changes
        this.toggle.addEventListener('change', () => {
            const newMode: CreationMode = this.toggle!.checked ? 'manual' : 'auto';
            this.setMode(newMode, true);
        });

        // Allow clicking on labels to toggle
        this.autoLabel?.addEventListener('click', () => {
            if (this.toggle) {
                this.toggle.checked = false;
                this.setMode('auto', true);
            }
        });

        this.manualLabel?.addEventListener('click', () => {
            if (this.toggle) {
                this.toggle.checked = true;
                this.setMode('manual', true);
            }
        });

        console.log('✅ ModeController initialized, mode:', this.currentMode);
    }

    public setMode(mode: CreationMode, save: boolean = true): void {
        this.currentMode = mode;

        // Update body class for CSS mode switching
        document.body.classList.remove('mode-auto', 'mode-manual');
        document.body.classList.add(`mode-${mode}`);

        // Update label styles
        if (this.autoLabel && this.manualLabel) {
            this.autoLabel.classList.toggle('active', mode === 'auto');
            this.manualLabel.classList.toggle('active', mode === 'manual');
        }

        // Show/hide specific elements
        this.updateUIVisibility(mode);

        // Save preference
        if (save) {
            localStorage.setItem('creation-mode', mode);
        }

        // Notify listeners
        this.onModeChangeCallbacks.forEach(cb => cb(mode));

        console.log('🔄 Mode changed to:', mode);
    }

    private updateUIVisibility(mode: CreationMode): void {
        // Elements only visible in Auto mode (generate buttons only)
        const generateButtons = document.querySelector('.generation-buttons') as HTMLElement;
        const surpriseBtn = document.getElementById('surprise-btn') as HTMLElement;
        const regenControls = document.getElementById('regenerate-controls') as HTMLElement;
        const visualContextGroup = document.querySelector('.action-buttons-container .checkbox-group') as HTMLElement;

        // Level section (only in Auto mode - AI uses level for rarity)
        const levelBtn = document.querySelector('[data-target="level-content"]') as HTMLElement;
        const levelContent = document.getElementById('level-content') as HTMLElement;

        // Ability Scroll and Controls - completely hidden in auto, visible in manual
        const abilityScrollContainer = document.querySelector('.ability-scroll-container') as HTMLElement;
        const abilityScroll = document.querySelector('.ability-scroll-panel') as HTMLElement;
        const abilityControlsArea = document.getElementById('ability-controls-area') as HTMLElement;

        if (mode === 'auto') {
            // Show generate buttons
            if (generateButtons) generateButtons.style.display = '';
            if (surpriseBtn) surpriseBtn.style.display = '';
            if (regenControls) regenControls.style.removeProperty('display');
            if (visualContextGroup) visualContextGroup.style.display = '';
            if (levelBtn) levelBtn.style.display = '';
            if (levelContent) levelContent.classList.remove('manual-hidden');

            // Completely hide ability scroll in auto mode
            if (abilityScrollContainer) {
                abilityScrollContainer.style.display = 'none';
            }
            if (abilityScroll) {
                abilityScroll.style.display = 'none';
            }
            if (abilityControlsArea) {
                abilityControlsArea.style.display = 'none';
            }
        } else {
            // Manual mode - hide generate buttons, show ability scroll
            if (generateButtons) generateButtons.style.display = 'none';
            if (surpriseBtn) surpriseBtn.style.display = 'none';
            if (visualContextGroup) visualContextGroup.style.display = 'none';
            if (levelBtn) levelBtn.style.display = 'none';
            if (levelContent) levelContent.classList.add('manual-hidden');

            // Show ability scroll
            if (abilityScrollContainer) {
                abilityScrollContainer.style.display = '';
            }
            if (abilityScroll) {
                abilityScroll.style.display = '';
                abilityScroll.style.opacity = '1';
                abilityScroll.style.pointerEvents = 'auto';
            }
            if (abilityControlsArea) {
                abilityControlsArea.style.display = '';
                abilityControlsArea.style.opacity = '1';
                abilityControlsArea.style.pointerEvents = 'auto';
            }
        }
    }

    public getMode(): CreationMode {
        return this.currentMode;
    }

    public onModeChange(callback: (mode: CreationMode) => void): void {
        this.onModeChangeCallbacks.push(callback);
    }

    public isManualMode(): boolean {
        return this.currentMode === 'manual';
    }

    public isAutoMode(): boolean {
        return this.currentMode === 'auto';
    }
}

// Singleton export
let modeControllerInstance: ModeController | null = null;

export function initModeController(): ModeController {
    if (!modeControllerInstance) {
        modeControllerInstance = new ModeController();
    }
    return modeControllerInstance;
}

export function getModeController(): ModeController | null {
    return modeControllerInstance;
}
