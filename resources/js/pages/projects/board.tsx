import {
    DndContext,
    DragOverlay,
    PointerSensor,
    closestCorners,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type {
    DragOverEvent,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEcho, useEchoPresence } from '@laravel/echo-react';
import {
    ArrowDown,
    ArrowLeft,
    GripVertical,
    Settings2,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BoardColumnManager } from '@/components/board-column-manager';
import { TaskCard } from '@/components/task-card';
import { TaskCreateDialog } from '@/components/task-create-dialog';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { cn } from '@/lib/utils';
import { board as projectBoard, show as projectShow } from '@/routes/projects';
import { reorder as reorderColumns } from '@/routes/projects/boards/columns';
import { move as moveTask } from '@/routes/projects/tasks';

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

interface BoardOption {
    id: number;
    name: string;
    type: string;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    board: BoardData;
    allBoards: BoardOption[];
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

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

const AVATAR_COLORS = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-fuchsia-500',
    'bg-lime-500',
];

function getAvatarColor(userId: number): string {
    return AVATAR_COLORS[userId % AVATAR_COLORS.length];
}

function PresenceAvatars({
    users,
    currentUserId,
}: {
    users: Array<{ id: number; name: string }>;
    currentUserId: number;
}) {
    const others = users.filter((u) => u.id !== currentUserId);
    const visible = others.slice(0, 5);
    const remainder = others.length - visible.length;

    if (others.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <div className="flex -space-x-1.5">
                {visible.map((user) => (
                    <div
                        key={user.id}
                        title={user.name}
                        className={cn(
                            'flex size-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-medium text-white',
                            getAvatarColor(user.id),
                        )}
                    >
                        {getInitials(user.name)}
                    </div>
                ))}
                {remainder > 0 && (
                    <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground">
                        +{remainder}
                    </div>
                )}
            </div>
        </div>
    );
}

function SortableTask({
    task,
    isDragging,
    onClick,
}: {
    task: TaskItem;
    isDragging?: boolean;
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
    const { setNodeRef, isOver } = useDroppable({ id: `col:${column.id}` });
    const isEmpty = column.tasks.length === 0;
    const hasActiveTask = activeTaskId !== null;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'group flex w-[calc(100vw-2rem)] shrink-0 snap-start flex-col rounded-lg bg-muted/50 transition-colors sm:w-72',
                isOver && !isEmpty && 'ring-2 ring-primary/50',
                isOver &&
                    isEmpty &&
                    'border-2 border-dashed border-primary/50 bg-primary/5',
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
                    <p className="text-xs text-muted-foreground">No tasks</p>
                </div>
            )}
        </div>
    );
}

function SortableColumnHeader({
    column,
    children,
}: {
    column: Column;
    children: React.ReactNode;
}) {
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
                isDragging && 'rounded-lg bg-muted opacity-50',
            )}
            {...attributes}
            {...listeners}
        >
            {children}
        </div>
    );
}

export default function Board(props: Props) {
    return <BoardClient {...props} />;
}

