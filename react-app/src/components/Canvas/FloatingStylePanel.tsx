import { useCardContext } from '../../store';
import './FloatingStylePanel.css';

const FONT_OPTIONS = [
    { value: 'Arial', label: 'Arial' },
    { value: 'David', label: 'David (דוד)' },
    { value: 'Frank Ruhl Libre', label: 'Frank Ruhl' },
    { value: 'Heebo', label: 'Heebo' },
    { value: 'Rubik', label: 'Rubik' },
    { value: 'Assistant', label: 'Assistant' },
];

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
            </div>
            {/* Alignment Controls */}
            <div className="panel-section">
                <div className="control-row">
                    <label>יישור</label>
                    <div className="btn-group">
                        <button
                            className={`tool-btn ${getStyleValue('align', 'center') === 'right' ? 'active' : ''}`}
                            onClick={() => updateStyle('align', 'right')}
                            title="יישור לימין"
                        >
                            ➡️
                        </button>
                        <button
                            className={`tool-btn ${getStyleValue('align', 'center') === 'center' ? 'active' : ''}`}
                            onClick={() => updateStyle('align', 'center')}
                            title="מרכז"
                        >
                            ⬇️
                        </button>
                        <button
                            className={`tool-btn ${getStyleValue('align', 'center') === 'left' ? 'active' : ''}`}
                            onClick={() => updateStyle('align', 'left')}
                            title="יישור לשמאל"
                        >
                            ⬅️
                        </button>
                    </div>
                </div>
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
