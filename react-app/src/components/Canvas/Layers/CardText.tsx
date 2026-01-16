import { useCallback, memo } from 'react';
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
    onHoverEnter?: (id: string) => void;
    onHoverLeave?: () => void;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    onTransformEnd?: (e: any, id: string) => void;
}

/**
 * Memoized text component for canvas rendering.
 * Only re-renders when props actually change.
 */
export const CardText = memo<CardTextProps>(({
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
    onDragEnd,
    onHoverEnter,
    onHoverLeave,
    scaleX,
    scaleY,
    rotation,
    onTransformEnd
}) => {
    // Memoize handlers to prevent new function references on each render
    const handleClick = useCallback((e: any) => onSelect(e, id), [onSelect, id]);
    const handleTap = useCallback((e: any) => onSelect(e, id), [onSelect, id]);
    const handleDblClick = useCallback((e: any) => onDblClick && onDblClick(e, id, text), [onDblClick, id, text]);
    const handleDragEnd = useCallback((e: any) => onDragEnd(e, id), [onDragEnd, id]);

    const handleMouseEnter = useCallback((e: any) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'pointer';
        // Trigger hover selection preview
        if (onHoverEnter) onHoverEnter(id);
    }, [onHoverEnter, id]);

    const handleMouseLeave = useCallback((e: any) => {
        const stage = e.target.getStage();
        if (stage) stage.container().style.cursor = 'default';
        // Clear hover selection preview
        if (onHoverLeave) onHoverLeave();
    }, [onHoverLeave]);

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
            direction="rtl"
            hitFunc={textHitFunc}
            draggable={isEditMode}
            dragBoundFunc={dragBoundFunc}
            onClick={handleClick}
            onTap={handleTap}
            onDblClick={handleDblClick}
            onDragEnd={handleDragEnd}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            scaleX={scaleX}
            scaleY={scaleY}
            rotation={rotation}
            onTransformEnd={(e) => onTransformEnd && onTransformEnd(e, id)}
            {...textStyles}
        />
    );
});

// Display name for React DevTools
CardText.displayName = 'CardText';
