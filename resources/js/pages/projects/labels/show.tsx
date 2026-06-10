import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Hash } from 'lucide-react';
import { useState } from 'react';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    lowest: 'bg-gray-400',
    low: 'bg-blue-400',
    medium: 'bg-amber-400',
    high: 'bg-orange-400',
    highest: 'bg-red-400',
    urgent: 'bg-red-500',
};

export default function LabelShow({
    workspace,
    project,
    label,
    labelTasks,
}: Props) {
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    return (
        <>
            <Head title={`${label.name} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/workspaces/${workspace.slug}/projects/${project.slug}/settings`}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Settings</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm text-muted-foreground">Labels</span>
                </div>

                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-12 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white"
                                style={{
                                    backgroundColor: label.color ?? '#64748B',
                                }}
                            >
                                <Hash className="size-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {label.name}
                                </h1>
                                <Badge variant="secondary" className="mt-1">
                                    {label.tasks_count} tasks
                                </Badge>
                            </div>
                        </div>
                        <Link
                            href={`/workspaces/${workspace.slug}/projects/${project.slug}/settings`}
                        >
                            <Button variant="outline" size="sm">
                                Edit label
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tasks</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {labelTasks.length > 0 ? (
                                <div className="flex flex-col rounded-md border">
                                    {labelTasks.map((task) => (
                                        <button
                                            key={task.id}
                                            type="button"
                                            className="flex items-center gap-3 border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-muted/40"
                                            onClick={() => {
                                                setDrawerTaskId(task.id);
                                                setDrawerOpen(true);
                                            }}
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
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {task.board_column.name}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {task.task_type.name}
                                                    </Badge>
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
                                                    {task.assignees.length > 0 && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {task.assignees.map((a) => a.name).join(', ')}
                                                        </span>
                                                    )}
                                                    {task.due_date && (
                                                        <span className="text-[10px] text-muted-foreground">
                                                            Due {formatDate(task.due_date)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                    <Hash className="size-8 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm font-medium">No tasks with this label</p>
                                        <p className="text-sm text-muted-foreground">
                                            Assign this label to tasks via the task drawer.
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
