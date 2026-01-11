import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer, Group } from 'react-konva';
import FloatingStylePanel from './FloatingStylePanel';
import FloatingImagePanel from './FloatingImagePanel';
import { useCardContext } from '../../store';
import './CardCanvas.css';

// =========================
// CARD DIMENSIONS
// =========================
const CARD_WIDTH = 750;
const CARD_HEIGHT = 1050;
const SCALE = 0.4;

// =========================
// LAYOUT POSITIONS (Y coordinates out of 1050)
// Adjust these values to move elements on the card
// =========================
const LAYOUT = {
    // Header section (top of card)
    RARITY_Y: 50,      // Rarity text (e.g., "נפוץ", "נדיר")
    TYPE_Y: 90,        // Item type (e.g., "נשק", "שריון")
    TITLE_Y: 140,      // Item name (large title)

    // Image section (center of card)
    IMAGE_CENTER_Y: 450,  // Center point for item image

    // Footer section (bottom of card)
    STATS_Y: 700,      // Stats/damage text (e.g., "1d8 חותך") - MOVED UP for visibility
    GOLD_Y: 800,       // Gold price (e.g., "150 זהב") - MOVED UP

    // Boundaries
    MIN_Y: 20,         // Top boundary for dragging
    MAX_Y: 1000,       // Bottom boundary for dragging (leaves room for text height)
};

