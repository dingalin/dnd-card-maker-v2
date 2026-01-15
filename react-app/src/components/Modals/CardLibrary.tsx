import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { cardLibrary } from '../../utils/CardLibraryManager';
import type { CardTemplate, CardFolder } from '../../utils/CardLibraryManager';
import { useCardContext } from '../../store';
import PrintModal from './PrintModal';
import './CardLibrary.css';

interface CardLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onCaptureThumbnail?: () => Promise<{ front: string; back: string } | null>;
}

const CardLibrary: React.FC<CardLibraryProps> = ({ isOpen, onClose, onCaptureThumbnail }) => {
    const { t } = useTranslation();
    const { state, setCardData, loadState } = useCardContext();

    // State
    const [folders, setFolders] = useState<CardFolder[]>([]);
    const [templates, setTemplates] = useState<CardTemplate[]>([]);
    const [selectedFolderId, setSelectedFolderId] = useState<string>('default');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    // Removed isSelectMode state
    const [newCardName, setNewCardName] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [zoomedTemplate, setZoomedTemplate] = useState<CardTemplate | null>(null);
    const [zoomSide, setZoomSide] = useState<'front' | 'back'>('front');
    const [zoomLevel, setZoomLevel] = useState(140);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Refresh data from IndexedDB
    const refreshData = useCallback(async () => {
        const foldersData = await cardLibrary.getFolders();
        setFolders(foldersData);
        const templatesData = await cardLibrary.getTemplates(
            selectedFolderId === 'all' ? undefined : selectedFolderId
        );
        setTemplates(templatesData);
    }, [selectedFolderId]);

    useEffect(() => {
        if (isOpen) {
            refreshData();
            const cardName = state.cardData?.front?.title || state.cardData?.name || 'New Card';
            setNewCardName(cardName);
        }
    }, [isOpen, refreshData, state.cardData]);

    // ---------- HANDLERS ----------

    const handleSaveCard = async () => {
        if (!state.cardData || !newCardName.trim()) return;
        setIsSaving(true);

        try {
            let thumbnails: { front: string; back: string } | null = null;
            if (onCaptureThumbnail) {
                thumbnails = await onCaptureThumbnail();
            }

            await cardLibrary.saveTemplate(
                newCardName,
                state.cardData,
                state.settings,
                thumbnails?.front,
                thumbnails?.back,
                selectedFolderId === 'all' ? 'default' : selectedFolderId
            );

            setNewCardName('');
            await refreshData();
            alert('✅ הקלף נשמר!');
        } catch (error) {
            console.error('Failed to save card', error);
            alert('שגיאה בשמירת הקלף');
        } finally {
            setIsSaving(false);
        }
    };

    const handleApplyTemplate = async (template: CardTemplate) => {
        try {
            const resolved = await cardLibrary.resolveTemplate(template);
            setCardData(resolved.cardData);
            loadState(undefined, resolved.settings);
            onClose();
        } catch (error) {
            console.error('Failed to apply template', error);
            alert('שגיאה בטעינת קלף');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(t('Delete selected cards?', { count: selectedIds.size }))) return;

        await cardLibrary.deleteTemplates(Array.from(selectedIds));
        setSelectedIds(new Set());
        await refreshData();
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm(t('Delete this card?'))) return;
        await cardLibrary.deleteTemplate(id);
        await refreshData();
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await cardLibrary.createFolder(newFolderName);
        setNewFolderName('');
        await refreshData();
    };

    const handleDeleteFolder = async (id: string) => {
        if (id === 'default') return;
        if (!confirm(t('Delete this folder?'))) return;
        await cardLibrary.deleteFolder(id);
        setSelectedFolderId('default');
        await refreshData();
    };

    const handleCardClick = (template: CardTemplate) => {
        // Default behavior is now zoom, selection is handled by checkbox
        setZoomedTemplate(template);
        setZoomSide('front');
    };

    const handleFolderDrop = async (e: React.DragEvent, folderId: string) => {
        e.preventDefault();
        const templateId = e.dataTransfer.getData('templateId');
        if (templateId) {
            await cardLibrary.moveToFolder(templateId, folderId);
            await refreshData();
        }
    };

    // ---------- RENDER ----------

    if (!isOpen) return null;

    return (
        <div className="card-library-overlay" onClick={onClose}>
            <div className="card-library-container" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="library-header">
                    <div className="library-title">
                        <h2>📚 {t('Card Library')}</h2>
                        <p>{t('Save and organize your cards')}</p>
                    </div>
                    <button className="library-close" onClick={onClose}>✖</button>
                </div>

                <div className="library-body">

                    {/* Folder Sidebar */}
                    <div className="library-sidebar">
                        <h3>{t('Folders')}</h3>

                        <div className="folder-list">
                            <div
                                className={`folder-item ${selectedFolderId === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedFolderId('all')}
                            >
                                <span>🗂️ {t('All Cards')}</span>
                            </div>

                            {folders.filter(f => f.id !== 'default').map(folder => (
                                <div
                                    key={folder.id}
                                    className={`folder-item ${selectedFolderId === folder.id ? 'active' : ''}`}
                                    onClick={() => setSelectedFolderId(folder.id)}
                                    onDrop={(e) => handleFolderDrop(e, folder.id)}
                                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                >
                                    <span>📁 {folder.name}</span>
                                    <button
                                        className="folder-delete"
                                        onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Create Folder */}
                        <div className="create-folder">
                            <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder={t('New folder...')}
                            />
                            <button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                                ➕
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="library-content">

                        {/* Unified Toolbar */}
                        <div className="library-toolbar">
                            <div className="save-section">
                                <input
                                    type="text"
                                    value={newCardName}
                                    onChange={(e) => setNewCardName(e.target.value)}
                                    placeholder={t('Card name...')}
                                    className="save-name-input"
                                />
                                <button
                                    className="btn-save-card"
                                    onClick={handleSaveCard}
                                    disabled={isSaving || !newCardName.trim() || !state.cardData}
                                >
                                    💾 {isSaving ? t('Saving...') : t('Save')}
                                </button>
                            </div>

                            <div className="toolbar-divider" />

                            {/* Zoom Slider */}
                            <div className="zoom-control" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.9rem' }}>🔍</span>
                                <input
                                    type="range"
                                    min="60"
                                    max="300"
                                    step="10"
                                    value={zoomLevel}
                                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                                    className="zoom-slider"
                                    style={{ width: '100px', cursor: 'pointer', accentColor: '#cfaa6e' }}
                                    title={t('Zoom')}
                                />
                            </div>

                            <div className="toolbar-divider" />

                            {/* Select All Button */}
                            <button
                                className="btn-select-mode"
                                onClick={() => {
                                    if (selectedIds.size === templates.length && templates.length > 0) {
                                        setSelectedIds(new Set());
                                    } else {
                                        setSelectedIds(new Set(templates.map(t => t.id)));
                                    }
                                }}
                            >
                                {selectedIds.size > 0 && selectedIds.size === templates.length ? '✓ ' + t('Deselect All') : '☑ ' + t('Select All')}
                            </button>

                            {selectedIds.size > 0 && (
                                <>
                                    <button className="btn-bulk-print" onClick={() => setIsPrintModalOpen(true)}>
                                        🖨️ {t('Print')} ({selectedIds.size})
                                    </button>
                                    <button className="btn-bulk-delete" onClick={handleDeleteSelected}>
                                        🗑 {selectedIds.size}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Cards Grid */}
                        <div
                            className="cards-grid"
                            style={{ '--card-min-width': `${zoomLevel}px` } as React.CSSProperties}
                        >
                            {templates.length === 0 ? (
                                <div className="empty-state">
                                    <div style={{ fontSize: '64px', marginBottom: '1rem' }}>📭</div>
                                    <p>{t('No cards saved yet')}</p>
                                </div>
                            ) : (
                                templates.map(template => (
                                    <div
                                        key={template.id}
                                        className={`card-item ${selectedIds.has(template.id) ? 'selected' : ''}`}
                                        onClick={() => handleCardClick(template)}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('templateId', template.id)}
                                    >
                                        <div className="card-thumbnail">
                                            {template.thumbnailFront ? (
                                                <img src={template.thumbnailFront} alt={template.name} />
                                            ) : (
                                                <div className="placeholder-thumbnail">
                                                    <span>🃏</span>
                                                </div>
                                            )}

                                            {/* Always visible checkbox */}
                                            <div
                                                className={`select-checkbox ${selectedIds.has(template.id) ? 'checked' : ''}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSet = new Set(selectedIds);
                                                    if (newSet.has(template.id)) {
                                                        newSet.delete(template.id);
                                                    } else {
                                                        newSet.add(template.id);
                                                    }
                                                    setSelectedIds(newSet);
                                                }}
                                            >
                                                ✓
                                            </div>

                                            <div className="card-actions">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleApplyTemplate(template); }}
                                                    title={t('Load Card')}
                                                >
                                                    📥
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                                                    title={t('Delete')}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="card-info">
                                            <div className="card-name">{template.name}</div>
                                            <div className="card-date">
                                                {new Date(template.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Zoom Modal */}
                {zoomedTemplate && (
                    <div className="zoom-overlay" onClick={() => setZoomedTemplate(null)}>
                        <div className="zoom-content" onClick={e => e.stopPropagation()}>
                            <button className="zoom-close" onClick={() => setZoomedTemplate(null)}>✖</button>

                            <div className={`zoom-card-wrapper ${zoomSide === 'back' ? 'flipped' : ''}`}>
                                <div className="zoom-card-inner">
                                    <div className="zoom-card-face zoom-card-front">
                                        {zoomedTemplate.thumbnailFront ? (
                                            <img src={zoomedTemplate.thumbnailFront} alt={zoomedTemplate.name} />
                                        ) : (
                                            <div className="zoom-placeholder">🃏</div>
                                        )}
                                    </div>
                                    <div className="zoom-card-face zoom-card-back">
                                        {zoomedTemplate.thumbnailBack ? (
                                            <img src={zoomedTemplate.thumbnailBack} alt={zoomedTemplate.name + ' Back'} />
                                        ) : (
                                            <div className="zoom-placeholder">🔙</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="zoom-controls">
                                <button
                                    className={`btn-rotate ${zoomSide === 'back' ? 'active' : ''}`}
                                    onClick={() => setZoomSide(prev => prev === 'front' ? 'back' : 'front')}
                                    disabled={!zoomedTemplate.thumbnailBack}
                                >
                                    {t('cardLibrary.rotate')}
                                </button>
                            </div>

                            <button
                                className="btn-apply-zoomed"
                                onClick={() => { handleApplyTemplate(zoomedTemplate); setZoomedTemplate(null); }}
                            >
                                📥 {t('Load This Card')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <PrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                templates={templates.filter(t => selectedIds.has(t.id))}
            />
        </div>
    );
};

export default CardLibrary;
