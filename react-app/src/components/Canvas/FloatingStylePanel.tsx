import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCardContext } from '../../store';
import './FloatingStylePanel.css';

// ... fonts constants ...
const HEBREW_FONT_OPTIONS = [
    { value: 'Noto Rashi Hebrew', label: 'Noto Rashi Hebrew (עתיק/רש"י)' },
    { value: 'Bellefair', label: 'Bellefair (אלגנטי/קסום)' },
    { value: 'Karantina', label: 'Karantina (גבוה/מודגש)' },
    { value: 'Varela Round', label: 'Varela Round (עגול/רך)' },
    { value: 'Tinos', label: 'Tinos (קלאסי)' },
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
    { value: 'Rubik Beastly', label: 'Rubik Beastly (מפלצתי)' },
    { value: 'Rubik Wet Paint', label: 'Rubik Wet Paint (רטוב)' },
    { value: 'Rubik Glitch', label: 'Rubik Glitch (גליץ\')' },
    { value: 'Amatic SC', label: 'Amatic SC (ידני)' },
    { value: 'Solitreo', label: 'Solitreo (עתיק)' },
];

// ... (keep English fonts) ... 
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

interface FontDropdownProps {
    currentFont: string;
    options: typeof FONT_OPTIONS;
    onSelect: (font: string) => void;
    onPreview: (font: string) => void;
}

