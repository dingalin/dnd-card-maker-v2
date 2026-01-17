import { useState, useCallback } from 'react';
import {
    INITIAL_CHARACTER_STATE,
    EQUIPMENT_SLOTS,
    BACKPACK_SIZE
} from '../types/character';
import type {
    CharacterState,
    EquipmentSlotId,
    EquippedItem,
} from '../types/character';

export function useCharacterState() {
    const [state, setState] = useState<CharacterState>(INITIAL_CHARACTER_STATE);

    // Update character name
    const setName = useCallback((name: string) => {
        setState(prev => ({ ...prev, name }));
    }, []);

    // Update portrait URL
    const setPortraitUrl = useCallback((url: string | null) => {
        setState(prev => ({ ...prev, portraitUrl: url }));
    }, []);

    // Equip item to slot
    const equipItem = useCallback((slotId: EquipmentSlotId, item: EquippedItem | null) => {
        setState(prev => ({
            ...prev,
            equipment: {
                ...prev.equipment,
                [slotId]: item
            }
        }));
    }, []);

    // Unequip item from slot
    const unequipItem = useCallback((slotId: EquipmentSlotId) => {
        setState(prev => ({
            ...prev,
            equipment: {
                ...prev.equipment,
                [slotId]: null
            }
        }));
    }, []);

    // Add item to backpack
    const addToBackpack = useCallback((item: EquippedItem, slotIndex?: number) => {
        setState(prev => {
            const newBackpack = [...prev.backpack];

            if (slotIndex !== undefined && slotIndex >= 0 && slotIndex < BACKPACK_SIZE) {
                // Place in specific slot
                newBackpack[slotIndex] = item;
            } else {
                // Find first empty slot
                const emptyIndex = newBackpack.findIndex(slot => slot === null);
                if (emptyIndex !== -1) {
                    newBackpack[emptyIndex] = item;
                }
            }

            return { ...prev, backpack: newBackpack };
        });
    }, []);

    // Remove item from backpack
    const removeFromBackpack = useCallback((slotIndex: number) => {
        setState(prev => {
            const newBackpack = [...prev.backpack];
            newBackpack[slotIndex] = null;
            return { ...prev, backpack: newBackpack };
        });
    }, []);

    // Move item between backpack slots
    const moveInBackpack = useCallback((fromIndex: number, toIndex: number) => {
        setState(prev => {
            const newBackpack = [...prev.backpack];
            const temp = newBackpack[toIndex];
            newBackpack[toIndex] = newBackpack[fromIndex];
            newBackpack[fromIndex] = temp;
            return { ...prev, backpack: newBackpack };
        });
    }, []);

    // Move item from backpack to equipment
    const equipFromBackpack = useCallback((backpackIndex: number, slotId: EquipmentSlotId) => {
        setState(prev => {
            const item = prev.backpack[backpackIndex];
            if (!item) return prev;

            const existingEquip = prev.equipment[slotId];
            const newBackpack = [...prev.backpack];

            // Swap: put existing equipment in backpack
            newBackpack[backpackIndex] = existingEquip || null;

            return {
                ...prev,
                equipment: {
                    ...prev.equipment,
                    [slotId]: item
                },
                backpack: newBackpack
            };
        });
    }, []);

    // Move item from equipment to backpack
    const unequipToBackpack = useCallback((slotId: EquipmentSlotId, backpackIndex?: number) => {
        setState(prev => {
            const item = prev.equipment[slotId];
            if (!item) return prev;

            const newBackpack = [...prev.backpack];
            const targetIndex = backpackIndex ?? newBackpack.findIndex(slot => slot === null);

            if (targetIndex === -1) {
                // Backpack is full
                return prev;
            }

            newBackpack[targetIndex] = item;

            return {
                ...prev,
                equipment: {
                    ...prev.equipment,
                    [slotId]: null
                },
                backpack: newBackpack
            };
        });
    }, []);

    // Find natural slot for item type
    const findNaturalSlot = useCallback((itemType: string): EquipmentSlotId | null => {
        const typeL = itemType.toLowerCase();
        for (const slot of EQUIPMENT_SLOTS) {
            if (slot.acceptTypes.some(t => typeL.includes(t))) {
                return slot.id;
            }
        }
        return null;
    }, []);

    // Clear all equipment
    const clearAll = useCallback(() => {
        setState(INITIAL_CHARACTER_STATE);
    }, []);

    return {
        state,
        setName,
        setPortraitUrl,
        equipItem,
        unequipItem,
        addToBackpack,
        removeFromBackpack,
        moveInBackpack,
        equipFromBackpack,
        unequipToBackpack,
        findNaturalSlot,
        clearAll,
    };
}
