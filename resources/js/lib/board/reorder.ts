import { closestCorners, pointerWithin } from '@dnd-kit/core';
import type { CollisionDetection, UniqueIdentifier } from '@dnd-kit/core';
import type {
    BoardColumn,
    BoardDropPosition,
    BoardTaskItem,
    ReorderBoardTasksPayload,
} from '@/types/board';

const POSITION_STEP = 1000;

/**
 * Clamp a value between min and max (inclusive).
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Find which column contains a given task by its ID.
 */
export function findColumnByTaskId(
    columns: BoardColumn[],
    taskId: number,
): BoardColumn | undefined {
    return columns.find((col) => col.tasks.some((t) => t.id === taskId));
}

export function findColumnById(
    columns: BoardColumn[],
    columnId: number,
): BoardColumn | undefined {
    return columns.find((col) => col.id === columnId);
}

export function normalizeTaskOrders(columns: BoardColumn[]): BoardColumn[] {
    return columns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task, index) => ({
            ...task,
            position: (index + 1) * POSITION_STEP,
        })),
    }));
}

export function normalizeColumnOrders(columns: BoardColumn[]): BoardColumn[] {
    return columns.map((column, index) => ({ ...column, position: index }));
}

/**
 * Reorder tasks within the same column.
 *
 * @param column  The column containing the tasks
 * @param taskId  The ID of the task being dragged
 * @param overId  The ID of the target element (task or `col:${id}`)
 * @param edge    Where to insert relative to the target ('top' | 'bottom' | null)
 * @returns A new column with reordered tasks, or the same column if no move needed
 */
export function reorderSameColumnTasks(
    column: BoardColumn,
    taskId: number,
    overId: number | string,
    edge: 'top' | 'bottom' | null,
): BoardColumn {
    const task = column.tasks.find((t) => t.id === taskId);

    if (!task) {
        return column;
    }

    const filtered = column.tasks.filter((t) => t.id !== taskId);

    let insertPos: number;

    if (typeof overId === 'string' && overId.startsWith('col:')) {
        insertPos = filtered.length;
    } else {
        const overIdx = filtered.findIndex((t) => t.id === overId);
        insertPos = Math.max(0, overIdx);

        if (edge === 'bottom') {
            insertPos++;
        }
    }

    insertPos = clamp(insertPos, 0, filtered.length);

    const reordered = [...filtered];
    reordered.splice(insertPos, 0, task);

    return { ...column, tasks: reordered };
}

/**
 * Calculate the position index to send to the API for same-column reorders.
 *
 * Position is 0-indexed among the *other* tasks in the column (after the
 * dragged task is removed), and mirrors what the UI will show after the
 * optimistic update.
 */
export function calcSameColumnPosition(
    column: BoardColumn,
    taskId: number,
    overId: number | string,
    edge: 'top' | 'bottom' | null,
): number {
    if (typeof overId === 'string' && overId.startsWith('col:')) {
        return column.tasks.length - 1;
    }

    const overIdx = column.tasks.findIndex((t) => t.id === overId);
    const activeIdx = column.tasks.findIndex((t) => t.id === taskId);

    let position: number;

    if (edge === 'bottom') {
        position = activeIdx < overIdx ? overIdx : overIdx + 1;
    } else {
        position = activeIdx < overIdx ? overIdx - 1 : overIdx;
    }

    return clamp(position, 0, column.tasks.length - 1);
}

/**
 * Move a task from one column to another.
 *
 * The task is removed from the source column and inserted into the target
 * column at the given position. The task's status is updated to match the
 * target column's status_key.
 *
 * @returns A new array of columns (copy-on-write).
 */
export function reorderAcrossColumns(
    columns: BoardColumn[],
    taskId: number,
    fromColId: number,
    toColId: number,
    position: number,
): BoardColumn[] {
    const fromCol = columns.find((c) => c.id === fromColId);
    const toCol = columns.find((c) => c.id === toColId);

    if (!fromCol || !toCol) {
        return columns;
    }

    const task = fromCol.tasks.find((t) => t.id === taskId);

    if (!task) {
        return columns;
    }

    const movedTask: BoardTaskItem = {
        ...task,
        status: toCol.status_key,
    };

    const clampedPos = clamp(position, 0, toCol.tasks.length);

    return normalizeTaskOrders(
        columns.map((col) => {
            if (col.id === fromCol.id) {
                return {
                    ...col,
                    tasks: col.tasks.filter((t) => t.id !== taskId),
                };
            }

            if (col.id === toCol.id) {
                const updated = [...col.tasks];
                updated.splice(clampedPos, 0, movedTask);

                return { ...col, tasks: updated };
            }

            return col;
        }),
    );
}

