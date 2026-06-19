'use no memo';

import { Head, router } from '@inertiajs/react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
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
    destroy as destroyComponent,
    store as storeComponent,
    update as updateComponent,
} from '@/routes/projects/components';

interface Member {
    id: number;
    name: string;
    avatar: string | null;
}

interface ComponentData {
    id: number;
    name: string;
    description: string | null;
    tasks_count: number;
    lead: Member | null;
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
    components: ComponentData[];
    members: Member[];
}

export default function ComponentsIndex({
    workspace,
    project,
    components,
    members,
}: Props) {
    const { t } = useTranslation();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<ComponentData | null>(null);
    const [deleting, setDeleting] = useState<ComponentData | null>(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [leadId, setLeadId] = useState<string>('none');

    const openCreate = () => {
        setEditing(null);
        setName('');
        setDescription('');
        setLeadId('none');
        setDialogOpen(true);
    };

    const openEdit = (component: ComponentData) => {
        setEditing(component);
        setName(component.name);
        setDescription(component.description ?? '');
        setLeadId(String(component.lead?.id ?? 'none'));
        setDialogOpen(true);
    };

    const handleSubmit = () => {
        const data = {
            name,
            description: description || null,
            lead_id: leadId !== 'none' ? Number(leadId) : null,
        };

        if (editing) {
            router.put(
                updateComponent.url({
                    workspace: workspace.slug,
                    project: project.slug,
                    component: editing.id,
                }),
                data,
                { preserveScroll: true, onSuccess: () => setDialogOpen(false) },
            );
        } else {
            router.post(
                storeComponent.url({
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
            <Head title={`${t('component.title')} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="mx-auto w-full max-w-3xl">
                    <PageHeader
                        title={t('component.title')}
                        description="Categorize tasks by UI or backend components."
                        backHref={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        backLabel={project.name}
                        actions={
                            <Button size="sm" onClick={openCreate}>
                                <Plus className="size-3" />
                                {t('component.create_component')}
                            </Button>
                        }
                    />

                    {components.length > 0 ? (
                        <div className="flex flex-col rounded-md border">
                            {components.map((component) => (
                                <div
                                    key={component.id}
                                    className="group flex items-center justify-between gap-4 border-b px-4 py-3 last:border-0 hover:bg-muted/50"
                                >
                                    <div className="min-w-0">
                                        <button
                                            type="button"
                                            className="text-sm font-medium hover:underline"
                                            onClick={() => openEdit(component)}
                                        >
                                            {component.name}
                                        </button>
                                        {component.description && (
                                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                {component.description}
                                            </p>
                                        )}
                                        <div className="mt-1 flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                {component.tasks_count} task
                                                {component.tasks_count !== 1
                                                    ? 's'
                                                    : ''}
                                            </Badge>
                                            {component.lead && (
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users className="size-3" />
                                                    {component.lead.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden gap-1 group-hover:flex">
                                        <button
                                            type="button"
                                            className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            title="Delete component"
                                            onClick={() =>
                                                setDeleting(component)
                                            }
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Users}
                            title={t('component.no_components')}
                            description={t('component.create_first')}
                            action={
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="size-3" />
                                    {t('component.create_component')}
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
                                ? t('component.edit_component')
                                : t('component.create_component')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="component-name">
                                {t('component.name')}
                            </Label>
                            <Input
                                id="component-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Frontend, API, Auth"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="component-desc">
                                {t('component.description')}
                            </Label>
                            <Input
                                id="component-desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Optional description"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label>{t('component.lead')}</Label>
                            <Select value={leadId} onValueChange={setLeadId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Assign a lead..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No lead
                                    </SelectItem>
                                    {members.map((m) => (
                                        <SelectItem
                                            key={m.id}
                                            value={String(m.id)}
                                        >
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleSubmit} disabled={!name.trim()}>
                            {editing ? t('common.save') : t('common.create')}
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
                title="Delete component"
                description={
                    deleting
                        ? `Are you sure you want to delete "${deleting.name}"? Tasks will not be deleted, but they will be unlinked from this component.`
                        : ''
                }
                confirmText="Delete component"
                onConfirm={() => {
                    if (!deleting) {
                        return;
                    }

                    const id = deleting.id;
                    setDeleting(null);

                    router.delete(
                        destroyComponent.url({
                            workspace: workspace.slug,
                            project: project.slug,
                            component: id,
                        }),
                    );
                }}
            />
        </>
    );
}
