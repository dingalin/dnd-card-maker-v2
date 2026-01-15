import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Text, Rect } from 'react-konva';
import Konva from 'konva';
import i18n from '../../../i18n/config';
import { CardText } from './CardText';
import { LAYOUT, dragBoundFunc, CARD_WIDTH } from '../utils/canvasUtils';

// Helper: Convert dice notation from English (d) to Hebrew (ק) when in Hebrew mode
// Examples: "1d4" -> "1ק4", "2d6+5" -> "2ק6+5"
const localizedDice = (text: string): string => {
    if (!text) return text;
    if (i18n.language !== 'he') return text;
    // Replace "d" between digits with "ק" (e.g., 1d4 -> 1ק4, 2d6 -> 2ק6)
    return text.replace(/(\d)d(\d)/gi, '$1ק$2');
};

interface TextLayerProps {
    cardData: any;
    isFlipped: boolean;
    isEditMode: boolean;
    showHitboxes?: boolean; // DEBUG: Show hitbox rectangles
    getOffset: (key: string, side?: 'front' | 'back') => number;
    getCustomStyle: (key: string, prop: string, defaultValue: any, side?: 'front' | 'back') => any;
    getTextStyles: (key: string, side?: 'front' | 'back') => any;
    onSelect: (e: any, id: string) => void;
    onDblClick: (e: any, id: string, text: string) => void;
    onDragEnd: (e: any, id: string, side?: 'front' | 'back') => void;
    onTransformEnd: (e: any, id: string, side?: 'front' | 'back') => void;
    onHoverEnter: (id: string) => void;
    onHoverLeave: () => void;
}

// Helper function to convert hex color to rgba with opacity
const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Component to render text box background
const TextBoxBackground = ({
    id,
    text,
    width,
    fontSize,
    fontFamily,
    padding = 0,
    getCustomStyle,
    side = 'front'
}: any) => {
    const bannerId = getCustomStyle(id, 'banner', 'none', side);
    const [bannerImage, setBannerImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (bannerId && bannerId !== 'none') {
            const img = new window.Image();
            img.src = `/src/assets/banners/${bannerId}.png`;
            img.onload = () => setBannerImage(img);
        } else {
            setBannerImage(null);
        }
    }, [bannerId]);

    // Banner Logic
    if (bannerId && bannerId !== 'none' && bannerImage) {
        const bannerWidth = width;
        const aspectRatio = bannerImage.width / bannerImage.height;
        const bannerHeight = bannerWidth / aspectRatio;

        return (
            <KonvaImage
                image={bannerImage}
                x={0} // Relative to Group
                y={-(bannerHeight / 2) + (fontSize / 2)}
                width={bannerWidth}
                height={bannerHeight}
                listening={false}
            />
        );
    }

    // Standard Box Logic
    const isEnabled = getCustomStyle(id, 'textBox_enabled', false, side);
    if (!isEnabled) return null;

    const bgColor = getCustomStyle(id, 'textBox_fill', '#f5ebdc', side);
    const opacity = getCustomStyle(id, 'textBox_opacity', 85, side) / 100;
    const cornerRadius = getCustomStyle(id, 'textBox_cornerRadius', 10, side);
    const strokeWidth = getCustomStyle(id, 'textBox_strokeWidth', 0, side);
    const strokeColor = getCustomStyle(id, 'textBox_stroke', '#000000', side);
    const boxPadding = getCustomStyle(id, 'textBox_padding', 15, side);

    const cleanText = String(text || '').trim();

    // For height: use wrapped text with the container width
    const tempTextForHeight = new Konva.Text({
        text: cleanText,
        fontSize: fontSize,
        fontFamily: fontFamily,
        width: width - (padding * 2),
        align: 'center',
        lineHeight: 1.4,
    });

    // For width: measure without wrap constraint to get actual content width
    const tempTextForWidth = new Konva.Text({
        text: cleanText,
        fontSize: fontSize,
        fontFamily: fontFamily,
        lineHeight: 1.2, // Reduced from 1.4 for tighter box fit
    });

    const SAFETY_MARGIN = 4;
    const VISUAL_OFFSET_CORRECTION = 2;
    const textHeight = tempTextForHeight.getHeight();

    // For multi-line text, we need to find the widest line
    // Split by newlines and measure each line individually
    const lines = cleanText.split('\n');
    let maxLineWidth = 0;
    for (const line of lines) {
        const singleLine = new Konva.Text({
            text: line.trim(),
            fontSize: fontSize,
            fontFamily: fontFamily,
        });
        maxLineWidth = Math.max(maxLineWidth, singleLine.getWidth());
    }

    // Use the smaller of: widest line or unwrapped full text
    const actualTextWidth = Math.min(tempTextForWidth.getWidth(), maxLineWidth);
    const boxWidth = Math.min(actualTextWidth + boxPadding, width);
    const boxX = (width - boxWidth) / 2; // Center the box

    return (
        <Rect
            x={boxX} // Centered
            y={-SAFETY_MARGIN - VISUAL_OFFSET_CORRECTION}
            width={boxWidth}
            height={textHeight + SAFETY_MARGIN}
            fill={hexToRgba(bgColor, opacity)}
            cornerRadius={cornerRadius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            listening={false}
        />
    );
};

