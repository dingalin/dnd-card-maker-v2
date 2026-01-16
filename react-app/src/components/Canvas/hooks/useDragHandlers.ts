/**
 * useDragHandlers - Hook for managing drag and transform handlers
 * Extracted from CardCanvas.tsx for better separation of concerns
 */

import { useCallback } from 'react';
import { LAYOUT, CARD_WIDTH } from '../utils/canvasUtils';

interface UseDragHandlersProps {
    updateOffset: (key: string, value: number, side: 'front' | 'back') => void;
    updateBatchOffsets: (updates: Array<{ key: string; value: number; side: 'front' | 'back' }>) => void;
}

interface UseDragHandlersReturn {
    handleDragEnd: (e: any, key: string, side?: 'front' | 'back') => void;
    handleTransformEnd: (e: any, key: string, side?: 'front' | 'back') => void;
    handleImageDragEnd: (e: any) => void;
    handleImageTransformEnd: (stageRef: any, itemImageGroupRef: any) => void;
}

// Base Y positions for text elements
const BASE_POSITIONS: Record<string, number> = {
    rarity: LAYOUT.RARITY_Y,
    type: LAYOUT.TYPE_Y,
    title: LAYOUT.TITLE_Y,
    stats: LAYOUT.STATS_Y,
    gold: LAYOUT.GOLD_Y,
    image: 240,
    desc: LAYOUT.STATS_Y,
    abilityName: 220,
    mech: 320,
    lore: 750
};

export function useDragHandlers({
    updateOffset,
    updateBatchOffsets
}: UseDragHandlersProps): UseDragHandlersReturn {

    // Handle drag end for text elements
    const handleDragEnd = useCallback((e: any, key: string, side: 'front' | 'back' = 'front') => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        const baseY = BASE_POSITIONS[key] || 0;
        const baseX = 0;

        updateBatchOffsets([
            { key: key, value: newY - baseY, side },
            { key: `${key}_x`, value: newX - baseX, side }
        ]);
    }, [updateBatchOffsets]);

    // Handle transform end for text elements
    const handleTransformEnd = useCallback((e: any, key: string, side: 'front' | 'back' = 'front') => {
        const node = e.target;
        const baseY = BASE_POSITIONS[key] || 0;
        const baseX = 0;

        updateBatchOffsets([
            { key: key, value: node.y() - baseY, side },
            { key: `${key}_x`, value: node.x() - baseX, side },
            { key: `${key}_scaleX`, value: node.scaleX(), side },
            { key: `${key}_scaleY`, value: node.scaleY(), side },
            { key: `${key}_rotation`, value: node.rotation(), side }
        ]);
    }, [updateBatchOffsets]);

    // Handle image drag end - keeps X centered
    const handleImageDragEnd = useCallback((e: any) => {
        const node = e.target;
        const BASE_X = CARD_WIDTH / 2;
        const BASE_Y = 240;

        const newY = node.y();

        // Reset X to center
        node.x(BASE_X);

        // Only save Y offset
        updateOffset('imageXOffset', 0, 'front');
        updateOffset('imageYOffset', newY - BASE_Y, 'front');
    }, [updateOffset]);

    // Handle image transform end
    const handleImageTransformEnd = useCallback((stageRef: any, itemImageGroupRef: any) => {
        const node = stageRef?.current?.findOne('#itemImage');
        if (!node) return;

        const BASE_X = CARD_WIDTH / 2;
        const BASE_Y = 240;

        const scaleX = node.scaleX();

        updateBatchOffsets([
            { key: 'imageXOffset', value: node.x() - BASE_X, side: 'front' },
            { key: 'imageYOffset', value: node.y() - BASE_Y, side: 'front' },
            { key: 'imageScale', value: scaleX, side: 'front' },
            { key: 'imageRotation', value: node.rotation(), side: 'front' }
        ]);

        // Recache the inner group after transformation
        if (itemImageGroupRef?.current) {
            try {
                itemImageGroupRef.current.cache();
            } catch (e) {
                console.warn('Failed to recache after transform', e);
            }
        }
    }, [updateBatchOffsets]);

    return {
        handleDragEnd,
        handleTransformEnd,
        handleImageDragEnd,
        handleImageTransformEnd
    };
}
