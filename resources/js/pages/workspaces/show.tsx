import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FolderKanban, Plus, Settings, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    create as projectCreate,
    show as projectShow,
} from '@/routes/projects';
import {
    index as workspacesIndex,
    settings as workspaceSettings,
} from '@/routes/workspaces';

interface ProjectItem {
    id: number;
    name: string;
    key: string;
    slug: string;
    description: string | null;
    color: string | null;
    visibility: string;
    status: string;
    tasks_count: number;
    members_count: number;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface Props {
    workspace: Workspace;
    projects: ProjectItem[];
}

export default function WorkspaceShow({ workspace, projects }: Props) {
    const activeProjects = projects.filter((p) => p.status !== 'archived');
    const hasProjects = projects.length > 0;

    return (
        <>
            <Head title={`${workspace.name} — Projects`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={workspacesIndex()}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Workspaces</span>
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {workspace.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {hasProjects
                                ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                                : 'No projects yet'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={workspaceSettings({
                                workspace: workspace.slug,
                            })}
                            className={cn(
                                buttonVariants({ variant: 'outline' }),
                                'flex items-center gap-2',
                            )}
                        >
                            <Settings className="size-4" />
                            <span className="hidden sm:inline">Settings</span>
                        </Link>
                        <Link
                            href={projectCreate({ workspace: workspace.slug })}
                            className={cn(
                                buttonVariants(),
                                'flex items-center gap-2',
                            )}
                        >
                            <Plus className="size-4" />
                            <span>New project</span>
                        </Link>
                    </div>
                </div>

                {!hasProjects && (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border py-16">
                        <FolderKanban className="size-12 text-muted-foreground/40" />
                        <div className="text-center">
                            <p className="text-lg font-medium">
                                No projects yet
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Create your first project to start tracking
                                tasks.
                            </p>
                        </div>
                        <Link
                            href={projectCreate({ workspace: workspace.slug })}
                            className={cn(
                                buttonVariants(),
                                'flex items-center gap-2',
                            )}
                        >
                            <Plus className="size-4" />
                            <span>Create project</span>
                        </Link>
                    </div>
                )}

                {activeProjects.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeProjects.map((project) => (
                            <Link
                                key={project.id}
                                href={projectShow({
                                    workspace: workspace.slug,
                                    project: project.slug,
                                })}
                                className="block"
                            >
                                <Card className="transition-shadow hover:shadow-md">
                                    <CardContent className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${project.color ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                                                style={
                                                    project.color
                                                        ? {
                                                              backgroundColor:
                                                                  project.color,
                                                          }
                                                        : undefined
                                                }
                                            >
                                                {project.key
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="truncate font-semibold">
                                                    {project.name}
                                                </span>
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {project.key}
                                                </span>
                                            </div>
                                        </div>
                                        {project.description && (
                                            <p className="line-clamp-2 text-sm text-muted-foreground">
                                                {project.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <FolderKanban className="size-3" />
                                                {project.tasks_count}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users className="size-3" />
                                                {project.members_count}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
