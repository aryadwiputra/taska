'use no memo';

import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Shield,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { useState } from 'react';
import { FeatureGuide } from '@/components/feature-guide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface ApprovalFlow {
    id: number;
    name: string;
    column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    required_approvers: Array<{ type: string; value: string }>;
    min_approvals: number;
    enabled: boolean;
    created_at: string;
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

interface Option {
    value: string;
    label: string;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    flows: ApprovalFlow[];
    options: {
        columns: Array<{
            id: number;
            name: string;
            status_key: string;
            color: string | null;
        }>;
        members: Array<{ id: number; name: string; avatar: string | null }>;
        roles: Option[];
    };
}

const approvalGuide = {
    title: 'Approval Flows',
    description:
        'Set up approval gates that require team sign-off before tasks can move to certain columns.',
    sections: [
        {
            title: 'What are Approval Flows?',
            content:
                'Approval flows create mandatory review steps in your workflow. When a task reaches a column with an active approval flow, it cannot proceed until the required number of approvals are received.',
        },
        {
            title: 'How Approvals Work',
            content:
                'When someone tries to move a task to a column with an approval flow, the system creates pending approval requests for the designated approvers. The task can only move once the minimum number of approvals is met.',
        },
    ],
    items: [
        {
            heading: 'Approval Features',
            data: [
                {
                    term: 'Column Trigger',
                    description:
                        'Each flow is tied to a specific board column. When a task is moved to that column, the approval process begins automatically.',
                },
                {
                    term: 'Approvers',
                    description:
                        'Specify who can approve — individual users by email, or roles like "QA Lead" or "Project Manager". Role-based approvers resolve to all users with that role.',
                },
                {
                    term: 'Minimum Approvals',
                    description:
                        'Set how many approvals are required before the task can proceed. For example, require 2 out of 3 designated approvers to sign off.',
                },
                {
                    term: 'Enable/Disable',
                    description:
                        'Toggle flows on or off without deleting them. Disabled flows are ignored when tasks move to the column.',
                },
            ],
        },
    ],
    tips: [
        'Use approval flows for quality-critical columns like "Ready for QA" or "Needs Review".',
        'Combine with WIP limits to control both quality and throughput.',
        'Role-based approvers are more flexible than user-based — new team members automatically become eligible.',
        'Keep approval flows lightweight — too many gates can slow down your workflow.',
    ],
};

