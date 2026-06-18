'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { FeatureGuide, InlineTooltip } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as destroySla,
    store as storeSla,
    update as updateSla,
} from '@/routes/projects/sla-policies';

const slaGuide: GuideContent = {
    title: 'SLA Policies',
    description:
        'Define response and resolution time targets for different task types.',
    sections: [
        {
            title: 'What is an SLA?',
            content:
                "A Service Level Agreement (SLA) sets time targets for how quickly tasks should be responded to and resolved. When a task is created, the SLA timer starts. If the target isn't met, the task is flagged as breached.",
        },
        {
            title: 'How it works',
            content:
                '1. Create a policy for each task type (Bug, Feature, etc.).\n2. Set the response time — how long before the first response is expected.\n3. Set the resolution time — how long before the task should be completed.\n4. The system checks for breaches every hour and logs them as task activity.',
        },
    ],
    items: [
        {
            heading: 'Time Fields',
            data: [
                {
                    term: 'Response Time (hours)',
                    description:
                        'Maximum hours before the first response is expected. Measured from task creation. Set to 0 to disable.',
                },
                {
                    term: 'Resolution Time (hours)',
                    description:
                        'Maximum hours before the task should be resolved (marked as done). Measured from task creation. Set to 0 to disable.',
                },
            ],
        },
    ],
    tips: [
        'Each task type can only have one SLA policy. Create separate policies for Bugs, Features, etc.',
        "SLA breaches are detected hourly by a background job. They won't appear instantly.",
        "Breach events are logged in the task's activity feed for auditing.",
        'Disable a policy temporarily without deleting it using the enabled toggle.',
    ],
};

interface TaskType {
    id: number;
    name: string;
    key: string;
    color: string | null;
}

interface SlaPolicyData {
    id: number;
    task_type: TaskType;
    response_hours: number;
    resolution_hours: number;
    enabled: boolean;
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
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    policies: SlaPolicyData[];
    taskTypes: TaskType[];
}

export default function SlaSettings({
    workspace,
    project,
    policies,
    taskTypes,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<SlaPolicyData | null>(null);
    const [deleting, setDeleting] = useState<SlaPolicyData | null>(null);
    const [taskTypeId, setTaskTypeId] = useState<string>('none');
    const [responseHours, setResponseHours] = useState(4);
    const [resolutionHours, setResolutionHours] = useState(24);

    const usedTypeIds = policies.map((p) => p.task_type.id);
    const availableTypes = taskTypes.filter(
        (t) => !usedTypeIds.includes(t.id) || editing?.task_type.id === t.id,
    );

    const openCreate = () => {
        setEditing(null);
        setTaskTypeId('none');
        setResponseHours(4);
        setResolutionHours(24);
        setDialogOpen(true);
    };

    const openEdit = (policy: SlaPolicyData) => {
        setEditing(policy);
        setTaskTypeId(String(policy.task_type.id));
        setResponseHours(policy.response_hours);
        setResolutionHours(policy.resolution_hours);
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        const data = {
            task_type_id: Number(taskTypeId),
            response_hours: responseHours,
            resolution_hours: resolutionHours,
        };

        if (editing) {
            router.put(
                updateSla.url({
                    workspace: workspace.slug,
                    project: project.slug,
                    slaPolicy: editing.id,
                }),
                data,
                { preserveScroll: true, onSuccess: () => setDialogOpen(false) },
            );
        } else {
            router.post(
                storeSla.url({
                    workspace: workspace.slug,
                    project: project.slug,
                }),
                data,
                { preserveScroll: true, onSuccess: () => setDialogOpen(false) },
            );
        }
    };

    return (
        <>
            <Head title={`SLA Policies — ${project.name}`} />

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
                    <span className="text-sm text-muted-foreground">
                        SLA Policies
                    </span>
                </div>

                <div className="mx-auto w-full max-w-3xl">
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                SLA Policies
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Set response and resolution time targets per
                                task type.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <FeatureGuide content={slaGuide} />
                            <Button
                                size="sm"
                                onClick={openCreate}
                                disabled={availableTypes.length === 0}
                            >
                                <Plus className="size-3" />
                                Add policy
                            </Button>
                        </div>
                    </div>

                    {policies.length > 0 ? (
                        <div className="flex flex-col rounded-md border">
                            {policies.map((policy) => (
                                <div
                                    key={policy.id}
                                    className="group flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0 hover:bg-muted/50"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant="outline"
                                            style={
                                                policy.task_type.color
                                                    ? {
                                                          borderColor:
                                                              policy.task_type
                                                                  .color,
                                                          color: policy
                                                              .task_type.color,
                                                      }
                                                    : undefined
                                            }
                                        >
                                            {policy.task_type.name}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            Response:{' '}
                                            <span className="font-medium text-foreground">
                                                {policy.response_hours}h
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            Resolution:{' '}
                                            <span className="font-medium text-foreground">
                                                {policy.resolution_hours}h
                                            </span>
                                        </span>
                                        <Badge
                                            variant={
                                                policy.enabled
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                            className="text-xs"
                                        >
                                            {policy.enabled
                                                ? 'Enabled'
                                                : 'Disabled'}
                                        </Badge>
                                    </div>
                                    <div className="hidden gap-1 group-hover:flex">
                                        <button
                                            type="button"
                                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                            title="Edit policy"
                                            onClick={() => openEdit(policy)}
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
                                            title="Delete policy"
                                            onClick={() => setDeleting(policy)}
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-16 text-center">
                            <div>
                                <p className="text-sm font-medium">
                                    No SLA policies yet
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Add policies to track response and
                                    resolution time targets.
                                </p>
                            </div>
                            <Button
                                size="sm"
                                onClick={openCreate}
                                disabled={availableTypes.length === 0}
                            >
                                <Plus className="size-3" />
                                Add policy
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Edit SLA policy' : 'Add SLA policy'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>Task Type</Label>
                            <Select
                                value={taskTypeId}
                                onValueChange={setTaskTypeId}
                                disabled={!!editing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select task type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableTypes.map((t) => (
                                        <SelectItem
                                            key={t.id}
                                            value={String(t.id)}
                                        >
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="response-hours"
                                    className="flex items-center gap-1.5"
                                >
                                    Response (hours)
                                    <InlineTooltip content="Maximum hours before the first response is expected. Measured from task creation." />
                                </Label>
                                <Input
                                    id="response-hours"
                                    type="number"
                                    min={1}
                                    value={responseHours}
                                    onChange={(e) =>
                                        setResponseHours(Number(e.target.value))
                                    }
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="resolution-hours"
                                    className="flex items-center gap-1.5"
                                >
                                    Resolution (hours)
                                    <InlineTooltip content="Maximum hours before the task should be completed. Measured from task creation." />
                                </Label>
                                <Input
                                    id="resolution-hours"
                                    type="number"
                                    min={1}
                                    value={resolutionHours}
                                    onChange={(e) =>
                                        setResolutionHours(
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                taskTypeId === 'none' ||
                                responseHours < 1 ||
                                resolutionHours < 1
                            }
                        >
                            {editing ? 'Save' : 'Add'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleting(null);
                    }
                }}
                title="Delete SLA policy"
                description={
                    deleting
                        ? `Remove the SLA policy for "${deleting.task_type.name}"?`
                        : ''
                }
                confirmText="Delete"
                onConfirm={() => {
                    if (!deleting) {
                        return;
                    }

                    const id = deleting.id;
                    setDeleting(null);

                    router.delete(
                        destroySla.url({
                            workspace: workspace.slug,
                            project: project.slug,
                            slaPolicy: id,
                        }),
                    );
                }}
            />
        </>
    );
}
