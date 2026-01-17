import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import Konva from 'konva';
import { Stage, Layer, Group, Rect, Image as KonvaImage, Shape } from 'react-konva';
import { BackgroundLayer } from '../../../components/Canvas/Layers/BackgroundLayer';
import { TextLayer } from '../../../components/Canvas/Layers/TextLayer';
import { CARD_WIDTH, CARD_HEIGHT, roundedCornerClip, SilhouetteFilter } from '../../../components/Canvas/utils/canvasUtils';

export interface HeadlessGeneratorHandle {
    generateThumbnail: (cardData: any, settings?: any, side?: 'front' | 'back') => Promise<string | null>;
}

export const HeadlessCardGenerator = forwardRef<HeadlessGeneratorHandle, {}>((_, ref) => {
    const stageRef = useRef<any>(null);
    const [cardData, setCardData] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
    const [isFlipped, setIsFlipped] = useState(false); // Side state

    // Load background image when cardData changes
    useEffect(() => {
        if (cardData?.backgroundUrl) {
            const img = new window.Image();
            img.src = cardData.backgroundUrl;
            img.crossOrigin = 'anonymous';
            img.onload = () => setBackgroundImage(img);
        } else {
            setBackgroundImage(null);
        }
    }, [cardData?.backgroundUrl]);

    // Load item image when cardData changes
    useEffect(() => {
        if (cardData?.itemImageUrl) {
            const img = new window.Image();
            img.src = cardData.itemImageUrl;
            img.crossOrigin = 'anonymous';
            img.onload = () => setItemImage(img);
        } else {
            setItemImage(null);
        }
    }, [cardData?.itemImageUrl]);

    useImperativeHandle(ref, () => ({
        generateThumbnail: async (data: any, newSettings?: any, side: 'front' | 'back' = 'front') => {
            // Helper to load an image and return a promise
            const loadImage = (url: string): Promise<HTMLImageElement | null> => {
                return new Promise((resolve) => {
                    if (!url) {
                        resolve(null);
                        return;
                    }
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => {
                        console.warn('Failed to load image:', url?.substring(0, 50));
                        resolve(null);
                    };
                    img.src = url;
                });
            };

            // Load images first (before setting state)
            const [bgImg, itemImg] = await Promise.all([
                loadImage(data?.backgroundUrl),
                loadImage(data?.itemImageUrl)
            ]);

            // Now set state with pre-loaded images
            setBackgroundImage(bgImg);
            setItemImage(itemImg);
            setCardData(data);
            if (newSettings) setSettings(newSettings);
            setIsFlipped(side === 'back');

            // Wait for React to render with the new state
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (stageRef.current) {
                        const uri = stageRef.current.toDataURL({ pixelRatio: 2.0 });
                        resolve(uri);
                    } else {
                        resolve(null);
                    }
                }, 100); // Short delay just for React render, images already loaded
            });
        }
    }));

    if (!cardData) return null;

    const currentSide = isFlipped ? 'back' : 'front';

    // Helper for Custom Styles
    const getOffset = (key: string, side: 'front' | 'back' = currentSide) => {
        if (!settings || !settings[side] || !settings[side].offsets) return 0;
        return settings[side].offsets[key] || 0;
    };

    const getCustomStyle = (key: string, prop: string, defaultValue: any, side: 'front' | 'back' = currentSide) => {
        if (!settings || !settings[side] || !settings[side].customStyles) return defaultValue;
        const override = settings[side].customStyles[`${key}_${prop}`];
        return override !== undefined ? override : defaultValue;
    };

    const getTextStyles = (key: string, side: 'front' | 'back' = currentSide) => {
        const styles: any = {};
        if (getCustomStyle(key, 'shadowEnabled', false, side)) {
            styles.shadowColor = getCustomStyle(key, 'shadowColor', '#000000', side);
            styles.shadowBlur = getCustomStyle(key, 'shadowBlur', 5, side);
            styles.shadowOffsetX = getCustomStyle(key, 'shadowOffsetX', 2, side);
            styles.shadowOffsetY = getCustomStyle(key, 'shadowOffsetY', 2, side);
            styles.shadowOpacity = 0.8;
        }
        if (getCustomStyle(key, 'glowEnabled', false, side)) {
            styles.shadowColor = getCustomStyle(key, 'glowColor', '#FFD700', side);
            styles.shadowBlur = getCustomStyle(key, 'glowBlur', 10, side);
            styles.shadowOffsetX = 0;
            styles.shadowOffsetY = 0;
            styles.shadowOpacity = 1;
        }
        return styles;
    };


    return (
        <div style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            // Make sure the container has enough size for the Stage
            width: `${CARD_WIDTH}px`,
            height: `${CARD_HEIGHT}px`,
            overflow: 'hidden',
            pointerEvents: 'none',
        }}>
            <Stage
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
                ref={stageRef}
            >
                <Layer clipFunc={roundedCornerClip}>
                    <BackgroundLayer
                        width={CARD_WIDTH}
                        height={CARD_HEIGHT}
                        backgroundImage={backgroundImage}
                        backgroundScale={getOffset('backgroundScale') || 1}
                        onMouseDown={() => { }}
                    />

                    {/* ITEM IMAGE GROUP (Copied from CardCanvas) - FRONT ONLY */}
                    {!isFlipped && itemImage && (() => {
                        const img = itemImage;
                        const fade = getCustomStyle('itemImage', 'fade', 0);
                        const shadowBlur = getCustomStyle('itemImage', 'shadowBlur', 0);
                        const shadowColor = getCustomStyle('itemImage', 'shadowColor', '#000000');
                        const shadowOffsetX = getCustomStyle('itemImage', 'shadowOffsetX', 0);
                        const shadowOffsetY = getCustomStyle('itemImage', 'shadowOffsetY', 0);
                        const maskShape = getCustomStyle('itemImage', 'maskShape', 'square');
                        const borderWidth = getCustomStyle('itemImage', 'borderWidth', 0);

                        // Image transforms
                        const imgX = CARD_WIDTH / 2; // Always centered
                        const imgY = 240 + (getOffset('imageYOffset') || 0);
                        const imgScale = getOffset('imageScale') || 1;
                        const imgRotation = getOffset('imageRotation') || 0;

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

                        const angleRad = (imgRotation * Math.PI) / 180;
                        const cos = Math.cos(-angleRad);
                        const sin = Math.sin(-angleRad);
                        const fixedShadowOffsetX = shadowOffsetX * cos - shadowOffsetY * sin;
                        const fixedShadowOffsetY = shadowOffsetX * sin + shadowOffsetY * cos;

                        return (
                            <Group
                                x={imgX}
                                y={imgY}
                                offset={{ x: img.width / 2, y: img.height / 2 }}
                                scaleX={imgScale}
                                scaleY={imgScale}
                                rotation={imgRotation}
                            >
                                {/* Shadow */}
                                <Group
                                    x={fixedShadowOffsetX}
                                    y={fixedShadowOffsetY}
                                    opacity={1}
                                    visible={shadowBlur > 0}
                                >
                                    <Group
                                        filters={[Konva.Filters.Blur]}
                                        blurRadius={shadowBlur}
                                    >
                                        <KonvaImage
                                            image={img}
                                            width={img.width}
                                            height={img.height}
                                            filters={[SilhouetteFilter]}
                                        />
                                        <Rect
                                            width={img.width}
                                            height={img.height}
                                            fill={shadowColor}
                                            globalCompositeOperation="source-in"
                                        />
                                    </Group>
                                </Group>

                                {/* Masked Image */}
                                <Group clipFunc={maskShape !== 'square' ? drawMaskPath : undefined}>
                                    <KonvaImage image={img} width={img.width} height={img.height} />
                                    {fade > 0 && (
                                        <Rect
                                            width={img.width}
                                            height={img.height}
                                            fillRadialGradientStartPoint={{ x: img.width / 2, y: img.height / 2 }}
                                            fillRadialGradientStartRadius={0}
                                            fillRadialGradientEndPoint={{ x: img.width / 2, y: img.height / 2 }}
                                            fillRadialGradientEndRadius={Math.min(img.width, img.height) / 2}
                                            fillRadialGradientColorStops={[
                                                0, 'white',
                                                Math.max(0, 1 - (fade / 100)), 'white',
                                                1, 'rgba(255,255,255,0)'
                                            ]}
                                            globalCompositeOperation="destination-in"
                                        />
                                    )}
                                </Group>

                                {/* Border */}
                                {borderWidth > 0 && (() => {
                                    const f = (getCustomStyle('itemImage', 'borderFade', 0) || 0) / 100;
                                    const dynamicStrokeWidth = Math.max(1, borderWidth * (1 - (f * 0.8)));
                                    const dynamicShadowBlur = borderWidth * f * 3;

                                    return (
                                        <Shape
                                            sceneFunc={(ctx: any, shape: any) => {
                                                drawMaskPath(ctx);
                                                ctx.fillStrokeShape(shape);
                                            }}
                                            stroke="black"
                                            strokeWidth={dynamicStrokeWidth}
                                            shadowColor="black"
                                            shadowBlur={dynamicShadowBlur}
                                            shadowOpacity={1}
                                        />
                                    );
                                })()}
                            </Group>
                        );
                    })()}

                    <TextLayer
                        cardData={cardData}
                        isFlipped={isFlipped}
                        isEditMode={false}
                        getOffset={getOffset}
                        getCustomStyle={getCustomStyle}
                        getTextStyles={getTextStyles}
                        onSelect={() => { }}
                        onDblClick={() => { }}
                        onDragEnd={() => { }}
                        onTransformEnd={() => { }}
                        onHoverEnter={() => { }}
                        onHoverLeave={() => { }}
                    />
                </Layer>
            </Stage>
        </div>
    );
});

HeadlessCardGenerator.displayName = 'HeadlessCardGenerator';
