'use no memo';

import { Head, router } from '@inertiajs/react';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { FeatureGuide, InlineTooltip } from '@/components/feature-guide';
import type { GuideContent } from '@/components/feature-guide';
import { PageHeader } from '@/components/page-header';
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

function useSlaGuide(t: (key: string) => string): GuideContent {
    return {
        title: t('guide.sla.title'),
        description: t('guide.sla.description'),
        sections: [
            {
                title: t('guide.sla.section_what'),
                content: t('guide.sla.content_what'),
            },
            {
                title: t('guide.sla.section_breach'),
                content: t('guide.sla.content_breach'),
            },
        ],
        items: [
            {
                heading: t('guide.sla.heading_features'),
                data: [
                    {
                        term: t('guide.sla.response_time'),
                        description: t('guide.sla.response_time_desc'),
                    },
                    {
                        term: t('guide.sla.resolution_time'),
                        description: t('guide.sla.resolution_time_desc'),
                    },
                    {
                        term: t('guide.sla.breach_detection'),
                        description: t('guide.sla.breach_detection_desc'),
                    },
                    {
                        term: t('guide.sla.policy_name'),
                        description: t('guide.sla.policy_name_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.sla.tip_1'),
            t('guide.sla.tip_2'),
            t('guide.sla.tip_3'),
            t('guide.sla.tip_4'),
        ],
        tipsHeading: t('guide.sla.tips_title'),
    };
}

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
    const { t } = useTranslation();
    const slaGuide = useSlaGuide(t);
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
                <div className="mx-auto w-full max-w-3xl">
                    <PageHeader
                        className="mb-6"
                        title={t('sla_page.title')}
                        description={t('sla_page.description')}
                        backHref={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        backLabel={project.name}
                        actions={
                            <>
                                <FeatureGuide content={slaGuide} />
                                <Button
                                    size="sm"
                                    onClick={openCreate}
                                    disabled={availableTypes.length === 0}
                                >
                                    <Plus className="size-3" />
                                    {t('sla_page.add_policy')}
                                </Button>
                            </>
                        }
                    />

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
                                            {t('sla_page.response')}{' '}
                                            <span className="font-medium text-foreground">
                                                {policy.response_hours}h
                                            </span>
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {t('sla_page.resolution')}{' '}
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
                                                ? t('sla_page.enabled')
                                                : t('sla_page.disabled')}
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
                        <EmptyState
                            title={t('sla_page.no_policies')}
                            description={t('sla_page.no_policies_description')}
                            action={
                                <Button
                                    size="sm"
                                    onClick={openCreate}
                                    disabled={availableTypes.length === 0}
                                >
                                    <Plus className="size-3" />
                                    {t('sla_page.add_policy')}
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editing
                                ? t('sla_page.edit_policy')
                                : t('sla_page.add_sla_policy')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label>{t('sla_page.task_type')}</Label>
                            <Select
                                value={taskTypeId}
                                onValueChange={setTaskTypeId}
                                disabled={!!editing}
                            >
                                <SelectTrigger>
                                    <SelectValue
                                        placeholder={t(
                                            'sla_page.select_task_type',
                                        )}
                                    />
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
                                    {t('sla_page.response_hours')}
                                    <InlineTooltip
                                        content={t(
                                            'sla_page.response_hours_tooltip',
                                        )}
                                    />
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
                                    {t('sla_page.resolution_hours')}
                                    <InlineTooltip
                                        content={t(
                                            'sla_page.resolution_hours_tooltip',
                                        )}
                                    />
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
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                taskTypeId === 'none' ||
                                responseHours < 1 ||
                                resolutionHours < 1
                            }
                        >
                            {editing ? t('common.save') : t('common.add')}
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
                title={t('sla_page.delete_sla_policy')}
                description={
                    deleting
                        ? t('sla_page.delete_sla_description', {
                              name: deleting.task_type.name,
                          })
                        : ''
                }
                confirmText={t('common.delete')}
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
