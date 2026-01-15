import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';

interface OverlayLayerProps {
    selectedId: string | null;
    isEditMode: boolean;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({ selectedId, isEditMode }) => {
    const trRef = useRef<any>(null);

    // Effect to update transformer nodes when selection changes
    useEffect(() => {
        if (!trRef.current) return;

        if (isEditMode && selectedId) {
            // We are inside the Stage, so we can get the stage from the transformer node
            const stage = trRef.current.getStage();
            const node = stage.findOne('#' + selectedId);

            if (node) {
                trRef.current.nodes([node]);
                // IMPORTANT: Force update is needed because the node may contain cached children
                // which can cause the transformer to not properly track the group bounds
                trRef.current.forceUpdate();
                trRef.current.getLayer().batchDraw();
            } else {
                trRef.current.nodes([]);
            }
        } else {
            trRef.current.nodes([]);
        }
    }, [selectedId, isEditMode]);

    if (!isEditMode || !selectedId) return null;

    // We restrict transformer to ItemImage only for now based on original code?
    // Original code: {isEditMode && selectedId === 'itemImage' && ( Transformer ... )}
    // BUT user might want to resize text boxes later? 
    // For now, let's keep it generic but maybe strictly for itemImage if text shouldn't be resized (text uses fontSize).
    // The previous code ONLY allowed resizing 'itemImage'.

    // We allow transformer for all elements now (Text & Images)
    // Canva-like experience


    return (
        <Transformer
            ref={trRef}
            boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 20 || newBox.height < 20) {
                    return oldBox;
                }
                return newBox;
            }}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            rotateEnabled={true}
            padding={2}
            borderStroke="#007bff"
            borderStrokeWidth={2}
            anchorSize={10}
            anchorStroke="#007bff"
            anchorFill="#fff"
        />
    );
};
