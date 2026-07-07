import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    Play,
    Plus,
    SquareChartGantt,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { FeatureGuide } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { canManageSprints } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import {
    show as projectShow,
    board as projectBoard,
    settings as projectSettings,
} from '@/routes/projects';
import {
    addTask as sprintAddTask,
    close as sprintClose,
    removeTask as sprintRemoveTask,
    report as sprintReport,
    start as sprintStart,
} from '@/routes/projects/sprints';
import type { WorkspaceRole } from '@/types/permissions';

function useSprintGuide(t: (key: string) => string): GuideContent {
    return {
        title: t('guide.sprint.title'),
        description: t('guide.sprint.description'),
        sections: [
            {
                title: t('guide.sprint.section_what'),
                content: t('guide.sprint.content_what'),
            },
            {
                title: t('guide.sprint.section_lifecycle'),
                content: t('guide.sprint.content_lifecycle'),
            },
        ],
        items: [
            {
                heading: t('guide.sprint.heading_features'),
                data: [
                    {
                        term: t('guide.sprint.start_sprint'),
                        description: t('guide.sprint.start_sprint_desc'),
                    },
                    {
                        term: t('guide.sprint.close_sprint'),
                        description: t('guide.sprint.close_sprint_desc'),
                    },
                    {
                        term: t('guide.sprint.add_task'),
                        description: t('guide.sprint.add_task_desc'),
                    },
                    {
                        term: t('guide.sprint.remove_task'),
                        description: t('guide.sprint.remove_task_desc'),
                    },
                    {
                        term: t('guide.sprint.view_report'),
                        description: t('guide.sprint.view_report_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.sprint.tip_1'),
            t('guide.sprint.tip_2'),
            t('guide.sprint.tip_3'),
            t('guide.sprint.tip_4'),
        ],
        tipsHeading: t('guide.sprint.tips_title'),
    };
}

interface UserRef {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskData {
    id: number;
    task_number: number;
    code: string;
    title: string;
    status: string;
    due_date: string | null;
    completed_at: string | null;
    story_points: number | null;
    priority: {
        id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    } | null;
    task_type: { id: number; name: string; key: string; color: string | null };
    assignees: UserRef[];
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
    goal: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    committed_points: number | null;
    completed_at: string | null;
    tasks_count: number;
    completed_tasks_count: number;
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

interface Props {
    workspace: Workspace;
    project: ProjectData;
    sprint: SprintData;
    sprintTasks: TaskData[];
    availableTasks: Array<{ id: number; code: string; title: string }>;
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

const sprintStatusColor: Record<string, string> = {
    planned: 'border-blue-400 text-blue-400 dark:text-blue-300',
    active: 'border-emerald-400 text-emerald-400 dark:text-emerald-300',
    completed: 'border-gray-400 text-gray-400 dark:text-gray-300',
    cancelled: 'border-red-400 text-red-400 dark:text-red-300',
};

export default function SprintShow({
    workspace,
    project,
    sprint,
    sprintTasks,
    availableTasks,
}: Props) {
    const { t } = useTranslation();
    const sprintGuide = useSprintGuide(t);
    const { props } = usePage();
    const wsRole = (props.currentWorkspace as { role?: string } | null)?.role as WorkspaceRole | undefined;
    const canManage = canManageSprints(wsRole);
    const [addTaskId, setAddTaskId] = useState<string>('none');
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { completed_tasks_count: completedTasks, tasks_count: totalTasks } =
        sprint;
    const percent =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const completedPoints = sprintTasks
        .filter((t) => t.completed_at !== null)
        .reduce((sum, t) => sum + (t.story_points ?? 0), 0);
    const totalPoints = sprintTasks.reduce(
        (sum, t) => sum + (t.story_points ?? 0),
        0,
    );

    const handleRemoveTask = (taskId: number) => {
        if (!confirm(t('sprint_page.remove_task_confirm'))) {
            return;
        }

        router.delete(
            sprintRemoveTask({
                workspace: workspace.slug,
                project: project.slug,
                sprint: sprint.id,
            }),
            {
                data: { task_id: taskId },
                preserveScroll: true,
            },
        );
    };

    const handleAddTask = () => {
        if (addTaskId === 'none') {
            return;
        }

        router.post(
            sprintAddTask({
                workspace: workspace.slug,
                project: project.slug,
                sprint: sprint.id,
            }),
            { task_id: Number(addTaskId) },
            {
                preserveScroll: true,
                onSuccess: () => setAddTaskId('none'),
            },
        );
    };

    return (
        <>
            <Head
                title={t('sprint.show_title', {
                    sprint: sprint.name,
                    project: project.name,
                })}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={sprint.name}
                    description={sprint.goal}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    badge={
                        <>
                            <Badge
                                variant="outline"
                                className={cn(
                                    sprintStatusColor[sprint.status] ?? '',
                                )}
                            >
                                {sprint.status}
                            </Badge>
                            <Badge variant="secondary">
                                {completedTasks}/{totalTasks} tasks
                            </Badge>
                            {totalPoints > 0 && (
                                <Badge variant="secondary">
                                    {completedPoints}/{totalPoints} pts
                                </Badge>
                            )}
                        </>
                    }
                    actions={
                        <>
                            <FeatureGuide content={sprintGuide} />
                            {canManage && sprint.status === 'planned' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                        router.post(
                                            sprintStart({
                                                workspace: workspace.slug,
                                                project: project.slug,
                                                sprint: sprint.id,
                                            }),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                >
                                    <Play className="size-3" />
                                    {t('sprint_page.start_sprint')}
                                </Button>
                            )}
                            {canManage && sprint.status === 'active' && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                        if (
                                            !confirm(
                                                t(
                                                    'sprint_page.complete_confirm',
                                                ),
                                            )
                                        ) {
                                            return;
                                        }

                                        router.post(
                                            sprintClose({
                                                workspace: workspace.slug,
                                                project: project.slug,
                                                sprint: sprint.id,
                                            }),
                                            {},
                                            { preserveScroll: true },
                                        );
                                    }}
                                >
                                    <Check className="size-3" />
                                    {t('sprint_page.complete_sprint')}
                                </Button>
                            )}
                            {sprint.status === 'completed' && (
                                <Link
                                    href={sprintReport({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                        sprint: sprint.id,
                                    })}
                                >
                                    <Button variant="outline" size="sm">
                                        <SquareChartGantt className="size-3" />
                                        {t('sprint_page.view_report')}
                                    </Button>
                                </Link>
                            )}
                            <Link
                                href={projectBoard.url(
                                    {
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    },
                                    {
                                        query: { sprint_id: sprint.id },
                                    },
                                )}
                            >
                                <Button variant="outline" size="sm">
                                    {t('sprint_page.open_board')}
                                </Button>
                            </Link>
                            {canManage && (
                            <Link
                                href={projectSettings({
                                    workspace: workspace.slug,
                                    project: project.slug,
                                })}
                            >
                                <Button variant="outline" size="sm">
                                    {t('sprint_page.edit_sprint')}
                                </Button>
                            </Link>
                            )}
                        </>
                    }
                />

                <div className="mx-auto w-full max-w-7xl">
                    <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    <div className="mb-6 flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <CalendarDays className="size-4" />
                            <span>
                                {formatDate(sprint.start_date)} —{' '}
                                {formatDate(sprint.end_date)}
                            </span>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle>
                                {t('sprint_page.tasks_card_title')}
                            </CardTitle>
                            {canManage && availableTasks.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={addTaskId}
                                        onValueChange={setAddTaskId}
                                    >
                                        <SelectTrigger className="h-8 w-56 text-xs">
                                            <SelectValue
                                                placeholder={t(
                                                    'sprint_page.add_existing_task',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                Add existing task...
                                            </SelectItem>
                                            {availableTasks.map((task) => (
                                                <SelectItem
                                                    key={task.id}
                                                    value={String(task.id)}
                                                >
                                                    {task.code}: {task.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={addTaskId === 'none'}
                                        onClick={handleAddTask}
                                    >
                                        <Plus className="size-3" />
                                        <span>{t('common.add')}</span>
                                    </Button>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            {sprintTasks.length > 0 ? (
                                <div className="flex flex-col rounded-md border">
                                    {sprintTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-3 border-b px-3 py-3 transition-colors last:border-0 hover:bg-muted/40"
                                        >
                                            <div
                                                onClick={() => {
                                                    setDrawerTaskId(task.id);
                                                    setDrawerOpen(true);
                                                }}
                                                className="min-w-0 flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {task.code}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'truncate text-sm font-medium',
                                                            task.completed_at &&
                                                                'text-muted-foreground line-through',
                                                        )}
                                                    >
                                                        {task.title}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px]"
                                                    >
                                                        {task.board_column.name}
                                                    </Badge>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-[10px]"
                                                    >
                                                        {task.task_type.name}
                                                    </Badge>
                                                    {task.story_points !=
                                                        null && (
                                                        <span className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                                            {task.story_points}
                                                        </span>
                                                    )}
                                                    {task.priority && (
                                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                            <div
                                                                className={cn(
                                                                    'size-1.5 rounded-full',
                                                                    priorityColors[
                                                                        task
                                                                            .priority
                                                                            .key
                                                                    ] ??
                                                                        'bg-muted-foreground',
                                                                )}
                                                            />
                                                            {task.priority.name}
                                                        </div>
                                                    )}
                                                    {task.assignees.length >
                                                        0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {task.assignees
                                                                .map(
                                                                    (a) =>
                                                                        a.name,
                                                                )
                                                                .join(', ')}
                                                        </span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Due{' '}
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {canManage && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    handleRemoveTask(task.id)
                                                }
                                            >
                                                <X className="size-4" />
                                            </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Check}
                                    title={t('sprint_page.no_tasks')}
                                    description={t(
                                        'sprint_page.no_tasks_description',
                                    )}
                                    className="border-0 bg-transparent py-12"
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
        return 'Not set';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
