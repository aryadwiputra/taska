import { Head, WhenVisible } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock, FolderKanban } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
    ActiveProjectsWidget,
    ActiveProjectsWidgetSkeleton,
} from '@/components/dashboard/active-projects-widget';
import {
    AssignedTasksWidget,
    AssignedTasksWidgetSkeleton,
} from '@/components/dashboard/assigned-tasks-widget';
import { OverdueTasksWidget } from '@/components/dashboard/overdue-tasks-widget';
import {
    RecentActivityWidget,
    RecentActivityWidgetSkeleton,
} from '@/components/dashboard/recent-activity-widget';
import {
    UpcomingDeadlinesWidget,
    UpcomingDeadlinesWidgetSkeleton,
} from '@/components/dashboard/upcoming-deadlines-widget';
import { PageHeader } from '@/components/page-header';
import { SurfaceSection } from '@/components/surface-section';
import { Card, CardContent } from '@/components/ui/card';
import { dashboard } from '@/routes';
import type {
    DashboardActivity,
    DashboardDeadline,
    DashboardProject,
    DashboardStats,
    DashboardTask,
} from '@/types/dashboard';

interface Props {
    stats: DashboardStats;
    assignedTasks?: DashboardTask[];
    activeProjects?: DashboardProject[];
    upcomingDeadlines?: DashboardDeadline[];
    recentActivity?: DashboardActivity[];
}

function StatCard({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
}) {
    return (
        <Card>
            <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <p className="text-2xl font-bold tracking-[-0.02em]">
                        {value}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({
    stats,
    assignedTasks,
    activeProjects,
    upcomingDeadlines,
    recentActivity,
}: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 pb-8">
                <PageHeader
                    title="Dashboard"
                    description="Overview of your tasks and projects."
                />

                <SurfaceSection className="p-4 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            icon={CheckCircle2}
                            label={t('widget.assigned_to_you')}
                            value={stats.assigned}
                        />
                        <StatCard
                            icon={AlertTriangle}
                            label={t('widget.overdue')}
                            value={stats.overdue}
                        />
                        <StatCard
                            icon={FolderKanban}
                            label={t('widget.active_projects')}
                            value={stats.activeProjects}
                        />
                        <StatCard
                            icon={Clock}
                            label={t('widget.upcoming_deadlines')}
                            value={stats.upcomingDeadlines}
                        />
                    </div>
                </SurfaceSection>

                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <WhenVisible
                        data="assignedTasks"
                        fallback={<AssignedTasksWidgetSkeleton />}
                    >
                        <AssignedTasksWidget
                            tasks={assignedTasks ?? []}
                            total={stats.assigned}
                        />
                    </WhenVisible>
                    <OverdueTasksWidget count={stats.overdue} />
                    <WhenVisible
                        data="activeProjects"
                        fallback={<ActiveProjectsWidgetSkeleton />}
                    >
                        <ActiveProjectsWidget projects={activeProjects ?? []} />
                    </WhenVisible>
                    <WhenVisible
                        data="upcomingDeadlines"
                        fallback={<UpcomingDeadlinesWidgetSkeleton />}
                    >
                        <UpcomingDeadlinesWidget
                            deadlines={upcomingDeadlines ?? []}
                        />
                    </WhenVisible>
                </div>

                <WhenVisible
                    data="recentActivity"
                    fallback={<RecentActivityWidgetSkeleton />}
                >
                    <RecentActivityWidget activities={recentActivity ?? []} />
                </WhenVisible>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
