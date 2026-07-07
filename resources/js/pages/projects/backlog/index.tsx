'use no memo';

import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Head, router, usePage } from '@inertiajs/react';
import { CalendarDays, GripVertical, Layers } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { FeatureGuide } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    canManageBoard,
    canManageSprints,
    toastNoAccess,
} from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';
import {
    indexJson as backlogIndexJson,
    reorder as backlogReorder,
    addToSprint as backlogAddToSprint,
} from '@/routes/projects/backlog';

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
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
}

interface SprintData {
    id: number;
    name: string;
    status: string;
    start_date: string | null;
    end_date: string | null;
    tasks_count: number;
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
    color: string | null;
}

function useBacklogGuide(t: (key: string) => string) {
    return {
        title: t('guide.backlog.title'),
        description: t('guide.backlog.description'),
        sections: [
            {
                title: t('guide.backlog.section_what'),
                content: t('guide.backlog.content_what'),
            },
            {
                title: t('guide.backlog.section_planning'),
                content: t('guide.backlog.content_planning'),
            },
        ],
        items: [
            {
                heading: t('guide.backlog.heading_features'),
                data: [
                    {
                        term: t('guide.backlog.drag_reorder'),
                        description: t('guide.backlog.drag_reorder_desc'),
                    },
                    {
                        term: t('guide.backlog.add_to_sprint'),
                        description: t('guide.backlog.add_to_sprint_desc'),
                    },
                    {
                        term: t('guide.backlog.sprint_overview'),
                        description: t('guide.backlog.sprint_overview_desc'),
                    },
                    {
                        term: t('guide.backlog.task_details'),
                        description: t('guide.backlog.task_details_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.backlog.tip_1'),
            t('guide.backlog.tip_2'),
            t('guide.backlog.tip_3'),
            t('guide.backlog.tip_4'),
        ],
    };
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    sprints: SprintData[];
    backlogTasks: TaskItem[];
    userProjectRole?: string | null;
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

function SortableTaskRow({
    task,
    sprints,
    onMoveToSprint,
    onClick,
    canMoveToSprint: canMove,
}: {
    task: TaskItem;
    sprints: SprintData[];
    onMoveToSprint: (taskId: number, sprintId: number) => void;
    onClick: () => void;
    canMoveToSprint: boolean;
}) {
    const { t } = useTranslation();
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-3 border-b border-border px-3 py-3 transition-colors last:border-0 hover:bg-muted/30',
                isDragging && 'z-10 bg-card shadow-soft',
            )}
        >
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="size-4" />
            </button>

            <div onClick={onClick} className="min-w-0 flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                        {task.code}
                    </span>
                    <span className="truncate text-sm font-medium">
                        {task.title}
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                        {task.board_column.name}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                        {task.task_type.name}
                    </Badge>
                    {task.story_points != null && (
                        <span className="inline-flex size-4 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                            {task.story_points}
                        </span>
                    )}
                    {task.priority && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <div
                                className={cn(
                                    'size-1.5 rounded-full',
                                    priorityColors[task.priority.key] ??
                                        'bg-muted-foreground',
                                )}
                            />
                            {task.priority.name}
                        </div>
                    )}
                    {task.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                            Due {formatDate(task.due_date)}
                        </span>
                    )}
                </div>
            </div>

            {canMove && (
                <Select
                    value=""
                    onValueChange={(value) => {
                        if (value !== 'none') {
                            onMoveToSprint(task.id, Number(value));
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder={t('sprint.add_task')} />
                    </SelectTrigger>
                    <SelectContent>
                        {sprints
                            .filter((s) => s.status !== 'completed')
                            .map((sprint) => (
                                <SelectItem
                                    key={sprint.id}
                                    value={String(sprint.id)}
                                >
                                    {sprint.name}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}

function PlainTaskRow({
    task,
    sprints,
    onMoveToSprint,
    onClick,
    canMoveToSprint: canMove,
}: {
    task: TaskItem;
    sprints: SprintData[];
    onMoveToSprint: (taskId: number, sprintId: number) => void;
    onClick: () => void;
    canMoveToSprint: boolean;
}) {
    const { t } = useTranslation();

    return (
        <div className="flex items-center gap-3 border-b border-border px-3 py-3 transition-colors last:border-0 hover:bg-muted/30">
            <div onClick={onClick} className="min-w-0 flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                        {task.code}
                    </span>
                    <span className="truncate text-sm font-medium">
                        {task.title}
                    </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                        {task.board_column.name}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                        {task.task_type.name}
                    </Badge>
                    {task.story_points != null && (
                        <span className="inline-flex size-4 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                            {task.story_points}
                        </span>
                    )}
                    {task.priority && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <div
                                className={cn(
                                    'size-1.5 rounded-full',
                                    priorityColors[task.priority.key] ??
                                        'bg-muted-foreground',
                                )}
                            />
                            {task.priority.name}
                        </div>
                    )}
                    {task.due_date && (
                        <span className="text-[10px] text-muted-foreground">
                            Due {formatDate(task.due_date)}
                        </span>
                    )}
                </div>
            </div>

            {canMove && (
                <Select
                    value=""
                    onValueChange={(value) => {
                        if (value !== 'none') {
                            onMoveToSprint(task.id, Number(value));
                        }
                    }}
                >
                    <SelectTrigger className="h-8 w-40 text-xs">
                        <SelectValue placeholder={t('sprint.add_task')} />
                    </SelectTrigger>
                    <SelectContent>
                        {sprints
                            .filter((s) => s.status !== 'completed')
                            .map((sprint) => (
                                <SelectItem
                                    key={sprint.id}
                                    value={String(sprint.id)}
                                >
                                    {sprint.name}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}

export default function BacklogIndex({
    workspace,
    project,
    sprints,
    backlogTasks: initialTasks,
    userProjectRole,
}: Props) {
    const { t } = useTranslation();
    const { props: pageProps } = usePage();
    const currentWorkspace = pageProps.currentWorkspace as {
        role?: string;
    } | null;
    const wsRole = currentWorkspace?.role;
    const canReorder = canManageBoard(wsRole, userProjectRole);
    const backlogGuide = useBacklogGuide(t);
    const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
    const [activeTask, setActiveTask] = useState<TaskItem | null>(null);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        }),
    );

    const fetchData = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        fetch(
            backlogIndexJson.url({
                workspace: workspace.slug,
                project: project.slug,
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            },
        )
            .then((r) => r.json())
            .then((data) => {
                setTasks(data.backlog_tasks ?? []);
            })
            .catch((e) => {
                if (e instanceof DOMException && e.name === 'AbortError') {
                    return;
                }

                console.error('Failed to fetch backlog tasks:', e);
            });

        return () => controller.abort();
    }, [workspace.slug, project.slug]);

    useEffect(() => {
        const cleanup = fetchData();

        return cleanup;
    }, [fetchData]);

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            const task = tasks.find((t) => t.id === event.active.id);
            setActiveTask(task ?? null);
        },
        [tasks],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setActiveTask(null);
            const { active, over } = event;

            if (!over || active.id === over.id) {
                return;
            }

            setTasks((prev) => {
                const oldIndex = prev.findIndex((t) => t.id === active.id);
                const newIndex = prev.findIndex((t) => t.id === over.id);

                if (oldIndex === -1 || newIndex === -1) {
                    return prev;
                }

                const reordered = arrayMove(prev, oldIndex, newIndex);

                fetch(
                    backlogReorder.url({
                        workspace: workspace.slug,
                        project: project.slug,
                    }),
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN':
                                (
                                    document.querySelector(
                                        'meta[name="csrf-token"]',
                                    ) as HTMLMetaElement | null
                                )?.content ?? '',
                        },
                        body: JSON.stringify({
                            task_ids: reordered.map((t) => t.id),
                        }),
                    },
                ).catch((e) => {
                    console.error('Failed to reorder backlog tasks:', e);
                });

                return reordered;
            });
        },
        [workspace.slug, project.slug],
    );

    const handleMoveToSprint = useCallback(
        (taskId: number, sprintId: number) => {
            fetch(
                backlogAddToSprint.url({
                    workspace: workspace.slug,
                    project: project.slug,
                    sprint: sprintId,
                }),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN':
                            (
                                document.querySelector(
                                    'meta[name="csrf-token"]',
                                ) as HTMLMetaElement | null
                            )?.content ?? '',
                    },
                    body: JSON.stringify({ task_id: taskId }),
                },
            ).then(() => {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
            });
        },
        [workspace.slug, project.slug],
    );

    return (
        <>
            <Head title={`${t('guide.backlog.title')} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('guide.backlog.title')}
                    description={
                        tasks.length === 1
                            ? t('backlog.description', { count: tasks.length })
                            : t('backlog.description_plural', {
                                  count: tasks.length,
                              })
                    }
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    actions={<FeatureGuide content={backlogGuide} />}
                />

                <div className="mx-auto w-full max-w-7xl">
                    {sprints.length > 0 && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold">
                                    Sprints
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-2">
                                    {sprints.map((sprint) => (
                                        <div
                                            key={sprint.id}
                                            className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        'text-[10px]',
                                                        sprint.status ===
                                                            'active' &&
                                                            'border-emerald-400 text-emerald-400',
                                                        sprint.status ===
                                                            'planned' &&
                                                            'border-blue-400 text-blue-400',
                                                        sprint.status ===
                                                            'completed' &&
                                                            'border-gray-400 text-gray-400',
                                                    )}
                                                >
                                                    {sprint.status}
                                                </Badge>
                                                <span className="text-sm font-medium">
                                                    {sprint.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {sprint.tasks_count} tasks
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <CalendarDays className="size-3" />
                                                <span>
                                                    {formatDate(
                                                        sprint.start_date,
                                                    )}{' '}
                                                    —{' '}
                                                    {formatDate(
                                                        sprint.end_date,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <Layers className="size-4" />
                                Backlog
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {tasks.length > 0 ? (
                                canReorder ? (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragStart={handleDragStart}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                                            <SortableContext
                                                items={tasks.map((t) => t.id)}
                                                strategy={
                                                    verticalListSortingStrategy
                                                }
                                            >
                                                {tasks.map((task) => (
                                                    <SortableTaskRow
                                                        key={task.id}
                                                        task={task}
                                                        sprints={sprints}
                                                        onMoveToSprint={
                                                            handleMoveToSprint
                                                        }
                                                        onClick={() => {
                                                            setDrawerTaskId(
                                                                task.id,
                                                            );
                                                            setDrawerOpen(true);
                                                        }}
                                                        canMoveToSprint={canManageSprints(
                                                            wsRole,
                                                        )}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </div>
                                        <DragOverlay>
                                            {activeTask && (
                                                <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 shadow-elevated">
                                                    <GripVertical className="size-4 text-muted-foreground" />
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {activeTask.code}
                                                    </span>
                                                    <span className="truncate text-sm font-medium">
                                                        {activeTask.title}
                                                    </span>
                                                </div>
                                            )}
                                        </DragOverlay>
                                    </DndContext>
                                ) : (
                                    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                                        {tasks.map((task) => (
                                            <PlainTaskRow
                                                key={task.id}
                                                task={task}
                                                sprints={sprints}
                                                onMoveToSprint={
                                                    handleMoveToSprint
                                                }
                                                onClick={() => {
                                                    setDrawerTaskId(task.id);
                                                    setDrawerOpen(true);
                                                }}
                                                canMoveToSprint={canManageSprints(
                                                    wsRole,
                                                )}
                                            />
                                        ))}
                                    </div>
                                )
                            ) : (
                                <EmptyState
                                    icon={Layers}
                                    title={t('backlog.empty_title')}
                                    description={t('backlog.empty_description')}
                                    className="bg-muted/30 py-12"
                                />
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <TaskDetailDrawer
                workspaceSlug={workspace.slug}
                projectSlug={project.slug}
                taskId={drawerTaskId}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onDelete={() => router.reload()}
            />
        </>
    );
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
