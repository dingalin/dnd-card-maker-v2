import { useRef, useEffect, useState } from 'react';

import { useCardContext } from '../../store';
import './FloatingStylePanel.css'; // Reusing the same CSS for consistency

interface FloatingImagePanelProps {
    side: 'front' | 'back';
    onClose: () => void;
    onPanelEnter?: () => void; // Called when mouse enters panel to cancel hide timeout
}

function FloatingImagePanel({ side, onClose, onPanelEnter }: FloatingImagePanelProps) {
    const { updateCustomStyle, updateOffset, state } = useCardContext();

    // Joystick Logic
    const joystickRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleJoystickMove = (clientX: number, clientY: number) => {
        if (!joystickRef.current) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = (clientX - centerX) * 6.66;
        let dy = (clientY - centerY) * 6.66;

        // Clamp -50 to 50
        dx = Math.max(-50, Math.min(50, dx));
        dy = Math.max(-50, Math.min(50, dy));

        updateCustomStyle('itemImage_shadowOffsetX', Math.round(dx), side);
        updateCustomStyle('itemImage_shadowOffsetY', Math.round(dy), side);
    };

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (isDragging) {
                e.preventDefault();
                handleJoystickMove(e.clientX, e.clientY);
            }
        };
        const onUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [isDragging]);

    // Helper for styles
    const getStyleValue = (prop: string, defaultValue: any) => {
        const customStyles = state.settings[side]?.customStyles || {};
        const key = `itemImage_${prop}`;
        return customStyles[key] !== undefined ? customStyles[key] : defaultValue;
    };

    // Helper for transforms
    const getTransformValue = (key: string, defaultValue: number): number => {
        const offsets = state.settings[side]?.offsets || {};
        const val = offsets[key];
        return (val !== undefined && typeof val === 'number') ? val : defaultValue;
    };

    const updateStyle = (prop: string, value: any) => {
        updateCustomStyle(`itemImage_${prop}`, value, side);
    };

    const handleReset = () => {
        updateOffset('imageScale', 1, side);
        updateOffset('imageRotation', 0, side);
        updateOffset('imageXOffset', 0, side);
        updateOffset('imageYOffset', 0, side);

        updateStyle('opacity', 1);
        updateStyle('fade', 0);

        // Reset Shadow/Glow
        updateStyle('shadowBlur', 0);
        updateStyle('shadowColor', '#000000');
        updateStyle('shadowOffsetX', 0);
        updateStyle('shadowOffsetY', 0);
    };


    return (
        <div className="floating-style-panel" style={{ top: '60px', width: '240px' }} onMouseEnter={onPanelEnter}>
            <div className="panel-header">
                <span className="panel-title">🖼️ עריכת תמונה</span>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>


            {/* Scale & Rotate */}
            <div className="panel-section">
                <div className="control-row">
                    <label>זום</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0.1"
                            max="3"
                            step="0.05"
                            value={getTransformValue('imageScale', 1)}
                            onChange={(e) => updateOffset('imageScale', parseFloat(e.target.value), side)}
                        />
                        <span>{getTransformValue('imageScale', 1).toFixed(1)}x</span>
                    </div>
                </div>

                <div className="control-row">
                    <label>סיבוב</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="-180"
                            max="180"
                            step="5"
                            value={getTransformValue('imageRotation', 0)}
                            onChange={(e) => updateOffset('imageRotation', parseInt(e.target.value), side)}
                        />
                        <span>{getTransformValue('imageRotation', 0)}°</span>
                    </div>
                </div>
            </div>

            {/* Mask Shape Selection */}
            <div className="panel-section">
                <div className="control-row" style={{ marginBottom: '8px' }}>
                    <label style={{ width: 'auto', fontWeight: 'bold' }}>צורת חיתוך (Mask)</label>
                </div>
                <div className="shape-selector" style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '15px' }}>
                    {[
                        { id: 'square', label: '⬛', title: 'Square' },
                        { id: 'rounded', label: '▢', title: 'Rounded' },
                        { id: 'circle', label: '●', title: 'Circle' },
                        { id: 'diamond', label: '◆', title: 'Diamond' }
                    ].map(shape => (
                        <button
                            key={shape.id}
                            onClick={() => updateStyle('maskShape', shape.id)}
                            title={shape.title}
                            style={{
                                width: '36px',
                                height: '36px',
                                fontSize: '18px',
                                background: getStyleValue('maskShape', 'square') === shape.id ? 'rgba(52, 152, 219, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                border: getStyleValue('maskShape', 'square') === shape.id ? '1px solid #3498db' : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                color: 'white'
                            }}
                        >
                            {shape.label}
                        </button>
                    ))}
                </div>

                {/* Mask Border Controls */}
                <div className="control-row">
                    <label>קו (Border)</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0"
                            max="50"
                            value={getStyleValue('borderWidth', 0)}
                            onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('borderWidth', 0)}px</span>
                    </div>
                </div>
                <div className="control-row">
                    <label>ריכוך (Fade)</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={getStyleValue('borderFade', 0)}
                            onChange={(e) => updateStyle('borderFade', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('borderFade', 0)}</span>
                    </div>
                </div>
            </div>

            {/* Background Scale - NEW */}
            <div className="panel-section">
                <div className="control-row" style={{ marginBottom: '5px' }}>
                    <label style={{ width: 'auto', fontWeight: 'bold' }}>רקע (Background)</label>
                </div>
                <div className="control-row">
                    <label>זום רקע</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="1.0"
                            max="2.0"
                            step="0.05"
                            value={getTransformValue('backgroundScale', 1)}
                            onChange={(e) => updateOffset('backgroundScale', parseFloat(e.target.value), side)}
                        />
                        <span>{getTransformValue('backgroundScale', 1).toFixed(2)}x</span>
                    </div>
                </div>
            </div>

            {/* Fade Frame (Vignette) */}
            <div className="panel-section">
                <div className="control-row" style={{ marginBottom: '5px' }}>
                    <label style={{ width: 'auto', fontWeight: 'bold' }}>עמעום מסגרת (Fade)</label>
                </div>

                <div className="control-row">
                    <label>עוצמה</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={getStyleValue('fade', 0)}
                            onChange={(e) => updateStyle('fade', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('fade', 0)}</span>
                    </div>
                </div>
            </div>

            {/* Shadow Effect */}
            <div className="panel-section">
                <div className="control-row" style={{ marginBottom: '5px' }}>
                    <label style={{ width: 'auto', fontWeight: 'bold' }}>הצללה (Shadow)</label>
                </div>

                <div className="control-row">
                    <label>עוצמה</label>
                    <div className="slider-control">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={getStyleValue('shadowBlur', 0)}
                            onChange={(e) => updateStyle('shadowBlur', parseInt(e.target.value))}
                        />
                        <span>{getStyleValue('shadowBlur', 0)}</span>
                    </div>
                </div>

                <div className="control-row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <label>כיוון וצבע</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        {/* Shadow Color */}
                        <input
                            type="color"
                            value={getStyleValue('shadowColor', '#000000')}
                            onChange={(e) => updateStyle('shadowColor', e.target.value)}
                            style={{
                                width: '24px',
                                height: '24px',
                                padding: 0,
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px'
                            }}
                            title="Shadow Color"
                        />

                        {/* Joystick */}
                        <div
                            ref={joystickRef}
                            onMouseDown={() => setIsDragging(true)}
                            title={`X: ${getStyleValue('shadowOffsetX', 0)}, Y: ${getStyleValue('shadowOffsetY', 0)}`}
                            style={{
                                width: '15px',
                                height: '15px',
                                background: '#2c3e50',
                                borderRadius: '50%',
                                position: 'relative',
                                cursor: 'move',
                                border: '1px solid #555',
                                boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)'
                            }}
                        >
                            {/* Grid Lines */}
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.3)' }} />

                            {/* Handle */}
                            <div
                                style={{
                                    position: 'absolute',
                                    width: '6px',
                                    height: '6px',
                                    background: '#3498db',
                                    borderRadius: '50%',
                                    top: '50%',
                                    left: '50%',
                                    transform: `translate(${getStyleValue('shadowOffsetX', 0) * 0.15 - 3}px, ${getStyleValue('shadowOffsetY', 0) * 0.15 - 3}px)`,
                                    boxShadow: '0 0 2px rgba(0,0,0,0.5)',
                                    border: '1px solid #fff',
                                    pointerEvents: 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reset */}
            <div className="panel-section" style={{ textAlign: 'center' }}>
                <button onClick={handleReset} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                    🔄 איפוס הכל
                </button>
            </div>
        </div>
    );
}

export default FloatingImagePanel;
