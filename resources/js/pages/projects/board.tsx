import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowDown, ArrowLeft, GripVertical } from 'lucide-react';
import { useState } from 'react';
import { TaskCard } from '@/components/task-card';
import { TaskCreateDialog } from '@/components/task-create-dialog';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Assignee {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskItem {
    id: number;
    task_number: number;
    code: string;
    title: string;
    status: string;
    position: number;
    due_date: string | null;
    priority: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    } | null;
    task_type: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    };
    assignees: Assignee[];
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
}

interface Column {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
    tasks: TaskItem[];
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface ProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
}

interface BoardData {
    id: number;
    name: string;
    type: string;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    board: BoardData;
    columns: Column[];
    taskTypes: Array<{
        id: number;
        name: string;
        key: string;
        color: string | null;
    }>;
    priorities: Array<{ id: number; name: string; key: string; level: number }>;
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
}

function SortableTask({
    task,
    isDragging,
    showDropIndicatorAbove,
    showDropIndicatorBelow,
    onClick,
}: {
    task: TaskItem;
    isDragging?: boolean;
    showDropIndicatorAbove?: boolean;
    showDropIndicatorBelow?: boolean;
    onClick?: () => void;
}) {
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
            {showDropIndicatorAbove && (
                <div className="mx-2 mb-1 h-1 rounded-full bg-primary" />
            )}
            <div className="group/task relative">
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
            {showDropIndicatorBelow && (
                <div className="mx-2 mt-1 h-1 rounded-full bg-primary" />
            )}
        </div>
    );
}

function DroppableColumn({
    column,
    activeTaskId,
    children,
}: {
    column: Column;
    activeTaskId: number | null;
    children: React.ReactNode;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: column.id });
    const isEmpty = column.tasks.length === 0;
    const hasActiveTask = activeTaskId !== null;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex w-72 shrink-0 flex-col rounded-lg bg-muted/50 transition-colors',
                isOver && !isEmpty && 'ring-2 ring-primary/50',
                isOver && isEmpty && 'border-2 border-dashed border-primary/50 bg-primary/5',
            )}
        >
            {children}
            {isOver && isEmpty && hasActiveTask && (
                <div className="flex flex-1 items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ArrowDown className="size-6 animate-bounce text-primary" />
                        <p className="text-xs font-medium text-primary">
                            Drop here
                        </p>
                    </div>
                </div>
            )}
            {!isOver && isEmpty && !hasActiveTask && (
                <div className="flex flex-1 items-center justify-center py-8">
                    <p className="text-xs text-muted-foreground">
                        No tasks
                    </p>
                </div>
            )}
        </div>
    );
}

export default function Board(props: Props) {
    /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
    return <BoardClient {...props} />;
}

function BoardClient({
    workspace,
    project,
    columns,
    taskTypes,
    priorities,
    epics,
    sprints,
}: Props) {
    const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const findColumnByTaskId = (taskId: number): Column | undefined => {
        return columns.find((col) => col.tasks.some((t) => t.id === taskId));
    };

    const findColumnById = (columnId: number): Column | undefined => {
        return columns.find((col) => col.id === columnId);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = columns.flatMap((c) => c.tasks).find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    };

    const handleDragOver = () => {
        // Columns state must remain stable during drag to keep
        // SortableContext items intact. Visual feedback is handled
        // by DragOverlay (card follows cursor) and DroppableColumn's
        // useDroppable isOver (column highlighting).
        // Actual move happens in handleDragEnd + API call.
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) {
            return;
        }

        const taskId = active.id as number;
        const fromColumn = findColumnByTaskId(taskId);

        // Determine target column
        let toColumnId: number | null = null;
        const columnById = findColumnById(over.id as number);

        if (columnById) {
            toColumnId = columnById.id;
        } else {
            const columnByTask = findColumnByTaskId(over.id as number);

            if (columnByTask) {
                toColumnId = columnByTask.id;
            }
        }

        if (!toColumnId || !fromColumn) {
            return;
        }

        // Skip no-op: same column
        if (toColumnId === fromColumn.id) {
            return;
        }

        const task = columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);

        if (!task) {
            return;
        }

        router
            .optimistic((props: Record<string, unknown>) => ({
                columns: (props.columns as Column[]).map((col) => {
                    if (col.id === fromColumn.id) {
                        return {
                            ...col,
                            tasks: col.tasks.filter((t) => t.id !== taskId),
                        };
                    }

                    if (col.id === toColumnId) {
                        return {
                            ...col,
                            tasks: [...col.tasks, task],
                        };
                    }

                    return col;
                }),
            }))
            .post(
                `/workspaces/${workspace.slug}/projects/${project.slug}/tasks/${taskId}/move`,
                {
                    board_column_id: toColumnId,
                    position: 0,
                },
                {
                    preserveScroll: true,
                },
            );
    };

    return (
        <>
            <Head title={`${project.name} — Board`} />

            <div className="flex h-full flex-1 flex-col overflow-hidden p-6" suppressHydrationWarning>
                <div className="mb-4 flex shrink-0 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/workspaces/${workspace.slug}/projects/${project.slug}`}
                            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            <span>{project.name}</span>
                        </Link>
                    </div>
                    <TaskCreateDialog
                        workspaceSlug={workspace.slug}
                        projectSlug={project.slug}
                        taskTypes={taskTypes}
                        priorities={priorities}
                        epics={epics}
                        sprints={sprints}
                        onCreated={() => {
                            router.reload();
                        }}
                    />
                </div>

                <DndContext
                    id="board-dnd"
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
                        {columns.map((column) => (
                            <DroppableColumn
                                key={column.id}
                                column={column}
                                activeTaskId={activeTask?.id ?? null}
                            >
                                <div className="flex items-center justify-between px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="size-2.5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    column.color ?? '#64748B',
                                            }}
                                        />
                                        <h3 className="text-sm font-semibold">
                                            {column.name}
                                        </h3>
                                        <Badge
                                            variant="secondary"
                                            className="px-1.5 py-0 text-[10px]"
                                        >
                                            {column.tasks.length}
                                        </Badge>
                                    </div>
                                </div>

                                <SortableContext
                                    items={column.tasks.map((t) => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div
                                        className={cn(
                                            'flex min-h-[100px] flex-col gap-2 px-2 pb-2',
                                            column.tasks.length === 0 && 'hidden',
                                        )}
                                    >
                                        {column.tasks.map((task) => (
                                            <SortableTask
                                                key={task.id}
                                                task={task}
                                                onClick={() => {
                                                    setDrawerTaskId(task.id);
                                                    setDrawerOpen(true);
                                                }}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DroppableColumn>
                        ))}
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeTask && (
                            <div className="w-72 rotate-2 shadow-xl">
                                <TaskCard task={activeTask} isDragging />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                <TaskDetailDrawer
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    taskId={drawerTaskId}
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    onDelete={() => router.reload()}
                />
            </div>
        </>
    );
}
