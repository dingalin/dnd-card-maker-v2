/**
 * useCardImages - Hook for managing card image loading and caching
 * Extracted from CardCanvas.tsx for better separation of concerns
 */

import { useState, useEffect, useRef } from 'react';
import type { AppState } from '../../../types';

interface UseCardImagesProps {
    cardData: any;
    isFlipped: boolean;
    settings: AppState['settings'];
}

interface UseCardImagesReturn {
    itemImage: HTMLImageElement | null;
    backgroundImage: HTMLImageElement | null;
    itemImageGroupRef: React.MutableRefObject<any>;
    shadowGroupRef: React.MutableRefObject<any>;
}

export function useCardImages({ cardData, isFlipped, settings }: UseCardImagesProps): UseCardImagesReturn {
    const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
    const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
    const itemImageGroupRef = useRef<any>(null);
    const shadowGroupRef = useRef<any>(null);

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
        console.log('[useCardImages] Background URL changed:', url);

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
            };
        } else {
            console.log('[useCardImages] No background URL provided, clearing image.');
            setBackgroundImage(null);
        }
    }, [cardData?.backgroundUrl]);

    // Effect to handle caching for Alpha Masking
    useEffect(() => {
        if (itemImageGroupRef.current && itemImage) {
            try {
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
        settings.front?.customStyles?.itemImage_fade,
        settings.back?.customStyles?.itemImage_fade,
        settings.front?.customStyles?.itemImage_maskShape,
        settings.back?.customStyles?.itemImage_maskShape,
        itemImage,
        isFlipped
    ]);

    // Shadow Cache Effect
    useEffect(() => {
        if (shadowGroupRef.current && itemImage) {
            try {
                shadowGroupRef.current.clearCache();
                shadowGroupRef.current.cache({
                    x: 0,
                    y: 0,
                    width: itemImage.width,
                    height: itemImage.height,
                    pixelRatio: 1
                });
                shadowGroupRef.current.getLayer()?.batchDraw();
            } catch (e) {
                console.warn('Failed to cache shadow group', e);
            }
        }
    }, [
        itemImage,
        settings.front?.customStyles?.itemImage_shadowBlur,
        settings.front?.customStyles?.itemImage_shadowColor,
        isFlipped
    ]);

    return {
        itemImage,
        backgroundImage,
        itemImageGroupRef,
        shadowGroupRef
    };
}
