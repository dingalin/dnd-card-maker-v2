import React from 'react';
import { useCardContext } from '../../store';

interface FloatingDesignPanelProps {
    selectedId: string | null;
    position: { x: number; y: number } | null;
}

const FloatingDesignPanel: React.FC<FloatingDesignPanelProps> = ({ selectedId, position }) => {
    const { state, updateOffset, updateCustomStyle } = useCardContext();

    if (!selectedId || !position) return null;

    // Determine side
    const side = state.isFlipped ? 'back' : 'front';

    // Helper to get current style
    const getStyle = (key: string, defaultValue: any) => {
        const customStyles = state.settings[side].customStyles || {};
        // Check for specific override first
        const override = customStyles[`${selectedId}_${key}`];
        if (override !== undefined) return override;

        // If not found, maybe check global style or default
        return defaultValue;
    };

    // Helper for scale (size)
    const getScale = () => {
        const offsets = state.settings[side].offsets as any;
        return offsets[`${selectedId}_scale`] || 1;
    };

    // Determine if it's an image or text to show relevant controls
    const isImage = selectedId === 'itemImage';
    const isText = !isImage;

    // TODO: Map selectedId to actual style properties from store
    // For now, we will just use placeholders or basic offsets

    // Helper to update specific style trait
    const handleStyleChange = (key: string, value: any) => {
        console.log(`Updating ${selectedId} style: ${key} = ${value}`);

        if (key === 'scale') {
            // Update scale offset
            updateOffset(`${selectedId}_scale`, value, side);
        } else {
            // Update custom style (fill, fontFamily, etc.)
            updateCustomStyle(`${selectedId}_${key}`, value, side);
        }
    };

    return (
        <div style={{
            position: 'absolute',
            left: position.x + 20, // Offset from mouse/selection
            top: position.y,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '200px'
        }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                {isImage ? 'Image Styles' : 'Text Styles'}
            </h4>

            {isText && (
                <>
                    {/* Font Size (via Scale) */}
                    <div className="control-group">
                        <label>Size</label>
                        <input
                            type="range"
                            min="0.5"
                            max="3"
                            step="0.1"
                            value={getScale()}
                            onChange={(e) => handleStyleChange('scale', parseFloat(e.target.value))}
                        />
                        <span style={{ fontSize: '10px', width: '20px' }}>{getScale().toFixed(1)}</span>
                    </div>

                    {/* Color Picker */}
                    <div className="control-group">
                        <label>Color</label>
                        <input
                            type="color"
                            value={getStyle('fill', '#000000')}
                            onChange={(e) => handleStyleChange('fill', e.target.value)}
                        />
                    </div>

                    {/* Font Family */}
                    <div className="control-group">
                        <label>Font</label>
                        <select
                            value={getStyle('fontFamily', 'Arial')}
                            onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                            style={{ width: '100px' }}
                        >
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Impact">Impact</option>
                        </select>
                    </div>
                </>
            )}

            {isImage && (
                <>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                        Transform image using handles on canvas.
                    </div>
                </>
            )}

            <style>{`
                .control-group {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 12px;
                }
                .control-group label {
                    color: #666;
                    margin-right: 8px;
                }
            `}</style>
        </div>
    );
};

export default FloatingDesignPanel;
