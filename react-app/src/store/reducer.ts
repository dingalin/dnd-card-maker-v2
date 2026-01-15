/**
 * State Reducer
 * Handles all state updates using the reducer pattern
 */

import type { AppState, CardData } from '../types';
import type { StateAction } from './actions';
import { ActionType } from './actions';
import { SLIDER_DEFAULTS } from '../utils/config/layout/SliderDefaults';
import { clampFontSize } from '../utils/config/layout/FontSizeLimitsFixed';

/**
 * Migrate data to V2 structure (Front/Back)
 * Also ensures critical root-level fields are always present
 */
export function migrateToV2(data: CardData): CardData {
    // Even if already V2, return as is (strict mode)
    if (data.front && data.back) {
        return data;
    }

    // V1 -> V2 Migration (for legacy saves or Gemini API results)
    return {
        id: data.id || Date.now(),
        timestamp: data.timestamp || Date.now(),
        front: {
            title: data.name || data.front?.title || '',
            type: data.type || data.typeHe || data.front?.type || '',
            rarity: data.rarity || data.rarityHe || data.front?.rarity || '',
            imageUrl: data.imageUrl || data.itemImageUrl || null,
            imageStyle: data.imageStyle || 'natural',
            quickStats: data.quickStats || data.front?.quickStats || '',
            gold: data.gold || data.front?.gold || '',
            badges: data.gold ? [data.gold] : []
        },
        back: {
            title: data.abilityName || data.back?.title || '',
            mechanics: data.abilityDesc || data.back?.mechanics || '',
            lore: data.description || data.back?.lore || ''
        },
        // Valid Metadata (Non-deprecated)
        visualPrompt: data.visualPrompt || '',
        imageStyle: data.imageStyle || 'natural',

        // Mark as migrated
        legacy: false
    };
}

/**
 * Determine which side (front/back) an offset key belongs to
 */
function getSideForKey(key: string): 'front' | 'back' {
    const backKeys = ['abilityName', 'mech', 'lore', 'mechWidth', 'loreWidth'];
    if (backKeys.includes(key)) return 'back';
    return 'front';
}

/**
 * Determine which side a font size key belongs to
 */
function getSideForFontSizeKey(key: string): 'front' | 'back' {
    const backKeys = ['abilityNameSize', 'mechSize', 'loreSize'];
    if (backKeys.includes(key)) return 'back';
    return 'front';
}

/**
 * Determine which side a font style key belongs to
 */
function getSideForFontStyleKey(key: string): 'front' | 'back' {
    const backPrefixes = ['abilityName', 'mech', 'lore'];
    for (const prefix of backPrefixes) {
        if (key.startsWith(prefix)) return 'back';
    }
    return 'front';
}

/**
 * Initialize default state
 */
export function getInitialState(): AppState {
    return {
        cardData: null,
        isFlipped: false,
        isEditMode: false,
        settings: {
            front: {
                fontSizes: { ...SLIDER_DEFAULTS.front.fontSizes },
                offsets: { ...SLIDER_DEFAULTS.front.offsets },
                fontStyles: { ...SLIDER_DEFAULTS.front.fontStyles },
                customStyles: {}
            },
            back: {
                fontSizes: { ...SLIDER_DEFAULTS.back.fontSizes },
                offsets: { ...SLIDER_DEFAULTS.back.offsets },
                fontStyles: { ...SLIDER_DEFAULTS.back.fontStyles },
                customStyles: {}
            },
            style: {
                fontFamily: 'Heebo',
                imageStyle: 'natural',
                imageColor: '#ffffff',
                textOutlineEnabled: false,
                textOutlineWidth: 2,
                textShadowEnabled: false,
                textShadowBlur: 4,
                textBackdropEnabled: false,
                textBackdropOpacity: 40
            }
        },
        lastContext: null,
        lastVisualPrompt: null
    };
}

/**
 * Main state reducer
 */
import { produce } from 'immer';

/**
 * Main state reducer
 */
