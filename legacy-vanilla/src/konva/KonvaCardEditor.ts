/**
 * KonvaCardEditor - Professional canvas editor using Konva.js
 * Provides drag, resize, and selection functionality for card elements
 */

import Konva from 'konva';
import { StateManager } from '../state';
import { ElementPositionTracker, ElementId } from '../editing/ElementPositionTracker';

// Element configuration
interface EditableElement {
    id: ElementId;
    stateKey: string;
    label: string;
}

const EDITABLE_ELEMENTS: EditableElement[] = [
    { id: 'rarity', stateKey: 'rarity', label: 'נדירות' },
    { id: 'type', stateKey: 'type', label: 'סוג' },
    { id: 'name', stateKey: 'name', label: 'שם הפריט' },
    { id: 'coreStats', stateKey: 'coreStats', label: 'נתונים' },
    { id: 'stats', stateKey: 'stats', label: 'סטטיסטיקות' },
    { id: 'gold', stateKey: 'gold', label: 'מחיר' }
];

export class KonvaCardEditor {
    private stage: Konva.Stage | null = null;
    private backgroundLayer: Konva.Layer | null = null;
    private contentLayer: Konva.Layer | null = null;
    private controlsLayer: Konva.Layer | null = null;
    private transformer: Konva.Transformer | null = null;

    private stateManager: StateManager;
    private container: HTMLElement | null = null;
    private isEditMode: boolean = false;
    private selectedElement: Konva.Node | null = null;
    private positionUnsubscribe: (() => void) | null = null;

