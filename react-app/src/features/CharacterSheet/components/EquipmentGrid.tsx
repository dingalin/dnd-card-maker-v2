import { EQUIPMENT_SLOTS } from '../types/character';
import type { EquipmentSlotId, EquippedItem } from '../types/character';
import EquipmentSlot from './EquipmentSlot';
import './EquipmentGrid.css';

interface EquipmentGridProps {
    equipment: Partial<Record<EquipmentSlotId, EquippedItem | null>>;
    portraitUrl?: string | null;
    onSlotClick?: (slotId: EquipmentSlotId, item: EquippedItem | null) => void;
    onAutoGenerate?: (slotId: EquipmentSlotId) => void;
    loadingSlots?: Record<string, boolean>;
}

export default function EquipmentGrid({
    equipment,
    portraitUrl,
    onSlotClick,
    onAutoGenerate,
    loadingSlots
}: EquipmentGridProps) {
    // V2 Grid layout: 4 columns x 4 rows with portrait in center 2x2
    const row1: EquipmentSlotId[] = ['ranged', 'necklace', 'helmet', 'cape'];
    const row2Left: EquipmentSlotId = 'offhand';
    const row2Right: EquipmentSlotId = 'mainhand';
    const row3Left: EquipmentSlotId = 'armor';
    const row3Right: EquipmentSlotId = 'gloves';
    const row4: EquipmentSlotId[] = ['ring1', 'belt', 'boots', 'ring2'];

    const getSlotConfig = (id: EquipmentSlotId) =>
        EQUIPMENT_SLOTS.find(s => s.id === id)!;

    const renderSlot = (id: EquipmentSlotId) => {
        const config = getSlotConfig(id);
        return (
            <EquipmentSlot
                key={id}
                config={config}
                item={equipment[id] || null}
                onClick={() => onSlotClick?.(id, equipment[id] || null)}
                onAutoGenerate={() => onAutoGenerate?.(id)}
                isLoading={loadingSlots?.[id]}
            />
        );
    };

    return (
        <div className="equipment-grid-v2">
            {/* Row 1: 4 slots */}
            <div className="equipment-row">
                {row1.map(renderSlot)}
            </div>

            {/* Rows 2-3: Equipment on sides, Portrait in center 2x2 */}
            <div className="equipment-middle-rows">
                {/* Left column (2 slots stacked) */}
                <div className="equipment-side-column">
                    {renderSlot(row2Left)}
                    {renderSlot(row3Left)}
                </div>

                {/* Portrait in center (2x2) */}
                <div className="portrait-slot">
                    {portraitUrl ? (
                        <img src={portraitUrl} alt="Character" className="portrait-image" />
                    ) : (
                        <div className="portrait-placeholder">
                            <span className="portrait-icon">👤</span>
                        </div>
                    )}
                </div>

                {/* Right column (2 slots stacked) */}
                <div className="equipment-side-column">
                    {renderSlot(row2Right)}
                    {renderSlot(row3Right)}
                </div>
            </div>

            {/* Row 4: 4 slots */}
            <div className="equipment-row">
                {row4.map(renderSlot)}
            </div>
        </div>
    );
}
