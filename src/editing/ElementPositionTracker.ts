/**
 * ElementPositionTracker - Tracks exact positions of rendered elements
 * Updated by renderers, read by DirectEditManager
 */

export interface ElementPosition {
    x: number;      // Center X
    y: number;      // Center Y (the actual draw position)
    width: number;  // Text width or element width
    height: number; // Approximate height (font size based)
    visible: boolean; // Whether element is currently rendered
}

export type ElementId = 'name' | 'type' | 'rarity' | 'coreStats' | 'stats' | 'gold' | 'image' | 'specialDamage' | 'spellAbility';

class ElementPositionTrackerClass {
    private positions: Map<ElementId, ElementPosition> = new Map();
    private listeners: Set<() => void> = new Set();

    /**
     * Update an element's position (called by renderers)
     */
    setPosition(id: ElementId, position: Partial<ElementPosition>): void {
        const current = this.positions.get(id) || { x: 0, y: 0, width: 0, height: 0, visible: false };
        this.positions.set(id, { ...current, ...position, visible: true });
    }

    /**
     * Get an element's current position
     */
    getPosition(id: ElementId): ElementPosition | undefined {
        return this.positions.get(id);
    }

    /**
     * Get all tracked positions
     */
    getAllPositions(): Map<ElementId, ElementPosition> {
        return new Map(this.positions);
    }

    /**
     * Clear all positions (called before re-render)
     */
    clear(): void {
        this.positions.forEach(pos => pos.visible = false);
    }

    /**
     * Mark an element as not visible
     */
    hide(id: ElementId): void {
        const pos = this.positions.get(id);
        if (pos) pos.visible = false;
    }

    /**
     * Subscribe to position updates
     */
    subscribe(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify listeners of updates
     */
    notifyUpdate(): void {
        this.listeners.forEach(cb => cb());
    }

    /**
     * Debug: log all positions
     */
    debug(): void {
        console.log('📍 Element Positions:');
        this.positions.forEach((pos, id) => {
            if (pos.visible) {
                console.log(`  ${id}: x=${pos.x.toFixed(0)}, y=${pos.y.toFixed(0)}, w=${pos.width.toFixed(0)}, h=${pos.height.toFixed(0)}`);
            }
        });
    }
}

// Singleton instance
export const ElementPositionTracker = new ElementPositionTrackerClass();

// Expose globally for debugging
(window as any).ElementPositionTracker = ElementPositionTracker;
