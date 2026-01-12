/**
 * EventBus - Centralized event management system
 * Replaces scattered document.dispatchEvent calls with a unified pub/sub pattern
 */

import { Logger } from './Logger';

export class EventBus {
    private events: Map<string, Set<Function>>;
    private debug: boolean;

    constructor() {
        this.events = new Map();

        // Debug mode - log all events in development
        this.debug = (import.meta as any).env?.DEV || false;
    }

    /**
     * Subscribe to an event
     */
    on(event: string, callback: Function): () => void {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event)!.add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event once
     */
    once(event: string, callback: Function): void {
        const wrapper = (data: any) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback: Function): void {
        if (this.events.has(event)) {
            this.events.get(event)!.delete(callback);
        }
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event: string, data: any = null): void {
        if (this.debug) {
            Logger.debug('EventBus', `Event: ${event}`, data);
        }

        if (this.events.has(event)) {
            this.events.get(event)!.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    Logger.error('EventBus', `Error in event handler for "${event}"`, error as Error);
                }
            });
        }
    }

    /**
     * Clear all subscriptions for an event
     */
    clear(event?: string): void {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
        }
    }

    /**
     * Get list of all registered events (for debugging)
     */
    getRegisteredEvents(): string[] {
        return Array.from(this.events.keys());
    }
}

// Singleton instance
export const eventBus = new EventBus();

// Expose for debugging
(window as any).eventBus = eventBus;

// Event name constants (for type-safe event handling)
export const EVENTS = {
    // Card lifecycle
    CARD_GENERATED: 'card-generated',
    CARD_SAVED: 'card-saved',
    CARD_LOADED: 'card-loaded',
    CARD_DELETED: 'card-deleted',

    // Generation
    GENERATE_START: 'generate-start',
    GENERATE_PROGRESS: 'generate-progress',
    GENERATE_COMPLETE: 'generate-complete',
    GENERATE_ERROR: 'generate-error',

    // Character sheet
    EQUIP_ITEM: 'equip-item',
    UNEQUIP_ITEM: 'unequip-item',
    AUTO_EQUIP_START: 'auto-equip-start',
    AUTO_EQUIP_PROGRESS: 'auto-equip-progress',
    AUTO_EQUIP_COMPLETE: 'auto-equip-complete',

    // Navigation
    TAB_CHANGED: 'tab-changed',
    LOCALE_CHANGED: 'locale-changed',

    // UI
    TOAST_SHOW: 'toast-show',
    MODAL_OPEN: 'modal-open',
    MODAL_CLOSE: 'modal-close'
} as const;

export default eventBus;
