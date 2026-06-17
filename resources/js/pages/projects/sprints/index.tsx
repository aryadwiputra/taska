'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { SprintDialog } from '@/components/sprint-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as destroySprint,
    show as sprintShow,
} from '@/routes/projects/sprints';

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
    sprints: SprintRow[];
}

export default function SprintsIndex({ workspace, project, sprints }: Props) {
    const [sprintDialogOpen, setSprintDialogOpen] = useState(false);
    const [editingSprint, setEditingSprint] = useState<SprintRow | null>(null);
    const [deletingSprint, setDeletingSprint] = useState<SprintRow | null>(
        null,
    );

    return (
        <>
            <Head title={`Sprints — ${project.name}`} />

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
                    <span className="text-sm font-medium">Sprints</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Sprints
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {sprints.length} sprint
                                {sprints.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingSprint(null);
                                setSprintDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            New sprint
                        </Button>
                    </div>

                    {sprints.length > 0 ? (
                        <div className="flex flex-col rounded-md border">
                            {sprints.map((sprint) => (
                                <div
                                    key={sprint.id}
                                    className="group relative border-b p-4 transition-colors last:border-0 hover:bg-muted/50"
                                >
                                    <Link
                                        href={sprintShow({
                                            workspace: workspace.slug,
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
                                                {formatDate(sprint.start_date)}
                                            </span>
                                            <span>
                                                End:{' '}
                                                {formatDate(sprint.end_date)}
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
                                                setEditingSprint(sprint);
                                                setSprintDialogOpen(true);
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
                                                setDeletingSprint(sprint);
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
                                <CalendarDays className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        No sprints yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Create a sprint to plan a time-boxed
                                        iteration
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingSprint(null);
                                        setSprintDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    New sprint
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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
