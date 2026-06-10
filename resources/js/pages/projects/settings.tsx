import { Form, Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Bell,
    Check,
    Globe,
    LayoutGrid,
    Plus,
    Trash2,
    UserPlus,
    X,
} from 'lucide-react';
import { useState } from 'react';
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

interface BoardOption {
    id: number;
    name: string;
    columns: Array<{ id: number; name: string }>;
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
}: Props) {
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [editingLabel, setEditingLabel] = useState<ProjectLabel | null>(null);
    const [editingEpic, setEditingEpic] = useState<ProjectEpic | null>(null);
    const [editingSprint, setEditingSprint] = useState<ProjectSprint | null>(
        null,
    );
    const isArchived = !!project.deleted_at;

    const handleRoleChange = (memberId: number, newRole: string) => {
        router.put(
            `/workspaces/${workspace.slug}/projects/${project.slug}/members/${memberId}`,
            { role: newRole },
            { preserveScroll: true },
        );
    };

    const handleRemoveMember = (memberId: number) => {
        if (!confirm('Remove this member from the project?')) {
            return;
        }

        router.delete(
            `/workspaces/${workspace.slug}/projects/${project.slug}/members/${memberId}`,
            { preserveScroll: true },
        );
    };

    const handleUpdateLabel = () => {
        if (!editingLabel) {
            return;
        }

        router.put(
            `/workspaces/${workspace.slug}/projects/${project.slug}/labels/${editingLabel.id}`,
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
        if (!confirm('Delete this label? It will be removed from all tasks.')) {
            return;
        }

        router.delete(
            `/workspaces/${workspace.slug}/projects/${project.slug}/labels/${labelId}`,
            { preserveScroll: true },
        );
    };

    const handleUpdateEpic = () => {
        if (!editingEpic) {
            return;
        }

        router.put(
            `/workspaces/${workspace.slug}/projects/${project.slug}/epics/${editingEpic.id}`,
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
        if (!confirm('Delete this epic? It will be removed from all tasks.')) {
            return;
        }

        router.delete(
            `/workspaces/${workspace.slug}/projects/${project.slug}/epics/${epicId}`,
            { preserveScroll: true },
        );
    };

    const handleUpdateSprint = () => {
        if (!editingSprint) {
            return;
        }

        router.put(
            `/workspaces/${workspace.slug}/projects/${project.slug}/sprints/${editingSprint.id}`,
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
        if (
            !confirm('Delete this sprint? It will be removed from all tasks.')
        ) {
            return;
        }

        router.delete(
            `/workspaces/${workspace.slug}/projects/${project.slug}/sprints/${sprintId}`,
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title={`${project.name} — Settings`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href={`/workspaces/${workspace.slug}/projects/${project.slug}`}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <Separator orientation="vertical" className="h-4" />
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Settings
                    </h1>
                </div>

                <div className="mx-auto w-full max-w-2xl">
                    <Tabs defaultValue="general">
                        <TabsList className="mb-6">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                            <TabsTrigger value="members">Members</TabsTrigger>
                            <TabsTrigger value="labels">Labels</TabsTrigger>
                            <TabsTrigger value="epics">Epics</TabsTrigger>
                            <TabsTrigger value="sprints">Sprints</TabsTrigger>
                            <TabsTrigger value="danger">
                                Danger zone
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <Card>
                                <CardHeader>
                                    <CardTitle>General settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}`}
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
                                                        Project name
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
                                                        Settings saved.
                                                    </p>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    {processing
                                                        ? 'Saving...'
                                                        : 'Save changes'}
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
                                    <CardTitle>Project settings</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Form
                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}/settings`}
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
                                                        htmlFor="default_board_id"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <LayoutGrid className="size-4" />
                                                        Default board
                                                    </Label>
                                                    <Select
                                                        name="default_board_id"
                                                        defaultValue={
                                                            (settings.default_board_id as string) ??
                                                            String(
                                                                boards[0]
                                                                    ?.id ?? '',
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
                                                        Default assignee
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
                                                                No default
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
                                                            Auto-assign task
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
                                                        Settings saved.
                                                    </p>
                                                )}

                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="w-fit"
                                                >
                                                    {processing
                                                        ? 'Saving...'
                                                        : 'Save changes'}
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
                                    <CardTitle>Members</CardTitle>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAddMemberOpen(true)}
                                    >
                                        <Plus className="size-3.5" />
                                        <span>Add member</span>
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
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No members yet.
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
                                    <CardTitle>Labels</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}/labels`}
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
                                                        <span>Add label</span>
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
                                                                href={`/workspaces/${workspace.slug}/projects/${project.slug}/labels/${label.id}`}
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
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No labels yet.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="epics">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Epics</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}/epics`}
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
                                                            placeholder="Launch checklist"
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
                                                        placeholder="Describe the initiative"
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
                                                    <span>Add epic</span>
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
                                                                placeholder="Summary"
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
                                                                href={`/workspaces/${workspace.slug}/projects/${project.slug}/epics/${epic.id}`}
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
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No epics yet.
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="sprints">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Sprints</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-6">
                                    <Form
                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}/sprints`}
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
                                                        placeholder="Sprint 1"
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
                                                        placeholder="What should this sprint achieve?"
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
                                                    <span>Add sprint</span>
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
                                                                placeholder="Goal"
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
                                                                href={`/workspaces/${workspace.slug}/projects/${project.slug}/sprints/${sprint.id}`}
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
                                            <p className="py-8 text-center text-sm text-muted-foreground">
                                                No sprints yet.
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
                                        Danger zone
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-4">
                                    {!isArchived ? (
                                        <>
                                            <p className="text-sm text-muted-foreground">
                                                Archiving this project will hide
                                                it from the project list. You
                                                can restore it at any time.
                                            </p>
                                            <Button
                                                variant="destructive"
                                                onClick={() =>
                                                    setDeleteConfirmOpen(true)
                                                }
                                            >
                                                Archive project
                                            </Button>
                                            {deleteConfirmOpen && (
                                                <div className="flex items-center gap-2">
                                                    <form
                                                        action={`/workspaces/${workspace.slug}/projects/${project.slug}`}
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
                                                            Confirm archive
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
                                                This project is currently
                                                archived. Restore it to make it
                                                active again.
                                            </p>
                                            <form
                                                action={`/workspaces/${workspace.slug}/projects/${project.slug}/restore`}
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
                                                    Restore project
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
