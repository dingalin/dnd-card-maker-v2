/**
 * DirectEditManager - Canva-style direct manipulation editor for card elements
 * Enables dragging, resizing, and alignment guides for card text/image elements
 */

import { StateManager } from '../state';
import { ElementPositionTracker, ElementId } from './ElementPositionTracker';
import { setEditModeActive, setSelectedElement } from '../rendering/FrontCardRenderer';

// Element configuration with bounds and constraints
interface EditableElementConfig {
    id: string;
    stateKey: string;           // Key in StateManager offsets (e.g., 'name', 'type')
    label: string;              // Display label
    axis: 'x' | 'y' | 'both';   // Allowed drag directions
    minY?: number;              // Minimum Y position
    maxY?: number;              // Maximum Y position
    resizable?: boolean;        // Can resize (font size)
    fontSizeKey?: string;       // Key for font size in state
}

// Dragging state
interface DragState {
    isDragging: boolean;
    elementId: string | null;
    startX: number;
    startY: number;
    startOffset: number;
    startHandleTop: number; // Added: Initial visual top position for pure screen dragging
    currentHandle: HTMLElement | null;
}

// Editable elements on the card - NO CONSTRAINTS for full freedom
const EDITABLE_ELEMENTS: EditableElementConfig[] = [
    { id: 'name', stateKey: 'name', label: 'שם הפריט', axis: 'y', resizable: true, fontSizeKey: 'nameSize' },
    { id: 'type', stateKey: 'type', label: 'סוג', axis: 'y', resizable: true, fontSizeKey: 'typeSize' },
    { id: 'rarity', stateKey: 'rarity', label: 'נדירות', axis: 'y', resizable: true, fontSizeKey: 'raritySize' },
    { id: 'stats', stateKey: 'stats', label: 'סטטיסטיקות', axis: 'y', resizable: true, fontSizeKey: 'statsSize' },
    { id: 'coreStats', stateKey: 'coreStats', label: 'נתונים', axis: 'y', resizable: true, fontSizeKey: 'coreStatsSize' },
    { id: 'gold', stateKey: 'gold', label: 'מחיר', axis: 'y', resizable: true, fontSizeKey: 'goldSize' },
    { id: 'image', stateKey: 'imageYOffset', label: 'תמונה', axis: 'both', resizable: true, fontSizeKey: 'imageScale' }
];

