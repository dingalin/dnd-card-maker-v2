import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Konva from 'konva';
import { Stage, Layer, Image as KonvaImage, Group, Rect, Shape } from 'react-konva';
import domtoimage from 'dom-to-image-more';
import FloatingStylePanel from './FloatingStylePanel';
import FloatingImagePanel from './FloatingImagePanel';
import { BackgroundLayer } from './Layers/BackgroundLayer';
import { TextLayer } from './Layers/TextLayer';
import { OverlayLayer } from './Layers/OverlayLayer';
import { useCardContext } from '../../store';
import { LAYOUT, CARD_WIDTH, CARD_HEIGHT, RARITY_GRADIENTS, getRarityKey } from './utils/canvasUtils';
import './CardCanvas.css';

const SCALE = 0.36;

// Custom Filter: Converts white background to transparent, and object to solid black (for shadow base)
const SilhouetteFilter = function (imageData: ImageData) {
    const nPixels = imageData.data.length;
    const data = imageData.data;
    const threshold = 80; // Distance threshold (approx RGB 200 tolerance)

    for (let i = 0; i < nPixels; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a > 0) {
            // Calculate distance from white
            const dist = Math.sqrt(
                Math.pow(255 - r, 2) +
                Math.pow(255 - g, 2) +
                Math.pow(255 - b, 2)
            );

            // If close to white, make transparent
            if (dist < threshold) {
                data[i + 3] = 0; // Transparent
            } else {
                // Determine "solidness"
                // For proper silhouette, we want solid color where the object is.
                // We set it to opaque black (which will be tinted later).
                data[i] = 0;     // R
                data[i + 1] = 0; // G
                data[i + 2] = 0; // B
                // data[i + 3] = 255; 
                // We KEEP the original alpha to preserve antialiasing of the object edges!
                // If it was fully opaque, it stays 255. If it was semi-transparent, it stays so.
            }
        }
    }
};

export interface CardCanvasHandle {
    captureImage: () => string | null;
    deselect: () => void;
}

