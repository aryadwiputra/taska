'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Tag } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { LabelDialog } from '@/components/label-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as destroyLabel,
    show as labelShow,
} from '@/routes/projects/labels';

interface LabelRow {
    id: number;
    name: string;
    slug: string;
    color: string | null;
    tasks_count: number;
}

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
    labels: LabelRow[];
}

export default function LabelsIndex({ workspace, project, labels }: Props) {
    const [labelDialogOpen, setLabelDialogOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<LabelRow | null>(null);
    const [deletingLabel, setDeletingLabel] = useState<LabelRow | null>(null);

    return (
        <>
            <Head title={`Labels — ${project.name}`} />

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
                    <span className="text-sm font-medium">Labels</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Labels
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {labels.length} label
                                {labels.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingLabel(null);
                                setLabelDialogOpen(true);
                            }}
                        >
                            <Plus className="mr-1.5 size-3.5" />
                            New label
                        </Button>
                    </div>

                    {labels.length > 0 ? (
                        <div className="flex flex-col rounded-md border">
                            {labels.map((label) => (
                                <div
                                    key={label.id}
                                    className="group relative flex items-center justify-between border-b px-4 py-3 last:border-0"
                                >
                                    <Link
                                        href={labelShow({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                            label: label.id,
                                        })}
                                        className="flex flex-1 items-center gap-3 hover:underline"
                                    >
                                        <span
                                            className="size-3 shrink-0 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    label.color ?? '#64748b',
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
                                            {label.tasks_count !== 1 ? 's' : ''}
                                        </Badge>
                                    </Link>
                                    <div className="hidden gap-1 group-hover:flex">
                                        <button
                                            type="button"
                                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            title="Edit label"
                                            onClick={() => {
                                                setEditingLabel(label);
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
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            title="Delete label"
                                            onClick={() =>
                                                setDeletingLabel(label)
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
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                                <Tag className="size-8 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">
                                        No labels yet
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Create a label to categorize tasks
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setEditingLabel(null);
                                        setLabelDialogOpen(true);
                                    }}
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    New label
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

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
        </>
    );
}
