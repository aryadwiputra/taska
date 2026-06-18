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
import { Head, router, usePage } from '@inertiajs/react';
import { useEcho, useEchoPresence } from '@laravel/echo-react';
import { ArrowDown, GripVertical, Settings2, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BoardColumnManager } from '@/components/board-column-manager';
import { FeatureGuide } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
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
    story_points: number | null;
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

interface Column {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
    wip_limit: number | null;
    task_count: number;
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
    swimlane_field: string;
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
    activeSprintId: number | null;
}

function getCsrfToken(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
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

function getSwimlaneKey(task: TaskItem, field: string): string {
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

function SortableTask({
    task,
    isDragging,
    onClick,
    isOver,
}: {
    task: TaskItem;
    isDragging?: boolean;
    onClick?: () => void;
    isOver?: boolean;
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
                {isOver && (
                    <div className="absolute -top-1 right-2 left-2 z-10 h-0.5 rounded-full bg-primary" />
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

function DroppableColumn({
    column,
    activeTaskId,
    isOverForReorder,
    children,
}: {
    column: Column;
    activeTaskId: number | null;
    isOverForReorder?: boolean;
    children: React.ReactNode;
}) {
    const { t } = useTranslation();
    const { setNodeRef, isOver } = useDroppable({ id: `col:${column.id}` });
    const isEmpty = column.tasks.length === 0;
    const hasActiveTask = activeTaskId !== null;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'group flex w-[calc(100vw-2rem)] shrink-0 snap-start flex-col rounded-xl border border-border bg-card/70 transition-[background-color,border-color,box-shadow] sm:w-72',
                isOver && hasActiveTask && !isEmpty && !isOverForReorder
                    ? 'border-dashed border-primary/50 bg-primary/[0.04]'
                    : isOver &&
                          hasActiveTask &&
                          !isEmpty &&
                          'border-primary/40 bg-primary/[0.04] shadow-soft',
                isOver &&
                    isEmpty &&
                    hasActiveTask &&
                    'border-dashed border-primary/50 bg-primary/5 shadow-soft',
                isOverForReorder &&
                    hasActiveTask &&
                    'border-dashed border-primary/50 bg-primary/[0.06] shadow-soft',
            )}
        >
            {children}
            {isOver && hasActiveTask && (
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

function SortableColumnHeader({
    column,
    isTarget,
    children,
}: {
    column: Column;
    isTarget?: boolean;
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
}: Props) {
    const { t } = useTranslation();
    const boardGuide = useBoardGuide(t);
    const [columns, setColumns] = useState(initialColumns);
    const columnsSnapshotRef = useRef(columns);
    const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
    const [activeColumn, setActiveColumn] = useState<Column | null>(null);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [columnManagerOpen, setColumnManagerOpen] = useState(false);
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [overTaskId, setOverTaskId] = useState<number | null>(null);
    const [overColumnId, setOverColumnId] = useState<number | null>(null);

    const [presenceUsers, setPresenceUsers] = useState<
        Array<{ id: number; name: string }>
    >([]);

    const presence = useEchoPresence(`board.${project.id}`, [], () => {}, []);

    useEffect(() => {
        const ch = presence.channel();

        if (!ch) {
            return;
        }

        const hereHandler = (users: Array<{ id: number; name: string }>) => {
            setPresenceUsers(users);
        };

        const joiningHandler = (user: { id: number; name: string }) => {
            setPresenceUsers((prev) => {
                if (prev.some((u) => u.id === user.id)) {
                    return prev;
                }

                return [...prev, user];
            });
        };

        const leavingHandler = (user: { id: number; name: string }) => {
            setPresenceUsers((prev) => prev.filter((u) => u.id !== user.id));
        };

        ch.here(hereHandler);
        ch.joining(joiningHandler);
        ch.leaving(leavingHandler);

        return () => {
            ch.here(() => {});
            ch.joining(() => {});
            ch.leaving(() => {});
        };
    }, [presence]);

    const shortcuts = useMemo(
        () => [
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
        ],
        [newTaskOpen, workspace.slug, project.slug],
    );

    useKeyboardShortcuts(shortcuts);

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

        if (typeof overId === 'string' && overId.startsWith('col:')) {
            setOverColumnId(Number(overId.slice(4)));
            setOverTaskId(null);
        } else {
            setOverTaskId(overId as number);
            setOverColumnId(null);
        }
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

    useEcho(`private-project.${project.id}`, '.task.moved', handleTaskMoved, [
        activeTask,
    ]);

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
        [activeColumn],
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);
        setActiveColumn(null);
        setOverTaskId(null);
        setOverColumnId(null);

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

            const snap = [...columnsSnapshotRef.current];
            const activeIdx = snap.findIndex((c) => c.id === activeColId);
            const overIdx = snap.findIndex((c) => c.id === overColId);

            if (activeIdx < 0 || overIdx < 0) {
                setColumns(columnsSnapshotRef.current);

                return;
            }

            const [moved] = snap.splice(activeIdx, 1);
            snap.splice(overIdx, 0, moved);

            const updatedColumns = snap.map((col, idx) => ({
                id: col.id,
                position: idx,
            }));

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
            ).catch(() => {
                setColumns(columnsSnapshotRef.current);
            });

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
            if (typeof overId === 'string' && overId.startsWith('col:')) {
                position = toColumn.tasks.length;
            } else {
                position = toColumn.tasks.findIndex(
                    (t) => t.id === (overId as number),
                );
                position = Math.max(0, position);
            }
        }

        fetch(
            moveTask({
                workspace: workspace.slug,
                project: project.slug,
                task: taskId,
            }).url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': getCsrfToken(),
                },
                body: JSON.stringify({
                    board_column_id: toColumn.id,
                    position,
                }),
            },
        ).catch(() => {
            setColumns(columnsSnapshotRef.current);
        });
    };

    return (
        <>
            <Head title={`${project.name} — Board`} />

            <div
                className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col overflow-hidden"
                suppressHydrationWarning
            >
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
                                <span>{t('board.columns')}</span>
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
                            <FeatureGuide content={boardGuide} />
                        </>
                    }
                />

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
                                    isOverForReorder={
                                        overColumnId === column.id
                                    }
                                >
                                    <SortableColumnHeader
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
                                            {board.swimlane_field !== 'none'
                                                ? (() => {
                                                      const grouped = new Map<
                                                          string,
                                                          TaskItem[]
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
                                                                          <SortableTask
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
                                                      <SortableTask
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
                                </DroppableColumn>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay dropAnimation={null}>
                        {activeTask && (
                            <div className="w-72 rotate-2 shadow-elevated">
                                <TaskCard task={activeTask} isDragging />
                            </div>
                        )}
                        {activeColumn && (
                            <div className="w-72 rotate-2 rounded-xl border border-border bg-card shadow-elevated">
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
                />
            </div>
        </>
    );
}
