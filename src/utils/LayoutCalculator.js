/**
 * LayoutCalculator - Smart layout algorithm for D&D cards
 * Calculates optimal positions for all card elements based on content
 * 
 * RENDERER BASE POSITIONS (after fix):
 * - rarity: Y = 100 + offset (TOP)
 * - type: Y = 140 + offset (below rarity)  
 * - name: Y = 200 + offset (below type)
 * - image: baseY = 230 + offset
 * - coreStats: Y = offset || 680 (ABSOLUTE)
 * - stats: Y = offset || 780 (ABSOLUTE)
 * - gold: Y = 920 + offset (bottom)
 */

export class LayoutCalculator {
    // Canvas dimensions (750x1050)
    static CARD_WIDTH = 750;
    static CARD_HEIGHT = 1050;

    // Safe content area (inside frame decorations)
    static SAFE_AREA = {
        top: 80,       // Below top frame
        bottom: 920,   // Above bottom frame (gold area)
        left: 70,      // Inside left frame
        right: 680     // Inside right frame
    };

    // NEW Renderer base positions (after fix)
    static BASE_POSITIONS = {
        rarity: 100,    // TOP
        type: 140,      // Below rarity
        name: 200,      // Below type
        image: 230,     // Image baseY
        coreStats: 680, // Damage/AC (absolute)
        stats: 780,     // Quick stats (absolute)
        gold: 920       // Bottom
    };

    /**
     * Calculate optimal layout for card elements
     * @param {Object} cardData - Card data with name, type, etc.
     * @param {Object} currentSettings - Current offset settings
     * @returns {Object} Optimized offsets and font sizes
     */
    static calculateLayout(cardData, currentSettings = {}) {
        const result = {
            offsets: {},
            fontSizes: {},
            imageSettings: {}
        };

        // Get content info
        const name = cardData.front?.title || cardData.name || '';
        const type = cardData.front?.type || cardData.typeHe || '';
        const hasStats = !!(cardData.weaponDamage || cardData.armorClass);
        const quickStats = cardData.front?.quickStats || cardData.quickStats || '';

        // Calculate name font size based on length
        result.fontSizes.name = this.calculateNameFontSize(name);

        // === CALCULATE OFFSETS ===
        // USER'S OPTIMAL VALUES (saved from manual tuning)

        // Header elements
        result.offsets.rarity = 0;     // Rarity at base position
        result.offsets.type = 74;      // Type pushed down
        result.offsets.name = 135;     // Name pushed down significantly

        // Image positioning
        result.offsets.imageYOffset = -117;  // Image pulled up
        result.imageSettings.scale = 1.5;    // Zoom 1.5x

        // Stats positions (absolute Y values)
        result.offsets.coreStats = hasStats ? 730 : 0;   // Damage/AC
        result.offsets.stats = 498;                       // Quick stats

        // Gold
        result.offsets.gold = -8;  // Slightly up

        return result;
    }

    /**
     * Calculate name font size based on text length
     */
    static calculateNameFontSize(name) {
        const len = name.length;
        if (len <= 6) return 56;
        if (len <= 10) return 52;
        if (len <= 14) return 46;
        if (len <= 18) return 42;
        return 38;
    }

