import { Form, Head, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpDown,
    Bell,
    Check,
    Clock,
    Globe,
    Mail,
    Plus,
    Send,
    Tag,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/page-header';
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkspaceMemberDialog } from '@/components/workspace-member-dialog';
import {
    destroy as workspaceDestroy,
    index as workspaceIndex,
    restore as workspaceRestore,
    update as workspaceUpdate,
} from '@/routes/workspaces';
import {
    destroy as invitationDestroy,
    store as invitationStore,
} from '@/routes/workspaces/invitations';
import {
    destroy as memberDestroy,
    update as memberUpdate,
} from '@/routes/workspaces/members';
import {
    destroy as priorityDestroy,
    store as priorityStore,
    update as priorityUpdate,
} from '@/routes/workspaces/priorities';
import { update as workspaceSettingsUpdate } from '@/routes/workspaces/settings';
import {
    destroy as taskTypeDestroy,
    store as taskTypeStore,
    update as taskTypeUpdate,
} from '@/routes/workspaces/task-types';

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
    status: string;
}

interface Invitation {
    id: number;
    email: string;
    role: string;
    expired_at: string | null;
    created_at: string;
    invited_by: {
        id: number;
        name: string;
        email: string;
    };
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    status: string;
    deleted_at: string | null;
}

interface WorkspaceSettings {
    [key: string]: string | boolean | number | null;
}

interface TaskTypeData {
    id: number;
    name: string;
    key: string;
    icon: string | null;
    color: string | null;
}

interface PriorityData {
    id: number;
    name: string;
    key: string;
    level: number;
    color: string | null;
}

interface Props {
    workspace: Workspace;
    members: Member[];
    invitations: Invitation[];
    settings: WorkspaceSettings;
    taskTypes: TaskTypeData[];
    priorities: PriorityData[];
}

