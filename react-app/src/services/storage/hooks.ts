/**
 * Custom hook for IndexedDB storage operations
 * Provides React-friendly interface to StorageService
 */

import { useState, useEffect, useCallback } from 'react';
import { storageService } from './StorageService';
import type { HistoryItem } from '../../types';
import type { Folder } from './StorageService';

/**
 * Hook for managing card history
 */
export function useCardHistory() {
    const [cards, setCards] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadCards = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const allCards = await storageService.getAllCards();
            setCards(allCards);
        } catch (err) {
            setError(err as Error);
            console.error('[useCardHistory] Failed to load cards:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveCard = useCallback(async (card: HistoryItem) => {
        try {
            await storageService.saveCard(card);
            await loadCards(); // Refresh list
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [loadCards]);

    const deleteCard = useCallback(async (id: number) => {
        try {
            await storageService.deleteCard(id);
            await loadCards(); // Refresh list
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [loadCards]);

    const deleteMultiple = useCallback(async (ids: number[]) => {
        try {
            await storageService.deleteCards(ids);
            await loadCards(); // Refresh list
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [loadCards]);

    const clearAll = useCallback(async () => {
        try {
            await storageService.clearAll();
            setCards([]);
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, []);

    // Load cards on mount
    useEffect(() => {
        loadCards();
    }, [loadCards]);

    return {
        cards,
        loading,
        error,
        refresh: loadCards,
        saveCard,
        deleteCard,
        deleteMultiple,
        clearAll
    };
}

/**
 * Hook for managing folders
 */
export function useFolders() {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const loadFolders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const allFolders = await storageService.getAllFolders();
            setFolders(allFolders);
        } catch (err) {
            setError(err as Error);
            console.error('[useFolders] Failed to load folders:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveFolder = useCallback(async (folder: Folder) => {
        try {
            await storageService.saveFolder(folder);
            await loadFolders(); // Refresh list
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [loadFolders]);

    const deleteFolder = useCallback(async (id: string) => {
        try {
            await storageService.deleteFolder(id);
            await loadFolders(); // Refresh list
        } catch (err) {
            setError(err as Error);
            throw err;
        }
    }, [loadFolders]);

    // Load folders on mount
    useEffect(() => {
        loadFolders();
    }, [loadFolders]);

    return {
        folders,
        loading,
        error,
        refresh: loadFolders,
        saveFolder,
        deleteFolder
    };
}

/**
 * Hook for import/export operations
 */
export function useImportExport() {
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const exportData = useCallback(async (): Promise<string> => {
        try {
            setExporting(true);
            setError(null);
            const jsonData = await storageService.exportData();
            return jsonData;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setExporting(false);
        }
    }, []);

    const importData = useCallback(async (jsonString: string, merge: boolean = true): Promise<number> => {
        try {
            setImporting(true);
            setError(null);
            const count = await storageService.importData(jsonString, merge);
            return count;
        } catch (err) {
            setError(err as Error);
            throw err;
        } finally {
            setImporting(false);
        }
    }, []);

    return {
        exportData,
        importData,
        exporting,
        importing,
        error
    };
}
