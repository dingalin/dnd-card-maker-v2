/**
 * Unit tests for state reducer
 */
import { describe, it, expect } from 'vitest';
import { stateReducer, getInitialState, migrateToV2 } from './reducer';
import { ActionType } from './actions';

describe('reducer', () => {
    describe('getInitialState', () => {
        it('should return a valid initial state', () => {
            const state = getInitialState();

            expect(state.cardData).toBeNull();
            expect(state.isFlipped).toBe(false);
            expect(state.isEditMode).toBe(false);
            expect(state.settings).toBeDefined();
            expect(state.settings.front).toBeDefined();
            expect(state.settings.back).toBeDefined();
            expect(state.settings.style).toBeDefined();
        });

        it('should have default font family as Heebo', () => {
            const state = getInitialState();
            expect(state.settings.style.fontFamily).toBe('Heebo');
        });
    });

    describe('migrateToV2', () => {
        it('should return V2 data unchanged', () => {
            const v2Data = {
                id: 123,
                front: { title: 'Test', type: 'Weapon', rarity: 'Common' },
                back: { title: 'Ability', mechanics: 'Effect', lore: 'Story' }
            };

            const result = migrateToV2(v2Data);
            expect(result.front).toBe(v2Data.front);
            expect(result.back).toBe(v2Data.back);
        });

        it('should migrate V1 flat data to V2 nested structure', () => {
            const v1Data = {
                name: 'Magic Sword',
                type: 'Weapon',
                rarity: 'Rare',
                abilityName: 'Flame Strike',
                abilityDesc: 'Deals fire damage',
                description: 'Forged in dragon fire'
            };

            const result = migrateToV2(v1Data);

            expect(result.front?.title).toBe('Magic Sword');
            expect(result.front?.type).toBe('Weapon');
            expect(result.front?.rarity).toBe('Rare');
            expect(result.back?.title).toBe('Flame Strike');
            expect(result.back?.mechanics).toBe('Deals fire damage');
            expect(result.back?.lore).toBe('Forged in dragon fire');
            expect(result.legacy).toBe(false);
        });
    });

    describe('SET_CARD_DATA', () => {
        it('should set card data and migrate to V2', () => {
            const state = getInitialState();
            const cardData = { name: 'Test Item', type: 'Weapon', rarity: 'Common' };

            const newState = stateReducer(state, {
                type: ActionType.SET_CARD_DATA,
                payload: cardData
            });

            expect(newState.cardData).not.toBeNull();
            expect(newState.cardData?.front?.title).toBe('Test Item');
        });
    });

    describe('UPDATE_CARD_FIELD', () => {
        it('should update a nested field using dot notation', () => {
            const state = getInitialState();
            state.cardData = {
                front: { title: 'Old Title', type: 'Weapon', rarity: 'Common' },
                back: { title: '', mechanics: '', lore: '' }
            };

            const newState = stateReducer(state, {
                type: ActionType.UPDATE_CARD_FIELD,
                payload: { path: 'front.title', value: 'New Title' }
            });

            expect(newState.cardData?.front?.title).toBe('New Title');
        });
    });

    describe('UPDATE_OFFSET', () => {
        it('should update front offset for front-side keys', () => {
            const state = getInitialState();

            const newState = stateReducer(state, {
                type: ActionType.UPDATE_OFFSET,
                payload: { key: 'title', value: 50, side: 'front' }
            });

            expect(newState.settings.front.offsets.title).toBe(50);
        });

        it('should update back offset for back-side keys', () => {
            const state = getInitialState();

            const newState = stateReducer(state, {
                type: ActionType.UPDATE_OFFSET,
                payload: { key: 'lore', value: 100, side: 'back' }
            });

            expect(newState.settings.back.offsets.lore).toBe(100);
        });
    });

    describe('SET_FLIPPED', () => {
        it('should toggle flip state', () => {
            const state = getInitialState();
            expect(state.isFlipped).toBe(false);

            const newState = stateReducer(state, {
                type: ActionType.SET_FLIPPED,
                payload: true
            });

            expect(newState.isFlipped).toBe(true);
        });
    });

    describe('TOGGLE_EDIT_MODE', () => {
        it('should toggle edit mode', () => {
            const state = getInitialState();
            expect(state.isEditMode).toBe(false);

            const newState = stateReducer(state, {
                type: ActionType.TOGGLE_EDIT_MODE
            });

            expect(newState.isEditMode).toBe(true);
        });
    });

    describe('UPDATE_CUSTOM_STYLE', () => {
        it('should update custom style for a specific key', () => {
            const state = getInitialState();

            const newState = stateReducer(state, {
                type: ActionType.UPDATE_CUSTOM_STYLE,
                payload: { key: 'title_fill', value: '#ff0000', side: 'front' }
            });

            expect(newState.settings.front.customStyles['title_fill']).toBe('#ff0000');
        });
    });
});
