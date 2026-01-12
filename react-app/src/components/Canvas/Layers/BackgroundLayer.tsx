import React from 'react';
import { Rect, Image as KonvaImage, Group } from 'react-konva';

interface BackgroundLayerProps {
    width: number;
    height: number;
    backgroundImage: HTMLImageElement | null;
    backgroundScale: number;
    onMouseDown: (e: any) => void;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
    width,
    height,
    backgroundImage,
    backgroundScale,
    onMouseDown
}) => {
    return (
        <Group>
            {/* Base Background Color */}
            <Rect
                name="card-background"
                width={width}
                height={height}
                fill="#f5f0e1"
                cornerRadius={24}
                onMouseDown={onMouseDown}
                onTouchStart={onMouseDown}
            />

            {/* User Uploaded Background Image */}
            {backgroundImage && (
                <KonvaImage
                    name="card-background-image"
                    image={backgroundImage}
                    width={width}
                    height={height}
                    // Scale from center
                    x={width / 2}
                    y={height / 2}
                    offsetX={width / 2}
                    offsetY={height / 2}
                    scaleX={backgroundScale}
                    scaleY={backgroundScale}
                    listening={false} // Pass clicks through to the Rect
                />
            )}
        </Group>
    );
};
