import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    Check,
    LayoutGrid,
    Pencil,
    Plus,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GithubSettingsTab } from '@/components/github-settings-tab';
import { NotificationRulesTab } from '@/components/notification-rules-tab';
import { PageHeader } from '@/components/page-header';
import { ProjectMemberDialog } from '@/components/project-member-dialog';
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
import { canDeleteProject } from '@/lib/permissions';
import {
    show as projectShow,
    update as projectUpdate,
    destroy as projectDestroy,
    restore as projectRestore,
} from '@/routes/projects';
import {
    store as columnStore,
    update as columnUpdate,
    destroy as columnDestroy,
} from '@/routes/projects/boards/columns';
import {
    store as epicStore,
    update as epicUpdate,
    destroy as epicDestroy,
    show as epicShow,
} from '@/routes/projects/epics';
import {
    store as labelStore,
    update as labelUpdate,
    destroy as labelDestroy,
    show as labelShow,
} from '@/routes/projects/labels';
import {
    update as memberUpdate,
    destroy as memberDestroy,
} from '@/routes/projects/members';
import { update as projectSettingsUpdate } from '@/routes/projects/settings';
import {
    store as sprintStore,
    update as sprintUpdate,
    destroy as sprintDestroy,
    show as sprintShow,
} from '@/routes/projects/sprints';

interface Member {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar: string | null;
    role: string;
}

interface ProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
    description: string | null;
    color: string | null;
    visibility: string;
    status: string;
    deleted_at: string | null;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface ProjectLabel {
    id: number;
    name: string;
    slug: string;
    color: string | null;
}

interface ProjectEpic {
    id: number;
    name: string;
    summary: string | null;
    color: string | null;
    start_date: string | null;
    due_date: string | null;
    status: string;
    tasks_count: number;
}

interface ProjectSprint {
    id: number;
    name: string;
    goal: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    completed_at: string | null;
    tasks_count: number;
}

interface ProjectSettings {
    [key: string]: string | boolean | number | null;
}

interface BoardColumnOption {
    id: number;
    name: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
    status_key: string;
}

interface BoardOption {
    id: number;
    name: string;
    type: string;
    columns: BoardColumnOption[];
}

interface GitHubIntegration {
    provider_user_id: string;
    metadata: {
        nickname: string;
        name: string;
        avatar: string | null;
    } | null;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    members: Member[];
    labels: ProjectLabel[];
    epics: ProjectEpic[];
    sprints: ProjectSprint[];
    settings: ProjectSettings;
    boards: BoardOption[];
    integration: GitHubIntegration | null;
    notificationRules: Array<{
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
    }>;
    userProjectRole?: string | null;
}

const roleLabels: Record<string, string> = {
    lead: 'Lead',
    manager: 'Manager',
    developer: 'Developer',
    qa: 'QA',
    member: 'Member',
    viewer: 'Viewer',
};