function BoardClient({
    workspace,
    project,
    board,
    allBoards,
    columns: initialColumns,
    taskTypes,
    priorities,
    epics,
    sprints,
}: Props) {
    const [columns, setColumns] = useState(initialColumns);
    const columnsSnapshotRef = useRef(columns);
    const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [columnManagerOpen, setColumnManagerOpen] = useState(false);
    const [newTaskOpen, setNewTaskOpen] = useState(false);

    const [presenceUsers, setPresenceUsers] = useState<
        Array<{ id: number; name: string }>
    >([]);

    const presence = useEchoPresence(`board.${project.id}`, [], () => {}, []);

    useEffect(() => {
        const ch = presence.channel();

        if (!ch) {
            return;
        }

        ch.here((users: Array<{ id: number; name: string }>) => {
            setPresenceUsers(users);
        });

        ch.joining((user: { id: number; name: string }) => {
            setPresenceUsers((prev) => {
                if (prev.some((u) => u.id === user.id)) {
                    return prev;
                }

                return [...prev, user];
            });
        });

        ch.leaving((user: { id: number; name: string }) => {
            setPresenceUsers((prev) => prev.filter((u) => u.id !== user.id));
        });
    }, [presence]);

    useKeyboardShortcuts([
        {
            key: 'n',
            handler: () => setNewTaskOpen(true),
            enabled: !newTaskOpen,
            description: 'New task',
        },
        {
            sequence: ['g', 's'],
            handler: () => {
                router.visit(
                    projectBoard({
                        workspace: workspace.slug,
                        project: project.slug,
                    }),
                );
            },
            description: 'Go to settings',
        },
    ]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const findColumnByTaskId = (taskId: number): Column | undefined => {
        return columns.find((col) => col.tasks.some((t) => t.id === taskId));
    };

    const handleDragStart = (event: DragStartEvent) => {
        columnsSnapshotRef.current = columns;

        const dragType = event.active.data.current?.type;

        if (dragType === 'column') {
            const col = columns.find(
                (c) => c.id === event.active.data.current?.column?.id,
            );
            setActiveColumn(col ?? null);

            return;
        }

        const task = columns
            .flatMap((c) => c.tasks)
            .find((t) => t.id === event.active.id);
        setActiveTask(task ?? null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const dragType = active.data.current?.type;

        if (dragType === 'column') {
            const activeColId = active.data.current?.column?.id as number;
            const overColId =
                typeof over.id === 'string' && over.id.startsWith('column:')
                    ? Number(over.id.slice(7))
                    : typeof over.id === 'string' && over.id.startsWith('col:')
                      ? Number(over.id.slice(4))
                      : null;

            if (!overColId || activeColId === overColId) {
                return;
            }

            setColumns((prev) => {
                const activeIdx = prev.findIndex((c) => c.id === activeColId);
                const overIdx = prev.findIndex((c) => c.id === overColId);

                if (activeIdx < 0 || overIdx < 0) {
                    return prev;
                }

                const updated = [...prev];
                const [moved] = updated.splice(activeIdx, 1);
                updated.splice(overIdx, 0, moved);

                return updated;
            });

            return;
        }

        const activeTaskId = active.id as number;
        const overId = over.id;

        let toColId: number | undefined;

        if (typeof overId === 'string' && overId.startsWith('col:')) {
            toColId = Number(overId.slice(4));
        } else {
            const col = columns.find((c) =>
                c.tasks.some((t) => t.id === overId),
            );
            toColId = col?.id;
        }

        if (!toColId) {
            return;
        }

        setColumns((prev) => {
            const src = prev.find((c) =>
                c.tasks.some((t) => t.id === activeTaskId),
            );
            const tgt = prev.find((c) => c.id === toColId);

            if (!src || !tgt || src.id === tgt.id) {
                return prev;
            }

            const task = src.tasks.find((t) => t.id === activeTaskId);

            if (!task) {
                return prev;
            }

            let insertIndex: number;

            if (typeof overId === 'string' && overId.startsWith('col:')) {
                insertIndex = tgt.tasks.length;
            } else {
                insertIndex = tgt.tasks.findIndex((t) => t.id === overId);

                if (insertIndex < 0) {
                    insertIndex = tgt.tasks.length;
                }
            }

            return prev.map((col) => {
                if (col.id === src.id) {
                    return {
                        ...col,
                        tasks: col.tasks.filter((t) => t.id !== activeTaskId),
                    };
                }

                if (col.id === tgt.id) {
                    const updated = [...col.tasks];
                    updated.splice(insertIndex, 0, task);

                    return { ...col, tasks: updated };
                }

                return col;
            });
        });
    };

    interface TaskMovedEvent {
        task_id: number;
        from_column_id: number;
        to_column_id: number;
        position: number;
        status: string;
        task: TaskItem;
    }

    const handleTaskMoved = useCallback(
        (e: TaskMovedEvent) => {
            if (activeTask?.id === e.task_id) {
                return;
            }

            setColumns((prev) => {
                const srcIdx = prev.findIndex((c) =>
                    c.tasks.some((t) => t.id === e.task_id),
                );

                if (srcIdx < 0) {
                    return prev;
                }

                const tgtIdx = prev.findIndex((c) => c.id === e.to_column_id);

                if (tgtIdx < 0) {
                    return prev;
                }

                return prev.map((col, idx) => {
                    if (idx === srcIdx) {
                        return {
                            ...col,
                            tasks: col.tasks.filter((t) => t.id !== e.task_id),
                        };
                    }

                    if (idx === tgtIdx) {
                        const updated = [...col.tasks];

                        if (e.position < updated.length) {
                            updated.splice(e.position, 0, e.task);
                        } else {
                            updated.push(e.task);
                        }

                        return { ...col, tasks: updated };
                    }

                    return col;
                });
            });
        },
        [activeTask],
    );

    useEcho(`private-project.${project.id}`, '.task.moved', handleTaskMoved);

    interface ColumnsReorderedEvent {
        columns: Array<{ id: number; position: number }>;
    }

    const handleColumnsReordered = useCallback(
        (e: ColumnsReorderedEvent) => {
            if (activeColumn) {
                return;
            }

            setColumns((prev) => {
                const updated = [...prev];

                for (const { id, position } of e.columns) {
                    const idx = updated.findIndex((c) => c.id === id);

                    if (idx >= 0) {
                        const [col] = updated.splice(idx, 1);
                        updated.splice(position, 0, col);
                    }
                }

                return updated;
            });
        },
        [activeColumn],
    );

    useEcho(
        `private-project.${project.id}`,
        '.columns.reordered',
        handleColumnsReordered,
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);

        if (!over || !active) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        const dragType = active.data.current?.type;

        if (dragType === 'column') {
            const activeColId = active.data.current?.column?.id as number;
            const overColId =
                typeof over.id === 'string' && over.id.startsWith('column:')
                    ? Number(over.id.slice(7))
                    : typeof over.id === 'string' && over.id.startsWith('col:')
                      ? Number(over.id.slice(4))
                      : null;

            if (!overColId || activeColId === overColId) {
                setColumns(columnsSnapshotRef.current);

                return;
            }

            setColumns((prev) =>
                prev.map((col, idx) => ({ ...col, position: idx })),
            );

            router.post(
                reorderColumns({
                    workspace: workspace.slug,
                    project: project.slug,
                    board: board.id,
                }),
                {
                    columns: columns.map((col, idx) => ({
                        id: col.id,
                        position: idx,
                    })),
                },
                { preserveScroll: true },
            );

            return;
        }

        const taskId = active.id as number;
        const overId = over.id;
        const origCol = columnsSnapshotRef.current.find((c) =>
            c.tasks.some((t) => t.id === taskId),
        );

        if (!origCol) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        let toColumn: Column | undefined;

        if (typeof overId === 'string' && overId.startsWith('col:')) {
            toColumn = columns.find((c) => c.id === Number(overId.slice(4)));
        } else {
            toColumn = findColumnByTaskId(overId as number);
        }

        if (!toColumn) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        let position: number;

        if (origCol.id === toColumn.id) {
            if (typeof overId === 'string' && overId.startsWith('col:')) {
                position = toColumn.tasks.length;
            } else {
                position = toColumn.tasks.findIndex(
                    (t) => t.id === (overId as number),
                );
                position = Math.max(0, position);
            }

            setColumns((prev) =>
                prev.map((col) => {
                    if (col.id !== toColumn!.id) {
                        return col;
                    }

                    const tasks = col.tasks.filter((t) => t.id !== taskId);
                    const found = col.tasks.find((t) => t.id === taskId);

                    if (!found) {
                        return col;
                    }

                    tasks.splice(position, 0, found);

                    return { ...col, tasks };
                }),
            );
        } else {
            position = toColumn.tasks.findIndex((t) => t.id === taskId);
            position = Math.max(0, position);
        }

        router.post(
            moveTask({
                workspace: workspace.slug,
                project: project.slug,
                task: taskId,
            }),
            {
                board_column_id: toColumn.id,
                position,
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <>
            <Head title={`${project.name} — Board`} />

            <div
                className="flex h-full flex-1 flex-col overflow-hidden"
                suppressHydrationWarning
            >
                <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={projectShow({
                                workspace: workspace.slug,
                                project: project.slug,
                            })}
                            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <ArrowLeft className="size-4" />
                            <span>{project.name}</span>
                        </Link>

                        {allBoards.length > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Board:
                                </span>
                                <Select
                                    value={String(board.id)}
                                    onValueChange={(value) => {
                                        router.visit(
                                            projectBoard.url(
                                                {
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                },
                                                {
                                                    query: {
                                                        board_id: value,
                                                    },
                                                },
                                            ),
                                        );
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-44">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allBoards.map((b) => (
                                            <SelectItem
                                                key={b.id}
                                                value={String(b.id)}
                                            >
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <PresenceAvatars
                            users={presenceUsers}
                            currentUserId={
                                (
                                    usePage().props.auth as {
                                        user: { id: number };
                                    }
                                )?.user?.id
                            }
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setColumnManagerOpen(true)}
                        >
                            <Settings2 className="size-3.5" />
                            <span>Columns</span>
                        </Button>
                        <TaskCreateDialog
                            workspaceSlug={workspace.slug}
                            projectSlug={project.slug}
                            taskTypes={taskTypes}
                            priorities={priorities}
                            epics={epics}
                            sprints={sprints}
                            open={newTaskOpen}
                            onOpenChange={setNewTaskOpen}
                            onCreated={() => {
                                router.reload();
                            }}
                        />
                    </div>
                </div>

                <DndContext
                    id="board-dnd"
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={columns.map((c) => `column:${c.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
                            {columns.map((column) => (
                                <DroppableColumn
                                    key={column.id}
                                    column={column}
                                    activeTaskId={activeTask?.id ?? null}
                                >
                                    <SortableColumnHeader column={column}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="size-2.5 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        column.color ??
                                                        '#64748B',
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
                                        <GripVertical className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    </SortableColumnHeader>

                                    <SortableContext
                                        items={column.tasks.map((t) => t.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div
                                            className={cn(
                                                'flex min-h-[100px] flex-col gap-2 px-2 pb-2',
                                                column.tasks.length === 0 &&
                                                    'hidden',
                                            )}
                                        >
                                            {column.tasks.map((task) => (
                                                <SortableTask
                                                    key={task.id}
                                                    task={task}
                                                    isDragging={
                                                        activeTask?.id ===
                                                        task.id
                                                    }
                                                    onClick={() => {
                                                        setDrawerTaskId(
                                                            task.id,
                                                        );
                                                        setDrawerOpen(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DroppableColumn>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                        {activeTask && (
                            <div className="w-72 rotate-2 shadow-xl">
                                <TaskCard task={activeTask} isDragging />
                            </div>
                        )}
                        {activeColumn && (
                            <div className="w-72 rotate-2 rounded-lg bg-muted/50 shadow-xl">
                                <div className="flex items-center justify-between px-3 py-2.5">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="size-2.5 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    activeColumn.color ??
                                                    '#64748B',
                                            }}
                                        />
                                        <h3 className="text-sm font-semibold">
                                            {activeColumn.name}
                                        </h3>
                                        <Badge
                                            variant="secondary"
                                            className="px-1.5 py-0 text-[10px]"
                                        >
                                            {activeColumn.tasks.length}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>

                <BoardColumnManager
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    boardId={board.id}
                    columns={columns}
                    open={columnManagerOpen}
                    onOpenChange={setColumnManagerOpen}
                />

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
