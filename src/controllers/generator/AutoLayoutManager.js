export class AutoLayoutManager {
    constructor(stateManager) {
        this.state = stateManager;
    }

    async calculateAutoLayout(cardData, settings, useDetection = false) {
        // Import utilities dynamically
        const { LayoutCalculator } = await import('../../utils/LayoutCalculator.ts');

        // Use the NEW middle/balanced layout that sets all sliders to midpoint values
        // This gives users room to adjust elements in BOTH directions (up/down, bigger/smaller)
        const layout = LayoutCalculator.calculateMiddleLayout(cardData);

        console.log('AutoLayoutManager: Using MIDDLE/BALANCED layout for user adjustment flexibility');
        console.log('AutoLayoutManager: Calculated layout:', layout);

        // Return with a placeholder safeArea for compatibility
        const safeArea = {
            top: 85,
            bottom: 920,
            left: 70,
            right: 680,
            width: 610,
            height: 835
        };

        return { layout, safeArea };
    }

    async openLassoTool(templateImg, canvas, onApply) {
        if (!templateImg || !templateImg.complete || templateImg.naturalWidth === 0) {
            throw new Error('Template not ready');
        }

        const { LassoTool } = await import('../../utils/LassoTool.ts');
        const lasso = new LassoTool();

        lasso.open(templateImg, canvas, (detectedArea) => {
            console.log('Lasso detected area:', detectedArea);
            onApply(detectedArea);
        });
    }

    async calculateLayoutWithArea(cardData, safeArea, settings) {
        const { LayoutCalculator } = await import('../../utils/LayoutCalculator.ts');
        return LayoutCalculator.calculateLayoutWithSafeArea(cardData, safeArea, settings);
    }

    applyLayoutToState(layout) {
        // Apply offsets
        for (const [key, value] of Object.entries(layout.offsets)) {
            if (typeof value === 'number') {
                this.state.updateOffset(key, value);
            }
        }

        // Apply font sizes
        if (layout.fontSizes.name) {
            const defaultSize = 48;
            const delta = layout.fontSizes.name - defaultSize;
            if (delta !== 0) {
                this.state.updateFontSize('name', delta);
            }
        }

        // Apply image scale
        if (layout.imageSettings.scale) {
            this.state.updateOffset('imageScale', layout.imageSettings.scale);
        }

        this.state.saveCurrentCard();
    }
}
