import { Head, Link, router } from '@inertiajs/react';
import { useEcho } from '@laravel/echo-react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import {
    Activity as ActivityIcon,
    BarChart3,
    Calendar as CalendarIcon,
    CalendarDays,
    FileText,
    Flag,
    LayoutGrid,
    Search,
    Settings,
    Upload,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarView } from '@/components/calendar-view';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EpicDialog } from '@/components/epic-dialog';
import { GanttChart } from '@/components/gantt-chart';
import { LabelDialog } from '@/components/label-dialog';
import { PageHeader } from '@/components/page-header';
import { ReportsTab } from '@/components/reports-tab';
import { SavedFilterDropdown } from '@/components/saved-filter-dropdown';
import { SprintDialog } from '@/components/sprint-dialog';
import { TaskBulkDialog } from '@/components/task-bulk-dialog';
import { TaskBulkToolbar } from '@/components/task-bulk-toolbar';
import type { BulkOperation } from '@/components/task-bulk-toolbar';
import { TaskDetailDrawer } from '@/components/task-detail-drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import {
    board as projectBoard,
    index as projectsIndex,
    settings as projectSettings,
} from '@/routes/projects';
import { index as activityIndex } from '@/routes/projects/activity';
import { index as automationIndex } from '@/routes/projects/automation';
import { index as backlogShow } from '@/routes/projects/backlog';
import { index as componentIndex } from '@/routes/projects/components';
import {
    destroy as destroyEpic,
    show as epicShow,
} from '@/routes/projects/epics';
import { destroy as destroyLabel } from '@/routes/projects/labels';
import { index as releaseIndex } from '@/routes/projects/releases';
import {
    destroy as destroySprint,
    show as sprintShow,
} from '@/routes/projects/sprints';
import { update as taskUpdate } from '@/routes/projects/tasks';
import { index as workloadIndex } from '@/routes/projects/workload';

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
    related_tasks?: Array<{
        id: number;
        code: string;
        title: string;
        status: string;
        relation_type: string;
    }>;
    is_blocked?: boolean;
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

