/**
 * FileCardLibrary - File System based Card Library
 * Uses Electron IPC for file operations when available,
 * falls back to IndexedDB when running in browser.
 */

import { Logger } from './Logger';

// Type definitions for Electron API
interface ElectronCardLibraryAPI {
    getLibraryPath: () => Promise<string>;
    initializeLibrary: () => Promise<{ success: boolean; path?: string; error?: string }>;
    saveMetadata: (data: LibraryData) => Promise<{ success: boolean; error?: string }>;
    loadMetadata: () => Promise<{ success: boolean; data?: LibraryData; error?: string }>;
    saveThumbnail: (cardId: string, side: string, dataUrl: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    loadThumbnail: (cardId: string, side: string) => Promise<{ success: boolean; dataUrl?: string; notFound?: boolean; error?: string }>;
    deleteThumbnails: (cardId: string) => Promise<{ success: boolean; error?: string }>;
    isElectron: boolean;
}

declare global {
    interface Window {
        electronAPI?: {
            cardLibrary: ElectronCardLibraryAPI;
        };
    }
}

// ============== DATA STRUCTURES ==============

export interface FileCardTemplate {
    id: string;
    name: string;
    folderId: string;
    cardData: any;  // CardData type
    settings: any;  // AppSettings type
    createdAt: number;
    sortOrder: number;
}

export interface CardFolder {
    id: string;
    name: string;
    color?: string;
    sortOrder: number;
}

interface LibraryData {
    templates: FileCardTemplate[];
    folders: CardFolder[];
}

const DEFAULT_FOLDER_ID = 'default';

// ============== FILE CARD LIBRARY CLASS ==============

class FileCardLibrary {
    private isElectron: boolean;
    private initialized: boolean = false;
    private cache: LibraryData | null = null;

    constructor() {
        this.isElectron = !!window.electronAPI?.cardLibrary?.isElectron;
        Logger.info('FileCardLibrary', `Running in ${this.isElectron ? 'Electron' : 'Browser'} mode`);
    }

    /**
     * Initialize library (creates folder structure)
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        if (this.isElectron) {
            const result = await window.electronAPI!.cardLibrary.initializeLibrary();
            if (result.success) {
                Logger.info('FileCardLibrary', 'Library initialized at:', result.path);
                this.initialized = true;
                return true;
            } else {
                Logger.error('FileCardLibrary', 'Failed to initialize:', result.error);
                return false;
            }
        }

        // Browser mode - no initialization needed
        this.initialized = true;
        return true;
    }

    /**
     * Load library data
     */
    private async loadData(): Promise<LibraryData> {
        if (this.cache) return this.cache;

        if (this.isElectron) {
            const result = await window.electronAPI!.cardLibrary.loadMetadata();
            if (result.success && result.data) {
                this.cache = result.data;
                return result.data;
            }
        }

        // Return default structure
        return {
            templates: [],
            folders: [{
                id: DEFAULT_FOLDER_ID,
                name: 'All Cards',
                sortOrder: 0
            }]
        };
    }

    /**
     * Save library data
     */
    private async saveData(data: LibraryData): Promise<boolean> {
        this.cache = data;

        if (this.isElectron) {
            const result = await window.electronAPI!.cardLibrary.saveMetadata(data);
            return result.success;
        }

        return true;
    }

    /**
     * Get all folders
     */
    async getFolders(): Promise<CardFolder[]> {
        const data = await this.loadData();

        // Ensure default folder exists
        if (!data.folders.some(f => f.id === DEFAULT_FOLDER_ID)) {
            data.folders.unshift({
                id: DEFAULT_FOLDER_ID,
                name: 'All Cards',
                sortOrder: 0
            });
        }

        return data.folders;
    }

    /**
     * Get templates (optionally filtered by folder)
     */
    async getTemplates(folderId?: string): Promise<FileCardTemplate[]> {
        const data = await this.loadData();

        if (!folderId || folderId === 'all') {
            return data.templates;
        }

        return data.templates.filter(t => t.folderId === folderId);
    }

    /**
     * Save template with thumbnails
     */
    async saveTemplate(
        name: string,
        cardData: any,
        settings: any,
        thumbnailFront?: string,
        thumbnailBack?: string,
        folderId: string = DEFAULT_FOLDER_ID
    ): Promise<FileCardTemplate> {
        await this.initialize();
        const data = await this.loadData();

        const template: FileCardTemplate = {
            id: crypto.randomUUID(),
            name,
            folderId,
            cardData: JSON.parse(JSON.stringify(cardData)),
            settings: JSON.parse(JSON.stringify(settings)),
            createdAt: Date.now(),
            sortOrder: data.templates.length
        };

        // Save thumbnails to file system
        if (this.isElectron) {
            if (thumbnailFront) {
                await window.electronAPI!.cardLibrary.saveThumbnail(template.id, 'front', thumbnailFront);
            }
            if (thumbnailBack) {
                await window.electronAPI!.cardLibrary.saveThumbnail(template.id, 'back', thumbnailBack);
            }
        }

        data.templates.push(template);
        await this.saveData(data);

        Logger.info('FileCardLibrary', 'Template saved:', template.id);
        return template;
    }

    /**
     * Load thumbnail for a template
     */
    async loadThumbnail(cardId: string, side: 'front' | 'back'): Promise<string | null> {
        if (!this.isElectron) return null;

        const result = await window.electronAPI!.cardLibrary.loadThumbnail(cardId, side);
        if (result.success && result.dataUrl) {
            return result.dataUrl;
        }
        return null;
    }

    /**
     * Delete a template
     */
    async deleteTemplate(id: string): Promise<void> {
        const data = await this.loadData();
        data.templates = data.templates.filter(t => t.id !== id);
        await this.saveData(data);

        // Delete thumbnail files
        if (this.isElectron) {
            await window.electronAPI!.cardLibrary.deleteThumbnails(id);
        }

        Logger.info('FileCardLibrary', 'Template deleted:', id);
    }

    /**
     * Create a folder
     */
    async createFolder(name: string): Promise<CardFolder> {
        const data = await this.loadData();

        const folder: CardFolder = {
            id: crypto.randomUUID(),
            name,
            sortOrder: data.folders.length
        };

        data.folders.push(folder);
        await this.saveData(data);

        return folder;
    }

    /**
     * Delete a folder
     */
    async deleteFolder(id: string): Promise<void> {
        if (id === DEFAULT_FOLDER_ID) return;

        const data = await this.loadData();

        // Move cards to default folder
        data.templates.forEach(t => {
            if (t.folderId === id) {
                t.folderId = DEFAULT_FOLDER_ID;
            }
        });

        data.folders = data.folders.filter(f => f.id !== id);
        await this.saveData(data);
    }

    /**
     * Move template to folder
     */
    async moveToFolder(templateId: string, folderId: string): Promise<void> {
        const data = await this.loadData();
        const template = data.templates.find(t => t.id === templateId);
        if (template) {
            template.folderId = folderId;
            await this.saveData(data);
        }
    }

    /**
     * Check if running in Electron
     */
    isFileSystemAvailable(): boolean {
        return this.isElectron;
    }

    /**
     * Clear cache (for refresh)
     */
    clearCache(): void {
        this.cache = null;
    }
}

export const fileCardLibrary = new FileCardLibrary();
