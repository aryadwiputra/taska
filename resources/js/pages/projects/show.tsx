import { Head, Link, router } from '@inertiajs/react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
    Activity as ActivityIcon,
    ArrowLeft,
    CalendarDays,
    FileText,
    Flag,
    LayoutGrid,
    Search,
    Settings,
    Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { board as projectBoard } from '@/routes/projects';

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
}

interface ProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
    description: string | null;
    color: string | null;
    visibility: string;
    status: string;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface UserRef {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskRow {
    id: number;
    code: string;
    title: string;
    status: string;
    start_date: string | null;
    due_date: string | null;
    created_at: string;
    updated_at: string;
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
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    assignees: UserRef[];
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
}

interface EpicRow {
    id: number;
    name: string;
    summary: string | null;
    color: string | null;
    start_date: string | null;
    due_date: string | null;
    status: string;
    tasks_count: number;
    completed_tasks_count: number;
}

interface SprintRow {
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

interface AttachmentRow {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string | null;
    created_at: string;
    task: {
        id: number;
        code: string;
        title: string;
    };
    uploader: UserRef;
}

interface ActivityRow {
    id: number;
    action: string;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    task: {
        id: number;
        code: string;
        title: string;
    };
    user: UserRef | null;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    members: Member[];
    tasks: TaskRow[];
    epics: EpicRow[];
    sprints: SprintRow[];
    attachments: AttachmentRow[];
    activities: ActivityRow[];
}

const pageSize = 10;

export default function ProjectShow({
    workspace,
    project,
    tasks,
    epics,
    sprints,
    attachments,
    activities,
}: Props) {
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [page, setPage] = useState(0);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const filteredTasks = useMemo(() => tasks.filter((task) => {
        const query = search.toLowerCase();

        return (
            task.title.toLowerCase().includes(query) ||
            task.code.toLowerCase().includes(query) ||
            task.board_column.name.toLowerCase().includes(query) ||
            task.assignees.some((assignee) =>
                assignee.name.toLowerCase().includes(query),
            )
        );
    }), [search, tasks]);

    const columns: Array<ColumnDef<TaskRow>> = useMemo(() => [
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }) => (
                <span className="font-mono text-xs text-muted-foreground">
                    {row.original.code}
                </span>
            ),
        },
        {
            accessorKey: 'title',
            header: 'Task',
            cell: ({ row }) => (
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="truncate font-medium">
                        {row.original.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {row.original.task_type.name}
                    </span>
                </div>
            ),
        },
        {
            accessorKey: 'board_column.name',
            header: 'Status',
            cell: ({ row }) => (
                <Badge variant="outline">
                    {row.original.board_column.name}
                </Badge>
            ),
        },
        {
            accessorKey: 'priority.name',
            header: 'Priority',
            cell: ({ row }) =>
                row.original.priority ? (
                    <Badge variant="secondary">
                        {row.original.priority.name}
                    </Badge>
                ) : (
                    <span className="text-sm text-muted-foreground">None</span>
                ),
        },
        {
            accessorKey: 'assignees',
            header: 'Assignees',
            cell: ({ row }) =>
                row.original.assignees.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {row.original.assignees.map((assignee) => (
                            <Badge
                                key={assignee.id}
                                variant="secondary"
                                className="text-xs"
                            >
                                {assignee.name}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">
                        Unassigned
                    </span>
                ),
            enableSorting: false,
        },
        {
            accessorKey: 'due_date',
            header: 'Due',
            cell: ({ row }) => formatDate(row.original.due_date),
        },
    ], []);

    const table = useReactTable({
        data: filteredTasks,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const rows = table.getRowModel().rows;
    const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
    const pageRows = rows.slice(page * pageSize, page * pageSize + pageSize);
    const timelineGroups = groupTasksByDueDate(tasks);

    return (
        <>
            <Head title={`${project.name} — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/workspaces/${workspace.slug}/projects`}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Projects</span>
                    </Link>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                                style={{
                                    backgroundColor: project.color ?? '#64748B',
                                }}
                            >
                                {project.key.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {project.name}
                                </h1>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="font-mono text-xs"
                                    >
                                        {project.key}
                                    </Badge>
                                    {project.visibility === 'private' && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Private
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        {project.description && (
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <Link
                        href={`/workspaces/${workspace.slug}/projects/${project.slug}/settings`}
                    >
                        <Button variant="outline" size="sm">
                            <Settings className="size-4" />
                            <span>Settings</span>
                        </Button>
                    </Link>
                </div>

                <Tabs defaultValue="list" className="flex flex-col gap-4">
                    <TabsList>
                        <TabsTrigger
                            value="board"
                            onClick={() =>
                                router.visit(
                                    projectBoard.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            <LayoutGrid className="size-4" />
                            <span>Board</span>
                        </TabsTrigger>
                        <TabsTrigger value="list">List</TabsTrigger>
                        <TabsTrigger value="epics">Epics</TabsTrigger>
                        <TabsTrigger value="sprints">Sprints</TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <CardTitle>Tasks</CardTitle>
                                <div className="relative w-full max-w-xs">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(event.target.value);
                                            setPage(0);
                                        }}
                                        placeholder="Search tasks..."
                                        className="pl-9"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-hidden rounded-md border">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            {table
                                                .getHeaderGroups()
                                                .map((headerGroup) => (
                                                    <tr key={headerGroup.id}>
                                                        {headerGroup.headers.map(
                                                            (header) => (
                                                                <th
                                                                    key={
                                                                        header.id
                                                                    }
                                                                    className="px-3 py-2 text-left font-medium text-muted-foreground"
                                                                >
                                                                    <button
                                                                        type="button"
                                                                        className="flex items-center gap-1"
                                                                        onClick={header.column.getToggleSortingHandler()}
                                                                        disabled={
                                                                            !header.column.getCanSort()
                                                                        }
                                                                    >
                                                                        {flexRender(
                                                                            header
                                                                                .column
                                                                                .columnDef
                                                                                .header,
                                                                            header.getContext(),
                                                                        )}
                                                                        {formatSortDirection(
                                                                            header.column.getIsSorted(),
                                                                        )}
                                                                    </button>
                                                                </th>
                                                            ),
                                                        )}
                                                    </tr>
                                                ))}
                                        </thead>
                                        <tbody>
                                            {pageRows.map((row) => (
                                                <tr
                                                    key={row.id}
                                                    className="cursor-pointer border-t transition-colors hover:bg-muted/40"
                                                    onClick={() => {
                                                        setDrawerTaskId(
                                                            row.original.id,
                                                        );
                                                        setDrawerOpen(true);
                                                    }}
                                                >
                                                    {row
                                                        .getVisibleCells()
                                                        .map((cell) => (
                                                            <td
                                                                key={cell.id}
                                                                className="px-3 py-3 align-top"
                                                            >
                                                                {flexRender(
                                                                    cell.column
                                                                        .columnDef
                                                                        .cell,
                                                                    cell.getContext(),
                                                                )}
                                                            </td>
                                                        ))}
                                                </tr>
                                            ))}
                                            {pageRows.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={columns.length}
                                                        className="px-3 py-12 text-center text-sm text-muted-foreground"
                                                    >
                                                        No tasks match your
                                                        search.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4 flex items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page + 1} of {pageCount}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={page === 0}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.max(0, current - 1),
                                                )
                                            }
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= pageCount - 1}
                                            onClick={() =>
                                                setPage((current) =>
                                                    Math.min(
                                                        pageCount - 1,
                                                        current + 1,
                                                    ),
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="epics">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Flag className="size-5" />
                                    Epics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {epics.length > 0 ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {epics.map((epic) => (
                                            <Link
                                                key={epic.id}
                                                href={`/workspaces/${workspace.slug}/projects/${project.slug}/epics/${epic.id}`}
                                                className="rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="size-2.5 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        epic.color ??
                                                                        '#64748b',
                                                                }}
                                                            />
                                                            <h3 className="truncate text-sm font-medium">
                                                                {epic.name}
                                                            </h3>
                                                        </div>
                                                        {epic.summary && (
                                                            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                                                                {epic.summary}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="outline">
                                                        {epic.status}
                                                    </Badge>
                                                </div>
                                                <ProgressSummary
                                                    completed={
                                                        epic.completed_tasks_count
                                                    }
                                                    total={epic.tasks_count}
                                                />
                                                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Start:{' '}
                                                        {formatDate(
                                                            epic.start_date,
                                                        )}
                                                    </span>
                                                    <span>
                                                        Due:{' '}
                                                        {formatDate(
                                                            epic.due_date,
                                                        )}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No epics yet. Create epics in project
                                        settings.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sprints">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="size-5" />
                                    Sprints
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sprints.length > 0 ? (
                                    <div className="flex flex-col rounded-md border">
                                        {sprints.map((sprint) => (
                                            <Link
                                                key={sprint.id}
                                                href={`/workspaces/${workspace.slug}/projects/${project.slug}/sprints/${sprint.id}`}
                                                className="block border-b p-4 last:border-0 transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-medium">
                                                            {sprint.name}
                                                        </h3>
                                                        {sprint.goal && (
                                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                                {sprint.goal}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Badge variant="secondary">
                                                        {sprint.status}
                                                    </Badge>
                                                </div>
                                                <ProgressSummary
                                                    completed={
                                                        sprint.completed_tasks_count
                                                    }
                                                    total={sprint.tasks_count}
                                                />
                                                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                                                    <span>
                                                        Start:{' '}
                                                        {formatDate(
                                                            sprint.start_date,
                                                        )}
                                                    </span>
                                                    <span>
                                                        End:{' '}
                                                        {formatDate(
                                                            sprint.end_date,
                                                        )}
                                                    </span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No sprints yet. Create sprints in
                                        project settings.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="size-5" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-6">
                                {timelineGroups.map((group) => (
                                    <div key={group.label}>
                                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                                            {group.label}
                                        </h3>
                                        <div className="flex flex-col rounded-md border">
                                            {group.tasks.map((task) => (
                                                <button
                                                    key={task.id}
                                                    type="button"
                                                    className="flex items-center justify-between gap-4 border-b px-3 py-3 text-left transition-colors last:border-0 hover:bg-muted/40"
                                                    onClick={() => {
                                                        setDrawerTaskId(
                                                            task.id,
                                                        );
                                                        setDrawerOpen(true);
                                                    }}
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium">
                                                            {task.title}
                                                        </p>
                                                        <p className="font-mono text-xs text-muted-foreground">
                                                            {task.code}
                                                        </p>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatDate(
                                                            task.due_date,
                                                        )}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="files">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="size-5" />
                                    Files
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {attachments.length > 0 ? (
                                    <div className="flex flex-col rounded-md border">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center justify-between gap-4 border-b px-3 py-3 last:border-0"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {attachment.file_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatBytes(
                                                            attachment.file_size,
                                                        )}{' '}
                                                        on{' '}
                                                        {attachment.task.code}
                                                    </p>
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDate(
                                                        attachment.created_at,
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-16 text-center">
                                        <Upload className="size-8 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                No files yet
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Attachments uploaded to tasks
                                                will appear here.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <ActivityIcon className="size-5" />
                                    Activity
                                </CardTitle>
                                <Link
                                    href={`/workspaces/${workspace.slug}/projects/${project.slug}/activity`}
                                >
                                    <Button variant="outline" size="sm">
                                        View all
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent>
                                {activities.length > 0 ? (
                                    <div className="flex flex-col">
                                        {activities.map((activity) => (
                                            <div
                                                key={activity.id}
                                                className="flex items-start gap-3 border-b py-3 last:border-0"
                                            >
                                                <div className="mt-1 size-2 rounded-full bg-muted-foreground/40" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm">
                                                        {activity.user && (
                                                            <span className="font-medium">
                                                                {
                                                                    activity
                                                                        .user
                                                                        .name
                                                                }
                                                            </span>
                                                        )}{' '}
                                                        {formatActivity(
                                                            activity,
                                                        )}{' '}
                                                        <span className="font-mono text-xs text-muted-foreground">
                                                            {activity.task.code}
                                                        </span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(
                                                            activity.created_at,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No project activity yet.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

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

function formatSortDirection(direction: false | 'asc' | 'desc'): string {
    if (direction === 'asc') {
        return 'asc';
    }

    if (direction === 'desc') {
        return 'desc';
    }

    return '';
}

function ProgressSummary({
    completed,
    total,
}: {
    completed: number;
    total: number;
}) {
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return (
        <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                    {completed}/{total} tasks complete
                </span>
                <span>{percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function groupTasksByDueDate(tasks: TaskRow[]): Array<{
    label: string;
    tasks: TaskRow[];
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = [
        { label: 'Overdue', tasks: [] as TaskRow[] },
        { label: 'Today', tasks: [] as TaskRow[] },
        { label: 'This week', tasks: [] as TaskRow[] },
        { label: 'Later', tasks: [] as TaskRow[] },
        { label: 'No due date', tasks: [] as TaskRow[] },
    ];

    tasks.forEach((task) => {
        if (!task.due_date) {
            groups[4].tasks.push(task);

            return;
        }

        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor(
            (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays < 0) {
            groups[0].tasks.push(task);
        } else if (diffDays === 0) {
            groups[1].tasks.push(task);
        } else if (diffDays <= 7) {
            groups[2].tasks.push(task);
        } else {
            groups[3].tasks.push(task);
        }
    });

    return groups.filter((group) => group.tasks.length > 0);
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );

    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatActivity(activity: ActivityRow): string {
    switch (activity.action) {
        case 'created':
            return 'created';
        case 'status_changed':
            return `changed status from "${activity.old_value}" to "${activity.new_value}" on`;
        case 'priority_changed':
            return `changed priority from "${activity.old_value}" to "${activity.new_value}" on`;
        case 'assigned':
            return `assigned ${activity.new_value} on`;
        case 'updated':
            return activity.field_name
                ? `updated ${activity.field_name} on`
                : 'updated';
        default:
            return `${activity.action.replace(/_/g, ' ')} on`;
    }
}
