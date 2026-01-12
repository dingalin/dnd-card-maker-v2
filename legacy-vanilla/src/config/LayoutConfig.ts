/**
 * LayoutConfig.ts
 * ================
 * Centralized configuration for all UI element positions and sizes.
 * 
 * This is the SINGLE SOURCE OF TRUTH for element positioning.
 * All position-related values should be defined here and referenced
 * by CSS or JavaScript, not hardcoded elsewhere.
 */


/**
 * Position configuration for a fixed/absolute element
 */
export interface ElementPosition {
    position: 'fixed' | 'absolute' | 'relative' | 'static';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    transform?: string;
    width?: string;
    height?: string;
    zIndex?: number;
}

/**
 * Main layout configuration
 */
export const LAYOUT_CONFIG = {
    /**
     * Ability Scroll Area - Left side of card
     * Container for scroll panel + category buttons below
     */
    abilityScrollArea: {
        id: 'ability-scroll-area',
        position: 'fixed',
        top: '50%',
        left: '295px',
        right: 'auto',
        transform: 'translateY(-50%)',
        zIndex: 600
    } as ElementPosition,

    /**
     * Sticky Note - Right side of card
     * Shows current item details summary
     */
    stickyNote: {
        id: 'sticky-note',
        position: 'fixed',
        top: '50%',
        right: '295px',
        left: 'auto',
        transform: 'translateY(-50%)',
        width: '200px',
        height: '300px',
        zIndex: 50
    } as ElementPosition,

    /**
     * Position Mode Toggle Button
     * Debug button for entering position editing mode
     */
    positionModeButton: {
        id: 'position-mode-btn',
        position: 'fixed',
        bottom: '60px',
        left: '20px',
        width: '50px',
        height: '50px',
        zIndex: 9999
    } as ElementPosition,

    /**
     * Sidebar widths and margins
     */
    sidebar: {
        width: '280px',
        gap: '1.5rem'
    },

    /**
     * Card preview area
     * Card is centered, these are just reference values
     */
    cardPreview: {
        maxHeight: '72vh'
    }
};

/**
 * CSS variable names for use in stylesheets
 * These can be set as CSS custom properties on :root
 */
export const LAYOUT_CSS_VARS = {
    '--sidebar-width': LAYOUT_CONFIG.sidebar.width,
    '--sidebar-gap': LAYOUT_CONFIG.sidebar.gap,
    '--ability-panel-left': LAYOUT_CONFIG.abilityScrollArea.left,
    '--sticky-note-right': LAYOUT_CONFIG.stickyNote.right
};

export default LAYOUT_CONFIG;
