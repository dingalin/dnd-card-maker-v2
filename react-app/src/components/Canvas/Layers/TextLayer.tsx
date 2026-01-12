import React, { useState, useEffect } from 'react';
import { Group, Image as KonvaImage, Text } from 'react-konva';
import { CardText } from './CardText';
import { LAYOUT, dragBoundFunc, CARD_WIDTH } from '../utils/canvasUtils';

interface TextLayerProps {
    cardData: any;
    isFlipped: boolean;
    isEditMode: boolean;
    getOffset: (key: string, side?: 'front' | 'back') => number;
    getCustomStyle: (key: string, prop: string, defaultValue: any, side?: 'front' | 'back') => any;
    getTextStyles: (key: string, side?: 'front' | 'back') => any;
    onSelect: (e: any, id: string) => void;
    onDblClick: (e: any, id: string, text: string) => void;
    onDragEnd: (e: any, id: string, side?: 'front' | 'back') => void;
    onHoverEnter: (id: string) => void;
    onHoverLeave: () => void;
}

const GoldDisplay = ({
    id,
    goldValue,
    currencyIcon,
    y,
    fontSize,
    fontFamily,
    fill,
    isEditMode,
    textStyles,
    onSelect,
    onDragEnd,
    onHoverEnter,
    onHoverLeave
}: any) => {
    // Check if icon is an image asset
    const isImage = currencyIcon && currencyIcon.startsWith('gold');
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (isImage) {
            const img = new window.Image();
            img.src = `/src/assets/${currencyIcon}.png`;
            img.onload = () => setImage(img);
        }
    }, [currencyIcon, isImage]);

    // Numeric value string
    const numericText = goldValue?.toString().replace(/[^\d]/g, '') || goldValue || '0';

    if (isImage && image) {
        // Render Group with Image + Text
        const iconSize = fontSize * 1.5; // Scale icon relative to font size

        return (
            <Group
                id={id}
                y={y}
                draggable={isEditMode}
                dragBoundFunc={dragBoundFunc}
                onDragEnd={onDragEnd}
                onClick={(e) => onSelect(e, id)}
                onTap={(e) => onSelect(e, id)}
                onMouseEnter={() => {
                    if (onHoverEnter) onHoverEnter(id);
                    document.body.style.cursor = 'pointer';
                }}
                onMouseLeave={() => {
                    if (onHoverLeave) onHoverLeave();
                    document.body.style.cursor = 'default';
                }}
            >
                {/* Center the content. We assume a total width roughly and center it around CARD_WIDTH/2 */}
                <KonvaImage
                    image={image}
                    width={iconSize}
                    height={iconSize}
                    x={(CARD_WIDTH / 2) - (iconSize + 10)} // Left of center
                    y={-iconSize / 2 + 10}
                />
                <Text
                    text={numericText}
                    x={(CARD_WIDTH / 2) + 5} // Right of center
                    y={-fontSize / 2}
                    fontSize={fontSize}
                    fontFamily={fontFamily}
                    fill={fill}
                    {...textStyles}
                />
            </Group>
        );
    }

    // Fallback to standard CardText with Emoji/Text
    return (
        <CardText
            id={id}
            text={`${numericText} ${currencyIcon}`}
            y={y}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={fill}
            isEditMode={isEditMode}
            textStyles={textStyles}
            onSelect={onSelect}
            onDragEnd={onDragEnd}
            onHoverEnter={onHoverEnter}
            onHoverLeave={onHoverLeave}
        />
    );
};

