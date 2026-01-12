// @ts-nocheck
import TextRenderer from './TextRenderer.ts';
import VisualEffects from './VisualEffects.ts';
import { BACK_FONT_SIZES } from '../config/CardTextConfig';

export const BackCardRenderer = {
    /**
     * Render the back of the card
     */
    async render(ctx, canvas, cardData, options = {}, template) {
        console.log("BackCardRenderer: render called");

        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Template
        await this.drawTemplate(ctx, canvas, template, options.backgroundScale);

        // 2. Setup Font & Styles
        const fontFamily = options.fontFamily || 'Heebo';
        const styles = options.fontStyles || {};
        const sizes = options.fontSizes || { ...BACK_FONT_SIZES };
        const offsets = options;

        const getFont = (prefix, size) => {
            return TextRenderer.buildFontString(styles, prefix, size, fontFamily);
        };

        // Set RTL direction for Hebrew text - crucial for proper punctuation placement
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';

        // 3. Ability Name (Title)
        ctx.font = getFont('abilityName', sizes.abilityNameSize);
        ctx.fillStyle = '#2c1810';
        const abilityY = offsets.abilityName || 120;

        // Glow
        if (styles.abilityNameGlow) {
            ctx.save();
            ctx.shadowColor = '#e2c47f';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#e2c47f';
            ctx.fillText(cardData.abilityName || '', width / 2, abilityY);
            ctx.fillText(cardData.abilityName || '', width / 2, abilityY);
            ctx.restore();
        }
        ctx.fillText(cardData.abilityName || '', width / 2, abilityY);

        // 4. Divider Line
        ctx.beginPath();
        ctx.moveTo(100, abilityY + 20);
        ctx.lineTo(width - 100, abilityY + 20);
        ctx.strokeStyle = '#4a0e0e';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 5. Mechanics (Main Body)
        ctx.font = getFont('mech', sizes.mechSize);
        ctx.fillStyle = '#1a1a1a';
        let currentY = offsets.mech || 180;
        const mechWidth = offsets.mechWidth || 600;

        if (cardData.abilityDesc) {
            currentY = TextRenderer.wrapTextCentered(
                ctx,
                cardData.abilityDesc,
                width / 2,
                currentY,
                mechWidth,
                sizes.mechSize * 1.4,
                { glow: styles.mechGlow }
            );
        }

        // 6. Lore (Bottom)
        if (cardData.description) {
            const loreY = Math.max(currentY + 40, offsets.lore || 600);
            ctx.font = getFont('lore', sizes.loreSize);
            ctx.fillStyle = '#5a4a3a';
            const loreWidth = offsets.loreWidth || 550;
            TextRenderer.wrapTextCentered(
                ctx,
                cardData.description,
                width / 2,
                loreY,
                loreWidth,
                sizes.loreSize * 1.3,
                { glow: styles.loreGlow }
            );
        }

        // 7. Apply Rounded Corners
        VisualEffects.applyRoundedCorners(ctx, width, height);
    },

    /**
     * Draw the card template background (Duplicated helper to avoid circular dep or heavy shared util)
     */
    async drawTemplate(ctx, canvas, template, scale = 1.0) {
        if (!template) {
            ctx.fillStyle = '#e0cda8';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;

        const bgWidth = width * scale;
        const bgHeight = height * scale;
        const bgX = (width - bgWidth) / 2;
        const bgY = (height - bgHeight) / 2;

        if (template.naturalWidth === 0) {
            ctx.fillStyle = '#e0cda8';
            ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
            return;
        }

        ctx.drawImage(template, bgX, bgY, bgWidth, bgHeight);
    }
};

export default BackCardRenderer;
