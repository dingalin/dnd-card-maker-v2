// @ts-nocheck
import i18n from '../../i18n.ts';
import { getTargetSlotsForCard } from './SlotMapping.ts';
import { autoEquipAllSlots, autoEquipSlot } from './AutoEquipManager.ts';

interface DragData {
    element: HTMLElement;
    sourceType: string;
    sourceId: string;
    uniqueId: string;
    itemName: string;
    imageSrc: string;
}

interface WindowGlobals {
    uiManager?: any;
    cardViewerService?: any;
}

/**
 * CharacterEquipmentManager - Handles inventory, equipment slots, and drag & drop
 */
export class CharacterEquipmentManager {
    public controller: any;
    public itemRegistry: Map<string, any>;
    public backpackItems: Map<string, any>;
    public draggedItem: DragData | null;

    constructor(controller: any, itemRegistry: any, backpackItems: any) {
        this.controller = controller;
        this.itemRegistry = itemRegistry;     // Shared registry from Controller
        this.backpackItems = backpackItems;   // Shared backpack from Controller
        this.draggedItem = null;
    }

    /**
     * Initialize the backpack UI
     */
    initBackpack() {
        console.log('🎒 Initializing backpack system...');

        // Add click handlers for backpack slots (for viewing items)
        const backpackGrid = document.querySelector('.backpack-grid');
        if (backpackGrid) {
            backpackGrid.addEventListener('click', (e) => this.handleBackpackSlotClick(e));
        }

        // Setup equipment slot actions (auto-generate buttons)
        this.setupSlotActions();
    }

