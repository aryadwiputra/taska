'use no memo';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { FileText, GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { show as docsShow } from '@/routes/projects/docs';
import type { DocTreeItem } from '@/types/docs';

interface Props {
    node: DocTreeItem & { depth?: number };
    workspaceSlug: string;
    projectSlug: string;
    activeDocId?: number;
    showDelete?: boolean;
    onDelete?: (node: DocTreeItem) => void;
    onSelect?: (node: DocTreeItem) => void;
}

export function SortableDocNode({
    node,
    workspaceSlug,
    projectSlug,
    activeDocId,
    showDelete,
    onDelete,
    onSelect,
}: Props) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: node.id,
    });
    const isActive = node.id === activeDocId;

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-50')}>
            <div className="group flex w-full items-center gap-1">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 active:cursor-grabbing"
                >
                    <GripVertical className="size-3" />
                </button>

                <span className="size-3.5 shrink-0" />

                <button
                    type="button"
                     onClick={() => {
                         onSelect?.(node);
                         router.visit(
                             docsShow.url({
                                 workspace: workspaceSlug,
                                 project: projectSlug,
                                 doc: node.slug,
                             }),
                         );
                     }}
                    style={{ marginLeft: `${(node.depth ?? 0) * 16}px` }}
                    className={cn(
                        'flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors',
                        isActive && 'bg-accent font-medium text-accent-foreground',
                        !isActive && 'hover:bg-accent',
                    )}
                >
                    <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{node.title}</span>
                </button>

                {showDelete && onDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(node)}
                        className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                    >
                        <Trash2 className="size-3" />
                    </button>
                )}
                </div>
        </div>
    );
}
