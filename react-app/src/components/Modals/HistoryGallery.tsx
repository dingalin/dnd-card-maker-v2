import { useState } from 'react';
import { useCardHistory } from '../../services/storage';
import { useCardContext } from '../../store';
import type { HistoryItem } from '../../types';
import './HistoryGallery.css';

interface HistoryGalleryProps {
    isOpen: boolean;
    onClose: () => void;
}

function HistoryGallery({ isOpen, onClose }: HistoryGalleryProps) {
    const { cards, loading, deleteCard } = useCardHistory();
    const { setCardData } = useCardContext();
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleLoadCard = (card: HistoryItem) => {
        setCardData(card.cardData);
        onClose();
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this card?')) {
            await deleteCard(id);
            if (selectedCard === id) {
                setSelectedCard(null);
            }
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content history-gallery" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>💾 Card History</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">Loading cards...</div>
                    ) : cards.length === 0 ? (
                        <div className="empty-state">
                            <p>No saved cards yet!</p>
                            <p className="empty-hint">Cards are automatically saved when you create or edit them.</p>
                        </div>
                    ) : (
                        <div className="gallery-grid">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className={`gallery-card`}
                                    onClick={() => setSelectedCard(card.id)}
                                >
                                    <div className="card-thumbnail">
                                        {card.thumbnail ? (
                                            <img src={card.thumbnail} alt={card.cardData.name || 'Card'} />
                                        ) : (
                                            <div className="placeholder-thumbnail">
                                                <span className="card-icon">🎴</span>
                                                <p className="card-name">{card.cardData.front?.title || card.cardData.name || 'Unnamed'}</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-info">
                                        <p className="card-title">{card.cardData.front?.title || card.cardData.name || 'Unnamed Item'}</p>
                                        <p className="card-meta">
                                            {card.cardData.front?.rarity || card.cardData.rarityHe || 'Common'}
                                        </p>
                                        <p className="card-date">{new Date(card.savedAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className="card-actions">
                                        <button
                                            className="load-btn"
                                            onClick={(e) => { e.stopPropagation(); handleLoadCard(card); }}
                                            title="Load this card"
                                        >
                                            📂 Load
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => handleDelete(card.id, e)}
                                            title="Delete this card"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <p className="card-count">{cards.length} card{cards.length !== 1 ? 's' : ''} saved</p>
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>

            {/* ZOOM OVERLAY */}
            {selectedCard && (
                <div className="zoom-overlay" onClick={(e) => { e.stopPropagation(); setSelectedCard(null); }}>
                    <div className="zoom-container" onClick={(e) => e.stopPropagation()}>
                        <button className="zoom-close" onClick={() => setSelectedCard(null)}>×</button>
                        {(() => {
                            const card = cards.find(c => c.id === selectedCard);
                            if (!card) return null;

                            return card.thumbnail ? (
                                <img
                                    src={card.thumbnail}
                                    className="zoom-image"
                                    alt={card.cardData.name || 'Zoomed Card'}
                                />
                            ) : (
                                <div className="zoom-image placeholder-zoom">
                                    <div className="placeholder-thumbnail" style={{ background: 'white', borderRadius: '20px', width: '400px', height: '600px' }}>
                                        <span className="card-icon" style={{ fontSize: '5rem' }}>🎴</span>
                                        <h2 className="card-name" style={{ fontSize: '1.5rem' }}>{card.cardData.front?.title || card.cardData.name}</h2>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}

export default HistoryGallery;
