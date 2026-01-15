

export const CARD_WIDTH = 750;
export const CARD_HEIGHT = 1050;

// =========================
// LAYOUT POSITIONS (Y coordinates out of 1050)
// =========================
export const LAYOUT = {
    // Header section (top of card)
    RARITY_Y: 50,      // Rarity text (e.g., "נפוץ", "נדיר")
    TYPE_Y: 90,        // Item type (e.g., "נשק", "שריון")
    TITLE_Y: 140,      // Item name (large title)

    // Image section (center of card)
    IMAGE_CENTER_Y: 450,  // Center point for item image

    // Footer section (lower portion of card, inside safe area)
    STATS_Y: 750,      // Stats/damage text - in lower safe area
    GOLD_Y: 820,       // Gold price - below stats

    // Boundaries
    MIN_Y: 20,         // Top boundary for dragging
    MAX_Y: 1000,       // Bottom boundary for dragging (leaves room for text height)
};

// Drag bound function - locks X, only allows Y movement
export const dragBoundFunc = function (this: any, pos: any) {
    // Lock X to 0 (elements are centered via their own width/padding)
    // Only allow vertical movement within card bounds
    return {
        x: 0,
        y: Math.max(20, Math.min(pos.y, CARD_HEIGHT - 60))
    };
};

// Custom hitFunc for text elements - creates accurate hitbox matching actual text size
export const textHitFunc = function (this: any, context: any) {
    const width = this.width();

    // Use .height() to get accurate height including word wrapping and lineHeight
    // Note: getTextHeight() is deprecated and may return incorrect single-line height
    const height = this.height();
    const padding = 5; // Small padding for easier selection

    context.beginPath();
    // Create rect that matches actual text bounds
    context.rect(0, -padding, width, height + (padding * 2));
    context.closePath();
    context.fillStrokeShape(this);
};

// =========================
// RARITY COLORS & GRADIENTS
// =========================
export const RARITY_GRADIENTS: Record<string, string[]> = {
    // Colors are: [Start, Mid, End]
    'common': ['#b2b2b2', '#e0e0e0', '#8c8c8c'],      // Iron/Silver
    'uncommon': ['#cd7f32', '#ffcba4', '#8b4513'],    // Bronze/Copper relative to user preference (User approved 'Bronze' for Uncommon)
    'rare': ['#00008b', '#4169e1', '#0000cd'],        // Sapphire Blue (Deep Blue to Royal)
    'epic': ['#4b0082', '#9932cc', '#8a2be2'],        // Amethyst Purple
    'legendary': ['#bf953f', '#fcf6ba', '#b38728'],   // Gold (Metallic)

    // Hebrew Mapping Fallbacks
    'נפוץ': ['#b2b2b2', '#e0e0e0', '#8c8c8c'],
    'לא נפוץ': ['#cd7f32', '#ffcba4', '#8b4513'],
    'נדיר': ['#00008b', '#4169e1', '#0000cd'],
    'אפי': ['#4b0082', '#9932cc', '#8a2be2'],
    'אגדי': ['#bf953f', '#fcf6ba', '#b38728'],
};

// Helper to normalize rarity string to key
export const getRarityKey = (rarityValues: string | undefined): string => {
    if (!rarityValues) return 'common';
    const r = rarityValues.trim().toLowerCase();

    if (r.includes('אגדי') || r.includes('legendary')) return 'legendary';
    if (r.includes('אפי') || r.includes('epic')) return 'epic';
    if (r.includes('נדיר') || r.includes('rare')) return 'rare';
    if (r.includes('לא נפוץ') || r.includes('uncommon')) return 'uncommon';
    return 'common'; // Default
};