function FontDropdown({ currentFont, options, onSelect, onPreview }: FontDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const originalFont = useRef(currentFont);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Update original font when menu opens
    useEffect(() => {
        if (isOpen) {
            originalFont.current = currentFont;
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    // Revert if closing without selection
                    onPreview(originalFont.current);
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onPreview]);

    const handleMouseLeave = () => {
        // When mouse leaves the list (but still open), revert to original
        // This is optional behavior - some prefer to keep the last hovered
        // But "live preview" usually implies reverting when not hovering functionality
        if (isOpen) {
            onPreview(originalFont.current);
        }
    };

    return (
        <div className="custom-select-container" ref={dropdownRef}>
            <div
                className="custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
            >
                {options.find(o => o.value === currentFont)?.label || currentFont}
            </div>

            {isOpen && (
                <div
                    className="custom-select-options"
                    onMouseLeave={handleMouseLeave}
                >
                    {options.map(option => (
                        <div
                            key={option.value}
                            className={`custom-select-option ${option.value === currentFont ? 'selected' : ''}`}
                            onClick={() => {
                                onSelect(option.value);
                                originalFont.current = option.value; // Update original so we don't revert
                                setIsOpen(false);
                            }}
                            onMouseEnter={() => onPreview(option.value)}
                            style={{ fontFamily: option.value }} // Show font preview in list too
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

interface FloatingStylePanelProps {
    selectedElement: string | null;
    side: 'front' | 'back';
    onClose: () => void;
    onPanelEnter?: () => void; // Called when mouse enters panel to cancel hide timeout
}

function FloatingStylePanel({ selectedElement, side, onClose, onPanelEnter }: FloatingStylePanelProps) {
    const { updateCustomStyle, state } = useCardContext();
    const { i18n } = useTranslation();

    // Dynamically filter fonts based on current language
    const currentFontOptions = i18n.language === 'he' ? HEBREW_FONT_OPTIONS : ENGLISH_FONT_OPTIONS;

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
        <div className="floating-style-panel" onMouseEnter={onPanelEnter}>
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
                            max={selectedElement === 'title' ? 120 : 80}
                            value={getStyleValue('fontSize', 36)}
                            onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('fontSize', 36)}px</span>
                    </div>
                </div>

                <div className="control-row" style={{ position: 'relative', zIndex: 10 }}>
                    <label>פונט</label>
                    <FontDropdown
                        currentFont={getStyleValue('fontFamily', 'Arial')}
                        options={currentFontOptions}
                        onSelect={(font) => updateStyle('fontFamily', font)}
                        onPreview={(font) => updateStyle('fontFamily', font)}
                    />
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

                {/* Banner Selector - ONLY for Title */}
                {selectedElement === 'title' && (
                    <>
                        <div className="control-row">
                            <label>באנר (Banner)</label>
                            <div className="btn-group currency-icons" style={{ flexWrap: 'wrap', gap: '5px' }}>
                                <button
                                    className={`tool-btn icon-btn ${getStyleValue('banner', 'none') === 'none' ? 'active' : ''}`}
                                    onClick={() => updateStyle('banner', 'none')}
                                    title="ללא באנר"
                                    style={{ width: '40px', height: '30px', fontSize: '10px' }}
                                >
                                    🚫
                                </button>
                                {['banner1', 'banner2', 'banner3', 'banner4', 'banner5', 'banner6', 'banner7', 'banner8', 'banner9', 'banner10', 'banner11', 'banner12'].map(banner => (
                                    <button
                                        key={banner}
                                        className={`tool-btn icon-btn ${getStyleValue('banner', 'none') === banner ? 'active' : ''}`}
                                        onClick={() => updateStyle('banner', banner)}
                                        title={banner}
                                        style={{ width: '60px', height: '30px', padding: 0 }}
                                    >
                                        <img
                                            src={`/src/assets/banners/${banner}.png`}
                                            alt={banner}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Visual Rarity - ONLY for Title on FRONT */}
                        {side === 'front' && (
                            <div className="control-row" style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ color: 'var(--accent-gold)' }}>🌟 עיצוב נדירות</label>

                                    <div className="toggle-row">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={getStyleValue('visualRarity_enabled', false)}
                                                onChange={(e) => updateStyle('visualRarity_enabled', e.target.checked)}
                                            />
                                            החלף טקסט באפקט ויזואלי
                                        </label>
                                        <small style={{ display: 'block', color: '#888', marginTop: '2px', fontSize: '0.75em' }}>
                                            (מסתיר 'נדיר' וצובע כותרת)
                                        </small>
                                    </div>

                                    <div className="toggle-row">
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
                            </div>
                        )}
                    </>
                )}

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


            {/* Spacing Controls - For Lore, Mechanics, and Stats */}
            {(selectedElement === 'lore' || selectedElement === 'mech' || selectedElement === 'stats' || selectedElement === 'coreStats') && (
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
            )}

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

            {/* Text Box Background */}
            <div className="panel-section">
                <div className="control-row toggle-row">
                    <label>
                        <input
                            type="checkbox"
                            checked={getStyleValue('textBox_enabled', false)}
                            onChange={(e) => updateStyle('textBox_enabled', e.target.checked)}
                        />
                        📦 רקע לטקסט
                    </label>
                </div>

                {getStyleValue('textBox_enabled', false) && (
                    <>
                        <div className="control-row">
                            <label>צבע רקע</label>
                            <input
                                type="color"
                                value={getStyleValue('textBox_fill', '#f5ebdc')}
                                onChange={(e) => updateStyle('textBox_fill', e.target.value)}
                            />
                        </div>

                        <div className="control-row">
                            <label>שקיפות</label>
                            <div className="slider-control">
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={getStyleValue('textBox_opacity', 85)}
                                    onChange={(e) => updateStyle('textBox_opacity', parseInt(e.target.value))}
                                />
                                <span>{getStyleValue('textBox_opacity', 85)}%</span>
                            </div>
                        </div>

                        <div className="control-row">
                            <label>ריפוד</label>
                            <div className="slider-control">
                                <input
                                    type="range"
                                    min="5"
                                    max="30"
                                    value={getStyleValue('textBox_padding', 10)}
                                    onChange={(e) => updateStyle('textBox_padding', parseInt(e.target.value))}
                                />
                                <span>{getStyleValue('textBox_padding', 10)}px</span>
                            </div>
                        </div>

                        <div className="control-row">
                            <label>עיגול פינות</label>
                            <div className="slider-control">
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={getStyleValue('textBox_cornerRadius', 8)}
                                    onChange={(e) => updateStyle('textBox_cornerRadius', parseInt(e.target.value))}
                                />
                                <span>{getStyleValue('textBox_cornerRadius', 8)}px</span>
                            </div>
                        </div>

                        <div className="control-row">
                            <label>עובי מסגרת</label>
                            <div className="slider-control">
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    value={getStyleValue('textBox_strokeWidth', 2)}
                                    onChange={(e) => updateStyle('textBox_strokeWidth', parseInt(e.target.value))}
                                />
                                <span>{getStyleValue('textBox_strokeWidth', 2)}px</span>
                            </div>
                        </div>

                        <div className="control-row">
                            <label>צבע מסגרת</label>
                            <input
                                type="color"
                                value={getStyleValue('textBox_stroke', '#8b7355')}
                                onChange={(e) => updateStyle('textBox_stroke', e.target.value)}
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
