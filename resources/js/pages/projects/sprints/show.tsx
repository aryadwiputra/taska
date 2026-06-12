import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Check, Plus, X } from 'lucide-react';
import { useState } from 'react';
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
    addTask as sprintAddTask,
    removeTask as sprintRemoveTask,
} from '@/routes/projects/sprints';

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

interface SprintData {
    id: number;
    name: string;
    goal: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
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
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [addTaskId, setAddTaskId] = useState<string>('none');

    const { completed_tasks_count: completedTasks, tasks_count: totalTasks } =
        sprint;
    const percent =
        totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const handleRemoveTask = (taskId: number) => {
        if (!confirm('Remove this task from the sprint?')) {
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
            <Head title={`${sprint.name} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">
                        Sprints
                    </span>
                </div>

                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {sprint.name}
                            </h1>
                            <div className="mt-1 flex items-center gap-2">
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
                            </div>
                        </div>
                        <Link
                            href={projectSettings({
                                workspace: workspace.slug,
                                project: project.slug,
                            })}
                        >
                            <Button variant="outline" size="sm">
                                Edit sprint
                            </Button>
                        </Link>
                    </div>

                    <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    {sprint.goal && (
                        <p className="mb-6 text-sm text-muted-foreground">
                            {sprint.goal}
                        </p>
                    )}

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
                            <CardTitle>Tasks</CardTitle>
                            {availableTasks.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={addTaskId}
                                        onValueChange={setAddTaskId}
                                    >
                                        <SelectTrigger className="h-8 w-56 text-xs">
                                            <SelectValue placeholder="Add existing task..." />
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
                                        <span>Add</span>
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
                                            <button
                                                type="button"
                                                className="min-w-0 flex-1 text-left"
                                                onClick={() => {
                                                    setDrawerTaskId(task.id);
                                                    setDrawerOpen(true);
                                                }}
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
                                                            Due{' '}
                                                            {formatDate(
                                                                task.due_date,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
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
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                    <Check className="size-8 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">
                                            No tasks in this sprint
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Add tasks to start tracking
                                            progress.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

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