export default function ProjectSettings({
    workspace,
    project,
    members,
    labels,
    epics,
    sprints,
    settings,
    boards,
    integration,
    notificationRules,
    userProjectRole,
}: Props) {
    const { t } = useTranslation();
    const { props: pageProps } = usePage();

    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') return 'general';

        return new URL(window.location.href).searchParams.get('tab') ?? 'general';
    });

    const handleTabChange = useCallback((tab: string) => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.pushState({}, '', url.toString());
        setActiveTab(tab);
    }, []);

    const currentWorkspace = pageProps.currentWorkspace as {
        role?: string;
    } | null;
    const wsRole = currentWorkspace?.role;
    const canDelete = canDeleteProject(wsRole, userProjectRole);
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<ProjectLabel | null>(null);
    const [editingEpic, setEditingEpic] = useState<ProjectEpic | null>(null);
    const [editingSprint, setEditingSprint] = useState<ProjectSprint | null>(
        null,
    );
    const [editingColumn, setEditingColumn] =
        useState<BoardColumnOption | null>(null);
    const isArchived = !!project.deleted_at;

    const handleRoleChange = (memberId: number, newRole: string) => {
        router.put(
            memberUpdate({
                workspace: workspace.slug,
                project: project.slug,
                member: memberId,
            }),
            { role: newRole },
            { preserveScroll: true },
        );
    };

    const handleRemoveMember = (memberId: number) => {
        if (!confirm(t('settings.confirm_remove_member'))) {
            return;
        }

        router.delete(
            memberDestroy({
                workspace: workspace.slug,
                project: project.slug,
                member: memberId,
            }),
            { preserveScroll: true },
        );
    };

    const handleUpdateLabel = () => {
        if (!editingLabel) {
            return;
        }

        router.put(
            labelUpdate({
                workspace: workspace.slug,
                project: project.slug,
                label: editingLabel.id,
            }),
            {
                name: editingLabel.name,
                color: editingLabel.color,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingLabel(null),
            },
        );
    };

    const handleDeleteLabel = (labelId: number) => {
        if (!confirm(t('settings.confirm_delete_label'))) {
            return;
        }

        router.delete(
            labelDestroy({
                workspace: workspace.slug,
                project: project.slug,
                label: labelId,
            }),
            { preserveScroll: true },
        );
    };

    const handleUpdateEpic = () => {
        if (!editingEpic) {
            return;
        }

        router.put(
            epicUpdate({
                workspace: workspace.slug,
                project: project.slug,
                epic: editingEpic.id,
            }),
            {
                name: editingEpic.name,
                summary: editingEpic.summary,
                color: editingEpic.color,
                start_date: editingEpic.start_date,
                due_date: editingEpic.due_date,
                status: editingEpic.status,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingEpic(null),
            },
        );
    };

    const handleDeleteEpic = (epicId: number) => {
        if (!confirm(t('settings.confirm_delete_epic'))) {
            return;
        }

        router.delete(
            epicDestroy({
                workspace: workspace.slug,
                project: project.slug,
                epic: epicId,
            }),
            { preserveScroll: true },
        );
    };

    const handleUpdateSprint = () => {
        if (!editingSprint) {
            return;
        }

        router.put(
            sprintUpdate({
                workspace: workspace.slug,
                project: project.slug,
                sprint: editingSprint.id,
            }),
            {
                name: editingSprint.name,
                goal: editingSprint.goal,
                status: editingSprint.status,
                start_date: editingSprint.start_date,
                end_date: editingSprint.end_date,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingSprint(null),
            },
        );
    };

    const handleDeleteSprint = (sprintId: number) => {
        if (!confirm(t('settings.confirm_delete_sprint'))) {
            return;
        }

        router.delete(
            sprintDestroy({
                workspace: workspace.slug,
                project: project.slug,
                sprint: sprintId,
            }),
            { preserveScroll: true },
        );
    };

    const handleUpdateColumn = (boardId: number) => {
        if (!editingColumn) {
            return;
        }

        router.put(
            columnUpdate({
                workspace: workspace.slug,
                project: project.slug,
                board: boardId,
                boardColumn: editingColumn.id,
            }),
            {
                name: editingColumn.name,
                color: editingColumn.color,
                is_done_column: editingColumn.is_done_column,
            },
            {
                preserveScroll: true,
                onSuccess: () => setEditingColumn(null),
            },
        );
    };

    const handleDeleteColumn = (boardId: number, columnId: number) => {
        if (!confirm(t('settings.confirm_delete_column'))) {
            return;
        }

        router.delete(
            columnDestroy({
                workspace: workspace.slug,
                project: project.slug,
                board: boardId,
                boardColumn: columnId,
            }),
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`${project.name} — ${t('settings.title')}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('settings.title')}
                    description={t('project_settings.page_description')}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                />

                <div className="mx-auto w-full max-w-4xl">
                    <Tabs value={activeTab} onValueChange={handleTabChange}>
                        <TabsList className="mb-6 flex h-auto max-w-full flex-wrap justify-start">
                            <TabsTrigger value="general">
                                {t('settings.general')}
                            </TabsTrigger>
                            <TabsTrigger value="settings">
                                {t('settings.title')}
                            </TabsTrigger>
                            <TabsTrigger value="members">
                                {t('settings.members')}
                            </TabsTrigger>
                            <TabsTrigger value="labels">
                                {t('task.labels')}
                            </TabsTrigger>
                            <TabsTrigger value="board">
                                {t('board.board')}
                            </TabsTrigger>
                            <TabsTrigger value="epics">
                                {t('settings.epics')}
                            </TabsTrigger>
                            <TabsTrigger value="sprints">
                                {t('settings.sprints')}
                            </TabsTrigger>
                            <TabsTrigger value="github">
                                {t('settings.github')}
                            </TabsTrigger>
                            <TabsTrigger value="notifications">
                                {t('settings.notifications')}
                            </TabsTrigger>
                            <TabsTrigger value="danger">
                                {t('settings.danger_zone')}
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
                                        action={projectUpdate.url({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                        })}
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
                                                            'project_settings.project_name',
                                                        )}
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        defaultValue={
                                                            project.name
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
                                                    <Label htmlFor="key">
                                                        Key
                                                    </Label>
                                                    <Input
                                                        id="key"
                                                        name="key"
                                                        defaultValue={
                                                            project.key
                                                        }
                                                        className="font-mono uppercase"
                                                        data-invalid={
                                                            !!errors.key
                                                        }
                                                        aria-invalid={
                                                            !!errors.key
                                                        }
                                                    />
                                                    {errors.key && (
                                                        <p className="text-sm text-destructive">
                                                            {errors.key}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="slug">
                                                        Slug
                                                    </Label>
                                                    <Input
                                                        id="slug"
                                                        name="slug"
                                                        defaultValue={
                                                            project.slug
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
                                                        Description
                                                    </Label>
                                                    <Input
                                                        id="description"
                                                        name="description"
                                                        defaultValue={
                                                            project.description ??
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
                                        {t('project_settings.project_settings')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={projectSettingsUpdate.url({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                        })}
                                        method="put"
                                        className="flex flex-col gap-6"
                                    >
                                        {({ processing, wasSuccessful }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label
                                                        htmlFor="default_board_id"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <LayoutGrid className="size-4" />
                                                        {t(
                                                            'project_settings.default_board',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        name="default_board_id"
                                                        defaultValue={
                                                            (settings.default_board_id as string) ??
                                                            String(
                                                                boards[0]?.id ??
                                                                    '',
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger id="default_board_id">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {boards.map(
                                                                (board) => (
                                                                    <SelectItem
                                                                        key={
                                                                            board.id
                                                                        }
                                                                        value={String(
                                                                            board.id,
                                                                        )}
                                                                    >
                                                                        {
                                                                            board.name
                                                                        }
                                                                    </SelectItem>
                                                                ),
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    <Label
                                                        htmlFor="default_assignee_id"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <UserPlus className="size-4" />
                                                        {t(
                                                            'project_settings.default_assignee',
                                                        )}
                                                    </Label>
                                                    <Select
                                                        name="default_assignee_id"
                                                        defaultValue={
                                                            (settings.default_assignee_id as string) ??
                                                            'none'
                                                        }
                                                    >
                                                        <SelectTrigger id="default_assignee_id">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">
                                                                {t(
                                                                    'project_settings.no_default',
                                                                )}
                                                            </SelectItem>
                                                            {members.map(
                                                                (member) => (
                                                                    <SelectItem
                                                                        key={
                                                                            member.id
                                                                        }
                                                                        value={String(
                                                                            member.user_id,
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
                                                </div>

                                                <div className="flex items-center justify-between gap-4">
                                                    <Label
                                                        htmlFor="auto_assign_reporter"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Bell className="size-4" />
                                                        <span>
                                                            {t(
                                                                'project_settings.auto_assign_task',
                                                            )}
                                                            reporter as assignee
                                                        </span>
                                                    </Label>
                                                    <input
                                                        type="hidden"
                                                        name="auto_assign_reporter"
                                                        value="0"
                                                    />
                                                    <Switch
                                                        id="auto_assign_reporter"
                                                        name="auto_assign_reporter"
                                                        value="1"
                                                        defaultChecked={
                                                            settings.auto_assign_reporter ===
                                                            true
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

                        <TabsContent value="members">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>
                                        {t('settings.members')}
                                    </CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddMemberOpen(true)}
                                    >
                                        <Plus className="size-3.5" />
                                        <span>{t('members.add_member')}</span>
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
                                                        member.role === 'lead'
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
                                                        member.role === 'lead'
                                                    }
                                                >
                                                    <Trash2 className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.no_members_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <ProjectMemberDialog
                                workspaceSlug={workspace.slug}
                                projectSlug={project.slug}
                                open={addMemberOpen}
                                onOpenChange={setAddMemberOpen}
                            />
                        </TabsContent>

                        <TabsContent value="labels">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('task.labels')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={labelStore.url({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                        })}
                                        method="post"
                                        className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="label-name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="label-name"
                                                        name="name"
                                                        placeholder={t(
                                                            'label.label_name',
                                                        )}
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
                                                    <Label htmlFor="label-color">
                                                        Color
                                                    </Label>
                                                    <Input
                                                        id="label-color"
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
                                                                'project_settings.add_label',
                                                            )}
                                                        </span>
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </Form>

                                    <Separator />

                                    <div className="flex flex-col">
                                        {labels.map((label) => {
                                            const isEditing =
                                                editingLabel?.id === label.id;

                                            return (
                                                <div
                                                    key={label.id}
                                                    className="flex items-center gap-3 border-b py-3 last:border-0"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <Input
                                                                value={
                                                                    editingLabel.name
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingLabel(
                                                                        {
                                                                            ...editingLabel,
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
                                                                    editingLabel.color ??
                                                                    '#64748b'
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingLabel(
                                                                        {
                                                                            ...editingLabel,
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
                                                                    handleUpdateLabel
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
                                                                    setEditingLabel(
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
                                                                        label.color ??
                                                                        undefined,
                                                                    color:
                                                                        label.color ??
                                                                        undefined,
                                                                }}
                                                            >
                                                                {label.name}
                                                            </Badge>
                                                            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
                                                                {label.slug}
                                                            </span>
                                                            <Link
                                                                href={labelShow(
                                                                    {
                                                                        workspace:
                                                                            workspace.slug,
                                                                        project:
                                                                            project.slug,
                                                                        label: label.id,
                                                                    },
                                                                )}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingLabel(
                                                                        label,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteLabel(
                                                                        label.id,
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
                                        {labels.length === 0 && (
                                            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.no_labels_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="board">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('board.columns')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    {boards.length === 0 && (
                                        <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                            {t(
                                                'project_settings.no_board_found',
                                            )}
                                        </p>
                                    )}
                                    {boards.map((board) => (
                                        <div key={board.id}>
                                            <div className="mb-4 flex items-center gap-3">
                                                <div className="flex-1">
                                                    <h3 className="text-sm font-medium">
                                                        {board.name}
                                                    </h3>
                                                </div>
                                            </div>

                                            <Form
                                                action={columnStore.url({
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                    board: board.id,
                                                })}
                                                method="post"
                                                className="grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                                                resetOnSuccess
                                            >
                                                {({ errors, processing }) => (
                                                    <>
                                                        <div className="flex flex-col gap-2">
                                                            <Label
                                                                htmlFor={`col-name-${board.id}`}
                                                            >
                                                                Name
                                                            </Label>
                                                            <Input
                                                                id={`col-name-${board.id}`}
                                                                name="name"
                                                                placeholder={t(
                                                                    'board_column.column_placeholder',
                                                                )}
                                                                data-invalid={
                                                                    !!errors.name
                                                                }
                                                            />
                                                            {errors.name && (
                                                                <p className="text-sm text-destructive">
                                                                    {
                                                                        errors.name
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            <Label
                                                                htmlFor={`col-status-${board.id}`}
                                                            >
                                                                {t(
                                                                    'project_settings.status_key',
                                                                )}
                                                            </Label>
                                                            <Input
                                                                id={`col-status-${board.id}`}
                                                                name="status_key"
                                                                placeholder={t(
                                                                    'board_column.status_key_placeholder',
                                                                )}
                                                                data-invalid={
                                                                    !!errors.status_key
                                                                }
                                                            />
                                                            {errors.status_key && (
                                                                <p className="text-sm text-destructive">
                                                                    {
                                                                        errors.status_key
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-end">
                                                            <Button
                                                                type="submit"
                                                                disabled={
                                                                    processing
                                                                }
                                                            >
                                                                <Plus className="size-4" />
                                                                <span>
                                                                    {t(
                                                                        'board.add_column',
                                                                    )}
                                                                </span>
                                                            </Button>
                                                        </div>
                                                    </>
                                                )}
                                            </Form>

                                            <Separator className="my-4" />

                                            <div className="flex flex-col">
                                                {[...board.columns]
                                                    .sort(
                                                        (a, b) =>
                                                            a.position -
                                                            b.position,
                                                    )
                                                    .map((column) => {
                                                        const isEditing =
                                                            editingColumn?.id ===
                                                            column.id;

                                                        return (
                                                            <div
                                                                key={column.id}
                                                                className="flex items-center gap-3 border-b py-3 last:border-0"
                                                            >
                                                                {isEditing ? (
                                                                    <>
                                                                        <Input
                                                                            value={
                                                                                editingColumn.name
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setEditingColumn(
                                                                                    {
                                                                                        ...editingColumn,
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
                                                                                editingColumn.color ??
                                                                                '#64748b'
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setEditingColumn(
                                                                                    {
                                                                                        ...editingColumn,
                                                                                        color: e
                                                                                            .target
                                                                                            .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            className="h-10 w-20 p-1"
                                                                        />
                                                                        <label className="flex items-center gap-2 text-sm">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    editingColumn.is_done_column
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setEditingColumn(
                                                                                        {
                                                                                            ...editingColumn,
                                                                                            is_done_column:
                                                                                                e
                                                                                                    .target
                                                                                                    .checked,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            />
                                                                            {t(
                                                                                'project_settings.done_column',
                                                                            )}
                                                                        </label>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                handleUpdateColumn(
                                                                                    board.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            Save
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                setEditingColumn(
                                                                                    null,
                                                                                )
                                                                            }
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div
                                                                            className="size-3 shrink-0 rounded-full"
                                                                            style={{
                                                                                backgroundColor:
                                                                                    column.color ??
                                                                                    '#64748b',
                                                                            }}
                                                                        />
                                                                        <span className="min-w-0 flex-1 text-sm">
                                                                            {
                                                                                column.name
                                                                            }
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {
                                                                                column.status_key
                                                                            }
                                                                        </span>
                                                                        {column.is_done_column && (
                                                                            <Badge
                                                                                variant="secondary"
                                                                                className="text-[10px]"
                                                                            >
                                                                                {t(
                                                                                    'project_settings.done_column',
                                                                                )}
                                                                            </Badge>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                setEditingColumn(
                                                                                    {
                                                                                        ...column,
                                                                                    },
                                                                                )
                                                                            }
                                                                        >
                                                                            <Pencil className="size-3" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() =>
                                                                                handleDeleteColumn(
                                                                                    board.id,
                                                                                    column.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            <Trash2 className="size-3" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                {board.columns.length === 0 && (
                                                    <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                                        {t(
                                                            'board_column.no_columns_yet',
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="epics">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('settings.epics')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={epicStore({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                        })}
                                        method="post"
                                        className="grid gap-3"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="epic-name">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="epic-name"
                                                            name="name"
                                                            placeholder={t(
                                                                'epic.epic_name',
                                                            )}
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
                                                        <Label htmlFor="epic-color">
                                                            Color
                                                        </Label>
                                                        <Input
                                                            id="epic-color"
                                                            name="color"
                                                            type="color"
                                                            defaultValue="#2563eb"
                                                            className="h-10 w-20 p-1"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="epic-summary">
                                                        Summary
                                                    </Label>
                                                    <Input
                                                        id="epic-summary"
                                                        name="summary"
                                                        placeholder={t(
                                                            'epic.brief_description',
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="epic-status">
                                                            Status
                                                        </Label>
                                                        <Select
                                                            name="status"
                                                            defaultValue="active"
                                                        >
                                                            <SelectTrigger id="epic-status">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">
                                                                    Active
                                                                </SelectItem>
                                                                <SelectItem value="completed">
                                                                    Completed
                                                                </SelectItem>
                                                                <SelectItem value="archived">
                                                                    Archived
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="epic-start-date">
                                                            Start
                                                        </Label>
                                                        <Input
                                                            id="epic-start-date"
                                                            name="start_date"
                                                            type="date"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="epic-due-date">
                                                            Due
                                                        </Label>
                                                        <Input
                                                            id="epic-due-date"
                                                            name="due_date"
                                                            type="date"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="w-fit"
                                                >
                                                    <Plus className="size-4" />
                                                    <span>
                                                        {t(
                                                            'project_settings.add_epic',
                                                        )}
                                                    </span>
                                                </Button>
                                            </>
                                        )}
                                    </Form>

                                    <Separator />

                                    <div className="flex flex-col">
                                        {epics.map((epic) => {
                                            const isEditing =
                                                editingEpic?.id === epic.id;

                                            return (
                                                <div
                                                    key={epic.id}
                                                    className="flex flex-col gap-3 border-b py-4 last:border-0"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                                                                <Input
                                                                    value={
                                                                        editingEpic.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingEpic(
                                                                            {
                                                                                ...editingEpic,
                                                                                name: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                                <Input
                                                                    type="color"
                                                                    value={
                                                                        editingEpic.color ??
                                                                        '#2563eb'
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingEpic(
                                                                            {
                                                                                ...editingEpic,
                                                                                color: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        )
                                                                    }
                                                                    className="h-9 w-16 p-1"
                                                                />
                                                                <Select
                                                                    value={
                                                                        editingEpic.status
                                                                    }
                                                                    onValueChange={(
                                                                        status,
                                                                    ) =>
                                                                        setEditingEpic(
                                                                            {
                                                                                ...editingEpic,
                                                                                status,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="active">
                                                                            Active
                                                                        </SelectItem>
                                                                        <SelectItem value="completed">
                                                                            Completed
                                                                        </SelectItem>
                                                                        <SelectItem value="archived">
                                                                            Archived
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <Input
                                                                value={
                                                                    editingEpic.summary ??
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingEpic(
                                                                        {
                                                                            ...editingEpic,
                                                                            summary:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'epic.summary',
                                                                )}
                                                            />
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        editingEpic.start_date ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingEpic(
                                                                            {
                                                                                ...editingEpic,
                                                                                start_date:
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                    null,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        editingEpic.due_date ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingEpic(
                                                                            {
                                                                                ...editingEpic,
                                                                                due_date:
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                    null,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={
                                                                        handleUpdateEpic
                                                                    }
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setEditingEpic(
                                                                            null,
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-start gap-3">
                                                            <span
                                                                className="mt-1.5 size-3 shrink-0 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        epic.color ??
                                                                        '#64748b',
                                                                }}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="text-sm font-medium">
                                                                        {
                                                                            epic.name
                                                                        }
                                                                    </h3>
                                                                    <Badge variant="outline">
                                                                        {
                                                                            epic.status
                                                                        }
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {
                                                                            epic.tasks_count
                                                                        }{' '}
                                                                        tasks
                                                                    </span>
                                                                </div>
                                                                {epic.summary && (
                                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                                        {
                                                                            epic.summary
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Link
                                                                href={epicShow({
                                                                    workspace:
                                                                        workspace.slug,
                                                                    project:
                                                                        project.slug,
                                                                    epic: epic.id,
                                                                })}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingEpic(
                                                                        epic,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteEpic(
                                                                        epic.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {epics.length === 0 && (
                                            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.no_epics_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sprints">
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {t('settings.sprints')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={sprintStore.url({
                                            workspace: workspace.slug,
                                            project: project.slug,
                                        })}
                                        method="post"
                                        className="grid gap-3"
                                        resetOnSuccess
                                    >
                                        {({ errors, processing }) => (
                                            <>
                                                <div className="flex flex-col gap-2">
                                                    <Label htmlFor="sprint-name">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="sprint-name"
                                                        name="name"
                                                        placeholder={t(
                                                            'sprint.sprint_name',
                                                        )}
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
                                                    <Label htmlFor="sprint-goal">
                                                        Goal
                                                    </Label>
                                                    <Input
                                                        id="sprint-goal"
                                                        name="goal"
                                                        placeholder={t(
                                                            'sprint.sprint_goal',
                                                        )}
                                                    />
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="sprint-status">
                                                            Status
                                                        </Label>
                                                        <Select
                                                            name="status"
                                                            defaultValue="planned"
                                                        >
                                                            <SelectTrigger id="sprint-status">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="planned">
                                                                    Planned
                                                                </SelectItem>
                                                                <SelectItem value="active">
                                                                    Active
                                                                </SelectItem>
                                                                <SelectItem value="completed">
                                                                    Completed
                                                                </SelectItem>
                                                                <SelectItem value="cancelled">
                                                                    Cancelled
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="sprint-start-date">
                                                            Start
                                                        </Label>
                                                        <Input
                                                            id="sprint-start-date"
                                                            name="start_date"
                                                            type="date"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <Label htmlFor="sprint-end-date">
                                                            End
                                                        </Label>
                                                        <Input
                                                            id="sprint-end-date"
                                                            name="end_date"
                                                            type="date"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="w-fit"
                                                >
                                                    <Plus className="size-4" />
                                                    <span>
                                                        {t(
                                                            'project_settings.add_sprint',
                                                        )}
                                                    </span>
                                                </Button>
                                            </>
                                        )}
                                    </Form>

                                    <Separator />

                                    <div className="flex flex-col">
                                        {sprints.map((sprint) => {
                                            const isEditing =
                                                editingSprint?.id === sprint.id;

                                            return (
                                                <div
                                                    key={sprint.id}
                                                    className="flex flex-col gap-3 border-b py-4 last:border-0"
                                                >
                                                    {isEditing ? (
                                                        <>
                                                            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                                                                <Input
                                                                    value={
                                                                        editingSprint.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingSprint(
                                                                            {
                                                                                ...editingSprint,
                                                                                name: e
                                                                                    .target
                                                                                    .value,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                                <Select
                                                                    value={
                                                                        editingSprint.status
                                                                    }
                                                                    onValueChange={(
                                                                        status,
                                                                    ) =>
                                                                        setEditingSprint(
                                                                            {
                                                                                ...editingSprint,
                                                                                status,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="planned">
                                                                            Planned
                                                                        </SelectItem>
                                                                        <SelectItem value="active">
                                                                            Active
                                                                        </SelectItem>
                                                                        <SelectItem value="completed">
                                                                            Completed
                                                                        </SelectItem>
                                                                        <SelectItem value="cancelled">
                                                                            Cancelled
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <Input
                                                                value={
                                                                    editingSprint.goal ??
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    setEditingSprint(
                                                                        {
                                                                            ...editingSprint,
                                                                            goal: e
                                                                                .target
                                                                                .value,
                                                                        },
                                                                    )
                                                                }
                                                                placeholder={t(
                                                                    'sprint.goal',
                                                                )}
                                                            />
                                                            <div className="grid gap-3 sm:grid-cols-2">
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        editingSprint.start_date ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingSprint(
                                                                            {
                                                                                ...editingSprint,
                                                                                start_date:
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                    null,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        editingSprint.end_date ??
                                                                        ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        setEditingSprint(
                                                                            {
                                                                                ...editingSprint,
                                                                                end_date:
                                                                                    e
                                                                                        .target
                                                                                        .value ||
                                                                                    null,
                                                                            },
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    onClick={
                                                                        handleUpdateSprint
                                                                    }
                                                                >
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        setEditingSprint(
                                                                            null,
                                                                        )
                                                                    }
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-start gap-3">
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="text-sm font-medium">
                                                                        {
                                                                            sprint.name
                                                                        }
                                                                    </h3>
                                                                    <Badge variant="secondary">
                                                                        {
                                                                            sprint.status
                                                                        }
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {
                                                                            sprint.tasks_count
                                                                        }{' '}
                                                                        tasks
                                                                    </span>
                                                                </div>
                                                                {sprint.goal && (
                                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                                        {
                                                                            sprint.goal
                                                                        }
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <Link
                                                                href={sprintShow(
                                                                    {
                                                                        workspace:
                                                                            workspace.slug,
                                                                        project:
                                                                            project.slug,
                                                                        sprint: sprint.id,
                                                                    },
                                                                )}
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                >
                                                                    View
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    setEditingSprint(
                                                                        sprint,
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                                onClick={() =>
                                                                    handleDeleteSprint(
                                                                        sprint.id,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {sprints.length === 0 && (
                                            <p className="rounded-lg border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.no_sprints_yet',
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="github">
                            <GithubSettingsTab
                                workspaceSlug={workspace.slug}
                                projectSlug={project.slug}
                                integration={integration}
                            />
                        </TabsContent>

                        <TabsContent value="notifications">
                            <NotificationRulesTab
                                workspace={workspace}
                                project={project}
                                rules={notificationRules}
                            />
                        </TabsContent>

                        <TabsContent value="danger">
                            <Card className="border-destructive/30 bg-card">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-destructive">
                                        <AlertTriangle className="size-5" />
                                        Danger zone
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {!isArchived ? (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.archive_description',
                                                )}
                                            </p>
                                            {canDelete && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeleteConfirmOpen(
                                                            true,
                                                        )
                                                    }
                                                >
                                                    {t(
                                                        'project_settings.archive_project',
                                                    )}
                                                </Button>
                                            )}
                                            {deleteConfirmOpen && (
                                                <div className="flex items-center gap-2">
                                                    <form
                                                        action={projectDestroy.url(
                                                            {
                                                                workspace:
                                                                    workspace.slug,
                                                                project:
                                                                    project.slug,
                                                            },
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
                                                                'project_settings.confirm_archive',
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
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                {t(
                                                    'project_settings.restore_description',
                                                )}
                                            </p>
                                            <form
                                                action={projectRestore.url({
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                })}
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
                                                <Button type="submit">
                                                    {t(
                                                        'project_settings.restore_project',
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
