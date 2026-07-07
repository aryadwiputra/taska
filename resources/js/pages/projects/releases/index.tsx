'use no memo';

import { Head, Link } from '@inertiajs/react';
import { CalendarDays, Plus, Rocket, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';
import {
    index as releaseIndex,
    store as releaseStore,
    destroy as releaseDestroy,
    show as releaseShow,
    update as releaseUpdate,
} from '@/routes/projects/releases';

interface ReleaseData {
    id: number;
    name: string;
    description: string | null;
    release_date: string | null;
    status: string;
    tasks_count: number;
    completed_tasks_count: number;
    creator: { id: number; name: string } | null;
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
    color: string | null;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    releases: ReleaseData[];
}

const statusColor: Record<string, string> = {
    draft: 'border-blue-400 text-blue-400 dark:text-blue-300',
    scheduled: 'border-amber-400 text-amber-400 dark:text-amber-300',
    released: 'border-emerald-400 text-emerald-400 dark:text-emerald-300',
};

export default function ReleasesIndex({
    workspace,
    project,
    releases: initialReleases,
}: Props) {
    const { t } = useTranslation();
    const [releases, setReleases] = useState(initialReleases);
    const [createOpen, setCreateOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState('');
    const [creating, setCreating] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const fetchReleases = useCallback(() => {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        fetch(
            releaseIndex.url({
                workspace: workspace.slug,
                project: project.slug,
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            },
        )
            .then((r) => r.json())
            .then((data) => {
                setReleases(data.releases ?? []);
            })
            .catch((e) => {
                console.error('Failed to fetch releases:', e);
            });

        return () => controller.abort();
    }, [workspace.slug, project.slug]);

    useEffect(() => {
        const cleanup = fetchReleases();

        return cleanup;
    }, [fetchReleases]);

    const handleCreate = () => {
        if (!newName.trim()) {
            return;
        }

        setCreating(true);

        fetch(
            releaseStore.url({
                workspace: workspace.slug,
                project: project.slug,
            }),
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement | null
                        )?.content ?? '',
                },
                body: JSON.stringify({
                    name: newName.trim(),
                    description: newDescription.trim() || null,
                    release_date: newDate || null,
                }),
            },
        )
            .then((r) => r.json())
            .then((data) => {
                setReleases((prev) => [
                    {
                        ...data,
                        tasks_count: 0,
                        completed_tasks_count: 0,
                        creator: null,
                        created_at: new Date().toISOString(),
                    },
                    ...prev,
                ]);
                setCreateOpen(false);
                setNewName('');
                setNewDescription('');
                setNewDate('');
                setCreating(false);
            })
            .catch((e) => {
                console.error('Failed to create release:', e);
                setCreating(false);
            });
    };

    const handleDelete = (releaseId: number) => {
        if (!confirm(t('release.delete_release'))) {
            return;
        }

        fetch(
            releaseDestroy.url({
                workspace: workspace.slug,
                project: project.slug,
                release: releaseId,
            }),
            {
                method: 'DELETE',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement | null
                        )?.content ?? '',
                },
            },
        ).then(() => {
            setReleases((prev) => prev.filter((r) => r.id !== releaseId));
        });
    };

    const handleMarkReleased = (releaseId: number) => {
        fetch(
            releaseUpdate.url({
                workspace: workspace.slug,
                project: project.slug,
                release: releaseId,
            }),
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement | null
                        )?.content ?? '',
                },
                body: JSON.stringify({ status: 'released' }),
            },
        ).then(() => {
            setReleases((prev) =>
                prev.map((r) =>
                    r.id === releaseId
                        ? {
                              ...r,
                              status: 'released',
                              release_date:
                                  r.release_date ??
                                  new Date().toISOString().slice(0, 10),
                          }
                        : r,
                ),
            );
        });
    };

    return (
        <>
            <Head title={`${t('release.title')} — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('release.title')}
                    description={`${releases.length} release${releases.length !== 1 ? 's' : ''}`}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                    actions={
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                            <Plus className="mr-1.5 size-3.5" />
                            {t('release.new_release')}
                        </Button>
                    }
                />

                <div className="mx-auto w-full max-w-7xl">
                    {releases.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {releases.map((release) => {
                                const percent =
                                    release.tasks_count === 0
                                        ? 0
                                        : Math.round(
                                              (release.completed_tasks_count /
                                                  release.tasks_count) *
                                                  100,
                                          );

                                return (
                                    <Card key={release.id}>
                                        <CardContent className="flex items-center gap-4 py-4">
                                            <div className="flex flex-1 flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={releaseShow.url({
                                                            workspace:
                                                                workspace.slug,
                                                            project:
                                                                project.slug,
                                                            release: release.id,
                                                        })}
                                                        className="font-medium hover:underline"
                                                    >
                                                        {release.name}
                                                    </Link>
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            'text-[10px]',
                                                            statusColor[
                                                                release.status
                                                            ] ?? '',
                                                        )}
                                                    >
                                                        {release.status}
                                                    </Badge>
                                                </div>
                                                {release.description && (
                                                    <p className="line-clamp-1 text-sm text-muted-foreground">
                                                        {release.description}
                                                    </p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {release.release_date && (
                                                        <span className="flex items-center gap-1">
                                                            <CalendarDays className="size-3" />
                                                            {formatDate(
                                                                release.release_date,
                                                            )}
                                                        </span>
                                                    )}
                                                    <span>
                                                        {
                                                            release.completed_tasks_count
                                                        }
                                                        /{release.tasks_count}{' '}
                                                        {t('release.tasks')}
                                                    </span>
                                                </div>
                                                {release.tasks_count > 0 && (
                                                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all"
                                                            style={{
                                                                width: `${percent}%`,
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex shrink-0 gap-1">
                                                {release.status !==
                                                    'released' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            handleMarkReleased(
                                                                release.id,
                                                            )
                                                        }
                                                        title={t(
                                                            'release.released',
                                                        )}
                                                    >
                                                        <Rocket className="size-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDelete(release.id)
                                                    }
                                                    title={t('common.delete')}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Rocket}
                            title={t('release.no_releases')}
                            description={t('release.create_first')}
                            action={
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    <Plus className="mr-1.5 size-3.5" />
                                    {t('release.new_release')}
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('release.create_release')}</DialogTitle>
                        <DialogDescription>
                            {t('release.create_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="release-name">
                                {t('release.name')}
                            </Label>
                            <Input
                                id="release-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={t('release.name_placeholder')}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="release-desc">
                                {t('release.description')}{' '}
                                <span className="text-muted-foreground">
                                    ({t('common.optional')})
                                </span>
                            </Label>
                            <textarea
                                id="release-desc"
                                value={newDescription}
                                onChange={(
                                    e: React.ChangeEvent<HTMLTextAreaElement>,
                                ) => setNewDescription(e.target.value)}
                                placeholder={t(
                                    'release.description_placeholder',
                                )}
                                rows={3}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="release-date">
                                {t('release.target_date')}{' '}
                                <span className="text-muted-foreground">
                                    ({t('common.optional')})
                                </span>
                            </Label>
                            <Input
                                id="release-date"
                                type="date"
                                value={newDate}
                                onChange={(e) => setNewDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setCreateOpen(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={!newName.trim() || creating}
                        >
                            {t('common.create')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function formatDate(date: string | null): string {
    if (!date) {
        return '—';
    }

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}
