import { useState, useEffect } from 'react';
import { assetStore } from '../../utils/AssetStore';
import type { ImageAsset, AssetType } from '../../utils/AssetStore';
import { Logger } from '../../utils/Logger';
import { useCardContext } from '../../store';
import './AssetBrowser.css';

interface AssetBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (url: string, type: AssetType) => void; // Return Blob URL
}

export default function AssetBrowser({ isOpen, onClose, onSelect }: AssetBrowserProps) {
    const [assets, setAssets] = useState<ImageAsset[]>([]);
    const [filter, setFilter] = useState<AssetType | 'all'>('all');
    const [loading, setLoading] = useState(false);
    const [objectUrls, setObjectUrls] = useState<Record<string, string>>({}); // Clean up these URLs!
    const { updateCardField } = useCardContext();

    useEffect(() => {
        if (isOpen) {
            loadAssets();
        }

        // Cleanup URLs on unmount or close
        return () => {
            Object.values(objectUrls).forEach(url => URL.revokeObjectURL(url));
        };
    }, [isOpen, filter]);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const result = await assetStore.getAllAssets(filter === 'all' ? undefined : filter);
            // Sort by createdAt desc
            result.sort((a, b) => b.createdAt - a.createdAt);

            // Create Blob URLs for display
            const newUrls: Record<string, string> = {};
            result.forEach(asset => {
                newUrls[asset.id] = URL.createObjectURL(asset.blob);
            });

            // Revoke old ones to be safe (though we wipe them on unmount)
            // Ideally we diff, but simple replacement is safer for memory if we just revoke all old ones first.
            // Actually, React state update is async, so we might lose access to old map if we're not careful.
            // Let's just accumulate for now and revoke in the cleanup effect.

            setObjectUrls(prev => ({ ...prev, ...newUrls }));
            setAssets(result);
        } catch (error) {
            Logger.error('AssetBrowser', 'Failed to load assets', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this asset?')) {
            await assetStore.deleteImage(id);
            setAssets(prev => prev.filter(a => a.id !== id));
            // URL cleanup handling?
            if (objectUrls[id]) {
                URL.revokeObjectURL(objectUrls[id]);
            }
        }
    };

    const handleSelect = (asset: ImageAsset) => {
        const url = objectUrls[asset.id];
        if (!url) return;

        if (onSelect) {
            onSelect(url, asset.type);
        } else {
            // Default behavior: Apply to card
            if (asset.type === 'item') {
                updateCardField('itemImageUrl', url);
            } else if (asset.type === 'background') {
                updateCardField('backgroundUrl', url);
            } else {
                // Infer from type or ask user? Defaulting to item for now if unknown
                updateCardField('itemImageUrl', url);
            }
            onClose(); // Auto close on select
            alert('Image applied to card!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="asset-browser-modal" onClick={e => e.stopPropagation()}>
                <div className="asset-browser-header">
                    <h2>📦 Asset Library</h2>
                    <div className="asset-tabs">
                        <button
                            className={`asset-tab ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`asset-tab ${filter === 'item' ? 'active' : ''}`}
                            onClick={() => setFilter('item')}
                        >
                            Items
                        </button>
                        <button
                            className={`asset-tab ${filter === 'background' ? 'active' : ''}`}
                            onClick={() => setFilter('background')}
                        >
                            Backgrounds
                        </button>
                    </div>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="asset-browser-body">
                    {loading ? (
                        <div className="loading-state">Loading assets...</div>
                    ) : assets.length === 0 ? (
                        <div className="empty-state">
                            <p>No assets found.</p>
                            <p>Generate images or save backgrounds to see them here.</p>
                        </div>
                    ) : (
                        <div className="asset-grid">
                            {assets.map(asset => (
                                <div key={asset.id} className="asset-card" onClick={() => handleSelect(asset)}>
                                    <img
                                        src={objectUrls[asset.id]}
                                        className="asset-thumbnail"
                                        alt="Asset"
                                        loading="lazy"
                                    />
                                    <div className="asset-info">
                                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="asset-actions">
                                        <button
                                            className="asset-btn delete"
                                            onClick={(e) => handleDelete(asset.id, e)}
                                            title="Delete"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                    {asset.type && (
                                        <div className="asset-badge" style={{
                                            position: 'absolute',
                                            top: '5px',
                                            left: '5px',
                                            background: 'rgba(0,0,0,0.5)',
                                            color: 'white',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem'
                                        }}>
                                            {asset.type === 'item' ? '⚔️' : '🖼️'}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}
