import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { ReactNode } from 'react';
import type { DragData } from '../hooks/useDragDrop';

interface DraggableItemProps {
    id: string;
    data: DragData;
    children: ReactNode;
    disabled?: boolean;
}

export function DraggableItem({ id, data, children, disabled }: DraggableItemProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        data,
        disabled,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
        >
            {children}
        </div>
    );
}