function CardCanvas() {
    const { state, updateOffset, updateCardField } = useCardContext();
    const stageRef = useRef<any>(null);
    const itemImageGroupRef = useRef<any>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false); // Local state for auto-edit mode
    const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);

    const cardData = state.cardData || {
        front: { title: 'פריט חדש', type: 'נשק', rarity: 'נפוץ', imageUrl: null, imageStyle: 'natural', quickStats: '1d4 חותך', gold: '2', badges: [] },
        back: { title: '', mechanics: '', lore: '' },
        legacy: false,
        name: 'פריט חדש',
        description: '',
        type: 'נשק',
        typeHe: 'נשק',
        subtype: 'סכין',
        rarity: 'נפוץ',
        weaponDamage: '1d4 חותך',
        gold: '2',
        abilityName: '',
        abilityDesc: ''
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

    const handleExport = () => {
        if (!stageRef.current) return;
        const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `${cardData?.front?.title || cardData?.name || 'card'}.png`;
        link.href = uri;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDragEnd = (e: any, key: string, side: 'front' | 'back' = 'front') => {
        const newY = e.target.y();

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
            lore: 650
        };

        const baseY = bases[key] || 0;
        const offset = newY - baseY;

        // Map key to store key if different
        const storeKey = key === 'title' ? 'name' : key;
        updateOffset(storeKey, offset, side);
    };

    const getOffset = (key: string, side: 'front' | 'back' = 'front') => {
        if (!state.settings[side] || !state.settings[side].offsets) return 0;
        const offsets = state.settings[side].offsets as any;
        return offsets[key] || 0;
    };
    const transformerRef = useRef<any>(null);
    const [selectedId, selectShape] = useState<string | null>(null);

    // Direct Text Editing State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState('');

    // Effect to attach transformer to selected node
    useEffect(() => {
        if (isEditMode && selectedId && transformerRef.current && stageRef.current) {
            // Find node by ID
            const node = stageRef.current.findOne('#' + selectedId);
            if (node) {
                transformerRef.current.nodes([node]);
                transformerRef.current.getLayer().batchDraw();
            } else {
                transformerRef.current.nodes([]);
            }
        }
    }, [isEditMode, selectedId]);

    // Clear selection when edit mode is turned off
    useEffect(() => {
        if (!isEditMode) {
            selectShape(null);
        }
    }, [isEditMode]);

    const handleSelect = (e: any, id: string) => {
        console.log('[CardCanvas] handleSelect called:', { id });
        e.cancelBubble = true;
        setIsEditMode(true); // Automatically enter edit mode
        selectShape(id);
        console.log('[CardCanvas] selectedId set to:', id);
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
        const idToPathMap: Record<string, string> = {
            // Front of card
            'title': 'name',
            'name': 'name',
            'type': 'front.type',
            'rarity': 'front.rarity',
            'stats': 'quickStats',
            'coreStats': 'quickStats',
            'gold': 'gold',
            // Back of card
            'abilityName': 'abilityName',
            'mech': 'abilityDesc',
            'lore': 'description',
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
            if (transformerRef.current) {
                transformerRef.current.nodes([]);
            }
            // Also cancel edit if clicking away
            if (editingId) {
                handleTextEditComplete();
            }
        }
    };

    const handleImageDragEnd = (e: any) => {
        const node = e.target;
        // Base positions for image
        const BASE_X = 175;
        const BASE_Y = 240;

        const newX = node.x();
        const newY = node.y();

        updateOffset('imageXOffset', newX - BASE_X, 'front');
        updateOffset('imageYOffset', newY - BASE_Y, 'front');
    };

    const handleImageTransformEnd = () => {
        const node = stageRef.current?.findOne('#itemImage');
        if (!node) return;

        const BASE_X = 175;
        const BASE_Y = 240;

        const scaleX = node.scaleX();

        updateOffset('imageXOffset', node.x() - BASE_X, 'front');
        updateOffset('imageYOffset', node.y() - BASE_Y, 'front');
        updateOffset('imageScale', scaleX, 'front');
        updateOffset('imageRotation', node.rotation(), 'front');
    };



    // Helper to get image specific offsets
    const imgX = 175 + (getOffset('imageXOffset') || 0);
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
    // We ALWAYS cache the inner group so it behaves as a single bitmap shape.
    // This allows the Outer Group (itemImage) to cast a native shadow from this shape.
    useEffect(() => {
        // Dependencies are now just checking if we need to RE-cache (e.g. fade changed, image changed).
        // Shadow props changes DO NOT need re-cache because they are on the Outer Group!
        // But Fade changes DO need re-cache because mask changes.

        // const fade = getCustomStyle('itemImage', 'fade', 0);

        if (itemImageGroupRef.current && itemImage) {
            try {
                // Cache the Inner Group (Image + Mask).
                // No padding needed because Shadow is on the Outer Group.
                // We cache the exact size of the image.
                itemImageGroupRef.current.cache({
                    x: 0,
                    y: 0,
                    width: itemImage.width,
                    height: itemImage.height,
                    pixelRatio: 1 // Standard quality is sufficient and safer
                });
            } catch (e) {
                console.warn('Failed to cache image group', e);
                itemImageGroupRef.current.clearCache();
            }
        }
    }, [
        state.settings.front?.customStyles?.itemImage_fade,
        state.settings.back?.customStyles?.itemImage_fade,
        // We only need to re-cache if the CONTENT of the inner group changes.
        // Shadow props are on Outer Loop, so they don't affect cache!
        itemImage
    ]);

    // Constrain dragging to stay within card boundaries
    // For centered text (width=CARD_WIDTH), X should stay at 0
    // Y is constrained between top and bottom of card
    const dragBoundFunc = (pos: any) => {
        return {
            x: 0,  // Keep centered text at x=0
            y: Math.max(1, Math.min(pos.y, CARD_HEIGHT - 50))
        };
    };



    return (
        <div className="card-canvas-container">
            <div className={`card-flip-wrapper ${isFlipped ? 'flipped' : ''}`}>
                <Stage
                    width={CARD_WIDTH * SCALE}
                    height={CARD_HEIGHT * SCALE}
                    scaleX={SCALE}
                    scaleY={SCALE}
                    ref={stageRef}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                >
                    <Layer
                        clipFunc={(ctx) => {
                            const radius = 12;
                            const w = CARD_WIDTH;
                            const h = CARD_HEIGHT;
                            ctx.beginPath();
                            ctx.moveTo(radius, 0);
                            ctx.lineTo(w - radius, 0);
                            ctx.quadraticCurveTo(w, 0, w, radius);
                            ctx.lineTo(w, h - radius);
                            ctx.quadraticCurveTo(w, h, w - radius, h);
                            ctx.lineTo(radius, h);
                            ctx.quadraticCurveTo(0, h, 0, h - radius);
                            ctx.lineTo(0, radius);
                            ctx.quadraticCurveTo(0, 0, radius, 0);
                            ctx.closePath();
                        }}
                    >
                        <Rect
                            name="card-background"
                            width={CARD_WIDTH}
                            height={CARD_HEIGHT}
                            fill="#f5f0e1"
                            onMouseDown={checkDeselect}
                            onTouchStart={checkDeselect}
                        />
                        {backgroundImage && (
                            <KonvaImage
                                name="card-background-image"
                                image={backgroundImage}
                                width={CARD_WIDTH}
                                height={CARD_HEIGHT}
                                // Scale from center
                                x={CARD_WIDTH / 2}
                                y={CARD_HEIGHT / 2}
                                offsetX={CARD_WIDTH / 2}
                                offsetY={CARD_HEIGHT / 2}
                                scaleX={getOffset('backgroundScale') || 1}
                                scaleY={getOffset('backgroundScale') || 1}
                                listening={false}
                            />
                        )}

                        {!isFlipped ? (
                            <>


                                {/* 1. RARITY - Top of card */}
                                <Text
                                    id="rarity"
                                    text={cardData.front?.rarity || cardData.rarityHe || 'נדירות'}
                                    x={0}
                                    y={LAYOUT.RARITY_Y + getOffset('rarity')}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('rarity', 'fontSize', 28)}
                                    fontFamily={getCustomStyle('rarity', 'fontFamily', 'Arial')}
                                    fill={getCustomStyle('rarity', 'fill', '#d4af37')}
                                    {...getTextStyles('rarity', 'front')}
                                    draggable={isEditMode}
                                    dragBoundFunc={dragBoundFunc}
                                    onClick={(e) => handleSelect(e, 'rarity')}
                                    onDragEnd={(e) => handleDragEnd(e, 'rarity')}
                                    onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                    onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                />

                                {/* 2. TYPE (subtype) - Below rarity */}
                                <Text
                                    id="type"
                                    text={cardData.subtype || cardData.front?.type || cardData.typeHe || 'סכין'}
                                    x={0}
                                    y={LAYOUT.TYPE_Y + getOffset('type')}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('type', 'fontSize', 30)}
                                    fontFamily={getCustomStyle('type', 'fontFamily', 'Arial')}
                                    fontStyle="italic"
                                    fill={getCustomStyle('type', 'fill', '#555555')}
                                    {...getTextStyles('type', 'front')}
                                    draggable={isEditMode}
                                    dragBoundFunc={dragBoundFunc}
                                    onClick={(e) => handleSelect(e, 'type')}
                                    onDragEnd={(e) => handleDragEnd(e, 'type')}
                                    onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                    onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                />

                                {/* 3. TITLE/NAME - Large and prominent, centered */}
                                <Text
                                    id="title"
                                    text={cardData.front?.title || cardData.name || 'שם הפריט'}
                                    x={0}
                                    y={LAYOUT.TITLE_Y + getOffset('title')}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('title', 'fontSize', 60)}
                                    fontFamily={getCustomStyle('title', 'fontFamily', 'Arial')}
                                    fontStyle="bold"
                                    fill={getCustomStyle('title', 'fill', '#2c1810')}
                                    {...getTextStyles('title', 'front')}
                                    draggable={isEditMode}
                                    dragBoundFunc={(pos) => {
                                        return { x: 0, y: Math.max(30, Math.min(pos.y, CARD_HEIGHT - 100)) };
                                    }}
                                    onClick={(e) => handleSelect(e, 'title')}
                                    onDblClick={(e) => handleTextDblClick(e, 'title', cardData.front?.title || cardData.name || '')}
                                    onDragEnd={(e) => handleDragEnd(e, 'title')}
                                    onMouseEnter={(e) => {
                                        if (isEditMode) e.target.getStage()!.container().style.cursor = 'move';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'default';
                                    }}
                                />

                                {/* 4. ITEM IMAGE GROUP with Alpha Masking & Shadow (Hybrid Strategy) */}
                                {itemImage && (() => {
                                    const fade = getCustomStyle('itemImage', 'fade', 0);
                                    const shadowBlur = getCustomStyle('itemImage', 'shadowBlur', 0);
                                    const shadowColor = getCustomStyle('itemImage', 'shadowColor', '#000000');
                                    const shadowOffsetX = getCustomStyle('itemImage', 'shadowOffsetX', 0);
                                    const shadowOffsetY = getCustomStyle('itemImage', 'shadowOffsetY', 0);

                                    return (
                                        <Group
                                            // OUTER GROUP: Position, Scale, Interactions
                                            id="itemImage"
                                            x={imgX}
                                            y={imgY}
                                            scaleX={imgScale}
                                            scaleY={imgScale}
                                            rotation={imgRotation}
                                            draggable={isEditMode}
                                            onClick={(e) => handleSelect(e, 'itemImage')}
                                            onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                            onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                            onDragEnd={handleImageDragEnd}
                                            onTransformEnd={handleImageTransformEnd}

                                            // IF FADE IS ACTIVE: Apply Shadow to Outer Group (so it casts from the inner cached shape)
                                            {...(fade > 0 ? {
                                                shadowEnabled: shadowBlur > 0,
                                                shadowColor: shadowColor,
                                                shadowBlur: shadowBlur,
                                                shadowOpacity: 1,
                                                shadowOffsetX: shadowOffsetX,
                                                shadowOffsetY: shadowOffsetY,
                                            } : {})}
                                        >
                                            {fade > 0 ? (
                                                // MODE A: FADE ACTIVE (Complex Nested Group)
                                                <Group
                                                    ref={(node) => {
                                                        if (node) itemImageGroupRef.current = node;
                                                    }}
                                                >
                                                    <KonvaImage
                                                        image={itemImage}
                                                        opacity={getCustomStyle('itemImage', 'opacity', 1)}
                                                    />
                                                    <Rect
                                                        width={itemImage.width}
                                                        height={itemImage.height}
                                                        fillRadialGradientStartPoint={{ x: itemImage.width / 2, y: itemImage.height / 2 }}
                                                        fillRadialGradientStartRadius={0}
                                                        fillRadialGradientEndPoint={{ x: itemImage.width / 2, y: itemImage.height / 2 }}
                                                        fillRadialGradientEndRadius={Math.max(itemImage.width, itemImage.height) * 0.5}
                                                        fillRadialGradientColorStops={[
                                                            0, 'rgba(0,0,0,1)',
                                                            Math.max(0, 1 - (fade / 100)), 'rgba(0,0,0,1)',
                                                            1, 'rgba(0,0,0,0)'
                                                        ]}
                                                        globalCompositeOperation="destination-in"
                                                    />
                                                </Group>
                                            ) : (
                                                // MODE B: NO FADE (Simple Native Image)
                                                <KonvaImage
                                                    image={itemImage}
                                                    opacity={getCustomStyle('itemImage', 'opacity', 1)}
                                                    // Apply Shadow directly to Image for best native performance
                                                    shadowEnabled={shadowBlur > 0}
                                                    shadowColor={shadowColor}
                                                    shadowBlur={shadowBlur}
                                                    shadowOpacity={1}
                                                    shadowOffsetX={shadowOffsetX}
                                                    shadowOffsetY={shadowOffsetY}
                                                />
                                            )}
                                        </Group>
                                    );
                                })()}

                                {/* 5. STATS - Weapon damage / AC / Stats */}
                                <Text
                                    id="stats"
                                    text={(() => {
                                        const statsText = cardData.weaponDamage || cardData.quickStats || (cardData.armorClass ? `AC ${cardData.armorClass}` : '') || cardData.front?.quickStats || '';
                                        console.log('[CardCanvas] Stats text:', statsText);
                                        return statsText;
                                    })()}
                                    x={0}
                                    y={LAYOUT.STATS_Y}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('stats', 'fontSize', 40)}
                                    fontFamily={getCustomStyle('stats', 'fontFamily', 'Arial')}
                                    fontStyle="bold"
                                    fill={getCustomStyle('stats', 'fill', '#1a1a1a')}
                                    {...getTextStyles('stats', 'front')}
                                    draggable={isEditMode}
                                    dragBoundFunc={dragBoundFunc}
                                    onClick={(e) => handleSelect(e, 'stats')}
                                    onDragEnd={(e) => handleDragEnd(e, 'stats')}
                                    onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                    onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                />

                                {/* 6. GOLD - Bottom of card */}
                                <Text
                                    id="gold"
                                    text={(() => {
                                        const goldText = cardData.gold ? `${cardData.gold} זהב` : (cardData.front?.gold || '');
                                        console.log('[CardCanvas] Gold text:', goldText);
                                        return goldText;
                                    })()}
                                    x={0}
                                    y={LAYOUT.GOLD_Y + getOffset('gold')}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('gold', 'fontSize', 40)}
                                    fontFamily={getCustomStyle('gold', 'fontFamily', 'Arial')}
                                    fontStyle="bold"
                                    fill={getCustomStyle('gold', 'fill', '#d4af37')}
                                    {...getTextStyles('gold', 'front')}
                                    draggable={isEditMode}
                                    dragBoundFunc={dragBoundFunc}
                                    onClick={(e) => handleSelect(e, 'gold')}
                                    onDragEnd={(e) => handleDragEnd(e, 'gold')}
                                    onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                    onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                />
                            </>
                        ) : (
                            /* Back Side Elements */
                            <>
                                {/* Ability Name (Back) - Centered */}
                                <Text
                                    id="abilityName"
                                    text={(cardData.back?.title && cardData.back.title.length > 0)
                                        ? cardData.back.title
                                        : (cardData.abilityName || 'שם היכולת')}
                                    x={0}
                                    y={Math.max(60, 80 + getOffset('abilityName', 'back'))}
                                    width={CARD_WIDTH}
                                    align="center"
                                    fontSize={getCustomStyle('abilityName', 'fontSize', 52, 'back')}
                                    fontFamily={getCustomStyle('abilityName', 'fontFamily', 'Arial', 'back')}
                                    fontStyle="bold"
                                    fill={getCustomStyle('abilityName', 'fill', '#2c1810', 'back')}
                                    {...getTextStyles('abilityName', 'back')}
                                    draggable={isEditMode}
                                    dragBoundFunc={(pos) => ({ x: 0, y: Math.max(30, Math.min(pos.y, CARD_HEIGHT - 100)) })}
                                    onClick={(e) => handleSelect(e, 'abilityName')}
                                    onDblClick={(e) => handleTextDblClick(e, 'abilityName', cardData.back?.title || '')}
                                    onDragEnd={(e) => handleDragEnd(e, 'abilityName', 'back')}
                                    onMouseEnter={(e) => {
                                        if (isEditMode) e.target.getStage()!.container().style.cursor = 'move';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'default';
                                    }}
                                />

                                {/* Mechanics - Centered */}
                                <Text
                                    id="mech"
                                    text={(cardData.back?.mechanics && cardData.back.mechanics.length > 0)
                                        ? cardData.back.mechanics
                                        : (cardData.abilityDesc || 'תיאור היכולת...')}
                                    x={0}
                                    y={Math.max(180, 200 + getOffset('mech', 'back'))}
                                    width={CARD_WIDTH}
                                    padding={getCustomStyle('mech', 'padding', 40, 'back')}
                                    fontSize={getCustomStyle('mech', 'fontSize', 36, 'back')}
                                    fontFamily={getCustomStyle('mech', 'fontFamily', 'Arial', 'back')}
                                    fill={getCustomStyle('mech', 'fill', '#2c1810', 'back')}
                                    {...getTextStyles('mech', 'back')}
                                    align="center"
                                    lineHeight={getCustomStyle('mech', 'lineHeight', 1.5, 'back')}
                                    letterSpacing={getCustomStyle('mech', 'letterSpacing', 0, 'back')}
                                    draggable={isEditMode}
                                    dragBoundFunc={(pos) => ({ x: 0, y: Math.max(30, Math.min(pos.y, CARD_HEIGHT - 100)) })}
                                    onClick={(e) => handleSelect(e, 'mech')}
                                    onDblClick={(e) => handleTextDblClick(e, 'mech', cardData.back?.mechanics || '')}
                                    onDragEnd={(e) => handleDragEnd(e, 'mech', 'back')}
                                    onMouseEnter={(e) => {
                                        if (isEditMode) e.target.getStage()!.container().style.cursor = 'move';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'default';
                                    }}
                                />

                                {/* Lore - Centered, always shown */}
                                <Text
                                    id="lore"
                                    text={(cardData.back?.lore && cardData.back.lore.length > 0)
                                        ? cardData.back.lore
                                        : (cardData.description || '')}
                                    x={0}
                                    y={550}
                                    width={CARD_WIDTH}
                                    padding={getCustomStyle('lore', 'padding', 40, 'back')}
                                    fontSize={getCustomStyle('lore', 'fontSize', 32, 'back')}
                                    fontFamily={getCustomStyle('lore', 'fontFamily', 'Arial', 'back')}
                                    fontStyle="italic"
                                    fill={getCustomStyle('lore', 'fill', '#666666', 'back')}
                                    {...getTextStyles('lore', 'back')}
                                    align="center"
                                    lineHeight={getCustomStyle('lore', 'lineHeight', 1.4, 'back')}
                                    letterSpacing={getCustomStyle('lore', 'letterSpacing', 0, 'back')}
                                    draggable={isEditMode}
                                    dragBoundFunc={(pos) => ({ x: 0, y: Math.max(30, Math.min(pos.y, CARD_HEIGHT - 50)) })}
                                    onClick={(e) => handleSelect(e, 'lore')}
                                    onDblClick={(e) => handleTextDblClick(e, 'lore', cardData.back?.lore || '')}
                                    onDragEnd={(e) => handleDragEnd(e, 'lore', 'back')}
                                    onMouseEnter={(e) => {
                                        if (isEditMode) e.target.getStage()!.container().style.cursor = 'move';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.getStage()!.container().style.cursor = 'default';
                                    }}
                                />
                            </>
                        )
                        }

                        {/* Transformer - Only show for image, text elements are just draggable */}
                        {isEditMode && selectedId === 'itemImage' && (
                            <Transformer
                                ref={transformerRef}
                                boundBoxFunc={(oldBox, newBox) => {
                                    if (newBox.width < 20 || newBox.height < 20) {
                                        return oldBox;
                                    }
                                    return newBox;
                                }}
                                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                                rotateEnabled={true}
                                padding={2}
                                borderStroke="#007bff"
                                borderStrokeWidth={2}
                                anchorSize={10}
                                anchorStroke="#007bff"
                                anchorFill="#fff"
                            />
                        )}
                    </Layer >
                </Stage >
            </div>

            {/* Canvas Controls */}
            <div className="canvas-controls">

                <button
                    className="flip-btn"
                    onClick={handleFlip}
                    title={isFlipped ? 'Show Front' : 'Show Back'}
                >
                    🔄 {isFlipped ? 'Front' : 'Back'}
                </button>
                <button
                    className="download-btn"
                    onClick={handleExport}
                    title="Download as PNG"
                >
                    💾 Download
                </button>
            </div >

            {/* Overlays (Floating Panel & Text Editor) */}
            {
                isEditMode && (
                    <>




                        {editingId && (
                            <textarea
                                autoFocus
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onBlur={handleTextEditComplete}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        handleTextEditComplete();
                                    }
                                }}
                                style={{
                                    position: 'absolute',
                                    top: (stageRef.current?.findOne('#' + editingId)?.getAbsolutePosition().y || 0) + 'px',
                                    left: (stageRef.current?.findOne('#' + editingId)?.getAbsolutePosition().x || 0) + 'px',
                                    width: ((stageRef.current?.findOne('#' + editingId)?.width() || 100) * (stageRef.current?.findOne('#' + editingId)?.getAbsoluteScale().x || 1)) + 'px',
                                    height: ((stageRef.current?.findOne('#' + editingId)?.height() || 30) * (stageRef.current?.findOne('#' + editingId)?.getAbsoluteScale().y || 1) * 1.5) + 'px',
                                    fontSize: ((stageRef.current?.findOne('#' + editingId)?.attrs.fontSize || 16) * (stageRef.current?.findOne('#' + editingId)?.getAbsoluteScale().y || 1)) + 'px',
                                    fontFamily: stageRef.current?.findOne('#' + editingId)?.attrs.fontFamily || 'Arial',
                                    textAlign: stageRef.current?.findOne('#' + editingId)?.attrs.align || 'left',
                                    color: stageRef.current?.findOne('#' + editingId)?.attrs.fill || 'black',
                                    background: 'rgba(255, 255, 255, 0.9)',
                                    border: '2px solid #007bff',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    zIndex: 200,
                                    resize: 'none',
                                    overflow: 'hidden',
                                    outline: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}
                            />
                        )}
                    </>
                )
            }

            {/* Floating Style Panel for TEXT */}
            {isEditMode && selectedId && selectedId !== 'itemImage' && (
                <FloatingStylePanel
                    selectedElement={selectedId}
                    side={isFlipped ? 'back' : 'front'}
                    onClose={() => selectShape(null)}
                />
            )}

            {/* Floating Image Panel for ITEM IMAGE */}
            {isEditMode && selectedId === 'itemImage' && (
                <FloatingImagePanel
                    side={isFlipped ? 'back' : 'front'} // Usually front, but supports back just in case
                    onClose={() => selectShape(null)}
                />
            )}
        </div>
    );
}

export default CardCanvas;

