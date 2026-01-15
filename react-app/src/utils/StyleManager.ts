/**
 * StyleManager
 * 
 * Manages Style Templates validation, storage, and retrieval.
 * Interacts with AssetStore to offload heavy image data.
 */

import type { AppSettings } from '../types';
import { assetStore } from './AssetStore';
import { Logger } from './Logger';

export interface StyleTemplate {
    id: string;
    name: string;
    settings: AppSettings;
    backgroundId?: string; // ID in AssetStore
    createdAt: number;
}

const STORAGE_KEY = 'dnd_style_templates';

class StyleManager {

    /**
     * Get all saved styles
     */
    getStyles(): StyleTemplate[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            Logger.error('StyleManager', 'Failed to load styles', e);
            return [];
        }
    }

    /**
     * Save a new style
     * Automatically handles background image offloading to AssetStore
     */
    async saveStyle(name: string, settings: AppSettings, currentCardBackgroundUrl?: string | null): Promise<StyleTemplate> {
        const styles = this.getStyles();

        // Deep copy settings to avoid reference issues
        const settingsToSave = JSON.parse(JSON.stringify(settings));

        let backgroundId: string | undefined;

        // Handle Background Image
        // If the current settings use a local blob URL for background, we need to save it
        // Note: The 'backgroundUrl' usually comes from CardData, but for styles we might want to stash it 
        // if the user considers the background part of the "Style". 
        // IN THIS APP: Background Image is technically part of CardData, but often defines the "Style".
        // WE WILL SUPPORT SAVING IT.

        if (currentCardBackgroundUrl && currentCardBackgroundUrl.startsWith('blob:')) {
            try {
                Logger.info('StyleManager', 'Processing background image for style...');
                const response = await fetch(currentCardBackgroundUrl);
                const blob = await response.blob();
                backgroundId = await assetStore.saveImage(blob, 'background');
                Logger.info('StyleManager', 'Background image saved to AssetStore', backgroundId);
            } catch (e) {
                Logger.error('StyleManager', 'Failed to save background image', e);
                // Continue without background if it fails
            }
        }

        const newStyle: StyleTemplate = {
            id: crypto.randomUUID(),
            name,
            settings: settingsToSave,
            backgroundId,
            createdAt: Date.now()
        };

        styles.push(newStyle);
        this.persist(styles);

        return newStyle;
    }

    /**
     * Delete a style
     */
    deleteStyle(id: string): void {
        const styles = this.getStyles();
        const style = styles.find(s => s.id === id);
        if (style) {
            // Future idea: decrement ref count in AssetStore?
        }

        const filtered = styles.filter(s => s.id !== id);
        this.persist(filtered);
    }

    /**
     * Apply a style
     * Returns the Settings object and optionally the resolved background Blob URL
     */
    async resolveStyle(style: StyleTemplate): Promise<{ settings: AppSettings, backgroundBlobUrl?: string }> {
        let backgroundBlobUrl: string | undefined;

        if (style.backgroundId) {
            try {
                const blob = await assetStore.getImage(style.backgroundId);
                if (blob) {
                    backgroundBlobUrl = URL.createObjectURL(blob);
                }
            } catch (e) {
                Logger.error('StyleManager', 'Failed to resolve background image', e);
            }
        }

        return {
            settings: style.settings,
            backgroundBlobUrl
        };
    }

    private persist(styles: StyleTemplate[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(styles));
        } catch (e) {
            Logger.error('StyleManager', 'Failed to save styles to localStorage', e);
            throw e;
        }
    }
}

export const styleManager = new StyleManager();
