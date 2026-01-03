// @ts-nocheck
/**
 * Character Controller Modules - Central export point
 *
 * Provides modular components for the character sheet system:
 * - SlotMapping: Equipment slot configurations
 * - AutoEquipManager: Auto-generate and equip items
 */

export {
    SLOT_CONFIG,
    getAllSlotIds,
    pickRandomSubtype,
    getSlotMapping,
    getTargetSlotsForCard
} from './SlotMapping.ts';

export {
    showAutoEquipProgress,
    hideAutoEquipProgress,
    getEmptySlots,
    waitForItemGeneration,
    autoEquipAllSlots
} from './AutoEquipManager.ts';
