'use no memo';

import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, Shield, ToggleLeft, ToggleRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { FeatureGuide } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
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

function useApprovalGuide(t: (key: string) => string): GuideContent {
    return {
        title: t('guide.approval.title'),
        description: t('guide.approval.description'),
        sections: [
            {
                title: t('guide.approval.section_what'),
                content: t('guide.approval.content_what'),
            },
            {
                title: t('guide.approval.section_how'),
                content: t('guide.approval.content_how'),
            },
        ],
        items: [
            {
                heading: t('guide.approval.heading_features'),
                data: [
                    {
                        term: t('guide.approval.column_trigger'),
                        description: t('guide.approval.column_trigger_desc'),
                    },
                    {
                        term: t('guide.approval.approvers'),
                        description: t('guide.approval.approvers_desc'),
                    },
                    {
                        term: t('guide.approval.min_approvals'),
                        description: t('guide.approval.min_approvals_desc'),
                    },
                    {
                        term: t('guide.approval.enable_disable'),
                        description: t('guide.approval.enable_disable_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.approval.tip_1'),
            t('guide.approval.tip_2'),
            t('guide.approval.tip_3'),
            t('guide.approval.tip_4'),
        ],
        tipsHeading: t('guide.approval.tips_title'),
    };
}

export default function ApprovalsSettings({
    workspace,
    project,
    flows: initialFlows,
    options,
}: Props) {
    const { t } = useTranslation();
    const approvalGuide = useApprovalGuide(t);
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
        if (!confirm(t('approvals_page.delete_confirm'))) {
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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('approvals_page.title')}
                    description={t('approvals_page.description')}
                    backHref={projectShow.url({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    actions={
                        <>
                            <FeatureGuide content={approvalGuide} />
                            <Dialog
                                open={showCreateDialog}
                                onOpenChange={setShowCreateDialog}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 size-4" />
                                        {t('approvals_page.new_flow')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t('approvals_page.create_flow')}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form
                                        onSubmit={handleCreateFlow}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>
                                                {t('approvals_page.flow_name')}
                                            </Label>
                                            <Input
                                                value={newFlow.name}
                                                onChange={(e) =>
                                                    setNewFlow({
                                                        ...newFlow,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    'approvals_page.flow_name_placeholder',
                                                )}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label>
                                                {t(
                                                    'approvals_page.target_column',
                                                )}
                                            </Label>
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
                                                    <SelectValue
                                                        placeholder={t(
                                                            'approvals_page.select_column',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.columns.map(
                                                        (col) => (
                                                            <SelectItem
                                                                key={col.id}
                                                                value={String(
                                                                    col.id,
                                                                )}
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
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>
                                                {t(
                                                    'approvals_page.required_approvers',
                                                )}
                                            </Label>
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
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            addApprover(
                                                                'user',
                                                                `user:${value}`,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'approvals_page.add_user',
                                                                )}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {options.members.map(
                                                                (member) => (
                                                                    <SelectItem
                                                                        key={
                                                                            member.id
                                                                        }
                                                                        value={String(
                                                                            member.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            member.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <Select
                                                        value=""
                                                        onValueChange={(
                                                            value,
                                                        ) =>
                                                            addApprover(
                                                                'role',
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger className="w-48">
                                                            <SelectValue
                                                                placeholder={t(
                                                                    'approvals_page.add_role',
                                                                )}
                                                            />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {options.roles.map(
                                                                (role) => (
                                                                    <SelectItem
                                                                        key={
                                                                            role.value
                                                                        }
                                                                        value={
                                                                            role.value
                                                                        }
                                                                    >
                                                                        {
                                                                            role.label
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <Label>
                                                {t(
                                                    'approvals_page.minimum_approvals',
                                                )}
                                            </Label>
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
                                                {t('common.cancel')}
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
                                                {t(
                                                    'approvals_page.create_flow_button',
                                                )}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </>
                    }
                />

                <div className="space-y-3">
                    {initialFlows.map((flow) => (
                        <Card key={flow.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Shield
                                            className={`mt-1 size-5 ${flow.enabled ? 'text-primary' : 'text-muted-foreground'}`}
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
                                                <ToggleRight className="size-4 text-primary" />
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
                        <EmptyState
                            icon={Shield}
                            title={t('approvals_page.no_flows')}
                            description={t(
                                'approvals_page.no_flows_description',
                            )}
                            action={
                                <Button
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="mr-2 size-4" />
                                    {t('approvals_page.new_flow')}
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}
