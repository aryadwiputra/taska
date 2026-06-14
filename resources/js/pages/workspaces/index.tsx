import { Head, Link } from '@inertiajs/react';
import { Archive, FolderKanban, Plus, Users } from 'lucide-react';
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
    const activeWorkspaces = workspaces.filter((w) => !w.deleted_at);
    const archivedWorkspaces = workspaces.filter((w) => w.deleted_at);

    return (
        <>
            <Head title="Workspaces" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Workspaces
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your workspaces and teams.
                        </p>
                    </div>
                    <Link
                        href={workspaceCreate()}
                        className={cn(
                            buttonVariants(),
                            'flex items-center gap-2',
                        )}
                    >
                        <Plus className="size-4" />
                        <span>New workspace</span>
                    </Link>
                </div>

                {workspaces.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-16">
                        <FolderKanban className="size-12 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-lg font-medium">
                                No workspaces yet
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Create your first workspace to start managing
                                projects and tasks.
                            </p>
                        </div>
                        <Link
                            href={workspaceCreate()}
                            className={cn(
                                buttonVariants(),
                                'flex items-center gap-2',
                            )}
                        >
                            <Plus className="size-4" />
                            <span>Create workspace</span>
                        </Link>
                    </div>
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
                                <Card className="transition-shadow hover:shadow-md">
                                    <CardContent className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-start gap-3">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
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
                                Archived
                            </h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {archivedWorkspaces.map((workspace) => (
                                <Card key={workspace.id} className="opacity-60">
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
                                                        Archived
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
                                                Restore
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
                                    ? 'Hide archived'
                                    : 'Show archived'}
                            </Link>
                        </div>
                    )}
            </div>
        </>
    );
}