const GoldDisplay = ({
    id,
    goldValue,
    currencyIcon,
    baseY,
    fontSize,
    fontFamily,
    fill,
    isEditMode,
    textStyles,
    getCustomStyle,
    onSelect,
    onDragEnd,
    onTransformEnd,
    onHoverEnter,
    onHoverLeave,
    offsetY, // Explicitly pass offsets from parent
    offsetX,
    scaleX,
    scaleY,
    rotation
}: any) => {
    const isImage = currencyIcon && currencyIcon.startsWith('gold');
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (isImage) {
            const img = new window.Image();
            img.src = `${import.meta.env.BASE_URL}assets/${currencyIcon}.png`;
            img.onload = () => setImage(img);
        }
    }, [currencyIcon, isImage]);

    const numericText = goldValue?.toString().replace(/[^\d]/g, '') || goldValue || '0';

    if (isImage && image) {
        const iconSize = fontSize * 1.5;
        const gap = 8;
        const textWidth = numericText.length * fontSize * 0.6;
        const totalWidth = iconSize + gap + textWidth;
        const startX = (CARD_WIDTH - totalWidth) / 2;

        return (
            <Group
                id={id}
                x={offsetX || 0}
                y={baseY + (offsetY || 0)}
                scaleX={scaleX || 1}
                scaleY={scaleY || 1}
                rotation={rotation || 0}
                draggable={isEditMode}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={(e) => onDragEnd(e, id)}
                onTransformEnd={(e) => onTransformEnd && onTransformEnd(e, id)}
                onClick={(e) => onSelect(e, id)}
                onTap={(e) => onSelect(e, id)}
                onMouseEnter={() => { if (onHoverEnter) onHoverEnter(id); }}
                onMouseLeave={() => { if (onHoverLeave) onHoverLeave(); }}
            >
                {getCustomStyle?.('gold', 'textBox_enabled', false) && (() => {
                    const boxPadding = getCustomStyle('gold', 'textBox_padding', 15);
                    const bgColor = getCustomStyle('gold', 'textBox_fill', '#000000');
                    const opacity = getCustomStyle('gold', 'textBox_opacity', 50) / 100;
                    const strokeWidth = getCustomStyle('gold', 'textBox_strokeWidth', 2);
                    const strokeColor = getCustomStyle('gold', 'textBox_stroke', '#8b7355');
                    const badgeWidth = totalWidth + (boxPadding * 2);
                    const badgeHeight = iconSize + (boxPadding * 2);
                    const badgeX = startX - boxPadding;
                    const cornerRadius = getCustomStyle('gold', 'textBox_cornerRadius', badgeHeight / 2);

                    return (
                        <Rect
                            x={badgeX}
                            y={-boxPadding}
                            width={badgeWidth}
                            height={badgeHeight}
                            fill={hexToRgba(bgColor, opacity)}
                            cornerRadius={cornerRadius}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            listening={false}
                        />
                    );
                })()}
                <KonvaImage image={image} width={iconSize} height={iconSize} x={startX} y={0} />
                <Text
                    text={numericText}
                    x={startX + iconSize + gap}
                    y={iconSize * 0.25}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fill={fill}
                    {...textStyles}
                />
            </Group>
        );
    }

    // Fallback to plain emoji text wrapped in Group for transform support
    return (
        <Group
            id={id}
            x={offsetX || 0}
            y={baseY + (offsetY || 0)}
            scaleX={scaleX || 1}
            scaleY={scaleY || 1}
            rotation={rotation || 0}
            draggable={isEditMode}
            dragBoundFunc={dragBoundFunc}
            onDragEnd={(e) => onDragEnd(e, id)}
            onTransformEnd={(e) => onTransformEnd && onTransformEnd(e, id)}
            onClick={(e) => onSelect(e, id)}
            onTap={(e) => onSelect(e, id)}
            onMouseEnter={() => { if (onHoverEnter) onHoverEnter(id); }}
            onMouseLeave={() => { if (onHoverLeave) onHoverLeave(); }}
        >
            {getCustomStyle?.('gold', 'textBox_enabled', false) && (() => {
                const boxPadding = getCustomStyle('gold', 'textBox_padding', 15);
                const bgColor = getCustomStyle('gold', 'textBox_fill', '#000000');
                const opacity = getCustomStyle('gold', 'textBox_opacity', 50) / 100;
                const strokeWidth = getCustomStyle('gold', 'textBox_strokeWidth', 2);
                const strokeColor = getCustomStyle('gold', 'textBox_stroke', '#8b7355');
                // Estimate width for text-only mode
                const fullText = `${numericText} ${currencyIcon}`;
                const textWidth = fullText.length * fontSize * 0.6;
                const badgeWidth = textWidth + (boxPadding * 2);
                const badgeHeight = fontSize * 1.5 + (boxPadding * 2); // Approximate height
                // badgeX unused

                return (
                    <Rect
                        x={-boxPadding}
                        y={-boxPadding}
                        width={badgeWidth}
                        height={badgeHeight}
                        fill={hexToRgba(bgColor, opacity)}
                        cornerRadius={badgeHeight / 2}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        listening={false}
                    />
                );
            })()}
            <CardText
                id={id}
                text={`${numericText} ${currencyIcon}`}
                y={0}
                fontSize={fontSize}
                fontFamily={fontFamily}
                fill={fill}
                isEditMode={false}
                textStyles={textStyles}
                onSelect={() => { }}
                onDragEnd={() => { }}
            />
        </Group>
    );
};

