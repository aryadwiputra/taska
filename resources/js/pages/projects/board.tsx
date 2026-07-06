import {
    DndContext,
    DragOverlay,
    PointerSensor,
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
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Head, router, usePage } from '@inertiajs/react';
import { GripVertical, Settings2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BoardColumn as BoardColumnComponent } from '@/components/board/board-column';
import { BoardDragOverlay } from '@/components/board/board-drag-overlay';
import { BoardSortableTask } from '@/components/board/board-task-card';
import { BoardColumnHeader } from '@/components/board/column-header';
import { reorderBoardTasks } from '@/components/board/lib/api';
import { BoardColumnManager } from '@/components/board-column-manager';
import { FeatureGuide } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
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
import { useSocketEvent, useSocketPresence } from '@/hooks/use-socket';
import {
    boardCollisionDetection,
    buildColumnReorderPayload,
    buildTaskReorderPayload,
    calcSameColumnPosition,
    findColumnByTaskId as findColByTaskId,
    reorderAcrossColumns,
    reorderColumns as reorderCols,
    reorderSameColumnTasks,
} from '@/lib/board/reorder';
import {
    canCreateTask,
    canManageBoard,
    toastNoAccess,
} from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { board as projectBoard, show as projectShow } from '@/routes/projects';
import { reorder as reorderColumns } from '@/routes/projects/boards/columns';
import { reorder as reorderTasks } from '@/routes/projects/boards/tasks';
import type {
    BoardColumn,
    BoardData,
    BoardOption,
    BoardProjectData,
    BoardTaskItem,
    BoardWorkspace,
} from '@/types/board';

