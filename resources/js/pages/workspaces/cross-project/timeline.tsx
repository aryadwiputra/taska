'use no memo';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GanttChart } from '@/components/gantt-chart';
import { Badge } from '@/components/ui/badge';
import { show as workspaceShow } from '@/routes/workspaces';

interface Project {
    id: number;
    name: string;
    key: string;
    slug: string;
    color: string | null;
    epics_count: number;
}

interface TaskData {
    id: number;
    code: string;
    title: string;
    status: string;
    start_date: string;
    due_date: string;
    completed_at: string | null;
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

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
    projects: Project[];
    tasks: TaskData[];
}

export default function CrossProjectTimeline({
    workspace,
    projects,
    tasks,
}: Props) {
    const { t } = useTranslation();
    const handleTaskClick = (id: number) => {
        const task = tasks.find((t) => t.id === id);

        if (task) {
            window.open(
                `/workspaces/${workspace.slug}/projects/${task.project.slug}/tasks/${task.id}`,
                '_blank',
            );
        }
    };

    return (
        <>
            <Head title={`Cross-Project Timeline — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={workspaceShow({ workspace: workspace.slug })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{workspace.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">
                        {t('cross_project.timeline')}
                    </span>
                </div>

                <div className="mx-auto w-full max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {t('cross_project.timeline')}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t('cross_project.timeline_summary', { projectCount: projects.length, taskCount: tasks.length })}
                        </p>
                    </div>

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

                    {tasks.length > 0 ? (
                        <div className="rounded-lg border">
                            <GanttChart
                                tasks={tasks.map((t) => ({
                                    ...t,
                                    start_date: t.start_date,
                                    due_date: t.due_date,
                                }))}
                                onTaskClick={handleTaskClick}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
                            <p className="text-sm font-medium">
                                {t('cross_project.no_scheduled_tasks')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {t('cross_project.timeline_description')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
