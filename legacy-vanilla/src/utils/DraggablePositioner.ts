// @ts-nocheck
/**
 * DraggablePositioner.ts
 * ======================
 * Allows users to drag fixed-position elements to desired locations
 * and displays coordinates for permanent positioning in CSS.
 */

interface DraggableElement {
    element: HTMLElement;
    name: string;
    originalStyles: {
        left: string;
        right: string;
        top: string;
        cursor: string;
    };
}

export class DraggablePositioner {
    private activeElements: Map<string, DraggableElement> = new Map();
    private isEnabled: boolean = false;
    private coordsDisplay: HTMLElement | null = null;
    private currentDragging: DraggableElement | null = null;
    private offsetX: number = 0;
    private offsetY: number = 0;

    constructor() {
        this.createCoordsDisplay();
        this.setupGlobalListeners();
    }

    /**
     * Create a floating display showing current coordinates
     */
    private createCoordsDisplay(): void {
        this.coordsDisplay = document.createElement('div');
        this.coordsDisplay.id = 'position-coords-display';
        this.coordsDisplay.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            color: #d4af37;
            padding: 15px 25px;
            border-radius: 10px;
            border: 2px solid #d4af37;
            font-family: monospace;
            font-size: 14px;
            z-index: 10000;
            display: none;
            min-width: 300px;
            text-align: center;
            box-shadow: 0 5px 20px rgba(0,0,0,0.5);
        `;
        this.coordsDisplay.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #fff;">📍 מצב עריכת מיקום</div>
            <div id="coords-info">גרור אלמנט למיקום הרצוי</div>
            <div style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
                <button id="save-positions-btn" style="
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">💾 שמור מיקומים</button>
                <button id="exit-position-mode-btn" style="
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white;
                    border: none;
                    padding: 8px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">✕ יציאה</button>
            </div>
        `;
        document.body.appendChild(this.coordsDisplay);

        // Setup button handlers
        document.getElementById('save-positions-btn')?.addEventListener('click', () => this.savePositions());
        document.getElementById('exit-position-mode-btn')?.addEventListener('click', () => this.disable());
    }

