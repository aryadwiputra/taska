import { Head, router } from '@inertiajs/react';
import { Calendar, CheckCircle2, Filter } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
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
import { cn } from '@/lib/utils';
import { index as myTasksIndex } from '@/routes/my-tasks';
import type { MyTaskItem } from '@/types/dashboard';

interface ProjectOption {
    id: number;
    name: string;
    key: string;
    color: string | null;
}

interface Props {
    tasks: {
        data: MyTaskItem[];
        current_page: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    projects: ProjectOption[];
    filters: {
        status: string | null;
        priority_id: string | null;
        project_id: string | null;
    };
}

const ALL_FILTERS_VALUE = 'all';

export default function MyTasks({ tasks, projects, filters }: Props) {
    const { t } = useTranslation();

    const statusOptions = [
        { value: ALL_FILTERS_VALUE, label: t('task_search.all_statuses') },
        { value: 'todo', label: t('task_search.todo') },
        { value: 'in_progress', label: t('task_search.in_progress') },
        { value: 'review', label: t('task_search.review') },
        { value: 'done', label: t('task_search.done') },
        { value: 'backlog', label: t('task_search.backlog') },
    ];

    const priorityLabels: Record<string, string> = {
        lowest: t('priority_labels.lowest'),
        low: t('priority_labels.low'),
        medium: t('priority_labels.medium'),
        high: t('priority_labels.high'),
        highest: t('priority_labels.highest'),
        urgent: t('priority_labels.urgent'),
    };
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerWorkspaceSlug, setDrawerWorkspaceSlug] = useState<string>('');
    const [drawerProjectSlug, setDrawerProjectSlug] = useState<string>('');
    const [drawerOpen, setDrawerOpen] = useState(false);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        const normalizedValue = value === ALL_FILTERS_VALUE ? '' : value;

        if (normalizedValue) {
            params.set(key, normalizedValue);
        } else {
            params.delete(key);
        }

        router.visit(myTasksIndex({ query: Object.fromEntries(params) }), {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <>
            <Head title={t('my_tasks.title')} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('my_tasks.title')}
                    description={t('my_tasks.description')}
                />

                <div className="flex flex-wrap items-center gap-3">
                    <Filter className="size-4 shrink-0 text-muted-foreground" />

                    <Select
                        value={filters.status ?? ALL_FILTERS_VALUE}
                        onValueChange={(v) => updateFilter('status', v)}
                    >
                        <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder={t('task.status')} />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.project_id ?? ALL_FILTERS_VALUE}
                        onValueChange={(v) => updateFilter('project_id', v)}
                    >
                        <SelectTrigger className="h-8 w-44">
                            <SelectValue
                                placeholder={t('task_search.all_projects')}
                            />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTERS_VALUE}>
                                {t('task_search.all_projects')}
                            </SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.priority_id ?? ALL_FILTERS_VALUE}
                        onValueChange={(v) => updateFilter('priority_id', v)}
                    >
                        <SelectTrigger className="h-8 w-40">
                            <SelectValue placeholder={t('task.priority')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTERS_VALUE}>
                                {t('task_search.all_priorities')}
                            </SelectItem>
                            {Object.entries(priorityLabels).map(
                                ([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>
                                ),
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {tasks.data.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title={t('my_tasks.empty_title')}
                        description={t('my_tasks.empty_description')}
                        className="py-20"
                    />
                ) : (
                    <div className="flex flex-col">
                        <div className="grid gap-3 md:hidden">
                            {tasks.data.map((task) => (
                                <div
                                    key={task.id}
                                    onClick={() => {
                                        setDrawerTaskId(task.id);
                                        setDrawerWorkspaceSlug(
                                            task.workspace.slug,
                                        );
                                        setDrawerProjectSlug(task.project.slug);
                                        setDrawerOpen(true);
                                    }}
                                    className="cursor-pointer rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-muted/50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-mono text-xs text-muted-foreground">
                                                {task.code}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm font-medium">
                                                {task.title}
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 text-xs"
                                        >
                                            {task.project.key}
                                        </Badge>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {task.status.replace(/_/g, ' ')}
                                        </Badge>
                                        {task.priority && (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span
                                                    className="size-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            task.priority
                                                                .color ??
                                                            '#94A3B8',
                                                    }}
                                                />
                                                {task.priority.name}
                                            </span>
                                        )}
                                        {task.due_date && (
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1 text-xs text-muted-foreground',
                                                    new Date(task.due_date) <
                                                        new Date() &&
                                                        'text-destructive',
                                                )}
                                            >
                                                <Calendar className="size-3" />
                                                {formatDate(task.due_date)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-hidden rounded-lg border md:block">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('my_tasks.table_task')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('task.status')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('task.priority')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('my_tasks.table_project')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('task.due_date')}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            {t('task.assignees')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                                            onClick={() => {
                                                setDrawerTaskId(task.id);
                                                setDrawerWorkspaceSlug(
                                                    task.workspace.slug,
                                                );
                                                setDrawerProjectSlug(
                                                    task.project.slug,
                                                );
                                                setDrawerOpen(true);
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {task.code}
                                                    </span>
                                                    <span className="max-w-xs truncate text-sm font-medium">
                                                        {task.title}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {task.status.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {task.priority ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div
                                                            className="size-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    task
                                                                        .priority
                                                                        .color ??
                                                                    '#94A3B8',
                                                            }}
                                                        />
                                                        <span className="text-sm">
                                                            {task.priority.name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {task.project.key}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                {task.due_date ? (
                                                    <div className="flex items-center gap-1.5 text-sm">
                                                        <Calendar className="size-3.5 text-muted-foreground" />
                                                        <span
                                                            className={cn(
                                                                new Date(
                                                                    task.due_date,
                                                                ) <
                                                                    new Date() &&
                                                                    'text-destructive',
                                                            )}
                                                        >
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    {task.assignees
                                                        .slice(0, 3)
                                                        .map((a) => (
                                                            <div
                                                                key={a.id}
                                                                className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium"
                                                                title={a.name}
                                                            >
                                                                {a.name
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                            </div>
                                                        ))}
                                                    {task.assignees.length >
                                                        3 && (
                                                        <div className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                                                            +
                                                            {task.assignees
                                                                .length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {tasks.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 py-4">
                                {tasks.links
                                    .filter(
                                        (l) =>
                                            !l.label.includes('Previous') &&
                                            !l.label.includes('Next'),
                                    )
                                    .map((link, i) =>
                                        link.url ? (
                                            <Button
                                                key={i}
                                                variant={
                                                    link.active
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                className="h-8 min-w-8"
                                                onClick={() =>
                                                    router.visit(link.url!, {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                    })
                                                }
                                            >
                                                {link.label
                                                    .replace(
                                                        /&laquo;|&raquo;/g,
                                                        '',
                                                    )
                                                    .trim()}
                                            </Button>
                                        ) : (
                                            <span
                                                key={i}
                                                className="px-2 text-sm text-muted-foreground"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ),
                                    )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <TaskDetailDrawer
                workspaceSlug={drawerWorkspaceSlug}
                projectSlug={drawerProjectSlug}
                taskId={drawerTaskId}
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                onDelete={() => router.reload()}
            />
        </>
    );
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}
