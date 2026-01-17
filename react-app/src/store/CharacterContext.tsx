import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { EquipmentSlotId, EquippedItem, CharacterState } from '../features/CharacterSheet/types/character';
import {
    INITIAL_CHARACTER_STATE,
    EQUIPMENT_SLOTS,
    BACKPACK_SIZE
} from '../features/CharacterSheet/types/character';

const STORAGE_KEY = 'dnd_character_sheet_state';

// Context type
interface CharacterContextType {
    state: CharacterState;
    setName: (name: string) => void;
    setPortraitUrl: (url: string | null) => void;
    equipItem: (slotId: EquipmentSlotId, item: EquippedItem | null) => void;
    addToBackpack: (item: EquippedItem) => boolean;
    removeFromBackpack: (index: number) => void;
    equipFromBackpack: (backpackIndex: number, slotId: EquipmentSlotId) => void;
    unequipToBackpack: (slotId: EquipmentSlotId, backpackIndex?: number) => void;
    moveInBackpack: (fromIndex: number, toIndex: number) => void;
    unequipItem: (slotId: EquipmentSlotId) => void;
    findNaturalSlot: (itemType: string) => EquipmentSlotId | null;
    isSlotOccupied: (slotId: EquipmentSlotId) => boolean;
    getSlotItem: (slotId: EquipmentSlotId) => EquippedItem | null;
    clearAll: () => void;
}

const CharacterContext = createContext<CharacterContextType | null>(null);

// Provider component
export function CharacterProvider({ children }: { children: ReactNode }) {
    // Load initial state from localStorage
    const getInitialState = (): CharacterState => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Ensure backpack array exists and has correct length
                if (!parsed.backpack || !Array.isArray(parsed.backpack)) {
                    parsed.backpack = Array(BACKPACK_SIZE).fill(null);
                }
                return parsed;
            }
        } catch (e) {
            console.warn('Failed to load character state from localStorage', e);
        }
        return INITIAL_CHARACTER_STATE;
    };

    const [state, setState] = useState<CharacterState>(getInitialState);

    // Save to localStorage on state change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                console.warn('📦 localStorage quota exceeded for character state');
            }
        }
    }, [state]);

    const setName = useCallback((name: string) => {
        setState(prev => ({ ...prev, name }));
    }, []);

    const setPortraitUrl = useCallback((url: string | null) => {
        setState(prev => ({ ...prev, portraitUrl: url }));
    }, []);

    const equipItem = useCallback((slotId: EquipmentSlotId, item: EquippedItem | null) => {
        setState(prev => ({
            ...prev,
            equipment: { ...prev.equipment, [slotId]: item }
        }));
    }, []);

    const addToBackpack = useCallback((item: EquippedItem): boolean => {
        let success = false;
        setState(prev => {
            const newBackpack = [...prev.backpack];
            const emptyIndex = newBackpack.findIndex(slot => slot === null);
            if (emptyIndex !== -1) {
                newBackpack[emptyIndex] = item;
                success = true;
                return { ...prev, backpack: newBackpack };
            }
            return prev;
        });
        return success;
    }, []);

    const removeFromBackpack = useCallback((index: number) => {
        setState(prev => {
            const newBackpack = [...prev.backpack];
            newBackpack[index] = null;
            return { ...prev, backpack: newBackpack };
        });
    }, []);

    const equipFromBackpack = useCallback((backpackIndex: number, slotId: EquipmentSlotId) => {
        setState(prev => {
            const item = prev.backpack[backpackIndex];
            if (!item) return prev;
            const existingEquip = prev.equipment[slotId];
            const newBackpack = [...prev.backpack];
            newBackpack[backpackIndex] = existingEquip || null;
            return {
                ...prev,
                equipment: { ...prev.equipment, [slotId]: item },
                backpack: newBackpack
            };
        });
    }, []);

    const unequipToBackpack = useCallback((slotId: EquipmentSlotId, backpackIndex?: number) => {
        setState(prev => {
            const item = prev.equipment[slotId];
            if (!item) return prev;
            const newBackpack = [...prev.backpack];
            const targetIndex = backpackIndex ?? newBackpack.findIndex(slot => slot === null);
            if (targetIndex === -1) return prev;
            newBackpack[targetIndex] = item;
            return {
                ...prev,
                equipment: { ...prev.equipment, [slotId]: null },
                backpack: newBackpack
            };
        });
    }, []);

    const moveInBackpack = useCallback((fromIndex: number, toIndex: number) => {
        setState(prev => {
            const newBackpack = [...prev.backpack];
            const temp = newBackpack[toIndex];
            newBackpack[toIndex] = newBackpack[fromIndex];
            newBackpack[fromIndex] = temp;
            return { ...prev, backpack: newBackpack };
        });
    }, []);

    const unequipItem = useCallback((slotId: EquipmentSlotId) => {
        setState(prev => ({
            ...prev,
            equipment: { ...prev.equipment, [slotId]: null }
        }));
    }, []);

    const findNaturalSlot = useCallback((itemType: string): EquipmentSlotId | null => {
        const typeL = itemType.toLowerCase();
        for (const slot of EQUIPMENT_SLOTS) {
            if (slot.acceptTypes.some(t => typeL.includes(t))) {
                return slot.id;
            }
        }
        return null;
    }, []);

    const isSlotOccupied = useCallback((slotId: EquipmentSlotId): boolean => {
        return !!state.equipment[slotId];
    }, [state.equipment]);

    const getSlotItem = useCallback((slotId: EquipmentSlotId): EquippedItem | null => {
        return state.equipment[slotId] || null;
    }, [state.equipment]);

    const clearAll = useCallback(() => {
        setState(INITIAL_CHARACTER_STATE);
    }, []);

    return (
        <CharacterContext.Provider value={{
            state,
            setName,
            setPortraitUrl,
            equipItem,
            addToBackpack,
            removeFromBackpack,
            equipFromBackpack,
            unequipToBackpack,
            moveInBackpack,
            unequipItem,
            findNaturalSlot,
            isSlotOccupied,
            getSlotItem,
            clearAll,
        }}>
            {children}
        </CharacterContext.Provider>
    );
}

// Hook to use character context
export function useCharacter() {
    const context = useContext(CharacterContext);
    if (!context) {
        throw new Error('useCharacter must be used within a CharacterProvider');
    }
    return context;
}

// Special hook for adding items from Card Creator
export function useAddToCharacter() {
    const context = useContext(CharacterContext);

    const addCard = useCallback((cardData: {
        name: string;
        nameHe?: string;
        type: string;
        rarity: string;
        thumbnailUrl: string;
    }): boolean => {
        if (!context) return false;

        const item: EquippedItem = {
            uniqueId: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: cardData.name,
            nameHe: cardData.nameHe,
            type: cardData.type,
            rarity: cardData.rarity,
            thumbnail: cardData.thumbnailUrl,
        };

        return context.addToBackpack(item);
    }, [context]);

    return { addCard, isAvailable: !!context };
}
