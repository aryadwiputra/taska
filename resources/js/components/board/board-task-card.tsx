import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { TaskCard } from '@/components/task-card';
import type { BoardTaskItem } from '@/types/board';

interface Props {
    task: BoardTaskItem;
    isDragging?: boolean;
    onClick?: () => void;
    isOver?: boolean;
    edge?: 'top' | 'bottom' | null;
}

export function BoardSortableTask({
    task,
    isDragging,
    onClick,
    isOver,
    edge,
}: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isSortableDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <div className="group/task relative">
                {isOver && edge === 'top' && (
                    <div className="absolute -top-1 right-2 left-2 z-10 h-0.5 rounded-full bg-primary" />
                )}
                {isOver && edge === 'bottom' && (
                    <div className="absolute right-2 -bottom-1 left-2 z-10 h-0.5 rounded-full bg-primary" />
                )}
                <div
                    {...listeners}
                    className="absolute top-1/2 left-0 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover/task:opacity-100"
                >
                    <GripVertical className="size-3.5 text-muted-foreground" />
                </div>
                <div className="pl-0 transition-all group-hover/task:pl-4">
                    <TaskCard
                        task={task}
                        isDragging={isDragging}
                        onClick={onClick}
                    />
                </div>
            </div>
        </div>
    );
}