    /**
     * Setup actions for equipment slots (e.g. auto-generate button)
     */
    setupSlotActions() {
        document.querySelectorAll('.auto-gen-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAutoGenerateClick(e));
        });
    }

    /**
     * Handle click on auto-generate button
     */
    handleAutoGenerateClick(e: Event) {
        e.stopPropagation();
        const target = e.target as HTMLElement;
        const slot = target.closest('.slot') as HTMLElement;
        if (!slot) return;

        const slotId = slot.dataset.slot;
        if (!slotId) return;

        // Get Level and Complexity from sidebar if available, or default
        const levelSelect = document.getElementById('auto-equip-level') as HTMLSelectElement;
        const level = levelSelect ? levelSelect.value : '1-4';

        const complexitySelect = document.getElementById('auto-equip-complexity') as HTMLSelectElement;
        const complexity = complexitySelect ? complexitySelect.value : 'simple';

        console.log(`🎲 Manual auto-gen request for ${slotId}`);
        autoEquipSlot(slotId, level, complexity);
    }

    /**
     * Trigger auto-equip for all empty slots
     */
    async autoEquipAllSlots() {
        await autoEquipAllSlots();
    }

    /**
     * Setup drag & drop for all slots (equipment and backpack)
     */
    setupDragDrop() {
        console.log('🎒 Setting up drag & drop...');

        // Make all equipped item images draggable
        this.makeDraggable('.equipment-grid .equipped-item-icon');
        this.makeDraggable('.backpack-grid .backpack-item-icon');

        // Setup drop zones for all slots
        this.setupDropZones('.slot[data-slot]');           // Equipment slots
        this.setupDropZones('.backpack-slot[data-backpack-slot]');  // Backpack slots

        // Setup equipment grid as a drop zone for auto-slotting from backpack
        this.setupEquipmentGridDrop();

        // Listen for new items being equipped to make them draggable
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        const el = node as HTMLElement;
                        if (el.classList?.contains('equipped-item-icon') ||
                            el.classList?.contains('backpack-item-icon')) {
                            this.makeElementDraggable(el);
                        }
                        // Check for img inside added nodes
                        if (el.querySelector) {
                            const imgs = el.querySelectorAll('.equipped-item-icon, .backpack-item-icon');
                            imgs.forEach(img => this.makeElementDraggable(img as HTMLElement));
                        }
                    });
                }
            });
        });

        const sheetContainer = document.querySelector('.character-sheet-container');
        if (sheetContainer) {
            observer.observe(sheetContainer, { childList: true, subtree: true });
        }
    }

    /**
     * Setup equipment grid as drop zone for auto-slot detection
     */
    setupEquipmentGridDrop() {
        const grid = document.querySelector('.equipment-grid') as HTMLElement;
        if (!grid || grid.dataset.gridDropSetup) return;
        grid.dataset.gridDropSetup = 'true';

        grid.addEventListener('dragover', (e) => {
            // Only handle if dragging from backpack
            if (this.draggedItem && this.draggedItem.sourceType === 'backpack') {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
            }
        });

        grid.addEventListener('drop', (e) => {
            // Only handle if the drop target is the grid itself (not a slot)
            const target = e.target as HTMLElement;
            if (target !== grid && !target.classList.contains('equipment-grid')) return;
            if (!this.draggedItem || this.draggedItem.sourceType !== 'backpack') return;

            e.preventDefault();
            this.handleAutoSlotFromBackpack(this.draggedItem);
        });
    }

    /**
     * Auto-detect natural slot when dragging from backpack to equipment grid
     */
    handleAutoSlotFromBackpack(dragData: DragData) {
        console.log('🎒 Auto-slotting from backpack:', dragData);

        // Get card data from registry
        const cardData = this.itemRegistry.get(dragData.uniqueId);
        if (!cardData) {
            console.warn('Card data not found for auto-slot:', dragData.uniqueId);
            return;
        }

        // Use the helper to find natural slot
        const result = getTargetSlotsForCard(cardData);
        // Note: getTargetSlotsForCard returns array of strings ['mainhand', 'offhand']
        // We need to support the logic: slots[0] is primary, maybe checking for others?
        // The previous logic assumed result.slots and result.altSlot.
        // Let's adapt to what getTargetSlotsForCard returns.

        // Use a local helper or adapting logic
        const slots = result || [];

        if (slots.length === 0) {
            if ((window as any).uiManager) {
                (window as any).uiManager.showToast(i18n.t('character.noSlotFound') || 'לא נמצא מקום מתאים', 'warning');
            }
            return;
        }

        let targetSlotId = slots[0];
        let targetSlot = document.querySelector(`.slot[data-slot="${targetSlotId}"]`);

        // Check if primary slot is occupied and we have an alternate
        if (targetSlot) {
            const targetContent = targetSlot.querySelector('.slot-content');
            const existingImg = targetContent?.querySelector('img');

            if (existingImg && slots.length > 1) {
                // Primary is full, try alternate
                const altSlotId = slots[1];
                const altSlot = document.querySelector(`.slot[data-slot="${altSlotId}"]`);
                const altContent = altSlot?.querySelector('.slot-content');
                const altExisting = altContent?.querySelector('img');

                if (!altExisting) {
                    // Alt slot is empty - use it
                    targetSlotId = altSlotId;
                    targetSlot = altSlot;
                }
            }
        }

        if (!targetSlot) {
            if ((window as any).uiManager) {
                (window as any).uiManager.showToast(i18n.t('character.noSlotFound') || 'לא נמצא מקום מתאים', 'warning');
            }
            return;
        }

        // Now handle the drop on the target slot
        this.handleDropOnEquipment(targetSlot as HTMLElement, dragData);
    }

    /**
     * Make existing elements draggable
     */
    makeDraggable(selector: string) {
        document.querySelectorAll(selector).forEach(el => {
            this.makeElementDraggable(el as HTMLElement);
        });
    }

    /**
     * Make a single element draggable
     */
    makeElementDraggable(el: HTMLElement) {
        if (el.dataset.draggableSetup) return; // Already setup
        el.dataset.draggableSetup = 'true';
        el.draggable = true;

        el.addEventListener('dragstart', (e) => {
            console.log('🎒 Drag started');
            e.stopPropagation();

            // Get slot info
            const equipmentSlot = el.closest('.slot[data-slot]') as HTMLElement;
            const backpackSlot = el.closest('.backpack-slot[data-backpack-slot]') as HTMLElement;

            let sourceType = '', sourceId = '';
            if (equipmentSlot) {
                sourceType = 'equipment';
                sourceId = equipmentSlot.dataset.slot || '';
            } else if (backpackSlot) {
                sourceType = 'backpack';
                sourceId = backpackSlot.dataset.backpackSlot || '';
            }

            // Store drag data
            this.draggedItem = {
                element: el,
                sourceType,
                sourceId,
                uniqueId: el.dataset.uniqueId || '',
                itemName: el.dataset.itemName || '',
                imageSrc: (el as HTMLImageElement).src
            };

            el.classList.add('dragging');

            // Set drag image
            e.dataTransfer!.effectAllowed = 'move';
            e.dataTransfer!.setData('text/plain', JSON.stringify({
                sourceType,
                sourceId,
                uniqueId: el.dataset.uniqueId
            }));
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
            this.draggedItem = null;
            // Remove all drag-over states
            document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
        });
    }

    /**
     * Setup drop zones
     */
    setupDropZones(selector: string) {
        document.querySelectorAll(selector).forEach(slotNode => {
            const slot = slotNode as HTMLElement;
            if (slot.dataset.dropSetup) return;
            slot.dataset.dropSetup = 'true';

            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer!.dropEffect = 'move';
                slot.classList.add('drag-over');
            });

            slot.addEventListener('dragleave', (e) => {
                // Only remove if actually leaving the slot (not entering child)
                if (!slot.contains(e.relatedTarget as Node)) {
                    slot.classList.remove('drag-over');
                }
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');

                if (!this.draggedItem) return;

                const isEquipmentSlot = slot.dataset.slot !== undefined;
                const isBackpackSlot = slot.dataset.backpackSlot !== undefined;

                if (isEquipmentSlot) {
                    this.handleDropOnEquipment(slot, this.draggedItem);
                } else if (isBackpackSlot) {
                    this.handleDropOnBackpack(slot, this.draggedItem);
                }
            });
        });
    }

    /**
     * Handle dropping an item on an equipment slot
     */
    handleDropOnEquipment(targetSlot: HTMLElement, dragData: DragData) {
        const targetSlotId = targetSlot.dataset.slot || '';
        let targetContent = targetSlot.querySelector('.slot-content') as HTMLElement;

        console.log(`🎒 Drop on equipment slot: ${targetSlotId}`, dragData);

        // Get card data from registry
        const cardData = this.itemRegistry.get(dragData.uniqueId);
        if (!cardData) {
            console.warn('Card data not found for:', dragData.uniqueId);
            return;
        }

        // If dragging from backpack, ALWAYS use the natural slot (not where user dropped)
        if (dragData.sourceType === 'backpack') {
            const slots = getTargetSlotsForCard(cardData) || [];
            if (slots.length > 0) {
                let naturalSlotId = slots[0];
                let naturalSlot = document.querySelector(`.slot[data-slot="${naturalSlotId}"]`);

                if (naturalSlot) {
                    const naturalContent = naturalSlot.querySelector('.slot-content');
                    const naturalExisting = naturalContent?.querySelector('img');

                    if (naturalExisting && slots.length > 1) {
                        const altSlotId = slots[1];
                        const altSlot = document.querySelector(`.slot[data-slot="${altSlotId}"]`);
                        const altContent = altSlot?.querySelector('.slot-content');
                        const altExisting = altContent?.querySelector('img');

                        if (!altExisting) {
                            naturalSlotId = altSlotId;
                            naturalSlot = altSlot;
                        }
                    }
                }

                if (naturalSlot) {
                    console.log(`🎒 Auto-redirecting from ${targetSlotId} to natural slot: ${naturalSlotId}`);
                    targetSlot = naturalSlot as HTMLElement;
                    targetContent = naturalSlot.querySelector('.slot-content') as HTMLElement;
                }
            }
        }

        const actualTargetSlotId = targetSlot.dataset.slot || '';

        // Check if target slot already has an item
        const existingImg = targetContent.querySelector('img');
        if (existingImg && existingImg.dataset.uniqueId !== dragData.uniqueId) {
            // Slot is occupied - ask user if they want to swap
            const existingData = {
                uniqueId: existingImg.dataset.uniqueId || '',
                itemName: existingImg.dataset.itemName || '',
                imageSrc: existingImg.src
            };

            // Get the slot label for the message
            const slotLabel = i18n.t(`characterSheet.${actualTargetSlotId.replace(/\d/g, '')}`) || actualTargetSlotId;

            this.promptSwapConfirmation(slotLabel, () => {
                // User confirmed - perform the swap
                if (dragData.sourceType === 'backpack') {
                    this.placeItemInBackpack(dragData.sourceId, existingData);
                } else if (dragData.sourceType === 'equipment') {
                    const sourceSlot = document.querySelector(`.slot[data-slot="${dragData.sourceId}"] .slot-content`);
                    if (sourceSlot) {
                        sourceSlot.innerHTML = `<img src="${existingData.imageSrc}" data-item-name="${existingData.itemName || ''}" data-unique-id="${existingData.uniqueId}" class="equipped-item-icon" style="width:100%; height:100%; object-fit:contain;" />`;
                        this.makeElementDraggable(sourceSlot.querySelector('img') as HTMLElement);
                    }
                }

                // Place dragged item in target
                targetContent.innerHTML = `<img src="${dragData.imageSrc}" data-item-name="${dragData.itemName || ''}" data-unique-id="${dragData.uniqueId}" class="equipped-item-icon" style="width:100%; height:100%; object-fit:contain;" />`;
                this.makeElementDraggable(targetContent.querySelector('img') as HTMLElement);

                if ((window as any).uiManager) {
                    (window as any).uiManager.showToast(i18n.t('characterSheet.itemMoved') || 'פריט הועבר', 'success');
                }
            });
        } else {
            // Slot is empty - just move the item
            this.clearSourceSlot(dragData);

            // Place dragged item in target
            targetContent.innerHTML = `<img src="${dragData.imageSrc}" data-item-name="${dragData.itemName || ''}" data-unique-id="${dragData.uniqueId}" class="equipped-item-icon" style="width:100%; height:100%; object-fit:contain;" />`;
            this.makeElementDraggable(targetContent.querySelector('img') as HTMLElement);

            if ((window as any).uiManager) {
                (window as any).uiManager.showToast(i18n.t('characterSheet.itemMoved') || 'פריט הועבר', 'success');
            }
        }
    }

    /**
     * Handle dropping an item on a backpack slot
     */
    handleDropOnBackpack(targetSlot: HTMLElement, dragData: DragData) {
        const targetSlotIndex = targetSlot.dataset.backpackSlot || '';
        const targetContent = targetSlot.querySelector('.slot-content') as HTMLElement;

        console.log(`🎒 Drop on backpack slot: ${targetSlotIndex}`, dragData);

        // Check if target slot already has an item
        const existingImg = targetContent.querySelector('img');
        if (existingImg && existingImg.dataset.uniqueId !== dragData.uniqueId) {
            // Swap items
            const existingData = {
                uniqueId: existingImg.dataset.uniqueId || '',
                itemName: existingImg.dataset.itemName || '',
                imageSrc: existingImg.src
            };

            // Move existing to source location
            if (dragData.sourceType === 'equipment') {
                const sourceSlot = document.querySelector(`.slot[data-slot="${dragData.sourceId}"] .slot-content`);
                if (sourceSlot) {
                    sourceSlot.innerHTML = `<img src="${existingData.imageSrc}" data-item-name="${existingData.itemName || ''}" data-unique-id="${existingData.uniqueId}" class="equipped-item-icon" style="width:100%; height:100%; object-fit:contain;" />`;
                    this.makeElementDraggable(sourceSlot.querySelector('img') as HTMLElement);
                }
            } else if (dragData.sourceType === 'backpack') {
                // If checking same backpack slot, do nothing (shouldn't happen with drop zones)
                // Actually need to place existing in source backpack slot
                this.placeItemInBackpack(dragData.sourceId, existingData);
            }
        } else {
            // Clear source location
            this.clearSourceSlot(dragData);
        }

        // Place dragged item in backpack slot
        this.placeItemInBackpack(targetSlotIndex, {
            uniqueId: dragData.uniqueId,
            itemName: dragData.itemName,
            imageSrc: dragData.imageSrc
        });

        if ((window as any).uiManager) {
            (window as any).uiManager.showToast(i18n.t('characterSheet.itemStored') || 'פריט הועבר לתיק', 'info');
        }
    }

    /**
     * Place an item in a backpack slot
     */
    placeItemInBackpack(slotIndex: string, itemData: any) {
        const slot = document.querySelector(`.backpack-slot[data-backpack-slot="${slotIndex}"] .slot-content`);
        if (!slot) return;

        slot.innerHTML = `<img src="${itemData.imageSrc}" data-item-name="${itemData.itemName || ''}" data-unique-id="${itemData.uniqueId}" class="backpack-item-icon" />`;

        // Store in backpack registry
        this.backpackItems.set(slotIndex, itemData);

        // Make draggable
        const img = slot.querySelector('img');
        if (img) this.makeElementDraggable(img as HTMLElement);
    }

    /**
     * Clear the source slot after a successful drop
     */
    clearSourceSlot(dragData: DragData) {
        if (dragData.sourceType === 'equipment') {
            const sourceSlot = document.querySelector(`.slot[data-slot="${dragData.sourceId}"] .slot-content`);
            if (sourceSlot) sourceSlot.innerHTML = '';
        } else if (dragData.sourceType === 'backpack') {
            const sourceSlot = document.querySelector(`.backpack-slot[data-backpack-slot="${dragData.sourceId}"] .slot-content`);
            if (sourceSlot) sourceSlot.innerHTML = '';
            this.backpackItems.delete(dragData.sourceId);
        }
    }

    /**
     * Handle click on backpack slot (view item)
     */
    handleBackpackSlotClick(e: Event) {
        const target = e.target as HTMLElement;
        const slot = target.closest('.backpack-slot');
        if (!slot) return;

        const img = slot.querySelector('img');
        if (img) {
            // Show card viewer for backpack item
            // Using controller to call card viewer
            if (this.controller.cardViewer) {
                this.controller.cardViewer.show(img.src);
            } else if ((window as any).cardViewerService) {
                (window as any).cardViewerService.show(img.src);
            }
        }
    }

    /**
     * Show confirmation dialog for item swap
     */
    promptSwapConfirmation(slotLabel: string, onConfirm: () => void) {
        // Simple confirm for now, or use uiManager if available
        if (window.confirm(i18n.t('characterSheet.swapConfirm', { slot: slotLabel }) || `Swap item in ${slotLabel}?`)) {
            onConfirm();
        }
    }
}