const CardCanvas = forwardRef<CardCanvasHandle>((_props, ref) => {
    const { state, updateOffset, updateCardField, updateBatchOffsets } = useCardContext();
    const stageRef = useRef<any>(null);
    const flipWrapperRef = useRef<HTMLDivElement>(null); // Ref for html2canvas export
    const itemImageGroupRef = useRef<any>(null);
    const shadowGroupRef = useRef<any>(null); // Ref for updating shadow cache
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // Timeout for debounced hover leave
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // Local state for auto-edit mode
    const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [selectedId, selectShape] = useState<string | null>(null); // Locked selection (clicked)
    const [hoveredId, setHoveredId] = useState<string | null>(null); // Hover preview
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');
    // The effective selected element is the hovered one (if any), otherwise the locked one
    const effectiveSelectedId = hoveredId || selectedId;

    // Expose captureImage and deselect via ref
    useImperativeHandle(ref, () => ({
        captureImage: () => {
            if (stageRef.current) {
                return stageRef.current.toDataURL({ pixelRatio: 1.0 }); // Better quality thumbnail
            }
            return null;
        },
        deselect: () => {
            setIsEditMode(false);
            selectShape(null);
            setHoveredId(null);
            setEditingId(null);
        }
    }));

    const cardData = state.cardData || {
        front: {
            title: 'פריט חדש',
            type: 'נשק',
            rarity: 'נפוץ',
            imageUrl: null,
            imageStyle: 'natural',
            quickStats: '1d4 חותך',
            gold: '2',
            badges: []
        },
        back: {
            title: '',
            mechanics: '',
            lore: ''
        },
        legacy: false,
    } as any;

    // Debug: Log cardData to see what's being rendered
    console.log('[CardCanvas] Rendering with cardData:', {
        name: cardData.name,
        'front.title': cardData.front?.title,
        'front.type': cardData.front?.type,
        subtype: cardData.subtype,
        typeHe: cardData.typeHe,
        'front.rarity': cardData.front?.rarity,
        abilityName: cardData.abilityName,
        'back.title': cardData.back?.title,
        'back.mechanics': cardData.back?.mechanics,
        'back.lore': cardData.back?.lore,
        description: cardData.description
    });




    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    // Handle saving card to library
    const handleSaveToLibrary = async () => {
        if (!state.cardData) {
            alert('אין קלף לשמירה');
            return;
        }

        try {
            // Dynamic import to avoid circular dependencies
            const { cardLibrary } = await import('../../utils/CardLibraryManager');

            const cardName = state.cardData.front?.title || state.cardData.name || 'קלף חדש';

            // Capture thumbnails
            let thumbnailFront: string | undefined;
            let thumbnailBack: string | undefined;

            if (stageRef.current) {
                // Store current state to restore later
                const wasEditMode = isEditMode;
                const previousSelectedId = selectedId;
                const previousHoveredId = hoveredId;

                // Temporarily hide edit mode / selection so Transformer doesn't appear in thumbnails
                setIsEditMode(false);
                selectShape(null);
                setHoveredId(null);
                await new Promise(r => setTimeout(r, 50)); // Wait for React to re-render

                // Capture front (full resolution - saved to IndexedDB)
                const currentIsFlipped = isFlipped;
                if (currentIsFlipped) {
                    setIsFlipped(false);
                    await new Promise(r => setTimeout(r, 150));
                }
                thumbnailFront = stageRef.current.toDataURL({ pixelRatio: 1.0 }); // Full resolution

                // Capture back
                setIsFlipped(true);
                await new Promise(r => setTimeout(r, 150));
                thumbnailBack = stageRef.current.toDataURL({ pixelRatio: 1.0 }); // Full resolution

                // Restore original state
                setIsFlipped(currentIsFlipped);

                // Restore edit mode state (optional)
                if (wasEditMode) {
                    setIsEditMode(true);
                    selectShape(previousSelectedId);
                    setHoveredId(previousHoveredId);
                }
            }

            await cardLibrary.saveTemplate(
                cardName,
                state.cardData,
                state.settings,
                thumbnailFront,
                thumbnailBack
            );

            alert('✅ הקלף נשמר בספרייה!');
        } catch (error) {
            console.error('Failed to save to library', error);
            alert('שגיאה בשמירת הקלף');
        }
    };

    // Load item image when cardData changes
    useEffect(() => {
        if (cardData?.itemImageUrl) {
            const img = new window.Image();
            img.src = cardData.itemImageUrl;
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                setItemImage(img);
                console.log('✅ Item image loaded');
            };
            img.onerror = () => {
                console.warn('Failed to load item image');
                setItemImage(null);
            };
        } else {
            setItemImage(null);
        }
    }, [cardData?.itemImageUrl]);

    // Load background image when cardData changes
    useEffect(() => {
        const url = cardData?.backgroundUrl;
        console.log('[CardCanvas] Background URL changed:', url);

        if (url) {
            const img = new window.Image();
            img.src = url;
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                setBackgroundImage(img);
                console.log('✅ Background image loaded successfully:', url);
            };
            img.onerror = (e) => {
                console.warn('❌ Failed to load background image:', url, e);
                // Don't clear immediately on error to prevent flashing if it's a transient network issue, 
                // but usually we might want to. For now, let's keep previous image if new one fails? 
                // No, standard behavior is to show nothing or broken state.
                // setBackgroundImage(null); 
            };
        } else {
            console.log('[CardCanvas] No background URL provided, clearing image.');
            setBackgroundImage(null);
        }
    }, [cardData?.backgroundUrl]);

    const [showDownloadDialog, setShowDownloadDialog] = useState(false);

    const handleExport = () => {
        setShowDownloadDialog(true);
    };

    const handleExportSingleSide = async () => {
        setShowDownloadDialog(false);
        if (!flipWrapperRef.current) return;

        // Temporarily hide edit mode / selection so Transformer and panels don't appear in export
        const wasEditMode = isEditMode;
        const previousSelectedId = selectedId;
        const previousHoveredId = hoveredId;
        const wasEditingId = editingId;

        // Close all editing UI
        setIsEditMode(false);
        selectShape(null);
        setHoveredId(null);
        setEditingId(null); // Close inline text editor if open

        // Wait for fonts to be loaded and UI to update
        try {
            await document.fonts.ready;
        } catch (e) {
            // Font API not available, continue anyway
        }

        // Wait for React to re-render without Transformer
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            // Use dom-to-image-more which uses SVG foreignObject for text rendering
            // This preserves Hebrew text with nikud correctly!
            const dataUrl = await domtoimage.toPng(flipWrapperRef.current, {
                quality: 1,
                width: flipWrapperRef.current.offsetWidth * 3,
                height: flipWrapperRef.current.offsetHeight * 3,
                style: {
                    transform: 'scale(3)',
                    transformOrigin: 'top left'
                }
            });

            const link = document.createElement('a');
            link.download = `${cardData?.front?.title || cardData?.name || 'card'}_${isFlipped ? 'back' : 'front'}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Export failed:', error);
            // Fallback to Konva export
            const uri = stageRef.current?.toDataURL({ pixelRatio: 3 });
            if (uri) {
                const link = document.createElement('a');
                link.download = `${cardData?.front?.title || cardData?.name || 'card'}_${isFlipped ? 'back' : 'front'}.png`;
                link.href = uri;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        }

        // Restore previous state
        if (wasEditMode) {
            setIsEditMode(true);
            selectShape(previousSelectedId);
            setHoveredId(previousHoveredId);
            if (wasEditingId) setEditingId(wasEditingId);
        }
    };

    const handleExportBothSides = async () => {
        setShowDownloadDialog(false);
        if (!stageRef.current) return;

        // Temporarily hide edit mode / selection
        setIsEditMode(false);
        selectShape(null);
        setHoveredId(null);

        // Wait for render
        await new Promise(resolve => setTimeout(resolve, 50));

        // Capture current side (front or back)
        const currentSideFlipped = isFlipped;
        const currentUri = stageRef.current.toDataURL({ pixelRatio: 2 });

        // Flip to other side
        setIsFlipped(!currentSideFlipped);

        // Wait for flip animation and render
        await new Promise(resolve => setTimeout(resolve, 100));

        // Capture other side
        const otherUri = stageRef.current.toDataURL({ pixelRatio: 2 });

        // Restore original flip state
        setIsFlipped(currentSideFlipped);

        // Create side-by-side canvas
        const frontImg = new Image();
        const backImg = new Image();

        const loadImage = (img: HTMLImageElement, src: string): Promise<void> => {
            return new Promise((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject();
                img.src = src;
            });
        };

        try {
            // Determine which is front and which is back
            const frontUri = currentSideFlipped ? otherUri : currentUri;
            const backUri = currentSideFlipped ? currentUri : otherUri;

            await Promise.all([
                loadImage(frontImg, frontUri),
                loadImage(backImg, backUri)
            ]);

            // Create combined canvas (side by side)
            const canvas = document.createElement('canvas');
            const gap = 20; // Gap between cards
            canvas.width = frontImg.width + backImg.width + gap;
            canvas.height = Math.max(frontImg.height, backImg.height);

            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Optional: Fill with background color
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw front on left
                ctx.drawImage(frontImg, 0, 0);
                // Draw back on right
                ctx.drawImage(backImg, frontImg.width + gap, 0);

                // Download combined image
                const link = document.createElement('a');
                link.download = `${cardData?.front?.title || cardData?.name || 'card'}_both_sides.png`;
                link.href = canvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (e) {
            console.error('Failed to create combined image:', e);
            alert('שגיאה ביצירת תמונה משולבת');
        }
    };

    const handleDragEnd = (e: any, key: string, side: 'front' | 'back' = 'front') => {
        const node = e.target;
        const newX = node.x();
        const newY = node.y();

        // Base positions (synchronized with LAYOUT constants)
        const bases: Record<string, number> = {
            rarity: LAYOUT.RARITY_Y,      // 50
            type: LAYOUT.TYPE_Y,          // 90
            title: LAYOUT.TITLE_Y,        // 140
            stats: LAYOUT.STATS_Y,        // 700
            gold: LAYOUT.GOLD_Y,          // 750
            image: 240,                   // Image base Y
            desc: LAYOUT.STATS_Y,         // Same as stats
            abilityName: 220,
            mech: 320,
            lore: 750
        };

        const baseY = bases[key] || 0;
        const baseX = 0; // Standard X base is 0 (centered logic handled differently usually, but offset is relative)

        // Map key to store key
        // We stick to the convention: 'key' is the Y offset (legacy). '${key}_x' is the X offset.
        updateBatchOffsets([
            { key: key, value: newY - baseY, side }, // Y offset (Legacy key)
            { key: `${key}_x`, value: newX - baseX, side } // New X offset
        ]);
    };

    const handleTransformEnd = (e: any, key: string, side: 'front' | 'back' = 'front') => {
        const node = e.target;

        // Re-use logic from drag end for position
        const bases: Record<string, number> = {
            rarity: LAYOUT.RARITY_Y,
            type: LAYOUT.TYPE_Y,
            title: LAYOUT.TITLE_Y,
            stats: LAYOUT.STATS_Y,
            gold: LAYOUT.GOLD_Y,
            image: 240,
            desc: LAYOUT.STATS_Y,
            abilityName: 220,
            mech: 320,
            lore: 750
        };
        const baseY = bases[key] || 0;
        const baseX = 0;

        updateBatchOffsets([
            { key: key, value: node.y() - baseY, side },
            { key: `${key}_x`, value: node.x() - baseX, side },
            { key: `${key}_scaleX`, value: node.scaleX(), side },
            { key: `${key}_scaleY`, value: node.scaleY(), side },
            { key: `${key}_rotation`, value: node.rotation(), side }
        ]);
    };

    const getOffset = (key: string, side: 'front' | 'back' = 'front') => {
        if (!state.settings[side] || !state.settings[side].offsets) return 0;
        const offsets = state.settings[side].offsets as any;
        return offsets[key] || 0;
    };
    // const transformerRef = useRef<any>(null); // Removed: Handled by OverlayLayer
    // Duplicates removed

    // Removed: Transformer logic moved to OverlayLayer

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
            // If we are not editing, nothing to do
            if (!isEditMode && !selectedId) return;

            // Check if the click target is within the CardCanvas container
            // The container includes the Stage, the Floating Panels, and everything related to the card editor.
            const target = e.target as HTMLElement;
            const isInsideCanvas = target.closest('.card-canvas-container');

            // If the click is OUTSIDE the canvas container, deselect.
            // This covers clicking on the sidebar, the empty page background, etc.
            if (!isInsideCanvas) {
                console.log('[CardCanvas] Global click outside detected. Deselecting.');
                setIsEditMode(false);
                selectShape(null);
                setHoveredId(null);
                setEditingId(null);
                setEditingId(null);
                // Transformer handled in OverlayLayer
            }
        };

        // Use mousedown to capture the interaction early just like Konva
        document.addEventListener('mousedown', handleGlobalClick);

        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isEditMode, selectedId]);

    // Handle hover enter - preview selection (and replace any previous hover)
    const handleHoverEnter = (id: string) => {
        // Cancel any pending hide timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsEditMode(true);
        setHoveredId(id); // This replaces any previous hovered element
    };

    // Handle hover leave - debounced to allow moving to floating panel
    const handleHoverLeave = () => {
        // Don't immediately clear - give user time to move to floating panel
        // Only start timeout if no element is locked (selectedId is null)
        if (!selectedId) {
            hoverTimeoutRef.current = setTimeout(() => {
                setHoveredId(null);
                setIsEditMode(false);
            }, 300); // 300ms delay before hiding
        }
    };

    // Handle click - lock selection (only for text elements)
    const handleSelect = (e: any, id: string) => {
        console.log('[CardCanvas] handleSelect called:', { id });
        e.cancelBubble = true;

        // Only allow selection for text elements, not for itemImage or other non-text items
        if (id === 'itemImage') {
            // Don't select itemImage - it's confusing for users
            return;
        }

        setIsEditMode(true);
        selectShape(id); // Lock this selection
        console.log('[CardCanvas] selectedId locked to:', id);
    };

    const handleTextDblClick = (_e: any, id: string, initialValue: string) => {
        setIsEditMode(true); // Ensure edit mode is on
        setEditingId(id);
        setEditingValue(initialValue);
        selectShape(null); // Hide transformer while editing
    };

    const handleTextEditComplete = () => {
        if (!editingId || !editingValue) {
            setEditingId(null);
            return;
        }

        // Map element IDs to cardData paths
        // Map element IDs to cardData paths
        const idToPathMap: Record<string, string> = {
            // Front of card
            'title': 'front.title',
            'name': 'front.title',
            'type': 'front.type',
            'rarity': 'front.rarity',
            'stats': 'front.quickStats',
            'coreStats': 'front.quickStats',
            'gold': 'front.gold',
            // Back of card
            'abilityName': 'back.title',
            'mech': 'back.mechanics',
            'lore': 'back.lore',
        };

        const path = idToPathMap[editingId];
        if (path) {
            console.log('[CardCanvas] Saving text edit:', editingId, '->', path, '=', editingValue);
            updateCardField(path, editingValue);

            // Also update front/back specific fields for consistency
            if (editingId === 'title' || editingId === 'name') {
                updateCardField('front.title', editingValue);
            } else if (editingId === 'abilityName') {
                updateCardField('back.title', editingValue);
            } else if (editingId === 'mech') {
                updateCardField('back.mechanics', editingValue);
            } else if (editingId === 'lore') {
                updateCardField('back.lore', editingValue);
            }
        } else {
            console.warn('[CardCanvas] Unknown element ID:', editingId);
        }

        setEditingId(null);
    };

    const checkDeselect = (e: any) => {
        // deselect when clicked on empty area or background
        const clickedOnEmpty = e.target === e.target.getStage() ||
            e.target.name() === 'card-background' ||
            e.target.name() === 'card-background-image';

        console.log('[CardCanvas] checkDeselect:', {
            target: e.target.name() || e.target.className,
            clickedOnEmpty
        });

        if (clickedOnEmpty) {
            setIsEditMode(false); // Automatically exit edit mode
            selectShape(null);
            setIsEditMode(false); // Automatically exit edit mode
            selectShape(null);
            // Transformer handled in OverlayLayer
            // Also cancel edit if clicking away
            if (editingId) {
                handleTextEditComplete();
            }
        }
    };

    const handleImageDragEnd = (e: any) => {
        const node = e.target;
        // Base positions for image
        const BASE_X = CARD_WIDTH / 2; // Always centered
        const BASE_Y = 240;

        const newY = node.y();

        // Reset X to center (ignore any X movement)
        node.x(BASE_X);

        // Only save Y offset, X is always centered
        updateOffset('imageXOffset', 0, 'front'); // Always 0
        updateOffset('imageYOffset', newY - BASE_Y, 'front');
    };

    const handleImageTransformEnd = () => {
        const node = stageRef.current?.findOne('#itemImage');
        if (!node) return;

        const BASE_X = CARD_WIDTH / 2; // Must match imgX calculation
        const BASE_Y = 240;

        const scaleX = node.scaleX();

        updateBatchOffsets([
            { key: 'imageXOffset', value: node.x() - BASE_X, side: 'front' },
            { key: 'imageYOffset', value: node.y() - BASE_Y, side: 'front' },
            { key: 'imageScale', value: scaleX, side: 'front' },
            { key: 'imageRotation', value: node.rotation(), side: 'front' }
        ]);

        // Recache the inner group after transformation to keep the cached image in sync
        if (itemImageGroupRef.current) {
            try {
                itemImageGroupRef.current.cache();
            } catch (e) {
                console.warn('Failed to recache after transform', e);
            }
        }
    };



    // Image is always centered horizontally, only Y can be adjusted
    const imgX = CARD_WIDTH / 2; // Always centered
    const imgY = 240 + (getOffset('imageYOffset') || 0);
    const imgScale = getOffset('imageScale') || 1;
    const imgRotation = getOffset('imageRotation') || 0;

    // Helper for Custom Styles (Fill, Font, etc.)
    const getCustomStyle = (key: string, styleProp: string, defaultValue: any, side: 'front' | 'back' = 'front') => {
        // If editing, force blue for fill (optional, maybe we want to see real color while editing too?
        // Actually, existing logic is "fill={isEditMode ? '#007bff' : '#2c1810'}"
        // Let's keep the Edit Mode blue highlight for now as it indicates selection clearly.
        // BUT, if we want to preview color changes, maybe we should only blue-ify the BORDER/Outline?
        // Konva Text doesn't have a border easily unless we stroke it.
        // Let's stick to: If selected text is being edited (edit mode), maybe keep it blue or just let the transformer show selection?
        // The user wants to see the color change. `isEditMode` applies to the whole canvas state.
        // Let's change logic: Only force blue if it's the specific selected ID? Or just rely on Transformer?
        // Transformer shows selection. Let's SHOW REAL COLOR always, unless maybe a slight highlight is needed.
        // Actually, the original code used blue fill to indicate "editable".
        // Let's try showing the REAL color always, and trust the Transformer to show selection.

        const customStyles = state.settings[side].customStyles || {};
        const override = customStyles[`${key}_${styleProp}`];
        return override !== undefined ? override : defaultValue;
    };

    // Helper to get all text styles including shadow and glow
    const getTextStyles = (key: string, side: 'front' | 'back' = 'front') => {
        const styles: any = {};

        // Shadow
        if (getCustomStyle(key, 'shadowEnabled', false, side)) {
            styles.shadowColor = getCustomStyle(key, 'shadowColor', '#000000', side);
            styles.shadowBlur = getCustomStyle(key, 'shadowBlur', 5, side);
            styles.shadowOffsetX = getCustomStyle(key, 'shadowOffsetX', 2, side);
            styles.shadowOffsetY = getCustomStyle(key, 'shadowOffsetY', 2, side);
            styles.shadowOpacity = 0.8;
        }

        // Glow (uses shadow properties with zero offset)
        if (getCustomStyle(key, 'glowEnabled', false, side)) {
            styles.shadowColor = getCustomStyle(key, 'glowColor', '#FFD700', side);
            styles.shadowBlur = getCustomStyle(key, 'glowBlur', 10, side);
            styles.shadowOffsetX = 0;
            styles.shadowOffsetY = 0;
            styles.shadowOpacity = 1;
        }
        return styles;
    };

    // Effect to handle caching for Alpha Masking
    // We cache the inner group so the destination-in compositing works correctly.
    // Shadow is NOT applied here - it's on the outer group AFTER the cached mask.
    useEffect(() => {
        if (itemImageGroupRef.current && itemImage) {
            try {
                // Cache just the image bounds - no extra padding needed since
                // shadow is applied to the OUTER group, not this inner cached group
                itemImageGroupRef.current.cache({
                    x: 0,
                    y: 0,
                    width: itemImage.width,
                    height: itemImage.height,
                    pixelRatio: 1
                });
            } catch (e) {
                console.warn('Failed to cache image group', e);
                itemImageGroupRef.current?.clearCache();
            }
        }
    }, [
        state.settings.front?.customStyles?.itemImage_fade,
        state.settings.back?.customStyles?.itemImage_fade,
        state.settings.front?.customStyles?.itemImage_maskShape,
        state.settings.back?.customStyles?.itemImage_maskShape,
        itemImage,
        isFlipped
    ]);

    // Shadow Cache Effect: Ensure Shadow Group (Blur) is re-cached when image or shadow settings change.
    useEffect(() => {
        if (shadowGroupRef.current && itemImage) {
            try {
                // Must Clear first to ensure no old artifacts
                shadowGroupRef.current.clearCache();

                // Then Cache again
                shadowGroupRef.current.cache({
                    x: 0,
                    y: 0,
                    width: itemImage.width,
                    height: itemImage.height,
                    pixelRatio: 1
                });
                // Force redraw
                shadowGroupRef.current.getLayer()?.batchDraw();
            } catch (e) {
                console.warn('Failed to cache shadow group', e);
            }
        }
    }, [
        itemImage,
        state.settings.front?.customStyles?.itemImage_shadowBlur,
        state.settings.front?.customStyles?.itemImage_shadowColor,
        isFlipped
    ]);

    const handleDragEndWrapper = (e: any, key: string, side: 'front' | 'back' = 'front') => {
        handleDragEnd(e, key, side);
    };


    // Clip function for rounded corners (Standard 1/8" / 3mm radius at 300dpi = ~38px)
    const roundedCornerClip = (ctx: any) => {
        const r = 38;
        const w = CARD_WIDTH;
        const h = CARD_HEIGHT;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(w - r, 0);
        ctx.quadraticCurveTo(w, 0, w, r);
        ctx.lineTo(w, h - r);
        ctx.quadraticCurveTo(w, h, w - r, h);
        ctx.lineTo(r, h);
        ctx.quadraticCurveTo(0, h, 0, h - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
    };

    return (
        <div className="card-canvas-container">
            <div ref={flipWrapperRef} className={`card-flip-wrapper ${isFlipped ? 'flipped' : ''}`} style={{ background: 'transparent' }}>
                <Stage
                    width={CARD_WIDTH * SCALE}
                    height={CARD_HEIGHT * SCALE}
                    scaleX={SCALE}
                    scaleY={SCALE}
                    ref={stageRef}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                    style={{ background: 'transparent' }}
                >
                    <Layer clipFunc={roundedCornerClip}>
                        <BackgroundLayer
                            width={CARD_WIDTH}
                            height={CARD_HEIGHT}
                            backgroundImage={backgroundImage}
                            backgroundScale={getOffset('backgroundScale') || 1}
                            onMouseDown={checkDeselect}
                        />

                        {/* Determine render order based on setting */}
                        {(() => {
                            const imageAboveText = getCustomStyle('itemImage', 'aboveText', true);

                            const textLayerElement = (
                                <TextLayer
                                    cardData={cardData}
                                    isFlipped={isFlipped}
                                    isEditMode={isEditMode}
                                    getOffset={getOffset}
                                    getCustomStyle={getCustomStyle}
                                    getTextStyles={getTextStyles}
                                    onSelect={handleSelect}
                                    onDblClick={handleTextDblClick}
                                    onDragEnd={handleDragEndWrapper}
                                    onTransformEnd={handleTransformEnd}
                                    onHoverEnter={handleHoverEnter}
                                    onHoverLeave={handleHoverLeave}
                                />
                            );

                            // Render TextLayer FIRST (below) if imageAboveText is true
                            // Render TextLayer SECOND (above) if imageAboveText is false
                            return imageAboveText ? textLayerElement : null;
                        })()}

                        {/* 4. ITEM IMAGE GROUP with Alpha Masking & Shadow (Hybrid Strategy) - FRONT ONLY */}
                        {!isFlipped && itemImage && (() => {
                            // Safe reference for TS
                            const img = itemImage!;
                            const fade = getCustomStyle('itemImage', 'fade', 0);
                            const shadowBlur = getCustomStyle('itemImage', 'shadowBlur', 0);
                            const shadowColor = getCustomStyle('itemImage', 'shadowColor', '#000000');
                            // Shadow Logic: Counter-rotate shadow to maintain "Global Light" direction
                            const shadowOffsetX = getCustomStyle('itemImage', 'shadowOffsetX', 0);
                            const shadowOffsetY = getCustomStyle('itemImage', 'shadowOffsetY', 0);
                            const maskShape = getCustomStyle('itemImage', 'maskShape', 'square');
                            const borderWidth = getCustomStyle('itemImage', 'borderWidth', 0);

                            // Helper for mask path (reused for Clip and Border)
                            const drawMaskPath = (ctx: any) => {
                                const w = img.width;
                                const h = img.height;
                                ctx.beginPath();
                                if (maskShape === 'circle') {
                                    const r = Math.min(w, h) / 2;
                                    ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2, false);
                                } else if (maskShape === 'rounded') {
                                    const r = 40;
                                    ctx.moveTo(r, 0);
                                    ctx.lineTo(w - r, 0);
                                    ctx.quadraticCurveTo(w, 0, w, r);
                                    ctx.lineTo(w, h - r);
                                    ctx.quadraticCurveTo(w, h, w - r, h);
                                    ctx.lineTo(r, h);
                                    ctx.quadraticCurveTo(0, h, 0, h - r);
                                    ctx.lineTo(0, r);
                                    ctx.quadraticCurveTo(0, 0, r, 0);
                                } else if (maskShape === 'diamond') {
                                    ctx.moveTo(w / 2, 0);
                                    ctx.lineTo(w, h / 2);
                                    ctx.lineTo(w / 2, h);
                                    ctx.lineTo(0, h / 2);
                                } else {
                                    ctx.rect(0, 0, w, h);
                                }
                                ctx.closePath();
                            };

                            // When the object rotates, the shadow context rotates with it.
                            // We need to rotate the offset vector in the opposite direction so it stays visually consistent.
                            const angleRad = (imgRotation * Math.PI) / 180;
                            const cos = Math.cos(-angleRad);
                            const sin = Math.sin(-angleRad);

                            // Rotate the offset vector (shadowOffsetX, shadowOffsetY) by -angle
                            const fixedShadowOffsetX = shadowOffsetX * cos - shadowOffsetY * sin;
                            const fixedShadowOffsetY = shadowOffsetX * sin + shadowOffsetY * cos;

                            return (
                                <Group
                                    // OUTER GROUP: Position, Scale, Interactions, AND SHADOW
                                    // Shadow MUST be on the outer group because the inner group uses
                                    // globalCompositeOperation="destination-in" which clips EVERYTHING
                                    // outside the mask shape, including shadows!
                                    id="itemImage"
                                    x={imgX}
                                    y={imgY}
                                    offset={{ x: img.width / 2, y: img.height / 2 }} // ROTATION FIX: Pivot around center
                                    scaleX={imgScale}
                                    scaleY={imgScale}
                                    rotation={imgRotation}
                                    draggable={isEditMode}
                                    // No dragBoundFunc - let it drag freely, X will be reset in handleImageDragEnd
                                    onClick={(e) => handleSelect(e, 'itemImage')}
                                    onDragEnd={handleImageDragEnd}
                                    onTransformEnd={handleImageTransformEnd}
                                    onMouseEnter={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'pointer';
                                        handleHoverEnter('itemImage');
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'default';
                                        handleHoverLeave();
                                    }}
                                    // Shadow applied to Outer Group (after masking is complete)
                                    shadowEnabled={false} // Disable native shadow, using manual layer below
                                >
                                    {/* MANUAL SHADOW LAYER (Silhouette Shadow) */}
                                    <Group
                                        x={fixedShadowOffsetX}
                                        y={fixedShadowOffsetY}
                                        opacity={1}
                                        visible={shadowBlur > 0}
                                        name="shadow-group"
                                    >
                                        <Group
                                            ref={(node) => {
                                                // We store the ref to handle updates via useEffect below
                                                // We don't cache here immediately to avoid double-caching issues 
                                                // or caching before image is ready (though image is ready here).
                                                // Let the Effect handle it.
                                                if (node) shadowGroupRef.current = node;
                                            }}
                                            filters={[Konva.Filters.Blur]}
                                            blurRadius={shadowBlur}
                                        >
                                            {/* Silhouette Image */}
                                            <KonvaImage
                                                image={img}
                                                width={img.width}
                                                height={img.height}
                                                filters={[SilhouetteFilter]}
                                            />

                                            {/* Shadow Tint */}
                                            {/* 'source-in' draws the ShadowColor Rect ONLY where the filtered Silhouette is opaque */}
                                            <Rect
                                                width={img.width}
                                                height={img.height}
                                                fill={shadowColor}
                                                globalCompositeOperation="source-in"
                                            />
                                        </Group>
                                    </Group>

                                    {/* INNER GROUP (Cached for Masking ONLY - NO SHADOW props) */}
                                    <Group
                                        ref={(node) => {
                                            if (node) itemImageGroupRef.current = node;
                                        }}
                                        // MASKING
                                        clipFunc={state.settings.front.customStyles?.itemImage_maskShape ? drawMaskPath : undefined}
                                    >
                                        <KonvaImage // The VISIBLE Image
                                            image={img}
                                            width={img.width}
                                            height={img.height}
                                            opacity={1} // Base opacity
                                        />

                                        {/* Implementing Soft Fade via Masking */}
                                        {fade > 0 && (
                                            <Rect
                                                width={img.width}
                                                height={img.height}
                                                fillRadialGradientStartPoint={{ x: img.width / 2, y: img.height / 2 }}
                                                fillRadialGradientStartRadius={0}
                                                fillRadialGradientEndPoint={{ x: img.width / 2, y: img.height / 2 }}
                                                // STRICT LIMIT: The fade MUST reach 0 opacity before the closest edge (width/2 or height/2).
                                                // 0.5 ensures the circle is perfectly inscribed. No square edges possible.
                                                fillRadialGradientEndRadius={Math.min(img.width, img.height) / 2}
                                                fillRadialGradientColorStops={[
                                                    // Solid Center Zone determined by fade slider.
                                                    // Low fade = Large solid zone (close to 1). High fade = Small solid zone (close to 0).
                                                    0, 'white',
                                                    Math.max(0, 1 - (fade / 100)), 'white', // Solid stop
                                                    1, 'rgba(255,255,255,0)' // Transparent stop at the very edge (Radius 0.5)
                                                ]}
                                                globalCompositeOperation="destination-in"
                                            />
                                        )}
                                    </Group>

                                    {/* MASK BORDER (Drawn ON TOP of clipped group) */}
                                    {borderWidth > 0 && (() => {
                                        // Logic: "Fade" slider interpolates between Solid Stroke and Soft Shadow.
                                        // f = borderFade (0-100) / 100

                                        const f = (state.settings.front.customStyles?.itemImage_borderFade || 0) / 100;

                                        // Dynamic Logic for "Dispersed" look:
                                        // 1. STROKE: Decays as fade increases, but stays thick enough to cast a strong shadow.
                                        //    We keep 20% of the width as solid stroke even at max fade to ensure the "dark edge" remains.
                                        const dynamicStrokeWidth = Math.max(1, borderWidth * (1 - (f * 0.8)));

                                        // 2. SHADOW (Blur): Increases aggressively with fade.
                                        //    Multiplier of 3.0 creates a wide, dispersed glow that merges with the card.
                                        const dynamicShadowBlur = borderWidth * f * 3;

                                        return (
                                            <Shape
                                                sceneFunc={(ctx: any, shape: any) => {
                                                    drawMaskPath(ctx);
                                                    ctx.fillStrokeShape(shape);
                                                }}
                                                stroke="black"
                                                strokeWidth={dynamicStrokeWidth}
                                                // Konva Shadow props
                                                shadowColor="black"
                                                shadowBlur={dynamicShadowBlur}
                                                shadowOffset={{ x: 0, y: 0 }}
                                                shadowOpacity={1} // Keep full opacity for the shadow itself
                                                opacity={1}
                                                listening={false}
                                            />
                                        );
                                    })()}
                                </Group>
                            );
                        })()}



                        {/* RARITY BORDER EFFECT - FRONT ONLY */}
                        {!isFlipped && (() => {
                            // Look closer at the 'title' element settings for the border toggle
                            const isBorderEnabled = state.settings.front?.customStyles?.title_visualRarity_border;
                            if (isBorderEnabled) {
                                const rarityKey = getRarityKey(cardData.front?.rarity || cardData.rarityHe);
                                const colors = RARITY_GRADIENTS[rarityKey] || RARITY_GRADIENTS['common'];

                                return (
                                    <Rect
                                        x={0}
                                        y={0}
                                        width={CARD_WIDTH}
                                        height={CARD_HEIGHT}
                                        strokeLinearGradientStartPoint={{ x: 0, y: 0 }}
                                        strokeLinearGradientEndPoint={{ x: CARD_WIDTH, y: CARD_HEIGHT }} // Diagonal gradient for border? or top-down
                                        // Let's do a reflective metallic gradient (diagonal)
                                        strokeLinearGradientColorStops={[
                                            0, colors[0],
                                            0.25, colors[1],
                                            0.5, colors[0],
                                            0.75, colors[2],
                                            1, colors[1]
                                        ]}
                                        strokeWidth={15} // Nice thick frame
                                        strokeScaleEnabled={false} // Don't scale stroke when scaling stage? No, we want it to look good.
                                        listening={false}
                                        shadowColor={colors[2]}
                                        shadowBlur={20}
                                        shadowOpacity={0.6}
                                        cornerRadius={0} // Outer edge is clipped by roundedCornerClip anyway
                                    />
                                );
                            }
                            return null;
                        })()}

                        {/* TextLayer AFTER image (image below text mode) */}
                        {(() => {
                            const imageAboveText = getCustomStyle('itemImage', 'aboveText', true);
                            if (imageAboveText) return null; // Already rendered before image

                            return (
                                <TextLayer
                                    cardData={cardData}
                                    isFlipped={isFlipped}
                                    isEditMode={isEditMode}
                                    getOffset={getOffset}
                                    getCustomStyle={getCustomStyle}
                                    getTextStyles={getTextStyles}
                                    onSelect={handleSelect}
                                    onDblClick={handleTextDblClick}
                                    onDragEnd={handleDragEndWrapper}
                                    onTransformEnd={handleTransformEnd}
                                    onHoverEnter={handleHoverEnter}
                                    onHoverLeave={handleHoverLeave}
                                />
                            );
                        })()}

                        <OverlayLayer selectedId={effectiveSelectedId} isEditMode={isEditMode} />
                    </Layer>
                </Stage>
            </div>
            {/* Controls moved OUTSIDE flip wrapper */}
            <div className="canvas-controls">
                <button onClick={handleExport} className="btn-metallic btn-silver btn-small" title="הורד כתמונה">
                    הורדה
                </button>
                <button onClick={handleSaveToLibrary} className="btn-metallic btn-silver btn-small" title="שמור קלף לספרייה">
                    שמירת קלף
                </button>
                <div className="zoom-controls">
                    {/* Zoom controls could go here if needed */}
                </div>
                <button onClick={handleFlip} className="flip-btn" title="הפוך קלף">
                    {isFlipped ? 'סובב קלף ⟳' : 'סובב קלף ⟳'}
                </button>
            </div>

            {/* Render ALL Floating Panels */}
            {isEditMode && effectiveSelectedId === 'itemImage' && (
                <FloatingImagePanel
                    side={isFlipped ? 'back' : 'front'}
                    onClose={() => {
                        setIsEditMode(false);
                        selectShape(null);
                        setEditingId(null);
                    }}
                    onPanelEnter={() => {
                        // Cancel any pending hide timeout when mouse enters panel
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                        }
                    }}
                />
            )}

            {isEditMode && effectiveSelectedId && effectiveSelectedId !== 'itemImage' && (
                <FloatingStylePanel
                    key={effectiveSelectedId} // key forces re-mount when selection changes
                    selectedElement={effectiveSelectedId}
                    side={isFlipped ? 'back' : 'front'}
                    onClose={() => {
                        setIsEditMode(false);
                        selectShape(null);
                        setEditingId(null);
                    }}
                    onPanelEnter={() => {
                        // Cancel any pending hide timeout when mouse enters panel
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                        }
                    }}
                />
            )}

            {/* Inline Text Editor - appears on double-click */}
            {editingId && (
                <div
                    className="inline-text-editor-overlay"
                    onClick={(e) => {
                        // Click outside the input closes the editor
                        if ((e.target as HTMLElement).classList.contains('inline-text-editor-overlay')) {
                            handleTextEditComplete();
                        }
                    }}
                >
                    <div className="inline-text-editor">
                        <label>עריכת טקסט</label>
                        {editingId === 'lore' || editingId === 'mech' ? (
                            <textarea
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                autoFocus
                                rows={4}
                            />
                        ) : (
                            <input
                                type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleTextEditComplete();
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                            />
                        )}
                        <div className="editor-buttons">
                            <button onClick={handleTextEditComplete}>✓ שמור</button>
                            <button onClick={() => setEditingId(null)}>✕ בטל</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay Layer for Transformer/Selection Box - Removed (it belongs inside Stage) */}

            {/* Download Options Dialog */}
            {showDownloadDialog && (
                <div className="modal-overlay" onClick={() => setShowDownloadDialog(false)}>
                    <div className="modal-content download-dialog" onClick={(e) => e.stopPropagation()}>
                        <h3>📥 הורדת קלף</h3>
                        <div className="download-options">
                            <button
                                onClick={handleExportSingleSide}
                                className="btn-metallic btn-gold"
                            >
                                📄 צד נוכחי בלבד
                                <span style={{ fontSize: '0.8em', display: 'block', opacity: 0.8 }}>
                                    {isFlipped ? '(גב הקלף)' : '(חזית הקלף)'}
                                </span>
                            </button>
                            <button
                                onClick={handleExportBothSides}
                                className="btn-metallic btn-gold"
                            >
                                📑 שני הצדדים
                                <span style={{ fontSize: '0.8em', display: 'block', opacity: 0.8 }}>
                                    (זה לצד זה)
                                </span>
                            </button>
                        </div>
                        <button
                            onClick={() => setShowDownloadDialog(false)}
                            className="btn-metallic btn-silver"
                            style={{ marginTop: '15px' }}
                        >
                            ביטול
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default CardCanvas;
