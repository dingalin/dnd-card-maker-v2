import { useState } from 'react';
import type { CardData, AppSettings } from '../../types';
import './PrintModal.css';

interface PrintModalProps {
    isOpen: boolean;
    onClose: () => void;
    cardData: CardData | null;
    settings: AppSettings;
}

type CardSize = 'standard' | 'mini' | 'tarot';
type PrintLayout = 'single' | 'grid-3x3' | 'a4-poker';

const CARD_SIZES = {
    standard: { width: 63, height: 88, label: 'Standard (63×88mm)' },
    mini: { width: 44, height: 63, label: 'Mini (44×63mm)' },
    tarot: { width: 70, height: 120, label: 'Tarot (70×120mm)' }
};

function PrintModal({ isOpen, onClose, cardData, settings: _settings }: PrintModalProps) {
    const [cardSize, setCardSize] = useState<CardSize>('standard');
    const [layout, setLayout] = useState<PrintLayout>('single');
    const [includeBacks, setIncludeBacks] = useState(true);

    if (!isOpen || !cardData) return null;

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        // TODO: Implement PDF export
        alert('PDF export coming soon!');
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose} />
            <div className="print-modal">
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
                        </div>

                        <div className="option-group">
                            <h3>Options</h3>
                            <label className="checkbox-option">
                                <input
                                    type="checkbox"
                                    checked={includeBacks}
                                    onChange={(e) => setIncludeBacks(e.target.checked)}
                                />
                                <span>Include card backs</span>
                            </label>
                        </div>
                    </div>

                    <div className="print-preview">
                        <h3>Preview</h3>
                        <div className={`preview-container layout-${layout}`}>
                            <div className="preview-card">
                                <div className="card-name">{cardData.name || 'Card'}</div>
                                <div className="card-size-info">
                                    {CARD_SIZES[cardSize].width}×{CARD_SIZES[cardSize].height}mm
                                </div>
                            </div>
                            {layout === 'grid-3x3' && (
                                Array(8).fill(0).map((_, i) => (
                                    <div key={i} className="preview-card placeholder">
                                        <div className="card-name">...</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={onClose} className="cancel-btn">
                        Cancel
                    </button>
                    <button onClick={handleExportPDF} className="export-btn">
                        📄 Export PDF
                    </button>
                    <button onClick={handlePrint} className="print-btn">
                        🖨️ Print
                    </button>
                </div>
            </div>
        </>
    );
}

export default PrintModal;
