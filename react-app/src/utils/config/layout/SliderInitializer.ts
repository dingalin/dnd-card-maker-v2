/**
 * SliderInitializer.ts
 * =====================
 * Applies centralized slider configuration to HTML sliders
 * 
 * This ensures that all slider min/max/default values come from
 * a single source of truth (SliderLimits.ts), while keeping the
 * HTML structure readable and editable.
 * 
 * Usage:
 * 1. Add data-slider-config="slider-id" to sliders in HTML
 * 2. Call SliderInitializer.init() on page load
 */

import { /* SLIDER_LIMITS, */ getSliderLimits, type SliderLimit } from './SliderLimits';

export class SliderInitializer {
    private static initialized = false;

    /**
     * Initialize all sliders with config values
     * Should be called once on page load
     */
    static init(): void {
        if (this.initialized) {
            console.log('SliderInitializer: Already initialized, skipping');
            return;
        }

        console.log('SliderInitializer: Applying config to all sliders...');
        let slidersUpdated = 0;

        // Find all sliders with data-slider-config attribute
        document.querySelectorAll('[data-slider-config]').forEach((slider) => {
            const configId = slider.getAttribute('data-slider-config');
            if (configId) {
                const updated = this.applyConfig(slider as HTMLInputElement, configId);
                if (updated) slidersUpdated++;
            }
        });

        // Also apply by ID pattern matching for existing sliders
        this.applyConfigByIdPattern();

        console.log(`SliderInitializer: Updated ${slidersUpdated} sliders from config`);
        this.initialized = true;
    }

    /**
     * Apply config to a specific slider element
     */
    static applyConfig(slider: HTMLInputElement, configId: string): boolean {
        const limits = getSliderLimits(configId);
        if (!limits) {
            console.warn(`SliderInitializer: No config found for "${configId}"`);
            return false;
        }

        slider.min = String(limits.min);
        slider.max = String(limits.max);

        // Only set default if slider has no value or is at HTML default
        if (!slider.value || slider.value === slider.defaultValue) {
            slider.value = String(limits.default);
        }

        if (limits.step) {
            slider.step = String(limits.step);
        }

        return true;
    }

    /**
     * Apply config to sliders by matching their ID to config keys
     * This handles existing sliders that don't have data-slider-config
     */
    private static applyConfigByIdPattern(): void {
        // Map of slider IDs to config keys
        const sliderIdToConfig: Record<string, string> = {
            // Front offsets
            'name-offset': 'name-offset',
            'type-offset': 'type-offset',
            'rarity-offset': 'rarity-offset',
            'coreStats-offset': 'coreStats-offset',
            'stats-offset': 'stats-offset',
            'gold-offset': 'gold-offset',
            // Front widths
            'name-width': 'name-width',
            'type-width': 'type-width',
            'coreStats-width': 'coreStats-width',
            'stats-width': 'stats-width',
            // Back offsets
            'ability-offset': 'ability-offset',
            'mech-offset': 'mech-offset',
            'lore-offset': 'lore-offset',
            'ability-width': 'ability-width',
            'lore-width': 'lore-width',
            // Image controls
            'image-offset': 'image-offset',
            'image-scale': 'image-scale',
            'image-rotation': 'image-rotation',
            'image-fade': 'image-fade',
            'image-shadow': 'image-shadow',
            'background-scale': 'background-scale',
            'center-fade': 'center-fade',
            // Text effects
            'text-outline-width': 'text-outline-width',
            'text-shadow-blur': 'text-shadow-blur',
            'text-backdrop-opacity': 'text-backdrop-opacity',
            // Global margins
            'global-margin-y': 'global-margin-y',
            'global-margin-x': 'global-margin-x',
        };

        for (const [sliderId, configId] of Object.entries(sliderIdToConfig)) {
            const slider = document.getElementById(sliderId) as HTMLInputElement | null;
            if (slider && slider.type === 'range') {
                const limits = getSliderLimits(configId);
                if (limits) {
                    const oldMin = slider.min;
                    const oldMax = slider.max;

                    slider.min = String(limits.min);
                    slider.max = String(limits.max);

                    if (limits.step) {
                        slider.step = String(limits.step);
                    }

                    // Log if values changed
                    if (oldMin !== slider.min || oldMax !== slider.max) {
                        console.log(`SliderInitializer: ${sliderId} updated: min=${limits.min}, max=${limits.max}`);
                    }
                }
            }
        }
    }

    /**
     * Get slider config for display purposes
     */
    static getConfig(sliderId: string): SliderLimit | undefined {
        return getSliderLimits(sliderId);
    }

    /**
     * Reset a slider to its default value from config
     */
    static resetToDefault(sliderId: string): boolean {
        const slider = document.getElementById(sliderId) as HTMLInputElement | null;
        const limits = getSliderLimits(sliderId);

        if (slider && limits) {
            slider.value = String(limits.default);
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            return true;
        }
        return false;
    }

    /**
     * Reset all sliders to their default values
     */
    static resetAllToDefaults(): void {
        document.querySelectorAll('input[type="range"]').forEach((slider) => {
            const limits = getSliderLimits(slider.id);
            if (limits) {
                (slider as HTMLInputElement).value = String(limits.default);
            }
        });
    }
}

export default SliderInitializer;
