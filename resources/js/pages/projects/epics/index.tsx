'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Flag, Plus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EpicDialog } from '@/components/epic-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { show as projectShow } from '@/routes/projects';
import {
    show as epicShow,
    destroy as destroyEpic,
} from '@/routes/projects/epics';

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

interface Props {
    workspace: Workspace;
    project: ProjectData;
    epics: EpicRow[];
}

export default function EpicsIndex({ workspace, project, epics }: Props) {
    const [epicDialogOpen, setEpicDialogOpen] = useState(false);
    const [editingEpic, setEditingEpic] = useState<EpicRow | null>(null);
    const [deletingEpic, setDeletingEpic] = useState<EpicRow | null>(null);

    return (
        <>
            <Head title={`Epics — ${project.name}`} />

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
                    <span className="text-sm font-medium">Epics</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Epics
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {epics.length} epic
                                {epics.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingEpic(null);
                                setEpicDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            New epic
                        </Button>
                    </div>

                    {epics.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {epics.map((epic) => (
                                <div
                                    key={epic.id}
                                    className="group relative rounded-lg border p-4 transition-colors hover:border-primary/40 hover:bg-muted/50"
                                >
                                    <Link
                                        href={epicShow({
                                            workspace: workspace.slug,
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
                                                {formatDate(epic.start_date)}
                                            </span>
                                            <span>
                                                Due: {formatDate(epic.due_date)}
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
                                                setEditingEpic(epic);
                                                setEpicDialogOpen(true);
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
                                                setDeletingEpic(epic);
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
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Flag className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        No epics yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Create an epic to group related tasks
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingEpic(null);
                                        setEpicDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    New epic
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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
