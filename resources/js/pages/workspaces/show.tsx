import { Head, Link } from '@inertiajs/react';
import {
    FolderKanban,
    GanttChart,
    LayoutGrid,
    Plus,
    Settings,
    Target,
    Users,
} from 'lucide-react';
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
import {
    index as workspacesIndex,
    settings as workspaceSettings,
} from '@/routes/workspaces';
import {
    timeline as crossProjectTimeline,
    board as crossProjectBoard,
} from '@/routes/workspaces/cross-project';

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
    const { t } = useTranslation();
    const activeProjects = projects.filter((p) => p.status !== 'archived');
    const hasProjects = projects.length > 0;

    return (
        <>
            <Head title={t('workspace.projects_title', { name: workspace.name })} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={workspace.name}
                    description={
                        hasProjects
                            ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                            : t('workspace.no_projects_yet')
                    }
                    backHref={workspacesIndex()}
                    backLabel={t('workspace.back_to_workspaces')}
                    actions={
                        <>
                            <Link
                                href={`/workspaces/${workspace.slug}/goals`}
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                    'flex items-center gap-2',
                                )}
                            >
                                <Target className="size-4" />
                                <span className="hidden sm:inline">
                                    {t('workspace.goals')}
                                </span>
                            </Link>
                            <Link
                                href={crossProjectTimeline({
                                    workspace: workspace.slug,
                                })}
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                    'flex items-center gap-2',
                                )}
                            >
                                <GanttChart className="size-4" />
                                <span className="hidden sm:inline">
                                    {t('workspace.timeline')}
                                </span>
                            </Link>
                            <Link
                                href={crossProjectBoard({
                                    workspace: workspace.slug,
                                })}
                                className={cn(
                                    buttonVariants({ variant: 'outline' }),
                                    'flex items-center gap-2',
                                )}
                            >
                                <LayoutGrid className="size-4" />
                                <span className="hidden sm:inline">
                                    {t('workspace.board')}
                                </span>
                            </Link>
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
                                <span className="hidden sm:inline">
                                    {t('workspace.settings')}
                                </span>
                            </Link>
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
                                <span>{t('workspace.new_project')}</span>
                            </Link>
                        </>
                    }
                />

                {!hasProjects && (
                    <EmptyState
                        icon={FolderKanban}
                        title={t('workspace.no_projects_yet')}
                        description={t('workspace.create_first_project')}
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
                                <span>{t('workspace.create_project')}</span>
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
