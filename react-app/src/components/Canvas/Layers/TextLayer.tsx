import React from 'react';
import { Group } from 'react-konva';
import { CardText } from './CardText';
import { LAYOUT } from '../utils/canvasUtils';

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
}

export const TextLayer: React.FC<TextLayerProps> = ({
    cardData,
    isFlipped,
    isEditMode,
    getOffset,
    getCustomStyle,
    getTextStyles,
    onSelect,
    onDblClick,
    onDragEnd
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
            />

            {/* 2. TYPE */}
            <CardText
                id="type"
                text={cardData.subtype || cardData.front?.type || cardData.typeHe || 'סכין'}
                y={LAYOUT.TYPE_Y + getOffset('type')}
                fontSize={getCustomStyle('type', 'fontSize', 30)}
                fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')}
                fontStyle="italic"
                fill={getCustomStyle('type', 'fill', '#555555')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('type', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
            />

            {/* 3. TITLE */}
            <CardText
                id="title"
                text={cardData.front?.title || cardData.name || 'שם הפריט'}
                y={LAYOUT.TITLE_Y + getOffset('title')}
                fontSize={getCustomStyle('title', 'fontSize', 60)}
                fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')}
                fontStyle="bold"
                fill={getCustomStyle('title', 'fill', '#2c1810')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('title', 'front')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
            />

            {/* 4. STATS (Quick Stats) */}
            <CardText
                id="stats"
                text={cardData.front?.quickStats || cardData.quickStats || '1d4 חותך'}
                y={LAYOUT.STATS_Y + getOffset('stats')}
                fontSize={getCustomStyle('stats', 'fontSize', 32)}
                fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')}
                fill={getCustomStyle('stats', 'fill', '#8B0000')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('stats', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
            />

            {/* 5. GOLD */}
            <CardText
                id="gold"
                text={cardData.front?.gold || (cardData.gold ? `${cardData.gold} זהב` : '10 זהב')}
                y={LAYOUT.GOLD_Y + getOffset('gold')}
                fontSize={getCustomStyle('gold', 'fontSize', 24)}
                fontFamily={getCustomStyle('gold', 'fontFamily', 'Arial')}
                fill={getCustomStyle('gold', 'fill', '#D2691E')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('gold', 'front')}
                onSelect={onSelect}
                onDragEnd={(e, id) => onDragEnd(e, id, 'front')}
            />
        </>
    );

    // Back Side Texts
    const renderBackTexts = () => (
        <>
            {/* 1. ABILITY NAME */}
            <CardText
                id="abilityName"
                text={cardData.back?.title || cardData.abilityName || 'שם יכולת'}
                y={220 + getOffset('abilityName', 'back')}
                fontSize={getCustomStyle('abilityName', 'fontSize', 36, 'back')}
                fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')}
                fontStyle="bold"
                fill={getCustomStyle('abilityName', 'fill', '#2c1810', 'back')}
                align={getCustomStyle('abilityName', 'align', 'center', 'back')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('abilityName', 'back')}
                width={750 - (getCustomStyle('abilityName', 'padding', 75, 'back') * 2)}
                padding={getCustomStyle('abilityName', 'padding', 75, 'back')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'back')}
            />

            {/* 2. MECHANICS / BODY */}
            <CardText
                id="mech"
                text={cardData.back?.mechanics || cardData.abilityDesc || 'תיאור היכולת...'}
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
            />

            {/* 3. LORE / FLAVOR */}
            <CardText
                id="lore"
                text={cardData.back?.lore || cardData.description || 'תיאור עלילתי...'}
                y={650 + getOffset('lore', 'back')}
                fontSize={getCustomStyle('lore', 'fontSize', 22, 'back')}
                fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')}
                fontStyle="italic"
                fill={getCustomStyle('lore', 'fill', '#555555', 'back')}
                align={getCustomStyle('lore', 'align', 'center', 'back')}
                isEditMode={isEditMode}
                textStyles={getTextStyles('lore', 'back')}
                width={750 - (getCustomStyle('lore', 'padding', 75, 'back') * 2)}
                padding={getCustomStyle('lore', 'padding', 75, 'back')}
                onSelect={onSelect}
                onDblClick={onDblClick}
                onDragEnd={(e, id) => onDragEnd(e, id, 'back')}
            />
        </>
    );

    return (
        <Group>
            {!isFlipped ? renderFrontTexts() : renderBackTexts()}
        </Group>
    );
};
