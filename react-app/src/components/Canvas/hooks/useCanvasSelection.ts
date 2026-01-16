/**
 * useCanvasSelection - Hook for managing canvas element selection and hover states
 * Extracted from CardCanvas.tsx for better separation of concerns
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCanvasSelectionReturn {
    selectedId: string | null;
    selectShape: (id: string | null) => void;
    hoveredId: string | null;
    setHoveredId: (id: string | null) => void;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    editingValue: string;
    setEditingValue: (value: string) => void;
    isEditMode: boolean;
    setIsEditMode: (mode: boolean) => void;
    effectiveSelectedId: string | null;
    hoverTimeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
    handleHoverEnter: (id: string) => void;
    handleHoverLeave: () => void;
    handleSelect: (e: any, id: string) => void;
    resetSelection: () => void;
}

export function useCanvasSelection(): UseCanvasSelectionReturn {
    const [selectedId, selectShape] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // The effective selected element is the hovered one (if any), otherwise the locked one
    const effectiveSelectedId = hoveredId || selectedId;

    // Clear selection when edit mode is turned off
    useEffect(() => {
        if (!isEditMode) {
            selectShape(null);
            setHoveredId(null);
        }
    }, [isEditMode]);

    // Handle Outside Clicks (Global Listener)
    useEffect(() => {
        const handleGlobalClick = (e: MouseEvent) => {
            if (!isEditMode && !selectedId) return;

            const target = e.target as HTMLElement;
            const isInsideCanvas = target.closest('.card-canvas-container');

            if (!isInsideCanvas) {
                console.log('[useCanvasSelection] Global click outside detected. Deselecting.');
                setIsEditMode(false);
                selectShape(null);
                setHoveredId(null);
                setEditingId(null);
            }
        };

        document.addEventListener('mousedown', handleGlobalClick);
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isEditMode, selectedId]);

    // Handle hover enter - preview selection
    const handleHoverEnter = useCallback((id: string) => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsEditMode(true);
        setHoveredId(id);
    }, []);

    // Handle hover leave - debounced to allow moving to floating panel
    const handleHoverLeave = useCallback(() => {
        if (!selectedId) {
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredId(null);
                setIsEditMode(false);
            }, 300);
        }
    }, [selectedId]);

    // Handle click - lock selection (only for text elements)
    const handleSelect = useCallback((e: any, id: string) => {
        console.log('[useCanvasSelection] handleSelect called:', { id });
        e.cancelBubble = true;

        // Don't select itemImage - it's confusing for users
        if (id === 'itemImage') {
            return;
        }

        setIsEditMode(true);
        selectShape(id);
        console.log('[useCanvasSelection] selectedId locked to:', id);
    }, []);

    // Reset all selection state
    const resetSelection = useCallback(() => {
        setIsEditMode(false);
        selectShape(null);
        setHoveredId(null);
        setEditingId(null);
    }, []);

    return {
        selectedId,
        selectShape,
        hoveredId,
        setHoveredId,
        editingId,
        setEditingId,
        editingValue,
        setEditingValue,
        isEditMode,
        setIsEditMode,
        effectiveSelectedId,
        hoverTimeoutRef,
        handleHoverEnter,
        handleHoverLeave,
        handleSelect,
        resetSelection
    };
}
