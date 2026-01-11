import React from 'react';
import { Text } from 'react-konva';
import { dragBoundFunc, textHitFunc, CARD_WIDTH } from '../utils/canvasUtils';

interface CardTextProps {
    id: string;
    text: string;
    y: number;
    fontSize: number;
    fontFamily: string;
    fill: string;
    fontStyle?: string;
    align?: string;
    width?: number;
    padding?: number;
    isEditMode: boolean;
    textStyles?: any;
    onSelect: (e: any, id: string) => void;
    onDblClick?: (e: any, id: string, text: string) => void;
    onDragEnd: (e: any, id: string) => void;
}

export const CardText: React.FC<CardTextProps> = ({
    id,
    text,
    y,
    fontSize,
    fontFamily,
    fill,
    fontStyle = 'normal',
    align = 'center',
    width = CARD_WIDTH,
    padding = 0,
    isEditMode,
    textStyles = {},
    onSelect,
    onDblClick,
    onDragEnd
}) => {
    return (
        <Text
            id={id}
            text={text}
            x={padding}
            y={y}
            width={width}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fontStyle={fontStyle}
            fill={fill}
            align={align}
            hitFunc={textHitFunc}
            draggable={isEditMode}
            dragBoundFunc={dragBoundFunc}
            onClick={(e) => onSelect(e, id)}
            onTap={(e) => onSelect(e, id)}
            onDblClick={(e) => onDblClick && onDblClick(e, id, text)}
            onDragEnd={(e) => onDragEnd(e, id)}
            onMouseEnter={(e) => {
                if (isEditMode) {
                    const stage = e.target.getStage();
                    if (stage) stage.container().style.cursor = 'move';
                }
            }}
            onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
            }}
            {...textStyles}
        />
    );
};
