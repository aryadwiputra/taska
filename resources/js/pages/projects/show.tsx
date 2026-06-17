import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    BarChart3,
    CalendarDays,
    FileText,
    Flag,
    GanttChart,
    LayoutGrid,
    LayoutList,
    Paperclip,
    Puzzle,
    Rocket,
    Settings,
    Tag,
    Users,
    Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    board as projectBoard,
    index as projectsIndex,
    settings as projectSettings,
} from '@/routes/projects';
import { index as activityIndex } from '@/routes/projects/activity';
import { index as backlogIndex } from '@/routes/projects/backlog';
import { index as componentIndex } from '@/routes/projects/components';
import { index as releaseIndex } from '@/routes/projects/releases';
import { index as workloadIndex } from '@/routes/projects/workload';

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        description: string | null;
        color: string | null;
        visibility: string;
        status: string;
    };
    counts: {
        tasks: number;
        epics: number;
        sprints: number;
        labels: number;
        members: number;
        components: number;
        releases: number;
        automation_rules: number;
        attachments: number;
    };
    columnsCount: number;
}

export default function ProjectShow({
    workspace,
    project,
    counts,
    columnsCount,
}: Props) {
    const ws = workspace.slug;
    const pr = project.slug;

    const cards = [
        {
            icon: LayoutGrid,
            name: 'Board',
            href: projectBoard({ workspace: ws, project: pr }),
            statLabel: 'columns',
            statCount: columnsCount,
        },
        {
            icon: FileText,
            name: 'List',
            href: `/workspaces/${ws}/projects/${pr}/list`,
            statLabel: 'tasks',
            statCount: counts.tasks,
        },
        {
            icon: Flag,
            name: 'Epics',
            href: `/workspaces/${ws}/projects/${pr}/epics`,
            statLabel: 'epics',
            statCount: counts.epics,
        },
        {
            icon: CalendarDays,
            name: 'Sprints',
            href: `/workspaces/${ws}/projects/${pr}/sprints`,
            statLabel: 'sprints',
            statCount: counts.sprints,
        },
        {
            icon: LayoutList,
            name: 'Backlog',
            href: backlogIndex({ workspace: ws, project: pr }),
            statLabel: 'tasks',
            statCount: counts.tasks,
        },
        {
            icon: Rocket,
            name: 'Releases',
            href: releaseIndex({ workspace: ws, project: pr }),
            statLabel: 'releases',
            statCount: counts.releases,
        },
        {
            icon: Tag,
            name: 'Labels',
            href: `/workspaces/${ws}/projects/${pr}/labels`,
            statLabel: 'labels',
            statCount: counts.labels,
        },
        {
            icon: Puzzle,
            name: 'Components',
            href: componentIndex({ workspace: ws, project: pr }),
            statLabel: 'components',
            statCount: counts.components,
        },
        {
            icon: GanttChart,
            name: 'Timeline',
            href: `/workspaces/${ws}/projects/${pr}/timeline`,
            statLabel: 'tasks with dates',
            statCount: counts.tasks,
        },
        {
            icon: Users,
            name: 'Workload',
            href: workloadIndex({ workspace: ws, project: pr }),
            statLabel: 'members',
            statCount: counts.members,
        },
        {
            icon: Paperclip,
            name: 'Files',
            href: `/workspaces/${ws}/projects/${pr}/files`,
            statLabel: 'files',
            statCount: counts.attachments,
        },
        {
            icon: BarChart3,
            name: 'Reports',
            href: `/workspaces/${ws}/projects/${pr}/reports`,
            statLabel: 'analytics',
            statCount: null,
        },
        {
            icon: Activity,
            name: 'Activity',
            href: activityIndex({ workspace: ws, project: pr }),
            statLabel: 'activity log',
            statCount: null,
        },
        {
            icon: Zap,
            name: 'Automation',
            href: `/workspaces/${ws}/projects/${pr}/automation`,
            statLabel: 'rules',
            statCount: counts.automation_rules,
        },
    ];

    return (
        <>
            <Head title={`${project.name} — ${workspace.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectsIndex({ workspace: ws })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Projects</span>
                    </Link>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                            <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${project.color ? 'text-white' : 'bg-muted text-muted-foreground'}`}
                                style={
                                    project.color
                                        ? { backgroundColor: project.color }
                                        : undefined
                                }
                            >
                                {project.key.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    {project.name}
                                </h1>
                                <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="font-mono text-xs"
                                    >
                                        {project.key}
                                    </Badge>
                                    {project.visibility === 'private' && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            Private
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                        {project.description && (
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                {project.description}
                            </p>
                        )}
                    </div>
                    <Link
                        href={projectSettings({
                            workspace: ws,
                            project: pr,
                        })}
                    >
                        <Button variant="outline" size="sm">
                            <Settings className="size-4" />
                            <span>Settings</span>
                        </Button>
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {cards.map((card) => (
                        <Link
                            key={card.name}
                            href={card.href}
                            className="block"
                        >
                            <Card className="transition-shadow hover:shadow-md">
                                <CardContent className="flex flex-col gap-3 pt-6">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                            <card.icon className="size-5" />
                                        </div>
                                        <div>
                                            <span className="font-semibold">
                                                {card.name}
                                            </span>
                                            <p className="text-sm text-muted-foreground">
                                                {card.statLabel}
                                                {card.statCount !== null &&
                                                    `: ${card.statCount}`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </>
    );
}
