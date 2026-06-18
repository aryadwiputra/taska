import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import type { BoardColumn } from '@/types/board';

interface Props {
    column: BoardColumn;
    isTarget?: boolean;
    children: React.ReactNode;
}

export function BoardColumnHeader({ column, isTarget, children }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: `column:${column.id}`,
        data: { type: 'column', column },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center justify-between px-3 py-2.5',
                isDragging && 'rounded-lg bg-muted opacity-60 shadow-soft',
                isTarget &&
                    'rounded-lg border-2 border-dashed border-primary/60 bg-primary/[0.06]',
            )}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
}
