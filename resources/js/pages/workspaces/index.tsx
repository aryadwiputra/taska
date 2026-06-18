import { Head, Link } from '@inertiajs/react';
import { Archive, FolderKanban, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    create as workspaceCreate,
    index as workspaceIndex,
    restore as workspaceRestore,
    show as workspaceShow,
} from '@/routes/workspaces';

interface Props {
    workspaces: Array<{
        id: number;
        name: string;
        slug: string;
        description: string | null;
        logo: string | null;
        status: string;
        members_count: number;
        deleted_at: string | null;
        created_at: string;
    }>;
    showArchived: boolean;
}

export default function WorkspacesIndex({ workspaces, showArchived }: Props) {
    const { t } = useTranslation();
    const activeWorkspaces = workspaces.filter((w) => !w.deleted_at);
    const archivedWorkspaces = workspaces.filter((w) => w.deleted_at);

    return (
        <>
            <Head title={t('admin.workspaces')} />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={t('admin.workspaces')}
                    description={t('workspace.manage_your_workspaces')}
                    actions={
                        <Link
                            href={workspaceCreate()}
                            className={cn(
                                buttonVariants(),
                                'flex items-center gap-2',
                            )}
                        >
                            <Plus className="size-4" />
                            <span>{t('workspace.new_workspace')}</span>
                        </Link>
                    }
                />

                {workspaces.length === 0 && (
                    <EmptyState
                        icon={FolderKanban}
                        title={t('workspace.no_workspaces_yet')}
                        description={t('workspace.create_first_workspace')}
                        action={
                            <Link
                                href={workspaceCreate()}
                                className={cn(
                                    buttonVariants(),
                                    'flex items-center gap-2',
                                )}
                            >
                                <Plus className="size-4" />
                                <span>{t('workspace.create_workspace')}</span>
                            </Link>
                        }
                    />
                )}

                {activeWorkspaces.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeWorkspaces.map((workspace) => (
                            <Link
                                key={workspace.id}
                                href={workspaceShow({
                                    workspace: workspace.slug,
                                })}
                                className="block"
                            >
                                <Card className="transition-shadow hover:shadow-soft">
                                    <CardContent className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-soft">
                                                {workspace.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate font-semibold">
                                                    {workspace.name}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {workspace.slug}
                                                </span>
                                            </div>
                                        </div>
                                        {workspace.description && (
                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                {workspace.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {workspace.members_count}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}

                {archivedWorkspaces.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <Archive className="size-4 text-muted-foreground" />
                            <h2 className="text-sm font-medium text-muted-foreground">
                                {t('admin.archived')}
                            </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {archivedWorkspaces.map((workspace) => (
                                <Card key={workspace.id} className="opacity-70">
                                    <CardContent className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                                                    {workspace.name
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <div className="flex min-w-0 flex-col gap-0.5">
                                                    <span className="truncate font-semibold">
                                                        {workspace.name}
                                                    </span>
                                                    <Badge
                                                        variant="secondary"
                                                        className="w-fit text-[10px]"
                                                    >
                                                        {t('admin.archived')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
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
                                                variant="outline"
                                                size="sm"
                                                className="w-full"
                                            >
                                                {t(
                                                    'workspace.restore_workspace',
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeWorkspaces.length > 0 &&
                    archivedWorkspaces.length === 0 && (
                        <div className="flex justify-center">
                            <Link
                                href={workspaceIndex({
                                    query: { archived: '1' },
                                })}
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                {showArchived
                                    ? t('workspace.hide_archived')
                                    : t('workspace.show_archived')}
                            </Link>
                        </div>
                    )}
            </div>
        </>
    );
}
