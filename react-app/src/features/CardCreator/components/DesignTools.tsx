import { useState } from 'react';
import { useCardContext } from '../../../store';
import './DesignTools.css';

const FONT_OPTIONS = [
    { value: 'Arial', label: 'Arial' },
    { value: 'David', label: 'David (דוד)' },
    { value: 'Frank Ruhl Libre', label: 'Frank Ruhl' },
    { value: 'Heebo', label: 'Heebo' },
    { value: 'Rubik', label: 'Rubik' },
    { value: 'Assistant', label: 'Assistant' },
];

const TEXT_ELEMENTS = {
    front: [
        { key: 'title', label: 'שם הפריט' },
        { key: 'type', label: 'סוג' },
        { key: 'rarity', label: 'נדירות' },
        { key: 'stats', label: 'סטטיסטיקות' },
        { key: 'gold', label: 'מחיר' },
    ],
    back: [
        { key: 'abilityName', label: 'שם היכולת' },
        { key: 'mech', label: 'מכניקות' },
        { key: 'lore', label: 'לור' },
    ]
};

function DesignTools() {
    const { updateCustomStyle, state } = useCardContext();
    const cardData = state.cardData;
    const [selectedSide, setSelectedSide] = useState<'front' | 'back'>('front');
    const [selectedElement, setSelectedElement] = useState<string>('title');

    if (!cardData) {
        return (
            <div className="design-tools">
                <h2>עיצוב טקסט</h2>
                <p className="no-card-msg">צור קלף כדי לערוך אותו.</p>
            </div>
        );
    }

    const getStyleValue = (prop: string, defaultValue: any) => {
        const customStyles = state.settings[selectedSide]?.customStyles || {};
        const key = `${selectedElement}_${prop}`;
        return customStyles[key] !== undefined ? customStyles[key] : defaultValue;
    };

    const updateStyle = (prop: string, value: any) => {
        const key = `${selectedElement}_${prop}`;
        updateCustomStyle(key, value, selectedSide);
    };

    return (
        <div className="design-tools">
            <h2>🎨 עיצוב טקסט</h2>

            {/* Side & Element Selection */}
            <div className="tool-section">
                <div className="form-group">
                    <label>צד הקלף</label>
                    <div className="button-group">
                        <button
                            className={selectedSide === 'front' ? 'active' : ''}
                            onClick={() => { setSelectedSide('front'); setSelectedElement('title'); }}
                        >
                            קדמי
                        </button>
                        <button
                            className={selectedSide === 'back' ? 'active' : ''}
                            onClick={() => { setSelectedSide('back'); setSelectedElement('abilityName'); }}
                        >
                            אחורי
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>אלמנט</label>
                    <select
                        value={selectedElement}
                        onChange={(e) => setSelectedElement(e.target.value)}
                    >
                        {TEXT_ELEMENTS[selectedSide].map(el => (
                            <option key={el.key} value={el.key}>{el.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Font Controls */}
            <div className="tool-section">
                <h3>📝 פונט</h3>

                <div className="form-group">
                    <label>גודל פונט</label>
                    <div className="slider-group">
                        <input
                            type="range"
                            min="12"
                            max="80"
                            value={getStyleValue('fontSize', 36)}
                            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                        />
                        <span className="slider-value">{getStyleValue('fontSize', 36)}px</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>משפחת פונט</label>
                    <select
                        value={getStyleValue('fontFamily', 'Arial')}
                        onChange={(e) => updateStyle('fontFamily', e.target.value)}
                    >
                        {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value}>{font.label}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>צבע</label>
                    <input
                        type="color"
                        value={getStyleValue('fill', '#2c1810')}
                        onChange={(e) => updateStyle('fill', e.target.value)}
                    />
                </div>
            </div>

            {/* Shadow Controls */}
            <div className="tool-section">
                <h3>🌑 צל</h3>

                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={getStyleValue('shadowEnabled', false)}
                            onChange={(e) => updateStyle('shadowEnabled', e.target.checked)}
                        />
                        הפעל צל
                    </label>
                </div>

                {getStyleValue('shadowEnabled', false) && (
                    <>
                        <div className="form-group">
                            <label>צבע הצל</label>
                            <input
                                type="color"
                                value={getStyleValue('shadowColor', '#000000')}
                                onChange={(e) => updateStyle('shadowColor', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>טשטוש</label>
                            <div className="slider-group">
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={getStyleValue('shadowBlur', 5)}
                                    onChange={(e) => updateStyle('shadowBlur', parseInt(e.target.value))}
                                />
                                <span className="slider-value">{getStyleValue('shadowBlur', 5)}</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>הסטה</label>
                            <div className="dual-slider">
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    value={getStyleValue('shadowOffsetX', 2)}
                                    onChange={(e) => updateStyle('shadowOffsetX', parseInt(e.target.value))}
                                />
                                <input
                                    type="range"
                                    min="-10"
                                    max="10"
                                    value={getStyleValue('shadowOffsetY', 2)}
                                    onChange={(e) => updateStyle('shadowOffsetY', parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Glow Controls */}
            <div className="tool-section">
                <h3>✨ זוהר (Glow)</h3>

                <div className="form-group checkbox-group">
                    <label>
                        <input
                            type="checkbox"
                            checked={getStyleValue('glowEnabled', false)}
                            onChange={(e) => updateStyle('glowEnabled', e.target.checked)}
                        />
                        הפעל זוהר
                    </label>
                </div>

                {getStyleValue('glowEnabled', false) && (
                    <>
                        <div className="form-group">
                            <label>צבע הזוהר</label>
                            <input
                                type="color"
                                value={getStyleValue('glowColor', '#FFD700')}
                                onChange={(e) => updateStyle('glowColor', e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label>עוצמה</label>
                            <div className="slider-group">
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={getStyleValue('glowBlur', 10)}
                                    onChange={(e) => updateStyle('glowBlur', parseInt(e.target.value))}
                                />
                                <span className="slider-value">{getStyleValue('glowBlur', 10)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>


            {/* Visual Rarity Controls - FRONT ONLY */}
            {
                selectedSide === 'front' && (
                    <div className="tool-section">
                        <h3>🌟 עיצוב נדירות</h3>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={getStyleValue('visualRarity_enabled', false)}
                                    onChange={(e) => updateStyle('visualRarity_enabled', e.target.checked)}
                                />
                                החלף טקסט נדירות באפקט ויזואלי
                            </label>
                            <p className="help-text" style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                                (מסתיר את הטקסט "נדיר/נפוץ" וצובע את הכותרת בצבע הנדירות)
                            </p>
                        </div>

                        <div className="form-group checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={getStyleValue('visualRarity_border', false)}
                                    onChange={(e) => updateStyle('visualRarity_border', e.target.checked)}
                                />
                                הצג מסגרת נדירות
                            </label>
                        </div>
                    </div>
                )
            }
        </div >
    );
}

export default DesignTools;

