import type { BoardColumn, BoardTaskItem } from '@/types/board';

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

    return columns.map((col) => {
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
    });
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

    return updated.map((col, idx) => ({ ...col, position: idx }));
}

/**
 * Build the payload for the column-reorder API call.
 */
export function buildColumnReorderPayload(
    columns: BoardColumn[],
): Array<{ id: number; position: number }> {
    return columns.map((col, idx) => ({ id: col.id, position: idx }));
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
