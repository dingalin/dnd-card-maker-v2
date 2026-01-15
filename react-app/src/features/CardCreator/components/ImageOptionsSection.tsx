import React from 'react';
import { useTranslation } from 'react-i18next';
import { useCardContext } from '../../../store';
import './ItemCreationForm.css';

interface ImageOptionsSectionProps {
    isOpen: boolean;
    onToggle: () => void;
    imageModel: string;
    setImageModel: (val: any) => void;
    imageStyle: string;
    setImageStyle: (val: any) => void;
    backgroundOption: string;
    setBackgroundOption: (val: any) => void;
    imageTheme: string;
    setImageTheme: (val: string) => void;
    cardTheme: string;
    setCardTheme: (val: string) => void;
}

export const ImageOptionsSection: React.FC<ImageOptionsSectionProps> = ({
    isOpen,
    onToggle,
    imageModel,
    setImageModel,
    imageStyle,
    setImageStyle,
    backgroundOption,
    setBackgroundOption,
    imageTheme,
    setImageTheme,
    cardTheme,
    setCardTheme
}) => {
    const { t } = useTranslation();
    const { state, updateOffset } = useCardContext();

    return (
        <>
            <div className="section-header" onClick={onToggle}>
                <span className="section-title">🎨 Image Options</span>
                <span className="section-icon">{isOpen ? '▼' : '▶'}</span>
            </div>
            {isOpen && (
                <div className="section-content">
                    <div className="form-group">
                        <label>Image Model</label>
                        <select
                            value={imageModel}
                            onChange={(e) => {
                                const val = e.target.value as any;
                                setImageModel(val);
                                localStorage.setItem('dnd_image_model', val);
                            }}
                        >
                            <option value="flux">FLUX Schnell (Fast)</option>
                            <option value="z-image">Z-Image Turbo (Faster)</option>
                            <option value="fal-zimage">FAL Z-Image (Budget)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label style={{ color: '#ff9800' }}>🎨 Art Style (Unified)</label>
                        <select value={imageStyle} onChange={(e) => {
                            const val = e.target.value as any;
                            setImageStyle(val);
                            localStorage.setItem('dnd_image_style', val);
                        }}>
                            <option value="realistic">{t('imageStyles.realistic')}</option>
                            <option value="watercolor">{t('imageStyles.watercolor')}</option>
                            <option value="oil">{t('imageStyles.oil')}</option>
                            <option value="sketch">{t('imageStyles.sketch')}</option>
                            <option value="dark_fantasy">{t('imageStyles.dark_fantasy')}</option>
                            <option value="epic_fantasy">{t('imageStyles.epic_fantasy')}</option>
                            <option value="anime">{t('imageStyles.anime')}</option>
                            <option value="pixel">{t('imageStyles.pixel')}</option>
                            <option value="stained_glass">{t('imageStyles.stained_glass')}</option>
                            <option value="simple_icon">{t('imageStyles.simple_icon')}</option>
                            <option value="ink_drawing">{t('imageStyles.ink_drawing')}</option>
                            <option value="silhouette">{t('imageStyles.silhouette')}</option>
                            <option value="synthwave">{t('imageStyles.synthwave')}</option>
                            <option value="comic_book">Exaggerated Comic</option>
                            <option value="manga_action">{t('imageStyles.manga_action')}</option>
                            <option value="vintage_etching">{t('imageStyles.vintage_etching')}</option>
                            <option value="premium_fantasy">Premium Fantasy 🏆</option>
                        </select>
                        <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7em', marginTop: '4px', display: 'block' }}>
                            Applies to item image AND card background
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Item Image Background</label>
                        <select value={backgroundOption} onChange={(e) => setBackgroundOption(e.target.value as any)}>
                            <option value="no-background">No Background (Clean)</option>
                            <option value="natural">Natural Bokeh (Blurred)</option>
                            <option value="colored">Colored Gradient</option>
                        </select>
                    </div>

                    {/* Item Image Theme - Only relevant if background is natural */}
                    {backgroundOption === 'natural' && (
                        <div className="form-group">
                            <label>Item Theme (for natural backgrounds)</label>
                            <select value={imageTheme} onChange={(e) => setImageTheme(e.target.value)}>
                                <option value="Nature">🌲 Nature</option>
                                <option value="Fire">🔥 Fire</option>
                                <option value="Ice">❄️ Ice</option>
                                <option value="Lightning">⚡ Lightning</option>
                                <option value="Arcane">🔮 Arcane</option>
                                <option value="Divine">✨ Divine</option>
                                <option value="Necrotic">💀 Necrotic</option>
                                <option value="Ocean">🌊 Ocean</option>
                                <option value="Shadow">🌑 Shadow</option>
                                <option value="Celestial">🌌 Celestial</option>
                                <option value="Blood">🩸 Blood</option>
                                <option value="Industrial">⚙️ Industrial</option>
                                <option value="Iron">🔨 Iron/Forge</option>
                                <option value="Old Scroll">📜 Ancient Library</option>
                                <option value="Elemental">💫 Elemental Chaos</option>
                            </select>
                        </div>
                    )}

                    <div style={{ margin: '1rem 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}></div>

                    {/* Card Background Theme - Always Visible */}
                    <div className="form-group">
                        <label style={{ color: '#d4af37' }}>Card Background Theme</label>
                        <select
                            value={cardTheme}
                            onChange={(e) => {
                                const newTheme = e.target.value;
                                setCardTheme(newTheme);
                                // Auto-sync item theme to match card background theme (for AI themes)
                                if (!newTheme.startsWith('Passive')) {
                                    setImageTheme(newTheme);
                                }
                            }}
                        >
                            <option value="Passive">🎨 Passive (Style-Based)</option>
                            <optgroup label="🤖 AI Generated (Requires API)">
                                <option value="Nature">🌲 Nature</option>
                                <option value="Fire">🔥 Fire</option>
                                <option value="Ice">❄️ Ice</option>
                                <option value="Lightning">⚡ Lightning</option>
                                <option value="Arcane">🔮 Arcane</option>
                                <option value="Divine">✨ Divine</option>
                                <option value="Necrotic">💀 Necrotic</option>
                                <option value="Ocean">🌊 Ocean</option>
                                <option value="Shadow">🌑 Shadow</option>
                                <option value="Celestial">🌌 Celestial</option>
                                <option value="Blood">🩸 Blood</option>
                                <option value="Industrial">⚙️ Industrial</option>
                                <option value="Iron">🔨 Iron/Forge</option>
                                <option value="Old Scroll">📜 Ancient Library</option>
                                <option value="Premium Fantasy">🏆 Premium Fantasy</option>
                                <option value="Elemental">💫 Elemental Chaos</option>
                            </optgroup>
                        </select>
                        <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7em', marginTop: '4px', display: 'block' }}>
                            {cardTheme === 'Passive'
                                ? '🎨 Passive uses Art Style as the theme (instant, no API)'
                                : 'Theme (content) used for card background generation (requires API call)'}
                        </small>
                    </div>

                    <div className="form-group" style={{ marginTop: '0.5rem' }}>
                        <label>זום רקע (Background Zoom)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="range"
                                min="1.0"
                                max="1.5"
                                step="0.05"
                                value={state.settings?.front?.offsets?.backgroundScale ?? 1}
                                onChange={(e) => updateOffset('backgroundScale', parseFloat(e.target.value), 'front')}
                                style={{ flex: 1 }}
                            />
                            <span style={{ minWidth: '40px', textAlign: 'right' }}>
                                {(state.settings?.front?.offsets?.backgroundScale ?? 1).toFixed(2)}x
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
