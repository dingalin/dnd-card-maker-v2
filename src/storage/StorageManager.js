export class StorageManager {
    constructor(dbName = 'DndCardCreatorDB', storeName = 'cards') {
        this.dbName = dbName;
        this.storeName = storeName;
        this.version = 2; // Increment version for schema change
        this.db = null;
        this.initFailed = false;
        this.initPromise = this.init();
    }

    async init(retryAfterDelete = false) {
        return new Promise((resolve, reject) => {
            // Check if IndexedDB is available
            if (!window.indexedDB) {
                console.warn("StorageManager: IndexedDB not available in this browser.");
                this.initFailed = true;
                resolve(null);
                return;
            }

            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Cards Store
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('savedAt', 'savedAt', { unique: false });
                    store.createIndex('folder', 'folder', { unique: false }); // Index by folder
                    console.log(`StorageManager: Object store '${this.storeName}' created.`);
                } else {
                    // Upgrade existing store to add index if missing
                    try {
                        const store = request.transaction.objectStore(this.storeName);
                        if (!store.indexNames.contains('folder')) {
                            store.createIndex('folder', 'folder', { unique: false });
                        }
                    } catch (e) {
                        console.warn("StorageManager: Could not upgrade store:", e.message);
                    }
                }

                // Folders Store
                if (!db.objectStoreNames.contains('folders')) {
                    const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
                    console.log("StorageManager: 'folders' store created.");
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.initFailed = false;
                console.log("StorageManager: IndexedDB connected successfully.");
                resolve(this.db);
            };

            request.onerror = (event) => {
                const error = event.target.error;
                const errorName = error?.name || 'Unknown';
                const errorMessage = error?.message || 'No message';
                console.error(`StorageManager: Failed to open IndexedDB - ${errorName}: ${errorMessage}`);

                // If this is first attempt and it failed, try to delete and recreate
                if (!retryAfterDelete) {
                    console.warn("StorageManager: Attempting to delete corrupted database and retry...");
                    const deleteRequest = indexedDB.deleteDatabase(this.dbName);
                    deleteRequest.onsuccess = () => {
                        console.log("StorageManager: Old database deleted, retrying...");
                        this.init(true).then(resolve).catch(reject);
                    };
                    deleteRequest.onerror = () => {
                        console.error("StorageManager: Could not delete database. Storage may be corrupted.");
                        this.initFailed = true;
                        resolve(null); // Resolve with null to allow app to continue
                    };
                    deleteRequest.onblocked = () => {
                        console.warn("StorageManager: Database delete blocked. Close other tabs and refresh.");
                        this.initFailed = true;
                        resolve(null);
                    };
                } else {
                    console.error("StorageManager: Database recovery failed. Gallery features will be unavailable.");
                    this.initFailed = true;
                    resolve(null); // Resolve with null to allow app to continue without storage
                }
            };

            request.onblocked = () => {
                console.warn("StorageManager: Database upgrade blocked. Please close other tabs using this app.");
            };
        });
    }

    /**
     * Check if storage is available
     */
    isAvailable() {
        return this.db !== null && !this.initFailed;
    }

    /**
     * Save a card to the database
     * @param {Object} cardData - The full card object (must have 'id')
     * @returns {Promise<void>}
     */
    async saveCard(cardData) {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot save - database unavailable');
            return;
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(cardData); // put updates or inserts

            request.onsuccess = () => {
                console.log(`StorageManager: Card saved (ID: ${cardData.id})`);
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Get all cards from the database
     * @returns {Promise<Array>} Sorted by date descending (newest first)
     */
    async getAllCards() {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot get cards - database unavailable');
            return [];
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                let items = request.result;
                // Sort by date descending
                items.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
                resolve(items);
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Delete a card by ID
     * @param {number} id 
     * @returns {Promise<void>}
     */
    async deleteCard(id) {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot delete - database unavailable');
            return;
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log(`StorageManager: Card deleted (ID: ${id})`);
                resolve();
            };

            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Delete multiple cards
     * @param {Array<number>} ids 
     */
    async deleteCards(ids) {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot delete cards - database unavailable');
            return;
        }
        if (!ids || ids.length === 0) {
            return;
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            let count = 0;
            let errorOccurred = false;

            ids.forEach(id => {
                const req = store.delete(id);
                req.onsuccess = () => {
                    count++;
                    if (count === ids.length) resolve();
                };
                req.onerror = (e) => {
                    if (!errorOccurred) {
                        errorOccurred = true;
                        reject(e.target.error);
                    }
                };
            });
        });
    }

    /**
     * Clear all data
     */
    async clearAll() {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot clear - database unavailable');
            return;
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Save a specific folder
     * @param {Object} folder { id: string, name: string }
     */
    async saveFolder(folder) {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot save folder - database unavailable');
            return;
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders'], 'readwrite');
            const store = tx.objectStore('folders');
            const req = store.put(folder);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async getAllFolders() {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot get folders - database unavailable');
            return [];
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders'], 'readonly');
            const store = tx.objectStore('folders');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = (e) => reject(e.target.error);
        });
    }

    async deleteFolder(id) {
        await this.initPromise;
        if (!this.isAvailable()) {
            console.warn('StorageManager: Cannot delete folder - database unavailable');
            return;
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['folders'], 'readwrite');
            const store = tx.objectStore('folders');
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = (e) => reject(e.target.error);
        });
    }

    /**
     * Export all data as JSON string
     */
    async exportData() {
        const cards = await this.getAllCards();
        const exportObj = {
            version: this.version,
            exportedAt: new Date().toISOString(),
            cards: cards
        };
        return JSON.stringify(exportObj, null, 2);
    }

    /**
     * Import data from JSON string
     * @param {string} jsonString 
     * @param {boolean} merge - If true, keeps existing cards. If false, clears DB first.
     */
    async importData(jsonString, merge = true) {
        try {
            const data = JSON.parse(jsonString);
            if (!data.cards || !Array.isArray(data.cards)) {
                throw new Error("Invalid format: 'cards' array missing");
            }

            if (!merge) {
                await this.clearAll();
            }

            let loaded = 0;
            for (const card of data.cards) {
                // validate minimal fields
                if (card.id && card.cardData) {
                    await this.saveCard(card);
                    loaded++;
                }
            }
            return loaded;
        } catch (e) {
            console.error("Import failed:", e);
            throw e;
        }
    }
}

export const storageManager = new StorageManager();
window.storageManager = storageManager;