    /**
     * Calculate layout using a detected safe area
     * SIMPLE PROPORTIONAL: positions are percentages of safe area height
     */
    static calculateLayoutWithSafeArea(cardData, safeArea, currentSettings = {}) {
        const result = {
            offsets: {},
            fontSizes: {},
            imageSettings: {}
        };

        const name = cardData.front?.title || cardData.name || '';
        const hasStats = !!(cardData.weaponDamage || cardData.armorClass);
        const hasQuickStats = !!(cardData.front?.quickStats || cardData.quickStats);

        // Safe area bounds
        const safeTop = safeArea.top;
        const safeBottom = safeArea.bottom;
        const safeLeft = safeArea.left || 70;
        const safeRight = safeArea.right || 680;
        const safeHeight = safeBottom - safeTop;
        const safeWidth = safeRight - safeLeft;

        // Calculate max text width based on safe area (with 8% padding on each side)
        const maxTextWidth = Math.round(safeWidth * 0.84);

        console.log(`LayoutCalculator: Safe area X:${safeLeft}-${safeRight} Y:${safeTop}-${safeBottom} (${safeWidth}x${safeHeight})`);

        // === COMPACT TEXT LAYOUT ===
        // Header elements close together at top, bottom elements close together at bottom
        // Leaves maximum space for image in the center
        const RATIOS = {
            rarity: 0.03,      // 3% from top - רמת הנדירות
            type: 0.135,       // 13.5% from top - סוג הפריט (exactly between rarity and name)
            name: 0.24,        // 24% from top - שם הפריט (below type with gap)
            imageCenter: 0.50, // 50% - center of safe area (image dominates)
            coreStats: 0.82,   // 82% - below image (דרג"ש) - pushed down
            quickStats: 0.92,  // 92% - just above gold (תיאור נוסף) - pushed down
            gold: 0.99         // 99% - almost touching bottom border
        };

        // === CALCULATE ABSOLUTE Y POSITIONS ===
        const rarityY = safeTop + (RATIOS.rarity * safeHeight);
        const typeY = safeTop + (RATIOS.type * safeHeight);
        const nameY = safeTop + (RATIOS.name * safeHeight);
        const imageCenterY = safeTop + (RATIOS.imageCenter * safeHeight);
        const quickStatsY = safeTop + (RATIOS.quickStats * safeHeight);
        const coreStatsY = safeTop + (RATIOS.coreStats * safeHeight);
        const goldY = safeTop + (RATIOS.gold * safeHeight);

        // === CONVERT TO OFFSETS (relative to renderer base positions) ===
        // Renderer draws at: rarity=100, type=140, name=200, gold=920
        result.offsets.rarity = Math.round(rarityY - 100);
        result.offsets.type = Math.round(typeY - 140);
        result.offsets.name = Math.round(nameY - 200);

        // Image: center is at base 230 + 150 = 380
        result.offsets.imageYOffset = Math.round(imageCenterY - 380);

        // Image scale proportional to safe area height
        const refHeight = 840;
        const scaleRatio = safeHeight / refHeight;
        result.imageSettings.scale = Math.max(1.0, Math.min(2.0, 1.5 * scaleRatio));

        // Stats are absolute Y positions
        result.offsets.stats = hasQuickStats ? Math.round(quickStatsY) : 0;
        result.offsets.coreStats = hasStats ? Math.round(coreStatsY) : 0;

        // Gold
        result.offsets.gold = Math.round(goldY - 920);

        // Set all text widths to respect safe area bounds
        result.offsets.nameWidth = maxTextWidth;
        result.offsets.typeWidth = maxTextWidth;
        result.offsets.rarityWidth = maxTextWidth;
        result.offsets.coreStatsWidth = maxTextWidth;
        result.offsets.statsWidth = maxTextWidth;
        result.offsets.goldWidth = maxTextWidth;

        // Font size
        result.fontSizes.name = this.calculateNameFontSize(name);
        if (scaleRatio < 0.9) {
            result.fontSizes.name = Math.round(result.fontSizes.name * 0.9);
        }

        console.log('LayoutCalculator: Simple proportional layout:', {
            safeArea: { top: safeTop, bottom: safeBottom, height: safeHeight },
            positions: { rarityY, typeY, nameY, imageCenterY },
            offsets: result.offsets,
            imageScale: result.imageSettings.scale.toFixed(2)
        });

        return result;
    }

    /**
     * This method is no longer used in the new layout logic.
     * It's kept for reference or if a more dynamic vertical layout is needed later.
     */
    static calculateVerticalLayout(contentInfo) {
        // This method's logic is replaced by direct offset calculations in calculateLayout
        // and is effectively deprecated for the current layout strategy.
        // Original logic:
        // const { nameLength, hasStats, quickStatsLength } = contentInfo;
        // const { top, bottom } = this.SAFE_AREA;
        // const usableHeight = bottom - top;

        // // Adjust element heights based on content
        // const nameHeight = nameLength > 15 ? 65 : 55;
        // const statsHeight = hasStats ? 45 : 0;
        // const quickStatsHeight = quickStatsLength > 50 ? 80 : 60;

        // // Fixed positions from top
        // const positions = {
        //     rarity: top + 5,          // Very top
        //     type: top + 35,           // Below rarity
        //     name: top + 70,           // Title area
        //     imageTop: top + 130,      // Where image starts
        //     imageCenter: 0,           // Calculated below
        //     coreStats: 0,             // Calculated below
        //     quickStats: 0,            // Calculated below
        //     gold: bottom - 40         // Near bottom
        // };

        // // Calculate image center and remaining space
        // const topContentHeight = 130; // rarity + type + name
        // const bottomContentHeight = statsHeight + quickStatsHeight + 60; // stats + gold + spacing

        // const imageSpace = usableHeight - topContentHeight - bottomContentHeight;
        // const imageHeight = Math.min(280, imageSpace - 40);

        // positions.imageCenter = positions.imageTop + (imageHeight / 2);

        // // Position elements below image
        // const imageBottom = positions.imageTop + imageHeight + 15;

        // if (hasStats) {
        //     positions.coreStats = imageBottom + 10;
        //     positions.quickStats = positions.coreStats + statsHeight + 10;
        // } else {
        //     positions.coreStats = 0;  // No core stats
        //     positions.quickStats = imageBottom + 20;
        // }

        // return positions;
        return {}; // Return empty object as this method is no longer actively used
    }

    /**
     * Apply calculated layout to state
     */
    static applyLayout(stateManager, layout) {
        // Apply offsets
        for (const [key, value] of Object.entries(layout.offsets)) {
            if (typeof value === 'number') {
                stateManager.updateOffset(key, value);
            }
        }

        // Apply font sizes
        for (const [key, delta] of Object.entries(layout.fontSizes)) {
            if (key === 'name' && delta) {
                // Calculate delta from default (56)
                const deltaFromDefault = delta - 56;
                if (deltaFromDefault !== 0) {
                    stateManager.updateFontSize('name', deltaFromDefault);
                }
            }
        }

        // Apply image settings
        if (layout.imageSettings.scale) {
            stateManager.updateOffset('imageScale', layout.imageSettings.scale);
        }
    }
}

export default LayoutCalculator;
