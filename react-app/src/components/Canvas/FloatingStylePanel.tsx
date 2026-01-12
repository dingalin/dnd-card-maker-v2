import { useCardContext } from '../../store';
import './FloatingStylePanel.css';

// Hebrew Fantasy Fonts
const HEBREW_FONT_OPTIONS = [
    { value: 'Frank Ruhl Libre', label: 'Frank Ruhl Libre' },
    { value: 'Suez One', label: 'Suez One (כותרות)' },
    { value: 'Secular One', label: 'Secular One (דרמטי)' },
    { value: 'Heebo', label: 'Heebo (מודרני)' },
    { value: 'Rubik', label: 'Rubik' },
    { value: 'Assistant', label: 'Assistant' },
    { value: 'Miriam Libre', label: 'Miriam Libre (קלאסי)' },
    { value: 'Alef', label: 'Alef' },
    { value: 'David', label: 'David (דוד)' },
    { value: 'Noto Serif Hebrew', label: 'Noto Serif (אלגנטי)' },
];

// English Fantasy/Medieval Fonts
const ENGLISH_FONT_OPTIONS = [
    { value: 'Cinzel', label: 'Cinzel (Epic)' },
    { value: 'Cinzel Decorative', label: 'Cinzel Decorative' },
    { value: 'MedievalSharp', label: 'MedievalSharp' },
    { value: 'Metamorphous', label: 'Metamorphous (Stone)' },
    { value: 'Uncial Antiqua', label: 'Uncial Antiqua (Celtic)' },
    { value: 'IM Fell English', label: 'IM Fell English' },
    { value: 'Almendra Display', label: 'Almendra Display' },
    { value: 'Fondamento', label: 'Fondamento (Calligraphic)' },
    { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
    { value: 'Pirata One', label: 'Pirata One (Bold)' },
];

// Combined for backward compatibility
const FONT_OPTIONS = [...HEBREW_FONT_OPTIONS, ...ENGLISH_FONT_OPTIONS];

const ELEMENT_LABELS: Record<string, string> = {
    title: 'שם הפריט',
    type: 'סוג',
    rarity: 'נדירות',
    stats: 'סטטיסטיקות',
    gold: 'מחיר',
    abilityName: 'שם היכולת',
    mech: 'מכניקות',
    lore: 'לור',
};

interface FloatingStylePanelProps {
    selectedElement: string | null;
    side: 'front' | 'back';
    onClose: () => void;
}

function FloatingStylePanel({ selectedElement, side, onClose }: FloatingStylePanelProps) {
    const { updateCustomStyle, state } = useCardContext();

    if (!selectedElement || selectedElement === 'itemImage') {
        return null;
    }

    const getStyleValue = (prop: string, defaultValue: any) => {
        const customStyles = state.settings[side]?.customStyles || {};
        const key = `${selectedElement}_${prop}`;
        return customStyles[key] !== undefined ? customStyles[key] : defaultValue;
    };

    const updateStyle = (prop: string, value: any) => {
        const key = `${selectedElement}_${prop}`;
        updateCustomStyle(key, value, side);
    };

    const elementLabel = ELEMENT_LABELS[selectedElement] || selectedElement;

    return (
        <div className="floating-style-panel">
            <div className="panel-header">
                <span className="panel-title">🎨 {elementLabel}</span>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            {/* Font Controls */}
            <div className="panel-section">
                <div className="control-row">
                    <label>גודל</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="12"
                            max="80"
                            value={getStyleValue('fontSize', 36)}
                            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('fontSize', 36)}px</span>
                    </div>
                </div>

                <div className="control-row">
                    <label>פונט</label>
                    <select
                        value={getStyleValue('fontFamily', 'Arial')}
                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                    >
                        {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                    </select>
                </div>

                <div className="control-row">
                    <label>צבע</label>
                    <input
                        type="color"
                        value={getStyleValue('fill', '#2c1810')}
                        onChange={(e) => updateStyle('fill', e.target.value)}
                    />
                </div>

                {/* Bold and Italic Toggles */}
                <div className="control-row">
                    <label>סגנון</label>
                    <div className="btn-group style-toggles">
                        <button
                            className={`tool-btn style-btn ${getStyleValue('fontStyle', 'normal') === 'bold' || getStyleValue('fontStyle', 'normal') === 'bold italic' ? 'active' : ''}`}
                            onClick={() => {
                                const current = getStyleValue('fontStyle', 'normal');
                                const isItalic = current.includes('italic');
                                const isBold = current.includes('bold');
                                if (isBold) {
                                    updateStyle('fontStyle', isItalic ? 'italic' : 'normal');
                                } else {
                                    updateStyle('fontStyle', isItalic ? 'bold italic' : 'bold');
                                }
                            }}
                            title="מודגש (Bold)"
                        >
                            <strong>B</strong>
                        </button>
                        <button
                            className={`tool-btn style-btn ${getStyleValue('fontStyle', 'normal').includes('italic') ? 'active' : ''}`}
                            onClick={() => {
                                const current = getStyleValue('fontStyle', 'normal');
                                const isItalic = current.includes('italic');
                                const isBold = current.includes('bold');
                                if (isItalic) {
                                    updateStyle('fontStyle', isBold ? 'bold' : 'normal');
                                } else {
                                    updateStyle('fontStyle', isBold ? 'bold italic' : 'italic');
                                }
                            }}
                            title="נטוי (Italic)"
                        >
                            <em>I</em>
                        </button>
                    </div>
                </div>

                {/* Currency Icon Selector - only for gold/price element */}
                {selectedElement === 'gold' && (
                    <div className="control-row">
                        <label>סמל מטבע</label>
                        <div className="btn-group currency-icons">
                            <button
                                className={`tool-btn icon-btn ${getStyleValue('currencyIcon', 'gold1') === 'gold1' ? 'active' : ''}`}
                                onClick={() => updateStyle('currencyIcon', 'gold1')}
                                title="מטבע זהב 1"
                            >
                                <img src="/src/assets/gold1.png" alt="gold1" className="currency-img" />
                            </button>
                            <button
                                className={`tool-btn icon-btn ${getStyleValue('currencyIcon', 'gold1') === 'gold2' ? 'active' : ''}`}
                                onClick={() => updateStyle('currencyIcon', 'gold2')}
                                title="מטבע זהב 2"
                            >
                                <img src="/src/assets/gold2.png" alt="gold2" className="currency-img" />
                            </button>
                            <button
                                className={`tool-btn icon-btn ${getStyleValue('currencyIcon', 'gold1') === 'gold3' ? 'active' : ''}`}
                                onClick={() => updateStyle('currencyIcon', 'gold3')}
                                title="מטבע זהב 3"
                            >
                                <img src="/src/assets/gold3.png" alt="gold3" className="currency-img" />
                            </button>
                            <button
                                className={`tool-btn icon-btn ${getStyleValue('currencyIcon', 'gold1') === 'gold4' ? 'active' : ''}`}
                                onClick={() => updateStyle('currencyIcon', 'gold4')}
                                title="מטבע זהב 4"
                            >
                                <img src="/src/assets/gold4.png" alt="gold4" className="currency-img" />
                            </button>
                            <button
                                className={`tool-btn icon-btn ${getStyleValue('currencyIcon', 'gold1') === 'gold5' ? 'active' : ''}`}
                                onClick={() => updateStyle('currencyIcon', 'gold5')}
                                title="מטבע זהב 5"
                            >
                                <img src="/src/assets/gold5.png" alt="gold5" className="currency-img" />
                            </button>
                        </div>
                    </div>
                )}
            </div>



            {/* Spacing Controls */}
            <div className="panel-section">
                <div className="control-row" style={{ marginBottom: '5px' }}>
                    <label style={{ width: 'auto', fontWeight: 'bold' }}>פריסה (Layout)</label>
                </div>

                <div className="control-row">
                    <label>רוחב (שוליים)</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0"
                            max="200"
                            step="5"
                            value={getStyleValue('padding', 40)}
                            onChange={(e) => updateStyle('padding', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('padding', 40)}px</span>
                    </div>
                </div>
            </div>

            {/* Shadow */}
            <div className="panel-section">
                <div className="control-row toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={getStyleValue('shadowEnabled', false)}
                            onChange={(e) => updateStyle('shadowEnabled', e.target.checked)}
                        />
                        צל
                    </label>
                </div>

                {getStyleValue('shadowEnabled', false) && (
                    <>
                        <div className="control-row">
                            <label>צבע</label>
                            <input
                                type="color"
                                value={getStyleValue('shadowColor', '#000000')}
                                onChange={(e) => updateStyle('shadowColor', e.target.value)}
                            />
                        </div>
                        <div className="control-row">
                            <label>טשטוש</label>
                            <input
                                type="range"
                                min="0"
                                max="20"
                                value={getStyleValue('shadowBlur', 5)}
                                onChange={(e) => updateStyle('shadowBlur', parseInt(e.target.value))}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Glow */}
            <div className="panel-section">
                <div className="control-row toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={getStyleValue('glowEnabled', false)}
                            onChange={(e) => updateStyle('glowEnabled', e.target.checked)}
                        />
                        זוהר
                    </label>
                </div>

                {getStyleValue('glowEnabled', false) && (
                    <>
                        <div className="control-row">
                            <label>צבע</label>
                            <input
                                type="color"
                                value={getStyleValue('glowColor', '#FFD700')}
                                onChange={(e) => updateStyle('glowColor', e.target.value)}
                            />
                        </div>
                        <div className="control-row">
                            <label>עוצמה</label>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                value={getStyleValue('glowBlur', 10)}
                                onChange={(e) => updateStyle('glowBlur', parseInt(e.target.value))}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default FloatingStylePanel;
