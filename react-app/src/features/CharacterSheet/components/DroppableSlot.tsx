import { useDroppable } from '@dnd-kit/core';
import type { ReactNode } from 'react';

interface DroppableSlotProps {
    id: string;
    children: ReactNode;
    className?: string;
}

export function DroppableSlot({ id, children, className = '' }: DroppableSlotProps) {
    const { isOver, setNodeRef } = useDroppable({
        id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`${className} ${isOver ? 'drag-over' : ''}`}
        >
            {children}
        </div>
    );
}