export const TextLayer: React.FC<TextLayerProps> = ({
    cardData,
    isFlipped,
    isEditMode,
    getOffset,
    getCustomStyle,
    getTextStyles,
    onSelect,
    onDblClick,
    onDragEnd,
    onHoverEnter,
    onHoverLeave
}) => {

    // Front Side Texts
    const renderFrontTexts = () => (
        <>
            {/* 1. RARITY */}
            <CardText
                id="rarity"
                text={cardData.front?.rarity || cardData.rarityHe || 'נדירות'}
                y={LAYOUT.RARITY_Y + getOffset('rarity')}
                fontSize={getCustomStyle('rarity', 'fontSize', 28)}
                fontFamily={getCustomStyle('rarity', 'fontFamily', 'Arial')}
                fill={getCustomStyle('rarity', 'fill', '#d4af37')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('rarity', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 2. TYPE */}
            <CardText
                id="type"
                text={cardData.subtype || cardData.front?.type || cardData.typeHe || 'סכין'}
                y={LAYOUT.TYPE_Y + getOffset('type')}
                fontSize={getCustomStyle('type', 'fontSize', 30)}
                fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')}
                fontStyle={getCustomStyle('type', 'fontStyle', 'italic')}
                fill={getCustomStyle('type', 'fill', '#555555')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('type', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 3. TITLE */}
            <CardText
                id="title"
                text={cardData.front?.title || cardData.name || 'שם הפריט'}
                y={LAYOUT.TITLE_Y + getOffset('title')}
                fontSize={getCustomStyle('title', 'fontSize', 60)}
                fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')}
                fontStyle={getCustomStyle('title', 'fontStyle', 'bold')}
                fill={getCustomStyle('title', 'fill', '#2c1810')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('title', 'front')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 4. STATS (Quick Stats OR weaponDamage) */}
            <CardText
                id="stats"
                text={
                    cardData.weaponDamage ||
                    cardData.front?.quickStats ||
                    cardData.quickStats ||
                    '1d4 חותך'
                }
                y={LAYOUT.STATS_Y + getOffset('stats')}
                fontSize={getCustomStyle('stats', 'fontSize', 32)}
                fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')}
                fill={getCustomStyle('stats', 'fill', '#8B0000')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('stats', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 5. GOLD */}
            <GoldDisplay
                id="gold"
                goldValue={
                    cardData.gold ||
                    cardData.front?.gold ||
                    '10'
                }
                currencyIcon={getCustomStyle('gold', 'currencyIcon', '🪙')}
                y={LAYOUT.GOLD_Y + getOffset('gold')}
                fontSize={getCustomStyle('gold', 'fontSize', 24)}
                fontFamily={getCustomStyle('gold', 'fontFamily', 'Arial')}
                fill={getCustomStyle('gold', 'fill', '#D2691E')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('gold', 'front')}
                onSelect={onSelect}
                onDragEnd={(e: any, id: string) => onDragEnd(e, id, 'front')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />
        </>
    );

    // Back Side Texts
    const renderBackTexts = () => (
        <>
            {/* 1. ABILITY NAME */}
            <CardText
                id="abilityName"
                text={cardData.abilityName || cardData.back?.title || 'שם יכולת'}
                y={220 + getOffset('abilityName', 'back')}
                fontSize={getCustomStyle('abilityName', 'fontSize', 36, 'back')}
                fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')}
                fontStyle={getCustomStyle('abilityName', 'fontStyle', 'bold', 'back')}
                fill={getCustomStyle('abilityName', 'fill', '#2c1810', 'back')}
                align={getCustomStyle('abilityName', 'align', 'center', 'back')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('abilityName', 'back')}
                width={750 - (getCustomStyle('abilityName', 'padding', 75, 'back') * 2)}
                padding={getCustomStyle('abilityName', 'padding', 75, 'back')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'back')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 2. MECHANICS / BODY */}
            <CardText
                id="mech"
                text={cardData.abilityDesc || cardData.back?.mechanics || 'תיאור היכולת...'}
                y={320 + getOffset('mech', 'back')}
                fontSize={getCustomStyle('mech', 'fontSize', 24, 'back')}
                fontFamily={getCustomStyle('mech', 'fontFamily', 'Arial', 'back')}
                fill={getCustomStyle('mech', 'fill', '#000000', 'back')}
                align={getCustomStyle('mech', 'align', 'center', 'back')}
                isEditMode={isEditMode}
                textStyles={{
                    ...getTextStyles('mech', 'back'),
                    lineHeight: 1.4,
                }}
                width={750 - (getCustomStyle('mech', 'padding', 75, 'back') * 2)}
                padding={getCustomStyle('mech', 'padding', 75, 'back')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'back')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />

            {/* 3. LORE / FLAVOR */}
            <CardText
                id="lore"
                text={cardData.description || cardData.back?.lore || 'תיאור עלילתי...'}
                y={750 + getOffset('lore', 'back')}
                fontSize={getCustomStyle('lore', 'fontSize', 22, 'back')}
                fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')}
                fontStyle={getCustomStyle('lore', 'fontStyle', 'italic', 'back')}
                fill={getCustomStyle('lore', 'fill', '#555555', 'back')}
                align={getCustomStyle('lore', 'align', 'center', 'back')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('lore', 'back')}
                width={750 - (getCustomStyle('lore', 'padding', 75, 'back') * 2)}
                padding={getCustomStyle('lore', 'padding', 75, 'back')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'back')}
                onHoverEnter={onHoverEnter}
                onHoverLeave={onHoverLeave}
            />
        </>
    );

    return (
        <Group>
            {!isFlipped ? renderFrontTexts() : renderBackTexts()}
        </Group>
    );
};
