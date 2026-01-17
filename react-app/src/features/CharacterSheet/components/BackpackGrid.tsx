import { BACKPACK_SIZE } from '../types/character';
import type { EquippedItem } from '../types/character';
import './BackpackGrid.css';

interface BackpackGridProps {
    items: (EquippedItem | null)[];
    onSlotClick?: (index: number, item: EquippedItem | null) => void;
}

export default function BackpackGrid({ items, onSlotClick }: BackpackGridProps) {
    return (
        <div className="backpack-container">
            <div className="backpack-header">
                <span className="backpack-icon">🎒</span>
                <span className="backpack-title">תיק גב</span>
            </div>

            <div className="backpack-grid">
                {Array.from({ length: BACKPACK_SIZE }).map((_, index) => {
                    const item = items[index];
                    return (
                        <div
                            key={index}
                            className={`backpack-slot ${item ? 'has-item' : ''}`}
                            data-backpack-slot={index}
                            onClick={() => onSlotClick?.(index, item)}
                        >
                            <div className="slot-content">
                                {item && (
                                    <img
                                        src={item.thumbnail}
                                        alt={item.name}
                                        className="backpack-item-icon"
                                        draggable
                                        data-unique-id={item.uniqueId}
                                        data-item-name={item.name}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
