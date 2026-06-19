'use no memo';

import { Head, router } from '@inertiajs/react';
import { Plus, Zap, Trash2, Play, Pause } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { FeatureGuide, InlineTooltip } from '@/components/feature-guide';
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
import {
    store as automationStore,
    update as automationUpdate,
    destroy as automationDestroy,
    test as automationTest,
} from '@/routes/projects/automation';

function useAutomationGuide(t: (key: string) => string): GuideContent {
    return {
        title: t('guide.automation.title'),
        description: t('guide.automation.description'),
        sections: [
            {
                title: t('automation.how_it_works'),
                content: t('automation.how_it_works_content'),
            },
            {
                title: t('automation.creating_rule'),
                content: t('automation.creating_rule_content'),
            },
        ],
        items: [
            {
                heading: t('guide.automation.section_triggers'),
                data: [
                    {
                        term: t('automation.trigger_task_created'),
                        description: t('automation.trigger_task_created_desc'),
                    },
                    {
                        term: t('automation.trigger_status_changed'),
                        description: t(
                            'automation.trigger_status_changed_desc',
                        ),
                    },
                    {
                        term: t('automation.trigger_priority_changed'),
                        description: t(
                            'automation.trigger_priority_changed_desc',
                        ),
                    },
                    {
                        term: t('automation.trigger_assignee_added'),
                        description: t(
                            'automation.trigger_assignee_added_desc',
                        ),
                    },
                    {
                        term: t('automation.trigger_due_date_passed'),
                        description: t(
                            'automation.trigger_due_date_passed_desc',
                        ),
                    },
                ],
            },
            {
                heading: t('automation.condition_fields'),
                data: [
                    {
                        term: t('automation.field_status'),
                        description: t('automation.field_status_desc'),
                    },
                    {
                        term: t('automation.field_priority'),
                        description: t('automation.field_priority_desc'),
                    },
                    {
                        term: t('automation.field_assignee'),
                        description: t('automation.field_assignee_desc'),
                    },
                    {
                        term: t('automation.field_label'),
                        description: t('automation.field_label_desc'),
                    },
                    {
                        term: t('automation.field_story_points'),
                        description: t('automation.field_story_points_desc'),
                    },
                ],
            },
            {
                heading: t('automation.condition_operators'),
                data: [
                    {
                        term: t('automation.op_equals'),
                        description: t('automation.op_equals_desc'),
                    },
                    {
                        term: t('automation.op_contains'),
                        description: t('automation.op_contains_desc'),
                    },
                    {
                        term: t('automation.op_comparison'),
                        description: t('automation.op_comparison_desc'),
                    },
                    {
                        term: t('automation.op_in'),
                        description: t('automation.op_in_desc'),
                    },
                ],
            },
            {
                heading: t('automation.action_types'),
                data: [
                    {
                        term: t('automation.action_assign_user'),
                        description: t('automation.action_assign_user_desc'),
                    },
                    {
                        term: t('automation.action_add_label'),
                        description: t('automation.action_add_label_desc'),
                    },
                    {
                        term: t('automation.action_remove_label'),
                        description: t('automation.action_remove_label_desc'),
                    },
                    {
                        term: t('automation.action_set_priority'),
                        description: t('automation.action_set_priority_desc'),
                    },
                    {
                        term: t('automation.action_move_column'),
                        description: t('automation.action_move_column_desc'),
                    },
                    {
                        term: t('automation.action_send_notification'),
                        description: t(
                            'automation.action_send_notification_desc',
                        ),
                    },
                    {
                        term: t('automation.action_add_comment'),
                        description: t('automation.action_add_comment_desc'),
                    },
                ],
            },
        ],
        tips: [
            t('guide.automation.tip_1'),
            t('guide.automation.tip_2'),
            t('guide.automation.tip_3'),
            t('guide.automation.tip_4'),
        ],
        tipsHeading: t('guide.automation.tips_title'),
    };
}

