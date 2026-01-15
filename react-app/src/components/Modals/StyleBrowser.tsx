import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { styleManager } from '../../utils/StyleManager';
import type { StyleTemplate } from '../../utils/StyleManager';
import { useCardContext } from '../../store';
import './StyleBrowser.css';

interface StyleBrowserProps {
    isOpen: boolean;
    onClose: () => void;
}

const StyleBrowser: React.FC<StyleBrowserProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { state, loadState, updateCardField } = useCardContext();
    const [styles, setStyles] = useState<StyleTemplate[]>([]);
    const [newStyleName, setNewStyleName] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            refreshStyles();
            // Default name based on current card
            if (state.cardData?.name) { // Fixed: state.cardData?.name is string
                setNewStyleName(state.cardData.name + ' Style');
            } else if (state.cardData?.front?.title) {
                setNewStyleName(state.cardData.front.title + ' Style');
            } else {
                setNewStyleName('My Epic Style');
            }
        }
    }, [isOpen, state.cardData]);

    const refreshStyles = () => {
        setStyles(styleManager.getStyles());
    };

    const handleSave = async () => {
        if (!newStyleName.trim()) return;
        setIsSaving(true);
        try {
            await styleManager.saveStyle(
                newStyleName,
                state.settings,
                state.cardData?.backgroundUrl
            );
            setNewStyleName('');
            refreshStyles();
        } catch (error) {
            console.error('Failed to save style', error);
            alert('Failed to save style');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(t('Are you sure you want to delete this style?'))) {
            styleManager.deleteStyle(id);
            refreshStyles();
        }
    };

    const handleApply = async (style: StyleTemplate) => {
        try {
            const result = await styleManager.resolveStyle(style);

            // 1. Prepare Settings with Default Background ID
            // This ensures that if we save these settings as default, the background ID is included
            const settingsToApply = { ...result.settings };
            if (!settingsToApply.style) settingsToApply.style = {};
            if (style.backgroundId) {
                settingsToApply.style.defaultBackgroundId = style.backgroundId;
            }

            // 2. Load Settings into Context
            loadState(undefined, settingsToApply);

            // 3. Load Background if exists and we found a blob URL
            if (result.backgroundBlobUrl) {
                updateCardField('backgroundUrl', result.backgroundBlobUrl);
            }

            // 4. SAVE AS DEFAULT for future cards
            // This meets the user requirement: "If I create a card it will be like this without me having to choose it"
            try {
                localStorage.setItem('dnd_user_defaults', JSON.stringify(settingsToApply));
                console.log('Style saved as new user default');
            } catch (e) {
                console.error('Failed to save default style', e);
            }

            onClose();
        } catch (error) {
            console.error('Failed to apply style', error);
            alert('Failed to apply style');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="style-browser-modal" onClick={onClose}>
            <div className="style-browser-content" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="style-modal-header">
                    <div className="style-modal-title">
                        <h2>🎨 {t('Style Library')}</h2>
                        <p className="style-modal-subtitle">{t('Save and load your custom card designs')}</p>
                    </div>
                    <button className="style-modal-close" onClick={onClose}>
                        ✖
                    </button>
                </div>

                {/* Body */}
                <div className="style-modal-body">

                    {/* Save Section */}
                    <div className="save-style-section">
                        <div className="save-style-info">
                            <h3>{t('Save Current Design')}</h3>
                            <p>{t('Create a template from your current card settings')}</p>
                        </div>
                        <div className="save-style-controls">
                            <input
                                type="text"
                                value={newStyleName}
                                onChange={(e) => setNewStyleName(e.target.value)}
                                placeholder={t('Enter style name...')}
                                className="style-name-input"
                            />
                            <button
                                className="btn-save-style"
                                onClick={handleSave}
                                disabled={isSaving || !newStyleName.trim()}
                            >
                                <span>💾</span>
                                {isSaving ? t('Saving...') : t('Save Style')}
                            </button>
                        </div>
                    </div>

                    {/* Gallery Grid */}
                    <div className="styles-grid-section">
                        <h3>{t('Saved Styles')}</h3>

                        {styles.length === 0 ? (
                            <div className="empty-state">
                                <div style={{ fontSize: '48px', marginBottom: '1rem', opacity: 0.5 }}>🎨</div>
                                <p>{t('No saved styles yet. Create one above!')}</p>
                            </div>
                        ) : (
                            <div className="styles-grid">
                                {styles.map(style => (
                                    <div key={style.id} className="style-card" onClick={() => handleApply(style)}>

                                        {/* Preview Area (Top Half) */}
                                        <div className="style-preview-area">
                                            {/* Preview Font */}
                                            <div className="style-preview-font" style={{
                                                fontFamily: style.settings.style?.fontFamily || 'inherit',
                                                color: style.settings.front?.customStyles?.title_fill || '#ffffff'
                                            }}>
                                                Aa
                                            </div>

                                            {/* Actions Overlay */}
                                            <div className="style-card-actions">
                                                <button
                                                    className="btn-icon-action apply"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleApply(style);
                                                    }}
                                                    title={t('Apply Style')}
                                                >
                                                    📥
                                                </button>
                                                <button
                                                    className="btn-icon-action delete"
                                                    onClick={(e) => handleDelete(style.id, e)}
                                                    title={t('Delete Style')}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content Area (Bottom Half) */}
                                        <div className="style-card-content">
                                            <div className="style-card-title">{style.name}</div>
                                            <div className="style-card-date">
                                                {new Date(style.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StyleBrowser;