interface LabelRow {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    tasks_count: number;
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

interface Props {
    workspace: Workspace;
    project: ProjectData;
    members: Member[];
    tasks: TaskRow[];
    epics: EpicRow[];
    sprints: SprintRow[];
    labels: LabelRow[];
    boardColumns: BoardColumnOption[];
    priorities: PriorityOption[];
    attachments: AttachmentRow[];
    activities: ActivityRow[];
}

const pageSize = 10;

export default function ProjectShow({
    workspace,
    project,
    members,
    tasks,
    epics,
    sprints,
    labels,
    boardColumns,
    priorities,
    attachments,
    activities,
}: Props) {
    'use no memo';

    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('list');
    const [sorting, setSorting] = useState<SortingState>([]);
    const [page, setPage] = useState(0);
    const [localTasks, setLocalTasks] = useState(tasks);
    const [drawerTaskId, setDrawerTaskId] = useState<number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

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
    const [epicDialogOpen, setEpicDialogOpen] = useState(false);
    const [editingEpic, setEditingEpic] = useState<EpicRow | null>(null);
    const [deletingEpic, setDeletingEpic] = useState<EpicRow | null>(null);
    const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<SprintRow | null>(null);
    const [deletingSprint, setDeletingSprint] = useState<SprintRow | null>(
        null,
    );
    const [labelDialogOpen, setLabelDialogOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<LabelRow | null>(null);
    const [deletingLabel, setDeletingLabel] = useState<LabelRow | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
        () => new Set(),
    );
    const [bulkOperation, setBulkOperation] = useState<BulkOperation | null>(
        null,
    );
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [timelineView, setTimelineView] = useState<'gantt' | 'calendar'>(
        'gantt',
    );
    const [editingCell, setEditingCell] = useState<{
        taskId: number;
        field: string;
    } | null>(null);
    const editRef = useRef<HTMLDivElement>(null);

    useKeyboardShortcuts([
        {
            sequence: ['g', 'l'],
            handler: () => setActiveTab('list'),
            description: 'Go to list',
        },
        {
            sequence: ['g', 'b'],
            handler: () => {
                router.visit(
                    projectBoard({
                        workspace: workspace.slug,
                        project: project.slug,
                    }),
                );
            },
            description: 'Go to board',
        },
        {
            sequence: ['g', 's'],
            handler: () => {
                router.visit(
                    projectSettings({
                        workspace: workspace.slug,
                        project: project.slug,
                    }),
                );
            },
            description: 'Go to settings',
        },
    ]);

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
            <Head title={`${project.name} — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={project.name}
                    description={project.description}
                    backHref={projectsIndex({ workspace: workspace.slug })}
                    backLabel={t('sidebar.projects')}
                    leading={
                        <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${project.color ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                            style={
                                project.color
                                    ? { backgroundColor: project.color }
                                    : undefined
                            }
                        >
                            {project.key.charAt(0).toUpperCase()}
                        </div>
                    }
                    badge={
                        <>
                            <Badge
                                variant="secondary"
                                className="font-mono text-xs"
                            >
                                {project.key}
                            </Badge>
                            {project.visibility === 'private' && (
                                <Badge variant="outline" className="text-xs">
                                    Private
                                </Badge>
                            )}
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
                                <Settings className="size-4" />
                                <span>{t('settings.title')}</span>
                            </Button>
                        </Link>
                    }
                />

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="flex flex-col gap-4"
                >
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
                            <span>{t('board.board')}</span>
                        </TabsTrigger>
                        <TabsTrigger value="list">List</TabsTrigger>
                        <TabsTrigger value="epics">Epics</TabsTrigger>
                        <TabsTrigger value="sprints">Sprints</TabsTrigger>
                        <TabsTrigger
                            value="backlog"
                            onClick={() =>
                                router.visit(
                                    backlogShow.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            Backlog
                        </TabsTrigger>
                        <TabsTrigger
                            value="releases"
                            onClick={() =>
                                router.visit(
                                    releaseIndex.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            {t('release.title')}
                        </TabsTrigger>
                        <TabsTrigger value="labels">
                            {t('task.labels')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="components"
                            onClick={() =>
                                router.visit(
                                    componentIndex.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            {t('component.title')}
                        </TabsTrigger>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger
                            value="workload"
                            onClick={() =>
                                router.visit(
                                    workloadIndex.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            Workload
                        </TabsTrigger>
                        <TabsTrigger value="files">Files</TabsTrigger>
                        <TabsTrigger value="reports">
                            {t('reports.title')}
                        </TabsTrigger>
                        <TabsTrigger value="activity">
                            {t('task.activity')}
                        </TabsTrigger>
                        <TabsTrigger
                            value="automation"
                            onClick={() =>
                                router.visit(
                                    automationIndex({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }).url,
                                )
                            }
                        >
                            Automation
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list">
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
                                            placeholder={t(
                                                'task.search_code_title_desc',
                                            )}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <TaskBulkToolbar
                                    selectedCount={selectedTaskIds.size}
                                    onClear={() =>
                                        setSelectedTaskIds(new Set())
                                    }
                                    onAction={openBulkDialog}
                                />

                                <div className="overflow-hidden rounded-lg border border-border bg-card">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/40">
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
                                                                    key={
                                                                        header.id
                                                                    }
                                                                    className="px-3 py-2 text-left text-xs font-semibold tracking-[0.01em] text-muted-foreground"
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
                                                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted/30"
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
                                                                    row.original
                                                                        .id,
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
                                                        colSpan={
                                                            columns.length + 1
                                                        }
                                                        className="bg-muted/20 px-3 py-12 text-center text-sm text-muted-foreground"
                                                    >
                                                        {t('common.no_results')}
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
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Flag className="size-5" />
                                    Epics
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingEpic(null);
                                        setEpicDialogOpen(true);
                                    }}
                                >
                                    <Flag className="size-3.5" />
                                    <span>{t('epic.create_epic')}</span>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {epics.length > 0 ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {epics.map((epic) => (
                                            <div
                                                key={epic.id}
                                                className="group relative rounded-lg border border-border bg-card p-4 transition-[background-color,border-color,box-shadow] hover:border-primary/30 hover:bg-muted/20 hover:shadow-soft"
                                            >
                                                <Link
                                                    href={epicShow({
                                                        workspace:
                                                            workspace.slug,
                                                        project: project.slug,
                                                        epic: epic.id,
                                                    })}
                                                    className="block"
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
                                                                    {
                                                                        epic.summary
                                                                    }
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
                                                <div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        title="Edit epic"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setEditingEpic(
                                                                epic,
                                                            );
                                                            setEpicDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                        title="Delete epic"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setDeletingEpic(
                                                                epic,
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No epics yet. Create your first epic to
                                        group related tasks.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sprints">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="size-5" />
                                    Sprints
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingSprint(null);
                                        setSprintDialogOpen(true);
                                    }}
                                >
                                    <CalendarDays className="size-3.5" />
                                    <span>{t('sprint.create_sprint')}</span>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {sprints.length > 0 ? (
                                    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                                        {sprints.map((sprint) => (
                                            <div
                                                key={sprint.id}
                                                className="group relative border-b border-border p-4 transition-colors last:border-0 hover:bg-muted/30"
                                            >
                                                <Link
                                                    href={sprintShow({
                                                        workspace:
                                                            workspace.slug,
                                                        project: project.slug,
                                                        sprint: sprint.id,
                                                    })}
                                                    className="block"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <h3 className="truncate text-sm font-medium">
                                                                {sprint.name}
                                                            </h3>
                                                            {sprint.goal && (
                                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                                    {
                                                                        sprint.goal
                                                                    }
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
                                                        total={
                                                            sprint.tasks_count
                                                        }
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
                                                <div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        title="Edit sprint"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setEditingSprint(
                                                                sprint,
                                                            );
                                                            setSprintDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                        title="Delete sprint"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            setDeletingSprint(
                                                                sprint,
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No sprints yet. Create your first sprint
                                        to plan a time-boxed iteration.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="labels">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <svg
                                        className="size-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                                        />
                                    </svg>
                                    Labels
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingLabel(null);
                                        setLabelDialogOpen(true);
                                    }}
                                >
                                    <svg
                                        className="size-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                                        />
                                    </svg>
                                    <span>{t('label.create_label')}</span>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {labels.length > 0 ? (
                                    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
                                        {labels.map((label) => (
                                            <div
                                                key={label.id}
                                                className="group relative flex items-center justify-between border-b px-4 py-3 last:border-0"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="size-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                label.color ??
                                                                '#64748b',
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium">
                                                        {label.name}
                                                    </span>
                                                    <span className="font-mono text-xs text-muted-foreground">
                                                        {label.slug}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs"
                                                    >
                                                        {label.tasks_count} task
                                                        {label.tasks_count !== 1
                                                            ? 's'
                                                            : ''}
                                                    </Badge>
                                                </div>
                                                <div className="hidden gap-1 group-hover:flex">
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                        title="Edit label"
                                                        onClick={() => {
                                                            setEditingLabel(
                                                                label,
                                                            );
                                                            setLabelDialogOpen(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                                        title="Delete label"
                                                        onClick={() =>
                                                            setDeletingLabel(
                                                                label,
                                                            )
                                                        }
                                                    >
                                                        <svg
                                                            className="size-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                            strokeWidth={2}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-12 text-center text-sm text-muted-foreground">
                                        No labels yet. Create your first label
                                        to categorize tasks.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="timeline">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="size-5" />
                                    Timeline
                                </CardTitle>
                                <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                                    <Button
                                        type="button"
                                        variant={
                                            timelineView === 'gantt'
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() => setTimelineView('gantt')}
                                    >
                                        <BarChart3 className="size-4" />
                                        <span>Gantt</span>
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            timelineView === 'calendar'
                                                ? 'secondary'
                                                : 'ghost'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setTimelineView('calendar')
                                        }
                                    >
                                        <CalendarIcon className="size-4" />
                                        <span>Calendar</span>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {timelineView === 'gantt' ? (
                                    <GanttChart
                                        tasks={tasks}
                                        onTaskClick={(id) => {
                                            setDrawerTaskId(id);
                                            setDrawerOpen(true);
                                        }}
                                    />
                                ) : (
                                    <CalendarView
                                        tasks={tasks}
                                        onTaskClick={(id) => {
                                            setDrawerTaskId(id);
                                            setDrawerOpen(true);
                                        }}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="reports">
                        <ReportsTab
                            workspaceSlug={workspace.slug}
                            projectSlug={project.slug}
                        />
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
                                    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
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
                                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 px-6 py-16 text-center">
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
                                    href={activityIndex({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    })}
                                >
                                    <Button variant="outline" size="sm">
                                        {t('common.view')}
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

                <EpicDialog
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    open={epicDialogOpen}
                    onOpenChange={(open) => {
                        setEpicDialogOpen(open);

                        if (!open) {
                            setEditingEpic(null);
                        }
                    }}
                    epic={editingEpic}
                />

                <SprintDialog
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    open={sprintDialogOpen}
                    onOpenChange={(open) => {
                        setSprintDialogOpen(open);

                        if (!open) {
                            setEditingSprint(null);
                        }
                    }}
                    sprint={editingSprint}
                />

                <ConfirmDialog
                    open={!!deletingEpic}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingEpic(null);
                        }
                    }}
                    title="Delete epic"
                    description={
                        deletingEpic
                            ? `Are you sure you want to delete "${deletingEpic.name}"? Tasks in this epic will not be deleted, but they will be unlinked.`
                            : ''
                    }
                    confirmText="Delete epic"
                    onConfirm={() => {
                        if (!deletingEpic) {
                            return;
                        }

                        const epicId = deletingEpic.id;
                        setDeletingEpic(null);

                        router.delete(
                            destroyEpic.url({
                                workspace: workspace.slug,
                                project: project.slug,
                                epic: epicId,
                            }),
                        );
                    }}
                />

                <ConfirmDialog
                    open={!!deletingSprint}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingSprint(null);
                        }
                    }}
                    title="Delete sprint"
                    description={
                        deletingSprint
                            ? `Are you sure you want to delete "${deletingSprint.name}"? Tasks in this sprint will not be deleted, but they will be unlinked.`
                            : ''
                    }
                    confirmText="Delete sprint"
                    onConfirm={() => {
                        if (!deletingSprint) {
                            return;
                        }

                        const sprintId = deletingSprint.id;
                        setDeletingSprint(null);

                        router.delete(
                            destroySprint.url({
                                workspace: workspace.slug,
                                project: project.slug,
                                sprint: sprintId,
                            }),
                        );
                    }}
                />

                <LabelDialog
                    workspaceSlug={workspace.slug}
                    projectSlug={project.slug}
                    open={labelDialogOpen}
                    onOpenChange={(open) => {
                        setLabelDialogOpen(open);

                        if (!open) {
                            setEditingLabel(null);
                        }
                    }}
                    label={editingLabel}
                />

                <ConfirmDialog
                    open={!!deletingLabel}
                    onOpenChange={(open) => {
                        if (!open) {
                            setDeletingLabel(null);
                        }
                    }}
                    title="Delete label"
                    description={
                        deletingLabel
                            ? `Are you sure you want to delete "${deletingLabel.name}"? Tasks will not be deleted, but they will lose this label.`
                            : ''
                    }
                    confirmText="Delete label"
                    onConfirm={() => {
                        if (!deletingLabel) {
                            return;
                        }

                        const labelId = deletingLabel.id;
                        setDeletingLabel(null);

                        router.delete(
                            destroyLabel.url({
                                workspace: workspace.slug,
                                project: project.slug,
                                label: labelId,
                            }),
                        );
                    }}
                />

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
