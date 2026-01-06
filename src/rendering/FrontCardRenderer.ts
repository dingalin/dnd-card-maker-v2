// @ts-nocheck
import TextRenderer from './TextRenderer.ts';
import VisualEffects from './VisualEffects.ts';
import ImageRenderer from './ImageRenderer.ts';
import { FRONT_FONT_SIZES } from '../config/CardTextConfig';

export const FrontCardRenderer = {
    /**
     * Render the front of the card
     */
    async render(ctx, canvas, cardData, options = {}, template) {
        console.log("FrontCardRenderer: render called");
        console.log("FrontCardRenderer: OPTIONS=", JSON.stringify({ name: options.name, type: options.type, rarity: options.rarity, coreStats: options.coreStats, stats: options.stats, gold: options.gold }));

        const width = canvas.width;
        const height = canvas.height;

        const imageYOffset = parseInt(options.imageYOffset) || 0;

        // Granular offsets
        const offsets = {
            image: imageYOffset,
            name: parseInt(options.name) || 0,
            type: parseInt(options.type) || 0,
            rarity: parseInt(options.rarity) || 0,
            gold: parseInt(options.gold) || 0,
            coreStats: parseInt(options.coreStats) || 680,
            stats: parseInt(options.stats) || 780,
            fontFamily: options.fontFamily || 'Heebo',
            fontSizes: options.fontSizes,
            fontStyles: options.fontStyles,
            // Widths
            nameWidth: Number(options.nameWidth) || 500,
            typeWidth: Number(options.typeWidth) || 500,
            rarityWidth: Number(options.rarityWidth) || 500,
            coreStatsWidth: Number(options.coreStatsWidth) || 500,
            statsWidth: Number(options.statsWidth) || 500,
            goldWidth: Number(options.goldWidth) || 500,
            // Effects
            textOutlineEnabled: options.textOutlineEnabled,
            textOutlineWidth: options.textOutlineWidth,
            textShadowEnabled: options.textShadowEnabled,
            textShadowBlur: options.textShadowBlur,
            textBackdropEnabled: options.textBackdropEnabled,
            textBackdropOpacity: options.textBackdropOpacity
        };

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // 1. Draw Template
        await this.drawTemplate(ctx, canvas, template, options.backgroundScale);

        // 1.5 Draw Center Fade
        const centerFade = options.centerFade || 0;
        if (centerFade > 0) {
            VisualEffects.drawCenterFade(ctx, width, height, centerFade);
        }

        // 2. Draw Item Image
        if (cardData.imageUrl) {
            const centerX = width / 2;
            const centerY = height / 2;

            // Default fade for natural/colored backgrounds if not specified
            // This ensures text remains readable and the image blends with the card
            const defaultFade = (options.imageStyle === 'natural' || options.imageStyle === 'colored_background' || !options.imageStyle) ? 30 : 0;
            const appliedFade = options.imageFade !== undefined ? options.imageFade : defaultFade;

            await ImageRenderer.drawItemImage(
                ctx,
                cardData.imageUrl,
                {
                    yOffset: offsets.image,
                    scale: options.imageScale,
                    rotation: options.imageRotation,
                    style: options.imageStyle,
                    color: options.imageColor,
                    fade: appliedFade,
                    shadow: options.imageShadow
                },
                centerX,
                centerY
            );
        }

        // 3. Draw Text
        this.renderText(ctx, canvas, cardData, offsets);

        // 4. Apply Rounded Corners
        VisualEffects.applyRoundedCorners(ctx, width, height);
    },

    /**
     * Draw the card template background
     */
    async drawTemplate(ctx, canvas, template, scale = 1.0) {
        if (!template) return;

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

        // Draw background color behind opacity logic 
        // We assume most templates might have transparency in the middle
        // Instead of reading pixels (slow), we just draw the paper color BEHIND the template first
        // using 'destination-over' if we drew template first, or just draw rect first.

        ctx.save();
        ctx.fillStyle = '#e0cda8';
        ctx.fillRect(bgX + 20, bgY + 20, bgWidth - 40, bgHeight - 40); // Inner area approx
        ctx.restore();

        ctx.drawImage(template, bgX, bgY, bgWidth, bgHeight);
    },

    /**
     * Render all text elements
     */
    renderText(ctx, canvas, data, offsets) {
        const width = canvas.width;
        const sizes = {
            nameSize: FRONT_FONT_SIZES.nameSize,
            typeSize: FRONT_FONT_SIZES.typeSize,
            raritySize: FRONT_FONT_SIZES.raritySize,
            statsSize: FRONT_FONT_SIZES.statsSize,
            coreStatsSize: FRONT_FONT_SIZES.coreStatsSize,
            goldSize: FRONT_FONT_SIZES.goldSize,
            ...(offsets.fontSizes || {})
        };

        const styles = offsets.fontStyles || {};

        // Helper to construct font string
        const getFont = (prefix, size) => {
            return TextRenderer.buildFontString(styles, prefix, size, offsets.fontFamily);
        };

        // Common draw options
        const drawOpts = {
            styles,
            outlineEnabled: offsets.textOutlineEnabled,
            outlineWidth: offsets.textOutlineWidth,
            shadowBlur: offsets.textShadowBlur,
            shadowEnabled: offsets.textShadowEnabled
        };

        // 1. Rarity
        ctx.font = getFont('rarity', sizes.raritySize);
        ctx.fillStyle = '#2c1810';
        // Set RTL direction for Hebrew text - crucial for proper punctuation placement
        ctx.direction = 'rtl';
        ctx.textAlign = 'center';
        TextRenderer.drawStyledText(
            ctx,
            data.rarityHe || '',
            width / 2,
            100 + offsets.rarity,
            offsets.rarityWidth,
            { ...drawOpts, elementName: 'rarity' }
        );

        // 2. Type
        ctx.font = getFont('type', sizes.typeSize);
        TextRenderer.drawStyledText(
            ctx,
            `${data.typeHe || ''}`,
            width / 2,
            140 + offsets.type,
            offsets.typeWidth,
            { ...drawOpts, elementName: 'type' }
        );

        // 3. Name
        ctx.font = getFont('name', sizes.nameSize);
        ctx.fillStyle = '#2c1810';
        TextRenderer.drawStyledText(
            ctx,
            data.name,
            width / 2,
            200 + offsets.name,
            offsets.nameWidth,
            { ...drawOpts, elementName: 'name' }
        );

        // Core Stats Construction
        let coreStatsText = this.constructCoreStatsText(data);

        // Backdrop
        if (offsets.textBackdropEnabled) {
            VisualEffects.drawTextBackdrop(ctx, width, canvas.height, (offsets.coreStats || 680) - 50, offsets.textBackdropOpacity || 40);
        }

        // 4. Core Stats
        if (coreStatsText) {
            const coreSize = sizes.coreStatsSize || (sizes.statsSize * 1.3);
            ctx.font = getFont('coreStats', coreSize);
            ctx.fillStyle = '#1a1a1a';
            TextRenderer.drawStyledText(
                ctx,
                coreStatsText,
                width / 2,
                offsets.coreStats,
                offsets.coreStatsWidth,
                { ...drawOpts, elementName: 'coreStats' }
            );
        }

        // 5. Quick Stats / Description
        let statsText = data.quickStats;
        if (statsText) {
            // Use TextRenderer to clean
            const locale = window.i18n?.getLocale() || 'he';
            statsText = TextRenderer.cleanStatsText(statsText, locale);
        }

        if (statsText) {
            ctx.font = getFont('stats', sizes.statsSize);
            ctx.fillStyle = '#1a1a1a';
            TextRenderer.wrapTextCentered(
                ctx,
                statsText,
                width / 2,
                offsets.stats || 800,
                offsets.statsWidth,
                sizes.statsSize * 1.2,
                { glow: styles.statsGlow } // Minimal options for wrapText, maybe expand TextRenderer if needed
            );
        }

        // 6. Gold
        const goldValue = data.gold || '-';
        ctx.font = getFont('gold', sizes.goldSize);

        // Measure for icon placement
        const metrics = ctx.measureText(goldValue);
        const iconSize = sizes.goldSize * 1.5;
        const spacing = 10;
        const totalW = metrics.width + iconSize + spacing;
        const startX = (width - totalW) / 2;
        const textX = startX + iconSize + spacing + (metrics.width / 2);
        const goldY = 920 + offsets.gold;

        // Draw Icon
        VisualEffects.drawGoldIcon(ctx, startX + iconSize / 2, goldY - (sizes.goldSize * 0.4), iconSize);

        // Draw Text
        ctx.fillStyle = '#d4af37';
        // Simulating heavy stroke for gold
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.strokeText(goldValue, textX, goldY);
        ctx.fillText(goldValue, textX, goldY);
        ctx.lineWidth = 1;
    },

    constructCoreStatsText(data) {
        let text = "";

        // Weapon Damage
        if (data.weaponDamage && data.weaponDamage !== 'null') {
            const locale = window.i18n?.getLocale() || 'he';
            let baseDamage = data.weaponDamage;

            // Keep dice notation as-is since canvas draws LTR
            // Just format: "1d6+1 דוקר" - damage first, then type
            const damageType = data.damageType || '';

            if (data.versatileDamage) {
                const versatile = data.versatileDamage;
                text = `${baseDamage} (🤲${versatile}) ${damageType}`;
            } else {
                text = `${baseDamage} ${damageType}`;
            }

            if (data.weaponProperties?.length > 0) {
                const props = data.weaponProperties.filter(p => p !== 'רב-שימושי');
                if (props.length > 0) text += `\n(${props.join(', ')})`;
            }
        }

        // Armor Class
        if (data.armorClass && data.armorClass !== 'null') {
            const locale = window.i18n?.getLocale() || 'he';
            const labels = locale === 'he'
                ? { ac: 'דרג"ש', base: 'בסיס' }
                : { ac: 'AC', base: 'base' };

            if (data.armorBonus && data.armorBonus > 0) {
                const baseAC = parseInt(data.armorClass, 10) - data.armorBonus;
                text = `+${data.armorBonus} ${labels.ac}\n(${baseAC} ${labels.base} + ${data.armorBonus})`;
            } else {
                text = `${data.armorClass} ${labels.ac}`;
            }

            if (data.dexModLabel) {
                text += `\n(${data.dexModLabel})`;
            }
        }

        // Clean
        text = TextRenderer.translateDamageTypes(text, window.i18n?.getLocale() || 'he');
        text = text.replace(/\+0\s*/g, '').replace(/null/gi, '').trim();
        return text;
    }
};

export default FrontCardRenderer;