    // Map Konva nodes to element IDs
    // Map Konva nodes to element IDs
    private elementNodes: Map<ElementId, Konva.Rect> = new Map();
    private isDraggingActive: boolean = false;

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
        // Create button immediately - survives navigation/container loss
        this.createFloatingToggleButton();
    }

    /**
     * Initialize the Konva stage
     */
    /**
     * Initialize the Konva stage
     */
    init(containerId: string): boolean {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('KonvaCardEditor: Container not found:', containerId);
            return false;
        }

        this.container = container;

        // Check if stage already exists
        if (this.stage) {
            console.warn('KonvaCardEditor: Stage already initialized');
            return true;
        }

        // Create Konva Stage
        this.stage = new Konva.Stage({
            container: containerId,
            width: 750,
            height: 1050
        });

        // Create layers
        this.backgroundLayer = new Konva.Layer();
        this.contentLayer = new Konva.Layer();
        this.controlsLayer = new Konva.Layer();

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.contentLayer);
        this.stage.add(this.controlsLayer);

        // Create transformer for selection handles
        this.transformer = new Konva.Transformer({
            rotateEnabled: false, // Disable rotation for text elements
            enabledAnchors: [], // Disable resize for now, only drag
            borderStroke: 'rgba(100, 200, 255, 0.9)',
            borderStrokeWidth: 2,
            anchorStroke: 'rgba(100, 200, 255, 1)',
            anchorFill: 'white',
            anchorSize: 10,
            padding: 5
        });
        this.controlsLayer.add(this.transformer);

        // Setup click handler for deselection
        this.stage.on('click tap', (e) => {
            if (e.target === this.stage) {
                this.deselectAll();
            }
        });

        console.log('✅ KonvaCardEditor initialized');
        return true;
    }

    /**
     * Create a floating toggle button for Edit Mode
     * Ensures visibility regardless of UI state
     */
    private createFloatingToggleButton(): void {
        // Check if exists
        if (document.getElementById('konva-fab-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'konva-fab-btn';
        btn.innerHTML = '<span style="font-size: 24px;">✏️</span>';
        btn.title = "Toggle Edit Mode";

        // Style as Floating Action Button
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            left: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4a90e2', // Blue
            color: 'white',
            border: '2px solid white',
            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
            zIndex: '9999',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease'
        });

        // Hover effect
        btn.onmouseenter = () => btn.style.transform = 'scale(1.1)';
        btn.onmouseleave = () => btn.style.transform = 'scale(1.0)';

        // Click handler
        btn.onclick = () => {
            const isEditing = this.toggleEditMode();
            btn.style.backgroundColor = isEditing ? '#e74c3c' : '#4a90e2'; // Red when active
            btn.innerHTML = isEditing ? '<span style="font-size: 24px;">✕</span>' : '<span style="font-size: 24px;">✏️</span>';
        };

        document.body.appendChild(btn);
        console.log('✅ Floating Edit Button injected');
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode(): boolean {
        this.isEditMode = !this.isEditMode;

        if (this.isEditMode) {
            this.showEditHandles();

            // Subscribe to position updates - refresh handles after each render
            this.positionUnsubscribe = ElementPositionTracker.subscribe(() => {
                if (this.isEditMode) {
                    this.refreshHandlePositions();
                }
            });
        } else {
            this.hideEditHandles();
            this.deselectAll();

            // Unsubscribe from position updates
            if (this.positionUnsubscribe) {
                this.positionUnsubscribe();
                this.positionUnsubscribe = null;
            }
        }

        console.log(`✏️ Konva Edit mode: ${this.isEditMode ? 'ON' : 'OFF'}`);
        return this.isEditMode;
    }

    /**
     * Create/show edit handles for all elements
     */
    private showEditHandles(): void {
        if (!this.contentLayer) return;

        // Clear existing handles
        this.elementNodes.forEach(node => node.destroy());
        this.elementNodes.clear();

        // Create handle rectangles for each editable element
        EDITABLE_ELEMENTS.forEach(element => {
            // Get initial position from tracker OR use defaults
            let pos = ElementPositionTracker.getPosition(element.id);

            // If tracking hasn't happened yet (e.g. first load), use approximate defaults
            if (!pos) {
                pos = {
                    x: 375, // Center
                    y: this.getBaseY(element.id),
                    width: 500,
                    height: 50,
                    visible: true
                };
            }

            if (!pos || !pos.visible) return;

            const rect = new Konva.Rect({
                x: 30, // Fixed left margin for handles
                y: pos.y - 8,
                width: 690, // Full width minus margins
                height: pos.height + 16,
                stroke: 'rgba(255, 200, 100, 0.6)',
                strokeWidth: 2,
                dash: [8, 4],
                fill: 'transparent',
                draggable: true,
                name: element.id
            });

            // Store reference
            this.elementNodes.set(element.id, rect);

            // Drag event handlers
            rect.on('dragstart', () => {
                this.selectElement(rect);
                this.isDraggingActive = true;
            });

            rect.on('dragmove', () => {
                // Constrain to vertical movement only
                rect.x(30); // Lock X position

                // Update state during drag
                const newY = rect.y() + 8; // Adjust for padding
                const baseY = this.getBaseY(element.id);
                const offset = newY - baseY;

                this.stateManager.updateOffset(element.stateKey, offset);
            });

            rect.on('dragend', () => {
                console.log(`✏️ Finished dragging: ${element.label}`);
                this.isDraggingActive = false;
            });

            // Click to select
            rect.on('click tap', () => {
                this.selectElement(rect);
            });

            // Hover effects
            rect.on('mouseenter', () => {
                if (this.isDraggingActive) return;
                rect.stroke('rgba(255, 200, 100, 0.9)');
                this.contentLayer?.batchDraw();
                document.body.style.cursor = 'ns-resize';
            });

            rect.on('mouseleave', () => {
                if (this.isDraggingActive) return;
                if (this.selectedElement !== rect) {
                    rect.stroke('rgba(255, 200, 100, 0.6)');
                    this.contentLayer?.batchDraw();
                }
                document.body.style.cursor = 'default';
            });

            this.contentLayer.add(rect);
        });

        this.contentLayer.batchDraw();
    }

    /**
     * Hide edit handles
     */
    private hideEditHandles(): void {
        this.elementNodes.forEach(node => node.destroy());
        this.elementNodes.clear();
        this.contentLayer?.batchDraw();
    }

    /**
     * Select an element
     */
    private selectElement(node: Konva.Rect): void {
        // Deselect previous
        if (this.selectedElement && this.selectedElement !== node) {
            (this.selectedElement as Konva.Rect).stroke('rgba(255, 200, 100, 0.6)');
        }

        this.selectedElement = node;
        node.stroke('rgba(100, 200, 255, 0.9)');
        node.dash([]);

        // Attach transformer
        this.transformer?.nodes([node]);
        this.controlsLayer?.batchDraw();
        this.contentLayer?.batchDraw();
    }

    /**
     * Deselect all elements
     */
    private deselectAll(): void {
        if (this.selectedElement) {
            (this.selectedElement as Konva.Rect).stroke('rgba(255, 200, 100, 0.6)');
            (this.selectedElement as Konva.Rect).dash([8, 4]);
        }
        this.selectedElement = null;
        this.transformer?.nodes([]);
        this.controlsLayer?.batchDraw();
        this.contentLayer?.batchDraw();
    }

    /**
     * Get base Y position for an element
     */
    private getBaseY(elementId: ElementId): number {
        const basePositions: Record<string, number> = {
            rarity: 100,
            type: 140,
            name: 200,
            coreStats: 680,
            stats: 780,
            gold: 920
        };
        return basePositions[elementId] || 500;
    }

    /**
     * Update handle positions from tracker
     */
    refreshHandlePositions(): void {
        if (!this.isEditMode) return;

        // Don't update IF currently dragging (prevents jitter loop)
        if (this.transformer?.nodes().length && this.transformer.isDragging()) {
            return;
        }

        this.elementNodes.forEach((rect, elementId) => {
            const pos = ElementPositionTracker.getPosition(elementId);
            if (!pos || !pos.visible) {
                rect.visible(false);
                return;
            }

            rect.visible(true);
            rect.y(pos.y - 8);
            rect.height(pos.height + 16);

            // Allow width updates (e.g. if text changed)
            // rect.width(pos.width + 16); // Maybe later? Fixed width feels safer for now
        });

        this.contentLayer?.batchDraw();
    }

    /**
     * Resize the stage to fit container
     */
    resize(width: number, height: number): void {
        if (!this.stage) return;

        // Maintain aspect ratio
        const aspectRatio = 750 / 1050;
        let newWidth = width;
        let newHeight = height;

        if (width / height > aspectRatio) {
            newWidth = height * aspectRatio;
        } else {
            newHeight = width / aspectRatio;
        }

        this.stage.width(newWidth);
        this.stage.height(newHeight);
        this.stage.scale({ x: newWidth / 750, y: newHeight / 1050 });
        this.stage.batchDraw();
    }

    /**
     * Get edit mode status
     */
    isInEditMode(): boolean {
        return this.isEditMode;
    }

    /**
     * Destroy the editor
     */
    destroy(): void {
        this.stage?.destroy();
        this.stage = null;
        this.backgroundLayer = null;
        this.contentLayer = null;
        this.controlsLayer = null;
        this.transformer = null;
        this.elementNodes.clear();
    }
}

export default KonvaCardEditor;
