import { router } from '@inertiajs/react';
import { Bell, Plus, Trash2, Zap } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    store as notificationRuleStore,
    destroy as notificationRuleDestroy,
    toggle as notificationRuleToggle,
} from '@/routes/projects/notification-rules';

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface ProjectData {
    id: number;
    name: string;
    slug: string;
}

interface NotificationRuleData {
    id: number;
    name: string;
    event_type: string;
    conditions: Array<{
        field: string;
        operator: string;
        value: string | number;
    }> | null;
    channels: string[];
    enabled: boolean;
    project_id: number | null;
    created_at: string;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    rules: NotificationRuleData[];
}

const EVENT_TYPES = [
    { value: 'task.status_changed', label: 'Task status changed' },
    { value: 'task.priority_changed', label: 'Task priority changed' },
    { value: 'task.assignee_added', label: 'Task assignee added' },
    { value: 'task.created', label: 'Task created' },
    { value: 'task.due_date_passed', label: 'Task due date passed' },
    { value: 'task.commented', label: 'Task commented' },
    { value: 'task.mentioned', label: 'Task mentioned' },
];

const CONDITION_FIELDS = [
    { value: 'status', label: 'Status' },
    { value: 'priority', label: 'Priority' },
    { value: 'board_column_id', label: 'Board Column' },
    { value: 'story_points', label: 'Story Points' },
];

const OPERATORS = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'in', label: 'In' },
];

export function NotificationRulesTab({
    workspace,
    project,
    rules: initialRules,
}: Props) {
    const { t } = useTranslation();
    const [rules, setRules] = useState(initialRules);
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [eventType, setEventType] = useState('');
    const [channels, setChannels] = useState<string[]>(['in_app']);
    const [projectScope, setProjectScope] = useState('this_project');
    const [conditions, setConditions] = useState<
        Array<{ field: string; operator: string; value: string }>
    >([]);

    const handleCreate = () => {
        if (!name || !eventType) {
            return;
        }

        router.post(
            notificationRuleStore({
                workspace: workspace.slug,
                project: project.slug,
            }).url,
            {
                name,
                event_type: eventType,
                channels,
                project_scope: projectScope,
                conditions: conditions.length > 0 ? conditions : null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowForm(false);
                    setName('');
                    setEventType('');
                    setChannels(['in_app']);
                    setProjectScope('this_project');
                    setConditions([]);
                },
            },
        );
    };

    const handleToggle = (ruleId: number) => {
        router.post(
            notificationRuleToggle({
                workspace: workspace.slug,
                project: project.slug,
                rule: ruleId,
            }).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRules((prev) =>
                        prev.map((r) =>
                            r.id === ruleId ? { ...r, enabled: !r.enabled } : r,
                        ),
                    );
                },
            },
        );
    };

    const handleDelete = (ruleId: number) => {
        if (!confirm(t('notification_rules.delete_confirm'))) {
            return;
        }

        router.delete(
            notificationRuleDestroy({
                workspace: workspace.slug,
                project: project.slug,
                rule: ruleId,
            }).url,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRules((prev) => prev.filter((r) => r.id !== ruleId));
                },
            },
        );
    };

    const addCondition = () => {
        setConditions((prev) => [
            ...prev,
            { field: 'status', operator: 'equals', value: '' },
        ]);
    };

    const removeCondition = (index: number) => {
        setConditions((prev) => prev.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, key: string, value: string) => {
        setConditions((prev) =>
            prev.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">
                        {t('settings.notification_rules')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {t('settings.notification_rules_description')}
                    </p>
                </div>
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus className="size-4" />
                    {t('settings.new_rule')}
                </Button>
            </div>

            {showForm && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="size-4" />
                            {t('settings.create_rule')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>{t('settings.rule_name')}</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t(
                                        'notification_rules.name_placeholder',
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('settings.event_type')}</Label>
                                <Select
                                    value={eventType}
                                    onValueChange={setEventType}
                                >
                                    <SelectTrigger>
                                        <SelectValue
                                            placeholder={t(
                                                'notification_rules.select_event',
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {EVENT_TYPES.map((et) => (
                                            <SelectItem
                                                key={et.value}
                                                value={et.value}
                                            >
                                                {et.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('settings.project_scope')}</Label>
                            <Select
                                value={projectScope}
                                onValueChange={setProjectScope}
                            >
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="this_project">
                                        {project.name}
                                    </SelectItem>
                                    <SelectItem value="all_projects">
                                        {t('settings.all_projects')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('settings.conditions')}</Label>
                            <div className="space-y-2">
                                {conditions.map((cond, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2"
                                    >
                                        <Select
                                            value={cond.field}
                                            onValueChange={(v) =>
                                                updateCondition(idx, 'field', v)
                                            }
                                        >
                                            <SelectTrigger className="w-36">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CONDITION_FIELDS.map((f) => (
                                                    <SelectItem
                                                        key={f.value}
                                                        value={f.value}
                                                    >
                                                        {f.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={cond.operator}
                                            onValueChange={(v) =>
                                                updateCondition(
                                                    idx,
                                                    'operator',
                                                    v,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {OPERATORS.map((op) => (
                                                    <SelectItem
                                                        key={op.value}
                                                        value={op.value}
                                                    >
                                                        {op.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            value={cond.value}
                                            onChange={(e) =>
                                                updateCondition(
                                                    idx,
                                                    'value',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder={t(
                                                'notification_rules.value_placeholder',
                                            )}
                                            className="flex-1"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeCondition(idx)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addCondition}
                            >
                                <Plus className="size-3" />
                                {t('settings.add_condition')}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>{t('settings.channels')}</Label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                    <Switch
                                        checked={channels.includes('in_app')}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setChannels((prev) => [
                                                    ...prev,
                                                    'in_app',
                                                ]);
                                            } else {
                                                setChannels((prev) =>
                                                    prev.filter(
                                                        (c) => c !== 'in_app',
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                    <span className="text-sm">
                                        {t('settings.in_app')}
                                    </span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <Switch
                                        checked={channels.includes('email')}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setChannels((prev) => [
                                                    ...prev,
                                                    'email',
                                                ]);
                                            } else {
                                                setChannels((prev) =>
                                                    prev.filter(
                                                        (c) => c !== 'email',
                                                    ),
                                                );
                                            }
                                        }}
                                    />
                                    <span className="text-sm">
                                        {t('settings.email')}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowForm(false)}
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button onClick={handleCreate}>
                                {t('settings.create_rule')}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-3">
                {rules.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Bell className="mx-auto mb-4 size-8 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                {t('settings.no_rules')}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {rules.map((rule) => (
                    <Card key={rule.id}>
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                <Switch
                                    checked={rule.enabled}
                                    onCheckedChange={() =>
                                        handleToggle(rule.id)
                                    }
                                />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">
                                            {rule.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px]"
                                        >
                                            {rule.event_type}
                                        </Badge>
                                        {rule.project_id === null && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                {t('settings.all_projects')}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                        {rule.channels.map((ch) => (
                                            <Badge
                                                key={ch}
                                                variant="outline"
                                                className="text-[10px]"
                                            >
                                                {ch === 'in_app'
                                                    ? t('settings.in_app')
                                                    : t('settings.email')}
                                            </Badge>
                                        ))}
                                        {rule.conditions &&
                                            rule.conditions.length > 0 && (
                                                <span>
                                                    · {rule.conditions.length}{' '}
                                                    {t(
                                                        'settings.conditions',
                                                    ).toLowerCase()}
                                                </span>
                                            )}
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(rule.id)}
                            >
                                <Trash2 className="size-4 text-muted-foreground" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