export function moveTaskWithinColumn(
    columns: BoardColumn[],
    taskId: number,
    columnId: number,
    overId: number | string,
    edge: 'top' | 'bottom' | null,
): BoardColumn[] {
    return normalizeTaskOrders(
        columns.map((column) =>
            column.id === columnId
                ? reorderSameColumnTasks(column, taskId, overId, edge)
                : column,
        ),
    );
}

export function moveTaskAcrossColumns(
    columns: BoardColumn[],
    taskId: number,
    fromColumnId: number,
    toColumnId: number,
    index: number,
): BoardColumn[] {
    return reorderAcrossColumns(
        columns,
        taskId,
        fromColumnId,
        toColumnId,
        index,
    );
}

/**
 * Reorder columns (for column drag-and-drop).
 *
 * Moves the column at activeId so it appears before the column at overId.
 *
 * @returns A new array of columns with updated positions.
 */
export function reorderColumns(
    columns: BoardColumn[],
    activeId: number,
    overId: number,
): BoardColumn[] {
    const activeIdx = columns.findIndex((c) => c.id === activeId);
    const overIdx = columns.findIndex((c) => c.id === overId);

    if (activeIdx < 0 || overIdx < 0 || activeIdx === overIdx) {
        return columns;
    }

    const updated = [...columns];
    const [moved] = updated.splice(activeIdx, 1);
    updated.splice(overIdx, 0, moved);

    return normalizeColumnOrders(updated);
}

/**
 * Build the payload for the column-reorder API call.
 */
export function buildColumnReorderPayload(
    columns: BoardColumn[],
): Array<{ id: number; position: number }> {
    return columns.map((col, idx) => ({ id: col.id, position: idx }));
}

export function buildTaskReorderPayload(
    columns: BoardColumn[],
): ReorderBoardTasksPayload {
    return {
        columns: columns.map((column) => ({
            column_id: column.id,
            task_ids: column.tasks.map((task) => task.id),
        })),
    };
}

export function calculateTaskDropPosition(
    columns: BoardColumn[],
    overId: number | string,
    edge: 'top' | 'bottom' | null,
): BoardDropPosition | null {
    if (typeof overId === 'string' && overId.startsWith('col:')) {
        const columnId = Number(overId.slice(4));
        const column = findColumnById(columns, columnId);

        if (!column) {
            return null;
        }

        return {
            columnId,
            taskId: null,
            index: column.tasks.length,
            edge: 'append',
        };
    }

    const taskId = Number(overId);
    const column = findColumnByTaskId(columns, taskId);

    if (!column) {
        return null;
    }

    const taskIndex = column.tasks.findIndex((task) => task.id === taskId);
    const index = edge === 'bottom' ? taskIndex + 1 : taskIndex;

    return {
        columnId: column.id,
        taskId,
        index: clamp(index, 0, column.tasks.length),
        edge,
    };
}

/**
 * Detect whether the pointer is closer to the top or bottom edge of a
 * target element.
 *
 * @param pointerY  Current pointer Y coordinate (clientY)
 * @param rectTop   Target element's top coordinate
 * @param rectHeight Target element's height
 * @returns 'top' if pointer is in the upper half, 'bottom' otherwise
 */
export function detectClosestEdge(
    pointerY: number,
    rectTop: number,
    rectHeight: number,
): 'top' | 'bottom' {
    return pointerY < rectTop + rectHeight / 2 ? 'top' : 'bottom';
}

/**
 * Custom collision detection for the board drag-and-drop.
 *
 * Uses pointerWithin first. If the pointer is outside all droppables
 * (e.g. dragging near column headers), falls back to vertical proximity:
 * find the closest droppable by center distance on the Y axis.
 * This makes dropping at the top of a column reliable.
 */
export function boardCollisionDetection(
    args: Parameters<CollisionDetection>[0],
) {
    const { pointerCoordinates } = args;
    const pointer = pointerCoordinates ?? null;

    if (!pointer) {
        return [];
    }

    const pointerResults = pointerWithin(args);

    if (pointerResults.length > 0) {
        return pointerResults;
    }

    const containers = args.droppableContainers.filter(
        (c) => c.data.current?.type !== 'column',
    );

    if (containers.length === 0) {
        return closestCorners(args);
    }

    let closest: { id: UniqueIdentifier; distance: number } | null = null;

    for (const container of containers) {
        const rect = container.rect.current;

        if (!rect || rect.initial === null) {
            continue;
        }

        const centerY = rect.top + rect.height / 2;
        const distance = Math.abs(pointer.y - centerY);

        if (!closest || distance < closest.distance) {
            closest = { id: container.id, distance };
        }
    }

    if (closest) {
        return [{ id: closest.id }];
    }

    return closestCorners(args);
}