interface AutomationRule {
    id: number;
    name: string;
    enabled: boolean;
    trigger_event: string;
    conditions: Array<{
        field: string;
        operator: string;
        value: string;
    }> | null;
    actions: Array<{ type: string; value: string }> | null;
    priority: number;
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
    rules: AutomationRule[];
    options: {
        trigger_events: Option[];
        condition_fields: Option[];
        condition_operators: Option[];
        action_types: Option[];
        board_columns: Array<{
            id: number;
            name: string;
            status_key: string;
            color: string | null;
        }>;
        priorities: Array<{
            id: number;
            name: string;
            key: string;
            color: string | null;
        }>;
        labels: Array<{
            id: number;
            name: string;
            slug: string;
            color: string | null;
        }>;
        members: Array<{ id: number; name: string; avatar: string | null }>;
    };
}

export default function AutomationIndex({
    workspace,
    project,
    rules: initialRules,
    options,
}: Props) {
    const { t } = useTranslation();
    const automationGuide = useAutomationGuide(t);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newRule, setNewRule] = useState({
        name: '',
        trigger_event: '',
        conditions: [] as Array<{
            field: string;
            operator: string;
            value: string;
        }>,
        actions: [] as Array<{ type: string; value: string }>,
    });

    const handleCreateRule = (e: React.FormEvent) => {
        e.preventDefault();

        router.post(
            automationStore({
                workspace: workspace.slug,
                project: project.slug,
            }).url,
            {
                name: newRule.name,
                trigger_event: newRule.trigger_event,
                conditions: newRule.conditions,
                actions: newRule.actions,
            },
            {
                onSuccess: () => {
                    setShowCreateDialog(false);
                    setNewRule({
                        name: '',
                        trigger_event: '',
                        conditions: [],
                        actions: [],
                    });
                },
            },
        );
    };

    const handleToggleRule = (rule: AutomationRule) => {
        router.put(
            automationUpdate({
                workspace: workspace.slug,
                project: project.slug,
                rule: rule.id,
            }).url,
            { enabled: !rule.enabled },
            { preserveScroll: true },
        );
    };

    const handleDeleteRule = (ruleId: number) => {
        if (!confirm(t('automation.delete_confirm'))) {
            return;
        }

        router.delete(
            automationDestroy({
                workspace: workspace.slug,
                project: project.slug,
                rule: ruleId,
            }).url,
        );
    };

    const handleTestRule = (ruleId: number) => {
        router.post(
            automationTest({
                workspace: workspace.slug,
                project: project.slug,
                rule: ruleId,
            }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const result = (
                        page.props as {
                            test_result?: {
                                matching_count: number;
                                total_tasks: number;
                            };
                        }
                    ).test_result;

                    if (result) {
                        alert(
                            t('automation.test_result', {
                                matching: result.matching_count,
                                total: result.total_tasks,
                            }),
                        );
                    }
                },
            },
        );
    };

    const getTriggerLabel = (value: string) =>
        options.trigger_events.find((e) => e.value === value)?.label ?? value;

    const getActionLabel = (type: string) =>
        options.action_types.find((a) => a.value === type)?.label ?? type;

    return (
        <>
            <Head title={`Automation — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('automation.title')}
                    description={t('automation.description')}
                    backHref={projectShow.url({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    actions={
                        <>
                            <FeatureGuide content={automationGuide} />
                            <Dialog
                                open={showCreateDialog}
                                onOpenChange={setShowCreateDialog}
                            >
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus className="mr-2 size-4" />
                                        {t('automation.new_rule')}
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            {t(
                                                'automation.create_automation_rule',
                                            )}
                                        </DialogTitle>
                                    </DialogHeader>
                                    <form
                                        onSubmit={handleCreateRule}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <Label>
                                                {t('automation.rule_name')}
                                            </Label>
                                            <Input
                                                value={newRule.name}
                                                onChange={(e) =>
                                                    setNewRule({
                                                        ...newRule,
                                                        name: e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    'automation.rule_name_placeholder',
                                                )}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label className="flex items-center gap-1.5">
                                                {t('automation.trigger_event')}
                                                <InlineTooltip
                                                    content={t(
                                                        'automation.trigger_event_tooltip',
                                                    )}
                                                />
                                            </Label>
                                            <Select
                                                value={newRule.trigger_event}
                                                onValueChange={(value) =>
                                                    setNewRule({
                                                        ...newRule,
                                                        trigger_event: value,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue
                                                        placeholder={t(
                                                            'automation.select_trigger',
                                                        )}
                                                    />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {options.trigger_events.map(
                                                        (event) => (
                                                            <SelectItem
                                                                key={
                                                                    event.value
                                                                }
                                                                value={
                                                                    event.value
                                                                }
                                                            >
                                                                {event.label}
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="flex items-center gap-1.5">
                                                {t('automation.conditions')}
                                                <InlineTooltip
                                                    content={t(
                                                        'automation.conditions_tooltip',
                                                    )}
                                                />
                                            </Label>
                                            <div className="mt-2 space-y-2">
                                                {newRule.conditions.map(
                                                    (condition, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Select
                                                                value={
                                                                    condition.field
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...newRule.conditions,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ].field =
                                                                        value;
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        conditions:
                                                                            updated,
                                                                    });
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-40">
                                                                    <SelectValue placeholder="Field" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.condition_fields.map(
                                                                        (
                                                                            field,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    field.value
                                                                                }
                                                                                value={
                                                                                    field.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    field.label
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>

                                                            <Select
                                                                value={
                                                                    condition.operator
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...newRule.conditions,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ].operator =
                                                                        value;
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        conditions:
                                                                            updated,
                                                                    });
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-36">
                                                                    <SelectValue placeholder="Operator" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.condition_operators.map(
                                                                        (
                                                                            op,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    op.value
                                                                                }
                                                                                value={
                                                                                    op.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    op.label
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>

                                                            <Input
                                                                value={
                                                                    condition.value
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...newRule.conditions,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ].value =
                                                                        e.target.value;
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        conditions:
                                                                            updated,
                                                                    });
                                                                }}
                                                                placeholder="Value"
                                                                className="flex-1"
                                                            />

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const updated =
                                                                        newRule.conditions.filter(
                                                                            (
                                                                                _,
                                                                                i,
                                                                            ) =>
                                                                                i !==
                                                                                index,
                                                                        );
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        conditions:
                                                                            updated,
                                                                    });
                                                                }}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setNewRule({
                                                            ...newRule,
                                                            conditions: [
                                                                ...newRule.conditions,
                                                                {
                                                                    field: 'status',
                                                                    operator:
                                                                        'equals',
                                                                    value: '',
                                                                },
                                                            ],
                                                        })
                                                    }
                                                >
                                                    {t(
                                                        'automation.add_condition',
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="flex items-center gap-1.5">
                                                {t('automation.actions')}
                                                <InlineTooltip
                                                    content={t(
                                                        'automation.actions_tooltip',
                                                    )}
                                                />
                                            </Label>
                                            <div className="mt-2 space-y-2">
                                                {newRule.actions.map(
                                                    (action, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Select
                                                                value={
                                                                    action.type
                                                                }
                                                                onValueChange={(
                                                                    value,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...newRule.actions,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ].type =
                                                                        value;
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        actions:
                                                                            updated,
                                                                    });
                                                                }}
                                                            >
                                                                <SelectTrigger className="w-44">
                                                                    <SelectValue
                                                                        placeholder={t(
                                                                            'automation.action_type',
                                                                        )}
                                                                    />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {options.action_types.map(
                                                                        (
                                                                            type,
                                                                        ) => (
                                                                            <SelectItem
                                                                                key={
                                                                                    type.value
                                                                                }
                                                                                value={
                                                                                    type.value
                                                                                }
                                                                            >
                                                                                {
                                                                                    type.label
                                                                                }
                                                                            </SelectItem>
                                                                        ),
                                                                    )}
                                                                </SelectContent>
                                                            </Select>

                                                            <Input
                                                                value={
                                                                    action.value
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    const updated =
                                                                        [
                                                                            ...newRule.actions,
                                                                        ];
                                                                    updated[
                                                                        index
                                                                    ].value =
                                                                        e.target.value;
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        actions:
                                                                            updated,
                                                                    });
                                                                }}
                                                                placeholder={t(
                                                                    'automation.value_placeholder',
                                                                )}
                                                                className="flex-1"
                                                            />
                                                            <InlineTooltip
                                                                content={t(
                                                                    'automation.value_tooltip',
                                                                )}
                                                            />

                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const updated =
                                                                        newRule.actions.filter(
                                                                            (
                                                                                _,
                                                                                i,
                                                                            ) =>
                                                                                i !==
                                                                                index,
                                                                        );
                                                                    setNewRule({
                                                                        ...newRule,
                                                                        actions:
                                                                            updated,
                                                                    });
                                                                }}
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    ),
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        setNewRule({
                                                            ...newRule,
                                                            actions: [
                                                                ...newRule.actions,
                                                                {
                                                                    type: 'assign',
                                                                    value: '',
                                                                },
                                                            ],
                                                        })
                                                    }
                                                >
                                                    {t('automation.add_action')}
                                                </Button>
                                            </div>
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
                                                    !newRule.name.trim() ||
                                                    !newRule.trigger_event
                                                }
                                            >
                                                {t('automation.create_rule')}
                                            </Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </>
                    }
                />

                <div className="space-y-3">
                    {initialRules.map((rule) => (
                        <Card key={rule.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Zap
                                            className={`mt-1 size-5 ${rule.enabled ? 'text-primary' : 'text-muted-foreground'}`}
                                        />
                                        <div>
                                            <h3 className="font-medium">
                                                {rule.name}
                                            </h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {getTriggerLabel(
                                                        rule.trigger_event,
                                                    )}
                                                </Badge>
                                                {rule.conditions &&
                                                    rule.conditions.length >
                                                        0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                rule.conditions
                                                                    .length
                                                            }{' '}
                                                            condition
                                                            {rule.conditions
                                                                .length !== 1
                                                                ? 's'
                                                                : ''}
                                                        </span>
                                                    )}
                                                {rule.actions &&
                                                    rule.actions.length > 0 && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                rule.actions
                                                                    .length
                                                            }{' '}
                                                            action
                                                            {rule.actions
                                                                .length !== 1
                                                                ? 's'
                                                                : ''}
                                                        </span>
                                                    )}
                                            </div>
                                            {rule.actions &&
                                                rule.actions.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {rule.actions.map(
                                                            (action, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {getActionLabel(
                                                                        action.type,
                                                                    )}
                                                                </Badge>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleTestRule(rule.id)
                                            }
                                        >
                                            <Play className="mr-1 size-3" />
                                            {t('automation.test')}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8"
                                            onClick={() =>
                                                handleToggleRule(rule)
                                            }
                                        >
                                            {rule.enabled ? (
                                                <Pause className="size-4 text-primary" />
                                            ) : (
                                                <Play className="size-4 text-muted-foreground" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                handleDeleteRule(rule.id)
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {initialRules.length === 0 && (
                        <EmptyState
                            icon={Zap}
                            title={t('automation.no_rules')}
                            description={t('automation.no_rules_description')}
                            action={
                                <Button
                                    onClick={() => setShowCreateDialog(true)}
                                >
                                    <Plus className="mr-2 size-4" />
                                    {t('automation.new_rule')}
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
        </>
    );
}
