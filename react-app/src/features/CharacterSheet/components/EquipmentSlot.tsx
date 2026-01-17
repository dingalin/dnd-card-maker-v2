import type { SlotConfig, EquippedItem } from '../types/character';
import './EquipmentSlot.css';

interface EquipmentSlotProps {
    config: SlotConfig;
    item: EquippedItem | null;
    onClick?: () => void;
    onAutoGenerate?: () => void;
    isLoading?: boolean;
}

export default function EquipmentSlot({
    config,
    item,
    onClick,
    onAutoGenerate,
    isLoading = false
}: EquipmentSlotProps) {
    const handleAutoGenClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAutoGenerate?.();
    };

    return (
        <div
            className={`equipment-slot ${config.id}-slot ${item ? 'has-item' : ''}`}
            data-slot={config.id}
            onClick={onClick}
        >
            <div className="slot-label">{config.labelHe}</div>

            <div className="slot-content">
                {isLoading ? (
                    <div className="slot-loader">
                        <div className="slot-spinner"></div>
                    </div>
                ) : item ? (
                    <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="equipped-item-icon"
                        draggable
                        data-unique-id={item.uniqueId}
                        data-item-name={item.name}
                    />
                ) : (
                    <img
                        className="slot-placeholder-icon"
                        src={`${import.meta.env.BASE_URL}assets/icons/${config.icon}`}
                        alt=""
                    />
                )}
            </div>

            {/* Hover Overlay with Dice Button (Hide while loading) */}
            {!item && !isLoading && (
                <div className="slot-overlay">
                    <div
                        className="dice-button"
                        onClick={handleAutoGenClick}
                        title="צור חפץ אוטומטי (Common)"
                    >
                        <span className="dice-icon">🎲</span>
                    </div>
                </div>
            )}
        </div>
    );
}