    /**
     * Register an element for draggable positioning
     */
    public register(elementId: string, name: string): void {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`DraggablePositioner: Element #${elementId} not found`);
            return;
        }

        this.activeElements.set(elementId, {
            element,
            name,
            originalStyles: {
                left: element.style.left,
                right: element.style.right,
                top: element.style.top,
                cursor: element.style.cursor
            }
        });
    }

    /**
     * Enable dragging mode
     */
    public enable(): void {
        this.isEnabled = true;

        this.activeElements.forEach((item) => {
            item.element.style.cursor = 'move';
            item.element.style.outline = '3px dashed #d4af37';
            item.element.addEventListener('mousedown', this.handleMouseDown);
        });

        if (this.coordsDisplay) {
            this.coordsDisplay.style.display = 'block';
        }

        console.log('🎯 Position editing mode enabled. Drag elements to reposition.');
    }

    /**
     * Disable dragging mode
     */
    public disable(): void {
        this.isEnabled = false;

        this.activeElements.forEach((item) => {
            item.element.style.cursor = item.originalStyles.cursor;
            item.element.style.outline = '';
            item.element.removeEventListener('mousedown', this.handleMouseDown);
        });

        if (this.coordsDisplay) {
            this.coordsDisplay.style.display = 'none';
        }

        console.log('Position editing mode disabled.');
    }

    /**
     * Toggle dragging mode
     */
    public toggle(): void {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    private handleMouseDown = (e: MouseEvent): void => {
        const target = e.currentTarget as HTMLElement;
        const item = Array.from(this.activeElements.values()).find(i => i.element === target);

        if (!item) return;

        this.currentDragging = item;
        const rect = target.getBoundingClientRect();
        this.offsetX = e.clientX - rect.left;
        this.offsetY = e.clientY - rect.top;

        e.preventDefault();
    };

    private setupGlobalListeners(): void {
        document.addEventListener('mousemove', (e: MouseEvent) => {
            if (!this.currentDragging) return;

            const newLeft = e.clientX - this.offsetX;
            const newTop = e.clientY - this.offsetY;

            const el = this.currentDragging.element;
            el.style.left = `${newLeft}px`;
            el.style.right = 'auto';
            el.style.top = `${newTop}px`;
            el.style.transform = 'none';

            this.updateCoordsDisplay(this.currentDragging.name, newLeft, newTop, el.offsetWidth, el.offsetHeight);
        });

        document.addEventListener('mouseup', () => {
            this.currentDragging = null;
        });
    }

    private updateCoordsDisplay(name: string, left: number, top: number, width: number, height: number): void {
        const coordsInfo = document.getElementById('coords-info');
        if (coordsInfo) {
            const centerY = top + height / 2;
            const centerFromBottom = window.innerHeight - (top + height);

            coordsInfo.innerHTML = `
                <div style="color: #fbbf24; font-weight: bold;">${name}</div>
                <div style="margin-top: 8px;">
                    <span style="color: #9ca3af;">left:</span> <span style="color: #22c55e;">${Math.round(left)}px</span> | 
                    <span style="color: #9ca3af;">top:</span> <span style="color: #22c55e;">${Math.round(top)}px</span>
                </div>
                <div style="margin-top: 4px; font-size: 12px; color: #6b7280;">
                    מרכז אנכי: ${Math.round(centerY)}px | מרחק מתחתית: ${Math.round(centerFromBottom)}px
                </div>
            `;
        }
    }

    private savePositions(): void {
        const positions: Record<string, { left: number; top: number }> = {};

        this.activeElements.forEach((item, id) => {
            const rect = item.element.getBoundingClientRect();
            positions[id] = {
                left: Math.round(rect.left),
                top: Math.round(rect.top)
            };
        });

        // Log to console for developer to copy
        console.log('📋 Copy these CSS values:');
        console.log('='.repeat(50));

        this.activeElements.forEach((item, id) => {
            const rect = item.element.getBoundingClientRect();
            console.log(`/* ${item.name} */`);
            console.log(`#${id} {`);
            console.log(`    left: ${Math.round(rect.left)}px;`);
            console.log(`    top: ${Math.round(rect.top)}px;`);
            console.log(`    transform: none;`);
            console.log(`}`);
            console.log('');
        });

        // Store in localStorage for persistence
        localStorage.setItem('element-positions', JSON.stringify(positions));

        // Show toast notification
        if ((window as any).showToast) {
            (window as any).showToast('מיקומים נשמרו! ראה Console להעתקת CSS', 'success');
        }
    }

    /**
     * Load saved positions from localStorage
     */
    public loadSavedPositions(): void {
        const saved = localStorage.getItem('element-positions');
        if (!saved) return;

        try {
            const positions = JSON.parse(saved);

            Object.entries(positions).forEach(([id, pos]: [string, any]) => {
                const el = document.getElementById(id);
                if (el) {
                    el.style.left = `${pos.left}px`;
                    el.style.top = `${pos.top}px`;
                    el.style.right = 'auto';
                    el.style.transform = 'none';
                }
            });

            console.log('✅ Loaded saved element positions');
        } catch (e) {
            console.warn('Failed to load saved positions', e);
        }
    }
}

// Create global instance
let positioner: DraggablePositioner | null = null;

export function initDraggablePositioner(): DraggablePositioner {
    if (!positioner) {
        positioner = new DraggablePositioner();

        // Register elements
        positioner.register('ability-scroll-panel', 'מגילת יכולות');
        positioner.register('sticky-note', 'מגילת פרטים');

        // Clear any saved positions that might interfere with CSS
        localStorage.removeItem('element-positions');

        // Expose toggle function globally for Debug menu
        (window as any).togglePositionMode = () => positioner?.toggle();

        // Expose reset function
        (window as any).resetElementPositions = () => {
            localStorage.removeItem('element-positions');
            location.reload();
        };
    }
    return positioner;
}

export default DraggablePositioner;
