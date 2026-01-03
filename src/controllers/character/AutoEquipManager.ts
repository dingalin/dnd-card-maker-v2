// @ts-nocheck
/**
 * AutoEquipManager - Handles auto-generation and equipping of items
 * Manages progress UI and dispatches generation events
 *
 * Extracted from CharacterController.js for better code organization
 */

import i18n from '../../i18n.ts';
import { getSlotMapping } from './SlotMapping.ts';

/**
 * Show progress indicator for auto-equip
 * @param {string} message - Progress message to display
 */
export function showAutoEquipProgress(message: string) {
    const status = document.getElementById('auto-equip-status');
    const text = document.getElementById('auto-equip-progress-text');
    const btn = document.getElementById('auto-equip-btn') as HTMLButtonElement;

    if (status) status.classList.remove('hidden');
    if (text) text.textContent = message;
    if (btn) btn.disabled = true;
}

/**
 * Hide progress indicator for auto-equip
 */
export function hideAutoEquipProgress() {
    const status = document.getElementById('auto-equip-status');
    const btn = document.getElementById('auto-equip-btn') as HTMLButtonElement;

    if (status) status.classList.add('hidden');
    if (btn) btn.disabled = false;
}

/**
 * Get list of all empty equipment slots
 * @returns {string[]} Array of empty slot IDs
 */
export function getEmptySlots(): string[] {
    const emptySlots: string[] = [];
    const slots = document.querySelectorAll('.slot[data-slot]');

    slots.forEach(slot => {
        const slotId = (slot as HTMLElement).dataset.slot;
        const img = slot.querySelector('.equipped-item-icon') as HTMLImageElement;
        const hasImage = img && img.src && !img.src.includes('undefined');

        if (slotId && !hasImage) {
            emptySlots.push(slotId);
        }
    });

    return emptySlots;
}

/**
 * Wait for an item to be generated and equipped to a slot
 * @param {string} slotId - Slot ID to wait for
 * @param {number} timeout - Timeout in ms (default 60s)
 * @returns {Promise<void>}
 */
export function waitForItemGeneration(slotId: string, timeout = 60000): Promise<void> {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkSlot = setInterval(() => {
            const slot = document.querySelector(`.slot[data-slot="${slotId}"]`);
            const img = slot?.querySelector('.equipped-item-icon') as HTMLImageElement;

            // Check if item was equipped (has valid image)
            if (img && img.src && !img.src.includes('undefined') && img.complete) {
                clearInterval(checkSlot);
                resolve();
            }

            // Timeout check
            if (Date.now() - startTime > timeout) {
                clearInterval(checkSlot);
                // Don't reject, just resolve to prevent blocking other items
                console.warn(`Timeout waiting for ${slotId}, moving on.`);
                resolve();
            }
        }, 500);
    });
}

/**
 * Auto-generate and equip item for a single slot
 * @param {string} slotId - Slot to equip
 * @param {string} level - Level range (e.g. "1-4")
 * @param {string} complexityMode - "simple" or "creative"
 */
export async function autoEquipSlot(slotId: string, level = '1-4', complexityMode = 'simple') {
    const slotMapping = getSlotMapping();
    const config = slotMapping[slotId];

    if (!config) {
        console.warn(`No mapping found for slot: ${slotId}`);
        return;
    }

    const slotLabel = i18n.t(`characterSheet.${slotId.replace(/\d/g, '')}`) || config.label;

    // Only show full-screen progress if doing bulk update, otherwise maybe just spinner on button?
    // For now, we'll use the existing progress UI as it's simple
    showAutoEquipProgress(i18n.t('characterSidebar.autoEquipProgress', { slot: slotLabel }));

    try {
        // Dispatch custom event for generation
        const event = new CustomEvent('auto-equip-generate-item', {
            detail: {
                slotId,
                level,
                complexityMode,
                type: config.type,
                subtype: config.subtype || '',
                label: slotLabel
            }
        });
        document.dispatchEvent(event);

        // Wait for generation to complete
        await waitForItemGeneration(slotId);

    } catch (error) {
        console.error(`Error generating item for ${slotId}:`, error);
    } finally {
        hideAutoEquipProgress();
    }
}

/**
 * Auto-generate and equip items for all empty slots
 * @param {Function} getEmptySlotsFn - Function to get empty slots
 * @returns {Promise<void>}
 */
export async function autoEquipAllSlots(getEmptySlotsFn = getEmptySlots) {
    const emptySlots = getEmptySlotsFn();

    if (emptySlots.length === 0) {
        if ((window as any).uiManager) {
            (window as any).uiManager.showToast(i18n.t('characterSidebar.autoEquipNoEmpty'), 'info');
        }
        return;
    }

    // Get selected level
    const levelSelect = document.getElementById('auto-equip-level') as HTMLSelectElement;
    const level = levelSelect ? levelSelect.value : '1-4';

    // Get selected complexity mode (only applies to magical items)
    const complexitySelect = document.getElementById('auto-equip-complexity') as HTMLSelectElement;
    const complexityMode = complexitySelect ? complexitySelect.value : 'simple';

    console.log(`🎲 Auto-equip starting: ${emptySlots.length} empty slots, level: ${level}, complexity: ${complexityMode}`);

    // Generate items for each slot
    for (let i = 0; i < emptySlots.length; i++) {
        const slotId = emptySlots[i];

        // We call the logic directly instead of autoEquipSlot to avoid hiding progress after every item
        // or we need to adjust autoEquipSlot to not hide progress if batching.
        // Let's copy logic for batch preventing hideAutoEquipProgress inside the loop

        const slotMapping = getSlotMapping();
        const config = slotMapping[slotId];

        if (!config) continue;

        const slotLabel = i18n.t(`characterSheet.${slotId.replace(/\d/g, '')}`) || config.label;
        showAutoEquipProgress(i18n.t('characterSidebar.autoEquipProgress', { slot: slotLabel }));

        try {
            const event = new CustomEvent('auto-equip-generate-item', {
                detail: {
                    slotId,
                    level,
                    complexityMode,
                    type: config.type,
                    subtype: config.subtype || '',
                    label: slotLabel
                }
            });
            document.dispatchEvent(event);
            await waitForItemGeneration(slotId);
        } catch (error) {
            console.error(`Error generating item for ${slotId}:`, error);
        }
    }

    hideAutoEquipProgress();
    if ((window as any).uiManager) {
        (window as any).uiManager.showToast(i18n.t('characterSidebar.autoEquipComplete'), 'success');
    }
}

export default {
    showAutoEquipProgress,
    hideAutoEquipProgress,
    getEmptySlots,
    waitForItemGeneration,
    autoEquipAllSlots
};