export default function ApprovalsSettings({
    workspace,
    project,
    flows: initialFlows,
    options,
}: Props) {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newFlow, setNewFlow] = useState({
        name: '',
        column_id: '',
        required_approvers: [] as Array<{ type: string; value: string }>,
        min_approvals: 1,
    });

    const handleCreateFlow = (e: React.FormEvent) => {
        e.preventDefault();

        router.post(
            `/workspaces/${workspace.slug}/projects/${project.slug}/approvals`,
            {
                name: newFlow.name,
                column_id: Number(newFlow.column_id),
                required_approvers: newFlow.required_approvers,
                min_approvals: newFlow.min_approvals,
            },
            {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    setNewFlow({
                        name: '',
                        column_id: '',
                        required_approvers: [],
                        min_approvals: 1,
                    });
                },
            },
        );
    };

    const handleToggleFlow = (flow: ApprovalFlow) => {
        router.put(
            `/workspaces/${workspace.slug}/projects/${project.slug}/approvals/${flow.id}`,
            { enabled: !flow.enabled },
            { preserveScroll: true },
        );
    };

    const handleDeleteFlow = (flowId: number) => {
        if (!confirm('Delete this approval flow?')) {
            return;
        }

        router.delete(
            `/workspaces/${workspace.slug}/projects/${project.slug}/approvals/${flowId}`,
        );
    };

    const addApprover = (type: string, value: string) => {
        setNewFlow({
            ...newFlow,
            required_approvers: [
                ...newFlow.required_approvers,
                { type, value },
            ],
        });
    };

    const removeApprover = (index: number) => {
        setNewFlow({
            ...newFlow,
            required_approvers: newFlow.required_approvers.filter(
                (_, i) => i !== index,
            ),
        });
    };

    const getApproverLabel = (approver: { type: string; value: string }) => {
        if (approver.type === 'role') {
            return `Role: ${approver.value}`;
        }

        const member = options.members.find(
            (m) => m.id === Number(approver.value.replace('user:', '')),
        );

        return member?.name ?? approver.value;
    };

    return (
        <>
            <Head title={`Approval Flows — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectShow.url({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">Approval Flows</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Approval Flows
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Require approval before tasks can move to certain
                            columns
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <FeatureGuide content={approvalGuide} />
                        <Dialog
                            open={showCreateDialog}
                            onOpenChange={setShowCreateDialog}
                        >
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 size-4" />
                                    New Flow
                                </Button>
                            </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create Approval Flow</DialogTitle>
                            </DialogHeader>
                            <form
                                onSubmit={handleCreateFlow}
                                className="space-y-4"
                            >
                                <div>
                                    <Label>Flow Name</Label>
                                    <Input
                                        value={newFlow.name}
                                        onChange={(e) =>
                                            setNewFlow({
                                                ...newFlow,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g., QA Approval"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label>Target Column</Label>
                                    <Select
                                        value={newFlow.column_id}
                                        onValueChange={(value) =>
                                            setNewFlow({
                                                ...newFlow,
                                                column_id: value,
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select column..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.columns.map((col) => (
                                                <SelectItem
                                                    key={col.id}
                                                    value={String(col.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="size-2 rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    col.color ??
                                                                    '#64748b',
                                                            }}
                                                        />
                                                        {col.name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Required Approvers</Label>
                                    <div className="mt-2 space-y-2">
                                        {newFlow.required_approvers.map(
                                            (approver, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Badge variant="outline">
                                                        {getApproverLabel(
                                                            approver,
                                                        )}
                                                    </Badge>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-6"
                                                        onClick={() =>
                                                            removeApprover(
                                                                index,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-3" />
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                        <div className="flex gap-2">
                                            <Select
                                                value=""
                                                onValueChange={(value) =>
                                                    addApprover(
                                                        'user',
                                                        `user:${value}`,
                                                    )
                                                }
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder="Add user..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.members.map(
                                                        (member) => (
                                                            <SelectItem
                                                                key={member.id}
                                                                value={String(
                                                                    member.id,
                                                                )}
                                                            >
                                                                {member.name}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            <Select
                                                value=""
                                                onValueChange={(value) =>
                                                    addApprover('role', value)
                                                }
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder="Add role..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.roles.map(
                                                        (role) => (
                                                            <SelectItem
                                                                key={role.value}
                                                                value={
                                                                    role.value
                                                                }
                                                            >
                                                                {role.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label>Minimum Approvals Required</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={newFlow.min_approvals}
                                        onChange={(e) =>
                                            setNewFlow({
                                                ...newFlow,
                                                min_approvals: Number(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className="mt-1 w-32"
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            setShowCreateDialog(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            !newFlow.name.trim() ||
                                            !newFlow.column_id ||
                                            newFlow.required_approvers
                                                .length === 0
                                        }
                                    >
                                        Create Flow
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </div>
                </div>

                <div className="space-y-3">
                    {initialFlows.map((flow) => (
                        <Card key={flow.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Shield
                                            className={`mt-1 size-5 ${flow.enabled ? 'text-blue-500' : 'text-muted-foreground'}`}
                                        />
                                        <div>
                                            <h3 className="font-medium">
                                                {flow.name}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    <div
                                                        className="mr-1 size-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                flow.column
                                                                    .color ??
                                                                '#64748b',
                                                        }}
                                                    />
                                                    {flow.column.name}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {flow.min_approvals}{' '}
                                                    approval
                                                    {flow.min_approvals !== 1
                                                        ? 's'
                                                        : ''}{' '}
                                                    required
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {flow.required_approvers.map(
                                                    (approver, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="secondary"
                                                            className="text-xs"
                                                        >
                                                            {getApproverLabel(
                                                                approver,
                                                            )}
                                                        </Badge>
                                                    ),
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                handleToggleFlow(flow)
                                            }
                                        >
                                            {flow.enabled ? (
                                                <ToggleRight className="size-4 text-blue-500" />
                                            ) : (
                                                <ToggleLeft className="size-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                handleDeleteFlow(flow.id)
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {initialFlows.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-16">
                            <Shield className="size-12 text-muted-foreground/40" />
                            <div className="text-center">
                                <p className="text-lg font-medium">
                                    No approval flows
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Create flows to require approval before
                                    tasks move to certain columns.
                                </p>
                            </div>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="mr-2 size-4" />
                                New Flow
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
