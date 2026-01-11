import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage, Group, Circle, RegularPolygon } from 'react-konva';
import FloatingStylePanel from './FloatingStylePanel';
import FloatingImagePanel from './FloatingImagePanel';
import { BackgroundLayer } from './Layers/BackgroundLayer';
import { TextLayer } from './Layers/TextLayer';
import { OverlayLayer } from './Layers/OverlayLayer';
import { useCardContext } from '../../store';
import { LAYOUT, CARD_WIDTH, CARD_HEIGHT } from './utils/canvasUtils';
import './CardCanvas.css';

const SCALE = 0.4;

function CardCanvas() {
    const { state, updateOffset, updateCardField, updateBatchOffsets } = useCardContext();
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
                setEditingId(null);
                if (transformerRef.current) {
                    transformerRef.current.nodes([]);
                }
            }
        };

        // Use mousedown to capture the interaction early just like Konva
        document.addEventListener('mousedown', handleGlobalClick);

        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [isEditMode, selectedId]);

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

        updateBatchOffsets([
            { key: 'imageXOffset', value: node.x() - BASE_X, side: 'front' },
            { key: 'imageYOffset', value: node.y() - BASE_Y, side: 'front' },
            { key: 'imageScale', value: scaleX, side: 'front' },
            { key: 'imageRotation', value: node.rotation(), side: 'front' }
        ]);
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
    // This allows the Shadow to be applied to the final masked shape.
    useEffect(() => {
        if (itemImageGroupRef.current && itemImage) {
            try {
                // Determine padding based on shadow size to avoid clipping
                // We access the current styles directly or via helpers if needed, 
                // but here we can just use the dependency values if we extracted them, 
                // or re-read from state since we are in an effect.
                const shadowBlur = getCustomStyle('itemImage', 'shadowBlur', 0);
                const shadowOffsetX = getCustomStyle('itemImage', 'shadowOffsetX', 0);
                const shadowOffsetY = getCustomStyle('itemImage', 'shadowOffsetY', 0);

                // Calculate safe padding: Blur spreads in all directions. Offset shifts it.
                // We add a healthy margin (multiplier 3 for blur) to be safe.
                const padding = (shadowBlur * 3) + Math.max(Math.abs(shadowOffsetX), Math.abs(shadowOffsetY)) + 40;

                // Cache the Inner Group (Mask + Image)
                // We MUST include padding in the cache area to capture the shadow!
                itemImageGroupRef.current.cache({
                    x: -padding,
                    y: -padding,
                    width: itemImage.width + (padding * 2),
                    height: itemImage.height + (padding * 2),
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
        // Shadow deps need to be here to trigger re-cache
        state.settings.front?.customStyles?.itemImage_shadowBlur,
        state.settings.back?.customStyles?.itemImage_shadowBlur,
        state.settings.front?.customStyles?.itemImage_shadowOffsetX,
        state.settings.back?.customStyles?.itemImage_shadowOffsetX,
        state.settings.front?.customStyles?.itemImage_shadowOffsetY,
        state.settings.back?.customStyles?.itemImage_shadowOffsetY,
        state.settings.front?.customStyles?.itemImage_shadowColor,
        state.settings.back?.customStyles?.itemImage_shadowColor,
        itemImage,
        isFlipped
    ]);

    const handleDragEndWrapper = (e: any, key: string, side: 'front' | 'back' = 'front') => {
        handleDragEnd(e, key, side);
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
                        <BackgroundLayer
                            width={CARD_WIDTH}
                            height={CARD_HEIGHT}
                            backgroundImage={backgroundImage}
                            backgroundScale={getOffset('backgroundScale') || 1}
                            onMouseDown={checkDeselect}
                        />

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
                        />

                        {/* 4. ITEM IMAGE GROUP with Alpha Masking & Shadow (Hybrid Strategy) - FRONT ONLY */}
                        {!isFlipped && itemImage && (() => {
                            // Safe reference for TS
                            const img = itemImage!;
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
                                    dragBoundFunc={(pos) => ({ x: pos.x, y: pos.y })} // Allow free movement
                                    onClick={(e) => handleSelect(e, 'itemImage')}
                                    onDragEnd={handleImageDragEnd}
                                    onTransformEnd={handleImageTransformEnd}
                                    onMouseEnter={(e) => { if (isEditMode) e.target.getStage()!.container().style.cursor = 'move'; }}
                                    onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = 'default'; }}
                                >
                                    {/* INNER GROUP (Cached for Masking) */}
                                    <Group
                                        ref={(node) => {
                                            if (node) itemImageGroupRef.current = node;
                                        }}
                                        // Shadow applied to Inner Group (baked into cache)
                                        shadowColor={shadowColor}
                                        shadowBlur={shadowBlur}
                                        shadowOffsetX={shadowOffsetX}
                                        shadowOffsetY={shadowOffsetY}
                                        shadowOpacity={1}
                                        shadowEnabled={true}
                                    >
                                        <KonvaImage
                                            image={img}
                                            width={img.width}
                                            height={img.height}
                                        />
                                        {(() => {
                                            const maskShape = getCustomStyle('itemImage', 'maskShape', 'square');
                                            const center = { x: img.width / 2, y: img.height / 2 };

                                            // Gradient Logic
                                            // For Square/Diamond, we want the gradient to cover the corners if fade is low
                                            // For Circle, we want it to match the edges
                                            const endRadius = maskShape === 'circle'
                                                ? Math.max(img.width, img.height) * 0.5
                                                : Math.sqrt(Math.pow(img.width, 2) + Math.pow(img.height, 2)) * 0.5;

                                            const gradientProps = {
                                                fillRadialGradientStartRadius: 0,
                                                fillRadialGradientEndRadius: endRadius,
                                                fillRadialGradientColorStops: [
                                                    0, 'rgba(0,0,0,1)',
                                                    Math.max(0, 1 - (fade / 100)), 'rgba(0,0,0,1)',
                                                    1, 'rgba(0,0,0,0)'
                                                ],
                                                globalCompositeOperation: "destination-in" as const
                                            };

                                            switch (maskShape) {
                                                case 'circle':
                                                    return (
                                                        <Circle
                                                            x={center.x}
                                                            y={center.y}
                                                            radius={Math.min(img.width, img.height) / 2}
                                                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                                                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                                                            {...gradientProps}
                                                        />
                                                    );
                                                case 'diamond':
                                                    return (
                                                        <RegularPolygon
                                                            x={center.x}
                                                            y={center.y}
                                                            sides={4}
                                                            radius={Math.min(img.width, img.height) / 2}
                                                            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                                                            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                                                            rotation={0}
                                                            {...gradientProps}
                                                        />
                                                    );
                                                case 'rounded':
                                                    return (
                                                        <Rect
                                                            width={img.width}
                                                            height={img.height}
                                                            cornerRadius={Math.min(img.width, img.height) * 0.15}
                                                            fillRadialGradientStartPoint={center}
                                                            fillRadialGradientEndPoint={center}
                                                            {...gradientProps}
                                                        />
                                                    );
                                                case 'square':
                                                default:
                                                    return (
                                                        <Rect
                                                            width={img.width}
                                                            height={img.height}
                                                            fillRadialGradientStartPoint={center}
                                                            fillRadialGradientEndPoint={center}
                                                            {...gradientProps}
                                                        />
                                                    );
                                            }
                                        })()}
                                    </Group>
                                </Group>
                            );
                        })()}

                        {/* Overlay Layer for Selection/Transform */}
                        <OverlayLayer selectedId={selectedId} isEditMode={isEditMode} />
                    </Layer>
                </Stage>
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

