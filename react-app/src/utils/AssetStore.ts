/**
 * AssetStore
 * 
 * Manages storage of large binary assets (images) using IndexedDB.
 * This prevents localStorage quota exceeded errors by keeping heavy assets 
 * in a proper database optimized for files.
 */

import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import { Logger } from './Logger';

const DB_NAME = 'dnd-card-creator-assets';
const STORE_NAME = 'images';
const DB_VERSION = 2; // Bumped version for 'type' index

export type AssetType = 'item' | 'background';

export interface ImageAsset {
    id: string;      // Hash or UUID
    blob: Blob;      // The image data
    hash: string;    // SHA-256 hash for deduplication
    createdAt: number;
    type: AssetType; // NEW: Categorize assets
    meta?: Record<string, any>; // NEW: Optional metadata
    refs: number;    // Reference counting (how many styles use this?) - Future impl
}

class AssetStore {
    private dbPromise: Promise<IDBPDatabase>;

    constructor() {
        this.dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
                // V1 Initialization
                if (oldVersion < 1) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('hash', 'hash', { unique: false });
                    store.createIndex('createdAt', 'createdAt');
                }

                // V2 Migration: Add 'type' index
                if (oldVersion < 2) {
                    const store = transaction.objectStore(STORE_NAME);
                    if (!store.indexNames.contains('type')) {
                        store.createIndex('type', 'type', { unique: false });
                    }
                }
            },
        });
    }

    /**
     * Compute SHA-256 hash of a blob to detect duplicates
     */
    private async computeHash(blob: Blob): Promise<string> {
        const buffer = await blob.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    /**
     * Save an image to the store.
     * Checks for duplicates using hash.
     * Returns the Asset ID.
     */
    async saveImage(blob: Blob, type: AssetType, meta?: Record<string, any>): Promise<string> {
        try {
            const db = await this.dbPromise;
            const hash = await this.computeHash(blob);

            // Check for existing image with same hash
            const existingFromIndex = await db.getFromIndex(STORE_NAME, 'hash', hash);
            if (existingFromIndex) {
                Logger.debug('AssetStore', 'Duplicate image detected, reusing existing ID', existingFromIndex.id);

                // Optional: Update type/meta if needed for the existing asset? 
                // For now, let's just return the ID to avoid complexity.
                return existingFromIndex.id;
            }

            // Create new entry
            const id = crypto.randomUUID();
            const asset: ImageAsset = {
                id,
                blob,
                hash,
                createdAt: Date.now(),
                type,
                meta,
                refs: 1
            };

            await db.put(STORE_NAME, asset);
            Logger.info('AssetStore', 'Image saved successfully', id);
            return id;

        } catch (error) {
            Logger.error('AssetStore', 'Failed to save image', error);
            throw error;
        }
    }

    /**
     * Retrieve an image blob by ID
     */
    async getImage(id: string): Promise<Blob | null> {
        try {
            const db = await this.dbPromise;
            const asset = await db.get(STORE_NAME, id) as ImageAsset;

            if (!asset) {
                Logger.warn('AssetStore', 'Image not found', id);
                return null;
            }

            return asset.blob;
        } catch (error) {
            Logger.error('AssetStore', 'Failed to get image', error);
            return null;
        }
    }

    /**
     * Retrieve all assets, optionally filtered by type
     */
    async getAllAssets(type?: AssetType): Promise<ImageAsset[]> {
        try {
            const db = await this.dbPromise;
            if (type) {
                return await db.getAllFromIndex(STORE_NAME, 'type', type);
            } else {
                return await db.getAll(STORE_NAME);
            }
        } catch (error) {
            Logger.error('AssetStore', 'Failed to get all assets', error);
            return [];
        }
    }

    /**
     * Delete an image by ID
     */
    async deleteImage(id: string): Promise<void> {
        const db = await this.dbPromise;
        await db.delete(STORE_NAME, id);
    }

    /**
     * Clear all images (Dev util)
     */
    async clearAll(): Promise<void> {
        const db = await this.dbPromise;
        await db.clear(STORE_NAME);
    }
}

export const assetStore = new AssetStore();
