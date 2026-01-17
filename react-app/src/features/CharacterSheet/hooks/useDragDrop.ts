import { useState, useCallback } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { EquipmentSlotId, EquippedItem } from '../types/character';

export type DragItemType = 'equipment' | 'backpack';

export interface DragData {
    type: DragItemType;
    sourceId: string; // slot id for equipment, index for backpack
    item: EquippedItem;
}

interface UseDragDropReturn {
    activeItem: DragData | null;
    handleDragStart: (event: DragStartEvent) => void;
    handleDragEnd: (event: DragEndEvent, handlers: DragHandlers) => void;
}

export interface DragHandlers {
    onEquipFromBackpack: (backpackIndex: number, slotId: EquipmentSlotId) => void;
    onUnequipToBackpack: (slotId: EquipmentSlotId, backpackIndex: number) => void;
    onMoveInBackpack: (fromIndex: number, toIndex: number) => void;
    onSwapEquipment: (fromSlot: EquipmentSlotId, toSlot: EquipmentSlotId) => void;
}

export function useDragDrop(): UseDragDropReturn {
    const [activeItem, setActiveItem] = useState<DragData | null>(null);

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current as DragData | undefined;

        if (data) {
            setActiveItem(data);
        }
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent, handlers: DragHandlers) => {
        const { active, over } = event;

        setActiveItem(null);

        if (!over || !active.data.current) return;

        const activeData = active.data.current as DragData;
        const overId = over.id as string;

        // Parse the drop target
        const isEquipmentTarget = overId.startsWith('equipment-');
        const isBackpackTarget = overId.startsWith('backpack-');

        if (!isEquipmentTarget && !isBackpackTarget) return;

        const targetId = overId.replace('equipment-', '').replace('backpack-', '');

        // Determine action based on source and target
        if (activeData.type === 'backpack' && isEquipmentTarget) {
            // Backpack -> Equipment slot
            const backpackIndex = parseInt(activeData.sourceId);
            handlers.onEquipFromBackpack(backpackIndex, targetId as EquipmentSlotId);
        }
        else if (activeData.type === 'equipment' && isBackpackTarget) {
            // Equipment -> Backpack
            const backpackIndex = parseInt(targetId);
            handlers.onUnequipToBackpack(activeData.sourceId as EquipmentSlotId, backpackIndex);
        }
        else if (activeData.type === 'backpack' && isBackpackTarget) {
            // Backpack -> Backpack (reorder)
            const fromIndex = parseInt(activeData.sourceId);
            const toIndex = parseInt(targetId);
            if (fromIndex !== toIndex) {
                handlers.onMoveInBackpack(fromIndex, toIndex);
            }
        }
        else if (activeData.type === 'equipment' && isEquipmentTarget) {
            // Equipment -> Equipment (swap)
            const fromSlot = activeData.sourceId as EquipmentSlotId;
            const toSlot = targetId as EquipmentSlotId;
            if (fromSlot !== toSlot) {
                handlers.onSwapEquipment(fromSlot, toSlot);
            }
        }
    }, []);

    return {
        activeItem,
        handleDragStart,
        handleDragEnd,
    };
}
