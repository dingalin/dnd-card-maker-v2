import React from 'react';
import { TYPE_TO_SUBTYPES } from '../../../data/itemSubtypes';
import './ItemCreationForm.css';

interface BasicInfoSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    type: string;
    setType: (val: string) => void;
    subtype: string;
    setSubtype: (val: string) => void;
    rarity: string;
    setRarity: (val: string) => void;
    attunement: boolean;
    setAttunement: (val: boolean) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
    isOpen,
    onToggle,
    type,
    setType,
    subtype,
    setSubtype,
    rarity,
    setRarity,
    attunement,
    setAttunement
}) => {
    return (
        <>
            <div className="section-header" onClick={onToggle}>
                <span className="section-icon">{isOpen ? '▼' : '▶'}</span>
                <span className="section-title">BASIC INFO 📄</span>
            </div>

            <div className={`section-content ${isOpen ? 'open' : ''}`}>
                <div style={{ padding: '15px' }}>
                    <div className="form-group">
                        <label>Type</label>
                        <select value={type} onChange={(e) => {
                            setType(e.target.value);
                            setSubtype(''); // Reset subtype when type changes
                        }}>
                            <option value="נשק">נשק (Weapon)</option>
                            <option value="שריון">שריון (Armor)</option>
                            <option value="שיקוי">שיקוי (Potion)</option>
                            <option value="טבעת">טבעת (Ring)</option>
                            <option value="פריט נפלא">פריט נפלא (Wondrous)</option>
                        </select>
                    </div>

                    {/* Subtype Dropdown */}
                    {TYPE_TO_SUBTYPES[type] && (
                        <div className="form-group">
                            <label>חפץ ספציפי (Specific Item)</label>
                            <select value={subtype} onChange={(e) => setSubtype(e.target.value)}>
                                <option value="">-- בחר חפץ --</option>
                                {Object.entries(TYPE_TO_SUBTYPES[type]).map(([category, items]) => (
                                    <optgroup key={category} label={category}>
                                        {items.map((item) => (
                                            <option key={item} value={item}>
                                                {item}
                                            </option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group rarity-slider-group">
                        <label>Rarity</label>
                        <div className="rarity-slider-container">
                            <input
                                type="range"
                                min="0"
                                max="4"
                                step="1"
                                value={['נפוץ', 'לא נפוץ', 'נדיר', 'נדיר מאוד', 'אגדי'].indexOf(rarity)}
                                onChange={(e) => {
                                    const rarities = ['נפוץ', 'לא נפוץ', 'נדיר', 'נדיר מאוד', 'אגדי'];
                                    setRarity(rarities[parseInt(e.target.value)]);
                                }}
                                className="rarity-slider"
                            />
                            <div className="rarity-diamonds">
                                <span className={`rarity-diamond common ${rarity === 'נפוץ' ? 'active' : ''}`} onClick={() => setRarity('נפוץ')} data-tooltip="(Common) נפוץ">◆</span>
                                <span className={`rarity-diamond uncommon ${rarity === 'לא נפוץ' ? 'active' : ''}`} onClick={() => setRarity('לא נפוץ')} data-tooltip="(Uncommon) לא נפוץ">◆</span>
                                <span className={`rarity-diamond rare ${rarity === 'נדיר' ? 'active' : ''}`} onClick={() => setRarity('נדיר')} data-tooltip="(Rare) נדיר">◆</span>
                                <span className={`rarity-diamond very-rare ${rarity === 'נדיר מאוד' ? 'active' : ''}`} onClick={() => setRarity('נדיר מאוד')} data-tooltip="(Very Rare) נדיר מאוד">◆</span>
                                <span className={`rarity-diamond legendary ${rarity === 'אגדי' ? 'active' : ''}`} onClick={() => setRarity('אגדי')} data-tooltip="(Legendary) אגדי">◆</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                            type="checkbox"
                            id="attunement"
                            checked={attunement}
                            onChange={(e) => setAttunement(e.target.checked)}
                        />
                        <label htmlFor="attunement" style={{ margin: 0 }}>Requires Attunement</label>
                    </div>
                </div>
            </div>
        </>
    );
};
