import { Head, Link, router } from '@inertiajs/react';
import { Hash } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { settings as projectSettings } from '@/routes/projects';

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

interface LabelData {
    id: number;
    name: string;
    slug: string;
    color: string | null;
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
    label: LabelData;
    labelTasks: TaskData[];
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

export default function LabelShow({
    workspace,
    project,
    label,
    labelTasks,
}: Props) {
    const { t, i18n } = useTranslation();
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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

    return (
        <>
            <Head
                title={t('labels.show_page_title', {
                    labelName: label.name,
                    projectName: project.name,
                })}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={label.name}
                    backHref={projectSettings({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={t('settings.title')}
                    leading={
                        <div
                            className="flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                            style={{
                                backgroundColor: label.color ?? '#64748B',
                            }}
                        >
                            <Hash className="size-6" />
                        </div>
                    }
                    badge={
                        <Badge variant="secondary">
                            {t('labels.task_count', {
                                count: label.tasks_count,
                            })}
                        </Badge>
                    }
                    actions={
                        <Link
                            href={projectSettings({
                                workspace: workspace.slug,
                                project: project.slug,
                            })}
                        >
                            <Button variant="outline" size="sm">
                                {t('label.edit_label')}
                            </Button>
                        </Link>
                    }
                />

                <div className="mx-auto w-full max-w-3xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('tasks.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {labelTasks.length > 0 ? (
                                <div className="flex flex-col rounded-md border">
                                    {labelTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            onClick={() => {
                                                setDrawerTaskId(task.id);
                                                setDrawerOpen(true);
                                            }}
                                            className="flex cursor-pointer items-center gap-3 border-b px-3 py-3 transition-colors last:border-0 hover:bg-muted/40"
                                        >
                                            <div className="min-w-0 flex-1">
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
                                                                'labels.due_prefix',
                                                            )}{' '}
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={Hash}
                                    title={t('labels.no_tasks_with_label')}
                                    description={t(
                                        'labels.no_tasks_description',
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
