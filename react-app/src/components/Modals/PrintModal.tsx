import { useState, useMemo } from 'react';
import type { CardData, AppSettings } from '../../types';
import type { CardTemplate } from '../../utils/CardLibraryManager';
import './PrintModal.css';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardData?: CardData | null;
    settings?: AppSettings;
    templates?: CardTemplate[];
}

type CardSize = 'standard' | 'mini' | 'tarot';
type PrintLayout = 'single' | 'grid-3x3' | 'a4-poker' | 'foldable';

const CARD_SIZES = {
    standard: { width: 63, height: 88, label: 'Standard (63×88mm)' },
    mini: { width: 44, height: 63, label: 'Mini (44×63mm)' },
    tarot: { width: 70, height: 120, label: 'Tarot (70×120mm)' }
};

function PrintModal({ isOpen, onClose, cardData, settings, templates }: PrintModalProps) {
    const [cardSize, setCardSize] = useState<CardSize>('standard');
    const [layout, setLayout] = useState<PrintLayout>('single');
    const [includeBacks, setIncludeBacks] = useState(true);

    const cardsToPrint = useMemo(() => {
        if (templates && templates.length > 0) return templates;
        if (cardData) return [{ id: 'current', name: cardData.name, cardData, settings: settings || {} } as CardTemplate];
        return [];
    }, [cardData, settings, templates]);

    if (!isOpen || cardsToPrint.length === 0) return null;

    const handlePrint = () => {
        window.print();
    };



    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="print-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🖨️ Print Cards</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-content">
                    <div className="print-options">
                        <div className="option-group">
                            <h3>Card Size</h3>
                            {Object.entries(CARD_SIZES).map(([key, size]) => (
                                <label key={key} className="radio-option">
                                    <input
                                        type="radio"
                                        name="cardSize"
                                        value={key}
                                        checked={cardSize === key}
                                        onChange={() => setCardSize(key as CardSize)}
                                    />
                                    <span>{size.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="option-group">
                            <h3>Layout</h3>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="layout"
                                    value="single"
                                    checked={layout === 'single'}
                                    onChange={() => setLayout('single')}
                                />
                                <span>Single Card</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="layout"
                                    value="grid-3x3"
                                    checked={layout === 'grid-3x3'}
                                    onChange={() => setLayout('grid-3x3')}
                                />
                                <span>3×3 Grid (9 cards)</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="layout"
                                    value="a4-poker"
                                    checked={layout === 'a4-poker'}
                                    onChange={() => setLayout('a4-poker')}
                                />
                                <span>A4 Poker Layout</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="layout"
                                    value="foldable"
                                    checked={layout === 'foldable'}
                                    onChange={() => setLayout('foldable')}
                                />
                                <span>Foldable (Side-by-Side)</span>
                            </label>
                        </div>

                        <div className="option-group">
                            <h3>Options</h3>
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={includeBacks}
                                    onChange={(e) => setIncludeBacks(e.target.checked)}
                                    disabled={layout === 'foldable'}
                                />
                                <span>Include card backs</span>
                            </label>
                            {layout === 'foldable' && (
                                <p style={{ fontSize: '0.8rem', color: '#666', marginLeft: '1.8rem', marginTop: '0.2rem' }}>
                                    Prints Back and Front side-by-side for easy folding.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="print-preview">
                        <h3>Preview {cardsToPrint.length > 0 ? `(${cardsToPrint.length} cards${includeBacks ? ' + Backs' : ''})` : ''}</h3>

                        {/* FRONT PAGE */}
                        {layout === 'foldable' ? (
                            /* FOLDABLE LAYOUT: Back + Front side-by-side per card in a grid */
                            <div className={`preview-container layout-foldable`} style={{ '--card-width': `${CARD_SIZES[cardSize].width}mm`, '--card-height': `${CARD_SIZES[cardSize].height}mm` } as React.CSSProperties}>
                                {cardsToPrint.map((card, index) => (
                                    <div key={`foldable-${card.id || index}`} className="preview-card-wrapper foldable-pair" style={{ width: `${CARD_SIZES[cardSize].width * 2}mm`, height: `${CARD_SIZES[cardSize].height}mm` }}>
                                        {/* LEFT: Back (normal orientation - will be on inside when folded) */}
                                        <div className="foldable-half back-half">
                                            {card.thumbnailBack ? (
                                                <img src={card.thumbnailBack} alt="Back" className="preview-card-image" />
                                            ) : (
                                                <div className="preview-card html-preview" style={{ background: '#333', color: '#fff' }}>Back</div>
                                            )}
                                        </div>
                                        {/* RIGHT: Front */}
                                        <div className="foldable-half front-half">
                                            {card.thumbnailFront ? (
                                                <img src={card.thumbnailFront} alt={card.name} className="preview-card-image" />
                                            ) : (
                                                <div className="preview-card html-preview">
                                                    <div className="card-name">{card.name || 'Card'}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* OTHER LAYOUTS: Single, Grid, A4 */
                            <div className={`preview-container layout-${layout}`} style={{ '--card-width': `${CARD_SIZES[cardSize].width}mm`, '--card-height': `${CARD_SIZES[cardSize].height}mm` } as React.CSSProperties}>
                                {cardsToPrint.map((card, index) => (
                                    <div key={`front-${card.id || index}`} className="preview-card-wrapper" style={{ width: `${CARD_SIZES[cardSize].width}mm`, height: `${CARD_SIZES[cardSize].height}mm` }}>
                                        {card.thumbnailFront ? (
                                            <img src={card.thumbnailFront} alt={card.name} className="preview-card-image" />
                                        ) : (
                                            <div className="preview-card html-preview">
                                                <div className="card-name">{card.name || 'Card'}</div>
                                                <div className="card-size-info">Front</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {layout === 'grid-3x3' && cardsToPrint.length < 9 && (
                                    Array(9 - cardsToPrint.length).fill(0).map((_, i) => (
                                        <div key={`front-placeholder-${i}`} className="preview-card-wrapper placeholder" style={{ width: `${CARD_SIZES[cardSize].width}mm`, height: `${CARD_SIZES[cardSize].height}mm` }} />
                                    ))
                                )}
                            </div>
                        )}

                        {/* BACK PAGE (If enabled and NOT foldable - foldable already includes backs) */}
                        {includeBacks && layout !== 'foldable' && (
                            <>
                                <h3 style={{ marginTop: '2rem', color: '#666' }}>Page 2: Backs (Mirrored for Duplex)</h3>
                                <div className={`preview-container layout-${layout} page-break`}>
                                    {/* For Grid 3x3, we must mirror each ROW of 3 cards */}
                                    {layout === 'grid-3x3' ? (
                                        // Logic: chunk into 3s, reverse each chunk, flatten
                                        Array.from({ length: Math.ceil(Math.max(cardsToPrint.length, 9) / 3) }).flatMap((_, rowIndex) => {
                                            const rowStart = rowIndex * 3;
                                            const rowCards = [];
                                            // Fill row with actual cards or nulls (to maintain grid)
                                            for (let i = 0; i < 3; i++) {
                                                const cardIndex = rowStart + i;
                                                rowCards.push(cardIndex < cardsToPrint.length ? cardsToPrint[cardIndex] : null);
                                            }
                                            // REVERSE THE ROW (Mirroring)
                                            return rowCards.reverse();
                                        }).map((card, index) => (
                                            <div key={`back-${index}`} className={`preview-card-wrapper ${!card ? 'placeholder' : ''}`}>
                                                {card && card.thumbnailBack ? (
                                                    <img src={card.thumbnailBack} alt="Back" className="preview-card-image" />
                                                ) : card ? (
                                                    <div className="preview-card html-preview" style={{ background: '#333' }}>
                                                        <div className="card-name" style={{ color: '#fff' }}>Back</div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ))
                                    ) : (
                                        // Single mode or others - just map normally
                                        cardsToPrint.map((card, index) => (
                                            <div key={`back-${index}`} className="preview-card-wrapper">
                                                {card.thumbnailBack ? (
                                                    <img src={card.thumbnailBack} alt="Back" className="preview-card-image" />
                                                ) : (
                                                    <div className="preview-card html-preview" style={{ background: '#333' }}>
                                                        <div className="card-name" style={{ color: '#fff' }}>Back</div>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="btn-metallic btn-silver">
                        Cancel
                    </button>
                    <button onClick={handlePrint} className="btn-metallic btn-gold">
                        🖨️ Print {cardsToPrint.length > 1 ? `(${cardsToPrint.length})` : ''}
                    </button>
                </div>
            </div>
        </>
    );
}

export default PrintModal;