export default function WorkspaceSettings({
    workspace,
    members,
    invitations,
    settings,
    taskTypes,
    priorities,
}: Props) {
    const { t } = useTranslation();
    const roleLabels: Record<string, string> = {
        owner: t('members.owner'),
        admin: t('members.admin'),
        manager: t('members.manager'),
        member: t('members.member'),
        viewer: t('members.viewer'),
    };
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingTaskType, setEditingTaskType] = useState<TaskTypeData | null>(
        null,
    );
    const [editingPriority, setEditingPriority] = useState<PriorityData | null>(
        null,
    );
    const isArchived = !!workspace.deleted_at;

    const handleRoleChange = (memberId: number, newRole: string) => {
        router.put(
            memberUpdate({ workspace: workspace.slug, member: memberId }),
            { role: newRole },
            { preserveScroll: true },
        );
    };

    const handleRemoveMember = (memberId: number) => {
        if (!confirm(t('workspace.remove_member_confirm'))) {
            return;
        }

        router.delete(
            memberDestroy({ workspace: workspace.slug, member: memberId }),
            {
                preserveScroll: true,
            },
        );
    };

    const handleSendInvitation = () => {
        if (!inviteEmail.trim()) {
            return;
        }

        router.post(
            invitationStore({ workspace: workspace.slug }),
            { email: inviteEmail, role: inviteRole },
            {
                preserveScroll: true,
                onSuccess: () => setInviteEmail(''),
            },
        );
    };

    const handleCancelInvitation = (invitationId: number) => {
        if (!confirm(t('workspace.cancel_invitation_confirm'))) {
            return;
        }

        router.delete(
            invitationDestroy({
                workspace: workspace.slug,
                invitation: invitationId,
            }),
            { preserveScroll: true },
        );
    };

    const handleUpdateTaskType = () => {
        if (!editingTaskType) {
            return;
        }

        router.put(
            taskTypeUpdate({
                workspace: workspace.slug,
                taskType: editingTaskType.id,
            }),
            {
                name: editingTaskType.name,
                color: editingTaskType.color,
                icon: editingTaskType.icon,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingTaskType(null),
            },
        );
    };

    const handleDeleteTaskType = (typeId: number) => {
        if (!confirm(t('workspace.delete_task_type_confirm'))) {
            return;
        }

        router.delete(
            taskTypeDestroy({
                workspace: workspace.slug,
                taskType: typeId,
            }),
            {
                preserveScroll: true,
            },
        );
    };

    const handleUpdatePriority = () => {
        if (!editingPriority) {
            return;
        }

        router.put(
            priorityUpdate({
                workspace: workspace.slug,
                priority: editingPriority.id,
            }),
            {
                name: editingPriority.name,
                level: editingPriority.level,
                color: editingPriority.color,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingPriority(null),
            },
        );
    };

    const handleDeletePriority = (priorityId: number) => {
        if (!confirm(t('workspace.delete_priority_confirm'))) {
            return;
        }

        router.delete(
            priorityDestroy({
                workspace: workspace.slug,
                priority: priorityId,
            }),
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`${workspace.name} — Settings`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={workspace.name}
                    description={t('workspace.settings')}
                    backHref={workspaceIndex()}
                    backLabel="Workspaces"
                />

                <div className="mx-auto w-full max-w-2xl">
                    <Tabs defaultValue="general">
                        <TabsList className="mb-6">
                            <TabsTrigger value="general">
                                {t('workspace.general')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                {t('workspace.settings')}
                            </TabsTrigger>
                            <TabsTrigger value="task-types">
                                {t('workspace.task_types')}
                            </TabsTrigger>
                            <TabsTrigger value="priorities">
                                {t('workspace.priorities')}
                            </TabsTrigger>
                            <TabsTrigger value="members">
                                {t('workspace.members_tab')}
                            </TabsTrigger>
                            <TabsTrigger value="danger">
                                {t('workspace.danger_zone')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('workspace.general_settings')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={workspaceUpdate(workspace.slug)}
                                        method="put"
                                        className="flex flex-col gap-4"
                                    >
                                        {({
                                            errors,
                                            processing,
                                            wasSuccessful,
                                        }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="name">
                                                        {t(
                                                            'workspace.workspace_name',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        defaultValue={
                                                            workspace.name
                                                        }
                                                        data-invalid={
                                                            !!errors.name
                                                        }
                                                        aria-invalid={
                                                            !!errors.name
                                                        }
                                                    />
                                                    {errors.name && (
                                                        <p className="text-sm text-destructive">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="slug">
                                                        {t(
                                                            'workspace.slug_label',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="slug"
                                                        name="slug"
                                                        defaultValue={
                                                            workspace.slug
                                                        }
                                                        data-invalid={
                                                            !!errors.slug
                                                        }
                                                        aria-invalid={
                                                            !!errors.slug
                                                        }
                                                    />
                                                    {errors.slug && (
                                                        <p className="text-sm text-destructive">
                                                            {errors.slug}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="description">
                                                        {t(
                                                            'workspace.description_label',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        defaultValue={
                                                            workspace.description ??
                                                            ''
                                                        }
                                                    />
                                                </div>

                                                {wasSuccessful && (
                                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                                        {t(
                                                            'settings.settings_saved',
                                                        )}
                                                    </p>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    {processing
                                                        ? t('common.saving')
                                                        : t(
                                                              'settings.save_changes',
                                                          )}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('workspace.workspace_settings')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={workspaceSettingsUpdate(
                                            workspace.slug,
                                        )}
                                        method="put"
                                        className="flex flex-col gap-6"
                                    >
                                        {({
                                            errors,
                                            processing,
                                            wasSuccessful,
                                        }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label
                                                        htmlFor="default_locale"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Globe className="size-4" />
                                                        {t(
                                                            'workspace.default_locale',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        name="default_locale"
                                                        defaultValue={
                                                            (settings.default_locale as string) ??
                                                            'en'
                                                        }
                                                    >
                                                        <SelectTrigger id="default_locale">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="en">
                                                                English
                                                            </SelectItem>
                                                            <SelectItem value="id">
                                                                Bahasa Indonesia
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.default_locale && (
                                                        <p className="text-sm text-destructive">
                                                            {
                                                                errors.default_locale
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label
                                                        htmlFor="default_timezone"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Clock className="size-4" />
                                                        {t(
                                                            'workspace.default_timezone',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        name="default_timezone"
                                                        defaultValue={
                                                            (settings.default_timezone as string) ??
                                                            'Asia/Jakarta'
                                                        }
                                                    >
                                                        <SelectTrigger id="default_timezone">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Asia/Jakarta">
                                                                Asia/Jakarta
                                                                (WIB)
                                                            </SelectItem>
                                                            <SelectItem value="Asia/Makassar">
                                                                Asia/Makassar
                                                                (WITA)
                                                            </SelectItem>
                                                            <SelectItem value="Asia/Jayapura">
                                                                Asia/Jayapura
                                                                (WIT)
                                                            </SelectItem>
                                                            <SelectItem value="UTC">
                                                                UTC
                                                            </SelectItem>
                                                            <SelectItem value="America/New_York">
                                                                America/New_York
                                                            </SelectItem>
                                                            <SelectItem value="Europe/London">
                                                                Europe/London
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {errors.default_timezone && (
                                                        <p className="text-sm text-destructive">
                                                            {
                                                                errors.default_timezone
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <Label
                                                        htmlFor="auto_watch_own_tasks"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Bell className="size-4" />
                                                        <span>
                                                            {t(
                                                                'workspace.auto_watch_tasks',
                                                            )}
                                                        </span>
                                                    </Label>
                                                    <input
                                                        type="hidden"
                                                        name="auto_watch_own_tasks"
                                                        value="0"
                                                    />
                                                    <Switch
                                                        id="auto_watch_own_tasks"
                                                        name="auto_watch_own_tasks"
                                                        value="1"
                                                        defaultChecked={
                                                            settings.auto_watch_own_tasks !==
                                                            false
                                                        }
                                                    />
                                                </div>

                                                {wasSuccessful && (
                                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                                        {t(
                                                            'settings.settings_saved',
                                                        )}
                                                    </p>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="w-fit"
                                                >
                                                    {processing
                                                        ? t('common.saving')
                                                        : t(
                                                              'settings.save_changes',
                                                          )}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="task-types">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Tag className="size-5" />
                                        {t('workspace.task_types')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={taskTypeStore(workspace.slug)}
                                        method="post"
                                        className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="task-type-name">
                                                        {t('admin.name')}
                                                    </Label>
                                                    <Input
                                                        id="task-type-name"
                                                        name="name"
                                                        placeholder="Bug"
                                                        data-invalid={
                                                            !!errors.name
                                                        }
                                                        aria-invalid={
                                                            !!errors.name
                                                        }
                                                    />
                                                    {errors.name && (
                                                        <p className="text-sm text-destructive">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="task-type-color">
                                                        {t('epic.color')}
                                                    </Label>
                                                    <Input
                                                        id="task-type-color"
                                                        name="color"
                                                        type="color"
                                                        defaultValue="#64748b"
                                                        className="h-10 w-20 p-1"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        <Plus className="size-4" />
                                                        <span>
                                                            {t(
                                                                'workspace.add_type',
                                                            )}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>

                                    <Separator />

                                    <div className="flex flex-col">
                                        {taskTypes.map((type) => {
                                            const isEditing =
                                                editingTaskType?.id === type.id;

                                            return (
                                                <div
                                                    key={type.id}
                                                    className="flex items-center gap-3 border-b py-3 last:border-0"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <Input
                                                                value={
                                                                    editingTaskType.name
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingTaskType(
                                                                        {
                                                                            ...editingTaskType,
                                                                            name: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="min-w-0 flex-1"
                                                            />
                                                            <Input
                                                                type="color"
                                                                value={
                                                                    editingTaskType.color ??
                                                                    '#64748b'
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingTaskType(
                                                                        {
                                                                            ...editingTaskType,
                                                                            color: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-9 w-16 p-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={
                                                                    handleUpdateTaskType
                                                                }
                                                            >
                                                                <Check className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() =>
                                                                    setEditingTaskType(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className="min-w-0 justify-start truncate"
                                                                style={{
                                                                    borderColor:
                                                                        type.color ??
                                                                        undefined,
                                                                    color:
                                                                        type.color ??
                                                                        undefined,
                                                                }}
                                                            >
                                                                {type.name}
                                                            </Badge>
                                                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                                                                {type.key}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingTaskType(
                                                                        type,
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'workspace.edit',
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteTaskType(
                                                                        type.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {taskTypes.length === 0 && (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'workspace.no_task_types_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="priorities">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ArrowUpDown className="size-5" />
                                        {t('workspace.priorities')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={priorityStore(workspace.slug)}
                                        method="post"
                                        className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="priority-name">
                                                        {t('admin.name')}
                                                    </Label>
                                                    <Input
                                                        id="priority-name"
                                                        name="name"
                                                        placeholder="Critical"
                                                        data-invalid={
                                                            !!errors.name
                                                        }
                                                        aria-invalid={
                                                            !!errors.name
                                                        }
                                                    />
                                                    {errors.name && (
                                                        <p className="text-sm text-destructive">
                                                            {errors.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="priority-level">
                                                        {t('workspace.level')}
                                                    </Label>
                                                    <Input
                                                        id="priority-level"
                                                        name="level"
                                                        type="number"
                                                        defaultValue="1"
                                                        className="w-20"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="priority-color">
                                                        {t('epic.color')}
                                                    </Label>
                                                    <Input
                                                        id="priority-color"
                                                        name="color"
                                                        type="color"
                                                        defaultValue="#64748b"
                                                        className="h-10 w-20 p-1"
                                                    />
                                                </div>
                                                <div className="flex items-end">
                                                    <Button
                                                        type="submit"
                                                        disabled={processing}
                                                    >
                                                        <Plus className="size-4" />
                                                        <span>
                                                            {t('common.add')}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>

                                    <Separator />

                                    <div className="flex flex-col">
                                        {priorities.map((priority) => {
                                            const isEditing =
                                                editingPriority?.id ===
                                                priority.id;

                                            return (
                                                <div
                                                    key={priority.id}
                                                    className="flex items-center gap-3 border-b py-3 last:border-0"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <Input
                                                                value={
                                                                    editingPriority.name
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingPriority(
                                                                        {
                                                                            ...editingPriority,
                                                                            name: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="min-w-0 flex-1"
                                                            />
                                                            <Input
                                                                type="number"
                                                                value={
                                                                    editingPriority.level
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingPriority(
                                                                        {
                                                                            ...editingPriority,
                                                                            level: Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        },
                                                                    )
                                                                }
                                                                className="w-20"
                                                            />
                                                            <Input
                                                                type="color"
                                                                value={
                                                                    editingPriority.color ??
                                                                    '#64748b'
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingPriority(
                                                                        {
                                                                            ...editingPriority,
                                                                            color: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                className="h-9 w-16 p-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={
                                                                    handleUpdatePriority
                                                                }
                                                            >
                                                                <Check className="size-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8"
                                                                onClick={() =>
                                                                    setEditingPriority(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                <X className="size-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Badge
                                                                variant="outline"
                                                                className="min-w-0 justify-start truncate"
                                                                style={{
                                                                    borderColor:
                                                                        priority.color ??
                                                                        undefined,
                                                                    color:
                                                                        priority.color ??
                                                                        undefined,
                                                                }}
                                                            >
                                                                {priority.name}
                                                            </Badge>
                                                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                                                                Lv.{' '}
                                                                {priority.level}
                                                                {' · '}
                                                                {priority.key}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingPriority(
                                                                        priority,
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'workspace.edit',
                                                                )}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeletePriority(
                                                                        priority.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {priorities.length === 0 && (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'workspace.no_priorities_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="members">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>
                                        {t('workspace.members_tab')}
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddMemberOpen(true)}
                                    >
                                        {t('workspace.add_member')}
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col">
                                        {members.map((member) => (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-3 border-b py-3 last:border-0"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                                    {member.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="truncate text-sm font-medium">
                                                        {member.name}
                                                    </span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {member.email}
                                                    </span>
                                                </div>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) =>
                                                        handleRoleChange(
                                                            member.id,
                                                            value,
                                                        )
                                                    }
                                                    disabled={
                                                        member.role === 'owner'
                                                    }
                                                >
                                                    <SelectTrigger className="h-8 w-28">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(
                                                            roleLabels,
                                                        ).map(
                                                            ([
                                                                value,
                                                                label,
                                                            ]) => (
                                                                <SelectItem
                                                                    key={value}
                                                                    value={
                                                                        value
                                                                    }
                                                                >
                                                                    {label}
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        handleRemoveMember(
                                                            member.id,
                                                        )
                                                    }
                                                    disabled={
                                                        member.role === 'owner'
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                {t('workspace.no_members_yet')}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <WorkspaceMemberDialog
                                workspaceSlug={workspace.slug}
                                open={addMemberOpen}
                                onOpenChange={setAddMemberOpen}
                            />

                            <Card className="mt-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Mail className="size-5" />
                                        {t('workspace.invitations')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="invite-email">
                                                {t('workspace.email_address')}
                                            </Label>
                                            <Input
                                                id="invite-email"
                                                type="email"
                                                value={inviteEmail}
                                                onChange={(e) =>
                                                    setInviteEmail(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="teammate@example.com"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="invite-role">
                                                {t('workspace.role_label')}
                                            </Label>
                                            <Select
                                                value={inviteRole}
                                                onValueChange={setInviteRole}
                                            >
                                                <SelectTrigger id="invite-role">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">
                                                        {t('members.admin')}
                                                    </SelectItem>
                                                    <SelectItem value="manager">
                                                        {t('members.manager')}
                                                    </SelectItem>
                                                    <SelectItem value="member">
                                                        {t('members.member')}
                                                    </SelectItem>
                                                    <SelectItem value="viewer">
                                                        {t('members.viewer')}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                type="button"
                                                className="w-full gap-2"
                                                onClick={handleSendInvitation}
                                                disabled={!inviteEmail.trim()}
                                            >
                                                <Send className="size-4" />
                                                {t('workspace.send_invite')}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        {invitations.map((invitation) => (
                                            <div
                                                key={invitation.id}
                                                className="flex items-center gap-3 border-b py-3 last:border-0"
                                            >
                                                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                                    <Mail className="size-4" />
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <span className="truncate text-sm font-medium">
                                                        {invitation.email}
                                                    </span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                        {t(
                                                            'workspace.invited_by',
                                                        )}{' '}
                                                        {
                                                            invitation
                                                                .invited_by.name
                                                        }
                                                    </span>
                                                </div>
                                                <Badge variant="secondary">
                                                    {
                                                        roleLabels[
                                                            invitation.role
                                                        ]
                                                    }
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        handleCancelInvitation(
                                                            invitation.id,
                                                        )
                                                    }
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {invitations.length === 0 && (
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'workspace.no_pending_invitations',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="danger">
                            <Card className="border-destructive/30">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="size-5" />
                                        {t('workspace.danger_zone')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {!isArchived ? (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    'workspace.archive_description',
                                                )}
                                            </p>
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeleteConfirmOpen(true)
                                                }
                                            >
                                                {t(
                                                    'workspace.archive_workspace',
                                                )}
                                            </Button>

                                            {deleteConfirmOpen && (
                                                <div className="flex items-center gap-2">
                                                    <form
                                                        action={workspaceDestroy.url(
                                                            workspace.slug,
                                                        )}
                                                        method="post"
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="_method"
                                                            value="DELETE"
                                                        />
                                                        <input
                                                            type="hidden"
                                                            name="_token"
                                                            value={
                                                                (
                                                                    document.querySelector(
                                                                        'meta[name="csrf-token"]',
                                                                    ) as HTMLMetaElement
                                                                )?.content
                                                            }
                                                        />
                                                        <Button
                                                            type="submit"
                                                            variant="destructive"
                                                            size="sm"
                                                        >
                                                            {t(
                                                                'workspace.confirm_archive',
                                                            )}
                                                        </Button>
                                                    </form>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setDeleteConfirmOpen(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        {t('common.cancel')}
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    'workspace.restore_description',
                                                )}
                                            </p>
                                            <form
                                                action={workspaceRestore.url(
                                                    workspace.id,
                                                )}
                                                method="post"
                                            >
                                                <input
                                                    type="hidden"
                                                    name="_token"
                                                    value={
                                                        (
                                                            document.querySelector(
                                                                'meta[name="csrf-token"]',
                                                            ) as HTMLMetaElement
                                                        )?.content
                                                    }
                                                />
                                                <Button
                                                    type="submit"
                                                    variant="default"
                                                >
                                                    {t(
                                                        'workspace.restore_workspace',
                                                    )}
                                                </Button>
                                            </form>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}
