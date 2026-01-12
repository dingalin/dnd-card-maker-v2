// @ts-nocheck
/**
 * LayoutApplier.ts
 * =================
 * Applies layout configuration to DOM elements.
 * This ensures all elements are positioned according to LayoutConfig.ts
 */

import LAYOUT_CONFIG, { ElementPosition, LAYOUT_CSS_VARS } from '../config/LayoutConfig';

/**
 * Apply position styles to an element
 */
function applyPosition(element: HTMLElement, config: ElementPosition): void {
    if (config.position) element.style.position = config.position;
    if (config.top) element.style.top = config.top;
    if (config.right) element.style.right = config.right;
    if (config.bottom) element.style.bottom = config.bottom;
    if (config.left) element.style.left = config.left;
    if (config.transform) element.style.transform = config.transform;
    if (config.width) element.style.width = config.width;
    if (config.height) element.style.height = config.height;
    if (config.zIndex !== undefined) element.style.zIndex = String(config.zIndex);
}

/**
 * Apply CSS variables to document root
 */
function applyCSSVariables(): void {
    const root = document.documentElement;
    Object.entries(LAYOUT_CSS_VARS).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
}

/**
 * Apply layout to ability scroll area (container for scroll + buttons)
 */
function applyAbilityScrollAreaLayout(): void {
    const area = document.getElementById(LAYOUT_CONFIG.abilityScrollArea.id);
    if (area) {
        applyPosition(area, LAYOUT_CONFIG.abilityScrollArea);
        console.log('📍 Applied layout to ability-scroll-area');
    }
}

/**
 * Apply layout to sticky note
 */
function applyStickyNoteLayout(): void {
    const note = document.getElementById(LAYOUT_CONFIG.stickyNote.id);
    if (note) {
        applyPosition(note, LAYOUT_CONFIG.stickyNote);
        console.log('📍 Applied layout to sticky-note');
    }
}

/**
 * Apply layout to position mode button
 */
function applyPositionModeButtonLayout(): void {
    const btn = document.getElementById(LAYOUT_CONFIG.positionModeButton.id);
    if (btn) {
        applyPosition(btn, LAYOUT_CONFIG.positionModeButton);
    }
}

/**
 * Main function to apply all layouts
 * Call this after DOM is ready
 */
export function applyAllLayouts(): void {
    console.log('📐 Applying centralized layout configuration...');

    // Apply CSS variables first
    applyCSSVariables();

    // Apply individual element layouts
    // applyAbilityScrollAreaLayout();
    // applyStickyNoteLayout();
    applyPositionModeButtonLayout();

    console.log('✅ Layout configuration applied');
}

/**
 * Re-apply layouts (useful for resize events or dynamic changes)
 */
export function refreshLayouts(): void {
    applyAllLayouts();
}

/**
 * Initialize layout system
 * Sets up resize handlers and applies initial layout
 */
export function initLayoutSystem(): void {
    // Apply layouts once DOM is ready
    if (document.readyState === 'complete') {
        applyAllLayouts();
    } else {
        window.addEventListener('load', applyAllLayouts);
    }

    // Re-apply on resize (debounced)
    let resizeTimer: number;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(refreshLayouts, 100);
    });

    // Expose globally for debugging
    (window as any).refreshLayouts = refreshLayouts;
    (window as any).LAYOUT_CONFIG = LAYOUT_CONFIG;
}

export default { applyAllLayouts, refreshLayouts, initLayoutSystem };
