import { Head, Link, router } from '@inertiajs/react';
import { CalendarDays, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
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
import { cn } from '@/lib/utils';
import {
    show as projectShow,
    settings as projectSettings,
} from '@/routes/projects';
import {
    addTask as epicAddTask,
    removeTask as epicRemoveTask,
} from '@/routes/projects/epics';

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

interface EpicData {
    id: number;
    name: string;
    summary: string | null;
    color: string | null;
    start_date: string | null;
    due_date: string | null;
    status: string;
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

interface Props {
    workspace: Workspace;
    project: ProjectData;
    epic: EpicData;
    epicTasks: TaskData[];
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

export default function EpicShow({
    workspace,
    project,
    epic,
    epicTasks,
    availableTasks,
}: Props) {
    const { t, i18n } = useTranslation();
    const [addTaskId, setAddTaskId] = useState<string>('none');

    const formatDate = (date: string | null): string => {
        if (!date) {
            return t('common.not_set');
        }

        return new Date(date).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const completedTasks = epicTasks.filter((t) => t.completed_at).length;
    const totalTasks = epicTasks.length;
    const percent =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const handleRemoveTask = (taskId: number) => {
        if (!confirm(t('epic.remove_task_confirm'))) {
            return;
        }

        router.delete(
            epicRemoveTask({
                workspace: workspace.slug,
                project: project.slug,
                epic: epic.id,
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
            epicAddTask({
                workspace: workspace.slug,
                project: project.slug,
                epic: epic.id,
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
                title={t('epic.show_title', {
                    epicName: epic.name,
                    projectName: project.name,
                })}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={epic.name}
                    description={epic.summary}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    leading={
                        <div
                            className="flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                            style={{
                                backgroundColor: epic.color ?? '#64748B',
                            }}
                        >
                            {epic.name.charAt(0).toUpperCase()}
                        </div>
                    }
                    badge={
                        <>
                            <Badge variant="outline">{epic.status}</Badge>
                            <Badge variant="secondary">
                                {t('epic.tasks_count', {
                                    completed: completedTasks,
                                    total: totalTasks,
                                })}
                            </Badge>
                        </>
                    }
                    actions={
                        <Link
                            href={projectSettings({
                                workspace: workspace.slug,
                                project: project.slug,
                            })}
                        >
                            <Button variant="outline" size="sm">
                                {t('epic.edit_epic')}
                            </Button>
                        </Link>
                    }
                />

                <div className="mx-auto w-full max-w-3xl">
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
                                {formatDate(epic.start_date)} —{' '}
                                {formatDate(epic.due_date)}
                            </span>
                        </div>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <CardTitle>{t('epic.tasks')}</CardTitle>
                            {availableTasks.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={addTaskId}
                                        onValueChange={setAddTaskId}
                                    >
                                        <SelectTrigger className="h-8 w-56 text-xs">
                                            <SelectValue
                                                placeholder={t(
                                                    'epic.add_existing_task_placeholder',
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                {t(
                                                    'epic.add_existing_task_placeholder',
                                                )}
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
                            {epicTasks.length > 0 ? (
                                <div className="flex flex-col rounded-md border">
                                    {epicTasks.map((task) => (
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
                                                            {t(
                                                                'epic.due_date_prefix',
                                                            )}{' '}
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
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
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Check}
                                    title={t('epic.no_tasks_title')}
                                    description={t('epic.no_tasks_description')}
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
