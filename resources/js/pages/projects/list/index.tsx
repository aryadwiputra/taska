'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { ArrowLeft, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SavedFilterDropdown } from '@/components/saved-filter-dropdown';
import { TaskBulkDialog } from '@/components/task-bulk-dialog';
import { TaskBulkToolbar } from '@/components/task-bulk-toolbar';
import type { BulkOperation } from '@/components/task-bulk-toolbar';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { show as projectShow } from '@/routes/projects';
import { update as taskUpdate } from '@/routes/projects/tasks';

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
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
    labels: Array<{
        id: number;
        name: string;
        slug: string;
        color: string | null;
    }>;
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

interface BoardColumnOption {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    board: {
        id: number;
        name: string;
        is_default: boolean;
    };
}

interface PriorityOption {
    id: number;
    name: string;
    key: string;
    level: number;
    color: string | null;
}

interface LabelRow {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    tasks_count: number;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    tasks: TaskRow[];
    members: Member[];
    boardColumns: BoardColumnOption[];
    priorities: PriorityOption[];
    labels: LabelRow[];
}

const pageSize = 10;

export default function TaskListIndex({
    workspace,
    project,
    tasks,
    members,
    boardColumns,
    priorities,
    labels,
}: Props) {
    const [search, setSearch] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [page, setPage] = useState(0);
    const [localTasks, setLocalTasks] = useState(tasks);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
        () => new Set(),
    );
    const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(
        null,
    );
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [editingCell, setEditingCell] = useState<{
        taskId: number;
        field: string;
    } | null>(null);
    const editRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLocalTasks(tasks);
    }, [tasks]);

    useEcho(
        `private-project.${project.id}`,
        '.task.field.updated',
        (e: { task_id: number; changes: Record<string, unknown> }) => {
            setLocalTasks((prev) =>
                prev.map((t) =>
                    t.id === e.task_id ? { ...t, ...e.changes } : t,
                ),
            );
        },
        [project.id],
    );

    useEcho(
        `private-project.${project.id}`,
        '.activity.logged',
        (e: { action: string; task_id: number }) => {
            if (e.action === 'created') {
                router.reload({ only: ['tasks'] });
            } else if (e.action === 'deleted') {
                setLocalTasks((prev) => prev.filter((t) => t.id !== e.task_id));
            }
        },
        [project.id],
    );

    const updateTaskField = useCallback(
        (taskId: number, field: string, value: unknown) => {
            setLocalTasks((prev) =>
                prev.map((t) =>
                    t.id === taskId ? { ...t, [field]: value } : t,
                ),
            );

            const url = taskUpdate.url({
                workspace: workspace.slug,
                project: project.slug,
                task: taskId,
            });

            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((c) => c.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({ [field]: value }),
            }).catch(() => {
                setLocalTasks(tasks);
            });

            setEditingCell(null);
        },
        [workspace.slug, project.slug, tasks],
    );

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                editingCell &&
                editRef.current &&
                !editRef.current.contains(e.target as Node)
            ) {
                setEditingCell(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [editingCell]);

    const filteredTasks = useMemo(
        () =>
            localTasks.filter((task) => {
                const query = search.toLowerCase();

                return (
                    task.title.toLowerCase().includes(query) ||
                    task.code.toLowerCase().includes(query) ||
                    task.board_column.name.toLowerCase().includes(query) ||
                    task.assignees.some((assignee) =>
                        assignee.name.toLowerCase().includes(query),
                    )
                );
            }),
        [search, localTasks],
    );

    const columns: Array<ColumnDef<TaskRow>> = useMemo(
        () => [
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
                cell: ({ row }) => {
                    const task = row.original;
                    const isEditing =
                        editingCell?.taskId === task.id &&
                        editingCell.field === 'board_column_id';

                    if (isEditing) {
                        return (
                            <div ref={editRef}>
                                <select
                                    autoFocus
                                    className="h-7 w-full rounded border bg-background px-1 text-sm"
                                    defaultValue={String(task.board_column.id)}
                                    onChange={(e) => {
                                        const colId = Number(e.target.value);
                                        const col = boardColumns.find(
                                            (c) => c.id === colId,
                                        );

                                        if (col) {
                                            updateTaskField(
                                                task.id,
                                                'board_column_id',
                                                colId,
                                            );
                                        }
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                >
                                    {boardColumns.map((col) => (
                                        <option key={col.id} value={col.id}>
                                            {col.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }

                    return (
                        <Badge
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({
                                    taskId: task.id,
                                    field: 'board_column_id',
                                });
                            }}
                        >
                            {task.board_column.name}
                        </Badge>
                    );
                },
            },
            {
                accessorKey: 'priority.name',
                header: 'Priority',
                cell: ({ row }) => {
                    const task = row.original;
                    const isEditing =
                        editingCell?.taskId === task.id &&
                        editingCell.field === 'priority_id';

                    if (isEditing) {
                        return (
                            <div ref={editRef}>
                                <select
                                    autoFocus
                                    className="h-7 w-full rounded border bg-background px-1 text-sm"
                                    defaultValue={String(
                                        task.priority?.id ?? '',
                                    )}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        updateTaskField(
                                            task.id,
                                            'priority_id',
                                            val ? Number(val) : null,
                                        );
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                >
                                    <option value="">None</option>
                                    {priorities.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }

                    return task.priority ? (
                        <Badge
                            variant="secondary"
                            className="cursor-pointer hover:bg-muted"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({
                                    taskId: task.id,
                                    field: 'priority_id',
                                });
                            }}
                        >
                            {task.priority.name}
                        </Badge>
                    ) : (
                        <span
                            className="cursor-pointer text-sm text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({
                                    taskId: task.id,
                                    field: 'priority_id',
                                });
                            }}
                        >
                            None
                        </span>
                    );
                },
            },
            {
                accessorKey: 'assignees',
                header: 'Assignees',
                cell: ({ row }) => {
                    const task = row.original;
                    const isEditing =
                        editingCell?.taskId === task.id &&
                        editingCell.field === 'assignee_ids';

                    if (isEditing) {
                        const currentIds = task.assignees.map((a) => a.id);

                        return (
                            <div ref={editRef} className="min-w-[180px]">
                                <select
                                    autoFocus
                                    multiple
                                    className="h-16 w-full rounded border bg-background px-1 text-sm"
                                    defaultValue={currentIds.map(String)}
                                    onChange={(e) => {
                                        const selected = Array.from(
                                            e.target.selectedOptions,
                                            (opt) => Number(opt.value),
                                        );
                                        updateTaskField(
                                            task.id,
                                            'assignee_ids',
                                            selected,
                                        );
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                >
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        );
                    }

                    return (
                        <div
                            className="cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({
                                    taskId: task.id,
                                    field: 'assignee_ids',
                                });
                            }}
                        >
                            {task.assignees.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                    {task.assignees.map((assignee) => (
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
                                <span className="text-sm text-muted-foreground hover:text-foreground">
                                    Unassigned
                                </span>
                            )}
                        </div>
                    );
                },
                enableSorting: false,
            },
            {
                accessorKey: 'due_date',
                header: 'Due',
                cell: ({ row }) => {
                    const task = row.original;
                    const isEditing =
                        editingCell?.taskId === task.id &&
                        editingCell.field === 'due_date';

                    if (isEditing) {
                        return (
                            <div ref={editRef}>
                                <input
                                    autoFocus
                                    type="date"
                                    className="h-7 w-full rounded border bg-background px-1 text-sm"
                                    defaultValue={
                                        task.due_date
                                            ? new Date(task.due_date)
                                                  .toISOString()
                                                  .split('T')[0]
                                            : ''
                                    }
                                    onChange={(e) => {
                                        updateTaskField(
                                            task.id,
                                            'due_date',
                                            e.target.value || null,
                                        );
                                    }}
                                    onBlur={() => setEditingCell(null)}
                                />
                            </div>
                        );
                    }

                    return (
                        <span
                            className="cursor-pointer text-sm hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingCell({
                                    taskId: task.id,
                                    field: 'due_date',
                                });
                            }}
                        >
                            {formatDate(task.due_date)}
                        </span>
                    );
                },
            },
        ],
        [editingCell, boardColumns, priorities, members, updateTaskField],
    );

    // eslint-disable-next-line react-hooks/incompatible-library
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
    const selectedTaskIdList = Array.from(selectedTaskIds);
    const visibleTaskIds = pageRows.map((row) => row.original.id);
    const allVisibleSelected =
        visibleTaskIds.length > 0 &&
        visibleTaskIds.every((id) => selectedTaskIds.has(id));

    const toggleTaskSelection = (taskId: number) => {
        setSelectedTaskIds((current) => {
            const next = new Set(current);

            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }

            return next;
        });
    };

    const toggleVisibleSelection = () => {
        setSelectedTaskIds((current) => {
            const next = new Set(current);

            if (allVisibleSelected) {
                visibleTaskIds.forEach((id) => next.delete(id));
            } else {
                visibleTaskIds.forEach((id) => next.add(id));
            }

            return next;
        });
    };

    const openBulkDialog = (operation: BulkOperation) => {
        setBulkOperation(operation);
        setBulkDialogOpen(true);
    };

    return (
        <>
            <Head title={`Tasks — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
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
                    <span className="text-sm font-medium">Tasks</span>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle>Tasks</CardTitle>
                        <div className="flex items-center gap-2">
                            <SavedFilterDropdown
                                workspaceSlug={workspace.slug}
                                projectSlug={project.slug}
                                currentFilters={{}}
                                currentSort={{
                                    field: sorting[0]?.id ?? 'position',
                                    direction: sorting[0]?.desc
                                        ? 'desc'
                                        : 'asc',
                                }}
                                onLoad={(filter) => {
                                    if (filter.sort_field) {
                                        setSorting([
                                            {
                                                id: filter.sort_field,
                                                desc:
                                                    filter.sort_direction ===
                                                    'desc',
                                            },
                                        ]);
                                    }
                                }}
                            />
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
                        </div>
                    </CardHeader>
                    <CardContent>
                        <TaskBulkToolbar
                            selectedCount={selectedTaskIds.size}
                            onClear={() => setSelectedTaskIds(new Set())}
                            onAction={openBulkDialog}
                        />

                        <div className="overflow-hidden rounded-md border">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    {table
                                        .getHeaderGroups()
                                        .map((headerGroup) => (
                                            <tr key={headerGroup.id}>
                                                <th className="w-10 px-3 py-2 text-left">
                                                    <Checkbox
                                                        checked={
                                                            allVisibleSelected
                                                        }
                                                        aria-label="Select visible tasks"
                                                        onCheckedChange={
                                                            toggleVisibleSelection
                                                        }
                                                    />
                                                </th>
                                                {headerGroup.headers.map(
                                                    (header) => (
                                                        <th
                                                            key={header.id}
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
                                            <td className="px-3 py-3 align-top">
                                                <Checkbox
                                                    checked={selectedTaskIds.has(
                                                        row.original.id,
                                                    )}
                                                    aria-label={`Select ${row.original.code}`}
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    onCheckedChange={() =>
                                                        toggleTaskSelection(
                                                            row.original.id,
                                                        )
                                                    }
                                                />
                                            </td>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <td
                                                        key={cell.id}
                                                        className="px-3 py-3 align-top"
                                                    >
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
                                                            cell.getContext(),
                                                        )}
                                                    </td>
                                                ))}
                                        </tr>
                                    ))}
                                    {pageRows.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={columns.length + 1}
                                                className="px-3 py-12 text-center text-sm text-muted-foreground"
                                            >
                                                No tasks match your search.
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
            </div>

            <TaskBulkDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
                operation={bulkOperation}
                selectedTaskIds={selectedTaskIdList}
                workspaceSlug={workspace.slug}
                projectSlug={project.slug}
                members={members}
                boardColumns={boardColumns}
                priorities={priorities}
                labels={labels}
                onSuccess={() => setSelectedTaskIds(new Set())}
            />

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

function formatSortDirection(direction: false | 'asc' | 'desc'): string {
    if (direction === 'asc') {
        return 'asc';
    }

    if (direction === 'desc') {
        return 'desc';
    }

    return '';
}