export function stateReducer(state: AppState, action: StateAction): AppState {
    return produce(state, (draft) => {
        switch (action.type) {
            case ActionType.SET_CARD_DATA: {
                draft.cardData = migrateToV2(action.payload);
                break;
            }

            case ActionType.UPDATE_CARD_FIELD: {
                if (!draft.cardData) return;

                const { path, value } = action.payload;

                // Handle dot notation for nested updates
                if (path.includes('.')) {
                    const keys = path.split('.');
                    let current: any = draft.cardData;

                    // Traverse to parent
                    for (let i = 0; i < keys.length - 1; i++) {
                        if (!current[keys[i]]) current[keys[i]] = {};
                        current = current[keys[i]];
                    }

                    // Set value
                    current[keys[keys.length - 1]] = value;
                } else {
                    // Flat key
                    (draft.cardData as any)[path] = value;
                }
                break;
            }

            case ActionType.UPDATE_OFFSET: {
                const { key, value } = action.payload;
                const side = action.payload.side || getSideForKey(key);

                // Ensure helper works or define fallback if side is missing
                if (side) {
                    draft.settings[side].offsets[key] = value;
                }
                break;
            }

            case ActionType.UPDATE_BATCH_OFFSETS: {
                const updates = action.payload;
                updates.forEach(({ key, value, side: sideOverride }) => {
                    const side = sideOverride || getSideForKey(key);
                    if (side) {
                        draft.settings[side].offsets[key] = value;
                    }
                });
                break;
            }

            case ActionType.UPDATE_FONT_SIZE: {
                const { key, change } = action.payload;
                const side = getSideForFontSizeKey(key);

                // Safely access current size
                const currentFontSizes = draft.settings[side].fontSizes as Record<string, number>;
                const current = currentFontSizes[key] || 24;
                const rawSize = current + (change * 2);

                currentFontSizes[key] = clampFontSize(key, rawSize);
                break;
            }

            case ActionType.UPDATE_FONT_STYLE: {
                const { key, value } = action.payload;
                const side = getSideForFontStyleKey(key);

                draft.settings[side].fontStyles[key] = value;
                break;
            }

            case ActionType.UPDATE_STYLE: {
                const { key, value } = action.payload;
                // @ts-ignore - Dynamic key access on defined type is tricky without index signature
                draft.settings.style[key] = value;
                break;
            }

            case ActionType.RESET_TO_DEFAULTS: {
                const userDefaults = action.payload; // Optional payload

                if (userDefaults) {
                    // Use user defaults but ensure structure matches
                    draft.settings = {
                        front: {
                            ...SLIDER_DEFAULTS.front,
                            ...(userDefaults.front || {}),
                            customStyles: userDefaults.front?.customStyles || {}
                        },
                        back: {
                            ...SLIDER_DEFAULTS.back,
                            ...(userDefaults.back || {}),
                            customStyles: userDefaults.back?.customStyles || {}
                        },
                        style: { ...state.settings.style, ...(userDefaults.style || {}) }
                    };

                    // Deep merge for safety on nested objects
                    if (userDefaults.front?.offsets) Object.assign(draft.settings.front.offsets, userDefaults.front.offsets);
                    if (userDefaults.front?.fontSizes) Object.assign(draft.settings.front.fontSizes, userDefaults.front.fontSizes);
                    if (userDefaults.front?.fontStyles) Object.assign(draft.settings.front.fontStyles, userDefaults.front.fontStyles);
                    if (userDefaults.front?.customStyles) Object.assign(draft.settings.front.customStyles, userDefaults.front.customStyles);

                    if (userDefaults.back?.offsets) Object.assign(draft.settings.back.offsets, userDefaults.back.offsets);
                    if (userDefaults.back?.fontSizes) Object.assign(draft.settings.back.fontSizes, userDefaults.back.fontSizes);
                    if (userDefaults.back?.fontStyles) Object.assign(draft.settings.back.fontStyles, userDefaults.back.fontStyles);
                    if (userDefaults.back?.customStyles) Object.assign(draft.settings.back.customStyles, userDefaults.back.customStyles);

                } else {
                    // System Defaults
                    draft.settings = {
                        front: {
                            fontSizes: { ...SLIDER_DEFAULTS.front.fontSizes },
                            offsets: { ...SLIDER_DEFAULTS.front.offsets },
                            fontStyles: { ...SLIDER_DEFAULTS.front.fontStyles },
                            customStyles: {}
                        },
                        back: {
                            fontSizes: { ...SLIDER_DEFAULTS.back.fontSizes },
                            offsets: { ...SLIDER_DEFAULTS.back.offsets },
                            fontStyles: { ...SLIDER_DEFAULTS.back.fontStyles },
                            customStyles: {}
                        },
                        style: state.settings.style
                    };
                }
                break;
            }

            case ActionType.SET_FLIPPED: {
                draft.isFlipped = action.payload;
                break;
            }

            case ActionType.SET_LAST_CONTEXT: {
                draft.lastContext = action.payload;
                break;
            }

            case ActionType.SET_LAST_VISUAL_PROMPT: {
                draft.lastVisualPrompt = action.payload;
                break;
            }

            case ActionType.LOAD_STATE: {
                const { cardData, settings } = action.payload;

                if (cardData) {
                    draft.cardData = migrateToV2(cardData);
                }

                if (settings) {
                    // Deep merge settings
                    if (settings.front) {
                        Object.assign(draft.settings.front.offsets, settings.front.offsets);
                        Object.assign(draft.settings.front.fontSizes, settings.front.fontSizes);
                        Object.assign(draft.settings.front.fontStyles, settings.front.fontStyles);
                        Object.assign(draft.settings.front.customStyles, settings.front.customStyles);
                    }
                    if (settings.back) {
                        Object.assign(draft.settings.back.offsets, settings.back.offsets);
                        Object.assign(draft.settings.back.fontSizes, settings.back.fontSizes);
                        Object.assign(draft.settings.back.fontStyles, settings.back.fontStyles);
                        Object.assign(draft.settings.back.customStyles, settings.back.customStyles);
                    }
                    if (settings.style) {
                        Object.assign(draft.settings.style, settings.style);
                    }
                }
                break;
            }

            case ActionType.UPDATE_CUSTOM_STYLE: {
                const { key, value } = action.payload;
                const side = action.payload.side || getSideForKey(key);

                draft.settings[side].customStyles[key] = value;
                break;
            }

            case ActionType.TOGGLE_EDIT_MODE: {
                draft.isEditMode = !draft.isEditMode;
                break;
            }
        }
    });
}
