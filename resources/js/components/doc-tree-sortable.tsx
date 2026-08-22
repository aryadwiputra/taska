'use no memo';

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { reorder as reorderDocs } from '@/routes/projects/docs';
import type { DocTreeItem } from '@/types/docs';
import { SortableDocNode } from './sortable-doc-node';

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    nodes: DocTreeItem[];
    activeDocId?: number;
    showDelete?: boolean;
    onDelete?: (node: DocTreeItem) => void;
    onSelect?: (node: DocTreeItem) => void;
}

function flattenNodes(items: DocTreeItem[], depth = 0, result: Array<DocTreeItem & { depth: number }> = []) {
    for (const item of items) {
        result.push({ ...item, depth });

        if (item.children.length > 0) {
            flattenNodes(item.children, depth + 1, result);
        }
    }

    return result;
}

export function DocTreeSortable({ workspaceSlug, projectSlug, nodes, activeDocId, showDelete, onDelete, onSelect }: Props) {
    const [flatItems, setFlatItems] = useState(() => flattenNodes(nodes));

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = flatItems.findIndex((n) => n.id === active.id);
        const newIndex = flatItems.findIndex((n) => n.id === over.id);

        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        const newFlatItems = [...flatItems];
        const [moved] = newFlatItems.splice(oldIndex, 1);
        newFlatItems.splice(newIndex, 0, moved);
        setFlatItems(newFlatItems);

        const orders = newFlatItems.map((item, idx) => ({
            id: item.id,
            sort_order: idx + 1,
        }));

        router.put(
            reorderDocs.url({ workspace: workspaceSlug, project: projectSlug }),
            { orders },
            { preserveScroll: true },
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={flatItems.map((n) => n.id)}
                strategy={verticalListSortingStrategy}
            >
                <div>
                    {flatItems.map((node) => (
                        <SortableDocNode
                            key={node.id}
                            node={node}
                            workspaceSlug={workspaceSlug}
                            projectSlug={projectSlug}
                            activeDocId={activeDocId}
                            showDelete={showDelete}
                            onDelete={onDelete}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
