/**
 * Storage Service using idb library
 * Modern wrapper around IndexedDB for card and folder persistence
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { HistoryItem } from '../../types';

const DB_NAME = 'DndCardCreatorDB';
const DB_VERSION = 2;
const CARDS_STORE = 'cards';
const FOLDERS_STORE = 'folders';

export interface Folder {
    id: string;
    name: string;
}

export interface ExportData {
    version: number;
    exportedAt: string;
    cards: HistoryItem[];
}

/**
 * Initialize and get database instance
 */
async function getDB(): Promise<IDBPDatabase> {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion) {
            // Cards Store
            if (!db.objectStoreNames.contains(CARDS_STORE)) {
                const store = db.createObjectStore(CARDS_STORE, { keyPath: 'id' });
                store.createIndex('savedAt', 'savedAt', { unique: false });
                store.createIndex('folder', 'folder', { unique: false });
                console.log(`[StorageService] Created '${CARDS_STORE}' store`);
            } else if (oldVersion < 2) {
                // Upgrade: add folder index if missing
                const tx = (db as any).transaction;
                if (tx) {
                    const store = tx.objectStore(CARDS_STORE);
                    if (!store.indexNames.contains('folder')) {
                        store.createIndex('folder', 'folder', { unique: false });
                        console.log('[StorageService] Added folder index');
                    }
                }
            }

            // Folders Store
            if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
                db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
                console.log(`[StorageService] Created '${FOLDERS_STORE}' store`);
            }
        },
    });
}

/**
 * Storage Service Class
 */
export class StorageService {
    private dbPromise: Promise<IDBPDatabase>;

    constructor() {
        this.dbPromise = getDB();
    }

    /**
     * Check if storage is available
     */
    async isAvailable(): Promise<boolean> {
        try {
            const db = await this.dbPromise;
            return !!db;
        } catch (e) {
            console.error('[StorageService] IndexedDB unavailable:', e);
            return false;
        }
    }

    // ==================== CARD OPERATIONS ====================

    /**
     * Save a card to the database
     */
    async saveCard(card: HistoryItem): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.put(CARDS_STORE, card);
            console.log(`[StorageService] Card saved (ID: ${card.id})`);
        } catch (error) {
            console.error('[StorageService] Failed to save card:', error);
            throw error;
        }
    }

    /**
     * Get all cards from the database
     */
    async getAllCards(): Promise<HistoryItem[]> {
        try {
            const db = await this.dbPromise;
            const cards = await db.getAll(CARDS_STORE);

            // Sort by date descending
            cards.sort((a, b) => {
                const dateA = new Date(a.savedAt).getTime();
                const dateB = new Date(b.savedAt).getTime();
                return dateB - dateA;
            });

            return cards;
        } catch (error) {
            console.error('[StorageService] Failed to get cards:', error);
            return [];
        }
    }

    /**
     * Get a single card by ID
     */
    async getCard(id: number): Promise<HistoryItem | undefined> {
        try {
            const db = await this.dbPromise;
            return await db.get(CARDS_STORE, id);
        } catch (error) {
            console.error('[StorageService] Failed to get card:', error);
            return undefined;
        }
    }

    /**
     * Delete a card by ID
     */
    async deleteCard(id: number): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.delete(CARDS_STORE, id);
            console.log(`[StorageService] Card deleted (ID: ${id})`);
        } catch (error) {
            console.error('[StorageService] Failed to delete card:', error);
            throw error;
        }
    }

    /**
     * Delete multiple cards
     */
    async deleteCards(ids: number[]): Promise<void> {
        try {
            const db = await this.dbPromise;
            const tx = db.transaction(CARDS_STORE, 'readwrite');

            await Promise.all(ids.map(id => tx.store.delete(id)));
            await tx.done;

            console.log(`[StorageService] Deleted ${ids.length} cards`);
        } catch (error) {
            console.error('[StorageService] Failed to delete cards:', error);
            throw error;
        }
    }

    /**
     * Clear all cards
     */
    async clearAll(): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.clear(CARDS_STORE);
            console.log('[StorageService] All cards cleared');
        } catch (error) {
            console.error('[StorageService] Failed to clear cards:', error);
            throw error;
        }
    }

    // ==================== FOLDER OPERATIONS ====================

    /**
     * Save a folder
     */
    async saveFolder(folder: Folder): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.put(FOLDERS_STORE, folder);
            console.log(`[StorageService] Folder saved: ${folder.name}`);
        } catch (error) {
            console.error('[StorageService] Failed to save folder:', error);
            throw error;
        }
    }

    /**
     * Get all folders
     */
    async getAllFolders(): Promise<Folder[]> {
        try {
            const db = await this.dbPromise;
            return await db.getAll(FOLDERS_STORE);
        } catch (error) {
            console.error('[StorageService] Failed to get folders:', error);
            return [];
        }
    }

    /**
     * Delete a folder
     */
    async deleteFolder(id: string): Promise<void> {
        try {
            const db = await this.dbPromise;
            await db.delete(FOLDERS_STORE, id);
            console.log(`[StorageService] Folder deleted: ${id}`);
        } catch (error) {
            console.error('[StorageService] Failed to delete folder:', error);
            throw error;
        }
    }

    /**
     * Get cards in a specific folder
     */
    async getCardsByFolder(folderId: string): Promise<HistoryItem[]> {
        try {
            const db = await this.dbPromise;
            const index = db.transaction(CARDS_STORE).store.index('folder');
            const cards = await index.getAll(folderId);

            // Sort by date descending
            cards.sort((a, b) => {
                const dateA = new Date(a.savedAt).getTime();
                const dateB = new Date(b.savedAt).getTime();
                return dateB - dateA;
            });

            return cards;
        } catch (error) {
            console.error('[StorageService] Failed to get cards by folder:', error);
            return [];
        }
    }

    // ==================== IMPORT/EXPORT ====================

    /**
     * Export all data as JSON
     */
    async exportData(): Promise<string> {
        try {
            const cards = await this.getAllCards();
            const exportData: ExportData = {
                version: DB_VERSION,
                exportedAt: new Date().toISOString(),
                cards
            };
            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('[StorageService] Failed to export data:', error);
            throw error;
        }
    }

    /**
     * Import data from JSON
     * @param jsonString - JSON string to import
     * @param merge - If true, merge with existing data. If false, replace all data.
     * @returns Number of cards imported
     */
    async importData(jsonString: string, merge: boolean = true): Promise<number> {
        try {
            const data = JSON.parse(jsonString) as ExportData;

            if (!data.cards || !Array.isArray(data.cards)) {
                throw new Error("Invalid format: 'cards' array missing");
            }

            if (!merge) {
                await this.clearAll();
            }

            const db = await this.dbPromise;
            const tx = db.transaction(CARDS_STORE, 'readwrite');

            let imported = 0;
            for (const card of data.cards) {
                if (card.id && card.cardData) {
                    await tx.store.put(card);
                    imported++;
                }
            }

            await tx.done;
            console.log(`[StorageService] Imported ${imported} cards`);
            return imported;
        } catch (error) {
            console.error('[StorageService] Failed to import data:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const storageService = new StorageService();
