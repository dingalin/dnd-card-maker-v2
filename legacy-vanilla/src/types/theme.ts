/**
 * ThemePack Definition
 * Supports the "One-Click Reskinning" feature.
 * A ThemePack is a portable JSON object that defines the entire visual identity of the app/cards.
 */
export interface ThemePack {
    id: string;
    name: string; // e.g., "Gothic Horror", "High Fantasy", "Cyberpunk"
    version: string; // semver
    author?: string; // For Bazaar credits

    fonts: {
        title: string;      // Font family for headers
        body: string;       // Font family for lore/stats
        handwritten?: string; // For "prop" documents
    };

    colors: {
        primary: string;    // Main UI color
        secondary: string;  // Accents
        background: string; // App background
        text: string;       // Readable text color
        highlight: string;  // Active states
    };

    cardStyles: {
        borderImage?: string;       // Custom SVG/PNG frame
        borderStyle: 'gold' | 'iron' | 'wood' | 'bone' | 'crystal' | 'none';
        backgroundTexture?: string; // Paper/Parchment texture URL
        overlayTexture?: string;    // Grime/Blood/Dust overlays
        blendMode?: string;         // CSS blend mode for the overlay
    };

    uiStyles: {
        glassmorphism: boolean;     // Enable blur effects?
        borderRadius: string;       // "8px", "0px" (sharp), etc.
    };
}

export const DEFAULT_THEME_ID = 'default-fantasy';
