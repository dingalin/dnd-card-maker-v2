/**
 * CardLibraryManager - IndexedDB Version
 * 
 * Stores EVERYTHING in IndexedDB (like legacy version):
 * - Templates with full card data
 * - High-resolution thumbnails (no compression!)
 * - Folders
 * 
 * NO localStorage usage = NO quota issues!
 */

import type { CardData, AppSettings } from '../types';
import { Logger } from './Logger';

// ============== DATA STRUCTURES ==============

export interface CardTemplate {
    id: string;
    name: string;
    folderId: string;
    cardData: CardData;
    settings: AppSettings;
    thumbnailFront?: string;  // Full resolution base64
    thumbnailBack?: string;   // Full resolution base64
    createdAt: number;
    sortOrder: number;
}

export interface CardFolder {
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
}



const DB_NAME = 'DndCardLibraryDB';
const DB_VERSION = 1;
const TEMPLATES_STORE = 'templates';
const FOLDERS_STORE = 'folders';
const DEFAULT_FOLDER_ID = 'default';

// ============== MANAGER CLASS ==============

class CardLibraryManager {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<IDBDatabase | null>;

    constructor() {
        this.initPromise = this.initDB();
    }

    // ---------- DATABASE INIT ----------

    private async initDB(): Promise<IDBDatabase | null> {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                Logger.warn('CardLibrary', 'IndexedDB not available');
                resolve(null);
                return;
            }

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Templates store
                if (!db.objectStoreNames.contains(TEMPLATES_STORE)) {
                    const store = db.createObjectStore(TEMPLATES_STORE, { keyPath: 'id' });
                    store.createIndex('folderId', 'folderId', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }

                // Folders store
                if (!db.objectStoreNames.contains(FOLDERS_STORE)) {
                    db.createObjectStore(FOLDERS_STORE, { keyPath: 'id' });
                }

                Logger.info('CardLibrary', 'Database created/upgraded');
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                Logger.info('CardLibrary', 'Database connected');
                resolve(this.db);
            };

