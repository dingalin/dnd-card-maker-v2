/**
 * KonvaCardRenderer - Full Konva.js based card renderer
 * All elements (template, image, texts) are native Konva nodes
 */

import Konva from 'konva';
import { StateManager } from '../state';

// Text element configuration
interface TextElement {
    id: string;
    stateKey: string;
    baseY: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    fill: string;
    align: 'center' | 'left' | 'right';
}

const TEXT_ELEMENTS: TextElement[] = [
    { id: 'rarity', stateKey: 'rarity', baseY: 100, fontSize: 28, fontFamily: 'Noto Serif Hebrew', fontWeight: 'bold', fill: '#2c1810', align: 'center' },
    { id: 'type', stateKey: 'type', baseY: 140, fontSize: 32, fontFamily: 'Noto Serif Hebrew', fontWeight: 'normal', fill: '#2c1810', align: 'center' },
    { id: 'name', stateKey: 'name', baseY: 195, fontSize: 48, fontFamily: 'Noto Serif Hebrew', fontWeight: 'bold', fill: '#1a1a1a', align: 'center' },
    { id: 'coreStats', stateKey: 'coreStats', baseY: 680, fontSize: 36, fontFamily: 'Noto Serif Hebrew', fontWeight: 'normal', fill: '#1a1a1a', align: 'center' },
    { id: 'stats', stateKey: 'stats', baseY: 780, fontSize: 28, fontFamily: 'Noto Serif Hebrew', fontWeight: 'normal', fill: '#1a1a1a', align: 'center' },
    { id: 'gold', stateKey: 'gold', baseY: 950, fontSize: 32, fontFamily: 'Noto Serif Hebrew', fontWeight: 'bold', fill: '#8B7355', align: 'center' }
];

const BACK_TEXT_ELEMENTS: TextElement[] = [
    { id: 'abilityName', stateKey: 'abilityName', baseY: 120, fontSize: 42, fontFamily: 'Noto Serif Hebrew', fontWeight: 'bold', fill: '#2c1810', align: 'center' },
    { id: 'mech', stateKey: 'mech', baseY: 220, fontSize: 30, fontFamily: 'Noto Serif Hebrew', fontWeight: 'normal', fill: '#1a1a1a', align: 'center' },
    { id: 'lore', stateKey: 'lore', baseY: 750, fontSize: 26, fontFamily: 'Noto Serif Hebrew', fontWeight: 'normal', fontStyle: 'italic', fill: '#4a4a4a', align: 'center' }
];

export class KonvaCardRenderer {
    private stage: Konva.Stage | null = null;
    private backgroundLayer: Konva.Layer | null = null;
    private imageLayer: Konva.Layer | null = null;
    private textLayer: Konva.Layer | null = null;
    private controlsLayer: Konva.Layer | null = null;

    private templateImage: Konva.Image | null = null;
    private itemImage: Konva.Image | null = null;
    private textNodes: Map<string, Konva.Text> = new Map();
    private transformer: Konva.Transformer | null = null;

    private stateManager: StateManager;
    private isEditMode: boolean = false;
    private selectedNode: Konva.Node | null = null;
    private stateUnsubscribe: (() => void) | null = null;
    private mode: 'front' | 'back' = 'front';

    constructor(stateManager: StateManager) {
        this.stateManager = stateManager;
    }

    /**
     * Initialize the Konva stage
     */
    init(containerId: string): boolean {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('KonvaCardRenderer: Container not found:', containerId);
            return false;
        }

        // Create Konva Stage (750x1050 logical, scaled to fit container)
        this.stage = new Konva.Stage({
            container: containerId,
            width: 750,
            height: 1050
        });

        // Create layers (bottom to top)
        this.backgroundLayer = new Konva.Layer();
        this.imageLayer = new Konva.Layer();
        this.textLayer = new Konva.Layer();
        this.controlsLayer = new Konva.Layer();

        this.stage.add(this.backgroundLayer);
        this.stage.add(this.imageLayer);
        this.stage.add(this.textLayer);
        this.stage.add(this.controlsLayer);

        // Create transformer for edit mode
        this.transformer = new Konva.Transformer({
            rotateEnabled: false,
            enabledAnchors: [],
            borderStroke: 'rgba(100, 200, 255, 0.9)',
            borderStrokeWidth: 3,
            padding: 5
        });
        this.controlsLayer.add(this.transformer);

        // Create all text nodes
        this.createTextNodes();

        // Click to deselect
        this.stage.on('click tap', (e) => {
            if (e.target === this.stage) {
                this.deselectAll();
            }
        });

        // Subscribe to state changes
        this.stateUnsubscribe = this.stateManager.subscribe(() => {
            this.updateFromState();
        });

