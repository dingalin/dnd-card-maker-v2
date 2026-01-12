

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

// Drag bound function - only allows Y movement, X stays unchanged
// The pos argument contains new position, this.absolutePosition() contains the current attached position
export const dragBoundFunc = function (this: any, pos: any) {
    // Don't modify X - let the element keep its current position (set by padding prop)
    const currentX = this.absolutePosition().x;
    return {
        x: currentX,
        y: Math.max(20, Math.min(pos.y, CARD_HEIGHT - 60))
    };
};

// Custom hitFunc for text elements - creates a full-width hitbox for easier selection
export const textHitFunc = function (this: any, context: any) {
    // Use the full allocated width (e.g., 750px) instead of just the text content width
    // This allows selecting empty areas on the line and fixes alignment issues.
    const width = this.width();
    const height = this.height();
    const padding = 20; // Extra vertical padding for easier touch/click

    context.beginPath();
    // Start from -padding/2 to extend hit area slightly above and below
    context.rect(0, -padding / 2, width, height + padding);
    context.closePath();
    context.fillStrokeShape(this);
};