export class DirectEditManager {
    private stateManager: StateManager;
    private isEditMode: boolean = false;
    private selectedElement: string | null = null;
    private overlay: HTMLElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    private dragState: DragState;
    private guides: HTMLElement[] = [];
    private positionUnsubscribe: (() => void) | null = null;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        this.dragState = {
            isDragging: false,
            elementId: null,
            startX: 0,
            startY: 0,
            startOffset: 0,
            startHandleTop: 0,
            currentHandle: null
        };
    }

    /**
     * Initialize the editor with a target canvas
     */
    init(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.createOverlay();
        this.bindGlobalEvents();
        console.log('✏️ DirectEditManager initialized');
    }

    /**
     * Toggle edit mode on/off
     * Now uses canvas-native handle rendering for perfect sync
     */
    toggleEditMode(): boolean {
        this.isEditMode = !this.isEditMode;

        // Update the renderer's edit mode state
        setEditModeActive(this.isEditMode);

        if (this.isEditMode) {
            // Bind mouse events to canvas for direct interaction
            this.bindCanvasEvents();

            // Trigger a re-render to show the handles
            this.triggerRerender();

            console.log('✏️ Edit mode: ON (Canvas-native handles)');
        } else {
            // Unbind canvas events
            this.unbindCanvasEvents();

            // Clear selection
            this.selectedElement = null;
            setSelectedElement(null);

            // Trigger re-render to hide handles
            this.triggerRerender();

            console.log('✏️ Edit mode: OFF');
        }

        return this.isEditMode;
    }

    /**
     * Trigger a card re-render to update handle visibility
     */
    private triggerRerender(): void {
        // Force a state update to trigger re-render
        const state = this.stateManager.getState();
        if (state.cardData) {
            // Touch the state to trigger re-render
            this.stateManager.updateOffset('name', state.settings.front.offsets.name || 0);
        }
    }

    /**
     * Bind mouse events to canvas for drag interaction
     */
    private bindCanvasEvents(): void {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', this.onCanvasMouseDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        // Change cursor to indicate editability
        this.canvas.style.cursor = 'pointer';
    }

    /**
     * Unbind canvas mouse events
     */
    private unbindCanvasEvents(): void {
        if (!this.canvas) return;

        this.canvas.removeEventListener('mousedown', this.onCanvasMouseDown);
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);

        // Reset cursor
        this.canvas.style.cursor = 'default';
    }

    /**
     * Handle mouse down on canvas - detect which element was clicked
     */
    private onCanvasMouseDown = (e: MouseEvent): void => {
        if (!this.canvas || !this.isEditMode) return;

        const canvasRect = this.canvas.getBoundingClientRect();

        // Convert screen coordinates to canvas coordinates
        // Use actual canvas dimensions, not hardcoded values
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;
        const canvasX = (e.clientX - canvasRect.left) * scaleX;
        const canvasY = (e.clientY - canvasRect.top) * scaleY;

        // Check which element was clicked
        const clickedElement = this.findElementAtPosition(canvasX, canvasY);

        if (clickedElement) {
            this.startDragOnElement(e, clickedElement, canvasRect);
        } else {
            // Clicked outside any element - deselect
            this.selectedElement = null;
            setSelectedElement(null);
            this.triggerRerender();
        }
    };

    /**
     * Find which element is at the given canvas position
     */
    private findElementAtPosition(canvasX: number, canvasY: number): EditableElementConfig | null {
        for (const config of EDITABLE_ELEMENTS) {
            const pos = ElementPositionTracker.getPosition(config.id as ElementId);
            if (!pos || !pos.visible) continue;

            // Check if click is within this element's bounds (with padding)
            // Using same padding as drawEditHandles in FrontCardRenderer
            const padding = 8;
            const handleX = 30;
            const handleWidth = 750 - 60;
            const handleY = pos.y - padding;
            const handleHeight = pos.height + padding * 2;

            if (canvasX >= handleX && canvasX <= handleX + handleWidth &&
                canvasY >= handleY && canvasY <= handleY + handleHeight) {
                return config;
            }
        }
        return null;
    }

    /**
     * Start dragging an element (called from canvas mousedown)
     */
    private startDragOnElement(e: MouseEvent, config: EditableElementConfig, canvasRect: DOMRect): void {
        e.preventDefault();

        // Get current offset from state
        const state = this.stateManager.getState();
        const currentOffset = state.settings.front.offsets[config.stateKey] || 0;

        this.dragState = {
            isDragging: true,
            elementId: config.id,
            startX: e.clientX,
            startY: e.clientY,
            startOffset: currentOffset,
            startHandleTop: 0, // Not used in canvas-native mode
            currentHandle: null // Not used in canvas-native mode
        };

        this.selectedElement = config.id;
        setSelectedElement(config.id);

        // Trigger re-render to show selection
        this.triggerRerender();

        console.log(`✏️ Started dragging: ${config.label}`);
    }

    /**
     * Refresh handle positions without recreating them
     */
    private refreshHandlePositions(): void {
        if (!this.overlay || !this.canvas) return;

        const canvasRect = this.canvas.getBoundingClientRect();
        const state = this.stateManager.getState();
        const offsets = state.settings.front.offsets;

        const handles = this.overlay.querySelectorAll('.element-handle');
        handles.forEach(handle => {
            const el = handle as HTMLElement;
            const configId = el.dataset.elementId;
            const config = EDITABLE_ELEMENTS.find(e => e.id === configId);
            if (!config) return;

            const position = this.calculateElementPosition(config, offsets, canvasRect);
            el.style.left = `${position.x}px`;
            el.style.top = `${position.y}px`;
            el.style.width = `${position.width}px`;
            el.style.height = `${position.height}px`;
        });
    }

    /**
     * Check if edit mode is active
     */
    isActive(): boolean {
        return this.isEditMode;
    }

    /**
     * Create the overlay container that sits above the canvas
     */
    private createOverlay(): void {
        if (!this.canvas) return;

        // Create overlay container
        this.overlay = document.createElement('div');
        this.overlay.className = 'direct-edit-overlay';
        this.overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            display: none;
            z-index: 100;
        `;

        // Insert after canvas
        const parent = this.canvas.parentElement;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(this.overlay);
        }

        // Create center guides
        this.createAlignmentGuides();
    }

    /**
     * Create alignment guides (center lines)
     */
    private createAlignmentGuides(): void {
        if (!this.overlay) return;

        // Vertical center guide
        const vGuide = document.createElement('div');
        vGuide.className = 'alignment-guide vertical-center';
        vGuide.style.cssText = `
            position: absolute;
            left: 50%;
            top: 0;
            bottom: 0;
            width: 2px;
            background: rgba(0, 150, 255, 0.7);
            transform: translateX(-50%);
            display: none;
            pointer-events: none;
            z-index: 101;
        `;
        this.overlay.appendChild(vGuide);
        this.guides.push(vGuide);

        // Horizontal center guide
        const hGuide = document.createElement('div');
        hGuide.className = 'alignment-guide horizontal-center';
        hGuide.style.cssText = `
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 2px;
            background: rgba(0, 150, 255, 0.7);
            transform: translateY(-50%);
            display: none;
            pointer-events: none;
            z-index: 101;
        `;
        this.overlay.appendChild(hGuide);
        this.guides.push(hGuide);
    }

    /**
     * Show/hide overlay
     */
    private showOverlay(): void {
        if (this.overlay) {
            this.overlay.style.display = 'block';
        }
    }

    private hideOverlay(): void {
        if (this.overlay) {
            this.overlay.style.display = 'none';
            // Clear handles
            const handles = this.overlay.querySelectorAll('.element-handle');
            handles.forEach(h => h.remove());
        }
    }

    /**
     * Create draggable handles for each editable element
     */
    private createElementHandles(): void {
        if (!this.overlay || !this.canvas) return;

        // Clear existing handles
        const existing = this.overlay.querySelectorAll('.element-handle');
        existing.forEach(h => h.remove());

        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;

        // Get current state
        const state = this.stateManager.getState();
        const offsets = state.settings.front.offsets;

        // Create a handle for each element
        EDITABLE_ELEMENTS.forEach(config => {
            const handle = document.createElement('div');
            handle.className = 'element-handle';
            handle.dataset.elementId = config.id;
            handle.dataset.stateKey = config.stateKey;

            // Calculate position based on element type and current offset
            const position = this.calculateElementPosition(config, offsets, canvasRect);

            // Minimal style - thin border, no background, no label
            handle.style.cssText = `
                position: absolute;
                left: ${position.x}px;
                top: ${position.y}px;
                width: ${position.width}px;
                height: ${position.height}px;
                border: 1px dashed rgba(255, 200, 100, 0.5);
                background: transparent;
                cursor: ${config.axis === 'y' ? 'ns-resize' : 'move'};
                pointer-events: auto;
                border-radius: 3px;
                transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
                box-sizing: border-box;
            `;

            // NO label - just the frame

            // Hover effect - show border more clearly
            handle.addEventListener('mouseenter', () => {
                handle.style.borderColor = 'rgba(255, 220, 50, 0.9)';
                handle.style.borderWidth = '2px';
                handle.style.background = 'rgba(255, 220, 50, 0.1)';
                handle.style.boxShadow = '0 0 8px rgba(255, 200, 50, 0.4)';
            });
            handle.addEventListener('mouseleave', () => {
                if (this.selectedElement !== config.id) {
                    handle.style.borderColor = 'rgba(255, 200, 100, 0.5)';
                    handle.style.borderWidth = '1px';
                    handle.style.background = 'transparent';
                    handle.style.boxShadow = 'none';
                }
            });

            // Drag events
            handle.addEventListener('mousedown', (e) => this.startDrag(e, config));

            this.overlay!.appendChild(handle);
        });
    }

    /**
     * Calculate element position on the canvas - Uses REAL positions from ElementPositionTracker
     */
    /**
     * Calculate element position on the canvas
     * @param ignoreTracker If true, forces calculation based on offsets instead of using tracker (useful during drag)
     */
    private calculateElementPosition(
        config: EditableElementConfig,
        offsets: Record<string, number>,
        canvasRect: DOMRect,
        ignoreTracker: boolean = false
    ): { x: number; y: number; width: number; height: number } {
        const canvasWidth = canvasRect.width;
        const canvasHeight = canvasRect.height;

        // Canvas logical size is 750x1050
        const scaleY = canvasHeight / 1050;
        const scaleX = canvasWidth / 750;

        // Try to get actual position from tracker (unless ignored)
        const trackedPos = !ignoreTracker ? ElementPositionTracker.getPosition(config.id as ElementId) : null;

        if (trackedPos && trackedPos.visible) {
            // trackedPos.y is now the VISUAL TOP (calculated from baseline - ascent)
            // trackedPos.height is the VISUAL HEIGHT (ascent + descent)
            // We just need to scale it to screen coordinates

            const handleTop = trackedPos.y * scaleY;
            const handleHeight = trackedPos.height * scaleY;

            return {
                x: 0.05 * canvasWidth, // Keep margins for easier dragging
                y: handleTop,
                width: 0.90 * canvasWidth,
                height: handleHeight
            };
        }

        // Fallback / Drag Calculation logic
        // We need to simulate exactly what the renderer does to keep the handle synced with mouse
        // Visual top is roughly Y (Baseline) - 80% of Height (Ascent)

        const basePositions: Record<string, { y: number; h: number }> = {
            rarity: { y: 100, h: 40 },
            type: { y: 140, h: 50 },
            name: { y: 200, h: 60 },
            image: { y: 350, h: 300 },
            coreStats: { y: 680, h: 50 },
            stats: { y: 780, h: 80 },
            gold: { y: 920, h: 50 }
        };

        const base = basePositions[config.id] || { y: 500, h: 50 };
        const offsetValue = offsets[config.stateKey] || 0;

        // Calculate where the text BASELINE is
        const baselineY = base.y + offsetValue;

        // Convert to canvas scale
        const scaledBaselineY = baselineY * scaleY;
        const scaledHeight = base.h * scaleY;

        // Estimate visual top (Baseline - Height * 0.8)
        // This keeps the handle moving 1:1 with the offset
        const handleTop = scaledBaselineY - (scaledHeight * 0.8);

        return {
            x: 0.05 * canvasWidth,
            y: handleTop,
            width: 0.90 * canvasWidth,
            height: scaledHeight * 1.5 // Match the tracker's padding logic
        };
    }

    /**
     * Start dragging an element
     */
    private startDrag(e: MouseEvent, config: EditableElementConfig): void {
        e.preventDefault();
        e.stopPropagation();

        const handle = e.currentTarget as HTMLElement;

        // Get current offset from state
        const state = this.stateManager.getState();
        const currentOffset = state.settings.front.offsets[config.stateKey] || 0;

        // Capture the initial visual position of the handle to ensure 1:1 dragging
        const startHandleTop = parseFloat(handle.style.top || '0');

        this.dragState = {
            isDragging: true,
            elementId: config.id,
            startX: e.clientX,
            startY: e.clientY,
            startOffset: currentOffset,
            startHandleTop: startHandleTop,
            currentHandle: handle
        };

        this.selectedElement = config.id;

        // Highlight selected
        handle.style.borderColor = 'rgba(100, 200, 255, 1)';
        handle.style.borderStyle = 'solid';
        handle.style.background = 'rgba(100, 200, 255, 0.2)';

        console.log(`✏️ Started dragging: ${config.label}`);
    }

    /**
     * Handle mouse move during drag
     */
    /**
     * Get normalized mouse position relative to canvas coordinate space (750x1050)
     */
    private getNormalizedMousePos(e: MouseEvent, canvasRect: DOMRect) {
        // Calculate scale factors
        const scaleX = 750 / canvasRect.width;
        const scaleY = 1050 / canvasRect.height;

        return {
            x: (e.clientX - canvasRect.left) * scaleX,
            y: (e.clientY - canvasRect.top) * scaleY
        };
    }

    /**
     * Handle mouse move during drag
     */
    private onMouseMove = (e: MouseEvent): void => {
        if (!this.dragState.isDragging || !this.dragState.elementId) return;

        const config = EDITABLE_ELEMENTS.find(el => el.id === this.dragState.elementId);
        if (!config) return;

        const canvasRect = this.canvas?.getBoundingClientRect();
        if (!canvasRect) return;

        // Use normalized coordinates for precise 1:1 tracking
        const currentPos = this.getNormalizedMousePos(e, canvasRect);

        // We need the START position in normalized coordinates too
        // Since we didn't store normalized startY, we calculate delta from clientY but scale it
        // This is equivalent mathematically to (currentNorm - startNorm)
        const scale = 1050 / canvasRect.height; // scaleY
        const deltaY = (e.clientY - this.dragState.startY) * scale;

        // Calculate new offset (no constraints - full freedom)
        let newOffset = this.dragState.startOffset + deltaY;

        // Check for center alignment (snap to 0)
        const snapThreshold = 10;
        if (Math.abs(newOffset) < snapThreshold) {
            newOffset = 0;
            this.showGuide('vertical-center');
        } else {
            this.hideGuide('vertical-center');
        }

        // Update state
        this.stateManager.updateOffset(config.stateKey, newOffset);

        // Handle position is now driven by ElementPositionTracker subscription
        // No manual positioning here - the Tracker updates after each render and refreshHandlePositions moves the handle
    };

    /**
     * Handle mouse up (end drag)
     */
    private onMouseUp = (): void => {
        if (!this.dragState.isDragging) return;

        console.log(`✏️ Finished dragging: ${this.dragState.elementId}`);

        // Hide guides
        this.hideAllGuides();

        // Reset handle style
        if (this.dragState.currentHandle) {
            this.dragState.currentHandle.style.borderStyle = 'dashed';
        }

        this.dragState = {
            isDragging: false,
            elementId: null,
            startX: 0,
            startY: 0,
            startOffset: 0,
            startHandleTop: 0,
            currentHandle: null
        };
    };

    /**
     * Bind global mouse events
     */
    private bindGlobalEvents(): void {
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);
    }

    /**
     * Show/hide alignment guides
     */
    private showGuide(className: string): void {
        const guide = this.guides.find(g => g.classList.contains(className));
        if (guide) guide.style.display = 'block';
    }

    private hideGuide(className: string): void {
        const guide = this.guides.find(g => g.classList.contains(className));
        if (guide) guide.style.display = 'none';
    }

    private hideAllGuides(): void {
        this.guides.forEach(g => g.style.display = 'none');
    }

    /**
     * Cleanup
     */
    destroy(): void {
        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
        if (this.overlay) {
            this.overlay.remove();
        }
    }
}
