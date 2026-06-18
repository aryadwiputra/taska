import { useDroppable } from '@dnd-kit/core';
import { ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { BoardColumn } from '@/types/board';

interface Props {
    column: BoardColumn;
    activeTaskId: number | null;
    isOverForReorder?: boolean;
    children: React.ReactNode;
}

export function BoardColumn({
    column,
    activeTaskId,
    isOverForReorder,
    children,
}: Props) {
    const { t } = useTranslation();
    const { setNodeRef, isOver } = useDroppable({ id: `col:${column.id}` });
    const isEmpty = column.tasks.length === 0;
    const hasActiveTask = activeTaskId !== null;
    const isTaskDrag = hasActiveTask && !isOverForReorder;
    const isColumnReorder = hasActiveTask && isOverForReorder;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'group flex min-h-0 w-[calc(100vw-2rem)] shrink-0 snap-start flex-col rounded-xl border border-border bg-card/70 transition-[background-color,border-color,box-shadow] sm:w-72',
                isOver && isTaskDrag && !isEmpty
                    ? 'border-dashed border-primary/50 bg-primary/[0.04]'
                    : isOver &&
                          isTaskDrag &&
                          isEmpty &&
                          'border-dashed border-primary/50 bg-primary/5 shadow-soft',
                isOver &&
                    isColumnReorder &&
                    'border-dashed border-primary/50 bg-primary/[0.06] shadow-soft',
            )}
        >
            {children}
            {isOver && isTaskDrag && (
                <div className="flex flex-1 items-center justify-center py-4">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ArrowDown className="size-6 animate-bounce text-primary" />
                        <p className="text-xs font-medium text-primary">
                            {t('board.drop_here')}
                        </p>
                    </div>
                </div>
            )}
            {!isOver && isEmpty && !hasActiveTask && (
                <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-xs text-muted-foreground">
                        {t('board.no_tasks')}
                    </p>
                </div>
            )}
        </div>
    );
}
