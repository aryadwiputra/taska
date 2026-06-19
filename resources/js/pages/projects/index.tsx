import { Head, Link } from '@inertiajs/react';
import { FolderKanban, Plus, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    create as projectCreate,
    show as projectShow,
} from '@/routes/projects';
import { index as workspacesIndex } from '@/routes/workspaces';

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
    const { t } = useTranslation();
    const activeProjects = projects.filter((p) => !p.deleted_at);
    const hasProjects = projects.length > 0;

    return (
        <>
            <Head title={`${workspace.name} — ${t('sidebar.projects')}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={workspace.name}
                    description={t('project.projects_in_workspace')}
                    backHref={workspacesIndex()}
                    backLabel={t('project.workspaces')}
                    actions={
                        <Link
                            href={projectCreate({ workspace: workspace.slug })}
                            className={cn(
                                buttonVariants(),
                                'flex items-center gap-2',
                            )}
                        >
                            <Plus className="size-4" />
                            <span>{t('sidebar.new_project')}</span>
                        </Link>
                    }
                />

                {!hasProjects && (
                    <EmptyState
                        icon={FolderKanban}
                        title={t('project.no_projects')}
                        description={t('project.create_first')}
                        action={
                            <Link
                                href={projectCreate({
                                    workspace: workspace.slug,
                                })}
                                className={cn(
                                    buttonVariants(),
                                    'flex items-center gap-2',
                                )}
                            >
                                <Plus className="size-4" />
                                <span>{t('project.create_project')}</span>
                            </Link>
                        }
                    />
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
                                <Card className="transition-shadow hover:shadow-soft">
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