        console.log('✅ KonvaCardRenderer initialized');
        return true;
    }

    /**
     * Set rendering mode (front/back)
     */
    setMode(mode: 'front' | 'back'): void {
        this.mode = mode;
        console.log(`🔄 KonvaRenderer switched to ${mode} mode`);
        this.updateFromState();
    }

    /**
     * Create Konva.Text nodes for all text elements (Front + Back)
     */
    private createTextNodes(): void {
        if (!this.textLayer) return;

        const allElements = [...TEXT_ELEMENTS, ...BACK_TEXT_ELEMENTS];

        allElements.forEach(config => {
            const text = new Konva.Text({
                x: 0,
                y: config.baseY,
                width: 750,
                text: '',
                fontSize: config.fontSize,
                fontFamily: config.fontFamily,
                fontStyle: config.fontWeight || config.fontStyle || 'normal',
                fill: config.fill,
                align: config.align,
                verticalAlign: 'middle',
                wrap: 'word',
                // Enable drag for edit mode
                draggable: false,
                name: config.id,
                // Text styling
                stroke: '#000',
                strokeWidth: 0,
                shadowColor: 'rgba(0,0,0,0.5)',
                shadowBlur: 0,
                shadowOffset: { x: 2, y: 2 },
                visible: false // Hidden by default, toggled in updateFromState
            });

            // Drag handlers
            text.on('dragstart', () => {
                this.selectNode(text);
            });

            text.on('dragmove', () => {
                // Lock X to center
                text.x(0);
                // Update state
                const offset = text.y() - config.baseY;
                this.stateManager.updateOffset(config.stateKey, offset);
            });

            text.on('dragend', () => {
                console.log(`✏️ Finished dragging: ${config.id}`);
            });

            text.on('click tap', () => {
                if (this.isEditMode) {
                    this.selectNode(text);
                }
            });

            // Hover effects
            text.on('mouseenter', () => {
                if (this.isEditMode) {
                    document.body.style.cursor = 'move';
                }
            });

            text.on('mouseleave', () => {
                document.body.style.cursor = 'default';
            });

            this.textNodes.set(config.id, text);
            this.textLayer.add(text);
        });
    }

    /**
     * Load and set the template image
     */
    async setTemplate(templateUrl: string): Promise<void> {
        if (!this.backgroundLayer) return;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Remove old template if exists
                this.templateImage?.destroy();

                this.templateImage = new Konva.Image({
                    x: 0,
                    y: 0,
                    width: 750,
                    height: 1050,
                    image: img
                });

                this.backgroundLayer!.add(this.templateImage);
                this.backgroundLayer!.batchDraw();
                console.log('✅ Template loaded:', templateUrl);
                resolve();
            };
            img.onerror = () => {
                console.error('❌ Failed to load template:', templateUrl);
                reject(new Error('Template load failed'));
            };
            img.src = templateUrl;
        });
    }

    /**
     * Load and set the item image
     */
    async setItemImage(imageUrl: string, yOffset: number = 0): Promise<void> {
        if (!this.imageLayer) return;

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Remove old image if exists
                this.itemImage?.destroy();

                // Calculate size to fit in card area
                const maxWidth = 600;
                const maxHeight = 400;
                const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

                this.itemImage = new Konva.Image({
                    x: 375, // Center
                    y: 450 + yOffset, // Middle area + offset
                    width: img.width * scale,
                    height: img.height * scale,
                    image: img,
                    offsetX: (img.width * scale) / 2,
                    offsetY: (img.height * scale) / 2,
                    draggable: this.isEditMode
                });

                // Drag handler for item image
                this.itemImage.on('dragend', () => {
                    const newY = this.itemImage!.y() - 450;
                    this.stateManager.updateOffset('imageYOffset', newY);
                });

                this.imageLayer!.add(this.itemImage);
                this.imageLayer!.batchDraw();
                console.log('✅ Item image loaded');
                resolve();
            };
            img.onerror = () => {
                console.error('❌ Failed to load item image');
                reject(new Error('Image load failed'));
            };
            img.src = imageUrl;
        });
    }

    /**
     * Update all elements from state
     */
    updateFromState(): void {
        const state = this.stateManager.getState();
        const cardData = state.cardData;

        // Use correct side settings
        const settingsSide = this.mode === 'back' ? state.settings.back : state.settings.front;
        const offsets = settingsSide.offsets || {};

        // Hide/Show Item Image (Usually hidden on back unless specifically supported)
        if (this.itemImage) {
            this.itemImage.visible(this.mode === 'front');
        }

        console.log(`📊 Konva updateFromState (${this.mode})`, cardData);

        if (!cardData) {
            console.warn('❌ No cardData found');
            return;
        }

        // Toggle Text Visibility & Update Content
        if (this.mode === 'front') {
            const front = (cardData.front || {}) as any;

            // Show Front Nodes
            TEXT_ELEMENTS.forEach(el => this.textNodes.get(el.id)?.visible(true));
            // Hide Back Nodes
            BACK_TEXT_ELEMENTS.forEach(el => this.textNodes.get(el.id)?.visible(false));

            this.setText('name', front.title || cardData.name || '');
            this.setText('type', front.type || cardData.typeHe || '');
            this.setText('rarity', front.rarity || cardData.rarity || '');
            this.setText('coreStats', this.buildCoreStatsText(cardData));
            this.setText('stats', cardData.statsHe || cardData.stats || '');
            this.setText('gold', cardData.goldAmount ? `${cardData.goldAmount}` : '');

        } else {
            const back = (cardData.back || {}) as any;

            // Hide Front Nodes
            TEXT_ELEMENTS.forEach(el => this.textNodes.get(el.id)?.visible(false));
            // Show Back Nodes
            BACK_TEXT_ELEMENTS.forEach(el => this.textNodes.get(el.id)?.visible(true));

            this.setText('abilityName', back.title || cardData.abilityName || '');
            this.setText('mech', back.mechanics || cardData.abilityDesc || '');
            this.setText('lore', back.lore || cardData.description || '');
        }

        // Update positions from offsets (Generic for both lists)
        const activeList = this.mode === 'front' ? TEXT_ELEMENTS : BACK_TEXT_ELEMENTS;
        activeList.forEach(config => {
            const text = this.textNodes.get(config.id);
            if (text) {
                const offset = offsets[config.stateKey] || 0;
                text.y(config.baseY + offset);
            }
        });

        // Update item image position
        if (this.itemImage && this.mode === 'front') {
            const imageOffset = offsets['imageYOffset'] || 0;
            this.itemImage.y(450 + imageOffset);
        }

        this.textLayer?.batchDraw();
        this.imageLayer?.batchDraw();
    }

    /**
     * Set text content for a specific element
     */
    private setText(id: string, content: string): void {
        const text = this.textNodes.get(id);
        if (text) {
            text.text(content);
        }
    }

    /**
     * Build core stats text from card data
     */
    private buildCoreStatsText(data: any): string {
        const parts: string[] = [];

        if (data.weaponDamage) {
            parts.push(`${data.weaponDamageType || ''} ${data.weaponDamage}`);
        }
        if (data.armorClass) {
            parts.push(`AC ${data.armorClass}`);
        }

        return parts.join(' | ');
    }

    /**
     * Toggle edit mode
     */
    toggleEditMode(): boolean {
        this.isEditMode = !this.isEditMode;

        // Enable/disable dragging on all texts
        this.textNodes.forEach(text => {
            text.draggable(this.isEditMode);
        });

        // Enable/disable dragging on item image
        if (this.itemImage) {
            this.itemImage.draggable(this.isEditMode);
        }

        if (!this.isEditMode) {
            this.deselectAll();
        }

        this.textLayer?.batchDraw();
        console.log(`✏️ Konva Edit mode: ${this.isEditMode ? 'ON' : 'OFF'}`);
        return this.isEditMode;
    }

    /**
     * Select a node
     */
    private selectNode(node: Konva.Node): void {
        this.selectedNode = node;
        this.transformer?.nodes([node]);
        this.controlsLayer?.batchDraw();
    }

    /**
     * Deselect all
     */
    private deselectAll(): void {
        this.selectedNode = null;
        this.transformer?.nodes([]);
        this.controlsLayer?.batchDraw();
    }

    /**
     * Resize stage to fit container
     */
    resize(width: number, height: number): void {
        if (!this.stage) return;

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
     * Export to PNG data URL
     */
    toDataURL(options?: { pixelRatio?: number }): string {
        if (!this.stage) return '';

        // Temporarily hide controls for export
        this.controlsLayer?.hide();

        const dataUrl = this.stage.toDataURL({
            pixelRatio: options?.pixelRatio || 2,
            mimeType: 'image/png'
        });

        this.controlsLayer?.show();
        return dataUrl;
    }

    /**
     * Get edit mode status
     */
    isInEditMode(): boolean {
        return this.isEditMode;
    }

    /**
     * Destroy the renderer
     */
    destroy(): void {
        if (this.stateUnsubscribe) {
            this.stateUnsubscribe();
        }
        this.stage?.destroy();
        this.stage = null;
        this.textNodes.clear();
    }
}

export default KonvaCardRenderer;
