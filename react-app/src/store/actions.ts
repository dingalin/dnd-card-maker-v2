/**
 * State Action Types
 * Defines all possible actions for the state reducer
 */

import type { CardData, AppSettings } from '../types';

// Action Types
export const ActionType = {
    SET_CARD_DATA: 'SET_CARD_DATA',
    UPDATE_CARD_FIELD: 'UPDATE_CARD_FIELD',
    UPDATE_OFFSET: 'UPDATE_OFFSET',
    UPDATE_FONT_SIZE: 'UPDATE_FONT_SIZE',
    UPDATE_FONT_STYLE: 'UPDATE_FONT_STYLE',
    UPDATE_STYLE: 'UPDATE_STYLE',
    UPDATE_CUSTOM_STYLE: 'UPDATE_CUSTOM_STYLE',
    RESET_TO_DEFAULTS: 'RESET_TO_DEFAULTS',
    SET_FLIPPED: 'SET_FLIPPED',
    SET_LAST_CONTEXT: 'SET_LAST_CONTEXT',
    SET_LAST_VISUAL_PROMPT: 'SET_LAST_VISUAL_PROMPT',
    LOAD_STATE: 'LOAD_STATE',
    TOGGLE_EDIT_MODE: 'TOGGLE_EDIT_MODE',
} as const;

export type StateAction =
    | { type: typeof ActionType.SET_CARD_DATA; payload: CardData }
    | { type: typeof ActionType.UPDATE_CARD_FIELD; payload: { path: string; value: any } }
    | { type: typeof ActionType.UPDATE_OFFSET; payload: { key: string; value: number; side?: 'front' | 'back' } }
    | { type: typeof ActionType.UPDATE_FONT_SIZE; payload: { key: string; change: number } }
    | { type: typeof ActionType.UPDATE_FONT_STYLE; payload: { key: string; value: boolean } }
    | { type: typeof ActionType.UPDATE_STYLE; payload: { key: string; value: any } }
    | { type: typeof ActionType.UPDATE_CUSTOM_STYLE; payload: { key: string; value: any; side?: 'front' | 'back' } }
    | { type: typeof ActionType.RESET_TO_DEFAULTS }
    | { type: typeof ActionType.SET_FLIPPED; payload: boolean }
    | { type: typeof ActionType.SET_LAST_CONTEXT; payload: unknown }
    | { type: typeof ActionType.SET_LAST_VISUAL_PROMPT; payload: string | null }
    | { type: typeof ActionType.LOAD_STATE; payload: { cardData?: CardData; settings?: AppSettings } }
    | { type: typeof ActionType.TOGGLE_EDIT_MODE };
