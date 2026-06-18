'use no memo';

import { Head, Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { show as workspaceShow } from '@/routes/workspaces';

interface Column {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
}

interface TaskData {
    id: number;
    code: string;
    title: string;
    status: string;
    story_points: number | null;
    priority: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    } | null;
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    assignees: Array<{ id: number; name: string; avatar: string | null }>;
    epics: Array<{ id: number; name: string; color: string | null }>;
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
}

interface Project {
    id: number;
    name: string;
    key: string;
    slug: string;
    color: string | null;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
    columns: Column[];
    tasks: TaskData[];
    projects: Project[];
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

export default function CrossProjectBoard({
    workspace,
    columns,
    tasks,
    projects,
}: Props) {
    const { t } = useTranslation();
    const grouped = columns.map((col) => ({
        ...col,
        tasks: tasks.filter((t) => t.status === col.status_key),
    }));

    return (
        <>
            <Head title={`Cross-Project Board — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="mx-auto w-full max-w-7xl">
                    <PageHeader
                        className="mb-6"
                        title={t('cross_project.board')}
                        description={t('cross_project.board_summary', {
                            projectCount: projects.length,
                            taskCount: tasks.length,
                        })}
                        backHref={workspaceShow({ workspace: workspace.slug })}
                        backLabel={workspace.name}
                    />

                    <div className="mb-4 flex flex-wrap gap-2">
                        {projects.map((project) => (
                            <Badge
                                key={project.id}
                                variant="outline"
                                className="text-xs"
                                style={
                                    project.color
                                        ? {
                                              borderColor: project.color,
                                              color: project.color,
                                          }
                                        : undefined
                                }
                            >
                                {project.name}
                            </Badge>
                        ))}
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4">
                        {grouped.map((col) => (
                            <div
                                key={`${col.project.id}-${col.id}`}
                                className="flex w-72 shrink-0 flex-col"
                            >
                                <div className="mb-3 flex items-center gap-2">
                                    <div
                                        className="size-2.5 rounded-full"
                                        style={{
                                            backgroundColor:
                                                col.color ?? '#64748b',
                                        }}
                                    />
                                    <span className="text-sm font-medium">
                                        {col.name}
                                    </span>
                                    <Badge
                                        variant="secondary"
                                        className="ml-auto text-xs"
                                    >
                                        {col.tasks.length}
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-2">
                                    {col.tasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={`/workspaces/${workspace.slug}/projects/${task.project.slug}/tasks/${task.id}`}
                                            target="_blank"
                                        >
                                            <Card className="cursor-pointer transition-colors hover:border-primary/40">
                                                <CardContent className="p-3">
                                                    <div className="mb-1 flex items-center gap-2">
                                                        <span className="font-mono text-[10px] text-muted-foreground">
                                                            {task.code}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto text-[10px]"
                                                            style={
                                                                task.project
                                                                    .color
                                                                    ? {
                                                                          borderColor:
                                                                              task
                                                                                  .project
                                                                                  .color,
                                                                          color: task
                                                                              .project
                                                                              .color,
                                                                      }
                                                                    : undefined
                                                            }
                                                        >
                                                            {task.project.key}
                                                        </Badge>
                                                    </div>
                                                    <p className="line-clamp-2 text-sm font-medium">
                                                        {task.title}
                                                    </p>
                                                    <div className="mt-2 flex items-center gap-2">
                                                        {task.priority && (
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <div
                                                                    className={`size-1.5 rounded-full ${priorityColors[task.priority.key] ?? 'bg-muted-foreground'}`}
                                                                />
                                                                {
                                                                    task
                                                                        .priority
                                                                        .name
                                                                }
                                                            </div>
                                                        )}
                                                        {task.story_points !=
                                                            null && (
                                                            <span className="inline-flex size-4 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                                                {
                                                                    task.story_points
                                                                }
                                                            </span>
                                                        )}
                                                        {task.assignees.length >
                                                            0 && (
                                                            <span className="ml-auto text-[10px] text-muted-foreground">
                                                                {task.assignees
                                                                    .map(
                                                                        (a) =>
                                                                            a.name,
                                                                    )
                                                                    .join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}

                                    {col.tasks.length === 0 && (
                                        <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                                            {t('cross_project.no_tasks')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}
