import { Head, router } from '@inertiajs/react';
import { Calendar, CheckCircle2, Filter } from 'lucide-react';
import { useState } from 'react';
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

const priorityLabels: Record<string, string> = {
    lowest: 'Lowest',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    highest: 'Highest',
    urgent: 'Urgent',
};

const ALL_FILTERS_VALUE = 'all';

const statusOptions = [
    { value: ALL_FILTERS_VALUE, label: 'All statuses' },
    { value: 'todo', label: 'Todo' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'review', label: 'Review' },
    { value: 'done', label: 'Done' },
    { value: 'backlog', label: 'Backlog' },
];

export default function MyTasks({ tasks, projects, filters }: Props) {
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<MyTaskItem | null>(null);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(window.location.search);
        const normalizedValue = value === ALL_FILTERS_VALUE ? '' : value;

        if (normalizedValue) {
            params.set(key, normalizedValue);
        } else {
            params.delete(key);
        }

        router.visit(`/my-tasks?${params.toString()}`, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    const handleTaskClick = (task: MyTaskItem) => {
        setSelectedTask(task);
        setDrawerTaskId(task.id);
        setDrawerOpen(true);
    };

    return (
        <>
            <Head title="My Tasks" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        My Tasks
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Tasks assigned to you across all projects.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Filter className="size-4 shrink-0 text-muted-foreground" />

                    <Select
                        value={filters.status ?? ALL_FILTERS_VALUE}
                        onValueChange={(v) => updateFilter('status', v)}
                    >
                        <SelectTrigger className="h-8 w-36">
                            <SelectValue placeholder="Status" />
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
                            <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTERS_VALUE}>
                                All projects
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
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ALL_FILTERS_VALUE}>
                                All priorities
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
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-20">
                        <CheckCircle2 className="size-12 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-lg font-medium">
                                No tasks assigned
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Tasks assigned to you will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Task
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Priority
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Project
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Due date
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Assignees
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.data.map((task) => (
                                        <tr
                                            key={task.id}
                                            className="cursor-pointer border-b transition-colors hover:bg-muted/50"
                                            onClick={() =>
                                                handleTaskClick(task)
                                            }
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
                workspaceSlug={selectedTask?.workspace.slug ?? null}
                projectSlug={selectedTask?.project.slug ?? null}
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