export const TextLayer: React.FC<TextLayerProps> = ({
    cardData,
    isFlipped,
    isEditMode,
    showHitboxes = false, // DEBUG MODE - SET TO FALSE WHEN DONE
    getOffset,
    getCustomStyle,
    getTextStyles,
    onSelect,
    onDblClick,
    onDragEnd,
    onTransformEnd,
    onHoverEnter,
    onHoverLeave
}) => {

    // Debug helper: Create a semi-transparent rectangle showing the hitbox
    // Uses Konva.Text to calculate actual text height including word wrapping
    const DebugHitbox = ({
        text,
        width,
        fontSize,
        fontFamily = 'Arial',
        lineHeight = 1.4,
        color = 'rgba(255, 0, 0, 0.3)'
    }: {
        text: string;
        width: number;
        fontSize: number;
        fontFamily?: string;
        lineHeight?: number;
        color?: string;
    }) => {
        if (!showHitboxes) return null;

        // Calculate actual text height using Konva.Text
        // IMPORTANT: Must use .height() which returns the full rendered height including word wrap
        const tempText = new Konva.Text({
            text: text,
            fontSize: fontSize,
            fontFamily: fontFamily,
            width: width,
            align: 'center',
            lineHeight: lineHeight,
        });
        // .height() gives the full height of the text area
        const textHeight = tempText.height();

        // Debug log
        console.log(`[DebugHitbox] text="${text?.substring(0, 20)}..." width=${width} fontSize=${fontSize} height=${textHeight}`);

        return (
            <Rect
                x={0}
                y={-5} // Match the textHitFunc padding
                width={width}
                height={textHeight + 10} // Match the textHitFunc padding * 2
                fill={color}
                stroke="red"
                strokeWidth={2}
                listening={false}
            />
        );
    };

    const getTransform = (key: string, side: 'front' | 'back' = 'front') => ({
        offsetX: getOffset(`${key}_x`, side) || 0,
        offsetY: getOffset(key, side) || 0,
        scaleX: getOffset(`${key}_scaleX`, side) || 1,
        scaleY: getOffset(`${key}_scaleY`, side) || 1,
        rotation: getOffset(`${key}_rotation`, side) || 0,
    });

    const renderFrontTexts = () => {
        const isVisualRarityEnabled = getCustomStyle('title', 'visualRarity_enabled', false, 'front');
        const rarityT = getTransform('rarity', 'front');
        const typeT = getTransform('type', 'front');
        const titleT = getTransform('title', 'front');
        const statsT = getTransform('stats', 'front');
        const goldT = getTransform('gold', 'front');

        return (
            <>
                {/* 1. RARITY */}
                {!isVisualRarityEnabled && (
                    <Group
                        id="rarity"
                        x={rarityT.offsetX}
                        y={LAYOUT.RARITY_Y + rarityT.offsetY}
                        scaleX={rarityT.scaleX}
                        scaleY={rarityT.scaleY}
                        rotation={rarityT.rotation}
                        draggable={isEditMode}
                        dragBoundFunc={dragBoundFunc}
                        onDragEnd={(e) => onDragEnd(e, 'rarity', 'front')}
                        onTransformEnd={(e) => onTransformEnd(e, 'rarity', 'front')}
                        onClick={(e) => onSelect(e, 'rarity')}
                        onTap={(e) => onSelect(e, 'rarity')}
                    >
                        {getCustomStyle('rarity', 'textBox_enabled', false) && (() => {
                            const padding = getCustomStyle('rarity', 'textBox_padding', 15);
                            const text = cardData.front?.rarity || 'נדירות';
                            const tempText = new Konva.Text({
                                text,
                                fontSize: getCustomStyle('rarity', 'fontSize', 28),
                                fontFamily: getCustomStyle('rarity', 'fontFamily', 'Arial'),
                            });
                            const width = tempText.getWidth() + (padding * 2);
                            const height = tempText.getHeight() + (padding * 2);
                            const x = (CARD_WIDTH - width) / 2;
                            return (
                                <Rect
                                    x={x} y={-5} width={width} height={height}
                                    fill={hexToRgba(
                                        getCustomStyle('rarity', 'textBox_fill', '#f5ebdc'),
                                        getCustomStyle('rarity', 'textBox_opacity', 85) / 100
                                    )}
                                    cornerRadius={getCustomStyle('rarity', 'textBox_cornerRadius', 19)}
                                    stroke={getCustomStyle('rarity', 'textBox_stroke', '#000000')}
                                    strokeWidth={getCustomStyle('rarity', 'textBox_strokeWidth', 0)}
                                    listening={false}
                                />
                            );
                        })()}
                        <DebugHitbox text={cardData.front?.rarity || 'נדירות'} width={CARD_WIDTH} fontSize={getCustomStyle('rarity', 'fontSize', 28)} fontFamily={getCustomStyle('rarity', 'fontFamily', 'Arial')} color="rgba(255, 255, 0, 0.3)" />
                        <CardText
                            id="rarity"
                            text={cardData.front?.rarity || 'נדירות'}
                            y={0}
                            fontSize={getCustomStyle('rarity', 'fontSize', 28)}
                            fontFamily={getCustomStyle('rarity', 'fontFamily', 'Arial')}
                            fontStyle={getCustomStyle('rarity', 'fontStyle', 'normal')}
                            fill={getCustomStyle('rarity', 'fill', '#d4af37')}
                            isEditMode={false} // Disable internal drag, Group handles it
                            textStyles={getTextStyles('rarity', 'front')}
                            onSelect={() => { }} // Handled by Group
                            onHoverEnter={onHoverEnter}
                            onHoverLeave={onHoverLeave}
                            onDragEnd={() => { }}
                        />
                    </Group>
                )}

                {/* 2. TYPE */}
                <Group
                    id="type"
                    x={typeT.offsetX}
                    y={LAYOUT.TYPE_Y + (isVisualRarityEnabled ? -20 : 0) + typeT.offsetY}
                    scaleX={typeT.scaleX}
                    scaleY={typeT.scaleY}
                    rotation={typeT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'type', 'front')}
                    onTransformEnd={(e) => onTransformEnd(e, 'type', 'front')}
                    onClick={(e) => onSelect(e, 'type')}
                    onTap={(e) => onSelect(e, 'type')}
                >
                    <TextBoxBackground
                        id="type"
                        text={cardData.front?.type || 'סכין'}
                        width={CARD_WIDTH}
                        fontSize={getCustomStyle('type', 'fontSize', 30)}
                        fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')}
                        padding={0}
                        getCustomStyle={getCustomStyle}
                        side="front"
                    />
                    <DebugHitbox text={cardData.front?.type || 'סכין'} width={CARD_WIDTH} fontSize={getCustomStyle('type', 'fontSize', 30)} fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')} color="rgba(0, 255, 0, 0.3)" />
                    <CardText
                        id="type"
                        text={cardData.front?.type || 'סכין'}
                        y={0}
                        fontSize={getCustomStyle('type', 'fontSize', 30)}
                        fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')}
                        fontStyle={getCustomStyle('type', 'fontStyle', 'normal')}
                        fill={getCustomStyle('type', 'fill', '#555555')}
                        isEditMode={false}
                        textStyles={getTextStyles('type', 'front')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDragEnd={() => { }}
                    />
                </Group>

                {/* 3. TITLE */}
                <Group
                    id="title"
                    x={titleT.offsetX}
                    y={LAYOUT.TITLE_Y + (isVisualRarityEnabled ? -20 : 0) + titleT.offsetY}
                    scaleX={titleT.scaleX}
                    scaleY={titleT.scaleY}
                    rotation={titleT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'title', 'front')}
                    onTransformEnd={(e) => onTransformEnd(e, 'title', 'front')}
                    onClick={(e) => onSelect(e, 'title')}
                    onTap={(e) => onSelect(e, 'title')}
                >
                    <TextBoxBackground
                        id="title"
                        text={cardData.front?.title || 'שם הפריט'}
                        width={CARD_WIDTH}
                        fontSize={getCustomStyle('title', 'fontSize', 60)}
                        fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')}
                        padding={0}
                        getCustomStyle={getCustomStyle}
                        side="front"
                    />
                    <DebugHitbox text={cardData.front?.title || 'שם הפריט'} width={CARD_WIDTH} fontSize={getCustomStyle('title', 'fontSize', 60)} fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')} color="rgba(255, 0, 0, 0.3)" />
                    <CardText
                        id="title"
                        text={cardData.front?.title || 'שם הפריט'}
                        y={0} // Relative to Group
                        fontSize={getCustomStyle('title', 'fontSize', 60)}
                        fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')}
                        fontStyle={getCustomStyle('title', 'fontStyle', 'bold')}
                        fill={isVisualRarityEnabled ? undefined : getCustomStyle('title', 'fill', '#2c1810')}
                        isEditMode={false} // Disable internal drag
                        textStyles={getTextStyles('title', 'front')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDblClick={onDblClick}
                        onDragEnd={() => { }}
                    />
                </Group>

                {/* 4. STATS */}
                <Group
                    id="stats"
                    x={statsT.offsetX}
                    y={LAYOUT.STATS_Y + statsT.offsetY}
                    scaleX={statsT.scaleX}
                    scaleY={statsT.scaleY}
                    rotation={statsT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'stats', 'front')}
                    onTransformEnd={(e) => onTransformEnd(e, 'stats', 'front')}
                    onClick={(e) => onSelect(e, 'stats')}
                    onTap={(e) => onSelect(e, 'stats')}
                >
                    <TextBoxBackground
                        id="stats"
                        text={localizedDice(cardData.front?.quickStats || '1ק4 חותך')}
                        width={CARD_WIDTH}
                        fontSize={getCustomStyle('stats', 'fontSize', 32)}
                        fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')}
                        padding={getCustomStyle('stats', 'padding', 20)}
                        getCustomStyle={getCustomStyle}
                        side="front"
                    />
                    <DebugHitbox text={localizedDice(cardData.front?.quickStats || '1ק4 חותך')} width={CARD_WIDTH} fontSize={getCustomStyle('stats', 'fontSize', 32)} fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')} color="rgba(0, 0, 255, 0.3)" />
                    <CardText
                        id="stats"
                        text={localizedDice(cardData.front?.quickStats || '1ק4 חותך')}
                        y={0}
                        fontSize={getCustomStyle('stats', 'fontSize', 32)}
                        fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')}
                        fontStyle={getCustomStyle('stats', 'fontStyle', 'bold')}
                        fill={getCustomStyle('stats', 'fill', '#8B0000')}
                        width={CARD_WIDTH - (getCustomStyle('stats', 'padding', 20) * 2)}
                        padding={getCustomStyle('stats', 'padding', 20)}
                        isEditMode={false}
                        textStyles={getTextStyles('stats', 'front')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDragEnd={() => { }}
                    />
                </Group>

                {/* 5. GOLD */}
                <GoldDisplay
                    id="gold"
                    goldValue={cardData.front?.gold || '10'}
                    currencyIcon={getCustomStyle('gold', 'currencyIcon', '🪙')}
                    baseY={LAYOUT.GOLD_Y}
                    // Transform props
                    offsetX={goldT.offsetX}
                    offsetY={goldT.offsetY}
                    scaleX={goldT.scaleX}
                    scaleY={goldT.scaleY}
                    rotation={goldT.rotation}

                    fontSize={getCustomStyle('gold', 'fontSize', 24)}
                    fontFamily={getCustomStyle('gold', 'fontFamily', 'Arial')}
                    fill={getCustomStyle('gold', 'fill', '#D2691E')}
                    isEditMode={isEditMode}
                    textStyles={getTextStyles('gold', 'front')}
                    getCustomStyle={getCustomStyle}
                    onSelect={onSelect}
                    onDragEnd={(e: any, id: string) => onDragEnd(e, id, 'front')}
                    onTransformEnd={(e: any, id: string) => onTransformEnd(e, id, 'front')}
                    onHoverEnter={onHoverEnter}
                    onHoverLeave={onHoverLeave}
                />
            </>
        );
    };

    const renderBackTexts = () => {
        const abilityNameT = getTransform('abilityName', 'back');
        const mechT = getTransform('mech', 'back');
        const loreT = getTransform('lore', 'back');

        return (
            <>
                {/* 1. ABILITY NAME */}
                <Group
                    id="abilityName"
                    x={abilityNameT.offsetX}
                    y={220 + abilityNameT.offsetY}
                    scaleX={abilityNameT.scaleX}
                    scaleY={abilityNameT.scaleY}
                    rotation={abilityNameT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'abilityName', 'back')}
                    onTransformEnd={(e) => onTransformEnd(e, 'abilityName', 'back')}
                    onClick={(e) => onSelect(e, 'abilityName')}
                    onTap={(e) => onSelect(e, 'abilityName')}
                >
                    <TextBoxBackground
                        id="abilityName"
                        text={cardData.back?.title || 'שם יכולת'}
                        width={750}
                        fontSize={getCustomStyle('abilityName', 'fontSize', 36, 'back')}
                        fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')}
                        padding={getCustomStyle('abilityName', 'padding', 75, 'back')}
                        getCustomStyle={getCustomStyle}
                        side="back"
                    />
                    <DebugHitbox text={cardData.back?.title || 'שם יכולת'} width={750 - (getCustomStyle('abilityName', 'padding', 75, 'back') * 2)} fontSize={getCustomStyle('abilityName', 'fontSize', 36, 'back')} fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')} color="rgba(255, 165, 0, 0.3)" />
                    <CardText
                        id="abilityName"
                        text={cardData.back?.title || 'שם יכולת'}
                        y={0}
                        fontSize={getCustomStyle('abilityName', 'fontSize', 36, 'back')}
                        fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')}
                        fontStyle={getCustomStyle('abilityName', 'fontStyle', 'bold', 'back')}
                        fill={getCustomStyle('abilityName', 'fill', '#2c1810', 'back')}
                        align={getCustomStyle('abilityName', 'align', 'center', 'back')}
                        isEditMode={false}
                        textStyles={getTextStyles('abilityName', 'back')}
                        width={750 - (getCustomStyle('abilityName', 'padding', 75, 'back') * 2)}
                        padding={getCustomStyle('abilityName', 'padding', 75, 'back')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDblClick={onDblClick}
                        onDragEnd={() => { }}
                    />
                </Group>

                {/* 2. MECHANICS */}
                <Group
                    id="mech"
                    x={mechT.offsetX}
                    y={320 + mechT.offsetY}
                    scaleX={mechT.scaleX}
                    scaleY={mechT.scaleY}
                    rotation={mechT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'mech', 'back')}
                    onTransformEnd={(e) => onTransformEnd(e, 'mech', 'back')}
                    onClick={(e) => onSelect(e, 'mech')}
                    onTap={(e) => onSelect(e, 'mech')}
                >
                    <TextBoxBackground
                        id="mech"
                        text={cardData.back?.mechanics || 'תיאור היכולת...'}
                        width={750}
                        fontSize={getCustomStyle('mech', 'fontSize', 24, 'back')}
                        fontFamily={getCustomStyle('mech', 'fontFamily', 'Arial', 'back')}
                        padding={getCustomStyle('mech', 'padding', 75, 'back')}
                        getCustomStyle={getCustomStyle}
                        side="back"
                    />
                    <DebugHitbox text={cardData.back?.mechanics || 'תיאור היכולת...'} width={750 - (getCustomStyle('mech', 'padding', 75, 'back') * 2)} fontSize={getCustomStyle('mech', 'fontSize', 24, 'back')} fontFamily={getCustomStyle('mech', 'fontFamily', 'Arial', 'back')} color="rgba(0, 255, 255, 0.3)" />
                    <CardText
                        id="mech"
                        text={cardData.back?.mechanics || 'תיאור היכולת...'}
                        y={0}
                        fontSize={getCustomStyle('mech', 'fontSize', 24, 'back')}
                        fontFamily={getCustomStyle('mech', 'fontFamily', 'Arial', 'back')}
                        fontStyle={getCustomStyle('mech', 'fontStyle', 'normal', 'back')}
                        fill={getCustomStyle('mech', 'fill', '#000000', 'back')}
                        align={getCustomStyle('mech', 'align', 'center', 'back')}
                        isEditMode={false}
                        textStyles={{ ...getTextStyles('mech', 'back'), lineHeight: 1.4 }}
                        width={750 - (getCustomStyle('mech', 'padding', 75, 'back') * 2)}
                        padding={getCustomStyle('mech', 'padding', 75, 'back')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDblClick={onDblClick}
                        onDragEnd={() => { }}
                    />
                </Group>

                {/* 3. LORE */}
                <Group
                    id="lore"
                    x={loreT.offsetX}
                    y={750 + loreT.offsetY}
                    scaleX={loreT.scaleX}
                    scaleY={loreT.scaleY}
                    rotation={loreT.rotation}
                    draggable={isEditMode}
                    dragBoundFunc={dragBoundFunc}
                    onDragEnd={(e) => onDragEnd(e, 'lore', 'back')}
                    onTransformEnd={(e) => onTransformEnd(e, 'lore', 'back')}
                    onClick={(e) => onSelect(e, 'lore')}
                    onTap={(e) => onSelect(e, 'lore')}
                >
                    <TextBoxBackground
                        id="lore"
                        text={cardData.back?.lore || 'תיאור עלילתי...'}
                        width={750}
                        fontSize={getCustomStyle('lore', 'fontSize', 22, 'back')}
                        fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')}
                        padding={getCustomStyle('lore', 'padding', 75, 'back')}
                        getCustomStyle={getCustomStyle}
                        side="back"
                    />
                    <DebugHitbox text={cardData.back?.lore || 'תיאור עלילתי...'} width={750 - (getCustomStyle('lore', 'padding', 75, 'back') * 2)} fontSize={getCustomStyle('lore', 'fontSize', 22, 'back')} fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')} lineHeight={1.4} color="rgba(255, 0, 255, 0.3)" />
                    <CardText
                        id="lore"
                        text={cardData.back?.lore || 'תיאור עלילתי...'}
                        y={0}
                        fontSize={getCustomStyle('lore', 'fontSize', 22, 'back')}
                        fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')}
                        fontStyle={getCustomStyle('lore', 'fontStyle', 'italic', 'back')}
                        fill={getCustomStyle('lore', 'fill', '#555555', 'back')}
                        align={getCustomStyle('lore', 'align', 'center', 'back')}
                        isEditMode={false}
                        textStyles={{ ...getTextStyles('lore', 'back'), lineHeight: 1.4 }}
                        width={750 - (getCustomStyle('lore', 'padding', 75, 'back') * 2)}
                        padding={getCustomStyle('lore', 'padding', 75, 'back')}
                        onSelect={() => { }}
                        onHoverEnter={onHoverEnter}
                        onHoverLeave={onHoverLeave}
                        onDblClick={onDblClick}
                        onDragEnd={() => { }}
                    />
                </Group>
            </>
        );
    };

    return (
        <Group>
            {!isFlipped ? renderFrontTexts() : renderBackTexts()}
        </Group>
    );
};