            request.onerror = () => {
                Logger.error('CardLibrary', 'Failed to open database');
                resolve(null);
            };
        });
    }

    private async getDB(): Promise<IDBDatabase | null> {
        if (this.db) return this.db;
        return this.initPromise;
    }

    // ---------- FOLDERS ----------

    async getFolders(): Promise<CardFolder[]> {
        const db = await this.getDB();
        if (!db) return this.getDefaultFolders();

        return new Promise((resolve) => {
            const tx = db.transaction([FOLDERS_STORE], 'readonly');
            const store = tx.objectStore(FOLDERS_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                let folders = request.result as CardFolder[];
                // Ensure default folder exists
                if (!folders.some(f => f.id === DEFAULT_FOLDER_ID)) {
                    folders.unshift({ id: DEFAULT_FOLDER_ID, name: 'All Cards', sortOrder: 0 });
                }
                resolve(folders.sort((a, b) => a.sortOrder - b.sortOrder));
            };

            request.onerror = () => resolve(this.getDefaultFolders());
        });
    }

    private getDefaultFolders(): CardFolder[] {
        return [{ id: DEFAULT_FOLDER_ID, name: 'All Cards', sortOrder: 0 }];
    }

    async createFolder(name: string, color?: string): Promise<CardFolder> {
        const db = await this.getDB();
        const folders = await this.getFolders();

        const newFolder: CardFolder = {
            id: crypto.randomUUID(),
            name,
            color,
            sortOrder: folders.length
        };

        if (db) {
            await new Promise<void>((resolve) => {
                const tx = db.transaction([FOLDERS_STORE], 'readwrite');
                tx.objectStore(FOLDERS_STORE).put(newFolder);
                tx.oncomplete = () => resolve();
            });
        }

        return newFolder;
    }

    async deleteFolder(id: string): Promise<void> {
        if (id === DEFAULT_FOLDER_ID) return;

        const db = await this.getDB();
        if (!db) return;

        // Move templates to default folder
        const templates = await this.getTemplates(id);
        for (const t of templates) {
            t.folderId = DEFAULT_FOLDER_ID;
            await this.updateTemplate(t);
        }

        // Delete folder
        await new Promise<void>((resolve) => {
            const tx = db.transaction([FOLDERS_STORE], 'readwrite');
            tx.objectStore(FOLDERS_STORE).delete(id);
            tx.oncomplete = () => resolve();
        });
    }

    // ---------- TEMPLATES ----------

    async getTemplates(folderId?: string): Promise<CardTemplate[]> {
        const db = await this.getDB();
        if (!db) return [];

        return new Promise((resolve) => {
            const tx = db.transaction([TEMPLATES_STORE], 'readonly');
            const store = tx.objectStore(TEMPLATES_STORE);
            const request = store.getAll();

            request.onsuccess = () => {
                let templates = request.result as CardTemplate[];
                if (folderId && folderId !== 'all') {
                    templates = templates.filter(t => t.folderId === folderId);
                }
                resolve(templates.sort((a, b) => b.createdAt - a.createdAt));
            };

            request.onerror = () => resolve([]);
        });
    }

    async saveTemplate(
        name: string,
        cardData: CardData,
        settings: AppSettings,
        thumbnailFront?: string,
        thumbnailBack?: string,
        folderId: string = DEFAULT_FOLDER_ID
    ): Promise<CardTemplate> {
        const db = await this.getDB();
        const templates = await this.getTemplates();

        const template: CardTemplate = {
            id: crypto.randomUUID(),
            name,
            folderId,
            cardData: JSON.parse(JSON.stringify(cardData)),
            settings: JSON.parse(JSON.stringify(settings)),
            thumbnailFront,  // Full resolution - no compression!
            thumbnailBack,   // Full resolution - no compression!
            createdAt: Date.now(),
            sortOrder: templates.length
        };

        if (db) {
            await new Promise<void>((resolve, reject) => {
                const tx = db.transaction([TEMPLATES_STORE], 'readwrite');
                tx.objectStore(TEMPLATES_STORE).put(template);
                tx.oncomplete = () => {
                    Logger.info('CardLibrary', 'Template saved:', template.id);
                    resolve();
                };
                tx.onerror = () => reject(tx.error);
            });
        }

        return template;
    }

    async updateTemplate(template: CardTemplate): Promise<void> {
        const db = await this.getDB();
        if (!db) return;

        await new Promise<void>((resolve) => {
            const tx = db.transaction([TEMPLATES_STORE], 'readwrite');
            tx.objectStore(TEMPLATES_STORE).put(template);
            tx.oncomplete = () => resolve();
        });
    }

    async deleteTemplate(id: string): Promise<void> {
        const db = await this.getDB();
        if (!db) return;

        await new Promise<void>((resolve) => {
            const tx = db.transaction([TEMPLATES_STORE], 'readwrite');
            tx.objectStore(TEMPLATES_STORE).delete(id);
            tx.oncomplete = () => {
                Logger.info('CardLibrary', 'Template deleted:', id);
                resolve();
            };
        });
    }

    async deleteTemplates(ids: string[]): Promise<void> {
        for (const id of ids) {
            await this.deleteTemplate(id);
        }
    }

    async moveToFolder(templateId: string, folderId: string): Promise<void> {
        const db = await this.getDB();
        if (!db) return;

        const templates = await this.getTemplates();
        const template = templates.find(t => t.id === templateId);
        if (template) {
            template.folderId = folderId;
            await this.updateTemplate(template);
        }
    }

    // ---------- RESOLVE TEMPLATE (for applying) ----------

    async resolveTemplate(template: CardTemplate): Promise<{
        cardData: CardData;
        settings: AppSettings;
    }> {
        return {
            cardData: template.cardData,
            settings: template.settings
        };
    }
}

export const cardLibrary = new CardLibraryManager();
