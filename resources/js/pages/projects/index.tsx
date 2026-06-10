import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FolderKanban, Plus, Users } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
    deleted_at: string | null;
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

export default function ProjectsIndex({ workspace, projects }: Props) {
    const activeProjects = projects.filter((p) => !p.deleted_at);
    const hasProjects = projects.length > 0;

    return (
        <>
            <Head title={`${workspace.name} — Projects`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/workspaces"
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
                            Projects in this workspace.
                        </p>
                    </div>
                    <Link
                        href={`/workspaces/${workspace.slug}/projects/create`}
                        className={cn(
                            buttonVariants(),
                            'flex items-center gap-2',
                        )}
                    >
                        <Plus className="size-4" />
                        <span>New project</span>
                    </Link>
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
                            href={`/workspaces/${workspace.slug}/projects/create`}
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
                                href={`/workspaces/${workspace.slug}/projects/${project.slug}`}
                                className="block"
                            >
                                <Card className="transition-shadow hover:shadow-md">
                                    <CardContent className="flex flex-col gap-3 pt-6">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className="flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                                                style={{
                                                    backgroundColor:
                                                        project.color ??
                                                        '#64748B',
                                                }}
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
