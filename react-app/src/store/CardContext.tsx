/**
 * Card Context Provider
 * React Context for global state management using useReducer
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, CardData, AppSettings } from '../types';
import type { StateAction } from './actions';
import { ActionType } from './actions';
import { stateReducer, getInitialState } from './reducer';

interface CardContextValue {
    state: AppState;
    dispatch: React.Dispatch<StateAction>;

    // Helper functions (equivalent to StateManager methods)
    setCardData: (data: CardData) => void;
    updateCardField: (path: string, value: any) => void;
    updateOffset: (key: string, value: number, side?: 'front' | 'back') => void;
    updateBatchOffsets: (updates: Array<{ key: string; value: number; side?: 'front' | 'back' }>) => void;
    updateFontSize: (key: string, change: number) => void;
    updateFontStyle: (key: string, value: boolean) => void;
    updateCustomStyle: (key: string, value: any, side?: 'front' | 'back') => void;
    updateStyle: (key: string, value: any) => void;
    resetToDefaults: () => void;
    setFlipped: (flipped: boolean) => void;
    setLastContext: (context: unknown) => void;
    setLastVisualPrompt: (prompt: string | null) => void;
    loadState: (cardData?: CardData, settings?: AppSettings) => void;
    toggleEditMode: () => void;

    // Persistence
    saveCurrentCard: () => void;
    loadCurrentCard: () => boolean;
}

const CardContext = createContext<CardContextValue | undefined>(undefined);

interface CardProviderProps {
    children: ReactNode;
}

export function CardProvider({ children }: CardProviderProps) {
    const [state, dispatch] = useReducer(stateReducer, getInitialState());

    // Helper functions
    const setCardData = useCallback((data: CardData) => {
        dispatch({ type: ActionType.SET_CARD_DATA, payload: data });
    }, []);

    const updateCardField = useCallback((path: string, value: any) => {
        dispatch({ type: ActionType.UPDATE_CARD_FIELD, payload: { path, value } });
    }, []);

    const updateOffset = useCallback((key: string, value: number, side?: 'front' | 'back') => {
        dispatch({ type: ActionType.UPDATE_OFFSET, payload: { key, value, side } });
    }, []);

    const updateBatchOffsets = useCallback((updates: Array<{ key: string; value: number; side?: 'front' | 'back' }>) => {
        dispatch({ type: ActionType.UPDATE_BATCH_OFFSETS, payload: updates });
    }, []);

    const updateFontSize = useCallback((key: string, change: number) => {
        dispatch({ type: ActionType.UPDATE_FONT_SIZE, payload: { key, change } });
    }, []);

    const updateFontStyle = useCallback((key: string, value: boolean) => {
        dispatch({ type: ActionType.UPDATE_FONT_STYLE, payload: { key, value } });
    }, []);

    const updateCustomStyle = useCallback((key: string, value: any, side?: 'front' | 'back') => {
        dispatch({ type: ActionType.UPDATE_CUSTOM_STYLE, payload: { key, value, side } });
    }, []);

    const updateStyle = useCallback((key: string, value: any) => {
        dispatch({ type: ActionType.UPDATE_STYLE, payload: { key, value } });
    }, []);

    const resetToDefaults = useCallback(() => {
        dispatch({ type: ActionType.RESET_TO_DEFAULTS });
    }, []);

    const setFlipped = useCallback((flipped: boolean) => {
        dispatch({ type: ActionType.SET_FLIPPED, payload: flipped });
    }, []);

    const setLastContext = useCallback((context: unknown) => {
        dispatch({ type: ActionType.SET_LAST_CONTEXT, payload: context });
    }, []);

    const setLastVisualPrompt = useCallback((prompt: string | null) => {
        dispatch({ type: ActionType.SET_LAST_VISUAL_PROMPT, payload: prompt });
    }, []);

    const loadState = useCallback((cardData?: CardData, settings?: AppSettings) => {
        dispatch({ type: ActionType.LOAD_STATE, payload: { cardData, settings } });
    }, []);

    const toggleEditMode = useCallback(() => {
        dispatch({ type: ActionType.TOGGLE_EDIT_MODE });
    }, []);

    // Save to localStorage whenever state changes
    const saveCurrentCard = useCallback(() => {
        if (!state.cardData) return;

        const saveData = {
            cardData: { ...state.cardData },
            settings: state.settings,
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem('dnd_current_card', JSON.stringify(saveData));
            console.log('💾 Card saved to localStorage');
        } catch (e: any) {
            if (e.name === 'QuotaExceededError') {
                console.warn('💾 localStorage quota exceeded, attempting cleanup...');

                // Clear image data
                if (saveData.cardData.front) saveData.cardData.front.imageUrl = null;
                if (saveData.cardData.imageUrl) saveData.cardData.imageUrl = null;

                try {
                    localStorage.setItem('dnd_current_card', JSON.stringify(saveData));
                    console.log('✅ Saved card without image data after cleanup');
                } catch (e2) {
                    console.warn('⚠️ Could not save current card even after cleanup (Storage full)');
                }
            }
        }
    }, [state.cardData, state.settings]);

    // Load from localStorage on mount
    const loadCurrentCard = useCallback(() => {
        try {
            const saved = localStorage.getItem('dnd_current_card');
            if (!saved) return false;

            const data = JSON.parse(saved);
            if (data.cardData) {
                // Clear blob URLs (they don't survive page refresh)
                if (data.cardData.imageUrl && data.cardData.imageUrl.startsWith('blob:')) {
                    data.cardData.imageUrl = null;
                }
                if (data.cardData.front?.imageUrl && data.cardData.front.imageUrl.startsWith('blob:')) {
                    data.cardData.front.imageUrl = null;
                }

                loadState(data.cardData, data.settings);
                console.log('📂 Card loaded from localStorage');
                return true;
            }
        } catch (e) {
            console.error('Failed to load card from localStorage:', e);
        }
        return false;
    }, [loadState]);

    // Auto-save on state changes
    useEffect(() => {
        if (state.cardData) {
            saveCurrentCard();
        }
    }, [state.cardData, state.settings, saveCurrentCard]);

    // Load saved card on mount
    useEffect(() => {
        loadCurrentCard();
    }, []);

    const value: CardContextValue = {
        state,
        dispatch,
        setCardData,
        updateCardField,
        updateOffset,
        updateBatchOffsets,
        updateFontSize,
        updateFontStyle,
        updateCustomStyle,
        updateStyle,
        resetToDefaults,
        setFlipped,
        setLastContext,
        setLastVisualPrompt,
        loadState,
        saveCurrentCard,
        loadCurrentCard,
        toggleEditMode
    };

    return <CardContext.Provider value={value}>{children}</CardContext.Provider>;
}

// Custom hook to use card context
export function useCardContext() {
    const context = useContext(CardContext);
    if (context === undefined) {
        throw new Error('useCardContext must be used within a CardProvider');
    }
    return context;
}

// Convenience hooks
export function useCardState() {
    const { state } = useCardContext();
    return state;
}

export function useCardData() {
    const { state } = useCardContext();
    return state.cardData;
}

export function useCardSettings() {
    const { state } = useCardContext();
    return state.settings;
}