function useBoardGuide(t: (key: string) => string): GuideContent {
    return {
        title: t('guide.board.title'),
        description: t('guide.board.description'),
        sections: [
            {
                title: t('guide.board.section_how'),
                content: t('guide.board.content_how'),
            },
            {
                title: t('guide.board.section_realtime'),
                content: t('guide.board.content_realtime'),
            },
        ],
        items: [
            {
                heading: t('guide.board.heading_features'),
                data: [
                    {
                        term: t('guide.board.drag_drop'),
                        description: t('guide.board.drag_drop_desc'),
                    },
                    {
                        term: t('guide.board.column_management'),
                        description: t('guide.board.column_management_desc'),
                    },
                    {
                        term: t('guide.board.swimlanes'),
                        description: t('guide.board.swimlanes_desc'),
                    },
                    {
                        term: t('guide.board.multiple_boards'),
                        description: t('guide.board.multiple_boards_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.board.tip_1'),
            t('guide.board.tip_2'),
            t('guide.board.tip_3'),
            t('guide.board.tip_4'),
        ],
        tipsHeading: t('guide.board.tips_title'),
    };
}

interface Props {
    workspace: BoardWorkspace;
    project: BoardProjectData;
    board: BoardData;
    allBoards: BoardOption[];
    columns: BoardColumn[];
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
    activeSprintId: number | null;
    userProjectRole?: string | null;
}

function getCsrfToken(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
}

function parseTaskId(id: string | number): number | null {
    if (typeof id === 'number') {
        return id;
    }

    if (id.startsWith('task:')) {
        return Number(id.slice(5));
    }

    return null;
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
    userIds,
    currentUserId,
}: {
    userIds: number[];
    currentUserId: number;
}) {
    const others = userIds.filter((id) => id !== currentUserId);
    const visible = others.slice(0, 5);
    const remainder = others.length - visible.length;

    if (others.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-1.5">
            <Users className="size-3.5 text-muted-foreground" />
            <div className="flex -space-x-1.5">
                {visible.map((id) => (
                    <div
                        key={id}
                        className={cn(
                            'flex size-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-medium text-white',
                            getAvatarColor(id),
                        )}
                    />
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

function getSwimlaneKey(task: BoardTaskItem, field: string): string {
    switch (field) {
        case 'assignee':
            return task.assignees.length > 0
                ? task.assignees[0].name
                : 'Unassigned';
        case 'priority':
            return task.priority?.name ?? 'No priority';
        case 'epic':
            return task.epics?.[0]?.name ?? 'No epic';
        case 'sprint':
            return task.sprints?.[0]?.name ?? 'No sprint';
        default:
            return '';
    }
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
    activeSprintId,
    userProjectRole,
}: Props) {
    const { t } = useTranslation();
    const { props: pageProps } = usePage();
    const currentWorkspace = pageProps.currentWorkspace as {
        role?: string;
    } | null;
    const wsRole = currentWorkspace?.role;
    const boardGuide = useBoardGuide(t);
    const [columns, setColumns] = useState(initialColumns);
    const columnsSnapshotRef = useRef(columns);
    const [activeTask, setActiveTask] = useState<BoardTaskItem | null>(null);
    const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [columnManagerOpen, setColumnManagerOpen] = useState(false);
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [overTaskId, setOverTaskId] = useState<number | null>(null);
    const [overColumnId, setOverColumnId] = useState<number | null>(null);
    const [closestEdge, setClosestEdge] = useState<'top' | 'bottom' | null>(
        null,
    );
    const pointerYRef = useRef(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const serverColumnsRef = useRef(initialColumns);

    useEffect(() => {
        if (serverColumnsRef.current === initialColumns) {
            return;
        }

        serverColumnsRef.current = initialColumns;

        if (!activeTask && !activeColumn) {
            // Sync local columns state with server data after Inertia re-visit.
            // useState initializer runs only once, so this effect picks up
            // new columns from server after drawer PATCH redirect.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setColumns(initialColumns);
        }
    }, [initialColumns, activeTask, activeColumn]);

    const showError = (msg: string) => {
        setErrorMessage(msg);

        if (errorTimerRef.current) {
            clearTimeout(errorTimerRef.current);
        }

        errorTimerRef.current = setTimeout(() => setErrorMessage(null), 5000);
    };

    const { onlineUsers } = useSocketPresence(`board.${project.id}`);

    const shortcuts = useMemo(
        () => [
            {
                key: 'n',
                handler: () => {
                    if (!canCreateTask(wsRole)) {
                        toastNoAccess();

                        return;
                    }

                    setNewTaskOpen(true);
                },
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
        ],
        [newTaskOpen, workspace.slug, project.slug],
    );

    useKeyboardShortcuts(shortcuts);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

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

        const taskId = parseTaskId(event.active.id);
        const task = columns
            .flatMap((c) => c.tasks)
            .find((t) => t.id === taskId);
        setActiveTask(task ?? null);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            setOverTaskId(null);
            setOverColumnId(null);

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

            if (overColId && overColId !== activeColId) {
                setOverColumnId(overColId);
                setOverTaskId(null);
            }

            return;
        }

        const overId = over.id;

        if (
            typeof overId === 'string' &&
            (overId.startsWith('col:') || overId.startsWith('column:'))
        ) {
            const numId = overId.startsWith('col:')
                ? Number(overId.slice(4))
                : Number(overId.slice(7));

            setOverColumnId(numId);
            setOverTaskId(null);
            setClosestEdge(null);
        } else {
            const taskId = parseTaskId(overId);

            setOverTaskId(taskId);
            setOverColumnId(null);

            const overRect = over.rect;
            const pointerY = pointerYRef.current;

            if (overRect && pointerY > 0) {
                setClosestEdge(
                    pointerY < overRect.top + overRect.height / 2
                        ? 'top'
                        : 'bottom',
                );
            }
        }
    };

    interface TaskMovedEvent {
        taskId: number;
        task: BoardTaskItem;
        fromColumnId: number;
        toColumnId: number;
        position: number;
        status: string;
    }

    const handleTaskMoved = useCallback(
        (e: TaskMovedEvent) => {
            if (activeTask?.id === e.taskId) {
                return;
            }

            setColumns((prev) => {
                const srcIdx = prev.findIndex((c) =>
                    c.tasks.some((t) => t.id === e.taskId),
                );

                if (srcIdx < 0) {
                    return prev;
                }

                const tgtIdx = prev.findIndex((c) => c.id === e.toColumnId);

                if (tgtIdx < 0) {
                    return prev;
                }

                return prev.map((col, idx) => {
                    if (idx === srcIdx) {
                        return {
                            ...col,
                            tasks: col.tasks.filter((t) => t.id !== e.taskId),
                        };
                    }

                    if (idx === tgtIdx) {
                        const updated = [...col.tasks];
                        const insertIdx = updated.findIndex(
                            (t) => (t.position ?? 0) > e.position,
                        );

                        if (insertIdx === -1) {
                            updated.push(e.task);
                        } else {
                            updated.splice(insertIdx, 0, e.task);
                        }

                        return { ...col, tasks: updated };
                    }

                    return col;
                });
            });
        },
        [activeTask],
    );

    useSocketEvent(`project.${project.id}`, 'task.moved', handleTaskMoved, [
        activeTask,
    ]);

    interface TaskCreatedEvent {
        task: BoardTaskItem;
        column_id: number;
    }

    const handleTaskCreated = useCallback((e: TaskCreatedEvent) => {
        setColumns((prev) =>
            prev.map((col) => {
                if (col.id !== e.column_id) {
                    return col;
                }

                const tasks = [...col.tasks, e.task];
                tasks.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

                return { ...col, tasks };
            }),
        );
    }, []);

    useSocketEvent(
        `project.${project.id}`,
        'task.created',
        handleTaskCreated,
        [],
    );

    interface TaskFieldUpdatedEvent {
        taskId: number;
        changes: Record<string, unknown>;
    }

    const handleTaskFieldUpdated = useCallback((e: TaskFieldUpdatedEvent) => {
        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.map((t) =>
                    t.id === e.taskId ? { ...t, ...e.changes } : t,
                ),
            })),
        );
    }, []);

    useSocketEvent(
        `project.${project.id}`,
        'task.field.updated',
        handleTaskFieldUpdated,
        [],
    );

    interface TaskDeletedEvent {
        taskId: number;
    }

    const handleTaskDeleted = useCallback((e: TaskDeletedEvent) => {
        setColumns((prev) =>
            prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((t) => t.id !== e.taskId),
            })),
        );
    }, []);

    useSocketEvent(
        `project.${project.id}`,
        'task.deleted',
        handleTaskDeleted,
        [],
    );

    interface TasksReorderedEvent {
        columns: BoardColumn[];
    }

    const handleTasksReordered = useCallback(
        (e: TasksReorderedEvent) => {
            if (activeTask) {
                return;
            }

            setColumns(e.columns);
        },
        [activeTask],
    );

    useSocketEvent(
        `project.${project.id}`,
        'tasks.reordered',
        handleTasksReordered,
        [activeTask],
    );

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

    useSocketEvent(
        `project.${project.id}`,
        'columns.reordered',
        handleColumnsReordered,
        [activeColumn],
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);
        setOverTaskId(null);
        setOverColumnId(null);
        setClosestEdge(null);

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

            const snap = reorderCols(
                columnsSnapshotRef.current,
                activeColId,
                overColId,
            );

            const updatedColumns = buildColumnReorderPayload(snap);

            setColumns(snap.map((col, idx) => ({ ...col, position: idx })));

            fetch(
                reorderColumns({
                    workspace: workspace.slug,
                    project: project.slug,
                    board: board.id,
                }).url,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': getCsrfToken(),
                    },
                    body: JSON.stringify({ columns: updatedColumns }),
                },
            )
                .then((res) => {
                    if (!res.ok) {
                        throw new Error('Request failed');
                    }
                })
                .catch(() => {
                    setColumns(columnsSnapshotRef.current);
                    showError('Failed to reorder columns. Please try again.');
                });

            return;
        }

        const taskId = parseTaskId(active.id);
        const overId = over.id;

        if (!taskId) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        const origCol = columnsSnapshotRef.current.find((c) =>
            c.tasks.some((t) => t.id === taskId),
        );

        if (!origCol) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        let toColumn: BoardColumn | undefined;
        const overTaskId = parseTaskId(overId);

        if (typeof overId === 'string' && overId.startsWith('col:')) {
            toColumn = columnsSnapshotRef.current.find(
                (c) => c.id === Number(overId.slice(4)),
            );
        } else if (overTaskId) {
            toColumn = findColByTaskId(columnsSnapshotRef.current, overTaskId);
        }

        if (!toColumn) {
            setColumns(columnsSnapshotRef.current);

            return;
        }

        let position: number;
        let nextColumns: BoardColumn[];

        if (origCol.id === toColumn.id) {
            const targetId = overTaskId ?? overId;

            position = calcSameColumnPosition(
                toColumn,
                taskId,
                targetId,
                closestEdge,
            );

            nextColumns = columnsSnapshotRef.current.map((col) =>
                col.id === toColumn.id
                    ? reorderSameColumnTasks(col, taskId, targetId, closestEdge)
                    : col,
            );
        } else {
            if (typeof overId === 'string' && overId.startsWith('col:')) {
                position = toColumn.tasks.length;
            } else if (overTaskId) {
                const overIdx = toColumn.tasks.findIndex(
                    (t) => t.id === overTaskId,
                );
                position = closestEdge === 'bottom' ? overIdx + 1 : overIdx;
                position = Math.max(0, position);
            } else {
                setColumns(columnsSnapshotRef.current);

                return;
            }

            nextColumns = reorderAcrossColumns(
                columnsSnapshotRef.current,
                taskId,
                origCol.id,
                toColumn.id,
                position,
            );
        }

        const previousSignature = columnsSnapshotRef.current
            .map(
                (column) =>
                    `${column.id}:${column.tasks.map((task) => task.id).join(',')}`,
            )
            .join('|');
        const nextSignature = nextColumns
            .map(
                (column) =>
                    `${column.id}:${column.tasks.map((task) => task.id).join(',')}`,
            )
            .join('|');

        if (previousSignature === nextSignature) {
            return;
        }

        setColumns(nextColumns);

        reorderBoardTasks(
            reorderTasks({
                workspace: workspace.slug,
                project: project.slug,
                board: board.id,
            }).url,
            buildTaskReorderPayload(nextColumns),
        )
            .then((serverColumns) => {
                setColumns(serverColumns);
            })
            .catch((error: Error) => {
                setColumns(columnsSnapshotRef.current);
                showError(
                    error.message || 'Failed to move task. Please try again.',
                );
            });
    };

    const handleDragCancel = () => {
        setColumns(columnsSnapshotRef.current);
        setActiveTask(null);
        setActiveColumn(null);
        setOverTaskId(null);
        setOverColumnId(null);
        setClosestEdge(null);
    };

    return (
        <>
            <Head title={t('board.board_title', { name: project.name })} />

            <div
                className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col overflow-hidden"
                suppressHydrationWarning
                onPointerMove={(e) => {
                    pointerYRef.current = e.clientY;
                }}
            >
                {errorMessage && (
                    <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
                        <span>{errorMessage}</span>
                        <button
                            type="button"
                            className="ml-auto text-destructive/70 hover:text-destructive"
                            onClick={() => setErrorMessage(null)}
                        >
                            x
                        </button>
                    </div>
                )}
                <PageHeader
                    className="mb-4 shrink-0"
                    title={t('board.board')}
                    description={project.name}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    actions={
                        <>
                            {allBoards.length > 1 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t('board.board_label')}
                                    </span>
                                    <Select
                                        value={String(board.id)}
                                        onValueChange={(value) => {
                                            const url = projectBoard.url(
                                                {
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                },
                                                {
                                                    query: {
                                                        board_id: value,
                                                        ...(activeSprintId
                                                            ? {
                                                                  sprint_id:
                                                                      activeSprintId,
                                                              }
                                                            : {}),
                                                    },
                                                },
                                            );
                                            router.visit(url);
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

                            {sprints.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {t('board.sprint_label')}
                                    </span>
                                    <Select
                                        value={
                                            activeSprintId
                                                ? String(activeSprintId)
                                                : 'all'
                                        }
                                        onValueChange={(value) => {
                                            const query: Record<
                                                string,
                                                string
                                            > = {};

                                            if (value !== 'all') {
                                                query.sprint_id = value;
                                            }

                                            if (board.id) {
                                                query.board_id = String(
                                                    board.id,
                                                );
                                            }

                                            router.visit(
                                                projectBoard.url(
                                                    {
                                                        workspace:
                                                            workspace.slug,
                                                        project: project.slug,
                                                    },
                                                    { query },
                                                ),
                                            );
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-44">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                {t('board.all_sprints')}
                                            </SelectItem>
                                            {sprints.map((s) => (
                                                <SelectItem
                                                    key={s.id}
                                                    value={String(s.id)}
                                                >
                                                    {s.name}
                                                    {s.status === 'active' && (
                                                        <Badge
                                                            variant="default"
                                                            className="ml-2 px-1 py-0 text-[10px]"
                                                        >
                                                            {t('sprint.active')}
                                                        </Badge>
                                                    )}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <PresenceAvatars
                                userIds={onlineUsers}
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
                                onClick={() => {
                                    if (
                                        !canManageBoard(wsRole, userProjectRole)
                                    ) {
                                        toastNoAccess();

                                        return;
                                    }

                                    setColumnManagerOpen(true);
                                }}
                            >
                                <Settings2 className="size-3.5" />
                                <span>{t('board.columns')}</span>
                            </Button>
                            {canCreateTask(wsRole) && (
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
                                    setNewTaskOpen(false);
                                }}
                            />
                            )}
                            <FeatureGuide content={boardGuide} />
                        </>
                    }
                />

                <DndContext
                    id="board-dnd"
                    sensors={sensors}
                    collisionDetection={boardCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                >
                    <SortableContext
                        items={columns.map((c) => `column:${c.id}`)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
                            {columns.map((column) => (
                                <BoardColumnComponent
                                    key={column.id}
                                    column={column}
                                    activeTaskId={activeTask?.id ?? null}
                                    isOverForReorder={
                                        overColumnId === column.id
                                    }
                                >
                                    <BoardColumnHeader
                                        column={column}
                                        isTarget={
                                            overColumnId === column.id &&
                                            activeColumn !== null
                                        }
                                    >
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
                                                variant={
                                                    column.wip_limit !== null &&
                                                    column.tasks.length >
                                                        column.wip_limit
                                                        ? 'destructive'
                                                        : 'secondary'
                                                }
                                                className="px-1.5 py-0 text-[10px]"
                                            >
                                                {column.tasks.length}
                                                {column.wip_limit !== null &&
                                                    `/${column.wip_limit}`}
                                            </Badge>
                                        </div>
                                        <GripVertical className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    </BoardColumnHeader>

                                    <SortableContext
                                        items={column.tasks.map(
                                            (t) => `task:${t.id}`,
                                        )}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div
                                            className={cn(
                                                'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2',
                                                column.tasks.length === 0 &&
                                                    'hidden',
                                            )}
                                        >
                                            {board.swimlane_field !== 'none'
                                                ? (() => {
                                                      const grouped = new Map<
                                                          string,
                                                          BoardTaskItem[]
                                                      >();

                                                      for (const task of column.tasks) {
                                                          const key =
                                                              getSwimlaneKey(
                                                                  task,
                                                                  board.swimlane_field,
                                                              );
                                                          const arr =
                                                              grouped.get(
                                                                  key,
                                                              ) ?? [];
                                                          arr.push(task);
                                                          grouped.set(key, arr);
                                                      }

                                                      return Array.from(
                                                          grouped.entries(),
                                                      ).map(
                                                          ([group, tasks]) => (
                                                              <div
                                                                  key={group}
                                                                  className="flex flex-col gap-1"
                                                              >
                                                                  <div className="px-1 py-1 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                                                                      {group}
                                                                  </div>
                                                                  {tasks.map(
                                                                      (
                                                                          task,
                                                                      ) => (
                                                                          <BoardSortableTask
                                                                              key={
                                                                                  task.id
                                                                              }
                                                                              task={
                                                                                  task
                                                                              }
                                                                              isDragging={
                                                                                  activeTask?.id ===
                                                                                  task.id
                                                                              }
                                                                              isOver={
                                                                                  overTaskId ===
                                                                                  task.id
                                                                              }
                                                                              edge={
                                                                                  overTaskId ===
                                                                                  task.id
                                                                                      ? closestEdge
                                                                                      : null
                                                                              }
                                                                              onClick={() => {
                                                                                  setDrawerTaskId(
                                                                                      task.id,
                                                                                  );
                                                                                  setDrawerOpen(
                                                                                      true,
                                                                                  );
                                                                              }}
                                                                          />
                                                                      ),
                                                                  )}
                                                              </div>
                                                          ),
                                                      );
                                                  })()
                                                : column.tasks.map((task) => (
                                                      <BoardSortableTask
                                                          key={task.id}
                                                          task={task}
                                                          isDragging={
                                                              activeTask?.id ===
                                                              task.id
                                                          }
                                                          isOver={
                                                              overTaskId ===
                                                              task.id
                                                          }
                                                          edge={
                                                              overTaskId ===
                                                              task.id
                                                                  ? closestEdge
                                                                  : null
                                                          }
                                                          onClick={() => {
                                                              setDrawerTaskId(
                                                                  task.id,
                                                              );
                                                              setDrawerOpen(
                                                                  true,
                                                              );
                                                          }}
                                                      />
                                                  ))}
                                        </div>
                                    </SortableContext>
                                </BoardColumnComponent>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                        <BoardDragOverlay
                            task={activeTask}
                            column={activeColumn}
                        />
                    </DragOverlay>
                </DndContext>

                <BoardColumnManager
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    boardId={board.id}
                    boardSwimlaneField={board.swimlane_field}
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
                    userProjectRole={userProjectRole}
                />
            </div>
        </>
    );
}
