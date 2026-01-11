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
 */
export function migrateToV2(data: CardData): CardData {
    if (data.front && data.back) {
        return data; // Already V2
    }

    console.log("📦 Migrating Card Data to V2 (Double-Sided)...");

    // V1 -> V2 Migration
    return {
        id: data.id || Date.now(),
        timestamp: data.timestamp || Date.now(),
        front: {
            title: data.name || '',
            type: data.type || data.typeHe || '',
            rarity: data.rarity || data.rarityHe || '',
            imageUrl: data.imageUrl || null,
            imageStyle: data.imageStyle || 'natural',
            quickStats: data.quickStats || '',
            gold: data.gold || '',
            badges: data.gold ? [data.gold] : []
        },
        back: {
            title: data.abilityName || '',
            mechanics: data.abilityDesc || '',
            lore: data.description || ''
        },
        // Preserve weapon/armor stats at root
        weaponDamage: data.weaponDamage || '',
        damageType: data.damageType || '',
        armorClass: data.armorClass || '',
        versatileDamage: data.versatileDamage || null,
        weaponProperties: data.weaponProperties || [],
        legacy: true
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
export function stateReducer(state: AppState, action: StateAction): AppState {
    switch (action.type) {
        case ActionType.SET_CARD_DATA: {
            const migratedData = migrateToV2(action.payload);
            return {
                ...state,
                cardData: migratedData
            };
        }

        case ActionType.UPDATE_CARD_FIELD: {
            if (!state.cardData) return state;

            const { path, value } = action.payload;
            const newCardData = { ...state.cardData };

            // Handle dot notation for nested updates
            if (path.includes('.')) {
                const keys = path.split('.');
                let current: any = newCardData;

                // Traverse to parent
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) current[keys[i]] = {};
                    current = current[keys[i]];
                }

                // Set value
                current[keys[keys.length - 1]] = value;
            } else {
                // Flat key
                (newCardData as any)[path] = value;
            }

            return {
                ...state,
                cardData: newCardData
            };
        }

        case ActionType.UPDATE_OFFSET: {
            const { key, value } = action.payload;
            const side = action.payload.side || getSideForKey(key);

            return {
                ...state,
                settings: {
                    ...state.settings,
                    [side]: {
                        ...state.settings[side],
                        offsets: {
                            ...state.settings[side].offsets,
                            [key]: value
                        }
                    }
                }
            };
        }

        case ActionType.UPDATE_FONT_SIZE: {
            const { key, change } = action.payload;
            const side = getSideForFontSizeKey(key);
            const currentFontSizes = state.settings[side].fontSizes as any;
            const current = currentFontSizes?.[key] || 24;
            const rawSize = current + (change * 2);
            const newSize = clampFontSize(key, rawSize);

            return {
                ...state,
                settings: {
                    ...state.settings,
                    [side]: {
                        ...state.settings[side],
                        fontSizes: {
                            ...state.settings[side].fontSizes,
                            [key]: newSize
                        }
                    }
                }
            };
        }

        case ActionType.UPDATE_FONT_STYLE: {
            const { key, value } = action.payload;
            const side = getSideForFontStyleKey(key);

            return {
                ...state,
                settings: {
                    ...state.settings,
                    [side]: {
                        ...state.settings[side],
                        fontStyles: {
                            ...state.settings[side].fontStyles,
                            [key]: value
                        }
                    }
                }
            };
        }

        case ActionType.UPDATE_STYLE: {
            const { key, value } = action.payload;

            return {
                ...state,
                settings: {
                    ...state.settings,
                    style: {
                        ...state.settings.style,
                        [key]: value
                    }
                }
            };
        }

        case ActionType.RESET_TO_DEFAULTS: {
            return {
                ...state,
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
                    style: state.settings.style
                }
            };
        }

        case ActionType.SET_FLIPPED: {
            return {
                ...state,
                isFlipped: action.payload
            };
        }

        case ActionType.SET_LAST_CONTEXT: {
            return {
                ...state,
                lastContext: action.payload
            };
        }

        case ActionType.SET_LAST_VISUAL_PROMPT: {
            return {
                ...state,
                lastVisualPrompt: action.payload
            };
        }

        case ActionType.LOAD_STATE: {
            const { cardData, settings } = action.payload;
            return {
                ...state,
                cardData: cardData ? migrateToV2(cardData) : state.cardData,
                settings: settings ? {
                    ...state.settings,
                    ...settings,
                    front: {
                        ...state.settings.front,
                        ...(settings.front || {}),
                        offsets: { ...state.settings.front.offsets, ...(settings.front?.offsets || {}) },
                        fontSizes: { ...state.settings.front.fontSizes, ...(settings.front?.fontSizes || {}) },
                        fontStyles: { ...state.settings.front.fontStyles, ...(settings.front?.fontStyles || {}) }
                    },
                    back: {
                        ...state.settings.back,
                        ...(settings.back || {}),
                        offsets: { ...state.settings.back.offsets, ...(settings.back?.offsets || {}) },
                        fontSizes: { ...state.settings.back.fontSizes, ...(settings.back?.fontSizes || {}) },
                        fontStyles: { ...state.settings.back.fontStyles, ...(settings.back?.fontStyles || {}) },
                        customStyles: { ...state.settings.back.customStyles, ...(settings.back?.customStyles || {}) }
                    },
                    style: {
                        ...state.settings.style,
                        ...(settings.style || {})
                    }
                } : state.settings
            };
        }

        case ActionType.UPDATE_CUSTOM_STYLE: {
            const { key, value } = action.payload;
            const side = action.payload.side || getSideForKey(key);

            return {
                ...state,
                settings: {
                    ...state.settings,
                    [side]: {
                        ...state.settings[side],
                        customStyles: {
                            ...state.settings[side].customStyles,
                            [key]: value
                        }
                    }
                }
            };
        }

        case ActionType.TOGGLE_EDIT_MODE: {
            return {
                ...state,
                isEditMode: !state.isEditMode
            };
        }

        default:
            return state;
    }
}
