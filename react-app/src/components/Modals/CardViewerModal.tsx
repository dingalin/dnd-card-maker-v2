import React, { useState, useEffect } from 'react';
import './CardViewerModal.css';
import { X, Trash2, Edit, RotateCw, RefreshCw } from 'lucide-react';

interface CardViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string | null;
    title?: string;
    onDelete?: () => void;
    onEdit?: () => void;
    onRegenerate?: () => void;
    getBackImage?: () => Promise<string | null>;
    getFrontImage?: () => Promise<string | null>;
}

export const CardViewerModal: React.FC<CardViewerModalProps> = ({
    isOpen,
    onClose,
    imageSrc,
    title = 'תצוגת קלף',
    onDelete,
    onEdit,
    onRegenerate,
    getBackImage,
    getFrontImage
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [frontImageSrc, setFrontImageSrc] = useState<string | null>(null);
    const [backImageSrc, setBackImageSrc] = useState<string | null>(null);
    const [isLoadingBack, setIsLoadingBack] = useState(false);
    const [lastLoadedImageSrc, setLastLoadedImageSrc] = useState<string | null>(null);

    // Load high-res front image when modal opens with NEW image
    useEffect(() => {
        if (!isOpen) return;

        // Only reload if this is a new image (different from last loaded)
        if (imageSrc === lastLoadedImageSrc && frontImageSrc) return;

        // Reset state for new image
        setIsFlipped(false);
        setBackImageSrc(null);
        setIsLoadingBack(false);

        if (getFrontImage) {
            setFrontImageSrc(null); // Show loading
            getFrontImage().then(src => {
                if (src) {
                    setFrontImageSrc(src);
                    setLastLoadedImageSrc(imageSrc);
                }
            }).catch(() => {
                // Fallback to thumbnail if high-res fails
                setFrontImageSrc(imageSrc);
                setLastLoadedImageSrc(imageSrc);
            });
        } else if (imageSrc) {
            setFrontImageSrc(imageSrc);
            setLastLoadedImageSrc(imageSrc);
        }
    }, [isOpen, imageSrc]);

    if (!isOpen) return null;

    const handleFlip = async () => {
        if (isFlipped) {
            setIsFlipped(false);
            return;
        }

        // If we already have the back image, just flip
        if (backImageSrc) {
            setIsFlipped(true);
            return;
        }

        // Load back image
        if (getBackImage) {
            setIsLoadingBack(true);
            try {
                const src = await getBackImage();
                if (src) {
                    setBackImageSrc(src);
                    setIsFlipped(true);
                }
            } catch (e) {
                console.error("Failed to load back image", e);
            } finally {
                setIsLoadingBack(false);
            }
        }
    };

    return (
        <div className="card-viewer-overlay" onClick={onClose}>
            <div className="card-viewer-content" onClick={e => e.stopPropagation()}>
                <button className="card-viewer-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={`card-flip-container ${isFlipped ? 'flipped' : ''}`}>
                    <div className="card-flip-inner">
                        <div className="card-face card-front">
                            {frontImageSrc ? (
                                <img
                                    src={frontImageSrc}
                                    alt={title}
                                    className="card-viewer-image"
                                />
                            ) : imageSrc && !getFrontImage ? (
                                <img
                                    src={imageSrc}
                                    alt={title}
                                    className="card-viewer-image"
                                />
                            ) : (
                                <div className="card-loading-placeholder">
                                    <div className="loading-spinner"></div>
                                    <span>טוען...</span>
                                </div>
                            )}
                        </div>
                        <div className="card-face card-back">
                            {backImageSrc ? (
                                <img src={backImageSrc} alt={`${title} - Back`} className="card-viewer-image" />
                            ) : (
                                <div className="card-back-placeholder">
                                    {isLoadingBack ? 'טוען צד אחורי...' : 'אין צד אחורי'}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="card-viewer-actions">
                    {onDelete && (
                        <button className="action-btn delete" onClick={onDelete} title="מחק">
                            <Trash2 size={24} />
                        </button>
                    )}
                    {onRegenerate && (
                        <button className="action-btn regenerate" onClick={onRegenerate} title="צור מחדש">
                            <RefreshCw size={24} />
                        </button>
                    )}
                    {getBackImage && (
                        <button className={`action-btn rotate ${isLoadingBack ? 'loading' : ''}`} onClick={handleFlip} title="סובב קלף">
                            <RotateCw size={24} className={isLoadingBack ? 'spin' : ''} />
                        </button>
                    )}
                    {onEdit && (
                        <button className="action-btn edit" onClick={onEdit} title="ערוך">
                            <Edit size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
